from app.config.celery_app import celery_app
from app.api.utils.cache import set_stop_flag, get_task_ids, delete_task_ids
from celery.result import AsyncResult

from celery.result import AsyncResult


def revoke_celery_task(chat_id: str = "", results=None):
    if results is None:
        results = []

    if chat_id:
        set_stop_flag(chat_id, True)

    # Fetch task IDs from Redis
    task_ids = get_task_ids(chat_id) if chat_id else []

    for task_id in task_ids:
        try:
            result = AsyncResult(task_id)
            state = result.state
            if state == "PENDING":
                result.revoke()
                celery_app.control.revoke(task_id, terminate=True, signal="SIGKILL")
                results.append({"task_id": task_id, "status": "not_found"})
            elif state == "SUCCESS":
                results.append({"task_id": task_id, "status": "already_completed"})
            else:
                result.revoke()
                celery_app.control.revoke(task_id, terminate=True, signal="SIGKILL")
                results.append({"task_id": task_id, "status": "revoked"})
        except Exception as e:
            results.append({"task_id": task_id, "status": "error", "detail": str(e)})

    # Optionally clean up the Redis key after revoking
    if chat_id:
        delete_task_ids(chat_id)

    return results
