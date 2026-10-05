from fastapi import APIRouter
from app.models.xgboost_service import xgboost_service
from app.models.rag_service import rag_service
from app.models.qwen_service import qwen_service

router = APIRouter(tags=["System & Diagnostics"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "models": {
            "xgboost": xgboost_service.is_loaded,
            "rag": rag_service.is_loaded,
            "qwen": qwen_service.is_loaded
        }
    }

@router.get("/api/system/models")
def get_system_models_diagnostics():
    return {
        "xgboost_final": {
            "available": os_path_exists(xgboost_service.model is not None),
            "loaded": xgboost_service.is_loaded,
            "error": xgboost_service.load_error,
            "features_count": len(xgboost_service.feature_names)
        },
        "xgboost_baseline": {
            "available": xgboost_service.baseline_model is not None,
            "loaded": xgboost_service.baseline_model is not None
        },
        "rag_faiss": {
            "available": rag_service.is_loaded,
            "loaded": rag_service.is_loaded,
            "documents": len(rag_service.documents) if rag_service.is_loaded else 0,
            "dimension": rag_service.index.d if (rag_service.is_loaded and rag_service.index) else 384,
            "vectors": rag_service.index.ntotal if (rag_service.is_loaded and rag_service.index) else 0
        },
        "qwen_adapter": {
            "available": qwen_service.adapter_dir.exists(),
            "loaded": qwen_service.is_loaded,
            "base_model": qwen_service.base_model_name or None,
            "reason": qwen_service.load_error or ("Loaded" if qwen_service.is_loaded else "Base model not configured")
        }
    }

def os_path_exists(cond):
    return bool(cond)
