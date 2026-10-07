import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings:
    PROJECT_NAME: str = "ProcureAI - Intelligent Construction Procurement Management Platform"
    API_V1_STR: str = "/api"
    
    ROOT_DIR: Path = BASE_DIR
    MODELS_DIR: Path = BASE_DIR / "models"
    XGBOOST_DIR: Path = MODELS_DIR / "xgboost"
    XGBOOST_MODEL_PATH: Path = XGBOOST_DIR / "xgboost_procurement_model.pkl"
    XGBOOST_PREPROCESSOR_PATH: Path = XGBOOST_DIR / "procurement_preprocessor.pkl"

    RANDOM_FOREST_DIR: Path = MODELS_DIR / "random_forest"
    RANDOM_FOREST_MODEL_PATH: Path = RANDOM_FOREST_DIR / "random_forest_procurement_risk_final.pkl"
    RANDOM_FOREST_PREPROCESSOR_PATH: Path = RANDOM_FOREST_DIR / "random_forest_preprocessor_final.pkl"

    RAG_DIR: Path = MODELS_DIR / "rag"
    RAG_FAISS_INDEX: Path = RAG_DIR / "procurement_faiss.index"
    RAG_DOCUMENTS_PKL: Path = RAG_DIR / "enriched_rag_documents.pkl"
    RAG_EMBEDDINGS_NPY: Path = RAG_DIR / "procurement_embeddings.npy"
    RAG_EMBEDDING_MODEL_NAME_FILE: Path = RAG_DIR / "embedding_model_name.txt"

    AUDIT_LOG_FILE: Path = BASE_DIR / "procurement_audit_log.json"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./procurement.db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
