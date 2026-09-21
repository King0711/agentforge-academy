"""
Step 3 of the CRM Lead Follow-Up Agent.

This is where deal context turns into an email a rep would actually
send. It also carries this project's safety guard: a generated email is
checked for banned topics (pricing, discounts) before it's ever saved
as a draft, since a rep should decide pricing language themselves, not
have the AI improvise it into an automated follow-up.
"""

from sdt_ai import ask_ai

SYSTEM_PROMPT = """You write short, on-brand sales follow-up emails.

Rules:
- Never mention pricing, discounts, or specific dollar amounts.
- End with exactly ONE clear call-to-action, e.g. "Free for a 15-min call this week?"
- Friendly, professional tone. No corporate jargon ("synergy", "circle back", "touch base").
- Under 100 words. No subject line, just the body."""

# Words that should never appear in an automated follow-up - a rep
# should decide pricing language themselves, not have the AI improvise
# it into a draft that goes out under their name.
BANNED_TOPICS = ["discount", "% off", "price is", "pricing is", "free trial"]


def build_prompt(enriched):
    """
    Turns one enriched deal (from enrich.py) into the prompt we send the
    AI. Pure function, no network call - tested below against fake
    enriched data.
    """
    deal = enriched["deal"]
    contact = enriched["contact"]
    notes = enriched["recent_notes"]

    contact_line = (
        f"Contact: {contact['first_name']} {contact['last_name']}, {contact['job_title']}"
        if contact
        else "Contact: unknown (write a slightly more general greeting)"
    )

    if notes:
        notes_block = "\n".join(f"- {note}" for note in notes)
    else:
        notes_block = "(no notes on file - do not invent a past conversation, keep it based on the deal stage only)"

    return f"""{contact_line}
Deal: {deal.properties['dealname']}, currently in stage "{deal.properties['dealstage']}"

Recent notes:
{notes_block}

Write the follow-up email body now."""


def contains_banned_topic(email_text):
    """
    Returns True if the generated email mentions a banned topic.

        contains_banned_topic("Let's discuss a 10% discount") -> True

    Case-insensitive substring check - deliberately simple and a little
    over-eager rather than a fragile attempt at true language
    understanding. A false positive here just means a rep double-checks
    one email; a false negative means an unauthorized discount goes out
    under their name.
    """
    lowered = email_text.lower()
    return any(topic in lowered for topic in BANNED_TOPICS)


def write_followup(enriched):
    """
    The main function. Give it one enriched deal, get back the email
    body - or raises ValueError if the AI ignored the pricing rule, so
    main.py never silently saves a draft that breaks house rules.
    """
    prompt = build_prompt(enriched)
    email_text = ask_ai(prompt, system=SYSTEM_PROMPT, max_tokens=250, project="crm-followup-agent")

    if contains_banned_topic(email_text):
        raise ValueError(
            "The AI mentioned pricing or a discount despite being told not to. "
            "Refusing to save this as a draft automatically - review it manually:\n\n"
            + email_text
        )

    return email_text


if __name__ == "__main__":
    # Run this file on its own to check the prompt-building and the
    # banned-topic guard work - no AI call, no credits spent:  python writer.py

    class _FakeDeal:
        def __init__(self, properties):
            self.properties = properties

    print("Checking build_prompt() with a full contact and notes...")
    enriched = {
        "deal": _FakeDeal({"dealname": "Acme Corp - Platform License", "dealstage": "presentation"}),
        "contact": {"first_name": "Amaka", "last_name": "Obi", "email": "amaka@acme.com", "job_title": "VP Sales"},
        "recent_notes": ["Demo went well, asked about integrations.", "Following up next week."],
    }
    prompt = build_prompt(enriched)
    assert "Amaka Obi" in prompt
    assert "Demo went well" in prompt
    print("  OK - contact and notes correctly included")

    print("\nChecking build_prompt() with no contact and no notes...")
    bare = {
        "deal": _FakeDeal({"dealname": "Bare Deal", "dealstage": "qualified"}),
        "contact": None,
        "recent_notes": [],
    }
    prompt = build_prompt(bare)
    assert "unknown" in prompt
    assert "do not invent a past conversation" in prompt
    print("  OK - missing contact/notes handled without crashing, and the AI is told not to invent history")

    print("\nChecking contains_banned_topic()...")
    assert contains_banned_topic("We can offer you a 20% discount this week.")
    assert contains_banned_topic("Let's start with a free trial.")
    assert not contains_banned_topic("Free for a quick call this week?")
    print("  OK - pricing/discount language correctly flagged, an unrelated 'free' correctly left alone")

    print("\nAll checks passed.")
