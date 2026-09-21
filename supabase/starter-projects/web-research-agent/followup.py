"""
Step 5 of the Web Research Agent - one follow-up research round.

The first brief always has gaps. This file asks the AI to name up to 3
follow-up searches that would fill the biggest ones, so main.py can run
them and merge the new sources in before re-synthesizing.
"""

from sdt_ai import ask_ai

# Hard cap, not a suggestion. Each follow-up query costs one more Tavily
# search AND makes the eventual re-synthesis prompt bigger (more sources
# = more input tokens) - three is enough to meaningfully improve a brief
# without letting one research run spiral into ten AI calls.
MAX_FOLLOWUP_QUERIES = 3


def build_prompt(topic, brief):
    brief_text = "\n\n".join(f"{k}:\n{v}" for k, v in brief.items())
    return f"""Below is a research brief on "{topic}". Identify the most important
gaps or unanswered questions in it, and write up to {MAX_FOLLOWUP_QUERIES}
follow-up search queries that would help fill them.

Format your answer EXACTLY like this:

[QUERIES]
one search query per line, {MAX_FOLLOWUP_QUERIES} lines maximum
[END]

If the brief is already thorough and you can't identify any meaningful
gap, write a single line: None needed

BRIEF:
{brief_text}"""


def parse_followup_queries(reply):
    """
    Turns the AI's reply into a list of query strings (possibly empty).

    Deliberately plain-text, one query per line - not a JSON array - for
    the same reason every other AI reply in this course avoids JSON: one
    stray comma, or a query that itself contains a quote mark, would
    break a JSON parser, and a follow-up round isn't worth failing the
    whole research run over.
    """
    lines = []
    current = None

    for raw_line in reply.splitlines():
        line = raw_line.strip()
        marker = line.strip("[]").upper()
        is_marker = line.startswith("[") and line.endswith("]")

        if is_marker and marker == "END":
            break
        if is_marker and marker == "QUERIES":
            current = "QUERIES"
            continue
        if current != "QUERIES" or not line:
            continue
        if line.startswith("```"):
            continue
        if line.lower() == "none needed":
            continue
        lines.append(line.lstrip("-* ").strip())

    return lines[:MAX_FOLLOWUP_QUERIES]


def get_followup_queries(topic, brief):
    """
    The main function. Give it the topic and the first brief, get back a
    list of up to MAX_FOLLOWUP_QUERIES follow-up search query strings.
    """
    prompt = build_prompt(topic, brief)
    reply = ask_ai(prompt, max_tokens=200, project="web-research-agent-followup")
    return parse_followup_queries(reply)


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no AI call,
    # no credits or quota spent:  python followup.py

    print("Checking a well-formed reply...")
    good_reply = """[QUERIES]
AI sales agent adoption statistics 2026
enterprise AI agent ROI case studies
[END]"""
    queries = parse_followup_queries(good_reply)
    assert queries == [
        "AI sales agent adoption statistics 2026",
        "enterprise AI agent ROI case studies",
    ]
    print("  OK -", queries)

    print("\nChecking 'None needed' returns an empty list...")
    assert parse_followup_queries("[QUERIES]\nNone needed\n[END]") == []
    print("  OK")

    print("\nChecking more than the cap gets truncated...")
    too_many = "[QUERIES]\n" + "\n".join(f"query {i}" for i in range(10)) + "\n[END]"
    assert len(parse_followup_queries(too_many)) == MAX_FOLLOWUP_QUERIES
    print(f"  OK - capped at {MAX_FOLLOWUP_QUERIES} even though 10 were given")

    print("\nAll checks passed.")
