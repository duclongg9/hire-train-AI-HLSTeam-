FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=development \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    STORAGE_PROVIDER=mock \
    AI_PROVIDER=mock \
    INTERVIEW_PROVIDER=mock \
    EMAIL_PROVIDER=mock \
    BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; port=os.environ.get('API_PORT','8000'); urllib.request.urlopen(f'http://127.0.0.1:{port}/health', timeout=3).read()"

CMD ["sh", "-c", "exec python -m uvicorn main:app --host ${API_HOST:-0.0.0.0} --port ${API_PORT:-8000}"]
