"""
Step 1 of the Invoice Processing Agent (continued) - validates extracted
invoice data and flags anything worth a human's attention before it's
logged to the tracker sheet.
"""

REQUIRED_FIELDS = ["vendor_name", "invoice_number", "date", "total"]

# Line items rarely sum to the total to the exact cent (rounding on
# per-item tax, for instance) - this tolerance avoids flagging every
# single invoice over a 1-cent rounding difference while still catching
# a genuinely wrong extraction.
AMOUNT_TOLERANCE = 0.02


def missing_required_fields(data):
    """
    Returns the list of required fields that are empty or missing.

        missing_required_fields({"vendor_name": "Acme", "total": 0})
        -> ["invoice_number", "date", "total"]

    Treats a present-but-empty value ("" or 0) the same as a missing key -
    the AI is told to use "" or 0.00 rather than guess, so an empty
    value here means genuinely not found.
    """
    missing = []
    for field in REQUIRED_FIELDS:
        value = data.get(field)
        if not value:
            missing.append(field)
    return missing


def amount_mismatch(data):
    """
    Returns True if the line items don't sum to roughly the stated
    total - a real and common extraction error worth flagging rather
    than trusting the extracted total blindly.

        amount_mismatch({"total": 100.00, "line_items": [{"amount": 40}, {"amount": 40}]})
        -> True  (40 + 40 = 80, not 100)

    Returns False (not flagged) if there are no line items at all -
    plenty of real invoices are extracted with just a total and no
    itemization, and that alone isn't a sign of a bad extraction.
    """
    line_items = data.get("line_items") or []
    if not line_items:
        return False

    items_sum = sum(item.get("amount", 0) or 0 for item in line_items)
    total = data.get("total", 0) or 0
    return abs(items_sum - total) > AMOUNT_TOLERANCE


def validate(data):
    """
    The main function. Mutates and returns data with two extra fields:

        data["needs_review"]   - True if anything below is off
        data["missing_fields"] - comma-separated list of what's wrong

    "missing_fields" also carries the string "amount_mismatch" when line
    items don't sum to the total, even though that's not literally a
    missing field - keeping this project to one flag field for finance
    to scan, rather than several.
    """
    missing = missing_required_fields(data)
    if amount_mismatch(data):
        missing.append("amount_mismatch")

    data["needs_review"] = bool(missing)
    data["missing_fields"] = ", ".join(missing)
    return data


if __name__ == "__main__":
    # Run this file on its own to check validation works - no AI call,
    # no credits spent:  python validate.py
    print("Checking a complete, consistent invoice...")
    complete = {
        "vendor_name": "Acme Corp", "invoice_number": "INV-001", "date": "2026-08-01",
        "total": 100.00, "line_items": [{"amount": 60.00}, {"amount": 40.00}],
    }
    result = validate(dict(complete))
    assert result["needs_review"] is False
    assert result["missing_fields"] == ""
    print("  OK - needs_review is False, missing_fields is empty")

    print("\nChecking an invoice missing required fields...")
    incomplete = {"vendor_name": "", "invoice_number": "INV-002", "date": "2026-08-01", "total": 50.00}
    result = validate(dict(incomplete))
    assert result["needs_review"] is True
    assert "vendor_name" in result["missing_fields"]
    print("  OK -", result["missing_fields"])

    print("\nChecking an invoice where line items don't sum to the total...")
    mismatched = {
        "vendor_name": "Acme", "invoice_number": "INV-003", "date": "2026-08-01",
        "total": 100.00, "line_items": [{"amount": 40.00}, {"amount": 40.00}],
    }
    result = validate(dict(mismatched))
    assert result["needs_review"] is True
    assert "amount_mismatch" in result["missing_fields"]
    print("  OK -", result["missing_fields"], "(40 + 40 = 80, not 100)")

    print("\nChecking an invoice with no line items isn't flagged for that reason...")
    no_items = {"vendor_name": "Acme", "invoice_number": "INV-004", "date": "2026-08-01", "total": 100.00}
    result = validate(dict(no_items))
    assert "amount_mismatch" not in result["missing_fields"]
    print("  OK - no line items is not treated as a mismatch")

    print("\nAll validation checks passed.")
