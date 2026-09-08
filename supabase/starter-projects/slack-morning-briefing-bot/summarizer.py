"""
Step 2 of the Slack Morning Briefing Bot.

Takes the cleaned message text from one or more channels (already produced
by slack_client.filter_and_format_messages) and asks the AI to sort it into
what needs attention today versus what's just useful context.
"""

from sdt_ai import ask_ai

# Stop feeding messages to the AI after this many characters.
#
# A MONEY decision, not a technical one - same reasoning as article.py's
# MAX_CHARACTERS in the Social Post Generator. Every character you send
# costs credits, and a 24-hour dump from a few busy channels can run past
# 20,000 characters on a heavy day. 8000 characters is roughly a full busy
# day across 2-3 channels, or the last several hours of a very loud one -
# enough for the AI to judge what's urgent without you paying to have it
# re-read a full day of chatter to reach the same conclusion.
MAX_CHARACTERS = 8000


def build_prompt(channel_texts):
    """
    Combines the formatted text from every channel into one prompt.

    channel_texts is a list of strings, each already formatted by
    slack_client.filter_and_format_messages() as "--- #channel ---\\n...".
    """
    combined = "\n\n".join(channel_texts)[:MAX_CHARACTERS]

    return f"""You are preparing a morning briefing for someone who was away from
Slack overnight. Below are yesterday's messages from their most important
channels.

Sort what matters into two sections:
- TOP: things that need this person's attention or a decision today.
  Be selective - if everything is "top", nothing is.
- FYI: useful context, but nothing that needs action.

Format your answer EXACTLY like this, with the marker in square brackets
on its own line, then bullet points underneath it:

[TOP]
- first item
- second item

[FYI]
- first item

After the FYI section, write [END] on its own line.

If a section genuinely has nothing to report, write "- Nothing to report"
under it rather than skipping the heading - the person reading this expects
to see both sections every single morning, not wonder if one went missing.

Do not add any explanation, introduction or closing remark.

MESSAGES:
{combined}"""


def parse_briefing(reply):
    """
    Turns the AI's marker-formatted reply into {"TOP": "...", "FYI": "..."}.

    Returns {} if none of the expected markers showed up at all.

    Markers instead of JSON for the same reason generator.py in the Social
    Post Generator uses them: JSON breaks on a stray comma or a wrapping
    code fence. That matters even more here, because this runs unattended
    on a schedule at 8am - nobody is watching to hit "regenerate" the way
    they would in an interactive app, so the parser has to survive a
    slightly-off reply rather than take the whole job down with it.
    """
    sections = {}
    current_section = None
    current_lines = []

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        if is_marker and marker == "END":
            break

        if is_marker and marker in ("TOP", "FYI"):
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = marker
            current_lines = []
        elif current_section:
            # The AI sometimes wraps its whole answer in ``` code fences -
            # those aren't part of the briefing, so drop them.
            if stripped.startswith("```"):
                continue
            current_lines.append(line)

    # Don't forget the last section - there's no marker after it to save it.
    if current_section:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def format_dm_text(sections, header):
    """
    Turns parsed {"TOP": ..., "FYI": ...} sections into the final Slack
    mrkdwn message text, with a header line on top.

    Uses "Nothing to report" as the fallback for a missing section rather
    than leaving it out - main.py calls this only after parse_briefing()
    already returned a non-empty dict, but the AI can still return just one
    of the two sections, and a briefing silently missing "FYI" looks like a
    bug, not a quiet night.
    """
    return "\n".join([
        f"*{header}*",
        "",
        "*Top priorities*",
        sections.get("TOP", "- Nothing to report"),
        "",
        "*FYI*",
        sections.get("FYI", "- Nothing to report"),
    ])


def summarize_briefing(channel_texts):
    """
    The main function: give it a list of formatted channel texts, get back
    the parsed sections dict.

        sections = summarize_briefing([channel1_text, channel2_text])
        print(sections["TOP"])

    Raises ValueError if there was nothing to summarize, or if the AI's
    reply couldn't be parsed into the format this project depends on.
    """
    if not channel_texts:
        raise ValueError(
            "No messages to summarize - every channel came back empty.\n"
            "Nothing was sent to the AI, so no credits were used."
        )

    prompt = build_prompt(channel_texts)

    # max_tokens caps how long (and how expensive) the AI's answer can be.
    # 500 is generous for a two-section bullet list - a briefing longer
    # than that has stopped being something you can read before your coffee
    # finishes brewing, which defeats the point of the project.
    reply = ask_ai(
        prompt,
        max_tokens=500,
        project="slack-morning-briefing-bot",
    )

    sections = parse_briefing(reply)

    if not sections:
        # This is the AI-reliability failure mode this project is most
        # exposed to. The Streamlit apps in this course have a human
        # sitting there to notice a bad reply and click "generate" again;
        # a cron job at 8am does not. So instead of sending a DM full of
        # unparsed prose, or letting main.py crash with a KeyError reading
        # sections["TOP"], we raise a clear, specific error that main.py
        # can log and skip - the next scheduled run tries again on its own.
        raise ValueError(
            "The AI replied, but not in the TOP/FYI format we asked for.\n"
            "This briefing was not sent - no partial or garbled DM went out.\n"
            "This usually fixes itself on the next scheduled run."
        )

    return sections


if __name__ == "__main__":
    # Run this file on its own to check the parsing works:
    #     python summarizer.py
    good_reply = """[TOP]
- Client asked for the contract redline by noon
- Deploy is blocked on a failing test - needs someone to look

[FYI]
- Design shared the new logo options in #general

[END]
Let me know if you'd like anything expanded!"""

    sections = parse_briefing(good_reply)
    print("Parsed a well-formed reply:", list(sections.keys()))
    assert sections["TOP"].startswith("- Client asked")
    assert "logo options" in sections["FYI"]
    assert "expanded" not in sections["FYI"], "[END] should cut off the AI's sign-off"

    dm_text = format_dm_text(sections, "Morning Briefing")
    print("\n" + dm_text)
    assert "Client asked" in dm_text

    # Break it on purpose: a malformed reply with no markers at all - the
    # AI apologizing or chatting instead of following instructions. This is
    # a real, observed failure mode, not a hypothetical one. parse_briefing
    # must come back with {} rather than raise, so summarize_briefing() can
    # turn that into the readable error above instead of a stack trace.
    malformed_reply = "Sure! Here's a summary of your Slack messages from last night, hope this helps."
    empty_sections = parse_briefing(malformed_reply)
    print("\nParsed a malformed reply:", empty_sections)
    assert empty_sections == {}

    # And the other edge case worth checking without spending real credits:
    # a huge wall of text gets truncated before it's even built into a
    # prompt, rather than silently sending (and paying for) all of it.
    huge_input = ["--- #general ---\n" + ("spam " * 5000)]
    huge_prompt = build_prompt(huge_input)
    assert len(huge_prompt) < len(huge_input[0]) + 2000, "MAX_CHARACTERS should have capped this"

    print("\nAll summarizer.py self-tests passed.")
