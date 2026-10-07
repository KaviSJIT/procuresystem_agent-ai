import os
import uuid
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.db.models import DocumentRecordDB
from app.core.logging_config import logger


def _extract_text(content: bytes, filename: str, file_type: str) -> tuple:
    """Extract text from uploaded file. Returns (text, extraction_method, error)."""
    fname_lower = filename.lower()

    # PDF extraction
    if fname_lower.endswith(".pdf") or "pdf" in file_type:
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages).strip()
            if not text:
                return "", "pdf_pypdf", "PDF parsed but no text extracted (may be scanned/image-based PDF)."
            return text, "pdf_pypdf", None
        except ImportError:
            pass
        try:
            import io
            import pdfminer.high_level
            text = pdfminer.high_level.extract_text(io.BytesIO(content))
            return text or "", "pdf_pdfminer", None if text else "pdfminer extracted empty text."
        except ImportError:
            return "", "pdf_unavailable", "PDF extraction requires 'pypdf' or 'pdfminer.six'. Install with: pip install pypdf"
        except Exception as e:
            return "", "pdf_error", str(e)

    # DOCX extraction
    if fname_lower.endswith(".docx") or "wordprocessingml" in file_type or "docx" in file_type:
        try:
            import io
            import docx
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            return text, "docx_python-docx", None
        except ImportError:
            return "", "docx_unavailable", "DOCX extraction requires 'python-docx'. Install with: pip install python-docx"
        except Exception as e:
            return "", "docx_error", str(e)

    # CSV
    if fname_lower.endswith(".csv") or "csv" in file_type:
        try:
            text = content.decode("utf-8", errors="ignore")
            return text, "csv_plain", None
        except Exception as e:
            return "", "csv_error", str(e)

    # Plain text fallback
    try:
        text = content.decode("utf-8", errors="ignore")
        return text, "plain_text", None
    except Exception as e:
        return "", "decode_error", str(e)


def _analyze_text(text: str) -> dict:
    """Analyze extracted text for procurement compliance indicators."""
    lower = text.lower()

    findings = {
        "eligibility": [],
        "financial": [],
        "technical": [],
        "compliance": [],
        "risk_indicators": [],
        "key_clauses": [],
        "penalties": [],
        "delivery_conditions": [],
        "termination_conditions": [],
    }

    # Eligibility
    if "registration" in lower or "license" in lower:
        findings["eligibility"].append("Contractor registration / license requirement detected.")
    if "experience" in lower or "work completion" in lower:
        findings["eligibility"].append("Prior work experience requirement detected.")
    if "turnover" in lower or "annual turn" in lower:
        findings["eligibility"].append("Annual turnover eligibility criterion detected.")

    # Financial
    if "emd" in lower or "earnest money" in lower:
        findings["financial"].append("Earnest Money Deposit (EMD) clause detected.")
    if "performance security" in lower or "performance guarantee" in lower:
        findings["financial"].append("Performance Security / Guarantee clause detected.")
    if "gst" in lower or "tax" in lower:
        findings["financial"].append("GST / Tax compliance clause detected.")
    if "payment" in lower:
        findings["financial"].append("Payment terms clause detected.")

    # Technical
    if "technical specification" in lower or "specification" in lower:
        findings["technical"].append("Technical specifications section detected.")
    if "quality" in lower or "inspection" in lower:
        findings["technical"].append("Quality inspection requirement detected.")
    if "bill of quantities" in lower or "boq" in lower:
        findings["technical"].append("Bill of Quantities (BOQ) detected.")

    # Compliance
    if "affidavit" in lower:
        findings["compliance"].append("Affidavit requirement detected.")
    if "pan" in lower:
        findings["compliance"].append("PAN card requirement detected.")
    if "epf" in lower or "provident fund" in lower:
        findings["compliance"].append("EPF / Provident Fund compliance detected.")

    # Risk indicators
    if "penalty" in lower or "liquidated damages" in lower:
        findings["risk_indicators"].append("Liquidated damages / penalty clause detected.")
    if "dispute" in lower or "arbitration" in lower:
        findings["risk_indicators"].append("Dispute resolution / arbitration clause detected.")
    if "force majeure" in lower:
        findings["risk_indicators"].append("Force majeure clause detected.")

    # Key clauses
    if "warranty" in lower or "guarantee" in lower:
        findings["key_clauses"].append("Warranty / guarantee clause detected.")
    if "defect liability" in lower or "defects" in lower:
        findings["key_clauses"].append("Defect liability period clause detected.")
    if "insurance" in lower:
        findings["key_clauses"].append("Insurance requirement clause detected.")

    # Penalties
    if "delay" in lower and ("penalty" in lower or "fine" in lower):
        findings["penalties"].append("Delay penalty clause detected.")
    if "0.5%" in lower or "1%" in lower:
        findings["penalties"].append("Percentage-based penalty rate detected.")

    # Delivery
    if "delivery" in lower or "completion" in lower:
        findings["delivery_conditions"].append("Delivery / completion timeline clause detected.")
    if "milestone" in lower:
        findings["delivery_conditions"].append("Milestone-based delivery schedule detected.")

    # Termination
    if "termination" in lower:
        findings["termination_conditions"].append("Termination clause detected.")
    if "blacklist" in lower or "debar" in lower:
        findings["termination_conditions"].append("Blacklisting / debarment clause detected.")

    # Missing items
    missing = []
    if not findings["financial"]:
        missing.append("No financial security (EMD/Performance Guarantee) clauses found.")
    if not findings["compliance"]:
        missing.append("No compliance documentation requirements (PAN/GST/EPF) found.")
    if not findings["technical"]:
        missing.append("No technical specifications or quality requirements found.")

    return {"findings": findings, "missing": missing}


