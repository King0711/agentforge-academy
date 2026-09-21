"""
Step 1 of the Web Research Agent.

This file talks to Tavily, a search API built specifically for AI agents -
it returns clean, already-summarized snippets instead of raw search-results
HTML, which is why this project uses it instead of scraping Google directly.

The parsing helper (_parse_results) is pure Python with no network call in
it, which is why the self-test at the bottom can check it thoroughly without
hitting Tavily or spending a search. Only run_search() itself needs a real
network call and a real TAVILY_API_KEY - that can only be checked for real,
against your own live account, the same way Gmail OAuth in the inbox triage
project can only be tested against a real login, not faked.
"""

import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

# How many search results to pull per topic. This is a MONEY decision as
# much as a UX one: Tavily's free tier caps you at 1,000 searches/month,
# and each call here is ONE search regardless of max_results - so this
# number controls how MUCH you learn per search, not how much it costs.
# 8 is enough sources for a genuinely useful brief without drowning the
# synthesis prompt in near-duplicate content.
MAX_RESULTS = 8


class SearchError(Exception):
    """Something went wrong talking to Tavily. The message explains what."""


def _parse_results(raw_results):
    """
    Turns Tavily's raw result list into the simple shape the rest of this
    project uses everywhere:

        [{"title": "...", "url": "...", "snippet": "..."}, ...]

    Tavily's real field for the summarized text is "content", not
    "snippet" - this is the one place that translation happens, so every
    other file in this project never needs to know Tavily's actual field
    names.

    Skips any result missing a url entirely (rare, but Tavily's advanced
    search mode occasionally returns one with no destination link - a
    source you can't cite is worse than no source at all).
    """
    parsed = []
    for item in raw_results:
        url = item.get("url", "").strip()
        if not url:
            continue
        parsed.append({
            "title": item.get("title", "").strip() or "(untitled)",
            "url": url,
            "snippet": item.get("content", "").strip(),
        })
    return parsed


def run_search(topic, max_results=MAX_RESULTS):
    """
    Runs one Tavily search and returns parsed results.

        results = run_search("AI agents in enterprise sales")

    Raises SearchError with a readable message if the API key is missing
    or the request fails - never a raw requests/Tavily exception, so
    main.py can catch one exception type no matter what actually broke.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise SearchError(
            "No TAVILY_API_KEY found.\n"
            "Get a free key (1,000 searches/month) at tavily.com and add "
            "it to your .env file:\n"
            "    TAVILY_API_KEY=tvly-your-key-here"
        )

    client = TavilyClient(api_key=api_key)
    try:
        response = client.search(query=topic, max_results=max_results, search_depth="advanced")
    except Exception as problem:
        # Tavily's client raises several different exception types for
        # auth failures, rate limits, and network errors. A research tool
        # that's about to loop over sources shouldn't need to know all of
        # them by name - one SearchError, with the real message attached,
        # is enough for main.py to report clearly and stop.
        raise SearchError(f"Tavily search failed: {problem}")

    return _parse_results(response.get("results", []))


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no network
    # call, no API key needed:  python search.py
    fake_response = [
        {"title": "  A Real Article  ", "url": "https://example.com/a", "content": "Some summarized text."},
        {"title": "", "url": "https://example.com/b", "content": ""},
        {"url": ""},  # Tavily occasionally returns a result missing a url entirely
    ]

    parsed = _parse_results(fake_response)
    print("Parsed", len(parsed), "usable results out of", len(fake_response), "raw ones:")
    for r in parsed:
        print(" ", r)

    assert len(parsed) == 2, "the result with no url should have been dropped"
    assert parsed[0]["title"] == "A Real Article"
    assert parsed[1]["title"] == "(untitled)"
    print("\nAll parsing checks passed. Tavily's real results have this exact shape.")
