"""
Step 4 of the Product Recommendation Engine (part 3) - ties everything
together.

Run it with:  python main.py
"""

import pandas as pd

from ab_test import tag_recommendations
from batch import run_batch
from catalog import load_catalog
from load import load_customers
from segment import segment_customers


def run():
    print("Loading and segmenting customers...")
    customers_df = segment_customers(load_customers())
    catalog = load_catalog()

    print("Running the recommendation batch (this calls the AI once per customer)...")
    output_path = run_batch(customers_df, catalog)
    print(f"  Wrote {output_path}")

    rows_df = pd.read_csv(output_path)
    tagged_rows = tag_recommendations(rows_df.to_dict("records"))
    pd.DataFrame(tagged_rows).to_csv(output_path, index=False)
    print(f"  Tagged all rows with campaign_id: {tagged_rows[0]['campaign_id'] if tagged_rows else '(none)'}")

    print(f"\nDone. See {output_path} for the full batch.")
    print("To push a recommendation to HubSpot, call push_recommendation_note() from")
    print("crm_push.py with your token, a contact_id, and one row from the CSV.")


if __name__ == "__main__":
    run()
