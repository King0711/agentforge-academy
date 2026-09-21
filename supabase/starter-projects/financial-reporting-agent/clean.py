"""
Step 1 of the Financial Reporting Agent (part 2) - normalizes category
names and removes duplicate transactions.
"""

import pandas as pd


def clean_transactions(df):
    """
    Fills missing categories with "Uncategorized", title-cases and
    strips category names (so " sales", "Sales", and "SALES" all become
    the same "Sales" rather than three separate categories), drops
    duplicate transactions (same date+amount+description), and adds a
    "month" column.

        clean_transactions(df)

    Tested below with a real DataFrame built in memory.
    """
    df = df.copy()

    df["category"] = df["category"].fillna("Uncategorized").astype(str).str.strip().str.title()

    before = len(df)
    df = df.drop_duplicates(subset=["date", "amount", "description"])
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped} duplicate transaction(s).")

    df["month"] = df["date"].dt.to_period("M")

    return df


if __name__ == "__main__":
    # Run this file on its own to check the cleaning logic works - a
    # real pandas DataFrame built in memory, no CSV file needed:
    #     python clean.py
    df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-01", "2026-08-01", "2026-08-02"]),
        "amount": [100.0, 100.0, -50.0],
        "category": [" sales", "Sales", None],
        "description": ["Invoice #1", "Invoice #1", "Rent"],
    })

    result = clean_transactions(df)
    print(result)

    assert len(result) == 2  # the exact-duplicate row (same date+amount+description) is dropped
    print("\nExact-duplicate transaction correctly dropped - 2 of 3 rows remain.")

    assert set(result["category"]) == {"Sales", "Uncategorized"}
    print("Category names correctly normalized (' sales' and 'Sales' both became 'Sales'),")
    print("and a missing category correctly became 'Uncategorized'.")

    assert "month" in result.columns
    print("'month' column correctly added.")

    print("\nAll checks passed.")
