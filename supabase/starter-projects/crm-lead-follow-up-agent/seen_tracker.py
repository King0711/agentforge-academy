"""
Step 4 of the CRM Lead Follow-Up Agent (part 1) - remembers which deals
already got a follow-up drafted, so rerunning main.py every weekday
morning doesn't create a duplicate Gmail draft for the same deal.
"""

import json
import os

SEEN_FILE = "seen_deals.json"


def load_seen_ids(path=SEEN_FILE):
    """Returns the set of deal IDs already followed up on. Empty set on first run."""
    if not os.path.exists(path):
        return set()
    with open(path, "r", encoding="utf-8") as f:
        return set(json.load(f))


def save_seen_ids(seen_ids, path=SEEN_FILE):
    """Persists the set of followed-up deal IDs to disk."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(sorted(seen_ids), f)


def filter_unseen(deals, seen_ids):
    """
    Returns only the deals whose id is NOT already in seen_ids.

        fresh = filter_unseen(stale_deals, seen_ids)

    Pure function - this is the actual duplicate-prevention logic, kept
    separate from the file I/O above so it can be tested without ever
    touching disk.
    """
    return [deal for deal in deals if deal.id not in seen_ids]


if __name__ == "__main__":
    # Run this file on its own to check the logic works:  python seen_tracker.py
    class _FakeDeal:
        def __init__(self, deal_id):
            self.id = deal_id

    deals = [_FakeDeal("1"), _FakeDeal("2"), _FakeDeal("3")]
    seen = {"2"}

    fresh = filter_unseen(deals, seen)
    fresh_ids = [d.id for d in fresh]
    assert fresh_ids == ["1", "3"]
    print("Deal 2 (already seen) correctly filtered out. Remaining:", fresh_ids)

    print("\nChecking save/load round-trip through a real temp file...")
    import tempfile
    tmp_path = os.path.join(tempfile.gettempdir(), "sdt_test_seen_deals.json")
    save_seen_ids({"1", "2", "3"}, path=tmp_path)
    loaded = load_seen_ids(path=tmp_path)
    assert loaded == {"1", "2", "3"}
    os.remove(tmp_path)
    print("Confirmed: saved IDs match what was loaded back.")

    print("\nAll checks passed.")
