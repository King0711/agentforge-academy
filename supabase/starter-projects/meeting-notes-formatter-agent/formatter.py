"""
Step 2 of the Meeting Notes Formatter Agent.

This file turns a raw transcript into three things the AI extracts for
you: the decisions that were made, the action items (each with an owner
and a deadline), and a short summary.
"""

from sdt_ai import ask_ai

# Placeholder words the AI sometimes writes instead of just admitting a
# field wasn't mentioned. We treat all of these the same way: "nobody
# said, so don't guess" - never invent a name or a date to fill the gap.
UNCLEAR_VALUES = {
    "", "n/a", "na", "none", "tbd", "not specified", "unspecified",
    "unclear", "unknown", "?", "-",
}


def build_prompt(transcript_text):
    """
    Writes the instructions we send to the AI.

    The [ACTIONS] section asks for one specific plain-text shape per
    line - "Task: ... | Owner: ... | Deadline: ..." - instead of JSON.
    A stray comma in a task description, or an AI that decides to wrap
    its reply in ```json fences, breaks a JSON parser outright. A
    marker-based, line-by-line format degrades instead of exploding: a
    mis-formed line just fails to match cleanly, and every other line
    still parses fine (see _parse_action_line below).
    """
    return f"""Read the meeting transcript below and extract three things.

Format your answer EXACTLY like this:

[DECISIONS]
- one decision per line, as a short plain sentence
- if no decisions were made, write a single line: None recorded

[ACTIONS]
Task: <what needs to be done> | Owner: <who is responsible> | Deadline: <when it's due>
(one line per action item, in that exact "Task: ... | Owner: ... | Deadline: ..." shape)
If the transcript does not clearly say who owns an item, write "Unassigned" as the
Owner - do not guess a name. If no deadline was mentioned, write "No deadline set" as
the Deadline. If there are no action items at all, write a single line: None recorded

[SUMMARY]
a plain 2-3 sentence summary of what the meeting was about

[END]

Do not add any explanation, introduction or closing remark outside these sections.
Do not invent people, dates or decisions that are not in the transcript below.

TRANSCRIPT:
{transcript_text}"""


def _normalize(value, default):
    """A blank or vague AI answer ("TBD", "N/A", "") becomes one clear default."""
    if value.strip().lower() in UNCLEAR_VALUES:
        return default
    return value.strip()


def _parse_action_line(line):
    """
    Turns one "Task: ... | Owner: ... | Deadline: ..." line into a dict:

        {"task": "Send the proposal", "owner": "Unassigned", "deadline": "No deadline set"}

    Built to survive an AI that doesn't follow the format perfectly - a
    missing label, a missing "|", or a blank value all fall back to a
    sensible default instead of raising an exception mid-run. Returns
    None only if the line has no usable text in it at all (e.g. a
    stray blank line inside the [ACTIONS] block).
    """
    result = {"task": "", "owner": "Unassigned", "deadline": "No deadline set"}
    leftover_text = []

    for part in line.split("|"):
        part = part.strip()
        low = part.lower()
        if low.startswith("task:"):
            result["task"] = part.split(":", 1)[1].strip()
        elif low.startswith("owner:"):
            result["owner"] = _normalize(part.split(":", 1)[1], "Unassigned")
        elif low.startswith("deadline:"):
            result["deadline"] = _normalize(part.split(":", 1)[1], "No deadline set")
        elif part:
            # No recognised label on this chunk - the AI may have skipped
            # the "Task:" prefix entirely. Keep the text in case nothing
            # else on the line turns out to carry the task description.
            leftover_text.append(part)

    if not result["task"]:
        result["task"] = " ".join(leftover_text).strip()

    return result if result["task"] else None


