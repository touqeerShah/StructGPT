from urllib.parse import urlparse
import re
import os
import pymupdf
import hashlib
import asyncio
import boto3
import chromadb
import subprocess
import re
from chromadb.config import Settings
import time
from app.tasks.load_data.cache import get_stop_flag, publish_stream_event, set_stop_flag


from celery.utils.log import get_task_logger
from elasticsearch import Elasticsearch, helpers
from llama_index.vector_stores.chroma import ChromaVectorStore
from uuid import uuid4

from langchain_core.documents import Document
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain_community.embeddings import GPT4AllEmbeddings


from llama_parse import LlamaParse

from dotenv import load_dotenv
from app.config.celery_app import celery_app
import nest_asyncio

# Apply nest_asyncio
nest_asyncio.apply()
#  uncomment when run local
from app.tasks.load_data.PyMuPDFReader import PDFMarkdownReader
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from celery.exceptions import WorkerLostError

load_dotenv()


logger = get_task_logger(__name__)

# AWS Bedrock Client configuration
# Path for the processed database
current_file_dir = os.path.dirname(os.path.abspath(__file__))


# Local
model_name = "all-MiniLM-L6-v2.gguf2.f16.gguf"
gpt4all_kwargs = {"allow_download": "True"}
embeddings = GPT4AllEmbeddings(model_name=model_name, gpt4all_kwargs=gpt4all_kwargs)
wrapped_embeddings = LangchainEmbedding(embeddings)


ELASTIC_HOST = os.getenv("ELASTIC_HOST", "http://localhost:9200")
es = Elasticsearch([ELASTIC_HOST])



# @celery_app.task(name="process_uploaded_file")
from threading import Thread
def run_async(coroutine):
    return asyncio.run(coroutine)

import shutil

from redis import Redis
import json
import os


async def send_websocket_message(url, message):
    import websockets
    import json

    if isinstance(message, dict):
        message = json.dumps(message)

    print(f"[DEBUG] Sending to {url}: {message}")  # ✅ print before sending

    try:
        async with websockets.connect(url) as websocket:
            await websocket.send(message)
            print("[DEBUG] Message sent")
    except Exception as e:
        print(f"[ERROR] WebSocket send failed: {e}")


def hash_subset_of_documents(documents, percentage=10, hash_length=32):
    number_pages_read = int(len(documents) * (percentage / 100))
    combined_data = " ".join(
        str(doc.to_langchain_format().page_content)
        for doc in documents[:number_pages_read]
    )
    sha256_hash = hashlib.sha256(combined_data.encode()).hexdigest()
    return sha256_hash[:hash_length]


def sanitize_collection_name(name):
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


def sanitize_name(name):
    return re.sub(r"\W+", "_", name).strip("_")





@celery_app.task(name="process_uploaded_file")
def process_uploaded_file(file_path: str, chat_id: str):
    try:
        # Create a unique folder for this chat

        # Start async processing inside this thread (Celery worker)
        import nest_asyncio
        nest_asyncio.apply()
        asyncio.run(process_pdf_and_send_updates(file_path, chat_id))

    except Exception as e:
        print(f"❌ Celery Task Error: {str(e)}")
        publish_stream_event(
            chat_id,
            {
                "message": f"❌ Failed to process file: {str(e)}",
                "type": "error",
                "chat_id": chat_id,
                "collections": [],
                "isFinished": True,
            },
        )



def is_valid_pdf(file_path: str) -> bool:
    try:
        doc = pymupdf.open(file_path)
        _ = doc.page_count  # Trigger full load
        return True
    except Exception as e:
        print(f"[PyMuPDF Check] Invalid PDF: {e}")
        return False


def is_valid_pdf_pdfinfo(file_path: str, timeout: int = 5) -> bool:
    try:
        output = subprocess.check_output(["pdfinfo", file_path], text=True, timeout=timeout)
        return bool(re.search(r"Pages:\s+\d+", output))
    except subprocess.TimeoutExpired:
        print(f"[pdfinfo Timeout] Took too long.")
        return False
    except Exception as e:
        print(f"[pdfinfo Error] {e}")
        return False