class DocumentService:
    def process_document(self, db: Session, filename: str, content: bytes, file_type: str) -> dict:
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"

        # Step 1: Extract text
        extracted_text, extraction_method, extraction_error = _extract_text(content, filename, file_type)

        if extraction_error and not extracted_text:
            return {
                "document_id": doc_id,
                "filename": filename,
                "file_type": file_type,
                "extraction_method": extraction_method,
                "extraction_error": extraction_error,
                "summary": None,
                "compliance_issues": [],
                "extracted_snippet": "",
                "rag_evidence": None
            }

        # Step 2: Analyze text
        analysis = _analyze_text(extracted_text)

        # Step 3: RAG retrieval on document content
        rag_evidence = None
        try:
            from app.models.rag_service import rag_service
            if rag_service.is_loaded and extracted_text.strip():
                query = extracted_text[:500]  # Use first 500 chars as query
                rag_evidence = rag_service.search_procurement_knowledge(query, top_k=3)
        except Exception as e:
            logger.warning(f"RAG retrieval during document analysis failed: {e}")

        summary = {
            "total_characters": len(extracted_text),
            "total_words": len(extracted_text.split()),
            "extraction_method": extraction_method,
            "extraction_error": extraction_error,
            "findings_count": sum(len(v) for v in analysis["findings"].values()),
            "missing_count": len(analysis["missing"]),
            "processing_status": "ANALYZED"
        }

        compliance_issues = analysis["missing"]

        doc_record = DocumentRecordDB(
            id=doc_id,
            filename=filename,
            file_type=file_type,
            upload_time=datetime.datetime.utcnow(),
            extracted_text=extracted_text[:3000],
            summary=summary,
            compliance_issues=compliance_issues
        )
        db.add(doc_record)
        db.commit()

        return {
            "document_id": doc_id,
            "filename": filename,
            "file_type": file_type,
            "extraction_method": extraction_method,
            "extraction_error": extraction_error,
            "summary": summary,
            "findings": analysis["findings"],
            "compliance_issues": compliance_issues,
            "extracted_snippet": extracted_text[:600],
            "rag_evidence": rag_evidence
        }

document_service = DocumentService()
