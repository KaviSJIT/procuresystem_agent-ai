import os
import uuid
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.db.models import DocumentRecordDB
from app.core.logging_config import logger

class DocumentService:
    def process_document(self, db: Session, filename: str, content: bytes, file_type: str) -> dict:
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        
        # Plain text extraction attempt
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = f"[Binary Document Content: {filename}]"

        # Contract clause risk indicators & compliance analysis
        lower_text = extracted_text.lower()
        compliance_issues = []
        risks = []

        if "penalty" in lower_text or "liquidated damages" in lower_text:
            risks.append("Liquidated damages and penalty clause detected.")
        if "termination" in lower_text:
            risks.append("Immediate termination without prior notice clause found.")
        if "warranty" not in lower_text and "guarantee" not in lower_text:
            compliance_issues.append("Missing mandatory warranty/guarantee documentation.")
        if "gst" not in lower_text and "tax" not in lower_text:
            compliance_issues.append("Tax compliance/GST details missing.")

        summary = {
            "total_characters": len(extracted_text),
            "key_clauses_found": len(risks),
            "risks_identified": risks,
            "compliance_issues": compliance_issues,
            "processing_status": "ANALYZED"
        }

        doc_record = DocumentRecordDB(
            id=doc_id,
            filename=filename,
            file_type=file_type,
            upload_time=datetime.datetime.utcnow(),
            extracted_text=extracted_text[:2000],
            summary=summary,
            compliance_issues=compliance_issues
        )
        db.add(doc_record)
        db.commit()

        return {
            "document_id": doc_id,
            "filename": filename,
            "file_type": file_type,
            "summary": summary,
            "compliance_issues": compliance_issues,
            "extracted_snippet": extracted_text[:500]
        }

document_service = DocumentService()
