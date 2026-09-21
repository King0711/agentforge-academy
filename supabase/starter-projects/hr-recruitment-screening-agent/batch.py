"""
Step 3 of the HR Recruitment Screening Agent (continued) - the command
you actually run: score every CV in a folder and push ranked results
into Airtable.

Run it with:      python batch.py
Blind mode:       python batch.py --blind
"""

import os
import sys

from airtable_write import build_record, push_to_airtable
from blind_review import redact_pii
from cv_reader import read_cvs
from dotenv import load_dotenv
from extract_contact import extract_contact
from score import score_candidate
from sdt_ai import AIError

load_dotenv()


def process_all(folder="cvs", blind=False):
    with open("jd.txt", encoding="utf-8") as f:
        jd_text = f.read()

    cvs = read_cvs(folder)
    if not cvs:
        raise ValueError(f"No PDF files found in '{folder}/' - add your CVs there first.")

    base_id = os.environ["AIRTABLE_BASE_ID"]
    api_key = os.environ["AIRTABLE_API_KEY"]

    for path, cv_text in cvs.items():
        try:
            # Contact info always uses the UNREDACTED text - a name and
            # email are needed either way, and redacting them would just
            # make the candidate impossible to follow up with.
            contact = extract_contact(cv_text)
            scoring_text = redact_pii(cv_text) if blind else cv_text
            score_data = score_candidate(scoring_text, jd_text)
        except (AIError, ValueError) as problem:
            print(f"Skipped {path}: {problem}")
            continue

        record = build_record(contact["name"] or "(name not found)", contact["email"], score_data)
        push_to_airtable(base_id, "Candidates", api_key, record)

        flag = " [NEEDS REVIEW]" if score_data.get("needs_review") else ""
        print(f"Processed {record['Name']}: {record['Score']}/10{flag}")


if __name__ == "__main__":
    blind_mode = "--blind" in sys.argv
    process_all(blind=blind_mode)
