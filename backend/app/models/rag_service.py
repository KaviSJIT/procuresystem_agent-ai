import os
import joblib
import pandas as pd
import numpy as np
import faiss
from app.core.config import settings
from app.core.logging_config import logger

COMPLIANCE_CHECKS = [
    {
        "id": "pan",
        "name": "PAN",
        "description": "Permanent Account Number",
        "query": "Permanent Account Number PAN card tax compliance",
        "keywords": ["pan", "permanent account number", "income tax"]
    },
    {
        "id": "registration",
        "name": "Registration Certificate",
        "description": "Contractor / Vendor Registration Certificate",
        "query": "Contractor Registration Certificate enlistment department",
        "keywords": ["registration", "enlistment", "license", "certificate details-registration"]
    },
    {
        "id": "affidavit",
        "name": "Bid Affidavit",
        "description": "Bid Correctness & No Near Relative Affidavit",
        "query": "Bid Affidavit correctness of bid no near relative working in department",
        "keywords": ["affidavit", "no near relative", "correctness of bid", "earnest money deposit"]
    },
    {
        "id": "work_completion",
        "name": "Work Completion Certificate",
        "description": "Prior Work Completion / Experience Certificate",
        "query": "Work Completed Certificate Copies past experience",
        "keywords": ["work completion", "completed certificate", "work details-work completed", "prior experience"]
    }
]

