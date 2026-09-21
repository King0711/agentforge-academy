"""
Step 2 of the SEO Content Writer Agent (part 2) - this is the strategic
core: figuring out what to write that competitors consistently miss.
"""

from sdt_ai import ask_ai

MAX_CHARS_PER_ARTICLE = 1500


def build_prompt(keyword, articles):
    combined = "\n\n".join(
        f"Article: {a['title']}\n{a['text'][:MAX_CHARS_PER_ARTICLE]}"
        for a in articles
    )
    return f"""Below are the top-ranking articles for the keyword "{keyword}". Identify
5-8 SPECIFIC subtopics, questions, or angles these articles consistently
MISS or cover poorly. Be concrete - not generic advice like "add more
detail".

Format your answer EXACTLY like this:

[GAPS]
one gap per line
[END]

ARTICLES:
{combined}"""


def parse_gaps(reply):
    """
    Turns the AI's reply into a list of gap strings, one per line.

    Same forgiving [MARKER] approach used throughout this course.
    Returns an empty list (not an error) if no [GAPS] section was found
    at all - main.py can decide whether to proceed with a generic
    outline or stop and retry.
    """
    gaps = []
    current = None

    for raw_line in reply.splitlines():
        line = raw_line.strip()
        marker = line.strip("[]").upper()
        is_marker = line.startswith("[") and line.endswith("]")

        if is_marker and marker == "END":
            break
        if is_marker and marker == "GAPS":
            current = "GAPS"
            continue
        if current != "GAPS" or not line:
            continue
        if line.startswith("```"):
            continue
        gaps.append(line.lstrip("-* ").strip())

    return gaps


def find_gaps(keyword, articles):
    """
    The main function. Give it the keyword and a list of {"title", "text"}
    scraped articles, get back a list of specific content gaps.
    """
    prompt = build_prompt(keyword, articles)
    reply = ask_ai(prompt, max_tokens=800, project="seo-content-writer-agent")
    return parse_gaps(reply)


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no AI call,
    # no credits spent:  python gap_analysis.py
    good_reply = """[GAPS]
None of the top articles mention pricing for small teams under 5 people
Most skip how to handle a failed API call mid-workflow
No article compares build-vs-buy total cost of ownership
[END]"""
    gaps = parse_gaps(good_reply)
    assert len(gaps) == 3
    assert "pricing for small teams" in gaps[0]
    print("Parsed", len(gaps), "gaps:")
    for g in gaps:
        print(" -", g)

    print("\nChecking a reply with no [GAPS] marker at all returns an empty list...")
    assert parse_gaps("Sorry, I couldn't analyze those articles.") == []
    print("  OK")

    print("\nAll checks passed.")
