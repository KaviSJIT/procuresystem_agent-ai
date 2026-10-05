from typing import Dict, Any, List
from app.core.logging_config import logger

class DocumentAgent:
    """
    Document Intelligence Agent
    Responsibilities:
    - analyze uploaded procurement documents
    - extract important information
    - identify missing information
    - identify compliance issues
    - summarize documents
    """
    def __init__(self):
        self.agent_name = "Document Intelligence Agent"

    def analyze_document(self, document_text: str, filename: str = "document.txt") -> dict:
        logger.info(f"[{self.agent_name}] Analyzing document: {filename}...")
        
        text_lower = document_text.lower()
        extracted_info = {
            "filename": filename,
            "char_count": len(document_text),
            "word_count": len(document_text.split()),
            "has_financial_cert": "annual turn over" in text_lower or "ca cert" in text_lower or "balance" in text_lower,
            "has_affidavit": "affidavit" in text_lower or "near relative" in text_lower,
            "has_technical_eval": "technical" in text_lower or "work experience" in text_lower
        }

        missing_info = []
        if not extracted_info["has_financial_cert"]:
            missing_info.append("CA Annual Turnover / Financial Audited Certificate")
        if not extracted_info["has_affidavit"]:
            missing_info.append("Affidavit regarding No Near Relative in Department")
        if not extracted_info["has_technical_eval"]:
            missing_info.append("Technical Capacity / Work Completion Certificates")

        compliance_status = "COMPLIANT" if len(missing_info) == 0 else "NON_COMPLIANT_MISSING_DOCS"

        return {
            "agent": self.agent_name,
            "filename": filename,
            "extracted_info": extracted_info,
            "missing_information": missing_info,
            "compliance_status": compliance_status,
            "summary": f"Analyzed {filename} ({len(document_text)} chars). Identified {len(missing_info)} missing required attachments."
        }

document_agent = DocumentAgent()
