"""
Step 3 of the Product Recommendation Engine (part 1) - drops low-
confidence suggestions before they reach a real customer or CRM record.
"""


def filter_recommendations(recommendations, min_confidence=6):
    """
    Returns only recommendations with confidence >= min_confidence.

        filter_recommendations(recs, min_confidence=6)

    Pure function - tested below without any AI call.
    """
    return [r for r in recommendations if r.get("confidence", 0) >= min_confidence]


if __name__ == "__main__":
    # Run this file on its own to check the filter works - no AI call,
    # no credits spent:  python filter.py
    recs = [
        {"sku": "A", "confidence": 9},
        {"sku": "B", "confidence": 5},
        {"sku": "C", "confidence": 6},
    ]
    result = filter_recommendations(recs, min_confidence=6)
    assert {r["sku"] for r in result} == {"A", "C"}
    print("Kept:", [r["sku"] for r in result], "- confidence-5 recommendation correctly dropped, confidence-6 kept (boundary is inclusive)")

    print("\nAll checks passed.")
