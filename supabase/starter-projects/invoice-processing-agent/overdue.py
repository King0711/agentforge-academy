"""
Step 3 of the Invoice Processing Agent - alerts Slack when an invoice's
due date has passed.
"""

from datetime import date

import requests


def is_overdue(due_date_str, today=None):
    """
    Returns True if due_date_str (YYYY-MM-DD) is before today.

        is_overdue("2026-01-01", today=date(2026, 9, 2)) -> True

    Pure function - tested below with a fixed `today` so the test never
    depends on what day it happens to run.

    A blank or unparseable due_date is treated as NOT overdue rather
    than raising - an invoice missing its due date is already flagged
    by validate()'s needs_review, and shouldn't ALSO trigger a false
    overdue alert on top of that.
    """
    if not due_date_str:
        return False
    try:
        due = date.fromisoformat(due_date_str)
    except ValueError:
        return False
    today = today or date.today()
    return due < today


def build_alert_message(data):
    """Pure function - the exact Slack message text for one overdue invoice."""
    return (
        f"Invoice {data.get('invoice_number', '(unknown)')} from "
        f"{data.get('vendor_name', '(unknown vendor)')} is overdue "
        f"(was due {data.get('due_date', '(unknown)')}), total: "
        f"{data.get('currency', '')} {data.get('total', 0)}"
    )


def alert_if_overdue(data, webhook_url):
    """
    Posts a Slack alert if data's due_date has passed. Does nothing (no
    error) if webhook_url is empty or the invoice isn't overdue.
    """
    if not webhook_url or not is_overdue(data.get("due_date", "")):
        return

    try:
        requests.post(webhook_url, json={"text": build_alert_message(data)}, timeout=10)
    except requests.RequestException as problem:
        print(f"Could not reach Slack (invoice was still logged): {problem}")


if __name__ == "__main__":
    # Run this file on its own to check the logic works - no webhook or
    # network call needed:  python overdue.py
    from datetime import date as _date

    fixed_today = _date(2026, 9, 2)

    print("Checking is_overdue()...")
    assert is_overdue("2026-08-01", today=fixed_today) is True
    print("  OK - a due date in the past is correctly flagged overdue")

    assert is_overdue("2026-12-01", today=fixed_today) is False
    print("  OK - a future due date is correctly NOT flagged")

    assert is_overdue("", today=fixed_today) is False
    print("  OK - a blank due date is correctly NOT flagged (validate() already covers that gap)")

    assert is_overdue("not-a-date", today=fixed_today) is False
    print("  OK - an unparseable due date is correctly NOT flagged instead of raising")

    print("\nChecking build_alert_message()...")
    message = build_alert_message({
        "invoice_number": "INV-001", "vendor_name": "Acme Corp",
        "due_date": "2026-08-01", "currency": "USD", "total": 150.00,
    })
    assert "INV-001" in message and "Acme Corp" in message and "150.0" in message
    print("  OK -", message)

    print("\nAll checks passed.")
