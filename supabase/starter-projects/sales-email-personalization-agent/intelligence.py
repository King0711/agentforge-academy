"""
Step 2 of the Sales Email Personalization Agent (part 1) - turns raw
research into a structured profile: role, responsibilities, challenges,
and one recent event to personalize an opener with.
"""

import json

from sdt_ai import ask_ai


def build_prompt(name, company, enriched):
    profile_text = "\n".join(enriched.get("profile", [])) or "(no profile information found)"
    news_text = "\n".join(enriched.get("news", [])) or "(no recent news found)"

    return f"""Prospect: {name} at {company}

Public profile search results:
{profile_text}

Recent company news:
{news_text}

Extract: likely role/title, key responsibilities, 2-3 likely current
business challenges, and one recent notable event about the company
useful for a personalized opening line.

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"role": "...", "responsibilities": "...", "challenges": ["...", "..."], "recent_event": "..."}}

Do not invent specifics that aren't implied by the research above - if
nothing notable was found, say so plainly in recent_event rather than
fabricating an event."""


def parse_intelligence_reply(reply):
    """Defensive JSON parsing, same pattern used throughout this course. Returns None on real garbage."""
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


def extract_intelligence(name, company, enriched):
    """The main function. Give it the prospect's name, company, and enriched research, get back the structured profile."""
    prompt = build_prompt(name, company, enriched)
    reply = ask_ai(prompt, max_tokens=500, project="sales-email-personalization-agent")

    intel = parse_intelligence_reply(reply)
    if intel is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    return intel


if __name__ == "__main__":
    # Run this file on its own to check prompt-building and parsing work
    # - no AI call, no credits spent:  python intelligence.py
    enriched = {"profile": ["Jordan Lee is VP of Engineering at Acme Robotics."], "news": ["Acme Robotics raised a Series B in 2026."]}

    print("Checking build_prompt() includes the real research...")
    prompt = build_prompt("Jordan Lee", "Acme Robotics", enriched)
    assert "VP of Engineering" in prompt
    assert "Series B" in prompt
    print("  OK")

    print("\nChecking build_prompt() handles empty research without crashing...")
    empty_prompt = build_prompt("Jordan Lee", "Acme Robotics", {"profile": [], "news": []})
    assert "no profile information found" in empty_prompt
    assert "no recent news found" in empty_prompt
    print("  OK")

    print("\nChecking parse_intelligence_reply() strips a ```json code fence...")
    fenced = '```json\n{"role": "VP Engineering"}\n```'
    assert parse_intelligence_reply(fenced) == {"role": "VP Engineering"}
    print("  OK")

    print("\nAll checks passed.")
