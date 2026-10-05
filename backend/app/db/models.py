import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean
from app.db.database import Base

class ProcurementRequestDB(Base):
    __tablename__ = "procurement_requests"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    material_or_service = Column(String, nullable=True)
    quantity = Column(String, nullable=True)
    budget = Column(Float, nullable=False)
    required_date = Column(String, nullable=True)
    location = Column(String, nullable=True)
    supplier_requirements = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="PENDING_ANALYSIS")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SupplierDB(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)
    risk_score = Column(Float, default=0.0)
    reliability_score = Column(Float, default=0.0)
    total_tenders = Column(Integer, default=0)
    total_procurement_value = Column(Float, default=0.0)
    recommendation = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    procuring_entity_name = Column(String, nullable=True)

class ApprovalRequestDB(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, index=True)
    procurement_request_id = Column(String, index=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    procurement_request = Column(JSON, nullable=True)
    ai_recommendation = Column(JSON, nullable=True)
    risk_assessment = Column(JSON, nullable=True)
    rag_evidence = Column(JSON, nullable=True)
    agent_results = Column(JSON, nullable=True)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

class AuditEventDB(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, index=True)
    timestamp = Column(String, nullable=False)
    request_id = Column(String, index=True, nullable=True)
    agent = Column(String, nullable=False)
    action = Column(String, nullable=False)
    input_summary = Column(Text, nullable=True)
    output_summary = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    human_decision = Column(String, nullable=True)
    status = Column(String, nullable=False)

class DocumentRecordDB(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.datetime.utcnow)
    extracted_text = Column(Text, nullable=True)
    summary = Column(JSON, nullable=True)
    compliance_issues = Column(JSON, nullable=True)

class AgentRunLogDB(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String, index=True)
    agent_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    execution_time_ms = Column(Float, nullable=False)
    output_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
