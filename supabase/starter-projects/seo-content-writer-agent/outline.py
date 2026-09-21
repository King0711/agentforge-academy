"""
Step 3 of the SEO Content Writer Agent (part 1) - turns the keyword and
content gaps into a structured, heading-based outline.
"""

import json

from sdt_ai import ask_ai

MIN_H2_SECTIONS = 6


def build_prompt(keyword, gaps):
    gaps_block = "\n".join(f"- {g}" for g in gaps) or "(no specific gaps identified - use your own judgment)"
    return f"""Keyword: "{keyword}"

Content gaps competitors consistently miss:
{gaps_block}

Create a long-form SEO article outline with 6-8 H2 sections. At least 2
sections must directly address one of the gaps above.

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"h1": "...", "sections": [{{"h2": "...", "subsections": ["...", "..."], "addresses_gap": true}}]}}"""


def parse_outline_reply(reply):
    """Defensive JSON parsing, tolerating a code fence. Returns None on real garbage."""
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def validate_outline(outline):
    """
    Checks the outline has an h1, at least MIN_H2_SECTIONS sections, and
    at least one section that claims to address a gap.

    Returns (is_valid, reason) rather than raising - the caller decides
    whether an outline that's short by one section is still worth
    writing from, or worth regenerating.
    """
    if not outline.get("h1"):
        return False, "Missing h1"

    sections = outline.get("sections", [])
    if len(sections) < MIN_H2_SECTIONS:
        return False, f"Only {len(sections)} sections, need at least {MIN_H2_SECTIONS}"

    if not any(s.get("addresses_gap") for s in sections):
        return False, "No section claims to address a content gap"

    return True, ""


def generate_outline(keyword, gaps):
    """
    The main function. Give it the keyword and gap list, get back a
    validated outline dict, or raises ValueError if it's not usable.
    """
    prompt = build_prompt(keyword, gaps)
    reply = ask_ai(prompt, max_tokens=600, project="seo-content-writer-agent")

    outline = parse_outline_reply(reply)
    if outline is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    is_valid, reason = validate_outline(outline)
    if not is_valid:
        raise ValueError(f"Outline didn't meet the minimum bar: {reason}")

    return outline


if __name__ == "__main__":
    # Run this file on its own to check parsing and validation work - no
    # AI call, no credits spent:  python outline.py
    good_outline = {
        "h1": "AI Agents for Small Business",
        "sections": [{"h2": f"Section {i}", "subsections": ["a"], "addresses_gap": i < 2} for i in range(6)],
    }
    is_valid, reason = validate_outline(good_outline)
    assert is_valid is True
    print("Well-formed outline correctly validated.")

    print("\nChecking an outline with too few sections is rejected...")
    short_outline = {"h1": "Title", "sections": [{"h2": "Only one", "addresses_gap": True}]}
    is_valid, reason = validate_outline(short_outline)
    assert is_valid is False
    print("  OK -", reason)

    print("\nChecking an outline where no section addresses a gap is rejected...")
    no_gap_outline = {"h1": "Title", "sections": [{"h2": f"Section {i}", "addresses_gap": False} for i in range(6)]}
    is_valid, reason = validate_outline(no_gap_outline)
    assert is_valid is False
    print("  OK -", reason)

    print("\nChecking a ```json-fenced reply parses correctly...")
    fenced = '```json\n{"h1": "Test"}\n```'
    assert parse_outline_reply(fenced) == {"h1": "Test"}
    print("  OK")

    print("\nAll checks passed.")
