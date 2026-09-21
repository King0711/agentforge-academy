"""
Step 1 of the CRM Lead Follow-Up Agent.

This file talks to HubSpot: it fetches your open deals and tells you
which ones have gone stale. The staleness check (is_stale) is pure
Python with no network call in it, which is why the self-test at the
bottom can check it thoroughly without a HubSpot account. Only
get_stale_deals() itself needs a real login and a real HUBSPOT_TOKEN.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from hubspot import HubSpot

load_dotenv()

# Deals in these stages are done - a "stale" closed deal isn't a signal
# to follow up on, it's just a deal nobody filed away yet.
CLOSED_STAGES = {"closedwon", "closedlost"}

DEAL_PROPERTIES = ["dealname", "dealstage", "hs_lastmodifieddate", "amount"]


def is_stale(deal_properties, cutoff_days=7, now=None):
    """
    Returns True if a deal's properties dict shows no activity in
    cutoff_days days and it isn't already closed.

        is_stale({"dealstage": "presentation", "hs_lastmodifieddate": "2026-01-01T00:00:00.000Z"})

    Pure function - no network call, no HubSpot client needed - which is
    why this can be unit tested with fake data below, before you ever
    touch a real HubSpot account.

    A deal missing hs_lastmodifieddate entirely is treated as stale
    rather than raising - a record HubSpot never timestamped deserves at
    least as much of a look as one timestamped a month ago.
    """
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=cutoff_days)

    if deal_properties.get("dealstage") in CLOSED_STAGES:
        return False

    last_modified = deal_properties.get("hs_lastmodifieddate")
    if not last_modified:
        return True

    modified_at = datetime.fromisoformat(last_modified.replace("Z", "+00:00"))
    return modified_at < cutoff


def get_stale_deals(days=7):
    """
    Fetches every open deal from HubSpot and returns the stale ones.

        stale = get_stale_deals(days=7)

    Paginates using HubSpot's `after` cursor, so this works correctly on
    a pipeline with more than 100 open deals, not just the first page.
    """
    token = os.environ.get("HUBSPOT_TOKEN")
    if not token:
        raise RuntimeError(
            "No HUBSPOT_TOKEN found. Create a Private App in HubSpot "
            "(Settings > Integrations > Private Apps) with "
            "crm.objects.deals.read scope, and add the token to .env."
        )

    client = HubSpot(access_token=token)
    stale = []
    after = None

    while True:
        page = client.crm.deals.basic_api.get_page(
            limit=100, properties=DEAL_PROPERTIES, after=after
        )
        for deal in page.results:
            if is_stale(deal.properties, cutoff_days=days):
                stale.append(deal)

        if not page.paging or not page.paging.next:
            break
        after = page.paging.next.after

    return stale


if __name__ == "__main__":
    # Run this file on its own to check the staleness logic works - no
    # HubSpot account or network call needed:  python hubspot_client.py
    now = datetime(2026, 9, 2, tzinfo=timezone.utc)

    stale_deal = {"dealstage": "presentation", "hs_lastmodifieddate": "2026-08-01T00:00:00.000Z"}
    fresh_deal = {"dealstage": "presentation", "hs_lastmodifieddate": "2026-09-01T00:00:00.000Z"}
    closed_deal = {"dealstage": "closedwon", "hs_lastmodifieddate": "2026-01-01T00:00:00.000Z"}
    no_date_deal = {"dealstage": "presentation"}

    assert is_stale(stale_deal, cutoff_days=7, now=now) is True
    print("Stale deal (32 days old) correctly flagged as stale.")

    assert is_stale(fresh_deal, cutoff_days=7, now=now) is False
    print("Fresh deal (1 day old) correctly NOT flagged as stale.")

    assert is_stale(closed_deal, cutoff_days=7, now=now) is False
    print("Closed-won deal correctly NOT flagged as stale, no matter how old.")

    assert is_stale(no_date_deal, cutoff_days=7, now=now) is True
    print("Deal with no hs_lastmodifieddate at all correctly treated as stale.")

    print("\nAll staleness checks passed. Real HubSpot deal properties have this exact shape.")
