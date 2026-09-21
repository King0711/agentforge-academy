"""
Step 2 of the Competitor Intelligence Monitor.

Turns raw scraped data into strategic signals. Also carries this
project's safety guard: the AI is given a fixed threat-level rubric
instead of an open-ended judgment call, and whatever it writes back is
validated against that exact rubric - not just trusted as-is.
"""

from sdt_ai import ask_ai

THREAT_LEVELS = ["LOW", "MEDIUM", "HIGH"]

# Giving the AI a FIXED rubric (not "judge the threat level") is what
# keeps rankings comparable across competitors run in the same batch -
# an open-ended judgment call tends to drift between calls even on
# genuinely similar inputs.
THREAT_RUBRIC = """Use this exact rubric to choose a threat level:
LOW    - no notable recent activity, hiring is flat or unrelated to your market
MEDIUM - some notable activity (a funding round, a few relevant hires) but no clear new direction
HIGH   - a clear strategic shift (multiple hires in one new area, a funding round paired with related news)"""

SECTION_NAMES = ["WHATSNEW", "SIGNALS", "THREAT", "REASONING", "OPPORTUNITIES"]


def build_prompt(name, homepage_text, news, job_titles):
    news_block = "\n".join(f"- {n['title']}: {n['snippet']}" for n in news) or "(no recent news found)"
    jobs_block = "\n".join(f"- {t}" for t in job_titles) or "(no job titles found - careers page may be JS-rendered)"

    return f"""Competitor: {name}

Homepage text:
{homepage_text or "(homepage could not be fetched)"}

Recent news:
{news_block}

Open job titles:
{jobs_block}

{THREAT_RUBRIC}

Format your answer EXACTLY like this:

[WHATSNEW]
what's new this week, specific to the news/homepage above

[SIGNALS]
strategic signals - explicitly reason about what the job titles suggest,
citing specific titles where relevant

[THREAT]
one word: LOW, MEDIUM, or HIGH

[REASONING]
one sentence justifying the threat level using the rubric above

[OPPORTUNITIES]
opportunities this creates for us

[END]

Be specific - reference actual job titles or news items, not generic
statements. Do not invent news or hires that weren't given to you above."""


def validate_threat_level(raw_value):
    """
    Normalizes the AI's threat-level text against the fixed rubric.

        validate_threat_level("Moderate risk") -> "UNCLEAR"
        validate_threat_level("high.") -> "HIGH"

    Real models occasionally answer "Moderate" or "High risk" instead of
    the exact word asked for - rather than silently accepting whatever
    comes back (which is exactly how threat rankings end up
    inconsistent across competitors), anything that doesn't cleanly
    contain one of LOW/MEDIUM/HIGH is normalized to "UNCLEAR" so it's
    visibly flagged in the briefing instead of quietly miscategorized.
    """
    cleaned = raw_value.strip().upper().rstrip(".")
    for level in THREAT_LEVELS:
        if level in cleaned:
            return level
    return "UNCLEAR"


def parse_analysis(reply):
    """
    Turns the AI's marker-formatted reply into a dict of sections, with
    THREAT run through validate_threat_level().

    Same forgiving [MARKER] approach used throughout this course.
    Returns {} if no recognised markers were found at all.
    """
    sections = {name: [] for name in SECTION_NAMES}
    current = None

    for raw_line in reply.splitlines():
        line = raw_line.strip()
        marker = line.strip("[]").upper()
        is_marker = line.startswith("[") and line.endswith("]")

        if is_marker and marker == "END":
            break
        if is_marker and marker in sections:
            current = marker
            continue
        if current is None:
            continue
        if line.startswith("```"):
            continue
        if line:
            sections[current].append(line)

    if not any(sections.values()):
        return {}

    result = {name: "\n".join(lines).strip() for name, lines in sections.items()}
    result["THREAT"] = validate_threat_level(result["THREAT"]) if result["THREAT"] else "UNCLEAR"
    return result


def analyze_competitor(name, homepage_text, news, job_titles):
    """
    The main function. Give it one competitor's raw data, get back a
    dict with WHATSNEW, SIGNALS, THREAT, REASONING, and OPPORTUNITIES.
    """
    prompt = build_prompt(name, homepage_text, news, job_titles)
    reply = ask_ai(prompt, max_tokens=800, project="competitor-intelligence-monitor")

    analysis = parse_analysis(reply)
    if not analysis:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )
    return analysis


if __name__ == "__main__":
    # Run this file on its own to check parsing and the threat-level
    # guard work - no AI call, no credits spent:  python analyze.py

    print("Checking a well-formed reply with a clean threat level...")
    good_reply = """[WHATSNEW]
Acme announced a new enterprise pricing tier this week.

[SIGNALS]
Three open "ML Platform Engineer" roles suggest a push into AI features.

[THREAT]
HIGH

[REASONING]
Multiple ML-focused hires paired with a new enterprise tier signal a clear new direction.

[OPPORTUNITIES]
We should highlight our existing AI features in competitive deals now.

[END]"""
    result = parse_analysis(good_reply)
    assert result["THREAT"] == "HIGH"
    assert "ML Platform Engineer" in result["SIGNALS"]
    print("  OK - all 5 sections parsed, THREAT correctly normalized to HIGH")

    print("\nChecking a reply where the AI ignores the exact wording ('Moderate risk')...")
    messy_reply = """[WHATSNEW]
Nothing major this week.

[SIGNALS]
Hiring looks flat.

[THREAT]
Moderate risk, leaning medium

[REASONING]
No major changes detected.

[OPPORTUNITIES]
None significant.

[END]"""
    result = parse_analysis(messy_reply)
    assert result["THREAT"] == "MEDIUM"
    print("  OK - 'Moderate risk, leaning medium' correctly normalized to MEDIUM")

    print("\nChecking a threat level with no recognisable rubric word at all...")
    assert validate_threat_level("uncertain") == "UNCLEAR"
    print("  OK - an unrecognisable threat level is flagged UNCLEAR instead of silently guessed")

    print("\nChecking a reply with no recognisable markers at all...")
    assert parse_analysis("Sorry, I can't analyze that.") == {}
    print("  OK - returned {} instead of crashing")

    print("\nAll checks passed.")
