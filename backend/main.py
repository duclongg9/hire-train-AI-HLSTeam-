from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from app.api.v1 import campaigns, candidates, ai_core

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API for HireTrain AI Monorepo",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(campaigns.router, prefix=settings.API_V1_STR + "/campaigns", tags=["campaigns"])
app.include_router(candidates.router, prefix=settings.API_V1_STR + "/candidates", tags=["candidates"])
app.include_router(ai_core.router, prefix=settings.API_V1_STR + "/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HireTrain AI Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
