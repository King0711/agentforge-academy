"""
Step 1 of the Financial Reporting Agent (part 1).

Reads a transactions CSV and standardizes it, since column names vary
wildly by export tool ("Transaction Date" vs "Date", "Amount" vs "Net
Amount"). The column-mapping and type-coercion logic is tested below
against a real pandas DataFrame, not mocked data.
"""

import pandas as pd

# Edit this to match YOUR export's actual column names on the left.
# Open your CSV first and check - QuickBooks, Xero, and a raw bank
# export all name these differently.
COLUMN_MAP = {
    "Transaction Date": "date",
    "Amount": "amount",
    "Category": "category",
    "Description": "description",
}


def standardize_columns(df, column_map=COLUMN_MAP):
    """
    Renames df's columns via column_map, converts date to datetime and
    amount to numeric (invalid values become NaT/NaN rather than
    raising), and drops rows where amount couldn't be parsed at all.

        standardize_columns(raw_df)

    Kept separate from the actual file read (load_transactions, below)
    so this can be tested against a DataFrame you build directly in
    Python, without needing a real CSV file on disk.
    """
    df = df.rename(columns=column_map)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    before = len(df)
    df = df.dropna(subset=["amount"])
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped} row(s) where amount could not be parsed as a number.")

    return df


def load_transactions(path, column_map=COLUMN_MAP):
    """Reads path as a CSV and returns the standardized DataFrame."""
    df = pd.read_csv(path)
    return standardize_columns(df, column_map)


if __name__ == "__main__":
    # Run this file on its own to check standardize_columns() works - a
    # real pandas DataFrame built in memory, no CSV file needed:
    #     python ingest.py
    raw = pd.DataFrame({
        "Transaction Date": ["2026-08-01", "2026-08-02", "not-a-date"],
        "Amount": ["100.50", "not-a-number", "-45.00"],
        "Category": ["Sales", "Sales", "Rent"],
        "Description": ["Invoice #1", "Invoice #2", "August rent"],
    })

    result = standardize_columns(raw.copy())
    print(result)

    assert list(result.columns) == ["date", "amount", "category", "description"]
    print("\nColumns correctly renamed via COLUMN_MAP.")

    assert len(result) == 2  # the "not-a-number" amount row got dropped
    print("Row with an unparseable amount correctly dropped - 2 of 3 rows remain.")

    remaining_dates = result["date"].tolist()
    assert pd.isna(remaining_dates[-1])
    print("A row with a bad date but a valid amount is KEPT (date becomes NaT), not dropped -")
    print("this project only requires amount to be usable, since that's what every metric needs.")

    print("\nAll checks passed.")
