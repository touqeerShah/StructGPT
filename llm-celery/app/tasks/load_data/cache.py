import redis
import os
import json
from dotenv import load_dotenv

load_dotenv()

REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_ADDRESS = os.getenv(
    "REDIS_ADDRESS", "my-redis-master.stada-backend.svc.cluster.local"
)
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

redis_client = None
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

# Connect to Redis (adjust host/port/db/password as needed)

def publish_stream_event(chat_id: str, message: dict):
    stream_key = f"stream:{chat_id}"

    # Convert all values to valid Redis types (str, int, float, bytes)
    safe_message = {
        k: str(v) if isinstance(v, (bool, dict, list)) else v
        for k, v in message.items()
    }

    redis_client.xadd(stream_key, safe_message)

def set_stop_flag(chat_id: str, value: bool):
    """
    Set a stop flag in Redis for a given chain ID.
    """
    key = f"isStop:{chat_id}"
    redis_client.set(key, str(value).lower())  # Store as "true"/"false"


def get_stop_flag(chat_id: str) -> bool:
    """
    Get the stop flag from Redis for a given chain ID.
    Returns False if not set.
    """
    key = f"isStop:{chat_id}"
    value = redis_client.get(key)
    return value == "true"


def delete_stop_flag(chat_id: str):
    """
    Delete the stop flag in Redis for a given chain ID.
    """
    key = f"isStop:{chat_id}"
    redis_client.delete(key)


def set_task_id(chat_id: str, task_id: str):
    key = f"taskIds:{chat_id}"
    existing = redis_client.get(key)
    task_ids = json.loads(existing) if existing else []

    if task_id not in task_ids:
        task_ids.append(task_id)

    redis_client.set(key, json.dumps(task_ids))


def get_task_ids(chat_id: str) -> list[str]:
    key = f"taskIds:{chat_id}"
    value = redis_client.get(key)
    return json.loads(value) if value else []


def delete_task_ids(chat_id: str):
    """
    Delete the task IDs from Redis for a given chat ID.
    """
    key = f"taskIds:{chat_id}"
    redis_client.delete(key)



