from celery import Celery
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()


# Get Redis credentials from environment variables
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_ADDRESS = os.getenv("REDIS_ADDRESS", "my-redis-master.stada-backend.svc.cluster.local")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

# Redis URL without username (Bitnami Redis does not use ACLs by default)
if REDIS_PASSWORD:
    REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_ADDRESS}:{REDIS_PORT}/0"
else:
    REDIS_URL = f"redis://{REDIS_ADDRESS}:{REDIS_PORT}/0"

# print(f"Using Redis URL: {REDIS_URL}")  # Debugging line

# Initialize Celery
celery_app = Celery("llm_worker_project", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_track_started=True,
    worker_concurrency=1,
    worker_prefetch_multiplier=3,
    worker_max_tasks_per_child=10000,
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    task_serializer="pickle",
    result_serializer="pickle",
    accept_content=["pickle", "json"],
)

celery_app.autodiscover_tasks(['llm_worker_project.tasks'])


def run_async(coroutine):
    """
    Run an async coroutine in a new event loop.
    """
    return asyncio.run(coroutine)

