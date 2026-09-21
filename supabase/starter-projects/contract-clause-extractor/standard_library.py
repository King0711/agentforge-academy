"""
Step 3 of the Contract Clause Extractor (part 2) - flags clauses that
deviate from your organization's standard language.
"""

STANDARD_CLAUSES = {
    "Limitation of Liability": "Liability shall not exceed fees paid in the preceding 12 months.",
    "Governing Law": "This agreement shall be governed by the laws of Delaware.",
}


def flag_deviations(clauses, standard_clauses=STANDARD_CLAUSES):
    """
    Compares the first 3 words of each standard clause against the
    first 3 words of the actual extracted clause, and returns a dict of
    deviations with both the standard and actual text for any mismatch.

        flag_deviations(clauses)

    The word-prefix check is a starting heuristic, not a semantic
    comparison - it catches wording that opens noticeably differently,
    but two clauses that start the same way and diverge in the middle
    would slip past it. Production use should ask the AI to assess
    semantic similarity instead (see this build's goFurther).
    """
    deviations = {}

    for clause_type, standard_text in standard_clauses.items():
        actual = clauses.get(clause_type, {}).get("exact_text", "")
        if actual.strip().lower() == "not found":
            deviations[clause_type] = {"standard": standard_text, "actual": "Not found in contract"}
            continue

        standard_prefix = " ".join(standard_text.split()[:3]).lower()
        actual_prefix = " ".join(actual.split()[:3]).lower()

        if standard_prefix != actual_prefix:
            deviations[clause_type] = {"standard": standard_text, "actual": actual}

    return deviations


if __name__ == "__main__":
    # Run this file on its own to check the deviation logic works - no
    # AI call, no credits spent:  python standard_library.py
    print("Checking a clause matching the standard's opening words...")
    matching = {"Governing Law": {"exact_text": "This agreement shall be governed by the laws of Texas, not Delaware."}}
    result = flag_deviations(matching)
    assert "Governing Law" not in result
    print("  OK - same opening 3 words, not flagged (even though the state differs later in the sentence -")
    print("  this IS the heuristic's known limitation, and exactly why the goFurther suggests a semantic check)")

    print("\nChecking a clause with a genuinely different opening...")
    different = {"Limitation of Liability": {"exact_text": "In no event shall either party be liable for any damages."}}
    result = flag_deviations(different)
    assert "Limitation of Liability" in result
    assert result["Limitation of Liability"]["actual"].startswith("In no event")
    print("  OK -", result["Limitation of Liability"])

    print("\nChecking a clause the AI couldn't find at all is flagged as a deviation...")
    missing = {"Governing Law": {"exact_text": "Not found"}}
    result = flag_deviations(missing)
    assert result["Governing Law"]["actual"] == "Not found in contract"
    print("  OK")

    print("\nAll checks passed.")
