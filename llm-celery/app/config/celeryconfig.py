# from dotenv import load_dotenv
# import os
# load_dotenv()

# # Your JWT secret key
# REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

# ## Broker settings.
# broker_url = REDIS_URL

# # List of modules to import when the Celery worker starts.
# imports = ('app.tasks.load_data.load_pdf_data_with_pdf_reader')

# ## Using the database to store task state and results.
# result_backend = REDIS_URL

# task_annotations = {'tasks.add': {'rate_limit': '10/s'}}

# task_queues = {
#     'test-queue': {
#         'exchange': 'test-queue',
#     }
# }
# task_routes = {
#     "app.tasks.load_data.load_pdf_data_with_pdf_reader":"test-queue"
# }
# task_track_started = True

# worker_concurrency = 1
# worker_prefetch_multiplier = 3
# worker_max_tasks_per_child = 10000
# broker_connection_retry = True  # Retries for subsequent reconnections after startup
# broker_connection_retry_on_startup = True  # Ensure retries happen at startup