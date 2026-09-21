"""
Step 3 of the Contract Clause Extractor (part 1) - rolls up per-clause
risk ratings into one overall contract risk level.
"""


def count_risk_levels(clauses):
    """Pure function - counts red/yellow/green/unclear across all clauses."""
    counts = {"red": 0, "yellow": 0, "green": 0, "unclear": 0}
    for data in clauses.values():
        risk = data.get("risk", "unclear")
        counts[risk] = counts.get(risk, 0) + 1
    return counts


def overall_risk(clauses):
    """
    Returns "High Risk", "Medium Risk", or "Low Risk" based on how many
    clauses are rated red/yellow.

        overall_risk(clauses)

    Rule: 2+ red -> High Risk. 1 red OR 4+ yellow -> Medium Risk.
    Otherwise -> Low Risk. Deliberately simple and explainable - a
    lawyer using this tool can recompute the same rating by hand from
    the counts alone, which matters more here than a more "clever" but
    opaque scoring formula would.
    """
    counts = count_risk_levels(clauses)

    if counts["red"] >= 2:
        return "High Risk"
    if counts["red"] == 1 or counts["yellow"] >= 4:
        return "Medium Risk"
    return "Low Risk"


if __name__ == "__main__":
    # Run this file on its own to check the roll-up logic works - no AI
    # call, no credits spent:  python risk.py
    print("Checking 2+ red clauses -> High Risk...")
    two_red = {f"clause{i}": {"risk": "red"} for i in range(2)}
    assert overall_risk(two_red) == "High Risk"
    print("  OK")

    print("\nChecking exactly 1 red clause -> Medium Risk...")
    one_red = {"clause1": {"risk": "red"}, "clause2": {"risk": "green"}}
    assert overall_risk(one_red) == "Medium Risk"
    print("  OK")

    print("\nChecking 4+ yellow (no red) -> Medium Risk...")
    four_yellow = {f"clause{i}": {"risk": "yellow"} for i in range(4)}
    assert overall_risk(four_yellow) == "Medium Risk"
    print("  OK")

    print("\nChecking mostly green, a couple yellow -> Low Risk...")
    mostly_green = {"c1": {"risk": "green"}, "c2": {"risk": "green"}, "c3": {"risk": "yellow"}}
    assert overall_risk(mostly_green) == "Low Risk"
    print("  OK")

    print("\nAll checks passed.")
