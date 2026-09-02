"""
Step 3 of the Lead Capture & Qualifier Bot.

This file builds the HubSpot API requests that create a contact and a
follow-up task. Building the request (a plain Python dict) is kept
completely separate from sending it (one requests.post call) - that
split is what lets you test and trust the payload shape without ever
needing a real HubSpot account, and it is why send_to_hubspot() is the
one function you swap out in tests (see main.py's self-test).
"""

import os

from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

# Loaded again here (sdt_ai.py also loads it) so this file's own
# self-test and any standalone use of it works no matter which file
# happens to be imported first - load_dotenv() is safe to call more
# than once.
load_dotenv()

HUBSPOT_BASE = "https://api.hubapi.com"

# Hot leads get a follow-up task due in 2 hours; everything else gets
# 24. This mirrors a real sales team's SLA: a lead that looks like a
# strong fit goes cold fast if nobody calls back the same day.
FOLLOW_UP_HOURS = {"hot": 2, "warm": 24, "cold": 24}


def build_contact_payload(lead, score_result):
    """
    Builds the request body for POST /crm/v3/objects/contacts.

    This is a pure function - no network call, nothing to configure -
    so you can test it with any lead dict and check the exact shape of
    what would be sent, without a HubSpot account or API key at all.

    Assumes three custom contact properties already exist in your
    HubSpot account: lead_score (Number), lead_tier (Single-line text)
    and ai_notes (Multi-line text). Create them under Settings >
    Properties before your first real submission (see Build 3).
    """
    full_name = lead.get("full_name", "").strip()
    first_name, _, last_name = full_name.partition(" ")

    return {
        "properties": {
            "email": lead.get("email", ""),
            "firstname": first_name,
            "lastname": last_name,
            "company": lead.get("company", ""),
            "lead_score": str(score_result["score"]),
            "lead_tier": score_result["tier"],
            "ai_notes": score_result["reason"],
        }
    }


def build_task_payload(contact_id, lead, score_result):
    """
    Builds the request body for POST /crm/v3/objects/tasks, with the
    association to the contact included in the same request - HubSpot
    lets you create and associate a task in one call instead of two.

    associationTypeId 204 is HubSpot's built-in "task to contact" link
    type - a fixed number HubSpot itself defines, not something you
    choose, so it's hardcoded here rather than made configurable.
    """
    tier = score_result["tier"]
    due_at = datetime.now(timezone.utc) + timedelta(hours=FOLLOW_UP_HOURS[tier])

    return {
        "properties": {
            "hs_task_subject": (
                f"Follow up: {lead.get('company', 'unknown company')} "
                f"({tier.upper()} - {score_result['score']}/10)"
            ),
            "hs_task_body": score_result["reason"],
            # HubSpot expects an ISO 8601 timestamp with millisecond
            # precision, e.g. "2026-08-20T12:30:00.000Z".
            "hs_timestamp": due_at.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "hs_task_status": "NOT_STARTED",
            "hs_task_priority": "HIGH" if tier == "hot" else "MEDIUM",
        },
        "associations": [
            {
                "to": {"id": contact_id},
                "types": [
                    {"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 204}
                ],
            }
        ],
    }


def send_to_hubspot(endpoint, payload, api_key):
    """
    The one function that actually talks to HubSpot. Every other
    function in this file is pure (just builds a dict) precisely so
    this is the only thing that needs replacing with a stub in tests -
    see main.py's self-test, which swaps this out for a fake that
    returns a made-up ID instead of making a real request.
    """
    response = requests.post(
        f"{HUBSPOT_BASE}{endpoint}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def create_contact(lead, score_result):
    """Creates the HubSpot contact and returns its new contact ID."""
    api_key = os.environ.get("HUBSPOT_API_KEY")
    payload = build_contact_payload(lead, score_result)
    result = send_to_hubspot("/crm/v3/objects/contacts", payload, api_key)
    return result["id"]


def create_followup_task(contact_id, lead, score_result):
    """Creates the follow-up task, already associated with the contact."""
    api_key = os.environ.get("HUBSPOT_API_KEY")
    payload = build_task_payload(contact_id, lead, score_result)
    return send_to_hubspot("/crm/v3/objects/tasks", payload, api_key)


if __name__ == "__main__":
    # Run this file on its own to check the payloads: python hubspot_client.py
    #
    # This never calls send_to_hubspot() or touches the network - it only
    # checks that build_contact_payload() and build_task_payload() produce
    # the shape HubSpot's Contacts and Tasks APIs actually expect, which
    # you can verify against the docs linked in this course's Resources
    # without needing a HubSpot account yet.
    fake_lead = {
        "full_name": "Jane Okafor",
        "email": "jane@acme.com",
        "company": "Acme Inc",
        "company_size": "51-200",
        "budget": "$5k-$10k/month",
        "challenge": "Our reporting is all manual spreadsheets.",
    }
    fake_score = {"score": 9, "tier": "hot", "reason": "Strong fit on size and budget."}

    contact_payload = build_contact_payload(fake_lead, fake_score)
    print("Contact payload:", contact_payload)
    assert contact_payload["properties"]["email"] == "jane@acme.com"
    assert contact_payload["properties"]["firstname"] == "Jane"
    assert contact_payload["properties"]["lastname"] == "Okafor"
    assert contact_payload["properties"]["lead_score"] == "9"

    task_payload = build_task_payload("12345", fake_lead, fake_score)
    print("\nTask payload:", task_payload)
    assert "Acme Inc" in task_payload["properties"]["hs_task_subject"]
    assert "HOT" in task_payload["properties"]["hs_task_subject"]
    assert task_payload["associations"][0]["to"]["id"] == "12345"
    assert task_payload["associations"][0]["types"][0]["associationTypeId"] == 204

    print("\nBoth payloads match the shape HubSpot's API expects.")
