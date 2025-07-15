from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime
from jose import jwt, JWTError
from app.src.db.db import (
    engine,
    Base,
    get_db,
    get_collection_data,
    fetch_all_documents,
    fetch_selected_documents,
)
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.document import (
    UploadedDocument,
    AgentState,
    AgentStatus,
    RetriggerPayload,
)
from app.api.schemas.document import UploadedDocumentCreate  # defined above
from sqlalchemy.future import select
from app.api.utils.cache import delete_stream
from app.config.celery_app import celery_app
from fastapi import Query
from fastapi.responses import StreamingResponse
from app.src.utils.convert import to_json_stream, to_csv_stream, to_xml_stream
import os
import json
from bson import ObjectId

MONGO_URL = "mongodb://admin:password@localhost:27017"

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

document_router = APIRouter()


async def get_user_id_from_token(token: str = Header(...)):
    try:
        decode_token = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        print("decode_token : ", decode_token)
        user_id = decode_token["sub"]
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid JWT token")


@document_router.post("/create-document-details")
async def store_uploaded_document(
    payload: UploadedDocumentCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    # chat_id = str(uuid4())
    delete_stream(payload.chat_id)
    doc = UploadedDocument(
        chat_id=payload.chat_id,
        user_id=user_id,
        file_name=payload.file_name,
        file_path=payload.file_path,
        file_size_mb=payload.file_size_mb,
        collection=payload.collection,
        total_pages=payload.total_pages,
        created_at=datetime.utcnow(),
        processing_mode=payload.processing_mode.value,  # ✅ FIXED HERE
        priority=payload.priority,
        keywords=payload.keywords,
        output_format=payload.output_format.value,  # ✅ Also do this if `output_format` is an Enum
        description=payload.description,
        extract_fields=[field.dict() for field in payload.extract_fields],
        status=payload.status,
        error=payload.error,
        error_message=payload.error_message,
    )

    db.add(doc)
    await db.commit()  # ✅ First commit UploadedDocument
    await db.refresh(
        doc
    )  # optional: ensures we have the latest `chat_id` and other values

    # 2. Store AgentState
    agent_state = AgentState(
        chat_id=payload.chat_id,
        user_id=user_id,
        collection_name=payload.collection,
        struture=None,
        tables_names="[]",
        fields=[field.dict() for field in payload.extract_fields],
        keywords=payload.keywords or [],
        query=payload.description,
        answer=[],
        feeder=[],
        chunk_size=10,
        start_page=0,
        end_page=0,
        total_pages=int(payload.total_pages),
        no_iterate=0,
        error=False,
        error_message=None,
        next_step=None,
        split_pattern=None,
        document_chat_id=payload.chat_id,
        status=AgentStatus.firstdraft,
    )
    db.add(agent_state)

    await db.commit()
    result = celery_app.send_task(
        "tigger_formatter_agent",
        args=[payload.chat_id],
    )
    return {"chat_id": payload.chat_id, "message": "Document stored successfully"}


@document_router.post("/retrigger-document")
async def retrigger_document_processing(
    payload: RetriggerPayload,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    try:
        chat_id = payload.chat_id
        status = payload.status

        result = await db.execute(
            select(AgentState).where(
                AgentState.chat_id == chat_id,
                AgentState.user_id == user_id,
            )
        )
        doc = result.scalar_one_or_none()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # if doc.status not in ("fail", "pending"):
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Document status is '{doc.status}'. Only failed/pending documents can be retriggered.",
        #     )

        doc.status = status
        doc.error = False
        doc.error_message = None
        await db.commit()

        celery_app.send_task("tigger_formatter_agent", args=[chat_id])

        return {
            "message": f"Reprocessing triggered for chat_id: {chat_id}",
            "status": status,
        }
    except Exception as e:
        print("jobId : ", e)

        return {
            "message": f"Error : {e}",
            "status": status,
        }


@document_router.post("/paused-agent")
async def retrigger_document_processing(
    chat_id: str,
    status: AgentStatus,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    # Fetch the document by chat_id and user_id
    result = await db.execute(
        select(AgentState).where(
            AgentState.chat_id == chat_id,
            AgentState.user_id == user_id,
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != "fail" and doc.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Document status is '{doc.status}'. Only failed/pending documents can be retriggered.",
        )

    # Optionally: reset status before retrying
    doc.status = status
    doc.error = False
    doc.error_message = None
    await db.commit()

    # Trigger Celery task again

    return {
        "message": f"Reprocessing triggered for chat_id: {chat_id}",
        "status": status,
    }


@document_router.get("/get-document")
async def get_uploaded_documents(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.user_id == user_id)
    )
    documents = result.scalars().all()
    return documents


@document_router.get("/get-agent-state")
async def get_uploaded_documents(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    result = await db.execute(select(AgentState).where(AgentState.user_id == user_id))
    documents = result.scalars().all()
    return documents


@document_router.get("/get-document-by-id")
async def get_uploaded_documents(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.chat_id == chat_id)
    )
    documents = result.scalars().all()
    return documents


@document_router.get("/get-state-by-id")
async def get_uploaded_documents(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id_from_token),
):
    result = await db.execute(select(AgentState).where(AgentState.chat_id == chat_id))
    documents = result.scalars().all()
    return documents


@document_router.get("/get-generated-data")
async def get_generated_data(
    collection_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Depends(get_user_id_from_token),
):
    result = await get_collection_data(collection_name, page, limit)
    # documents = result.scalars().all()
    return result


@document_router.get("/get-total-record-data")
async def get_generated_data(
    collection_name: str,
    user_id: str = Depends(get_user_id_from_token),
):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["struct_llm"]
    collection = db[collection_name]

    total_docs = await collection.count_documents(
        {}
    )  # documents = result.scalars().all()
    return {"total_docs": total_docs}


@document_router.get("/stream-generated-data")
async def stream_generated_data(
    collection_name: str,
    format: str = Query("json", enum=["json", "csv", "xml"]),
    page_size: int = 100,
    user_id: str = Depends(get_user_id_from_token),
):
    async def document_generator():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client["struct_llm"]
        collection = db[collection_name]

        total_docs = await collection.count_documents({})
        total_pages = (total_docs + page_size - 1) // page_size

        if format == "json":
            yield "["  # Start of JSON array
            first = True

            for page in range(total_pages):
                skip = page * page_size
                cursor = collection.find().skip(skip).limit(page_size)

                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    if not first:
                        yield ","
                    yield json.dumps(doc, ensure_ascii=False)
                    first = False

            yield "]"  # End of JSON array

        elif format == "csv":
            # collect headers once
            first_page = collection.find().limit(1)
            first_doc = await first_page.to_list(1)
            if not first_doc:
                return
            fieldnames = list(first_doc[0].keys())

            yield ",".join(fieldnames) + "\n"

            for page in range(total_pages):
                skip = page * page_size
                cursor = collection.find().skip(skip).limit(page_size)
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    row = [
                        json.dumps(doc.get(field, ""), ensure_ascii=False)
                        for field in fieldnames
                    ]
                    yield ",".join(row) + "\n"

        elif format == "xml":
            yield "<records>\n"
            for page in range(total_pages):
                skip = page * page_size
                cursor = collection.find().skip(skip).limit(page_size)
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    xml_entry = (
                        "<record>\n"
                        + "".join(f"<{k}>{str(v)}</{k}>\n" for k, v in doc.items())
                        + "</record>\n"
                    )
                    yield xml_entry
            yield "</records>"

    media_types = {
        "json": "application/json",
        "csv": "text/csv",
        "xml": "application/xml",
    }

    return StreamingResponse(document_generator(), media_type=media_types[format])


@document_router.get("/stream-selected-data")
async def stream_selected_data(
    collection_name: str,
    ids: List[str] = Query(..., description="List of document IDs to stream"),
    format: str = Query("json", enum=["json", "csv", "xml"]),
    user_id: str = Depends(get_user_id_from_token),
):

    async def document_generator():
        docs = fetch_selected_documents(collection_name, ids)

        if format == "json":
            yield "["
            first = True
            async for doc in docs:
                if not first:
                    yield ","
                yield json.dumps(doc)
                first = False
            yield "]"

        else:
            buffer = []
            async for doc in docs:
                buffer.append(doc)

            if format == "csv":
                for chunk in to_csv_stream(buffer):
                    yield chunk
            elif format == "xml":
                for chunk in to_xml_stream(buffer):
                    yield chunk

    media_types = {
        "json": "application/json",
        "csv": "text/csv",
        "xml": "application/xml",
    }

    return StreamingResponse(document_generator(), media_type=media_types[format])
