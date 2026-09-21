"""
Step 4 of the Product Recommendation Engine (part 2) - tags a batch of
recommendations with a campaign ID so conversion can be measured later.
"""

import uuid


def tag_recommendations(rows, campaign_id=None):
    """
    Adds a campaign_id to every row (a list of dicts), generating a
    short random one if none is given.

        tag_recommendations(rows, campaign_id="spring-upsell")

    recommendations.csv can later be joined with an orders.csv on
    customer_id + sku + date to compute conversion rate for recommended
    vs. non-recommended purchases.
    """
    campaign_id = campaign_id or str(uuid.uuid4())[:8]
    return [{**row, "campaign_id": campaign_id} for row in rows]


if __name__ == "__main__":
    # Run this file on its own to check tagging works - no AI call, no
    # credits spent:  python ab_test.py
    rows = [{"customer_id": "1", "sku": "A"}, {"customer_id": "2", "sku": "B"}]

    print("Checking an explicit campaign_id is applied to every row...")
    tagged = tag_recommendations(rows, campaign_id="spring-upsell")
    assert all(row["campaign_id"] == "spring-upsell" for row in tagged)
    print("  OK -", tagged)

    print("\nChecking an auto-generated campaign_id is the same across all rows...")
    tagged = tag_recommendations(rows)
    campaign_ids = {row["campaign_id"] for row in tagged}
    assert len(campaign_ids) == 1
    assert len(list(campaign_ids)[0]) == 8
    print("  OK - single 8-character campaign_id generated and applied to every row:", campaign_ids)

    print("\nAll checks passed.")
