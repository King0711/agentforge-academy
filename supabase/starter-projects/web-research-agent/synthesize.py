"""
Step 3 of the Web Research Agent.

This is the heart of the project: turning a pile of sources into one
structured, cited brief. It also carries this project's core safety
guarantee - the AI is never trusted to only cite real sources on its own
word. Every citation is checked, and any invented one is flagged.
"""

import re

from sdt_ai import ask_ai

SECTION_NAMES = ["BACKGROUND", "FINDINGS", "DATAPOINTS", "CONFLICTING", "CONCLUSION"]

# Stop sending source text to the AI after this many characters PER
# SOURCE. A MONEY decision: 8 sources at, say, 6000 characters each would
# make an expensive prompt out of content the AI mostly doesn't need in
# full to write one cited paragraph referencing it.
MAX_CHARS_PER_SOURCE = 1500


def build_context(sources):
    """
    Turns a list of {"title", "url", "snippet"} dicts into the numbered
    [Source N] block the prompt, the citation guard, and citations.py all
    rely on.

    Numbering happens in exactly ONE place (here) - every other function
    in this project trusts that source N means sources[N-1] in this same
    list, in this same order.
    """
    blocks = []
    for i, source in enumerate(sources, start=1):
        text = source["snippet"][:MAX_CHARS_PER_SOURCE]
        blocks.append(f"[Source {i}] {source['title']} ({source['url']})\n{text}")
    return "\n\n".join(blocks)


def build_prompt(topic, sources):
    context = build_context(sources)
    return f"""You are a research analyst. Using ONLY the sources below, write a
structured brief on this topic: {topic}

Format your answer EXACTLY like this:

[BACKGROUND]
2-3 sentences of context on the topic

[FINDINGS]
- key finding, citing the source it came from like [Source 2]
- another key finding, cited the same way
(3-6 bullet points)

[DATAPOINTS]
- any concrete numbers, dates, or statistics from the sources, cited the same way
- if there are none, write a single line: None found

[CONFLICTING]
- describe any place two sources disagree or give different figures, cited
  on both sides like [Source 1] vs [Source 3]
- if the sources are all in agreement, write a single line: No significant disagreement found

[CONCLUSION]
2-3 sentences summarizing what this means overall

[END]

Cite a source ONLY using the exact [Source N] numbers shown above. Do NOT
cite a source number that wasn't given to you, and do not invent findings,
figures, or sources that are not in the text below.

SOURCES:
{context}"""


def _strip_invented_citations(text, valid_count):
    """
    Removes the teeth from any [Source N] citation where N is out of
    range for the sources actually given - the AI's most likely way to
    "cheat" a complete-looking brief is inventing a citation number, and
    this is the check that catches it before you ever read the output.

        _strip_invented_citations("see [Source 2] and [Source 9]", valid_count=3)
        -> "see [Source 2] and [Source 9] (unverified citation removed)"

    Marks the invented citation rather than silently deleting it - a
    visible gap is more useful to you than text that reads fine but
    quietly lied about its evidence.
    """
    def replace(match):
        n = int(match.group(1))
        if 1 <= n <= valid_count:
            return match.group(0)
        return f"{match.group(0)} (unverified citation removed)"

    return re.sub(r"\[Source (\d+)\]", replace, text)


def parse_brief(reply, valid_source_count):
    """
    Turns the AI's marker-formatted reply into a dict of sections, with
    every citation checked against valid_source_count.

    Same forgiving [MARKER] approach used throughout this course:
    anything that isn't a recognised marker is dropped rather than
    raising, so a slightly-off reply still returns the sections it DID
    get right instead of losing all of them over one mistake.

    Returns {} if none of the expected markers were found at all.
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

    return {
        name: _strip_invented_citations("\n".join(lines).strip(), valid_source_count)
        for name, lines in sections.items()
    }


def synthesize(topic, sources):
    """
    The main function. Give it a topic and a list of sources, get back a
    dict of brief sections with citations checked.

        brief = synthesize(topic, sources)
        print(brief["FINDINGS"])
    """
    prompt = build_prompt(topic, sources)

    # max_tokens caps both cost and the risk of the brief being cut off
    # partway through a section - 1200 comfortably fits all 5 sections
    # for a typical 6-10 source research run.
    reply = ask_ai(prompt, max_tokens=1200, project="web-research-agent")

    brief = parse_brief(reply, valid_source_count=len(sources))

    if not brief:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return brief


if __name__ == "__main__":
    # Run this file on its own to check the parsing and citation guard
    # work - no AI call, no credits or API quota spent:  python synthesize.py

    print("Checking a well-formed reply with only valid citations...")
    good_reply = """[BACKGROUND]
AI agents are increasingly used in enterprise sales workflows.

[FINDINGS]
- Adoption grew significantly in 2025 [Source 1]
- Most deployments focus on lead qualification [Source 2]

[DATAPOINTS]
- 42% of enterprises piloted an AI sales agent in 2025 [Source 1]

[CONFLICTING]
No significant disagreement found

[CONCLUSION]
Enterprise sales is an early but fast-growing use case for AI agents.

[END]"""
    result = parse_brief(good_reply, valid_source_count=2)
    assert "[Source 1]" in result["FINDINGS"]
    assert "(unverified citation removed)" not in result["FINDINGS"]
    assert "42%" in result["DATAPOINTS"]
    print("  OK - valid citations left untouched")

    print("\nChecking an invented citation gets caught...")
    bad_reply = """[BACKGROUND]
Some background text.

[FINDINGS]
- A real finding [Source 1]
- A suspicious finding that cites a source that doesn't exist [Source 9]

[DATAPOINTS]
None found

[CONFLICTING]
No significant disagreement found

[CONCLUSION]
A conclusion.

[END]"""
    result = parse_brief(bad_reply, valid_source_count=2)
    assert "[Source 9] (unverified citation removed)" in result["FINDINGS"]
    assert "[Source 1] (unverified citation removed)" not in result["FINDINGS"]
    print("  OK - [Source 9] flagged as unverified, [Source 1] left alone")

    print("\nChecking a reply with no recognisable markers at all...")
    assert parse_brief("Sorry, I can't research that.", valid_source_count=3) == {}
    print("  OK - returned {} instead of crashing")

    print("\nAll checks passed.")
