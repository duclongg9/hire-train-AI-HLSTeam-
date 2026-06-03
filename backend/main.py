from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from app.api.routes import module1_router
from app.core.errors import AppError
from app.services.module1_service import get_module1_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[{settings.PROJECT_NAME}] Starting up...")
    service = get_module1_service()
    database_connected = service.check_database()
    if settings.STORAGE_PROVIDER == "mock":
        print("Running with mock storage. Supabase is not active.")
    elif settings.STORAGE_PROVIDER == "supabase" and database_connected:
        print("[DB] Connected to Supabase/PostgreSQL successfully.")
    elif settings.STORAGE_PROVIDER == "supabase":
        raise RuntimeError("STORAGE_PROVIDER=supabase but the database is unavailable.")
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Backend API for HireTrain AI — Intelligent Recruitment Platform "
        "using AWS AI Services, WebRTC Voice Interview, and AWS S3."
    ),
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(NotImplementedError)
async def not_implemented_handler(request: Request, exc: NotImplementedError):
    return JSONResponse(status_code=501, content={"detail": str(exc)})


@app.get("/")
def root():
    return {"service": settings.PROJECT_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    service = get_module1_service()
    database_connected = service.check_database()
    status = "ok"
    http_status = 200
    if settings.STORAGE_PROVIDER == "supabase" and not database_connected:
        status = "error"
        http_status = 503
    payload = {
        "status": status,
        "app_env": settings.APP_ENV,
        "storage_provider": settings.STORAGE_PROVIDER,
        "database_connected": database_connected,
        "ai_provider": settings.AI_PROVIDER,
        "interview_provider": settings.INTERVIEW_PROVIDER,
        "email_provider": settings.EMAIL_PROVIDER,
    }
    return JSONResponse(status_code=http_status, content=payload)


app.include_router(module1_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
