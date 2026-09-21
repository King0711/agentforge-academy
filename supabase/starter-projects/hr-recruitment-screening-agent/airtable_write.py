"""
Step 3 of the HR Recruitment Screening Agent - pushes scored candidates
into an Airtable base.
"""

import time

import requests

AIRTABLE_RATE_LIMIT_DELAY = 0.25  # stays comfortably under Airtable's 5 req/sec limit


def build_record(name, email, score_data):
    """
    Turns contact info and a validated score dict into the exact field
    shape your Airtable "Candidates" table expects.

        build_record("Amaka Obi", "amaka@example.com", score_data)

    Pure function, no network call - tested below without a real base.
    """
    return {
        "Name": name,
        "Email": email,
        "Score": score_data["overall_score"],
        "Strengths": "\n".join(score_data.get("strengths", [])),
        "Gaps": "\n".join(score_data.get("gaps", [])),
        "Recommendation": score_data.get("recommendation", ""),
    }


def push_to_airtable(base_id, table, api_key, record):
    """POSTs one record to the Airtable REST API."""
    response = requests.post(
        f"https://api.airtable.com/v0/{base_id}/{table}",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"fields": record},
    )
    response.raise_for_status()
    time.sleep(AIRTABLE_RATE_LIMIT_DELAY)
    return response.json()


if __name__ == "__main__":
    # Run this file on its own to check record-building works - no
    # Airtable account or network call needed:  python airtable_write.py
    score_data = {
        "overall_score": 8,
        "strengths": ["Strong Python skills", "Led a team of 5", "Clear communicator"],
        "gaps": ["Limited cloud experience"],
        "recommendation": "Yes",
    }
    record = build_record("Amaka Obi", "amaka@example.com", score_data)
    assert record["Score"] == 8
    assert record["Strengths"] == "Strong Python skills\nLed a team of 5\nClear communicator"
    assert record["Recommendation"] == "Yes"
    print("Built record:", record)
    print("\nAll checks passed.")
