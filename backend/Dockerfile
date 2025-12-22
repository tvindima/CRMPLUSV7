FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app
COPY scripts ./scripts
COPY alembic ./alembic
COPY alembic.ini ./
COPY fix_property_status.py ./
COPY start.sh ./

# Set execute permissions on startup script
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Startup command (executes migrations then starts server)
CMD ["./start.sh"]
