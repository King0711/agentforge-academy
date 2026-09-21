"""
Step 4 of the Sales Email Personalization Agent (part 1) - builds a
3-touch follow-up sequence for prospects who don't reply to the first
email.
"""

import json

from sdt_ai import ask_ai

FOLLOWUP_DAYS = [3, 7, 14]
MAX_WORDS = 60


def build_prompt(first_email, intel):
    challenges = ", ".join(intel.get("challenges", [])) or "their business challenges"

    return f"""Original email sent:
{first_email}

Prospect's challenges: {challenges}

Write a 3-email follow-up sequence for days 3, 7, and 14, each under
{MAX_WORDS} words. Day 3 = gentle bump. Day 7 = new angle with a
different value prop or case study. Day 14 = a breakup email (this
often gets the highest reply rate of the three, since it creates a
sense of finality).

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"followups": [{{"day": 3, "text": "..."}}, {{"day": 7, "text": "..."}}, {{"day": 14, "text": "..."}}]}}"""


def parse_sequence_reply(reply):
    """Defensive JSON parsing, same pattern used throughout this course. Returns None on real garbage."""
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    return data.get("followups", [])


def validate_sequence(followups):
    """
    Checks the sequence covers exactly days 3, 7, and 14 - a sequence
    missing a touch (e.g. day 3 and 14 but no day 7) changes the whole
    cadence's pacing and shouldn't be scheduled as-is.
    """
    days_present = {f.get("day") for f in followups}
    missing = set(FOLLOWUP_DAYS) - days_present
    return len(missing) == 0, missing


def build_followup_sequence(first_email, intel):
    """The main function. Give it the original email and intel, get back the validated 3-touch sequence."""
    prompt = build_prompt(first_email, intel)
    reply = ask_ai(prompt, max_tokens=600, project="sales-email-personalization-agent")

    followups = parse_sequence_reply(reply)
    if followups is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    is_complete, missing = validate_sequence(followups)
    if not is_complete:
        raise ValueError(f"Sequence is missing day(s): {sorted(missing)}. Run it again.")

    return followups


if __name__ == "__main__":
    # Run this file on its own to check parsing and the completeness
    # guard work - no AI call, no credits spent:  python sequence.py
    print("Checking a complete sequence passes validation...")
    complete = [{"day": 3, "text": "a"}, {"day": 7, "text": "b"}, {"day": 14, "text": "c"}]
    is_complete, missing = validate_sequence(complete)
    assert is_complete is True
    print("  OK")

    print("\nChecking a sequence missing day 7 is correctly caught...")
    incomplete = [{"day": 3, "text": "a"}, {"day": 14, "text": "c"}]
    is_complete, missing = validate_sequence(incomplete)
    assert is_complete is False
    assert missing == {7}
    print("  OK - missing day(s):", missing)

    print("\nChecking parse_sequence_reply() strips a ```json code fence...")
    fenced = '```json\n{"followups": [{"day": 3, "text": "a"}]}\n```'
    assert len(parse_sequence_reply(fenced)) == 1
    print("  OK")

    print("\nAll checks passed.")
