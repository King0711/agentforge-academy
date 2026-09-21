"""
Step 4 of the Contract Clause Extractor (part 3) - ties everything
together: read, extract, score, check deviations, export.

Run it with:  python main.py contract.pdf
"""

import sys

from export import export_word
from reader import read_contract
from risk import overall_risk
from sdt_ai import AIError
from standard_library import flag_deviations
from taxonomy import CLAUSE_TYPES

from extract import extract_clauses


def run(contract_path):
    print(f"Reading {contract_path}...")
    contract_text = read_contract(contract_path)

    print("Extracting clauses...")
    clauses = extract_clauses(contract_text, CLAUSE_TYPES)

    risk_level = overall_risk(clauses)
    print(f"Overall risk: {risk_level}")

    deviations = flag_deviations(clauses)
    if deviations:
        print(f"{len(deviations)} clause(s) deviate from your standard library:")
        for clause_type in deviations:
            print(f"  - {clause_type}")

    unverified = [name for name, data in clauses.items() if data.get("verified") is False]
    if unverified:
        print(f"Warning: {len(unverified)} clause(s) have a quote that couldn't be verified against the source:")
        for name in unverified:
            print(f"  - {name}")

    output = export_word(clauses)
    print(f"\nDone. Report saved to: {output}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py contract.pdf")
        sys.exit(1)

    try:
        run(sys.argv[1])
    except AIError as problem:
        print(f"AI request failed:\n{problem}")
    except ValueError as problem:
        print(f"Could not complete the pipeline:\n{problem}")