class RAGService:
    def __init__(self):
        self.index = None
        self.dataframe = None
        self.documents = []
        self.embedder = None
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.is_loaded = False
        self.load_error = None

    def load_rag(self):
        """Load FAISS index, enriched documents, and SentenceTransformer once at startup."""
        try:
            index_path = settings.RAG_FAISS_INDEX
            docs_path = settings.RAG_DOCUMENTS_PKL
            name_file = settings.RAG_EMBEDDING_MODEL_NAME_FILE

            if not os.path.exists(index_path):
                raise FileNotFoundError(f"FAISS index missing at {index_path}")
            if not os.path.exists(docs_path):
                raise FileNotFoundError(f"RAG documents missing at {docs_path}")

            if os.path.exists(name_file):
                with open(name_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        self.embedding_model_name = content if "/" in content else f"sentence-transformers/{content}"

            logger.info(f"Loading FAISS index from {index_path}...")
            self.index = faiss.read_index(str(index_path))

            logger.info(f"Loading enriched RAG documents dataframe from {docs_path}...")
            loaded_docs = joblib.load(str(docs_path))
            if isinstance(loaded_docs, pd.DataFrame):
                self.dataframe = loaded_docs
                if "rag_text" in self.dataframe.columns:
                    self.documents = self.dataframe["rag_text"].fillna("").tolist()
                elif "combined_description" in self.dataframe.columns:
                    self.documents = self.dataframe["combined_description"].fillna("").tolist()
                else:
                    self.documents = [str(r) for r in self.dataframe.to_dict(orient="records")]
            elif isinstance(loaded_docs, list):
                self.documents = loaded_docs
                self.dataframe = pd.DataFrame({"rag_text": loaded_docs})

            logger.info(f"Loading SentenceTransformer embedder: {self.embedding_model_name}...")
            from sentence_transformers import SentenceTransformer
            self.embedder = SentenceTransformer(self.embedding_model_name)

            self.is_loaded = True
            self.load_error = None
            logger.info(
                f"RAG Service successfully loaded. Total vectors: {self.index.ntotal}, "
                f"Total docs: {len(self.documents)}, Model: {self.embedding_model_name}"
            )
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load RAG Service: {e}")

    def search_procurement_knowledge(self, query: str, top_k: int = 5) -> dict:
        """Search FAISS index using preloaded embeddings and model."""
        if not self.is_loaded or self.index is None or self.embedder is None:
            raise RuntimeError(f"RAG service is not loaded. Error: {self.load_error}")

        query_vector = self.embedder.encode([query], convert_to_numpy=True).astype("float32")

        top_k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vector, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.documents):
                continue
            doc_text = self.documents[idx]

            metadata = {}
            if self.dataframe is not None and idx < len(self.dataframe):
                row = self.dataframe.iloc[idx].to_dict()
                metadata = {
                    "tender_title": str(row.get("tender_title", "")),
                    "combined_description": str(row.get("combined_description", "")),
                    "tender_mainProcurementCategory": str(row.get("tender_mainProcurementCategory", "")),
                    "tender_procurementMethod": str(row.get("tender_procurementMethod", "")),
                    "tender_value_amount": float(row.get("tender_value_amount", 0.0)) if pd.notnull(row.get("tender_value_amount")) else 0.0,
                    "tender_numberOfTenderers": float(row.get("tender_numberOfTenderers", 0.0)) if pd.notnull(row.get("tender_numberOfTenderers")) else 0.0,
                    "tender_process": str(row.get("tender_process", "")),
                    "tender_contractType": str(row.get("tender_contractType", ""))
                }

            # Distance in IndexFlatL2: lower score means higher similarity
            similarity_score = round(float(1.0 / (1.0 + float(score))), 4)

            results.append({
                "doc_id": int(idx),
                "document": doc_text,
                "score": round(float(score), 4),
                "similarity": similarity_score,
                "metadata": metadata
            })

        return {
            "query": query,
            "top_k": top_k,
            "results": results
        }

    def retrieve_compliance_evidence(self, tender_data: dict = None, top_k: int = 5) -> dict:
        """
        Preserve Kaggle notebook compliance retrieval logic.
        Checks:
        1. Permanent Account Number (PAN)
        2. Registration Certificate
        3. Bid Affidavit
        4. Work Completion Certificate

        Returns Evidence Found or Requires Human Verification.
        """
        if not self.is_loaded or self.index is None or self.embedder is None:
            raise RuntimeError(f"RAG service is not loaded. Error: {self.load_error}")

        tender_desc = ""
        if tender_data:
            tender_desc = " ".join([
                str(tender_data.get("title", "")),
                str(tender_data.get("material_or_service", "")),
                str(tender_data.get("supplier_requirements", "")),
                str(tender_data.get("description", ""))
            ]).lower()

        checks_results = {}
        evidence_found_count = 0
        checks_details = []

        for check in COMPLIANCE_CHECKS:
            check_name = check["name"]
            # 1. Search FAISS knowledge base for evidence
            rag_hit = self.search_procurement_knowledge(check["query"], top_k=top_k)
            
            # Check if any retrieved document or query text exhibits keyword match
            found = False
            matched_evidence_snippet = ""

            # Check in RAG retrieved docs
            for hit in rag_hit.get("results", []):
                doc_str = hit["document"].lower()
                meta_desc = hit.get("metadata", {}).get("combined_description", "").lower()
                for kw in check["keywords"]:
                    if kw in doc_str or kw in meta_desc:
                        found = True
                        matched_evidence_snippet = hit["document"][:200]
                        break
                if found:
                    break

            # Check if directly present in user-provided tender request
            if not found and tender_desc:
                for kw in check["keywords"]:
                    if kw in tender_desc:
                        found = True
                        matched_evidence_snippet = f"Found in tender specifications: '{kw}'"
                        break

            status_label = "Evidence Found" if found else "Requires Human Verification"
            short_status = "FOUND" if found else "REQUIRES_VERIFICATION"
            checks_results[check_name] = short_status

            if found:
                evidence_found_count += 1

            checks_details.append({
                "check_id": check["id"],
                "name": check_name,
                "description": check["description"],
                "status": status_label,
                "evidence_found": found,
                "evidence_snippet": matched_evidence_snippet or "No explicit evidence found in top RAG matches"
            })

        score = evidence_found_count
        total = len(COMPLIANCE_CHECKS)
        percentage = round((score / total) * 100.0, 1)

        return {
            "checks": checks_results,
            "details": checks_details,
            "score": score,
            "total": total,
            "percentage": percentage,
            "evidence_status": "Evidence Found" if score == total else "Requires Human Verification",
            "disclaimer": (
                "Compliance percentage indicates evidence located in historical procurement knowledge base. "
                "It does not certify legal or contractual compliance. Human verification required."
            )
        }

rag_service = RAGService()
