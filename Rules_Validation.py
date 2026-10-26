from datetime import datetime, date
from typing import Dict, Any

def validate_coi(extracted_data: dict, requirements: dict) -> dict:
    """
    Compares extracted COI data against client policy rules.
    """
    violations = []
    status = "COMPLIANT"

    # 1. Check Policy Expiration
    if extracted_data.get("gl_expiration_date"):
        exp_date = datetime.strptime(extracted_data["gl_expiration_date"], "%Y-%m-%d").date()
        today = date.today()
        
        if exp_date < today:
            violations.append(f"Policy expired on {exp_date}.")
            status = "NON_COMPLIANT"
        elif (exp_date - today).days <= 30:
            violations.append(f"Policy expiring soon (within {(exp_date - today).days} days).")
            # Remains compliant or set to 'EXPIRING_SOON' depending on rules
    else:
        violations.append("General liability expiration date is missing.")
        status = "FLAGGED_FOR_REVIEW"

    # 2. Check Liability Limits
    gl_limit = extracted_data.get("general_liability_limit") or 0
    required_gl = requirements.get("min_general_liability", 1_000_000)
    if gl_limit < required_gl:
        violations.append(f"Coverage limit (${gl_limit:,.0f}) is below the required ${required_gl:,.0f}.")
        status = "NON_COMPLIANT"

    # 3. Check Additional Insured & Subrogation Waiver
    if requirements.get("require_additional_insured") and not extracted_data.get("is_additional_insured_checked"):
        violations.append("Missing required 'Additional Insured' endorsement checkbox.")
        status = "NON_COMPLIANT"

    # 4. Check LLM Confidence / Flag
    if extracted_data.get("flagged_for_human_review") or extracted_data.get("confidence_score", 1.0) < 0.85:
        status = "FLAGGED_FOR_REVIEW"
        violations.append("Low extraction confidence or document flagged by AI.")

    return {
        "status": status,
        "violations": violations,
        "validated_at": datetime.now(datetime.UTC).isoformat()
    }

# Quick Test
if __name__ == "__main__":
    sample_extracted = {
        "gl_expiration_date": "2026-05-15",
        "general_liability_limit": 500000,
        "is_additional_insured_checked": False,
        "flagged_for_human_review": False,
        "confidence_score": 0.95
    }
    
    rules = {
        "min_general_liability": 1000000,
        "require_additional_insured": True
    }
    
    result = validate_coi(sample_extracted, rules)
    print("Verdict:", result)