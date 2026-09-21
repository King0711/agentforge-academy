"""
Step 4 of the Sales Email Personalization Agent (part 2) - pushes the
full sequence into your outreach tool. Written as a clearly-marked
adaptable template, since the exact API shape depends on whether you
use HubSpot Sequences, Outreach.io, or something else.
"""

import requests


def build_steps_payload(prospect_email, steps):
    """
    Turns the first email plus follow-ups into a list of
    {"send_day_offset", "recipient", "body"} dicts - the shape most
    sequencing tools expect, adapted to your specific tool's exact field
    names before sending.

        build_steps_payload("jordan@acme.com", [{"day": 0, "text": "..."}, ...])

    Pure function - tested below without a real CRM account.
    """
    return [
        {"send_day_offset": step["day"], "recipient": prospect_email, "body": step["text"]}
        for step in steps
    ]


def create_outreach_sequence(api_key, prospect_email, steps):
    """
    ADAPT THIS to your actual sequencing tool before using it for real -
    this shows the shape, not a working call to a specific product.

    For HubSpot Sequences: POST to
    https://api.hubapi.com/automation/v4/sequences/enrollments (check
    HubSpot's current docs for the exact required fields).

    For Outreach.io: POST to
    https://api.outreach.io/api/v2/sequenceStates (check Outreach's
    current docs for the exact required fields).
    """
    payload = build_steps_payload(prospect_email, steps)

    # Replace this URL and payload shape with your actual tool's API:
    response = requests.post(
        "https://api.example-crm.com/v1/sequences",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"steps": payload},
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    # Run this file on its own to check the payload-building works - no
    # CRM account or network call needed:  python crm_export.py
    steps = [{"day": 0, "text": "First email body"}, {"day": 3, "text": "Follow-up 1"}]
    payload = build_steps_payload("jordan@acme.com", steps)

    assert payload[0] == {"send_day_offset": 0, "recipient": "jordan@acme.com", "body": "First email body"}
    print("Built payload:", payload)

    print("\nAll checks passed.")
