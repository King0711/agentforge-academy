"""
Step 4 of the Contract Clause Extractor (part 1) - compares two
extracted clause sets and summarizes material differences.
"""

from sdt_ai import ask_ai


def build_prompt(clauses_a, clauses_b):
    lines = []
    for clause_type in sorted(set(clauses_a) | set(clauses_b)):
        text_a = clauses_a.get(clause_type, {}).get("exact_text", "Not found")
        text_b = clauses_b.get(clause_type, {}).get("exact_text", "Not found")
        lines.append(f"{clause_type}:\n  Version A: {text_a}\n  Version B: {text_b}")

    return "Below are two contract versions' clauses, side by side. Summarize " \
        "material differences clause by clause - skip clauses that are " \
        "substantively identical. For each meaningful difference, explain what " \
        "changed and which version is more favorable to the RECEIVING party.\n\n" \
        + "\n\n".join(lines)


def compare_contracts(clauses_a, clauses_b):
    """
    The main function. Give it two extracted clause dicts (from
    extract_clauses(), for two versions of a contract), get back a
    plain-English summary of material differences.
    """
    prompt = build_prompt(clauses_a, clauses_b)
    return ask_ai(prompt, max_tokens=1500, project="contract-clause-extractor")


if __name__ == "__main__":
    # Run this file on its own to check prompt-building works - no AI
    # call, no credits spent:  python compare.py
    clauses_a = {"Governing Law": {"exact_text": "Governed by the laws of Delaware."}}
    clauses_b = {"Governing Law": {"exact_text": "Governed by the laws of California."}}

    prompt = build_prompt(clauses_a, clauses_b)
    assert "Delaware" in prompt and "California" in prompt
    assert "Version A" in prompt and "Version B" in prompt
    print(prompt)

    print("\nAll checks passed.")
