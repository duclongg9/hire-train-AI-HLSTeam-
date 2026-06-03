"""
HireTrain AI — FastAPI Application Entry Point.

Sử dụng lifespan context manager (FastAPI 0.100+) thay cho
on_event deprecated để quản lý startup/shutdown.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from app.database.connection import check_db_connection
from app.api.v1 import campaigns, candidates, ai_core, interview


# ---------------------------------------------------------------------------
# Lifespan — Startup & Shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Chạy logic khởi tạo trước khi nhận request (startup),
    và dọn dẹp sau khi server tắt (shutdown).
    """
    # --- STARTUP ---
    print(f"[{settings.PROJECT_NAME}] Starting up...")
    db_ok = check_db_connection()
    if db_ok:
        print("[DB] ✅ Connected to AWS RDS PostgreSQL successfully.")
    else:
        print("[DB] ❌ WARNING: Could not connect to database. Check DATABASE_URL in .env")

    yield  # Server đang chạy, nhận request ở đây

    # --- SHUTDOWN ---
    print(f"[{settings.PROJECT_NAME}] Shutting down...")


# ---------------------------------------------------------------------------
# App Instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Backend API cho HireTrain AI — Hệ thống tuyển dụng thông minh "
        "sử dụng AWS AI Services, WebRTC Voice Interview và AWS S3."
        # TODO: AWS MIGRATION — description đã cập nhật phản ánh chuyển đổi sang AWS AI
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API Routers
# ---------------------------------------------------------------------------
app.include_router(
    campaigns.router,
    prefix=f"{settings.API_V1_STR}/campaigns",
    tags=["Campaigns"],
)
app.include_router(
    candidates.router,
    prefix=f"{settings.API_V1_STR}/candidates",
    tags=["Candidates"],
)
app.include_router(
    ai_core.router,
    prefix=f"{settings.API_V1_STR}/ai",
    tags=["AI Core"],
)
app.include_router(
    interview.router,
    prefix=f"{settings.API_V1_STR}/interview",
    tags=["Virtual Interview"],
)


# ---------------------------------------------------------------------------
# Health Check Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {"service": settings.PROJECT_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health_check():
    """Endpoint kiểm tra trạng thái server và database — dùng cho AWS ALB health check."""
    db_status = check_db_connection()
    return {
        "status": "healthy" if db_status else "degraded",
        "database": "connected" if db_status else "unreachable",
    }


# ---------------------------------------------------------------------------
# Dev Server Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
