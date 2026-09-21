"""
Step 4 of the Sales Email Personalization Agent (part 3) - chains every
build together for one prospect.

Run it with:  python main.py "Jordan Lee" "Acme Robotics" acme.com
"""

import os
import sys

from dotenv import load_dotenv
from enrich import enrich_prospect
from hunter import find_email
from intelligence import extract_intelligence
from mapping import map_value_props
from sdt_ai import AIError
from sequence import build_followup_sequence
from subjects import generate_subject_lines
from write_email import write_cold_email

load_dotenv()


def run(name, company, domain, hunter_api_key):
    print(f"Researching {name} at {company}...")
    enriched = enrich_prospect(name, company)

    first_name, *rest = name.split(" ")
    last_name = rest[-1] if rest else ""
    email_result = find_email(first_name, last_name, domain, hunter_api_key)

    if not email_result["usable"]:
        print(f"  No usable email found (confidence: {email_result['confidence']}) - stopping here.")
        return

    print(f"  Found: {email_result['email']} (confidence {email_result['confidence']})")

    print("Extracting intelligence...")
    intel = extract_intelligence(name, company, enriched)

    value_props = map_value_props(intel.get("challenges", []))

    print("Writing the cold email...")
    email_body = write_cold_email(name, company, intel, value_props[0])

    print("Generating subject lines...")
    subjects = generate_subject_lines(email_body)

    print("Building the follow-up sequence...")
    followups = build_followup_sequence(email_body, intel)

    print("\n=== EMAIL ===")
    print(email_body)
    print("\n=== TOP SUBJECT LINE ===")
    best_subject = min(subjects, key=lambda s: s.get("rank", 99))
    print(best_subject["text"])
    print("\n=== FOLLOW-UP SEQUENCE ===")
    for followup in followups:
        print(f"Day {followup['day']}: {followup['text']}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print('Usage: python main.py "First Last" "Company Name" companydomain.com')
        sys.exit(1)

    try:
        run(sys.argv[1], sys.argv[2], sys.argv[3], os.environ["HUNTER_API_KEY"])
    except AIError as problem:
        print(f"AI request failed:\n{problem}")
    except ValueError as problem:
        print(f"Could not complete the pipeline:\n{problem}")
