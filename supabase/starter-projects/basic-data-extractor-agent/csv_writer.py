"""
Step 2 of the Basic Data Extractor Agent.

This file has one job: take the list of extracted-field dicts and turn
them into rows of a real CSV, using pandas. Nothing here talks to the
AI - it's plain, fully-testable code you can run on its own.
"""

import pandas as pd

from extractor import FIELDS

# Column order in the final CSV. source_file goes first so you can always
# trace a row back to the document it came from - useful the moment you
# spot a wrong-looking value and want to go check the original text.
COLUMNS = ["source_file"] + list(FIELDS.keys())


def write_csv(records, output_path="output.csv"):
    """
    Writes a list of extracted-field dicts to a CSV file.

        write_csv([{"source_file": "a.txt", "NAME": "Ada", ...}])

    Returns the output path, so main.py can print where the file went.
    Raises ValueError if there is nothing to write.
    """
    if not records:
        raise ValueError("No records to write - nothing was extracted.")

    df = pd.DataFrame(records)

    # Make sure every expected column exists and appears in a fixed
    # order, even if every single record happened to be missing the same
    # field (e.g. none of the sample documents mentioned an AMOUNT).
    # Without this, pandas would just drop that column from the CSV
    # entirely, and the column layout would silently change from run to
    # run depending on which documents you happened to feed it.
    for column in COLUMNS:
        if column not in df.columns:
            df[column] = None
    df = df[COLUMNS]

    # utf-8-sig (not plain utf-8) so accented characters and the naira
    # sign (NGN's real symbol, U+20A6) don't turn into mojibake the
    # moment someone opens this file in Excel instead of a text editor.
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    return output_path


if __name__ == "__main__":
    # Run this file on its own to check it works, with no AI involved:
    #     python csv_writer.py
    import os

    sample_records = [
        {
            "source_file": "business_card.txt",
            "NAME": "Sarah Okafor",
            "EMAIL": "sarah.okafor@fintechsolutions.ng",
            "PHONE": "+234 803 555 0192",
            "DATE": None,
            # AMOUNT deliberately omitted from this record entirely -
            # not even set to None - to check the per-row case below.
        },
        {
            # NAME, DATE and AMOUNT all omitted here too. Between these
            # two records, AMOUNT never appears in a single dict - this
            # is the "every record is missing the same field" case the
            # COLUMNS loop above exists to handle.
            "source_file": "job_posting.txt",
            "EMAIL": "careers@technova.io",
            "PHONE": None,
        },
    ]

    path = write_csv(sample_records, output_path="test_output.csv")
    print(f"Wrote {len(sample_records)} rows to {path}")

    check = pd.read_csv(path)
    print("\nColumns:", list(check.columns))
    assert list(check.columns) == COLUMNS, "Column order should be fixed, not depend on which record has which keys"
    assert pd.isna(check.loc[0, "AMOUNT"]), "A column no record provided should still exist, and be blank"
    assert pd.isna(check.loc[1, "NAME"]), "A per-row missing field should read back as blank, not the string 'None'"

    print("\nRow 2 (job_posting):")
    print(check.iloc[1])

    os.remove(path)
    print(f"\nCleaned up {path}. All csv_writer self-tests passed.")
