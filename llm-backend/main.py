import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from app.api.routers.upload import collections_router
from app.api.routers.llm import llm_router
from app.api.routers.user import user_router


# Load environment variables
load_dotenv()

# Initialize the FastAPI app
app = FastAPI()

# Environment-specific configurations
environment = os.getenv("ENVIRONMENT", "dev")  # Default to 'development' if not set

if environment == "dev":
    logger = logging.getLogger("uvicorn")
    logger.warning("Running in development mode - allowing CORS for all origins")
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(collections_router, prefix="/api")
app.include_router(llm_router, prefix="/llm")
app.include_router(user_router, prefix="/auth")


# # Ensure the upload folder exists
# UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000) # Deploy
    # uvicorn.run(app, host="0.0.0.0", port=4000, reload=True) # local 
