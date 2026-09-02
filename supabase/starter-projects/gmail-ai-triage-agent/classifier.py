"""
Step 2 of the Gmail AI Triage Agent.

This file asks Claude to do two things in a single call: decide how
urgent an email is, and draft a short reply if one is worth writing.
Asking both questions in one request (instead of a classify call followed
by a separate draft-a-reply call) is a deliberate cost choice, not just a
simplification - see build_prompt() below.
"""

from sdt_ai import ask_ai

PRIORITIES = ["HIGH", "MEDIUM", "LOW"]

# Stop the email body here before sending it to the AI. Same money
# reasoning as the social post generator's MAX_CHARACTERS, but it matters
# even more here: main.py calls the AI once PER EMAIL in a loop of up to
# 10, so one unusually long email (a forwarded thread with three quoted
# replies underneath it, say) costs 10x what a normal one does if it
# isn't capped - and the quoted history under a forward almost never
# changes how the NEW message on top should be triaged.
MAX_BODY_CHARACTERS = 2000


def build_prompt(email):
    """
    Writes the instructions we send to the AI for one email.

    We ask for PRIORITY, REASON and REPLY in the SAME request rather than
    classifying first and then making a second call to draft a reply.
    That halves the number of AI calls this project makes - for a
    12-email inbox that's the difference between 12 requests and 24. The
    tradeoff is a slightly busier prompt and parser (see parse_reply
    below), which is worth it precisely because this runs in a loop.
    """
    body = email["body"][:MAX_BODY_CHARACTERS]

    return f"""You are triaging one email for a busy inbox owner.

From: {email['sender']}
Subject: {email['subject']}
Body:
{body}

Decide how urgent this email is, and draft a short reply IF AND ONLY IF
it is HIGH or MEDIUM priority. LOW priority emails (newsletters, receipts,
automated notifications, FYI-only messages) do not get a drafted reply.

Format your answer EXACTLY like this:

[PRIORITY]
one word: HIGH, MEDIUM, or LOW

[REASON]
one short sentence explaining why

[REPLY]
a short, professional reply under 80 words - or the single word NONE if
priority is LOW

[END]

Do not add any explanation, introduction, or closing remark outside these
sections."""


def parse_reply(reply):
    """
    Turns the AI's one answer into a dict:

        {"priority": "HIGH", "reason": "...", "reply": "..." or None}

    Same [MARKER] approach as the social post generator, and for the same
    reason: raw JSON breaks the moment the AI adds a stray "Sure, here's
    the triage:" before the data, or wraps its answer in a code fence -
    and for an inbox tool that runs unattended, a crash is worse than a
    slightly imperfect parse.

    Returns None (never raises) if the AI's answer had no recognizable
    [PRIORITY] section at all. main.py checks for that and skips the
    email rather than guessing a label for it.
    """
    sections = {}
    current = None
    lines = []

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        if is_marker and marker == "END":
            break

        if is_marker and marker in ("PRIORITY", "REASON", "REPLY"):
            if current:
                sections[current] = "\n".join(lines).strip()
            current = marker
            lines = []
        elif current:
            # The AI occasionally wraps its whole answer in ``` code
            # fences even when explicitly told not to - drop those lines
            # rather than let them end up inside a drafted reply.
            if stripped.startswith("```"):
                continue
            lines.append(line)

    if current:
        sections[current] = "\n".join(lines).strip()

    if "PRIORITY" not in sections:
        return None

    priority = sections["PRIORITY"].upper()
    if priority not in PRIORITIES:
        # The AI sometimes answers "HIGH." with trailing punctuation, or
        # "HIGH - because it's time sensitive". Take the first
        # recognizable priority word inside the section rather than
        # throwing the whole classification away over one stray period.
        priority = next((p for p in PRIORITIES if p in priority), None)
        if not priority:
            return None

    reply_text = sections.get("REPLY", "").strip()
    if not reply_text or reply_text.upper() == "NONE":
        reply_text = None

    return {
        "priority": priority,
        "reason": sections.get("REASON", "").strip(),
        "reply": reply_text,
    }


def classify_email(email):
    """
    The main function. Give it one parsed email (the dict shape that
    gmail_client.parse_message returns), get back its priority, the
    reason, and an optional drafted reply.

        result = classify_email(email)
        print(result["priority"])

    Returns None if the AI's reply couldn't be parsed at all - a real
    possibility with any LLM, not a bug in this code - so main.py must
    handle that case rather than assume classification always succeeds.
    """
    prompt = build_prompt(email)

    # max_tokens=300 is generous for one priority word, one sentence, and
    # an 80-word reply. Capping it keeps one unusually verbose response
    # from burning through credits it has no real use for.
    reply = ask_ai(prompt, max_tokens=300, project="gmail-ai-triage-agent")

    return parse_reply(reply)


if __name__ == "__main__":
    # Run this file on its own to check the parser works - zero AI calls,
    # zero credits spent:  python classifier.py
    good_reply = """[PRIORITY]
HIGH

[REASON]
The sender says production is down and needs a call back.

[REPLY]
Got it, calling you now.

[END]"""

    result = parse_reply(good_reply)
    print("Well-formed reply parsed as:", result)
    assert result["priority"] == "HIGH"
    assert result["reply"] == "Got it, calling you now."

    low_priority_reply = """[PRIORITY]
LOW

[REASON]
This is a newsletter with no action needed.

[REPLY]
NONE

[END]"""
    low_result = parse_reply(low_priority_reply)
    assert low_result["priority"] == "LOW"
    assert low_result["reply"] is None
    print("LOW priority with REPLY: NONE correctly produced reply=None.")

    # A malformed reply: no markers at all, just prose. This must not
    # crash - it must come back as None so main.py can skip this email
    # instead of mislabeling it.
    malformed_reply = "Sure! I'd say this one is pretty urgent, you should reply soon."
    assert parse_reply(malformed_reply) is None
    print("Malformed reply (no markers at all) correctly returned None instead of crashing.")

    # A messy but recoverable reply: chatter before the markers, and
    # lowercase/punctuation on the priority word.
    messy_reply = """Sure, here's my triage:

[PRIORITY]
medium.

[REASON]
Needs a reply this week but nothing urgent.

[REPLY]
Thanks for the update, I'll follow up by Friday.

[END]

Let me know if you'd like a different tone!"""
    messy_result = parse_reply(messy_reply)
    assert messy_result is not None
    assert messy_result["priority"] == "MEDIUM"
    print("Messy reply (extra prose, lowercase, trailing period) still parsed correctly.")

    print("\nAll parser checks passed.")
