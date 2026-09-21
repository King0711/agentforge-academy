"""
Step 4 of the Invoice Processing Agent - ties every piece together into
one pipeline you can run per-file or leave watching a folder forever.

Run it with:  python main.py invoices/sample_invoice.pdf   (single file)
          or:  python main.py                              (watch mode)
"""

import os
import sys

from dotenv import load_dotenv
from duplicates import is_duplicate
from extract import extract_invoice
from overdue import alert_if_overdue
from sdt_ai import AIError
from sheets import append_invoice, get_existing_invoice_numbers, get_worksheet
from validate import validate
from watcher import start_watching

load_dotenv()


def process_invoice(pdf_path, worksheet, webhook_url):
    """Runs the full pipeline for one PDF: extract, validate, dedupe, log, alert."""
    print(f"Processing {pdf_path}...")

    try:
        data = extract_invoice(pdf_path)
    except AIError as problem:
        print(f"  AI request failed: {problem}")
        return
    except ValueError as problem:
        print(f"  Could not extract: {problem}")
        return

    data = validate(data)

    existing = get_existing_invoice_numbers(worksheet)
    if is_duplicate(data.get("invoice_number", ""), existing):
        print(f"  Skipped - duplicate invoice number: {data.get('invoice_number')}")
        return

    append_invoice(worksheet, data)
    print(f"  Logged: {data.get('vendor_name')} - {data.get('invoice_number')} (needs_review={data['needs_review']})")

    alert_if_overdue(data, webhook_url)


if __name__ == "__main__":
    worksheet = get_worksheet()
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")

    if len(sys.argv) > 1:
        process_invoice(sys.argv[1], worksheet, webhook_url)
    else:
        start_watching("invoices", lambda path: process_invoice(path, worksheet, webhook_url))
