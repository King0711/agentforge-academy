"""
Step 3 of the Product Recommendation Engine (part 2) - processes the
entire customer base into recommendations.csv, falling back to a
segment's best-sellers when a customer has zero qualifying
recommendations above the confidence threshold.
"""

import pandas as pd

from filter import filter_recommendations
from recommend import recommend_for_customer
from sdt_ai import AIError


def compute_bestsellers(df, top_n=3):
    """
    Pure function - for each size_segment, returns the top_n most
    frequently purchased SKUs across all customers in that segment.

        compute_bestsellers(df)
        -> {"SMB": ["SKU-1", "SKU-2", "SKU-3"], "Mid-Market": [...], ...}

    Used as a fallback in run_batch() below - a customer with zero
    recommendations above the confidence threshold still gets something
    concrete to act on, grounded in real purchase data rather than a
    guess.
    """
    bestsellers = {}
    for segment, group in df.groupby("size_segment"):
        all_skus = [sku for purchases in group["past_purchases"] for sku in purchases]
        counts = pd.Series(all_skus).value_counts()
        bestsellers[segment] = counts.head(top_n).index.tolist()
    return bestsellers


def run_batch(customers_df, catalog, min_confidence=6, output="recommendations.csv"):
    """
    The main function. Loops over every customer, recommends, filters
    by confidence, falls back to that segment's best-sellers if nothing
    qualifies, and writes recommendations.csv.
    """
    bestsellers = compute_bestsellers(customers_df)
    rows = []

    for _, customer in customers_df.iterrows():
        customer_dict = customer.to_dict()

        try:
            recs = recommend_for_customer(customer_dict, catalog)
        except (AIError, ValueError) as problem:
            print(f"  Skipped {customer_dict.get('customer_id')}: {problem}")
            continue

        qualifying = filter_recommendations(recs, min_confidence=min_confidence)

        if not qualifying:
            fallback_skus = bestsellers.get(customer_dict.get("size_segment"), [])
            qualifying = [
                {
                    "sku": sku, "confidence": min_confidence,
                    "reason": "Segment best-seller fallback - no AI recommendation met the confidence threshold",
                }
                for sku in fallback_skus
            ]

        for rec in qualifying:
            rows.append({"customer_id": customer_dict.get("customer_id"), **rec})

    result_df = pd.DataFrame(rows)
    result_df.to_csv(output, index=False)
    return output


if __name__ == "__main__":
    # Run this file on its own to check compute_bestsellers() works - a
    # real pandas DataFrame built in memory, no AI call needed:
    #     python batch.py
    df = pd.DataFrame({
        "size_segment": ["SMB", "SMB", "SMB", "Enterprise"],
        "past_purchases": [["A", "B"], ["A", "C"], ["A"], ["Z"]],
    })
    result = compute_bestsellers(df, top_n=2)
    assert result["SMB"][0] == "A"  # "A" appears 3 times, the clear top seller
    print("SMB bestsellers:", result["SMB"])
    assert result["Enterprise"] == ["Z"]
    print("Enterprise bestsellers:", result["Enterprise"])

    print("\nAll checks passed.")
