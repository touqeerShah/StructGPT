# Use a super lightweight Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV C_FORCE_ROOT="true"

# Set working directory
WORKDIR /llm

# Copy application code
COPY . .

# Debug: List contents
RUN ls -l /llm

# Make entrypoint script executable
RUN chmod +x /llm/entrypoint-celery.sh

# Expose port
EXPOSE 4000

# Set entrypoint
ENTRYPOINT ["/llm/entrypoint-celery.sh"]
