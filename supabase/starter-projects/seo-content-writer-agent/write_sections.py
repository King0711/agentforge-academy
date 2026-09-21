"""
Step 3 of the SEO Content Writer Agent (part 2) - writes the article
section by section, to avoid the "wall of generic text" problem a
single giant prompt tends to produce.
"""

from sdt_ai import ask_ai

TARGET_WORDS_MIN = 200
TARGET_WORDS_MAX = 300

# How much of the article-so-far to show the AI for continuity. Long
# enough to avoid an obvious repeat of the immediately preceding point,
# short enough that a 6-section article doesn't cost more per section
# purely from a growing prompt.
CONTEXT_CHARS = 1000


def build_section_prompt(keyword, article_so_far, section):
    context = article_so_far[-CONTEXT_CHARS:] if article_so_far else "(this is the first section)"
    subsections = ", ".join(section.get("subsections", []))

    return f"""Article so far (for continuity - do not repeat what's already
covered, continue naturally from here):
{context}

Now write the "{section['h2']}" section (~{TARGET_WORDS_MIN}-{TARGET_WORDS_MAX} words)
for an SEO article on "{keyword}". Cover: {subsections}.

Write ONLY the section's prose - no heading, no meta-commentary."""


def check_section_length(text):
    """
    Returns (word_count, is_in_range) - a section wildly outside the
    target range is a real, common failure mode worth flagging, even
    though this project doesn't auto-reject or auto-retry over it (an
    engaging 350-word section beats a padded, on-the-nose 250-word one).
    """
    word_count = len(text.split())
    return word_count, TARGET_WORDS_MIN - 50 <= word_count <= TARGET_WORDS_MAX + 100


def write_article(keyword, outline):
    """
    The main function. Give it the keyword and a validated outline, get
    back the full article as a Markdown string.
    """
    lines = [f"# {outline['h1']}", ""]
    article_so_far = ""

    for section in outline["sections"]:
        prompt = build_section_prompt(keyword, article_so_far, section)
        text = ask_ai(prompt, max_tokens=600, project="seo-content-writer-agent")

        word_count, in_range = check_section_length(text)
        if not in_range:
            print(f"  Note: '{section['h2']}' came back at {word_count} words (target {TARGET_WORDS_MIN}-{TARGET_WORDS_MAX}) - worth a manual read.")

        lines.append(f"## {section['h2']}")
        lines.append(text)
        lines.append("")
        article_so_far += f"\n\n{text}"

    return "\n".join(lines)


if __name__ == "__main__":
    # Run this file on its own to check the length guard and prompt-
    # building work - no AI call, no credits spent:  python write_sections.py
    print("Checking check_section_length()...")
    word_count, in_range = check_section_length(" ".join(["word"] * 250))
    assert word_count == 250 and in_range is True
    print("  OK - 250 words correctly in range")

    word_count, in_range = check_section_length(" ".join(["word"] * 20))
    assert in_range is False
    print("  OK -", word_count, "words correctly flagged as out of range (too short)")

    print("\nChecking build_section_prompt() includes continuity context...")
    prompt = build_section_prompt("ai agents", "Previously we discussed X.", {"h2": "Next Steps", "subsections": ["a", "b"]})
    assert "Previously we discussed X." in prompt
    assert "do not repeat" in prompt
    print("  OK - prior context and the no-repeat instruction both included")

    print("\nChecking the first section gets a placeholder instead of empty context...")
    first_prompt = build_section_prompt("ai agents", "", {"h2": "Intro", "subsections": []})
    assert "this is the first section" in first_prompt
    print("  OK")

    print("\nAll checks passed.")
