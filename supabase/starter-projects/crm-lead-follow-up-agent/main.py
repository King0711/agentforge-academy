"""
Step 4 of the CRM Lead Follow-Up Agent (part 4) - the command you
actually run, ideally every weekday morning.

Run it with:  python main.py
"""

import os

from dotenv import load_dotenv
from enrich import enrich_deal
from gmail_draft import get_gmail_service, save_gmail_draft
from hubspot import HubSpot
from hubspot_client import get_stale_deals
from notify import notify_slack
from seen_tracker import filter_unseen, load_seen_ids, save_seen_ids
from writer import write_followup

load_dotenv()


def run():
    token = os.environ.get("HUBSPOT_TOKEN")
    hubspot_client = HubSpot(access_token=token)
    gmail_service = get_gmail_service()

    seen_ids = load_seen_ids()
    stale_deals = get_stale_deals()
    fresh_deals = filter_unseen(stale_deals, seen_ids)

    print(f"{len(stale_deals)} stale deal(s), {len(fresh_deals)} not yet followed up on.\n")

    drafted = 0
    for deal in fresh_deals:
        try:
            enriched = enrich_deal(hubspot_client, deal)
            email_body = write_followup(enriched)
        except ValueError as problem:
            print(f"Skipped '{deal.properties['dealname']}': {problem}")
            continue

        contact = enriched["contact"]
        to_email = contact["email"] if contact and contact["email"] else ""
        if not to_email:
            print(f"Skipped '{deal.properties['dealname']}': no contact email on file.")
            continue

        subject = f"Following up - {deal.properties['dealname']}"
        save_gmail_draft(gmail_service, to_email, subject, email_body)
        seen_ids.add(deal.id)
        drafted += 1
        print(f"Drafted follow-up for: {deal.properties['dealname']}")

    save_seen_ids(seen_ids)
    notify_slack(os.environ.get("SLACK_WEBHOOK_URL", ""), drafted)
    print(f"\nDone. {drafted} new draft(s) created.")


if __name__ == "__main__":
    run()
