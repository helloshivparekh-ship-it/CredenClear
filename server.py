from dotenv import load_dotenv
load_dotenv()
import os
import shutil
from datetime import datetime
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, BigInteger, Date, Boolean, Numeric, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from google import genai

# Import your extraction and validation routines
from batch_runner import parse_coi, validate_coi

# --- 1. Database Configuration ---
# Replace with your actual connection string from Neon / Supabase
# --- 1. Database Configuration ---
from dotenv import load_dotenv
load_dotenv() # This forces Python to read the .env file right now

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
client = genai.Client()

BUSINESS_RULES = {
    "min_general_liability": 1_000_000,
    "require_additional_insured": True
}

@app.post("/api/v1/certificates/upload")
@app.post("/api/upload") # Change this string to match what React is sending
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


@app.get("/api/v1/certificates")
def list_certificates(db: Session = Depends(get_db)):
    """Returns all processed certificates for the web dashboard."""
    return db.query(CertificateRecord).order_by(CertificateRecord.created_at.desc()).all()