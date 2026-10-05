import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings:
    PROJECT_NAME: str = "ProcureAI - Intelligent Construction Procurement Management Platform"
    API_V1_STR: str = "/api"
    
    ROOT_DIR: Path = BASE_DIR
    MODELS_DIR: Path = BASE_DIR / "models"
    XGBOOST_MODEL_PATH: Path = MODELS_DIR / "xgboost_procurement_final.pkl"
    XGBOOST_BASELINE_PATH: Path = MODELS_DIR / "xgboost_procurement_baseline.pkl"
    
    RAG_DIR: Path = MODELS_DIR / "rag"
    RAG_FAISS_INDEX: Path = RAG_DIR / "procurement_faiss.index"
    RAG_DOCUMENTS_PKL: Path = RAG_DIR / "rag_documents.pkl"
    RAG_DATAFRAME_PKL: Path = RAG_DIR / "rag_dataframe.pkl"
    RAG_EMBEDDING_CONFIG: Path = RAG_DIR / "embedding_config.json"
    
    QWEN_ADAPTER_DIR: Path = MODELS_DIR / "qwen_procurement_llm"
    QWEN_FIXED_ADAPTER_DIR: Path = MODELS_DIR / "qwen_procurement_llm_fixed"
    QWEN_BASE_MODEL: str = os.getenv("QWEN_BASE_MODEL", "")
    
    AUDIT_LOG_FILE: Path = BASE_DIR / "procurement_audit_log.json"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./procurement.db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
