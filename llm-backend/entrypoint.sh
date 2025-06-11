#!/bin/bash
set -e

# Update package lists and install required dependencies
apt-get UN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

pip install --no-cache-dir virtualenv
apt update && apt install -y build-essential python3-dev
apt install -y libopenblas-dev cmake

# Create and activate virtual environment
# virtualenv -p python3.11 venv
source /llm/venv/bin/activate

# Copy application files

# Create necessary directories
mkdir -p /llm/app/data/raw /llm/app/data/ppt /llm/app/data/processed

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install --upgrade --no-cache-dir -r requirements.txt

# Ensure correct pymupdf version is installed
pip uninstall pymupdf -y && pip install --no-cache-dir pymupdf

# Debug: Check installed Python packages
# /llm/venv/bin/python -m pip list | grep uvicorn || echo "Uvicorn not installed!"

# Ensure Uvicorn is installed
pip install --no-cache-dir uvicorn
pip install --no-cache-dir --upgrade "chromadb==0.6.3"
pip uninstall fitz -y
pip install pymupdf

# Debug: Check installed packages
pip list

uvicorn main:app --host 0.0.0.0 --port 4000 --workers 4 --log-level debug  --reload

# Run the main application
# exec python3 main.py
