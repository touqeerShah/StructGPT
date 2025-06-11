# Use an official Python runtime as the parent image
FROM python:3.11-slim

# Set an environment variable to ensure Python outputs are sent straight to the terminal without being buffered
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /llm

# Install virtualenv
RUN pip install --no-cache-dir virtualenv

# Create a virtual environment
RUN virtualenv venv

# Activate virtual environment
ENV PATH="/llm/venv/bin:$PATH"
RUN apt update
RUN apt install vim screen -y

# Copy the rest of your application's code into the container at /llm
COPY . .

# Debug: List contents of /llm directory
RUN ls -l /llm

# Create necessary directories
RUN mkdir -p /llm/app/data/raw /llm/app/data/ppt /llm/app/data/processed

# Make scripts executable
RUN chmod +x /llm/entrypoint.sh

# Set environment variable
ENV NAME=llm

# Expose port 4000
EXPOSE 4000

