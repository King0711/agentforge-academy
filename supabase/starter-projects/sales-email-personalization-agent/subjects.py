"""
Step 3 of the Sales Email Personalization Agent (part 2) - generates
and ranks subject line options, with a hard character limit enforced in
code rather than trusted to the AI's own count.
"""

import json

from sdt_ai import ask_ai

MAX_SUBJECT_LENGTH = 50


def build_prompt(email_body):
    return f"""Here is a cold email body:
{email_body}

Generate 5 subject line options, each under {MAX_SUBJECT_LENGTH}
characters. Rank them 1-5 by predicted open rate, with a one-phrase
reason for each ranking.

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"subjects": [{{"text": "...", "rank": 1, "reason": "..."}}]}}"""


def parse_subjects_reply(reply):
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
    return data.get("subjects", [])


def enforce_length_limit(subjects):
    """
    Truncates any subject line over MAX_SUBJECT_LENGTH in CODE, never
    trusting the AI's own character count - the same pattern used for
    SEO meta titles elsewhere in this course.

        enforce_length_limit([{"text": "x" * 80, "rank": 1, "reason": "..."}])
    """
    for subject in subjects:
        text = subject.get("text", "")
        if len(text) > MAX_SUBJECT_LENGTH:
            subject["text"] = text[:MAX_SUBJECT_LENGTH].rsplit(" ", 1)[0]
    return subjects


def generate_subject_lines(email_body):
    """The main function. Give it the email body, get back up to 5 validated subject line options."""
    prompt = build_prompt(email_body)
    reply = ask_ai(prompt, max_tokens=300, project="sales-email-personalization-agent")

    subjects = parse_subjects_reply(reply)
    if subjects is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    return enforce_length_limit(subjects)


if __name__ == "__main__":
    # Run this file on its own to check parsing and the length guard
    # work - no AI call, no credits spent:  python subjects.py
    print("Checking a subject line within the limit passes through unchanged...")
    fine_subjects = [{"text": "Quick question about Acme's reporting", "rank": 1, "reason": "specific"}]
    result = enforce_length_limit(fine_subjects)
    assert result[0]["text"] == "Quick question about Acme's reporting"
    print("  OK")

    print("\nChecking an over-limit subject gets truncated without cutting mid-word...")
    long_subjects = [{"text": "This subject line is definitely way too long for a real cold email subject", "rank": 1, "reason": "x"}]
    result = enforce_length_limit(long_subjects)
    assert len(result[0]["text"]) <= MAX_SUBJECT_LENGTH
    assert not result[0]["text"].endswith(" ")
    print(f"  OK - truncated to {len(result[0]['text'])} chars: {result[0]['text']!r}")

    print("\nChecking parse_subjects_reply() strips a ```json code fence...")
    fenced = '```json\n{"subjects": [{"text": "Hi", "rank": 1, "reason": "x"}]}\n```'
    assert len(parse_subjects_reply(fenced)) == 1
    print("  OK")

    print("\nAll checks passed.")