def is_pdf_valid(file_path: str) -> bool:
    return is_valid_pdf(file_path) or is_valid_pdf_pdfinfo(file_path)



async def process_pdf_and_send_updates(file_path: str, chat_id: str):
    reader = PDFMarkdownReader()
    collection_name = sanitize_collection_name(Path(file_path).name)
   
    if not is_valid_pdf_pdfinfo(file_path):
        publish_stream_event(
            chat_id,
            {
                "type": "error",
                "message": f"PDF appears to be corrupt or unreadable.",
                "isFinished": False,
            },
        )
        return

    def redis_stream_emitter(chat_id, msg: dict):
        try:
            print("[STREAM EMIT]", msg)
            publish_stream_event(
                chat_id,
                {
                    **msg,
                    "chat_id": chat_id,
                    "collection": collection_name,
                },
            )
        except Exception as e:
            print(f"❌ Redis stream error: {e}")

    try:
        await reader.load_data(
            file_path=Path(file_path),
            collection_name=collection_name,
            chat_id=chat_id,
            message_handler=redis_stream_emitter,
        )

        if get_stop_flag(chat_id):
            publish_stream_event(
                chat_id,
                {
                    "message": "✅ Stop requested. Task terminated early.",
                    "type": "stop",
                    "chat_id": chat_id,
                    "collections": [collection_name],
                    "isFinished": False,
                },
            )

    except Exception as e:
        print(f"❌ Async Task Error: {str(e)}")
        publish_stream_event(
            chat_id,
            {
                "message": f"❌ Failed to parse or process: {str(e)}",
                "type": "error",
                "chat_id": chat_id,
                "collections": [],
                "isFinished": True,
            },
        )

    finally:
        # Cleanup: delete from S3 and local filesystem
        try:
            folder_path = Path(file_path).parent
            if folder_path.exists():
                shutil.rmtree(folder_path)
                print(f"🧹 Deleted local folder: {folder_path}")
        except Exception as e:
            print(f"⚠️ Failed to delete local folder: {e}")


