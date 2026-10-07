import os
import json
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging_config import logger
from app.db.models import AuditEventDB

class AuditService:
    def __init__(self):
        self.json_file_path = settings.AUDIT_LOG_FILE

    def log_event(
        self,
        db: Session,
        event_id: str,
        agent: str,
        action: str,
        input_summary: str,
        output_summary: str,
        confidence: Optional[float] = None,
        human_decision: Optional[str] = None,
        status: str = "COMPLETED",
        request_id: Optional[str] = None
    ) -> dict:
        timestamp_str = datetime.datetime.utcnow().isoformat()

        # 1. DB Audit Record
        db_event = AuditEventDB(
            event_id=event_id,
            timestamp=timestamp_str,
            request_id=request_id,
            agent=agent,
            action=action,
            input_summary=input_summary,
            output_summary=output_summary,
            confidence=confidence,
            human_decision=human_decision,
            status=status
        )
        db.add(db_event)
        db.commit()

        # 2. JSON File Record
        event_dict = {
            "event_id": event_id,
            "timestamp": timestamp_str,
            "request_id": request_id,
            "agent": agent,
            "action": action,
            "input_summary": input_summary,
            "output_summary": output_summary,
            "confidence": confidence,
            "human_decision": human_decision,
            "status": status
        }

        self._append_json_audit(event_dict)
        return event_dict

    def log_procurement_pipeline_audit(
        self,
        db: Session,
        tender_id: str,
        tender_value: float,
        predicted_award: float,
        award_difference: float,
        difference_percent: float,
        risk_level: str,
        risk_confidence: float,
        compliance_result: dict,
        recommendation: str,
        processing_time_sec: float,
        reviewer: str = "Pending Human Reviewer",
        approval_status: str = "PENDING"
    ) -> dict:
        """
        Record full procurement pipeline inference audit as required by Step 12.
        Records:
        - tender ID
        - timestamp
        - tender value
        - predicted award
        - award difference
        - risk level
        - risk confidence
        - compliance result
        - recommendation
        - reviewer
        - approval status
        - processing time
        """
        timestamp_str = datetime.datetime.utcnow().isoformat()

        checks_dict = compliance_result.get("checks", {})
        score = compliance_result.get("score", 4)
        total = compliance_result.get("total", 4)
        percentage = compliance_result.get("percentage", 100.0)

        pipeline_audit_entry = {
            "timestamp": timestamp_str,
            "system": "Agentic AI Procurement Management",
            "tender_id": tender_id,
            "tender": {
                "tender_value": float(tender_value),
                "predicted_award": float(predicted_award),
                "award_difference": float(award_difference),
                "difference_percent": float(difference_percent)
            },
            "risk": {
                "level": risk_level,
                "confidence": float(risk_confidence)
            },
            "compliance": {
                "checks": checks_dict,
                "score": score,
                "total": total,
                "percentage": percentage
            },
            "decision": {
                "recommendation": recommendation
            },
            "human_approval": {
                "reviewer": reviewer,
                "approval_status": approval_status,
                "review_timestamp": None,
                "tender_value": float(tender_value),
                "predicted_award": float(predicted_award),
                "risk_level": risk_level,
                "risk_confidence": float(risk_confidence),
                "compliance_score": score,
                "compliance_total": total,
                "recommendation": recommendation
            },
            "performance": {
                "processing_time_sec": float(round(processing_time_sec, 4))
            }
        }

        # 1. Also store summary event in SQLite for dashboard
        db_event = AuditEventDB(
            event_id=f"EVT-PIPELINE-{tender_id}",
            timestamp=timestamp_str,
            request_id=tender_id,
            agent="Pipeline Decision Engine",
            action="PROCUREMENT_ANALYSIS_COMPLETE",
            input_summary=f"Tender {tender_id} (₹{tender_value:,.2f}) evaluated through XGBoost, Random Forest, RAG, and Compliance.",
            output_summary=(
                f"Award: ₹{predicted_award:,.2f} ({difference_percent:+.1f}%) | "
                f"Risk: {risk_level} ({risk_confidence:.1f}% conf) | "
                f"Compliance: {score}/{total} ({percentage:.0f}%) | "
                f"Decision: {recommendation} | Time: {processing_time_sec:.3f}s"
            ),
            confidence=round(risk_confidence / 100.0, 4),
            human_decision=approval_status,
            status="COMPLETED"
        )
        db.add(db_event)
        db.commit()

        # 2. Append to JSON file
        self._append_json_audit(pipeline_audit_entry)
        return pipeline_audit_entry

    def update_human_decision_in_json(self, tender_id: str, reviewer: str, decision: str):
        """Update audit log JSON entry when human reviewer makes approval/rejection decision."""
        if not os.path.exists(self.json_file_path):
            return

        try:
            with open(self.json_file_path, "r", encoding="utf-8") as f:
                content = json.load(f)

            if isinstance(content, list):
                for item in reversed(content):
                    if item.get("tender_id") == tender_id or item.get("request_id") == tender_id:
                        if "human_approval" in item and isinstance(item["human_approval"], dict):
                            item["human_approval"]["reviewer"] = reviewer
                            item["human_approval"]["approval_status"] = decision
                            item["human_approval"]["review_timestamp"] = datetime.datetime.utcnow().isoformat()
                        break

                with open(self.json_file_path, "w", encoding="utf-8") as f:
                    json.dump(content, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not update human approval in JSON audit log: {e}")

    def _append_json_audit(self, entry: dict):
        try:
            existing_data = []
            if os.path.exists(self.json_file_path):
                with open(self.json_file_path, "r", encoding="utf-8") as f:
                    try:
                        content = json.load(f)
                        if isinstance(content, list):
                            existing_data = content
                        elif isinstance(content, dict):
                            existing_data = [content]
                    except Exception as e:
                        logger.warning(f"Could not parse existing audit log JSON: {e}")

            existing_data.append(entry)

            with open(self.json_file_path, "w", encoding="utf-8") as f:
                json.dump(existing_data, f, indent=2)
        except Exception as ex:
            logger.error(f"Failed to update audit log file: {ex}")

    def get_audit_logs(self, db: Session, request_id: Optional[str] = None) -> List[Dict[str, Any]]:
        # Read from DB first
        query = db.query(AuditEventDB)
        if request_id:
            query = query.filter(AuditEventDB.request_id == request_id)
        db_records = query.order_by(AuditEventDB.id.desc()).all()

        if db_records:
            return [
                {
                    "event_id": r.event_id,
                    "timestamp": r.timestamp,
                    "request_id": r.request_id,
                    "agent": r.agent,
                    "action": r.action,
                    "input_summary": r.input_summary,
                    "output_summary": r.output_summary,
                    "confidence": r.confidence,
                    "human_decision": r.human_decision,
                    "status": r.status
                }
                for r in db_records
            ]

        # Fallback to JSON file if DB records are empty
        if os.path.exists(self.json_file_path):
            try:
                with open(self.json_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        if request_id:
                            return [d for d in data if d.get("request_id") == request_id or d.get("tender_id") == request_id]
                        return data
                    elif isinstance(data, dict):
                        return [data]
            except Exception as e:
                logger.error(f"Failed to read audit log JSON: {e}")

        return []

audit_service = AuditService()
