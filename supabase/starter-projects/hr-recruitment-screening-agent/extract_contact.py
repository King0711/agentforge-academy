"""
Step 2 of the HR Recruitment Screening Agent (part 3) - pulls just the
candidate's name and email from the top of their CV, using far fewer
tokens than sending the whole document.
"""

import json

from sdt_ai import ask_ai

# Only the first N characters go into this call. A MONEY decision: a
# name and email address appear in the first few lines of virtually
# every CV ever formatted - sending the whole multi-page document to
# extract two short fields would be paying for content this call never
# needs to read.
MAX_HEADER_CHARACTERS = 1000


def build_prompt(cv_text):
    header = cv_text[:MAX_HEADER_CHARACTERS]
    return f"""Extract the candidate's full name and email address from this CV
excerpt. Return ONLY this JSON shape, no markdown code fence:
{{"name": "...", "email": "..."}}

If either isn't findable in this excerpt, use an empty string "" - do
not guess a plausible-looking name or email.

CV EXCERPT:
{header}"""


def parse_contact_reply(reply):
    """Same defensive JSON parsing as score.py - tolerates a code fence, returns None on real garbage."""
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
    return {"name": data.get("name", ""), "email": data.get("email", "")}


def extract_contact(cv_text):
    """The main function. Give it CV text, get back {"name": "...", "email": "..."}."""
    prompt = build_prompt(cv_text)
    reply = ask_ai(prompt, max_tokens=100, project="hr-recruitment-screening-agent")

    contact = parse_contact_reply(reply)
    if contact is None:
        raise ValueError(
            "The AI's reply wasn't valid JSON.\n"
            "Run it again - this usually fixes itself."
        )
    return contact


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no AI call,
    # no credits spent:  python extract_contact.py
    print("Checking a clean reply...")
    clean = '{"name": "Amaka Obi", "email": "amaka@example.com"}'
    assert parse_contact_reply(clean) == {"name": "Amaka Obi", "email": "amaka@example.com"}
    print("  OK")

    print("\nChecking a ```json-fenced reply...")
    fenced = '```json\n{"name": "Chidi Eze", "email": ""}\n```'
    assert parse_contact_reply(fenced) == {"name": "Chidi Eze", "email": ""}
    print("  OK - empty email correctly preserved as '', not dropped")

    print("\nChecking a non-JSON reply returns None...")
    assert parse_contact_reply("I couldn't find that information.") is None
    print("  OK")

    print("\nAll checks passed.")