@celery_app.task(name="load_with_fitz_chroma", bind=True)
def load_with_fitz_chroma(
    self,
    documents,
    collection_name,
    chat_id,
    current_batch_number,
    total_batches,
):
    """Optimized and memory-efficient batch processing for document embedding and indexing."""
    logger.info(f"{self}")

    async def main(
        documents,
        collection_name,
        chat_id,
        current_batch_number,
        total_batches,
    ):
        try:
            logger.info(
                f"===> Processing batch {current_batch_number} of {total_batches} for '{collection_name}', chat_id: {chat_id}"
            )
            # logger.info(f"First doc: {documents[0]}")
            # logger.info(f"Type of documents: {type(documents)}")
            # logger.info(f"Type of documents[0]: {type(documents[0])}")
            if get_stop_flag(chat_id):
                # delete_stop_flag(chat_id)
                return []
            # time.sleep(300)
    
            # WebSocket: Notify batch processing start
            publish_stream_event(
                chat_id,
                {
                    "message": f"Processing batch {current_batch_number} of {total_batches}.",
                    "type": "processing_start",
                    "chat_id": chat_id,
                    "isFinished": False,
                },
                        )

            # === 🔹 Processing Documents Efficiently ===
            batch_size = 200
            document_list = []
            semaphore = asyncio.Semaphore(10)  # Limit concurrency to 10 parallel tasks

            # async def process_document(doc):
            #     """Processes a document and returns a Document object."""
            #     async with semaphore:
            #         text = doc.get("text", "").strip()

            #         if text:
            #             return Document(text=text, extra_info=doc.get("extra_info", {}))
            #         return None

            # # 🔹 Process documents in parallel using asyncio tasks
            # tasks = [asyncio.create_task(process_document(doc)) for doc in documents]
            # processed_documents = await asyncio.gather(*tasks)
            # document_list = list(
            #     filter(None, processed_documents)
            # )  # Remove None values
            for i, doc in enumerate(documents):
                # logger.info("doc  : ",str(doc))
                embedding = embeddings.embed_documents([doc.page_content])
                logger.info(f"Test embedding length: {len(embedding)}")
                logger.info(f"Embedding preview: {embedding[:1]}")
                # assert isinstance(doc, Document), f"❌ Item {i} is not a Document: {type(doc)}"
            # If no valid documents found, notify and exit
            if not documents:

                publish_stream_event(
                    chat_id,
                    {
                        "error": True,
                        "message": "No content found; skipping indexing.",
                        "type": "no_content",
                        "chat_id": chat_id,
                        "isFinished": True,
                    },
                )
                logger.error("No valid content found in documents.")
                return False

            # WebSocket: Notify conversion completion

            publish_stream_event(
                chat_id,
                {
                    "message": f"Batch {current_batch_number}/{total_batches} document conversion complete.",
                    "type": "conversion_done",
                    "chat_id": chat_id,
                    "isFinished": False,
                },
            )

            # === 🔹 VectorStoreIndex Optimization ===
            try:
                #  for productions Production

                # chroma_credentials = os.getenv("CHROMA_CLIENT_AUTH_CREDENTIALS")

                # if not chroma_credentials:
                #     raise ValueError("CHROMA_CLIENT_AUTH_CREDENTIALS is not set!")
                chroma_host = os.getenv("CHROMA_HOST")

                if not chroma_host:
                    raise ValueError("CHROMA_HOST is not set!")

                db = chromadb.HttpClient(
                    host=chroma_host,  # "chroma-server.monitoring.svc.cluster.local",
                    port=8000,
                    # settings=Settings(
                    #     chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider",
                    #     chroma_client_auth_credentials=chroma_credentials,
                    # ),
                )
                from langchain_chroma import Chroma

                              # Insert into Chroma directly
                chroma_vectorstore = Chroma(
                    collection_name=collection_name,
                    embedding_function=embeddings,
                    client=db,
                )

                from uuid import uuid4

                uuids = [str(uuid4()) for _ in range(len(documents))]

                chroma_vectorstore.add_documents(documents=documents, ids=uuids)
                # chroma_vectorstore.add_documents(document_list)
                # WebSocket: Notify indexing completion


                # WebSocket: Notify indexing completion

                publish_stream_event(
                    chat_id,
                    {
                        "message": f"Batch {current_batch_number}/{total_batches} Index Complete.",
                        "type": "processing_done",
                        "chat_id": chat_id,
                        "isFinished": False,
                    },
                )
                logger.info("VectorStoreIndex created successfully.")

            except Exception as e:
                logger.error(f"Error creating VectorStoreIndex: {e}")

                publish_stream_event(
                    chat_id,
                    {
                        "error": True,
                        "message": "Error during indexing.",
                        "type": "error",
                        "chat_id": chat_id,
                        "isFinished": current_batch_number == total_batches,
                    },
                )
                return False

            # === 🔹 Final Notifications ===
            if current_batch_number == total_batches:

                publish_stream_event(
                    chat_id,
                    {
                        "message": "All tasks completed successfully.",
                        "type": "task_complete",
                        "chat_id": chat_id,
                        "collections": [collection_name],
                        "isFinished": current_batch_number == total_batches,
                    },
                )
            return True

        except Exception as e:
            logger.error(f"Error creating VectorStoreIndex: {e}")
            logger.error("Sending WebSocket error message due to indexing failure...")

            publish_stream_event(
                chat_id,
                {
                    "error": True,
                    "message": f"Indexing failed: {str(e)}",
                    "type": "error",
                    "chat_id": chat_id,
                    "isFinished": current_batch_number == total_batches,
                },
            )

            return False

    async def fallback_main():
        try:
            return await main(
                documents,
                collection_name,
                chat_id,
                current_batch_number,
                total_batches,
            )
        except Exception as e:
            logger.error(f"Unhandled exception outside main(): {e}")
            logger.info("Sending WebSocket error message due to indexing failure...")
            try:

                publish_stream_event(
                    chat_id,
                    {
                        "error": True,
                        "message": f"Indexing failed: {str(e)}",
                        "type": "error",
                        "chat_id": chat_id,
                        "isFinished": True,
                    },
                )

            except Exception as websocket_error:
                logger.error(f"WebSocket send failed in fallback: {websocket_error}")
            return False

    return run_async(fallback_main())

