import json
import re
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union, Tuple, Awaitable
import logging
import asyncio
import pymupdf
from pymupdf4llm import IdentifyHeaders, to_markdown
from app.config.celery_app import celery_app
from concurrent.futures import ProcessPoolExecutor, as_completed
import os
from concurrent.futures import ThreadPoolExecutor

# from llama_index.core.schema import Document
from langchain_core.documents import Document

import asyncio
import websockets
from app.tasks.load_data.cache import set_task_id, get_stop_flag, delete_stop_flag


logger = logging.getLogger("uvicorn")

try:
    from llama_index.core.readers.base import BaseReader

    # from llama_index.core.schema import Document as Document

    print("Successfully imported LlamaIndex")
except ImportError:
    raise NotImplementedError("Please install 'llama_index'.")

WEB_SOCKET_URL = os.getenv("WEB_SOCKET_URL", "ws://localhost:4000/ws/llm_message")


async def send_websocket_message(uri, message):
    async with websockets.connect(uri) as websocket:
        await websocket.send(message)


class PDFMarkdownReader(BaseReader):
    """Read PDF files using PyMuPDF library with chunked page processing."""

    meta_filter: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None

    def __init__(
        self, meta_filter: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None
    ):
        self.meta_filter = meta_filter
        self.processed_pages = 0
        self.total_pages = 0
        self.tasks = []

    async def load_data(
        self,
        file_path: Union[str, Path],
        collection_name: str,
        extra_info: Optional[Dict[str, Any]] = None,
        chat_id: Optional[str] = None,
        batch_size: int = 50,
        page_chunk_size: int = 100,
        message_handler: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        extra_info = extra_info or {}
        hdr_info = IdentifyHeaders(file_path)
        self.total_pages = pymupdf.open(file_path).page_count
        print("self.total_pages : ", self.total_pages)

        if get_stop_flag(chat_id):
            if message_handler:
                message_handler(
                    chat_id,
                    {
                        "type": "stop",
                        "message": f"File processing for chat_id {chat_id} was stopped.",
                        "isFinished": False,
                    },
                )
            return

        page_chunks = [
            range(i, min(i + page_chunk_size, self.total_pages))
            for i in range(0, self.total_pages, page_chunk_size)
        ]

        if message_handler:
            message_handler(
                chat_id,
                {
                    "type": "start",
                    "message": f"File processing for chat_id {chat_id} has started.",
                    "isFinished": False,
                },
            )

        loop = asyncio.get_event_loop()
        tasks = []

        with ThreadPoolExecutor(max_workers=4) as executor:
            for chunk_index, chunk in enumerate(page_chunks):
                if get_stop_flag(chat_id):
                    return

                task = loop.run_in_executor(
                    executor,
                    self._process_doc_pages_sync,
                    file_path,
                    chunk,
                    chat_id,
                    extra_info,
                    hdr_info,
                    chunk_index,
                    len(page_chunks),
                    message_handler,
                    loop,
                )
                tasks.append(task)

            # Process results as they complete
            for future in asyncio.as_completed(tasks):
                try:
                    result, message = await future

                    if message["type"] == "error":
                        if message_handler:
                            message_handler(chat_id, message)
                        return

                    if message_handler:
                        message_handler(
                            chat_id,
                            {
                                "type": "chunk",
                                "message": f"Chunk {message['chunk_index']}/{message['total_chunks']} processed successfully.",
                                "isFinished": False,
                            },
                        )

                    if result:
                        try:
                            self._send_to_celery(
                                documents=result,
                                collection_name=collection_name,
                                chat_id=chat_id,
                                current_batch_number=message["chunk_index"],
                                total_batches=len(page_chunks),
                                message_handler=message_handler,
                            )
                        except Exception as e:
                            error_message = f"Failed to send chunk {message['chunk_index']} to Celery: {e}"
                            print(error_message)
                            if message_handler:
                                message_handler(
                                    chat_id,
                                    {
                                        "type": "error",
                                        "message": error_message,
                                        "isFinished": False,
                                    },
                                )
                            return
                    else:
                        if message_handler:
                            message_handler(
                                chat_id,
                                {
                                    "type": "error",
                                    "message": f"Failed to read chunk {message['chunk_index']}.",
                                    "isFinished": False,
                                },
                            )
                        return

                except Exception as e:
                    if message_handler:
                        message_handler(
                            chat_id,
                            {
                                "type": "error",
                                "message": f"Failed to process a chunk: {e}",
                                "isFinished": False,
                            },
                        )
                    return

    def _process_single_page(
        self,
        doc: pymupdf.Document,  # 👈 add this
        file_path: Union[str, Path],
        page_number: int,
        chat_id: str,
        extra_info: Dict[str, Any],
        hdr_info: IdentifyHeaders,
        message_handler: Optional[Callable[[Dict[str, Any]], None]] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> Optional[Document]:
        try:
            if get_stop_flag(chat_id):
                return []

            # doc = pymupdf.open(file_path)
            page = doc[page_number]

            page_info = {
                **(extra_info or {}),
                **doc.metadata,
                "page": page_number + 1,
                "total_pages": len(doc),
                "file_path": str(file_path),
            }

            # ✅ Send message only for every 10th page
            if message_handler and ((page_number + 1) % 30 == 0 or page_number == 0):
                message_handler(
                    chat_id,
                    {
                        "type": "page",
                        "page": page_number + 1,
                        "total_pages": len(doc),
                        "file_path": str(file_path),
                        "isFinished": False,
                    },
                )

            try:
                text = to_markdown(
                    doc,
                    pages=[page_number],
                    hdr_info=hdr_info,
                    write_images=False,
                    show_progress=False,
                )
            except Exception:
                text = page.get_text("text") or "[Page content could not be read]"

            return Document(page_content=text, metadata=page_info, id=page_number)

        except Exception as e:
            print(f"[Error] Failed processing page {page_number}: {e}")
            return None

    def _process_doc_pages_sync(
        self,
        file_path: Union[str, Path],
        pages: range,
        chat_id: str,
        extra_info: Dict[str, Any],
        hdr_info: IdentifyHeaders,
        chunk_index: int,
        total_chunks: int,
        message_handler: Optional[Callable[[Dict[str, Any]], None]] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> Tuple[List[Document], Dict[str, Any]]:
        try:
            docs = []
            doc = pymupdf.open(file_path)  # ✅ open once

            with ThreadPoolExecutor(max_workers=6) as executor:
                future_to_page = {
                    executor.submit(
                        self._process_single_page,
                        doc,
                        file_path,
                        page_number,
                        chat_id,
                        extra_info,
                        hdr_info,
                        message_handler,
                        loop,
                    ): page_number
                    for page_number in pages
                }

                for future in as_completed(future_to_page):
                    page_result = future.result()
                    if page_result:
                        docs.append(page_result)
            docs.sort(key=lambda d: d.metadata["page"])

            return docs, {
                "type": "chunk",
                "message": f"Chunk {chunk_index + 1}/{total_chunks} processed in parallel.",
                "chunk_index": chunk_index + 1,
                "total_chunks": total_chunks,
                "processed_pages": len(docs),
                "isFinished": False,
            }

        except Exception as e:
            return [], {
                "type": "error",
                "message": f"Error processing chunk {chunk_index + 1}: {e}",
            }

    # REMOVE @staticmethod
    def _send_to_celery(
        self,
        documents: List[Document],
        collection_name: str,
        chat_id: str,
        current_batch_number: int,
        total_batches: int,
        message_handler: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        try:
            # serialized_docs = [
            #     {"text": doc.text, "extra_info": doc.extra_info} for doc in documents
            # ]
            result = celery_app.send_task(
                "load_with_fitz_elastic",
                args=[
                    documents,
                    collection_name,
                    chat_id,
                    current_batch_number,
                    total_batches,
                ],
            )

            # self.tasks.append(result.id)
            set_task_id(chat_id, result.id)

            if message_handler:
                message_handler(
                    chat_id,
                    {
                        "type": "task",
                        "message": f"Batch {current_batch_number} of {total_batches} sent to Celery with task_id: {result.id}",
                        "task_ids": self.tasks,
                        "isFinished": False,
                    },
                )

            print(
                f"[Celery] Sent batch {current_batch_number}/{total_batches} → Task ID: {result.id}"
            )

        except Exception as e:
            error_message = (
                f"Failed to send batch {current_batch_number} to Celery: {e}"
            )
            print(error_message)

            if message_handler:
                message_handler(
                    chat_id,
                    {
                        "type": "error",
                        "message": error_message,
                        "isFinished": False,
                    },
                )
