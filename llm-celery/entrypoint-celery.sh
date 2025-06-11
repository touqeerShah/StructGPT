#!/bin/sh
set -e

echo "Updating system packages and installing dependencies..."
apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libc-dev \
    libffi-dev \
    libpq-dev \
    python3-dev \
    python3-pip \
    openssl \
    build-essential \
    bash \
    linux-headers-amd64 \
    rustc \
    cargo \
    vim \
    && rm -rf /var/lib/apt/lists/*  # Clean up package lists to reduce image size

apt-get update && apt-get install -y poppler-utils
echo "Upgrading pip and installing dependencies..."
python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel

echo "Creating virtual environment..."
python3 -m venv /llm/venv
. /llm/venv/bin/activate  # Use '.' instead of 'source' for Alpine compatibility

echo "Installing Python dependencies..."
pip install --no-cache-dir --verbose -r /llm/requirements.txt

# Set environment variables
export C_FORCE_ROOT="true"
export PATH="/llm/venv/bin:$PATH"  # Ensure Celery is found
pip uninstall numpy protobuf httpx packaging tenacity tokenizers fsspec chromadb langchain transformers datasets -y

pip install "numpy==1.24.4" "protobuf<5.0dev" "httpx<0.28.0" "packaging<24.0" "tenacity<9.0.0" "tokenizers<0.19" "fsspec[http]<=2024.2.0" "chromadb<0.6.0"
pip uninstall -y pydantic langchain langchain-core langchain-aws llama-index llama-index-core

pip install \
    "pydantic>=2.8" \
    "langchain>=0.2.11" \
    "langchain-aws>=0.2.13" \
    "llama-index-core>=0.12.19"
pip install llama-index llama-index-embeddings-langchain

pip uninstall -y llama-index llama-index-core llama-index-vector-stores-chroma chromadb langchain langchain-core langchain-openai langchain-aws pydantic pydantic-core llama-parse llama-cloud-services

pip install pydantic>=2.8.0
pip install langchain-core==0.2.0
pip install langchain==0.3.19
pip install langchain-openai==0.1.6
pip install langchain-aws==0.2.13
pip install llama-index-core==0.10.0
pip install llama-index-vector-stores-chroma==0.1.8
pip install chromadb==0.5.0
pip install llama-parse
pip install llama-cloud-services
pip install "llama-index<0.11.0"
pip install eventlet
pip install pdfminer.six

echo "Starting Celery worker..."
exec celery -A app.config.celery_app.celery_app worker -B --loglevel=info --concurrency=2 -P prefork
# exec celery -A app.config.celery_app.celery_app worker -Q async-tasks --loglevel=info  --concurrency=100 -P eventlet


