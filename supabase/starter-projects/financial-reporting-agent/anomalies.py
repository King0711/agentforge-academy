"""
Step 4 of the Financial Reporting Agent (part 1) - flags transactions
that are statistical outliers within their own category, worth a human
glance before the report ships.

Uses a MEDIAN-based method (a "modified z-score"), not mean/standard
deviation. Plain mean/std has a real, well-known weakness called
masking: one sufficiently extreme value inflates the mean and std of
its OWN group enough that it no longer measures as "far" from that
now-inflated mean - a single $5,000 charge among five $100 ones can
slip straight past a 3-sigma-from-the-mean check. The median and median
absolute deviation (MAD) barely move when one value is extreme, so the
same outlier stays clearly detectable.
"""

MIN_TRANSACTIONS_FOR_STATS = 5
MODIFIED_Z_THRESHOLD = 3.5  # the standard threshold for this method (Iglewicz & Hoaglin)


def find_anomalies(df):
    """
    Groups df by category, and for categories with at least
    MIN_TRANSACTIONS_FOR_STATS transactions, flags any transaction whose
    modified z-score - based on the category's MEDIAN and median
    absolute deviation, not its mean/std - exceeds MODIFIED_Z_THRESHOLD.

        find_anomalies(df)

    Categories with fewer transactions than the minimum are skipped
    entirely, not flagged - a median computed from 2-3 transactions is
    nearly meaningless, and would flag the larger of two transactions in
    a brand-new category every single time.

    Returns a list of transaction records (as dicts) for the flagged rows.
    """
    anomalies = []

    for category, group in df.groupby("category"):
        if len(group) < MIN_TRANSACTIONS_FOR_STATS:
            continue

        median = group["amount"].median()
        mad = (group["amount"] - median).abs().median()
        if mad == 0:
            continue  # every transaction identical (or near it) - nothing to flag as an outlier

        modified_z = 0.6745 * (group["amount"] - median).abs() / mad
        flagged = group[modified_z > MODIFIED_Z_THRESHOLD]
        anomalies.extend(flagged.to_dict("records"))

    return anomalies


if __name__ == "__main__":
    # Run this file on its own to check the anomaly logic works - a
    # real pandas DataFrame built in memory, no CSV file needed:
    #     python anomalies.py
    import pandas as pd

    print("Checking a category with an outlier that a plain mean/std check would MISS...")
    normal_amounts = [100.0, 105.0, 98.0, 102.0, 99.0]
    outlier_amounts = normal_amounts + [5000.0]
    df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-0" + str(i + 1) for i in range(6)]),
        "amount": outlier_amounts,
        "category": ["Office Supplies"] * 6,
        "description": [f"purchase {i}" for i in range(6)],
    })
    result = find_anomalies(df)
    assert len(result) == 1
    assert result[0]["amount"] == 5000.0
    print("  OK - the 5000.0 outlier correctly flagged out of 6 similar transactions")
    print("  (the outlier inflates a plain mean/std enough to hide from a 3-sigma-from-the-")
    print("  mean test - median/MAD isn't pulled off course the same way, and catches it)")

    print("\nChecking a category with too few transactions is skipped entirely...")
    small_df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-01", "2026-08-02"]),
        "amount": [100.0, 5000.0],
        "category": ["New Vendor"] * 2,
        "description": ["a", "b"],
    })
    result = find_anomalies(small_df)
    assert result == []
    print("  OK - a category with only 2 transactions is never flagged, even with a huge gap between them")

    print("\nChecking a category with identical amounts (MAD=0) doesn't crash or false-flag...")
    identical_df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-0" + str(i + 1) for i in range(5)]),
        "amount": [100.0] * 5,
        "category": ["Subscriptions"] * 5,
        "description": [f"sub {i}" for i in range(5)],
    })
    result = find_anomalies(identical_df)
    assert result == []
    print("  OK")

    print("\nAll checks passed.")
