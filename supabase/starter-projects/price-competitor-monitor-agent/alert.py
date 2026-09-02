"""
Step 3 of the Price & Competitor Monitor Agent.

This file turns a list of raw changes (the kind tracker.py produces)
into a short, plain-English summary suitable for pasting into an email
-- the sort of thing a human skims in five seconds, not a JSON blob.
"""

from sdt_ai import ask_ai

# Roughly how long the AI's answer may be. A summary of a handful of
# price changes fits comfortably in a couple of short paragraphs -- this
# caps what one alert costs you in credits, the same way MAX_CHARACTERS
# caps cost in the Social Post Generator project.
MAX_TOKENS = 400


def build_prompt(changes):
    """
    Writes the instructions we send to the AI.

    We describe each change as a plain sentence rather than dumping the
    raw dictionaries at the AI -- it writes a noticeably better summary
    reading sentences than it does parsing structured data itself.
    """
    lines = []
    for change in changes:
        if change["type"] == "price_changed":
            lines.append(
                f"- {change['target']}: price changed from "
                f"{change['old_price']} to {change['new_price']}"
            )
        elif change["type"] == "new_product":
            lines.append(
                f"- {change['target']}: new product appeared, "
                f"\"{change['name']}\" at {change['price']}"
            )
        elif change["type"] == "product_removed":
            lines.append(f"- {change['target']}: product no longer listed on the page")

    changes_text = "\n".join(lines)

    return f"""A price-monitoring tool just detected the following changes on
competitor pages:

{changes_text}

Write a short "what changed" summary suitable for an email alert to a
small business owner. Be specific about numbers and products -- don't
be vague.

Format your answer EXACTLY like this:

[SUMMARY]
one sentence, the headline takeaway

[DETAILS]
a few sentences of plain-English detail, referencing the actual products
and prices listed above

[END]

Do not add any explanation, introduction or closing remark outside
those markers."""


def parse_alert(reply):
    """
    Turns the AI's [SUMMARY]/[DETAILS] reply into a dictionary:

        {"SUMMARY": "...", "DETAILS": "..."}

    Bracket markers instead of JSON, for the same reason generator.py in
    the Social Post Generator project uses them: an AI reply that is
    almost-but-not-quite valid JSON (a stray comma, a wrapped code
    fence) crashes json.loads() outright. A marker line the AI gets
    slightly wrong just fails to match and is skipped -- the function
    degrades instead of throwing.

    If the reply is malformed enough that no sections are found at all,
    this returns an empty dict rather than raising. See summarize_changes()
    below for how that case is handled -- a parsing hiccup should never
    mean the alert silently vanishes.
    """
    sections = {}
    current_section = None
    current_lines = []
    known_sections = {"SUMMARY", "DETAILS"}

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        if is_marker and marker == "END":
            break

        if is_marker and marker in known_sections:
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = marker
            current_lines = []
        elif current_section:
            # The AI sometimes wraps its whole answer in ``` code fences.
            # Those aren't part of the alert text, so drop them.
            if stripped.startswith("```"):
                continue
            current_lines.append(line)

    if current_section:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def summarize_changes(changes, project="price-competitor-monitor-agent"):
    """
    The main function. Give it a list of changes from tracker.py, get
    back a dict with SUMMARY and DETAILS text ready to drop into an
    email or Slack message.

    If nothing changed, we don't call the AI at all -- there's nothing
    to summarize, and every call costs credits whether or not it was
    useful.
    """
    if not changes:
        return None

    prompt = build_prompt(changes)
    reply = ask_ai(prompt, max_tokens=MAX_TOKENS, project=project)
    parsed = parse_alert(reply)

    if not parsed:
        # The AI replied, but not with the markers we asked for. This is
        # the AI-reliability failure mode this project has to defend
        # against: an unparseable reply must NOT mean a missed alert --
        # a competitor's price moving is exactly the kind of thing you
        # can't afford to silently miss. So we fall back to emailing the
        # AI's raw reply instead of dropping it.
        parsed = {"SUMMARY": "Competitor changes detected", "DETAILS": reply.strip()}

    return parsed


if __name__ == "__main__":
    # Run this file on its own to check the parsing works, including
    # against a reply that ISN'T formatted the way we asked for:
    #     python alert.py
    good_reply = """[SUMMARY]
Widget Pro just got 20% more expensive.

[DETAILS]
Widget Pro rose from $49.00 to $59.00, a $10 increase. No other
products changed on the pages you're tracking.

[END]"""

    parsed = parse_alert(good_reply)
    print("Well-formed reply parsed to:", parsed)
    assert parsed["SUMMARY"] == "Widget Pro just got 20% more expensive."
    assert "59.00" in parsed["DETAILS"]

    # A malformed reply: no brackets at all, just prose. AI replies are
    # not guaranteed to follow formatting instructions perfectly, and a
    # project that only ever tests the happy path breaks in production
    # the first time this happens.
    malformed_reply = (
        "Sure! Widget Pro's price went up from $49 to $59, about a 20% "
        "increase. Let me know if you want more detail."
    )
    parsed_malformed = parse_alert(malformed_reply)
    print("\nMalformed reply parsed to:", parsed_malformed)
    assert parsed_malformed == {}, "A malformed reply should produce no sections"

    print("\nSelf-test passed.")
