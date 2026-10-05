from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.document_service import document_service
from app.agents.document_agent import document_agent

router = APIRouter(prefix="/api/documents", tags=["Document Intelligence"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    filename = file.filename or "uploaded_doc.txt"
    file_type = file.content_type or "text/plain"

    result = document_service.process_document(db, filename, content, file_type)
    return result

@router.post("/analyze")
def analyze_document_text(payload: dict = Body(...)):
    document_text = payload.get("text", "")
    filename = payload.get("filename", "procurement_doc.txt")
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text cannot be empty")

    analysis = document_agent.analyze_document(document_text, filename)
    return analysis
