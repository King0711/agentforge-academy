"""
Step 3 of the Sales Email Personalization Agent (part 1) - writes the
personalized cold email. This project's safety guard checks the
generated email against a list of banned generic filler phrases, since
"I hope this finds you well" measurably hurts reply rates and a prompt
instruction alone doesn't always stop a model from reaching for it.
"""

from sdt_ai import ask_ai

MAX_WORDS = 100

# Phrases that measurably hurt cold email reply rates - banned in the
# prompt AND checked again here, the same "don't just ask, verify"
# pattern used throughout this course.
BANNED_PHRASES = [
    "i hope this finds you well", "i hope this email finds you well",
    "i hope you're doing well", "i hope all is well",
    "just checking in", "circle back", "touch base",
]


def build_prompt(name, company, intel, value_prop):
    challenge = intel["challenges"][0] if intel.get("challenges") else "growing efficiently"

    return f"""Write a cold email to {name} at {company}.

Open by referencing this specific recent event: {intel.get('recent_event', '(none available - open on their likely challenge instead)')}
Mention this likely challenge: {challenge}
Connect it to this value proposition: {value_prop}

Rules:
- Under 100 words
- End with exactly one low-friction call to action (e.g. "Worth a quick chat?")
- NEVER use generic openers like "I hope this finds you well", "I hope you're doing well", "just checking in", "circle back", or "touch base"
- No subject line - just the email body"""


def contains_banned_phrase(email_text):
    """
    Returns True if the email uses one of the exact phrases known to
    hurt reply rates.

        contains_banned_phrase("I hope this finds you well, Jordan...") -> True
    """
    lowered = email_text.lower()
    return any(phrase in lowered for phrase in BANNED_PHRASES)


def write_cold_email(name, company, intel, value_prop):
    """
    The main function. Give it the prospect's details, get back the
    email body - or raises ValueError if it used a banned phrase, so
    main.py never silently sends a generic-sounding email.
    """
    prompt = build_prompt(name, company, intel, value_prop)
    email_text = ask_ai(prompt, max_tokens=300, project="sales-email-personalization-agent")

    if contains_banned_phrase(email_text):
        raise ValueError(
            "The AI used a banned generic filler phrase despite being told not to. "
            "Refusing to use this draft automatically - review it manually:\n\n" + email_text
        )

    word_count = len(email_text.split())
    if word_count > MAX_WORDS:
        print(f"  Note: email came back at {word_count} words (target under {MAX_WORDS}) - worth a manual trim.")

    return email_text


if __name__ == "__main__":
    # Run this file on its own to check prompt-building and the banned-
    # phrase guard work - no AI call, no credits spent:  python write_email.py
    intel = {"challenges": ["manual reporting takes too long"], "recent_event": "Acme Robotics raised a Series B in 2026"}

    print("Checking build_prompt() includes the real details...")
    prompt = build_prompt("Jordan Lee", "Acme Robotics", intel, "Our platform auto-generates reports")
    assert "Series B" in prompt
    assert "manual reporting" in prompt
    assert "I hope this finds you well" in prompt  # correctly present as a BANNED example, not used
    print("  OK")

    print("\nChecking contains_banned_phrase()...")
    assert contains_banned_phrase("I hope this finds you well, Jordan!")
    assert contains_banned_phrase("Just wanted to touch base about your reporting workflow.")
    assert not contains_banned_phrase("Saw Acme Robotics just raised a Series B - congrats.")
    print("  OK - banned openers correctly flagged, a genuine personalized opener correctly left alone")

    print("\nAll checks passed.")
