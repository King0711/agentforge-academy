"""
Step 2 of the Product Recommendation Engine (part 1) - loads the
product catalog every recommendation is grounded against.

Create your own catalog.json with your real products in this shape:

[
  {"sku": "BASIC-1", "name": "Starter Plan", "description": "Core features for small teams", "price_tier": "low"},
  {"sku": "PRO-1", "name": "Analytics Pro", "description": "Advanced dashboards and reporting", "price_tier": "mid"},
  {"sku": "PRO-2", "name": "Automation Suite", "description": "Workflow automation tools", "price_tier": "mid"},
  {"sku": "ENT-1", "name": "Enterprise SSO", "description": "Single sign-on and audit logs", "price_tier": "high"},
  {"sku": "ENT-2", "name": "Dedicated Support", "description": "24/7 priority support line", "price_tier": "high"},
  {"sku": "ADDON-1", "name": "API Access", "description": "Programmatic access to your data", "price_tier": "low"}
]
"""

import json


def load_catalog(path="catalog.json"):
    """Reads path as a JSON file and returns the list of product dicts."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def valid_skus(catalog):
    """Pure function - the set of every real SKU in the catalog, used to catch a hallucinated recommendation."""
    return {product["sku"] for product in catalog}


if __name__ == "__main__":
    # Run this file on its own to check valid_skus() works - a real
    # catalog list in memory, no JSON file needed:  python catalog.py
    sample_catalog = [
        {"sku": "BASIC-1", "name": "Starter Plan"},
        {"sku": "PRO-1", "name": "Analytics Pro"},
    ]
    skus = valid_skus(sample_catalog)
    assert skus == {"BASIC-1", "PRO-1"}
    print("Extracted SKUs:", skus)

    print("\nAll checks passed.")
