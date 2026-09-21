"""
Step 1 of the Invoice Processing Agent.

Reads a PDF invoice and asks the AI to extract its data as JSON matching
a fixed schema. The JSON-parsing helper is deliberately defensive: real
model replies sometimes wrap JSON in ```json code fences despite being
told not to, and this project would rather strip that cleanly than
crash on it.
"""

import json

from PyPDF2 import PdfReader
from sdt_ai import ask_ai

SCHEMA = """{
  "vendor_name": "...",
  "invoice_number": "...",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "total": 0.00,
  "currency": "USD",
  "line_items": [{"description": "...", "amount": 0.00}]
}"""

# Stop sending PDF text after this many characters. A MONEY decision:
# most invoices are 1-2 pages, and the fields this schema needs almost
# always appear early - a 50-page contract with an invoice attached
# shouldn't cost 10x more to extract from than a normal one-page invoice.
MAX_CHARACTERS = 6000


def extract_pdf_text(pdf_path):
    """Reads all pages of a PDF and returns their combined text."""
    reader = PdfReader(pdf_path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def build_prompt(invoice_text):
    trimmed = invoice_text[:MAX_CHARACTERS]
    return f"""Extract this invoice's data as JSON matching EXACTLY this shape:

{SCHEMA}

If a field isn't present in the invoice, use an empty string "" for text
fields or 0.00 for numbers - never guess a plausible-looking value.

Return ONLY the JSON object. No explanation, no markdown code fence.

INVOICE TEXT:
{trimmed}"""


def parse_json_reply(reply):
    """
    Turns the AI's reply into a Python dict, tolerating a ```json code
    fence around it even though the prompt asks for none.

        parse_json_reply('```json\\n{"vendor_name": "Acme"}\\n```')
        -> {"vendor_name": "Acme"}

    Returns None (never raises) if the reply isn't valid JSON at all, so
    extract_invoice() can report a clear error instead of an unhandled
    JSONDecodeError crashing the whole batch.
    """
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def extract_invoice(pdf_path):
    """
    The main function. Give it a PDF path, get back the extracted data
    as a dict, or raises ValueError if the AI's reply wasn't valid JSON
    at all - rare, but real, and worth a clear error over a crash deep
    inside json.loads().
    """
    text = extract_pdf_text(pdf_path)
    prompt = build_prompt(text)
    reply = ask_ai(prompt, max_tokens=1000, project="invoice-processing-agent")

    data = parse_json_reply(reply)
    if data is None:
        raise ValueError(
            "The AI's reply wasn't valid JSON.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return data


if __name__ == "__main__":
    # Run this file on its own to check the JSON parsing works - no AI
    # call, no credits spent:  python extract.py
    print("Checking a clean JSON reply...")
    clean_reply = '{"vendor_name": "Acme Corp", "total": 150.00}'
    result = parse_json_reply(clean_reply)
    assert result == {"vendor_name": "Acme Corp", "total": 150.00}
    print("  OK -", result)

    print("\nChecking a reply wrapped in a ```json code fence (told not to, does it anyway)...")
    fenced_reply = '```json\n{"vendor_name": "Acme Corp", "total": 150.00}\n```'
    result = parse_json_reply(fenced_reply)
    assert result == {"vendor_name": "Acme Corp", "total": 150.00}
    print("  OK - fence stripped correctly:", result)

    print("\nChecking a plain ``` fence with no 'json' label...")
    plain_fenced = '```\n{"vendor_name": "Acme Corp"}\n```'
    assert parse_json_reply(plain_fenced) == {"vendor_name": "Acme Corp"}
    print("  OK")

    print("\nChecking a reply that isn't JSON at all...")
    assert parse_json_reply("Sorry, I couldn't read that invoice clearly.") is None
    print("  OK - returned None instead of crashing")

    print("\nAll parsing checks passed.")
