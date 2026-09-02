"""
Step 3 of the Basic Data Extractor Agent - runs the whole pipeline.

Run it with:      python main.py
"""

import os

from csv_writer import write_csv
from extractor import extract_fields
from sdt_ai import AIError

SAMPLE_DIR = "sample_data"
OUTPUT_PATH = "output.csv"


def process_folder(folder_path=SAMPLE_DIR):
    """
    Reads every .txt file in folder_path, extracts fields from each with
    the AI, and returns a list of record dicts ready for write_csv().

    Each file is wrapped in its own try/except, so one bad file (a
    network blip, a reply in a shape parse_fields() didn't expect)
    can't stop the whole batch - you get results for every file that
    worked, plus a clear message about the ones that didn't.
    """
    if not os.path.isdir(folder_path):
        raise ValueError(f"Could not find a folder at '{folder_path}'.")

    filenames = sorted(f for f in os.listdir(folder_path) if f.endswith(".txt"))
    if not filenames:
        raise ValueError(f"No .txt files found in '{folder_path}'.")

    records = []
    for filename in filenames:
        path = os.path.join(folder_path, filename)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

        print(f"Extracting from {filename}...")
        try:
            record = extract_fields(text, source_file=filename)
            records.append(record)
        except AIError as problem:
            # AIError messages are already written to be read - show
            # them as-is and move on to the next file.
            print(f"  Skipped {filename}: {problem}")

    return records


if __name__ == "__main__":
    records = process_folder()

    if not records:
        print("\nNothing was extracted - check the errors above.")
    else:
        path = write_csv(records, output_path=OUTPUT_PATH)
        print(f"\nSaved {len(records)} records to {path}")
