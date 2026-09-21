"""
Step 1 of the Sales Email Personalization Agent (part 1).

Searches for public context on a prospect and their company using
Tavily - not scraping LinkedIn directly, which avoids its anti-scraping
measures entirely. The result-parsing helper is pure and tested below
against fake Tavily responses; only the live search needs a real key.
"""

import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

RESULTS_PER_SEARCH = 3


def _parse_results(raw_results, max_results=RESULTS_PER_SEARCH):
    """
    Turns Tavily's raw result list into a list of plain content
    snippets, capped at max_results.

        _parse_results([{"title": "...", "content": "..."}, ...])
        -> ["...", "..."]

    Pure function - tested below without hitting Tavily.
    """
    return [r.get("content", "").strip() for r in raw_results[:max_results] if r.get("content")]


def enrich_prospect(name, company):
    """
    Searches for the prospect's public presence and recent company
    news, and returns {"profile": [...], "news": [...]}.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("No TAVILY_API_KEY found. Get a free key at tavily.com and add it to .env.")

    client = TavilyClient(api_key=api_key)

    profile_response = client.search(query=f"{name} {company} LinkedIn", max_results=RESULTS_PER_SEARCH)
    news_response = client.search(query=f"{company} news 2026", max_results=RESULTS_PER_SEARCH)

    return {
        "profile": _parse_results(profile_response.get("results", [])),
        "news": _parse_results(news_response.get("results", [])),
    }


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no network
    # call, no API key needed:  python enrich.py
    fake_results = [
        {"title": "A", "content": "Jordan Lee is VP of Engineering at Acme Robotics."},
        {"title": "B", "content": ""},
        {"title": "C", "content": "Acme Robotics raised a Series B in 2026."},
        {"title": "D", "content": "This should be cut off by the max_results cap."},
    ]
    parsed = _parse_results(fake_results, max_results=3)
    assert len(parsed) == 2  # only the first 3 items are considered; the empty-content one is skipped
    print("Parsed", len(parsed), "results, empty content correctly skipped:")
    for p in parsed:
        print(" -", p)

    print("\nAll checks passed.")
