"""
Step 5 (continued) of the Web Research Agent - now with one follow-up
research round.

Run it with:  python main.py "your research topic"
"""

import sys

from citations import build_reference_list
from followup import get_followup_queries
from report import save_report
from scraper import fetch_full_text, is_thin
from sdt_ai import AIError
from search import SearchError, run_search
from synthesize import synthesize


def _fetch_thin_sources(sources):
    for source in sources:
        if is_thin(source["snippet"]):
            full_text = fetch_full_text(source["url"])
            if full_text:
                source["snippet"] = full_text


def research(topic):
    """
    Runs one full research pass, including one follow-up round: search,
    scrape thin sources, synthesize a first draft, ask the AI what's
    missing, search again, merge sources, re-synthesize, save.
    """
    print(f"Searching for: {topic}\n")
    sources = run_search(topic)
    if not sources:
        raise ValueError("Tavily returned no usable results for that topic. Try rephrasing it.")

    _fetch_thin_sources(sources)

    print(f"Synthesizing a first draft from {len(sources)} sources...\n")
    brief = synthesize(topic, sources)

    print("Checking for gaps worth a follow-up search...\n")
    followup_queries = get_followup_queries(topic, brief)

    if followup_queries:
        print(f"Running {len(followup_queries)} follow-up search(es): {followup_queries}\n")
        seen_urls = {s["url"] for s in sources}
        for query in followup_queries:
            new_sources = run_search(query)
            for source in new_sources:
                if source["url"] not in seen_urls:
                    sources.append(source)
                    seen_urls.add(source["url"])

        _fetch_thin_sources(sources)
        print(f"Re-synthesizing with {len(sources)} total sources...\n")
        brief = synthesize(topic, sources)
    else:
        print("No follow-up needed - the first draft already looked complete.\n")

    references = build_reference_list(sources)
    return save_report(topic, brief, references)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python main.py "your research topic"')
        sys.exit(1)

    topic = " ".join(sys.argv[1:])

    try:
        path = research(topic)
    except SearchError as problem:
        print(f"Search failed:\n{problem}")
        sys.exit(1)
    except AIError as problem:
        print(f"AI request failed:\n{problem}")
        sys.exit(1)
    except ValueError as problem:
        print(f"Could not complete the research:\n{problem}")
        sys.exit(1)

    print(f"\nDone. Report saved to: {path}")
