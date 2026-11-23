import os
import re
import smtplib
from datetime import date, datetime
from email.message import EmailMessage
from typing import Any
from urllib.request import Request, urlopen

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "compliance@credenclear.com")
ALERT_DRY_RUN = os.getenv("ALERT_DRY_RUN", "true").lower() == "true"

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")


def find_expiring_policies(
    extracted_payload: dict[str, Any],
    warning_days: int = 30,
) -> list[dict[str, Any]]:
    """Return all policies that are expired or expiring within `warning_days`."""
    policies = extracted_payload.get("extracted_data", {}).get("policies", {})
    today = date.today()
    alerts: list[dict[str, Any]] = []

    for policy_type, details in policies.items():
        exp_str = details.get("expiration_date")
        if not exp_str:
            continue

        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        days_left = (exp_date - today).days
        if days_left <= warning_days:
            alerts.append(
                {
                    "policy_type": policy_type.replace("_", " ").title(),
                    "policy_number": details.get("policy_number", "N/A"),
                    "expiration_date": exp_str,
                    "days_remaining": days_left,
                    "status": "EXPIRED" if days_left < 0 else "EXPIRING_SOON",
                }
            )

    return alerts


def lookup_contact_email_online(company_name: str, website_url: str | None = None) -> dict[str, Any]:
    """
    Fallback contact lookup when COI has no producer/insured email.
    If `website_url` is provided, scrapes public contact emails from the page.
    Otherwise returns a structured lookup suggestion ready for an enrichment API (e.g. Hunter/Apollo).
    """
    if website_url:
        try:
            req = Request(website_url, headers={"User-Agent": "CredenClearBot/1.0"})
            with urlopen(req, timeout=5) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            matches = sorted(set(EMAIL_REGEX.findall(html)))
            # Filter out common non-contact image/asset false positives
            valid = [m for m in matches if not m.lower().endswith((".png", ".jpg", ".svg", ".webp"))]
            if valid:
                return {
                    "email": valid[0],
                    "source": f"website_scrape:{website_url}",
                    "candidates": valid[:5],
                }
        except Exception as err:
            return {"email": None, "source": "website_scrape_failed", "error": str(err)}

    # Fallback: generate a clean domain guess for manual review or enrichment API
    slug = re.sub(r"[^a-z0-9]", "", company_name.lower().split(" ")[0])
    return {
        "email": None,
        "source": "lookup_required",
        "suggested_query": f'"{company_name}" insurance certificates email',
        "suggested_fallback": f"certs@{slug}.com" if slug else None,
    }


def resolve_recipient_email(extracted_payload: dict[str, Any], website_url: str | None = None) -> dict[str, Any]:
    """Pick producer_email -> insured_email -> online lookup fallback."""
    data = extracted_payload.get("extracted_data", {})

    if data.get("producer_email"):
        return {"email": data["producer_email"], "source": "coi_producer_email"}
    if data.get("insured_email"):
        return {"email": data["insured_email"], "source": "coi_insured_email"}

    company = data.get("producer_name") or data.get("insured_name") or ""
    if not company:
        return {"email": None, "source": "missing_company_name"}

    return lookup_contact_email_online(company, website_url=website_url)


def build_alert_email(
    insured_name: str,
    recipient_email: str,
    expiring_policies: list[dict[str, Any]],
) -> dict[str, str]:
    """Build subject and plain-text body for a COI renewal request."""
    lines = [
        f"Hello,",
        "",
        f"Our compliance system flagged the following insurance policies for {insured_name} that require renewal:",
        "",
    ]
    for p in expiring_policies:
        tag = "EXPIRED" if p["days_remaining"] < 0 else f"Expires in {p['days_remaining']} days"
        lines.append(
            f"- {p['policy_type']} (Policy #{p['policy_number']}): {p['expiration_date']} [{tag}]"
        )

    lines.extend(
        [
            "",
            "Please reply with an updated ACORD 25 Certificate of Insurance at your earliest convenience.",
            "",
            "Thank you,",
            "CredenClear Compliance Team",
        ]
    )

    return {
        "to": recipient_email,
        "subject": f"Action Required: COI Renewal Needed for {insured_name}",
        "body": "\n".join(lines),
    }


def process_expiration_alert(
    extracted_payload: dict[str, Any],
    warning_days: int = 30,
    website_url: str | None = None,
) -> dict[str, Any]:
    """End-to-end check: find expiring policies, resolve contact email, and send (or dry-run) alert."""
    expiring = find_expiring_policies(extracted_payload, warning_days=warning_days)
    if not expiring:
        return {"alert_needed": False, "expiring_policies": []}

    insured_name = extracted_payload.get("extracted_data", {}).get("insured_name", "Unknown Insured")
    contact = resolve_recipient_email(extracted_payload, website_url=website_url)

    if not contact.get("email"):
        return {
            "alert_needed": True,
            "sent": False,
            "reason": "no_recipient_email_found",
            "contact_lookup": contact,
            "expiring_policies": expiring,
        }

    email_draft = build_alert_email(insured_name, contact["email"], expiring)

    if ALERT_DRY_RUN or not SMTP_HOST:
        return {
            "alert_needed": True,
            "sent": False,
            "dry_run": True,
            "contact_lookup": contact,
            "email_draft": email_draft,
            "expiring_policies": expiring,
        }

    msg = EmailMessage()
    msg["Subject"] = email_draft["subject"]
    msg["From"] = FROM_EMAIL
    msg["To"] = email_draft["to"]
    msg.set_content(email_draft["body"])

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

    return {
        "alert_needed": True,
        "sent": True,
        "dry_run": False,
        "contact_lookup": contact,
        "expiring_policies": expiring,
    }


if __name__ == "__main__":
    sample_payload = {
        "extracted_data": {
            "producer_name": "Apex Insurance Brokers LLC",
            "producer_email": None,
            "insured_name": "Swift Transport & Logistics Inc",
            "insured_email": None,
            "policies": {
                "general_liability": {
                    "policy_number": "GL-9982341-26",
                    "expiration_date": "2026-12-05",
                },
                "motor_truck_cargo": {
                    "policy_number": "MTC-8832104-26",
                    "expiration_date": "2026-11-01",
                },
            },
        }
    }

    result = process_expiration_alert(sample_payload, warning_days=30)
    print("Alert Result:", result)