def parse_reply(reply):
    """
    Turns the AI's one long answer into a dictionary:

        {"decisions": [...], "actions": [{"task", "owner", "deadline"}, ...], "summary": "..."}

    Mirrors generator.py's split_posts() in the Social Post Generator
    project: [MARKER] sections we recognise are collected, anything
    else (stray commentary, code fences) is quietly dropped instead of
    crashing the whole program.
    """
    sections = {"DECISIONS": [], "ACTIONS": [], "SUMMARY": []}
    current = None

    for raw_line in reply.splitlines():
        line = raw_line.strip()
        marker = line.strip("[]").upper()
        is_marker = line.startswith("[") and line.endswith("]")

        # [END] tells us the sections are finished. Without it, a friendly
        # sign-off like "Let me know if you need changes!" gets glued onto
        # the summary and saved straight into the output file.
        if is_marker and marker == "END":
            break
        if is_marker and marker in sections:
            current = marker
            continue
        if current is None:
            # Text before the first recognised marker (a stray greeting,
            # for example) isn't part of any section - ignore it.
            continue
        if line.startswith("```"):
            # The AI sometimes wraps its whole answer in code fences.
            continue
        if line:
            sections[current].append(line)

    decisions = [
        d.lstrip("-* ").strip()
        for d in sections["DECISIONS"]
        if d.lstrip("-* ").strip().lower() != "none recorded"
    ]

    actions = []
    for line in sections["ACTIONS"]:
        if line.strip().lower() == "none recorded":
            continue
        parsed = _parse_action_line(line)
        if parsed:
            actions.append(parsed)

    summary = " ".join(sections["SUMMARY"]).strip()

    if not decisions and not actions and not summary:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return {"decisions": decisions, "actions": actions, "summary": summary}


def format_notes(transcript_text):
    """
    The main function. Give it a raw transcript, get back a parsed dict
    ready for output.py to render.

        result = format_notes(transcript_text)
        print(result["summary"])
    """
    prompt = build_prompt(transcript_text)

    # max_tokens caps how long the AI's answer may be, which caps what this
    # costs you. 900 comfortably covers a summary plus a dozen action items -
    # far more than a typical meeting produces.
    reply = ask_ai(
        prompt,
        max_tokens=900,
        project="meeting-notes-formatter-agent",
    )

    return parse_reply(reply)


if __name__ == "__main__":
    # Run this file on its own to check the parsing works, entirely
    # offline - no AI call, no credits spent:  python formatter.py

    print("--- Well-formed reply ---")
    good_reply = """[DECISIONS]
- Ship the v2 API on the 15th instead of the 10th
- Drop the CSV export feature from this release

[ACTIONS]
Task: Update the release notes | Owner: Priya | Deadline: Friday
Task: Notify the beta testers about the new date | Owner: Unassigned | Deadline: No deadline set

[SUMMARY]
The team pushed the v2 API launch back five days to finish load testing,
and agreed to cut CSV export from this release to protect the new date.

[END]"""
    result = parse_reply(good_reply)
    print(f"{len(result['decisions'])} decisions, {len(result['actions'])} actions")
    for action in result["actions"]:
        print(" ", action)
    print("Summary:", result["summary"])

    # Now a reply an AI actually sends sometimes: no [SUMMARY] marker at
    # all, one action item with no Owner/Deadline labels whatsoever, one
    # with a vague "TBD" owner, one with no labels at all, and the whole
    # thing wrapped in a markdown code fence. This must not crash - every
    # gap should become a clear default, never an invented name or date.
    print("\n--- Malformed reply (missing [SUMMARY], missing/vague labels) ---")
    malformed_reply = """```
[DECISIONS]
- Move the launch to Q3

[ACTIONS]
Task: Follow up with legal about the contract
Task: Book the venue | Owner: TBD | Deadline: next Tuesday
Just remember to lock the meeting room before Friday

[END]
```"""
    result = parse_reply(malformed_reply)
    print(f"{len(result['decisions'])} decisions, {len(result['actions'])} actions")
    for action in result["actions"]:
        print(" ", action)
    print("Summary (should be blank, not crashed):", repr(result["summary"]))

    # A reply with none of the markers at all - e.g. the AI ignored the
    # instructions completely. We can't recover anything from this, so
    # we raise a clear error instead of silently returning an empty result.
    print("\n--- Reply with no recognisable markers at all ---")
    try:
        parse_reply("Sorry, I can't help with that request.")
        print("ERROR: should have raised ValueError")
    except ValueError as problem:
        print("Correctly raised an error:")
        print(problem)
