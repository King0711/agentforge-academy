"""
Step 2 of the Document Summarizer Agent.

This file turns extracted document text into a structured summary: key
points, action items, and a one-paragraph executive brief.
"""

from sdt_ai import ask_ai

# Stop sending text to the AI after this many characters.
#
# This is a MONEY decision, not a technical one - see article.py in the
# Social Post Generator for the same idea. 15,000 characters is roughly
# 8-10 pages: enough for the AI to find every key point and action item in
# a typical contract or report. A token is roughly 4 characters of English,
# so this caps a single call's input at about 3,750 tokens. Sending an
# entire 60-page document instead would cost several times more credits
# per summary for a result that's barely different - past a certain point,
# the AI already has more context than it needs to do the job well.
MAX_CHARACTERS = 15000

# The sections we ask for, in the order we ask for them.
SECTION_NAMES = ["KEYPOINTS", "ACTIONS", "BRIEF"]


def build_prompt(document_text):
    """
    Writes the instructions we send to the AI.

    Like the Social Post Generator, we ask for [BRACKET] markers instead
    of JSON. JSON breaks the moment the AI adds a stray comma, wraps its
    reply in a code fence, or a bullet point happens to contain a quote
    mark - and debugging a broken JSON parse is a miserable first
    experience. Markers are forgiving: anything we don't recognise is
    simply ignored instead of crashing the whole program (see
    parse_summary below).
    """
    trimmed = document_text[:MAX_CHARACTERS]

    return f"""Read the document below and produce a structured summary.

Format your answer EXACTLY like this, with each marker in square brackets
on its own line:

[KEYPOINTS]
- first key point
- second key point
(3 to 6 bullet points covering the most important facts or ideas)

[ACTIONS]
- first action item
(any tasks, deadlines or commitments mentioned in the document. If there
are genuinely none, write exactly one line: - None identified)

[BRIEF]
One paragraph, 3 to 5 sentences, that a busy executive could read in
15 seconds and understand what this document is about and why it matters.

After the brief, write [END] on its own line.

Do not add any explanation, introduction or closing remark outside these
sections.

DOCUMENT:
{trimmed}"""


def parse_summary(reply):
    """
    Turns the AI's marker-formatted reply into a dict:

        {"KEYPOINTS": "...", "ACTIONS": "...", "BRIEF": "..."}

    Same forgiving approach as the Social Post Generator's split_posts():
    anything that isn't a recognised [MARKER] is ignored rather than
    raising an error, so a slightly-off reply still returns the sections
    it DID get right instead of losing all of them over one mistake.

    [END] matters here for exactly the same reason it does in the Social
    Post Generator: without it, a friendly sign-off like "Let me know if
    you'd like more detail!" has nowhere to go but glued onto the end of
    whatever section came last - usually the brief. See the malformed
    example in the self-test below for what that actually looks like.
    """
    sections = {}
    current = None
    buffer = []

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        if is_marker and marker == "END":
            break

        if is_marker and marker in SECTION_NAMES:
            if current:
                sections[current] = "\n".join(buffer).strip()
            current = marker
            buffer = []
        elif current:
            # The AI sometimes wraps its whole answer in ``` code fences
            # even when explicitly told not to. Those aren't part of the
            # summary, so drop them rather than showing them to the user.
            if stripped.startswith("```"):
                continue
            buffer.append(line)

    if current:
        sections[current] = "\n".join(buffer).strip()

    return sections


def summarize_document(document_text):
    """
    The main function. Give it extracted document text, get back a dict
    with "KEYPOINTS", "ACTIONS" and "BRIEF" keys.

        summary = summarize_document(text)
        print(summary["BRIEF"])
    """
    prompt = build_prompt(document_text)

    # max_tokens caps how long the AI's reply may be, which caps what this
    # costs. 700 comfortably fits 3-6 bullet points, a short action list,
    # and a 3-5 sentence brief - there's no reason a summary needs more
    # room than the document itself would take to skim.
    reply = ask_ai(
        prompt,
        max_tokens=700,
        project="document-summarizer-agent",
    )

    summary = parse_summary(reply)

    if not summary:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    # A short or simple document sometimes gives the AI genuinely nothing
    # to put under Action Items, and it skips the section instead of
    # writing "- None identified" like we asked. Rather than throwing that
    # away as a "malformed" reply, treat a missing ACTIONS section as
    # "there weren't any" - the two cases are indistinguishable in
    # practice and this one is far more common than a real parsing failure.
    summary.setdefault("ACTIONS", "None identified")

    return summary


if __name__ == "__main__":
    # Run this file on its own to check the parsing works:
    #     python summarizer.py
    #
    # No AI call happens here - and that's deliberate. Testing parse_summary
    # directly against text we wrote ourselves means these checks run
    # instantly, for free, and pass or fail the same way every time. A
    # test that calls the real AI would cost credits and could occasionally
    # "fail" just because the AI phrased something differently.

    print("Checking a well-formed AI reply...")
    good_reply = """[KEYPOINTS]
- Revenue grew 12% quarter-over-quarter
- The Lagos office lease is up for renewal

[ACTIONS]
- Renew the Lagos office lease by Friday
- Schedule a follow-up with the finance team

[BRIEF]
This report covers a strong quarter for the business, driven by steady
revenue growth, alongside one time-sensitive item: the Lagos office
lease needs to be renewed by the end of the week.

[END]"""
    result = parse_summary(good_reply)
    assert set(result.keys()) == {"KEYPOINTS", "ACTIONS", "BRIEF"}
    assert "12%" in result["KEYPOINTS"]
    assert "Friday" in result["ACTIONS"]
    assert "Lagos office" in result["BRIEF"]
    print(f"  OK - parsed all 3 sections ({sum(len(v) for v in result.values())} characters total)")

    print("Checking a malformed reply with no markers at all...")
    # This is what happens when the AI ignores the format entirely and
    # just writes prose. It should NOT crash - it should return an empty
    # dict, which is exactly what summarize_document() checks for before
    # raising its own readable error.
    no_markers_reply = """Sure, here's a summary of the document you shared:

The company had a good quarter and revenue grew. The Lagos office lease
needs attention soon.

Let me know if you'd like anything else!"""
    result = parse_summary(no_markers_reply)
    assert result == {}
    print("  OK - returned an empty dict instead of crashing")

    print("Checking a malformed reply that is missing [END]...")
    # This is the sneakier failure: markers are present and well-formed,
    # but the AI never wrote [END]. Its closing remark has nowhere else to
    # go, so it gets glued onto the last section - proving why [END] is
    # asked for, not just decoration.
    missing_end_reply = """[KEYPOINTS]
- Revenue grew 12%

[BRIEF]
The company had a strong quarter overall.

Let me know if you'd like more detail!"""
    result = parse_summary(missing_end_reply)
    assert "Let me know if you'd like more detail!" in result["BRIEF"]
    print("  OK - confirmed the sign-off leaks into BRIEF without [END], as expected")

    print("\nAll checks passed.")
