"""
Step 4 of the Price & Competitor Monitor Agent -- wires the other three
files together into one run: scrape -> compare -> summarize -> alert.

Run it once by hand to try it:      python main.py
Run it on a schedule (see the bottom of this file) to actually monitor
something while you're not watching.
"""

from dotenv import load_dotenv

from scraper import scrape_product
from tracker import load_snapshot, save_snapshot, diff_snapshots
from alert import summarize_changes
from sdt_ai import AIError

load_dotenv()

SNAPSHOT_FILE = "snapshot.json"

# Add one entry per product you want to watch. The "target" name is
# yours to choose -- it's the key snapshots are tracked under between
# runs, so keep it stable even if the scraped product name changes.
TARGETS = [
    {
        "target": "Competitor A - Pro Plan",
        "url": "https://example.com/pricing",
        "name_selector": ".pro-plan .plan-name",
        "price_selector": ".pro-plan .price",
    },
    # Add more targets here, one dict per product you want to track.
]


def run_once():
    """
    Scrapes every target, compares against the last saved snapshot, and
    prints a summary if anything changed. Called once per schedule tick.
    """
    previous = load_snapshot(SNAPSHOT_FILE)
    current = {}
    scrape_errors = []

    for entry in TARGETS:
        try:
            current[entry["target"]] = scrape_product(
                entry["url"], entry["name_selector"], entry["price_selector"]
            )
        except ValueError as problem:
            # One broken selector shouldn't stop the whole run -- keep
            # checking every other target, and just report this one.
            scrape_errors.append(f"{entry['target']}: {problem}")

    for problem in scrape_errors:
        print(f"Skipped a target: {problem}")

    changes = diff_snapshots(previous, current)

    if not changes:
        print("No changes detected.")
    else:
        print(f"{len(changes)} change(s) detected:")
        for change in changes:
            print(" ", change)

        try:
            alert = summarize_changes(changes)
            print("\n--- Alert ---")
            print(alert["SUMMARY"])
            print(alert["DETAILS"])
            # Swap these prints for send_email(...) or a Slack webhook
            # post once you've picked how you want to be notified.
        except AIError as problem:
            # The AI summary failed (network hiccup, no credits left,
            # rate limit, etc.) but the changes themselves were still
            # detected by real scraping+diffing -- print the raw changes
            # so a temporary AI outage never means a silently lost alert.
            print(f"\nCouldn't get an AI summary ({problem})")
            print("Raw changes are listed above -- nothing was missed, just not summarized.")

    # Save today's scrape as tomorrow's "previous", regardless of
    # whether anything changed. Skip this and every future run compares
    # against the same stale snapshot forever, which is a subtler
    # version of the "alert every run" bug in the troubleshooting notes.
    save_snapshot(SNAPSHOT_FILE, current)


if __name__ == "__main__":
    run_once()

    # To run this automatically instead of by hand, schedule it with
    # cron (Mac/Linux) or Task Scheduler (Windows). A crontab line that
    # runs it every 6 hours:
    #
    #     0 */6 * * * cd /path/to/this/folder && /path/to/.venv/bin/python main.py
    #
    # A schedule on your own laptop only fires while the laptop is on
    # and awake -- it silently stops the moment it sleeps or shuts down.
    # For real always-on monitoring, deploy this the same way as the
    # WhatsApp/Gmail course guides (a free always-on host).
