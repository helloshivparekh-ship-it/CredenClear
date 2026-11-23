from dotenv import load_dotenv
load_dotenv()

import os
import shutil
import time
from datetime import datetime
from typing import Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, BigInteger, Date, Boolean, Numeric, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from google import genai

# Import your extraction and validation routines
from batch_runner import parse_coi, validate_coi
from Rules_Validation import validate_extraction
from expiration_alerts import process_expiration_alert

# --- 1. Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CertificateRecord(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    producer_name = Column(String(255))
    insured_name = Column(String(255))
    gl_limit = Column(BigInteger)
    gl_expiration_date = Column(Date)
    has_additional_insured = Column(Boolean, default=False)
    has_subrogation_waived = Column(Boolean, default=False)
    compliance_status = Column(String(50), nullable=False)
    violations = Column(JSONB, default=[])
    confidence_score = Column(Numeric(3, 2))
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 2. FastAPI Application ---
app = FastAPI(title="CredenClear API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client()

BUSINESS_RULES = {
    "min_general_liability": 1_000_000,
    "require_additional_insured": True
}

USE_MOCK_EXTRACTION = os.getenv("USE_MOCK_EXTRACTION", "true").lower() == "true"


def _mock_extract_payload(filename: str) -> dict[str, Any]:
    return {
        "status": "success",
        "source_file": filename,
        "latency_ms": 385,
        "confidence_score": 0.979,
        "document_type": "ACORD_25_WITH_CARGO",
        "extracted_data": {
            "producer_name": "Apex Insurance Brokers LLC",
            "producer_email": None,
            "insured_name": "Swift Transport & Logistics Inc",
            "insured_email": None,
            "policies": {
                "general_liability": {
                    "policy_number": "GL-9982341-26",
                    "expiration_date": "2027-06-15",
                    "addl_insr": True,
                    "subr_wvd": True,
                    "limits": {
                        "each_occurrence": "$1,000,000",
                        "damage_to_rented_premises": "$300,000",
                        "general_aggregate": "$2,000,000",
                    },
                },
                "automobile_liability": {
                    "policy_number": "AL-5541209-26",
                    "expiration_date": "2027-06-15",
                    "any_auto": True,
                    "combined_single_limit": "$1,000,000",
                },
                "motor_truck_cargo": {
                    "policy_number": "MTC-8832104-26",
                    "expiration_date": "2027-04-01",
                    "cargo_limit": "$100,000",
                    "deductible": "$1,000",
                    "reefer_exclusion": False,
                    "status": "ACTIVE",
                },
            },
            "certificate_holder": "Global Freight Logistics Inc. 500 Market St, Chicago IL",
        },
    }


@app.post("/api/v1/certificates/upload")
@app.post("/api/upload")
async def upload_certificate(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    temp_path = f"temp_{file.filename}"
    try:
        # Save file to disk temporarily
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Run AI Extraction
        extracted = parse_coi(client, temp_path)

        # 2. Run Policy Validation
        verdict = validate_coi(extracted, BUSINESS_RULES)

        # 3. Save Record to Database
        exp_date = (
            datetime.strptime(extracted.gl_expiration_date, "%Y-%m-%d").date()
            if extracted.gl_expiration_date
            else None
        )

        record = CertificateRecord(
            file_name=file.filename,
            producer_name=extracted.producer_name,
            insured_name=extracted.insured_name,
            gl_limit=extracted.general_liability_limit,
            gl_expiration_date=exp_date,
            has_additional_insured=extracted.is_additional_insured_checked,
            has_subrogation_waived=extracted.is_subrogation_waived,
            compliance_status=verdict["status"],
            violations=verdict["violations"],
            confidence_score=extracted.confidence_score
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "status": "success",
            "record_id": record.id,
            "insured_name": record.insured_name,
            "verdict": verdict["status"],
            "violations": verdict["violations"]
        }

    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/v1/extract")
async def extract_coi(file: UploadFile = File(...)) -> dict[str, Any]:
    start_time = time.perf_counter()

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if USE_MOCK_EXTRACTION:
        payload = _mock_extract_payload(file.filename)
    else:
        # TODO: Wire in Google Cloud Document AI once billing is active
        raise HTTPException(
            status_code=503,
            detail="Document AI extraction is not active yet. Set USE_MOCK_EXTRACTION=true to test.",
        )

    payload["latency_ms"] = round((time.perf_counter() - start_time) * 1000)
    payload["validation"] = validate_extraction(payload)
    payload["alert_status"] = process_expiration_alert(payload)
    return payload


@app.get("/api/v1/certificates")
def list_certificates(db: Session = Depends(get_db)):
    """Returns all processed certificates for the web dashboard."""
    return db.query(CertificateRecord).order_by(CertificateRecord.created_at.desc()).all()