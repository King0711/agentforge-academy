"""
Step 2 of the LinkedIn Content Creator Agent.

Turns one week of raw input (wins, ideas, links) into 5 distinct post
types, using your persona from persona.py. Also carries this project's
safety guard: every generated post is checked against the SAME banned
phrase list the prompt already asked the AI to avoid, since a prompt
rule is a request, not a guarantee.
"""

from persona import full_persona_text
from sdt_ai import ask_ai

POST_TYPES = ["INSIGHT", "STORY", "HOWTO", "OPINION", "RESULTS"]

# The exact phrases persona.py's PERSONA_RULES already asks the AI to
# avoid. Defined once here (not copy-pasted into the guard separately)
# so the prompt and the guard can never quietly drift out of sync.
BANNED_PHRASES = [
    "game-changer", "circle back", "synergy", "thought leader",
    "level up", "unpack", "double-click on",
]

# Stop sending raw notes to the AI after this many characters. A MONEY
# decision: a week's worth of notes rarely needs to be huge to generate
# 5 posts, and every extra character here is extra input-token cost on
# a prompt that already includes the persona and example posts too.
MAX_INPUT_CHARACTERS = 2000


def build_prompt(weekly_input):
    trimmed = weekly_input.strip()[:MAX_INPUT_CHARACTERS]
    return f"""{full_persona_text()}

Using the raw notes below (this week's wins, ideas, and links), write 5
DIFFERENT LinkedIn posts, one of each type:

[INSIGHT]
a post sharing a non-obvious lesson or observation

[STORY]
a short personal story with a clear takeaway

[HOWTO]
a practical, numbered or bulleted how-to post

[OPINION]
a post taking a clear, slightly contrarian stance

[RESULTS]
a post sharing a specific result or number, with context on how it was achieved

[END]

Do not add any explanation outside these 5 sections. Do not invent
results, numbers, or events that are not implied by the notes below.

THIS WEEK'S NOTES:
{trimmed}"""


def contains_cliche(text):
    """
    Returns True if a generated post uses one of the exact phrases the
    prompt already told the AI to avoid.

        contains_cliche("This is a total game-changer for our team.") -> True

    Case-insensitive substring check - simple and a little over-eager
    beats a fragile attempt at deep language understanding.
    """
    lowered = text.lower()
    return any(phrase in lowered for phrase in BANNED_PHRASES)


def parse_posts(reply):
    """
    Turns the AI's marker-formatted reply into a dict of posts, with
    each one checked for cliches.

        {"INSIGHT": "...", "STORY": "...", ...}

    Same forgiving [MARKER] approach used throughout this course:
    anything that isn't a recognised marker is dropped rather than
    raising, so a slightly-off reply still returns the post types it DID
    get right.

    A post containing a banned cliche is kept, but visibly flagged
    rather than silently dropped or silently shipped - you decide what
    to do with it, the tool doesn't decide for you.
    """
    sections = {name: [] for name in POST_TYPES}
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

    posts = {}
    for name, lines in sections.items():
        if not lines:
            continue
        text = "\n".join(lines).strip()
        if contains_cliche(text):
            text = "[CONTAINS CLICHE - REVIEW BEFORE POSTING]\n\n" + text
        posts[name] = text

    return posts


def generate_posts(weekly_input):
    """
    The main function. Give it this week's raw notes, get back a dict of
    up to 5 posts.

        posts = generate_posts("Shipped the new onboarding flow, signups up 18%")
    """
    prompt = build_prompt(weekly_input)
    reply = ask_ai(prompt, max_tokens=1200, project="linkedin-content-creator")
    posts = parse_posts(reply)

    if not posts:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return posts


if __name__ == "__main__":
    # Run this file on its own to check the parsing and the cliche guard
    # work - no AI call, no credits spent:  python generator.py

    print("Checking a well-formed, clean reply...")
    good_reply = """[INSIGHT]
Most teams ship a feature, then wonder why nobody uses it.

[STORY]
Three years ago I got rejected from my dream job over vague feedback.

[HOWTO]
1. Talk to 5 users before writing code.
2. Ship the smallest version that answers their question.

[OPINION]
Roadmaps planned a year out are usually fiction.

[RESULTS]
We cut onboarding time from 12 minutes to 4 by removing two screens.

[END]"""
    posts = parse_posts(good_reply)
    assert set(posts.keys()) == set(POST_TYPES)
    assert "CONTAINS CLICHE" not in posts["INSIGHT"]
    print("  OK - all 5 post types parsed, none flagged")

    print("\nChecking a reply where one post slips in a banned cliche...")
    cliche_reply = """[INSIGHT]
This new workflow is a total game-changer for how we ship.

[STORY]
A clean story with no buzzwords at all.

[HOWTO]
Steps without any buzzwords.

[OPINION]
A clear opinion.

[RESULTS]
A specific result.

[END]"""
    posts = parse_posts(cliche_reply)
    assert "[CONTAINS CLICHE - REVIEW BEFORE POSTING]" in posts["INSIGHT"]
    assert "[CONTAINS CLICHE" not in posts["STORY"]
    print("  OK - only the post with the cliche got flagged, the others were left clean")

    print("\nChecking a reply missing some post types entirely...")
    partial_reply = """[INSIGHT]
Just one post this time.

[END]"""
    posts = parse_posts(partial_reply)
    assert list(posts.keys()) == ["INSIGHT"]
    print("  OK - returned just the one section instead of crashing over the missing four")

    print("\nAll checks passed.")
