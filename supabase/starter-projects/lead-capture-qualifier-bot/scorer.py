"""
Step 2 of the Lead Capture & Qualifier Bot.

This file has one job: given a lead dict, ask the AI how good a fit it
is and get back a score and a one-line reason. Everything about WHO
counts as a good lead - your Ideal Customer Profile (ICP) - lives here,
in one prompt. Change the ICP text below and every future lead is
scored against your new criteria - no other file needs to change.
"""

import re

from sdt_ai import ask_ai, AIError

# Your Ideal Customer Profile. This is deliberately just English, not
# code - tune it the way you'd brief a new sales rep. The default below
# matches a common B2B SaaS ICP; replace it with your own before this
# goes live for a real business.
ICP = """
Ideal customer profile:
- Company size: 51-200 employees is the sweet spot. Under 10 is usually
  too small to have budget authority; over 200 usually means a longer,
  committee-based sales cycle.
- Budget: $5,000/month or more is a strong signal of real intent.
- Pain points we solve well: manual reporting, slow customer onboarding,
  and disconnected tools that don't talk to each other.
""".strip()


def build_prompt(lead):
    """
    Writes the instructions we send to the AI. Kept in its own function
    so you can print it and read exactly what the AI sees - the fastest
    way to fix a score that doesn't match your own judgment.
    """
    return f"""Score this sales lead against the Ideal Customer Profile below.

{ICP}

LEAD:
Company: {lead.get('company', 'unknown')}
Company size: {lead.get('company_size', 'unknown')}
Budget: {lead.get('budget', 'unknown')}
Stated challenge: {lead.get('challenge', 'unknown')}

Give a score from 1 to 10, where 10 is a perfect fit for the ICP above
and 1 is a very poor fit. Then give ONE sentence explaining the score.

Format your answer EXACTLY like this:

[SCORE]
a single number from 1 to 10, nothing else on that line
[REASON]
one sentence explaining the score
[END]

Do not add any explanation, introduction or closing remark outside
those markers."""


def parse_score_reply(reply):
    """
    Pulls the score and reason out of the AI's [SCORE]/[REASON]/[END]
    reply.

    We use bracket markers instead of asking for JSON for the same
    reason the Social Post Generator does: JSON breaks the moment the
    AI adds a stray comma or wraps the answer in ``` fences, and that
    is a miserable first bug to debug when you're starting out. Markers
    degrade more gracefully - anything we don't recognise is ignored
    rather than crashing the parse.

    Raises ValueError with a specific, readable message if the [SCORE]
    section is missing or contains no number at all - see the
    self-test below for exactly which malformed replies this catches.
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
        if is_marker and marker in ("SCORE", "REASON"):
            if current:
                sections[current] = "\n".join(lines).strip()
            current = marker
            lines = []
        elif current:
            lines.append(line)

    if current:
        sections[current] = "\n".join(lines).strip()

    score_text = sections.get("SCORE", "")

    # The AI was told to reply with "a single number" but models don't
    # always follow formatting instructions to the letter - a common
    # drift is writing "8/10" or "Score: 8" instead of a bare "8".
    # Searching for the FIRST run of digits copes with both of those
    # with no extra prompting, while still failing loudly (rather than
    # silently defaulting to some made-up number) if there is genuinely
    # no digit anywhere in the reply.
    match = re.search(r"\d+", score_text)
    if not match:
        raise ValueError(
            "Could not find a numeric score in the AI's reply.\n"
            f"The [SCORE] section contained: {score_text!r}\n"
            "Run `python scorer.py` to see the exact parsing rules against "
            "known-good and known-bad replies, or print(reply) inside "
            "score_lead() to see the raw AI output that caused this."
        )

    score = int(match.group())
    # Clamp rather than reject: a 1-10 prompt occasionally gets an 11 or
    # a 0 back. Clamping keeps the pipeline running with a sane value
    # instead of failing a whole webhook delivery over one stray point.
    score = max(1, min(10, score))

    reason = sections.get("REASON", "").strip() or "No reason given."

    return {"score": score, "reason": reason}


def score_to_tier(score):
    """
    1-10 -> hot/warm/cold. A plain if/else, not a second AI call - the
    AI's job here is judgment (how good a fit is this lead), not
    arithmetic (which bucket does this number fall into). Doing the
    bucketing in Python makes it 100% consistent between leads and
    costs zero extra credits.
    """
    if score >= 8:
        return "hot"
    if score >= 5:
        return "warm"
    return "cold"


def score_lead(lead):
    """
    The main function. Give it a lead dict, get back its score, tier
    and reason.

        result = score_lead(lead)
        result["score"]   # 8
        result["tier"]    # "hot"
        result["reason"]  # "Mid-size company matching two of three ICP signals."
    """
    prompt = build_prompt(lead)

    # The whole reply is a number and one sentence, so max_tokens=150 is
    # generous, not tight - this is the cheapest AI call in the course.
    # Compare to the Social Post Generator's max_tokens=1200 for five
    # full posts: shorter expected output should always mean a lower cap.
    reply = ask_ai(prompt, max_tokens=150, project="lead-capture-qualifier-bot")

    result = parse_score_reply(reply)
    result["tier"] = score_to_tier(result["score"])
    return result


if __name__ == "__main__":
    # Run this file on its own to check the parser: python scorer.py
    #
    # This does NOT call the AI - it feeds parse_score_reply() fake
    # replies, including a malformed one, so you can check the parsing
    # logic for free before ever spending a credit.

    good_reply = "[SCORE]\n8\n[REASON]\nMid-size company with clear budget and a matching pain point.\n[END]"
    result = parse_score_reply(good_reply)
    print("Well-formatted reply ->", result)
    assert result["score"] == 8
    assert "budget" in result["reason"]

    # A common way real models drift from instructions: writing "8/10"
    # instead of a bare "8". The regex search for the first run of
    # digits copes with this without any special-casing.
    messy_reply = "[SCORE]\n8/10\n[REASON]\nGood fit overall.\n[END]"
    result = parse_score_reply(messy_reply)
    print("Messy '8/10' reply ->", result)
    assert result["score"] == 8

    # A reply with no digit anywhere should fail loudly, not silently
    # return some made-up default.
    try:
        parse_score_reply("[SCORE]\nfairly good\n[REASON]\nSeems fine.\n[END]")
        raise AssertionError("Expected a ValueError for a non-numeric score")
    except ValueError as problem:
        print("\nCorrectly rejected a non-numeric score:")
        print(problem)

    print("\nAll parser checks passed.")
