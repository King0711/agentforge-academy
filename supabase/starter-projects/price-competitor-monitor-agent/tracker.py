"""
Step 2 of the Price & Competitor Monitor Agent.

This file compares today's scrape against yesterday's saved snapshot and
returns a list of what changed. The comparison itself (diff_snapshots)
is a pure function -- give it two dictionaries, get back a list -- which
is what makes it fully testable without ever touching the network or a
real file on disk.
"""

import json


def load_snapshot(path):
    """
    Reads a saved snapshot file from disk.

    Returns an empty dict if the file doesn't exist yet -- which is
    exactly what happens on the very first run, before there is
    anything to compare against. Without this, the very first run of
    the whole project would crash before it ever produced a snapshot.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_snapshot(path, snapshot):
    """Writes today's scrape to disk so tomorrow's run has something to compare against."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)


def diff_snapshots(previous, current):
    """
    Compares two snapshots and returns a list of change dictionaries.

        previous = {"Widget Pro": {"name": "Widget Pro", "price": "$49.00"}}
        current  = {"Widget Pro": {"name": "Widget Pro", "price": "$59.00"}}
        diff_snapshots(previous, current)
        # [{"target": "Widget Pro", "type": "price_changed",
        #   "old_price": "$49.00", "new_price": "$59.00"}]

    Both snapshots are dictionaries keyed by "target" -- the name YOU
    chose for a product in main.py's TARGETS list, not necessarily the
    product name scraped off the page (a competitor could rename their
    own product between runs too, and we still want to track it as the
    same target).

    Three kinds of changes are detected: a price changing on a product
    you're already tracking, a brand-new product appearing under a
    target you're watching, and a product that disappeared entirely.
    That last one is deliberately vague about WHY it disappeared --
    delisted, or your selector stopped matching -- because this function
    has no way to tell those apart. See the README's troubleshooting
    section for how a human tells them apart.
    """
    changes = []

    for target_name, current_data in current.items():
        if target_name not in previous:
            changes.append({
                "target": target_name,
                "type": "new_product",
                "name": current_data.get("name"),
                "price": current_data.get("price"),
            })
            continue

        old_price = previous[target_name].get("price")
        new_price = current_data.get("price")
        if old_price != new_price:
            changes.append({
                "target": target_name,
                "type": "price_changed",
                "old_price": old_price,
                "new_price": new_price,
            })

    for target_name in previous:
        if target_name not in current:
            changes.append({
                "target": target_name,
                "type": "product_removed",
                "name": previous[target_name].get("name"),
            })

    return changes


if __name__ == "__main__":
    # Run this file on its own to check the diff logic works:
    #     python tracker.py
    previous = {
        "Widget Pro": {"name": "Widget Pro", "price": "$49.00"},
        "Widget Mini": {"name": "Widget Mini", "price": "$19.00"},
    }
    current = {
        "Widget Pro": {"name": "Widget Pro", "price": "$59.00"},   # price changed
        "Widget Max": {"name": "Widget Max", "price": "$99.00"},   # new product
        # Widget Mini is gone -> product_removed
    }

    changes = diff_snapshots(previous, current)
    print(f"Found {len(changes)} changes:\n")
    for change in changes:
        print(" ", change)

    assert len(changes) == 3, f"Expected 3 changes, got {len(changes)}"
    types_found = {c["type"] for c in changes}
    assert types_found == {"price_changed", "new_product", "product_removed"}, \
        f"Missing a change type: {types_found}"

    # A snapshot compared against itself must never produce noise. This
    # is exactly the bug the README's troubleshooting section warns
    # about ("getting an alert on every run even with no real change")
    # -- usually caused by comparing raw scraped text that has stray
    # whitespace differences instead of the cleaned-up price string.
    assert diff_snapshots(previous, previous) == [], "Comparing a snapshot to itself found changes!"

    print("\nSelf-test passed.")
