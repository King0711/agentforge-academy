"""
Step 2 of the Invoice Processing Agent - catches duplicate invoice
numbers before they're logged twice, even when they don't match
character-for-character.
"""

import re


def normalize_invoice_number(invoice_number):
    """
    Strips whitespace, lowercases, and strips leading zeros from any
    digit run, so "INV-001" and " inv-1" (a real formatting difference
    between two exports of the SAME invoice) are recognised as the same
    number.

        normalize_invoice_number("  INV-001 ") -> "inv-1"
    """
    stripped = invoice_number.strip().lower()
    return re.sub(r"(?<=\D)0+(?=\d)|^0+(?=\d)", "", stripped)


def is_duplicate(invoice_number, existing_numbers):
    """
    Returns True if invoice_number matches any of existing_numbers after
    normalization.

        is_duplicate("INV-001", ["inv-1", "INV-777"]) -> True

    Pure function - existing_numbers is just a list of strings, which is
    why this can be tested without a real Google Sheet. sheets.py is
    responsible for actually fetching that list.
    """
    normalized = normalize_invoice_number(invoice_number)
    return normalized in {normalize_invoice_number(n) for n in existing_numbers}


if __name__ == "__main__":
    # Run this file on its own to check the logic works:  python duplicates.py
    print("Checking normalize_invoice_number()...")
    assert normalize_invoice_number("  INV-001 ") == "inv-1"
    assert normalize_invoice_number("INV-1") == "inv-1"
    print("  OK - 'INV-001' and 'INV-1' normalize to the same value")

    print("\nChecking is_duplicate()...")
    existing = ["INV-001", "INV-045"]
    assert is_duplicate("inv-1", existing) is True
    print("  OK - 'inv-1' correctly matches 'INV-001' despite different case/padding")

    assert is_duplicate("INV-999", existing) is False
    print("  OK - a genuinely new invoice number correctly returns False")

    print("\nAll checks passed.")
