import os
import glob
import time
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any

import pymupdf
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# ---------------------------------------------------------
# 1. Pydantic Extraction Schema (Unchanged)
# ---------------------------------------------------------
class COIExtraction(BaseModel):
    producer_name: Optional[str] = Field(None, description="Name/agency issuing the certificate")
    insured_name: Optional[str] = Field(None, description="Name of the insured business/contractor")
    has_general_liability: bool = Field(False, description="Is Commercial General Liability present?")
    general_liability_limit: Optional[int] = Field(None, description="Each Occurrence limit as a whole integer")
    gl_expiration_date: Optional[str] = Field(None, description="GL Expiration date in YYYY-MM-DD format")
    is_additional_insured_checked: bool = Field(False, description="Is ADDL INSR checked for GL?")
    is_subrogation_waived: bool = Field(False, description="Is SUBR WVD checked for GL?")
    has_workers_comp: bool = Field(False, description="Is Workers Compensation present?")
    confidence_score: float = Field(description="Confidence from 0.0 to 1.0")
    flagged_for_human_review: bool = Field(description="True if blurry, illegible, or unusual")

# ---------------------------------------------------------
# 2. PDF to Image Bytes
# ---------------------------------------------------------
def pdf_to_image_bytes(pdf_path: str) -> bytes:
    doc = pymupdf.open(pdf_path) # Fixed fitz warning
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=150)
    return pix.tobytes("png")

# ---------------------------------------------------------
# 3. Vision Extraction Engine
# ---------------------------------------------------------
def parse_coi(client: genai.Client, pdf_path: str) -> COIExtraction:
    image_bytes = pdf_to_image_bytes(pdf_path)

    prompt = (
        "You are an expert commercial insurance compliance auditor. "
        "Examine this Certificate of Insurance (ACORD 25). "
        "Extract the fields strictly into the requested format. "
        "Inspect the tiny checkboxes for ADDL INSR and SUBR WVD carefully."
    )

    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-3.8-flash', 
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type='image/png')
                ],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': COIExtraction,
                    'temperature': 0.0
                }
            )
            return response.parsed
            
        except Exception as error:
            # If server is overloaded (503), wait and retry
            if "503" in str(error) and attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Waits 1s, then 2s, then 4s
                print(f"    ⚠️ Server busy (503). Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise error
# ---------------------------------------------------------
# 4. Validation & Rules Engine (Fixed Datetime Warning)
# ---------------------------------------------------------
def validate_coi(data: COIExtraction, rules: Dict[str, Any]) -> Dict[str, Any]:
    violations: List[str] = []
    status = "COMPLIANT"

    if data.gl_expiration_date:
        try:
            exp_date = datetime.strptime(data.gl_expiration_date, "%Y-%m-%d").date()
            today = date.today()
            if exp_date < today:
                violations.append(f"Policy expired on {exp_date}")
                status = "NON_COMPLIANT"
            elif (exp_date - today).days <= 30:
                violations.append(f"Policy expiring soon (within {(exp_date - today).days} days)")
        except ValueError:
            violations.append(f"Invalid date format: {data.gl_expiration_date}")
            status = "FLAGGED_FOR_REVIEW"
    else:
        violations.append("Missing GL expiration date")
        status = "FLAGGED_FOR_REVIEW"

    gl_limit = data.general_liability_limit or 0
    required_gl = rules.get("min_general_liability", 1_000_000)
    if gl_limit < required_gl:
        violations.append(f"GL limit (${gl_limit:,.0f}) is below required ${required_gl:,.0f}")
        status = "NON_COMPLIANT"

    if rules.get("require_additional_insured") and not data.is_additional_insured_checked:
        violations.append("Missing required 'Additional Insured' checkbox")
        status = "NON_COMPLIANT"

    if data.flagged_for_human_review or data.confidence_score < 0.85:
        status = "FLAGGED_FOR_REVIEW"
        violations.append("AI flagged document for manual check")

    return {
        "status": status,
        "violations": violations,
        "validated_at": datetime.now(timezone.utc).isoformat() # Fixed datetime warning
    }

# ---------------------------------------------------------
# 5. Batch Pipeline Execution
# ---------------------------------------------------------
def run_batch_test(folder_path: str = "test_data"):
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in '{folder_path}'! Please check your directory.")
        return

    # Automatically picks up the GEMINI_API_KEY environment variable
    client = genai.Client(os.getenv("GEMINI_API_KEY"))

    business_rules = {
        "min_general_liability": 1_000_000,
        "require_additional_insured": True
    }

    print(f"\nFound {len(pdf_files)} files. Starting batch processing...\n")
    print("=" * 80)

    for index, file_path in enumerate(pdf_files, start=1):
        filename = os.path.basename(file_path)
        print(f"[{index}/{len(pdf_files)}] Reading: {filename}")

        try:
            extracted = parse_coi(client, file_path)
            result = validate_coi(extracted, business_rules)

            status_symbol = "✅" if result["status"] == "COMPLIANT" else ("⚠️" if result["status"] == "FLAGGED_FOR_REVIEW" else "❌")
            print(f"    Insured:    {extracted.insured_name or 'Unknown'}")
            print(f"    GL Limit:   ${extracted.general_liability_limit or 0:,.0f}")
            print(f"    Exp Date:   {extracted.gl_expiration_date or 'N/A'}")
            print(f"    Addl Insr:  {'Yes' if extracted.is_additional_insured_checked else 'No'}")
            print(f"    Verdict:    {status_symbol} {result['status']}")
            
            if result["violations"]:
                print("    Issues:")
                for violation in result["violations"]:
                    print(f"      - {violation}")

        except Exception as error:
            print(f"    ❌ Failed to process file: {error}")

        print("-" * 80)

    print("\nBatch processing complete.")

if __name__ == "__main__":
    run_batch_test()