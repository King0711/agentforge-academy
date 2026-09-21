"""
Step 1 of the Product Recommendation Engine (part 1) - reads customer
purchase history from a CSV.
"""

import pandas as pd


def split_purchases(series):
    """
    Pure function - turns a Series of comma-separated SKU strings into
    a Series of lists, tested below without a real CSV file.

        split_purchases(pd.Series(["SKU-1,SKU-2", None]))
        -> [["SKU-1", "SKU-2"], []]
    """
    return series.fillna("").apply(lambda s: [sku.strip() for sku in s.split(",") if sku.strip()])


def load_customers(path="customers.csv"):
    """
    Reads path as a CSV and returns a DataFrame with past_purchases
    turned from a comma-separated string into a real Python list.

        df = load_customers("customers.csv")

    A missing past_purchases value becomes an empty list, not NaN or a
    crash - a brand-new customer with no purchase history yet is a
    completely normal row, not a broken one.
    """
    df = pd.read_csv(path)
    df["past_purchases"] = split_purchases(df["past_purchases"])
    return df


if __name__ == "__main__":
    # Run this file on its own to check split_purchases() works - a
    # real pandas Series, no CSV file needed:  python load.py
    raw = pd.Series(["SKU-1,SKU-2", "", None, "SKU-3"])
    result = split_purchases(raw)

    assert result[0] == ["SKU-1", "SKU-2"]
    print("OK - comma-separated string correctly split:", result[0])

    assert result[1] == []
    assert result[2] == []
    print("OK - both an empty string and a missing (None) value correctly became [], not NaN or a crash")

    assert result[3] == ["SKU-3"]
    print("OK - a single SKU with no comma correctly became a one-item list:", result[3])

    print("\nAll checks passed.")
