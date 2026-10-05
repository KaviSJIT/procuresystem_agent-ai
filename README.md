# ProcureAI: Agentic AI Construction Procurement Intelligence System

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com)

**Research Project Prototype Title:**  
*“Agentic AI-Based Intelligent Procurement Management Framework for Construction Procurement”*

---

## Overview

ProcureAI is an end-to-end intelligent procurement management system powered by **REAL trained machine-learning and AI model artifacts**:
- **XGBoost Pipeline** (`models/xgboost_procurement_final.pkl`): Evaluates 14 features for supplier failure and procurement risk classification.
- **RAG & FAISS Knowledge Base** (`models/rag/procurement_faiss.index`, `rag_documents.pkl`, `rag_dataframe.pkl`): 4,790 indexed tender documents with 384-dimensional `sentence-transformers/all-MiniLM-L6-v2` query embeddings.
- **Qwen LoRA LLM Adapter** (`models/qwen_procurement_llm/`): PEFT LoRA adapter for structured recommendation generation.
- **Specialized Multi-Agent Orchestration**: Supplier Risk Agent, Document Intelligence Agent, Contract Analysis Agent, Recommendation Agent, Approval Agent.
- **Human-In-The-Loop (HITL) Approval Center**: Enables procurement officers to review AI reasoning, inspect RAG evidence, and approve/reject requests with audit logging.
- **Cryptographic Audit Trail**: Preserves and appends every event to `procurement_audit_log.json`.

---

## System Architecture

```
                         FRONTEND (React + Vite + Tailwind CSS)
                                    |
                                    v
                              FASTAPI API
                                    |
                                    v
                             ORCHESTRATOR
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
     XGBoost Agent              RAG Agent               Qwen LLM Agent
  (Risk Prediction)       (FAISS Vector Search)      (LoRA Adapter LLM)
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                                    v
                            PROCUREMENT AGENTS
                   (Supplier Risk, Contract, Recommendation)
                                    |
                                    v
                          RISK + RECOMMENDATION
                                    |
                                    v
                            HUMAN APPROVAL
                                    |
                         +----------+----------+
                         |                     |
                      APPROVE                REJECT
                         |                     |
                         v                     v
                Procurement Action       Return for Review
                         |
                         v
                      AUDIT LOG (procurement_audit_log.json)
                         |
                         v
                     EVALUATION
```

---

## Folder Structure

