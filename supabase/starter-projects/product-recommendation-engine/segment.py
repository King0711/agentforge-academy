"""
Step 1 of the Product Recommendation Engine (part 2) - buckets
customers into simple, explainable segments.
"""


def size_segment(company_size):
    """Pure function - tested below with real boundary values."""
    if company_size < 50:
        return "SMB"
    if company_size < 500:
        return "Mid-Market"
    return "Enterprise"


def engagement_segment(past_purchases):
    """Pure function - tested below with real boundary values."""
    count = len(past_purchases)
    if count <= 1:
        return "New"
    if count <= 4:
        return "Active"
    return "Power User"


def segment_customers(df):
    """
    Adds size_segment and engagement_segment columns to df.

        segment_customers(df)

    If purchase history lives in a separate orders table in your real
    system, pivot it into a comma-separated SKU list per customer
    (matching load.py's expected shape) before calling this.
    """
    df = df.copy()
    df["size_segment"] = df["company_size"].apply(size_segment)
    df["engagement_segment"] = df["past_purchases"].apply(engagement_segment)
    return df


if __name__ == "__main__":
    # Run this file on its own to check the segmentation boundaries are
    # exactly right - no CSV file needed:  python segment.py
    print("Checking size_segment() boundaries...")
    assert size_segment(49) == "SMB"
    assert size_segment(50) == "Mid-Market"  # the boundary itself belongs to the NEXT tier
    assert size_segment(499) == "Mid-Market"
    assert size_segment(500) == "Enterprise"
    print("  OK - 49/50/499/500 all landed in the correct tier")

    print("\nChecking engagement_segment() boundaries...")
    assert engagement_segment([]) == "New"
    assert engagement_segment(["a"]) == "New"
    assert engagement_segment(["a", "b"]) == "Active"
    assert engagement_segment(["a", "b", "c", "d"]) == "Active"
    assert engagement_segment(["a", "b", "c", "d", "e"]) == "Power User"
    print("  OK - 0/1/2/4/5 purchases all landed in the correct tier")

    print("\nAll checks passed.")
