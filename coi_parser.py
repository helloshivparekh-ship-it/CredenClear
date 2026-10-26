import os
import pymupdf # Replaced fitz
from pydantic import BaseModel, Field
from typing import Optional

# 1. Import Google GenAI instead of OpenAI
from google import genai
from google.genai import types

# 1. Define the Strict Schema Blueprint
class COIExtraction(BaseModel):
    producer_name: str = Field(description="Name and address of the insurance agency/producer issuing the certificate")
    insured_name: str = Field(description="Name of the insured company or contractor")
    
    # General Liability
    has_general_liability: bool = Field(description="Is Commercial General Liability checked?")
    general_liability_limit: Optional[int] = Field(description="The 'Each Occurrence' limit as a raw integer (e.g., 1000000). Null if not found.")
    gl_expiration_date: Optional[str] = Field(description="Expiration date of the General Liability policy in YYYY-MM-DD format")
    is_additional_insured_checked: bool = Field(description="Is the 'ADDL INSR' box checked for General Liability?")
    is_subrogation_waived: bool = Field(description="Is the 'SUBR WVD' box checked for General Liability?")
    
    # Workers Compensation
    has_workers_comp: bool = Field(description="Is there a Workers Compensation policy listed?")
    wc_statutory_limits: bool = Field(description="Is the 'WC STATUTORY LIMITS' box checked?")
    
    # Metadata
    confidence_score: float = Field(description="Your confidence score from 0.0 to 1.0 on the accuracy of this extraction")
    flagged_for_human_review: bool = Field(description="Set to true if the text is blurry, handwritten, or confusing")

# 2. Convert PDF to Image (Gemini prefers raw bytes instead of base64)
def pdf_to_image_bytes(pdf_path: str) -> bytes:
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)  # COIs are typically 1 page
    pix = page.get_pixmap(dpi=150)
    return pix.tobytes("png")

# 3. The Core Extraction Engine
def parse_coi(client: genai.Client, pdf_path: str) -> COIExtraction:
    image_bytes = pdf_to_image_bytes(pdf_path)

    prompt = (
        "You are an expert commercial insurance compliance officer. "
        "Examine this Certificate of Insurance (ACORD 25 form). "
        "Extract the requested fields accurately. Pay extreme attention to the tiny checkboxes "
        "under ADDL INSR and SUBR WVD, as they are critical for legal compliance."
    )

    # Use Gemini's structured output to enforce the Pydantic schema
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