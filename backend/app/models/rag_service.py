import os
import json
import joblib
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.logging_config import logger

class RAGService:
    def __init__(self):
        self.index = None
        self.documents = []
        self.dataframe = None
        self.embedder = None
        self.config = {}
        self.is_loaded = False
        self.load_error = None

    def load_rag(self):
        try:
            rag_dir = settings.RAG_DIR
            index_path = settings.RAG_FAISS_INDEX
            docs_path = settings.RAG_DOCUMENTS_PKL
            df_path = settings.RAG_DATAFRAME_PKL
            cfg_path = settings.RAG_EMBEDDING_CONFIG

            if not os.path.exists(index_path):
                raise FileNotFoundError(f"FAISS index missing at {index_path}")
            if not os.path.exists(docs_path):
                raise FileNotFoundError(f"RAG documents missing at {docs_path}")
            if not os.path.exists(df_path):
                raise FileNotFoundError(f"RAG dataframe missing at {df_path}")

            # Load config
            if os.path.exists(cfg_path):
                with open(cfg_path, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
            
            model_name = self.config.get("embedding_model_name", "sentence-transformers/all-MiniLM-L6-v2")
            
            logger.info(f"Loading FAISS index from {index_path}...")
            self.index = faiss.read_index(str(index_path))

            logger.info(f"Loading documents from {docs_path}...")
            with open(docs_path, "rb") as f:
                self.documents = joblib.load(f)

            logger.info(f"Loading dataframe from {df_path}...")
            self.dataframe = pd.read_pickle(str(df_path))

            logger.info(f"Loading SentenceTransformer embedder: {model_name}...")
            self.embedder = SentenceTransformer(model_name)

            self.is_loaded = True
            self.load_error = None
            logger.info(f"RAG Service successfully loaded. Total vectors: {self.index.ntotal}, Total docs: {len(self.documents)}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load RAG Service: {e}")

    def search_procurement_knowledge(self, query: str, top_k: int = 5) -> dict:
        if not self.is_loaded or self.index is None or self.embedder is None:
            raise RuntimeError(f"RAG service is not loaded. Error: {self.load_error}")
        
        # Compute embedding
        query_vector = self.embedder.encode([query], convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(query_vector)

        # Search index
        top_k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vector, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.documents):
                continue
            doc_text = self.documents[idx]
            
            # Extract actual metadata row from DataFrame if available
            metadata = {}
            if self.dataframe is not None and idx < len(self.dataframe):
                row = self.dataframe.iloc[idx].to_dict()
                metadata = {
                    "tender_title": str(row.get("tender_title", "")),
                    "tender_description": str(row.get("tender_description", "")),
                    "tender_mainProcurementCategory": str(row.get("tender_mainProcurementCategory", "")),
                    "tender_procurementMethod": str(row.get("tender_procurementMethod", "")),
                    "tender_value_amount": float(row.get("tender_value_amount", 0.0)) if pd.notnull(row.get("tender_value_amount")) else 0.0,
                    "tender_numberOfTenderers": float(row.get("tender_numberOfTenderers", 0.0)) if pd.notnull(row.get("tender_numberOfTenderers")) else 0.0,
                    "tender_procuringEntity_name": str(row.get("tender_procuringEntity_name", ""))
                }

            results.append({
                "doc_id": int(idx),
                "document": doc_text,
                "score": round(float(score), 4),
                "metadata": metadata
            })

        return {
            "query": query,
            "top_k": top_k,
            "results": results
        }

rag_service = RAGService()