@celery_app.task(name="load_with_fitz_elastic", bind=True)
def load_with_fitz_elastic(
    self,
    documents,
    index_name,
    chat_id,
    current_batch_number,
    total_batches,
):
    logger.info(f"{self}")

    async def main(documents, index_name, chat_id, current_batch_number, total_batches):
        try:
            logger.info(
                f"===> Processing batch {current_batch_number} of {total_batches} for '{index_name}', chat_id: {chat_id}"
            )

            if get_stop_flag(chat_id):
                return []

            publish_stream_event(
                chat_id,
                {
                    "message": f"Processing batch {current_batch_number} of {total_batches}.",
                    "type": "processing_start",
                    "chat_id": chat_id,
                    "isFinished": False,
                },
            )

            if not documents:
                publish_stream_event(
                    chat_id,
                    {
                        "error": True,
                        "message": "No content found; skipping indexing.",
                        "type": "no_content",
                        "chat_id": chat_id,
                        "isFinished": True,
                    },
                )
                logger.error("No valid content found in documents.")
                return False

            publish_stream_event(
                chat_id,
                {
                    "message": f"Batch {current_batch_number}/{total_batches} document conversion complete.",
                    "type": "conversion_done",
                    "chat_id": chat_id,
                    "isFinished": False,
                },
            )

            # Prepare Elastic bulk indexing
            actions = []
            def sanitize_metadata(meta: dict) -> dict:
                return {k: v for k, v in meta.items() if v is not None}

            for doc in documents:
                uid = str(uuid4())
                metadata = sanitize_metadata(doc.metadata)
                text = doc.page_content
                # logger.info("doc : ",str(doc.metadata))
                # logger.info("type : ",type(doc))
                index_name = index_name.lower()

                action = {
                    "_index": index_name,
                    "_id": uid,
                    "_source": {
                        "content": text,
                        "metadata": metadata,
                    },
                }
                # logger.info("action : ",json.dumps(action))
                actions.append(action)
                from elasticsearch.helpers import streaming_bulk

                for ok, item in streaming_bulk(es, actions, raise_on_error=False):
                    if not ok:
                        print("❌ Failed to index document:", item)

            # helpers.bulk(es, actions)

            publish_stream_event(
                chat_id,
                {
                    "message": f"Batch {current_batch_number}/{total_batches} Index Complete.",
                    "type": "processing_done",
                    "chat_id": chat_id,
                    "isFinished": False,
                },
            )
            logger.info("Elastic indexing complete.")

            if current_batch_number == total_batches:
                publish_stream_event(
                    chat_id,
                    {
                        "message": "All tasks completed successfully.",
                        "type": "task_complete",
                        "chat_id": chat_id,
                        "collections": [index_name],
                        "isFinished": True,
                    },
                )
            return True

        except Exception as e:
            logger.error(f"Error during indexing: {e}")
            publish_stream_event(
                chat_id,
                {
                    "error": True,
                    "message": f"Indexing failed: {str(e)}",
                    "type": "error",
                    "chat_id": chat_id,
                    "isFinished": current_batch_number == total_batches,
                },
            )
            return False

    async def fallback_main():
        try:
            return await main(documents, index_name, chat_id, current_batch_number, total_batches)
        except Exception as e:
            logger.error(f"Unhandled exception outside main(): {e}")
            try:
                publish_stream_event(
                    chat_id,
                    {
                        "error": True,
                        "message": f"Indexing failed: {str(e)}",
                        "type": "error",
                        "chat_id": chat_id,
                        "isFinished": True,
                    },
                )
            except Exception as websocket_error:
                logger.error(f"WebSocket send failed in fallback: {websocket_error}")
            return False

    return run_async(fallback_main())
