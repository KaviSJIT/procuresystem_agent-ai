import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import logger
from app.db.database import engine, Base
from app.models.xgboost_service import xgboost_service
from app.models.rag_service import rag_service
from app.models.qwen_service import qwen_service
from app.api import procurement, approval, suppliers, documents, evaluation, audit, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info("  STARTING PROCUREAI FASTAPI BACKEND SERVER       ")
    logger.info("==================================================")
    
    # 1. Create SQLite DB tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # 2. Load XGBoost Model Once
    logger.info("Loading XGBoost Model...")
    xgboost_service.load_models()

    # 3. Load RAG FAISS Index & Documents Once
    logger.info("Loading RAG Knowledge Base & FAISS Index...")
    rag_service.load_rag()

    # 4. Check Qwen LoRA Adapter & Base Model
    logger.info("Inspecting Qwen LoRA LLM Adapter...")
    qwen_service.load_qwen()

    logger.info("==================================================")
    logger.info("  PROCUREAI BACKEND READY AND OPERATIONAL         ")
    logger.info("==================================================")
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI-Based Intelligent Procurement Management Framework for Construction Procurement",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(system.router)
app.include_router(procurement.router)
app.include_router(approval.router)
app.include_router(suppliers.router)
app.include_router(documents.router)
app.include_router(audit.router)
app.include_router(evaluation.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
