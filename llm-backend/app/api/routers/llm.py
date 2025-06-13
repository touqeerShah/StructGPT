from fastapi import (
    APIRouter,
    Request,
    HTTPException,
    Query as FastAPIQuery,
)

from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from app.src.agent.fromater import Fromater
from fastapi.responses import StreamingResponse

from app.src.agent.helper import AgentState, Struture
from app.api.utils.celery_helper import revoke_celery_task
import json
import hashlib
import time
import redis.asyncio as redis

import os
from typing import List, Dict, Any

from app.api.utils.cache import set_stop_flag, delete_stream

llm_router = APIRouter()


REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_ADDRESS = os.getenv(
    "REDIS_ADDRESS", "my-redis-master.stada-backend.svc.cluster.local"
)
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

redis_client = None
current_file_dir = os.path.dirname(os.path.abspath(__file__))
PPT_PATH = os.path.abspath(os.path.join("/root", "/data/ppt"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Redis URL without username (Bitnami Redis does not use ACLs by default)
if REDIS_PASSWORD:
    REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_ADDRESS}:{REDIS_PORT}/0"
    redis_client = redis.Redis(
        host=REDIS_ADDRESS,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        db=0,
        decode_responses=True,
    )

else:
    redis_client = redis.Redis(
        host=REDIS_ADDRESS, port=REDIS_PORT, db=0, decode_responses=True
    )


def generate_unique_hash(unique_string, hash_length=32):
    # Concatenate file names and user ID
    timestamp = str(time.time())
    unique_string = f"{unique_string}_{timestamp}"

    # Calculate SHA-256 hash
    sha256_hash = hashlib.sha256(unique_string.encode()).hexdigest()

    # Truncate hash to the desired length
    unique_hash = sha256_hash[:hash_length]

    return unique_hash


def validate_request(
    data: Dict[str, Any], required_fields: List[str], field_types: Dict[str, type]
):
    errors = []
    for field in required_fields:
        if field not in data or not isinstance(data[field], field_types[field]):
            errors.append(
                f"Invalid input: '{field}' is required and should be of type {field_types[field].__name__}"
            )
    return errors


@llm_router.post("/data_generation")
async def report_generater(
    request: Request,
):
    try:
        data = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON received.")
    required_fields = ["keywords", "query", "chat_id", "is_memory", "collections"]
    field_types = {
        "keywords": str,
        "query": list,
        "chat_id": str,
        "collection_name": str,
    }

    errors = validate_request(data, required_fields, field_types)
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    keywords = data.get("keywords", "")
    query = data.get("query", [])
    chat_id = data.get("chat_id", "")
    # chat_id = generate_unique_hash(chat_id + user_id):
    is_memory = data.get("is_memory", False)
    collections = data.get("collections", [])

    agent_state = AgentState(
        keywords=keywords,
        query=query,
        struture=Struture(class_name="", class_struture=""),
        answer=[],
        no_iterate=0,
        feeder="",
        limit=10,
        start_page=0,
        end_page=0,
        collection_names=collections,
        total_pages=-1,
        error=False,
        error_message="",
        chat_id=chat_id,
    )
    results = set_stop_flag(f"{chat_id}", False)
    fromater = Fromater(collections, "llama-pro:8b-instruct-q5_K_M")
    generator = fromater.generater(agent_state, chat_id)

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@llm_router.post("/kill_task")
async def kill_celery_task(request: Request):
    errors = []

    try:

        # ✅ Parse request JSON
        try:
            data = await request.json()
        except Exception as e:
            # errors.append("Request body must be valid JSON.")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Invalid JSON received.",
                    "errors": "Request body must be valid JSON",
                },
            )

        # ✅ Validate task_ids
        chat_id = data.get("chat_id")
        results = set_stop_flag(chat_id, True)

        results = revoke_celery_task(chat_id, [])

        return {
            "success": True,
            "message": "Kill task operation completed",
            "results": results,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}",
                "errors": ["An unexpected error occurred during task termination."],
            },
        )


@llm_router.get("/stream/{chat_id}")
async def stream_chat(chat_id: str, last_id: str = "0"):
    stream_key = f"stream:{chat_id}"
    delete_stream(chat_id)

    async def event_stream():
        nonlocal last_id
        while True:
            try:
                results = await redis_client.xread({stream_key: last_id}, block=15000)
                if results:
                    for _, items in results:
                        for message_id, data in items:
                            last_id = message_id
                            yield f"data: {json.dumps(data)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked",  # Optional but helps
            "Access-Control-Allow-Origin": "*",  # Or restricted domains
        },
    )
