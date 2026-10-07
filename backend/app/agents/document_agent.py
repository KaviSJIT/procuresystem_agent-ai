from typing import Dict, Any
from app.core.logging_config import logger
from app.services.document_service import _analyze_text


class DocumentAgent:
    """
    Document Intelligence Agent
    Analyzes procurement document text using keyword-based extraction.
    Connects to RAG for similar historical tender evidence.
    """
    def __init__(self):
        self.agent_name = "Document Intelligence Agent"

    def analyze_document(self, document_text: str, filename: str = "document.txt") -> dict:
        logger.info(f"[{self.agent_name}] Analyzing document: {filename}...")

        if not document_text or not document_text.strip():
            return {
                "agent": self.agent_name,
                "filename": filename,
                "error": "Empty document text provided.",
                "findings": {},
                "missing_information": [],
                "compliance_status": "ERROR",
                "summary": "No text to analyze."
            }

        analysis = _analyze_text(document_text)

        # RAG retrieval
        rag_evidence = None
        try:
            from app.models.rag_service import rag_service
            if rag_service.is_loaded:
                query = document_text[:400]
                rag_evidence = rag_service.search_procurement_knowledge(query, top_k=3)
        except Exception as e:
            logger.warning(f"RAG retrieval in document agent failed: {e}")

        compliance_status = "COMPLIANT" if not analysis["missing"] else "NON_COMPLIANT"

        return {
            "agent": self.agent_name,
            "filename": filename,
            "char_count": len(document_text),
            "word_count": len(document_text.split()),
            "findings": analysis["findings"],
            "missing_information": analysis["missing"],
            "compliance_status": compliance_status,
            "rag_evidence": rag_evidence,
            "summary": (
                f"Analyzed {filename} ({len(document_text)} chars, {len(document_text.split())} words). "
                f"Found {sum(len(v) for v in analysis['findings'].values())} procurement indicators. "
                f"{len(analysis['missing'])} missing compliance items."
            )
        }


document_agent = DocumentAgent()
