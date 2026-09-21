"""
Step 4 of the Product Recommendation Engine (part 1) - writes the top
recommendation onto each customer's CRM record as a note.
"""

import requests


def build_note_body(recommendation):
    """
    Pure function - the exact note text, tested below without a real
    HubSpot account.

        build_note_body({"sku": "PRO-1", "confidence": 8, "reason": "Fits their usage pattern"})
    """
    return f"AI Recommendation: {recommendation['sku']} (confidence {recommendation['confidence']}/10) - {recommendation['reason']}"


def push_recommendation_note(token, contact_id, recommendation):
    """
    Creates a HubSpot note associated with contact_id.

    The association type ID for "note to contact" (202 in most
    accounts) should be confirmed in your own HubSpot API docs -
    HubSpot's default association type IDs occasionally differ by
    account configuration.
    """
    note_body = build_note_body(recommendation)

    response = requests.post(
        "https://api.hubapi.com/crm/v3/objects/notes",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "properties": {"hs_note_body": note_body, "hs_timestamp": "now"},
            "associations": [{
                "to": {"id": contact_id},
                "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 202}],
            }],
        },
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    # Run this file on its own to check the note text is built
    # correctly - no HubSpot account or network call needed:
    #     python crm_push.py
    note = build_note_body({"sku": "PRO-1", "confidence": 8, "reason": "Fits their usage pattern"})
    assert note == "AI Recommendation: PRO-1 (confidence 8/10) - Fits their usage pattern"
    print("Built note:", note)

    print("\nAll checks passed.")
