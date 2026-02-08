FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for crawl4ai (playwright/chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg2 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN crawl4ai-setup  # Install browser for crawl4ai

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
