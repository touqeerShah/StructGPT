
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form, Request
from fastapi.responses import JSONResponse
from typing import List
import hashlib
from io import BytesIO
import json
import re

# Import necessary modules and functions
from fastapi.responses import StreamingResponse
import asyncio
from app.config.celery_app import celery_app

from fastapi.responses import JSONResponse
from typing import List
import hashlib
from io import BytesIO
import json
import aiofiles
from uuid import uuid4
import os
from pydantic import BaseModel


from app.api.utils.cache import delete_stop_flag
import boto3
from app.api.utils.cache import delete_stream, delete_stop_flag,set_task_ids

collections_router = APIRouter()


# ALLOWED_EXTENSIONS = {"pdf"}
# MAX_FILE_SIZE_MB = 100  # Set the maximum file size to 100MB (in megabytes)
# MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes


def generate_unique_hash(file_names, user_id, hash_length=32):
    """Generate a unique hash based on the file names and user_id."""
    combined_data = "".join(file_names) + str(user_id)
    sha256_hash = hashlib.sha256(combined_data.encode()).hexdigest()
    unique_hash = sha256_hash[:hash_length]
    return unique_hash


collections_router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "xlsx", "xls", "pptx", "ppt"}
MAX_FILE_SIZE_MB = 100  # Set the maximum file size to 100MB (in megabytes)
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes


def sanitize_name(name: str) -> str:
    """Sanitize any file name."""
    return re.sub(r"\W+", "_", name).strip("_")


def allowed_file(filename: str):
    extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    print(f"Checking file extension: {extension}")
    return extension in ALLOWED_EXTENSIONS


def sanitize_collection_name(name: str) -> str:
    """Sanitize the collection name."""
    sanitized_name = re.sub(r"\.pdf$", "", name, flags=re.IGNORECASE)
    sanitized_name = re.sub(r"[^\w\s-]", "", sanitized_name)
    sanitized_name = re.sub(r"\s+", "-", sanitized_name)
    sanitized_name = re.sub(r"\.-|-\.", "-", sanitized_name)
    sanitized_name = re.sub(r"\.{2,}", "", sanitized_name)
    sanitized_name = re.sub(r"^[^a-zA-Z0-9]+", "", sanitized_name)
    sanitized_name = re.sub(r"[^a-zA-Z0-9]+$", "", sanitized_name)
    if re.match(r"^(\d{1,3}\.){3}\d{1,3}$", sanitized_name):
        sanitized_name = "IP_" + sanitized_name
    return sanitized_name[:63].ljust(3, "_")


UPLOAD_DIRECTORY = Path("../data/raw")
UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
CHUNK_SIZE = 1024 * 1024 * 5  # 5MB per chunk
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100MB max file size



# ==========================
# 1️⃣ CHUNKED FILE UPLOAD API
# ==========================
class ProcessFileRequest(BaseModel):
    chat_id: str
    filename: str




@collections_router.post("/upload")
async def upload_chunk(
    file: UploadFile = File(...),
    chat_id: str = Form(None),
    file_id: str = Form(None),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
):
    

    file_id = file_id or str(uuid4())

    delete_stop_flag(chat_id)
    delete_stream(chat_id)
    
    chunks_dir = UPLOAD_DIRECTORY / chat_id / f"{file_id}_chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)
    chunk_file_path = chunks_dir / f"chunk_{chunk_index:05d}.part"

    try:
        chunk = await file.read()
        print(
            f"[DEBUG] Received chunk {chunk_index}/{total_chunks}, size = {len(chunk)} bytes"
        )

        if not chunk:
            return JSONResponse(
                content={"success": False, "message": f"Chunk {chunk_index} is empty."},
                status_code=400,
            )

        async with aiofiles.open(chunk_file_path, "wb") as chunk_file:
            await chunk_file.write(chunk)

        progress = ((chunk_index + 1) / total_chunks) * 100
        print(f"✅ Chunk {chunk_index + 1}/{total_chunks} uploaded ({progress:.2f}%)")

        # Final chunk: assemble and upload
        all_chunks_present = all(
            (chunks_dir / f"chunk_{i:05d}.part").exists() for i in range(total_chunks)
        )

        if all_chunks_present:
            chat_folder = UPLOAD_DIRECTORY / chat_id
            chat_folder.mkdir(parents=True, exist_ok=True)

            final_file_path = chat_folder / file.filename

            # 🔍 Assemble file
            try:
                with open(final_file_path, "wb") as final_file:
                    for i in range(total_chunks):
                        part_path = chunks_dir / f"chunk_{i:05d}.part"
                        if not part_path.exists():
                            raise FileNotFoundError(f"Missing chunk part: {part_path}")
                        with open(part_path, "rb") as part_file:
                            final_file.write(part_file.read())
                print(f"[DEBUG] Final file assembled at {final_file_path}")
            except Exception as e:
                print(f"❌ Assembly error: {e}")
                return JSONResponse(
                    content={"success": False, "message": f"Assembly failed: {str(e)}"},
                    status_code=500,
                )

            # 🔍 Call Celery Task
            try:
                result = celery_app.send_task(
                    "process_uploaded_file",
                    args=[final_file_path, chat_id],
                )
                set_task_ids(chat_id, [result.id])

                print(f"[DEBUG] Celery task queued: {result.id}")
            except Exception as e:
                print(f"❌ Celery task error: {e}")
                return JSONResponse(
                    content={
                        "success": False,
                        "message": f"Celery task failed: {str(e)}",
                    },
                    status_code=500,
                )

            return JSONResponse(
                content={
                    "success": True,
                    "message": "File uploaded and processing started.",
                    "chat_id": chat_id,
                    "file_id": file_id,
                    "final_file_path": str(final_file_path),  # ✅ Convert Path to string
                    "task_id": "result.id",
                    "progress": "100%",
                },
                status_code=200,
            )

        # Not the last chunk
        return JSONResponse(
            content={
                "success": True,
                "message": "Chunk received",
                "progress": f"{progress:.2f}%",
                "file_id": file_id,
                "chunk_index": chunk_index,
                "total_chunks": total_chunks,
            },
            status_code=200,
        )

    except Exception as e:
        print(f"❌ upload error: {e}")
        return JSONResponse(
            content={"success": False, "message": f"Upload failed: {str(e)}"},
            status_code=500,
        )

