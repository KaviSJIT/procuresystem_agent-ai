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

        # 2. JSON File Record (Preserve existing file)
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
            
            existing_data.append(event_dict)
            
            with open(self.json_file_path, "w", encoding="utf-8") as f:
                json.dump(existing_data, f, indent=2)
        except Exception as ex:
            logger.error(f"Failed to update audit log file: {ex}")

        return event_dict

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
                            return [d for d in data if d.get("request_id") == request_id or d.get("tender_title") == request_id]
                        return data
                    elif isinstance(data, dict):
                        return [data]
            except Exception as e:
                logger.error(f"Failed to read audit log JSON: {e}")

        return []

audit_service = AuditService()
