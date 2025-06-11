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
def delete_stream(chat_id: str):
    """Deletes the Redis stream for a given chat_id."""
    stream_key = f"stream:{chat_id}"
    print('stream_key ; ',stream_key)
    try:
        redis_client.delete(stream_key)
        print(f"✅ Stream {stream_key} deleted.")
    except Exception as e:
        print(f"❌ Failed to delete stream {stream_key}: {e}")


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


def set_task_ids(chat_id: str, task_ids: list[str]):
    """
    Store the list of task IDs in Redis for a given chat ID.
    """
    key = f"taskIds:{chat_id}"
    redis_client.set(key, json.dumps(task_ids))


def get_task_ids(chat_id: str) -> list[str]:
    """
    Retrieve the list of task IDs from Redis for a given chat ID.
    Returns an empty list if not found.
    """
    key = f"taskIds:{chat_id}"
    value = redis_client.get(key)
    return json.loads(value) if value else []


def delete_task_ids(chat_id: str):
    """
    Delete the task IDs from Redis for a given chat ID.
    """
    key = f"taskIds:{chat_id}"
    redis_client.delete(key)