```
procuresystem/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint with model startup lifespan
│   │   ├── api/                        # REST API endpoints (procurement, approvals, suppliers, docs, audit, evaluation, system)
│   │   ├── agents/                     # Specialized Agents (supplier risk, document, contract, recommendation, approval, master)
│   │   ├── models/                     # Model Loaders (xgboost_service.py, rag_service.py, qwen_service.py)
│   │   ├── orchestrator/               # procurement_orchestrator.py
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   ├── services/                   # audit_service.py, document_service.py, evaluation_service.py
│   │   ├── db/                         # SQLAlchemy database models & SQLite session
│   │   └── core/                       # config.py, logging_config.py
│   ├── tests/                          # Backend unit & integration test suite (test_all_backend.py)
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Sidebar, Navbar, RiskBadge, StatusBadge, ApprovalModal
│   │   ├── pages/                      # Dashboard, NewProcurement, ProcurementAnalysis, SupplierManagement, ApprovalCenter, DocumentIntel, AuditTrail, Evaluation, Diagnostics
│   │   ├── services/                   # api.js (Axios client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── models/                             # REAL Trained Model Artifacts
│   ├── xgboost_procurement_final.pkl
│   ├── xgboost_procurement_baseline.pkl
│   ├── qwen_procurement_llm/
│   ├── qwen_procurement_llm_fixed/
│   └── rag/                            # procurement_faiss.index, rag_documents.pkl, rag_dataframe.pkl, embedding_config.json
│
├── procurement_audit_log.json          # Real Audit Log JSON Artifact
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Model Artifact Setup & Diagnostics

### 1. XGBoost Setup
- Model: `models/xgboost_procurement_final.pkl`
- Compatible Python packages: `scikit-learn==1.6.1` and `xgboost==2.1.4`.
- Evaluates 14 features: `tender_procurementMethod`, `tender_process`, `tender_mainProcurementCategory`, `tender_numberOfTenderers`, `tender_allowPreferentialBidder`, `tender_allowTwoStageBid`, `tender_value_amount`, `tender_evaluation_generalTechnicalEvaluationAllowed`, `tender_evaluation_itemWiseTechnicalEvaluationAllowed`, `tender_tenderPeriod_durationInDays`, `tender_contractPeriod_durationInDays`, `tender_procuringEntity_name`, `tender_classification_scheme`, `tender_value_currency`.

### 2. RAG FAISS Setup
- Directory: `models/rag/`
- FAISS Index: `procurement_faiss.index` (IndexFlatIP, 4,790 vectors, 384 dimensions)
- Documents & Dataframe: `rag_documents.pkl` (4,790 tender strings), `rag_dataframe.pkl` (4,790 records x 10 columns)
- Embedding model: `sentence-transformers/all-MiniLM-L6-v2`

### 3. Qwen LoRA Setup
- Adapter directory: `models/qwen_procurement_llm/`
- Base Model: Configured via environment variable `QWEN_BASE_MODEL` (e.g., `Qwen/Qwen2.5-7B-Instruct`).
- If `QWEN_BASE_MODEL` is unconfigured, the application reports Qwen status as `Base model configuration required` transparently without generating fake mock LLM outputs.

---

## Installation & Quick Start

### Backend Startup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install requirements
pip install -r requirements.txt

# 3. Run backend unit tests
python tests/test_all_backend.py

# 4. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check Endpoint:** `http://localhost:8000/health`
- **System Model Diagnostics:** `http://localhost:8000/api/system/models`

### Frontend Startup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start React Vite development server
npm run dev
```
- **Frontend Dashboard UI:** `http://localhost:5173`

---

## Complete Demo Workflow Walkthrough

1. **Open ProcureAI Dashboard**: Navigate to `http://localhost:5173`. Verify system status indicator in the top navbar.
2. **Click "New Procurement"**:
   - Title: `Construction Steel Procurement`
   - Category: `works`
   - Material/Service: `100 tons Structural Steel`
   - Quantity: `100 tons`
   - Budget: `₹50,00,000`
   - Required Timeline: `30 days`
   - Location: `Chennai`
   - Supplier Requirements: `Find reliable suppliers with low procurement and delivery risk.`
   - Description: `Procurement of 100 tons high-grade structural construction steel for HP PWD building project.`
3. **Submit Requirement**:
   - Backend creates `ProcurementRequest` (ID e.g. `REQ-D8BBEF5D`).
   - **XGBoost Agent** computes real risk score (`0.1722`, `LOW RISK`).
   - **RAG Agent** performs FAISS L2 L2 normalized similarity search retrieving top-5 historical tenders.
   - **Specialized Multi-Agent Framework** generates multi-agent recommendation with confidence score (`79%`).
   - **Approval Agent** triggers Human-in-the-Loop review based on budget and risk rules.
4. **Review in Approval Center**:
   - Open **Approval Center** page (`http://localhost:5173/approvals`).
   - Click **"View & Review"** on the pending request.
   - Inspect XGBoost 14-feature prediction, RAG FAISS evidence cards, agent outputs, and confidence score.
   - Enter decision notes and click **"Approve Procurement"** or **"Reject & Return"**.
5. **Inspect Audit Trail & Evaluation**:
   - Open **Audit Trail** page (`http://localhost:5173/audit`) to view step-by-step timestamped execution log.
   - Open **Evaluation Dashboard** (`http://localhost:5173/evaluation`) to view comparative performance metrics (Conventional vs Rule-Based vs Agentic AI).
