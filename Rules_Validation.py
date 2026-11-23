from datetime import datetime, date, timezone
from typing import Any


def validate_coi(extracted_data: dict[str, Any], requirements: dict[str, Any]) -> dict[str, Any]:
    """
    Compares extracted COI data against client policy rules.
    """
    violations: list[str] = []
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
        if status == "COMPLIANT":
            status = "FLAGGED_FOR_REVIEW"
        violations.append("Low extraction confidence or document flagged by AI.")

    return {
        "status": status,
        "violations": violations,
        "validated_at": datetime.now(timezone.utc).isoformat(),
    }


def _parse_currency(value: str | None) -> float | None:
    if not value:
        return None
    cleaned = value.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _days_until(date_str: str | None, today: date | None = None) -> int | None:
    if not date_str:
        return None
    ref_date = today or date.today()
    try:
        exp = datetime.strptime(date_str, "%Y-%m-%d").date()
        return (exp - ref_date).days
    except ValueError:
        return None


def validate_extraction(
    payload: dict[str, Any],
    min_cargo_limit: float = 100_000.0,
    max_cargo_deductible: float = 5_000.0,
    alert_window_days: int = 30,
) -> dict[str, Any]:
    """
    Validates structured extraction payloads including Motor Truck Cargo and policy expirations.
    """
    data = payload.get("extracted_data", {})
    policies = data.get("policies", {})
    cargo = policies.get("motor_truck_cargo") or {}

    flags: list[str] = []
    expiring_soon: list[dict[str, Any]] = []

    cargo_limit_val = _parse_currency(cargo.get("cargo_limit"))
    if cargo_limit_val is not None and cargo_limit_val < min_cargo_limit:
        flags.append(f"CARGO_LIMIT_BELOW_MIN ({cargo.get('cargo_limit')} < ${min_cargo_limit:,.0f})")

    deductible_val = _parse_currency(cargo.get("deductible"))
    if deductible_val is not None and deductible_val > max_cargo_deductible:
        flags.append(f"CARGO_DEDUCTIBLE_ABOVE_MAX ({cargo.get('deductible')} > ${max_cargo_deductible:,.0f})")

    if cargo.get("status") and str(cargo.get("status")).upper() != "ACTIVE":
        flags.append(f"CARGO_POLICY_INACTIVE ({cargo.get('status')})")

    for policy_name, policy_obj in policies.items():
        if not isinstance(policy_obj, dict):
            continue
        days_left = _days_until(policy_obj.get("expiration_date"))
        if days_left is not None and days_left <= alert_window_days:
            expiring_soon.append({
                "policy": policy_name,
                "policy_number": policy_obj.get("policy_number"),
                "expiration_date": policy_obj.get("expiration_date"),
                "days_remaining": days_left,
            })

    return {
        "passed": len(flags) == 0,
        "flags": flags,
        "expiring_soon": expiring_soon,
    }


if __name__ == "__main__":
    sample_extracted = {
        "gl_expiration_date": "2026-05-15",
        "general_liability_limit": 500000,
        "is_additional_insured_checked": False,
        "flagged_for_human_review": False,
        "confidence_score": 0.95,
    }

    rules = {
        "min_general_liability": 1000000,
        "require_additional_insured": True,
    }

    result = validate_coi(sample_extracted, rules)
    print("Verdict:", result)