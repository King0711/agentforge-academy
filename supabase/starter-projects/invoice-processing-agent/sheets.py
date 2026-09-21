"""
Step 2 of the Invoice Processing Agent (continued) - logs every invoice
to a Google Sheet your finance team can open directly.
"""

import gspread
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SHEET_NAME = "Invoice Tracker"
SERVICE_ACCOUNT_FILE = "service_account.json"

# Must match the sheet's header row EXACTLY, in this order - gspread
# appends by position, not by column name, so a row built in the wrong
# order silently lands under the wrong headers instead of erroring.
COLUMN_ORDER = [
    "vendor_name", "invoice_number", "date", "due_date",
    "total", "currency", "needs_review", "missing_fields",
]


def build_row(data):
    """
    Turns a validated invoice dict into a list in COLUMN_ORDER, ready to
    append to the sheet.

        build_row({"vendor_name": "Acme", "invoice_number": "INV-1", ...})

    Pure function, no network call - tested below without a real sheet.
    Missing keys become "" rather than raising, since a partially
    extracted invoice should still get logged - that's exactly what
    needs_review is for.
    """
    return [data.get(field, "") for field in COLUMN_ORDER]


def get_worksheet():
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client.open(SHEET_NAME).sheet1


def get_existing_invoice_numbers(worksheet):
    """Returns every invoice number already logged (column B, skipping the header row)."""
    return worksheet.col_values(2)[1:]


def append_invoice(worksheet, data):
    """Appends one validated invoice as a new row, in COLUMN_ORDER."""
    worksheet.append_row(build_row(data))


if __name__ == "__main__":
    # Run this file on its own to check row-building works - no Google
    # account or network call needed:  python sheets.py
    sample = {
        "vendor_name": "Acme Corp", "invoice_number": "INV-001", "date": "2026-08-01",
        "due_date": "2026-08-31", "total": 100.00, "currency": "USD",
        "needs_review": False, "missing_fields": "",
    }
    row = build_row(sample)
    assert row == ["Acme Corp", "INV-001", "2026-08-01", "2026-08-31", 100.00, "USD", False, ""]
    print("Built row:", row)

    print("\nChecking a partially-extracted invoice still builds a row (missing keys become '')...")
    sparse = {"vendor_name": "Acme Corp", "needs_review": True, "missing_fields": "invoice_number, date"}
    row = build_row(sparse)
    assert row[0] == "Acme Corp"
    assert row[1] == ""
    print("  OK -", row)

    print("\nAll checks passed.")
