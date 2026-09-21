"""
Step 4 of the SEO Content Writer Agent (part 1) - generates SEO meta
title, description, and slug, with hard character-limit enforcement in
code rather than trusting the AI's own count.
"""

import json
import re

from sdt_ai import ask_ai

TITLE_MAX = 60
DESCRIPTION_MAX = 155


def build_prompt(keyword, article_intro):
    return f"""Keyword: "{keyword}"
Article intro: {article_intro[:500]}

Generate:
- meta_title: under {TITLE_MAX} characters, includes the keyword
- meta_description: under {DESCRIPTION_MAX} characters, includes the keyword, compelling
- slug: lowercase-hyphenated, no special characters

Return ONLY this JSON shape, no markdown code fence:
{{"meta_title": "...", "meta_description": "...", "slug": "..."}}"""


def parse_meta_reply(reply):
    """Defensive JSON parsing, same pattern as elsewhere in this course."""
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


def slugify(text):
    """Pure function - forces a slug into lowercase-hyphenated form, no trusting the AI's formatting."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def validate_meta(meta):
    """
    Truncates meta_title and meta_description to their hard character
    limits in CODE - never trusting the AI's own count, since asking an
    LLM to count characters accurately is asking it to do the one thing
    language models are notoriously unreliable at.

        validate_meta({"meta_title": "x" * 100, ...})
        -> meta_title truncated to under TITLE_MAX characters

    Also re-slugifies meta["slug"] through slugify() regardless of what
    the AI returned, so a slug is guaranteed clean even if the AI added
    capital letters or punctuation despite being told not to.
    """
    title = meta.get("meta_title", "")
    if len(title) > TITLE_MAX:
        title = title[:TITLE_MAX].rsplit(" ", 1)[0]  # don't cut off mid-word

    description = meta.get("meta_description", "")
    if len(description) > DESCRIPTION_MAX:
        description = description[:DESCRIPTION_MAX].rsplit(" ", 1)[0]

    return {
        "meta_title": title,
        "meta_description": description,
        "slug": slugify(meta.get("slug", "")),
    }


def generate_meta(keyword, article_intro):
    """
    The main function. Give it the keyword and the article's opening
    text, get back a validated {"meta_title", "meta_description", "slug"} dict.
    """
    prompt = build_prompt(keyword, article_intro)
    reply = ask_ai(prompt, max_tokens=200, project="seo-content-writer-agent")

    meta = parse_meta_reply(reply)
    if meta is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    return validate_meta(meta)


if __name__ == "__main__":
    # Run this file on its own to check the character-limit guard and
    # slug cleanup work - no AI call, no credits spent:  python meta.py
    print("Checking a title/description within limits passes through unchanged...")
    fine_meta = {
        "meta_title": "AI Agents for Small Business",
        "meta_description": "Learn how AI agents help small teams automate work.",
        "slug": "ai-agents-small-business",
    }
    result = validate_meta(fine_meta)
    assert result["meta_title"] == fine_meta["meta_title"]
    print("  OK")

    print("\nChecking an over-limit title gets truncated without cutting mid-word...")
    long_title_meta = {
        "meta_title": "This Is A Very Long Meta Title That Definitely Goes Way Past Sixty Characters For Sure",
        "meta_description": "short", "slug": "test",
    }
    result = validate_meta(long_title_meta)
    assert len(result["meta_title"]) <= TITLE_MAX
    assert not result["meta_title"].endswith(" ")
    print(f"  OK - truncated to {len(result['meta_title'])} chars: {result['meta_title']!r}")

    print("\nChecking an over-limit description gets truncated the same way...")
    long_desc_meta = {"meta_title": "short", "meta_description": "x " * 100, "slug": "test"}
    result = validate_meta(long_desc_meta)
    assert len(result["meta_description"]) <= DESCRIPTION_MAX
    print(f"  OK - truncated to {len(result['meta_description'])} chars")

    print("\nChecking a messy slug gets cleaned up regardless of what the AI returned...")
    messy_slug_meta = {"meta_title": "t", "meta_description": "d", "slug": "AI Agents For Small Business!!"}
    result = validate_meta(messy_slug_meta)
    assert result["slug"] == "ai-agents-for-small-business"
    print("  OK -", result["slug"])

    print("\nAll checks passed.")
