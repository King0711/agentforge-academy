"""
Step 1 of the Competitor Intelligence Monitor (part 1).

Fetches a competitor's homepage as plain text and their recent news via
Tavily. The text-cleaning and news-parsing helpers are pure functions
with no network call in them, tested below against fake data - only the
live fetch functions themselves need a real network call.
"""

import os
import re

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

BROWSER_HEADER = {"User-Agent": "Mozilla/5.0 (compatible; CompetitorMonitor/1.0)"}
NOT_THE_CONTENT = ["script", "style", "nav", "footer", "header", "aside", "form"]

# Stop after this many characters of homepage text. A MONEY decision:
# analyze.py sends this straight into a prompt alongside news and job
# data for every competitor on your watchlist - a full homepage's raw
# text costs real tokens for content that's mostly navigation and legal
# boilerplate anyway.
MAX_HOMEPAGE_CHARS = 3000

NEWS_MAX_RESULTS = 5


def clean_html_text(html, max_chars=MAX_HOMEPAGE_CHARS):
    """
    Turns raw page HTML into plain, readable text, capped at max_chars.

    Pure function, no network call - which is why the self-test below
    can check it thoroughly against HTML you already have.
    """
    soup = BeautifulSoup(html, "html.parser")
    for junk in soup(NOT_THE_CONTENT):
        junk.decompose()

    text = re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()
    return text[:max_chars]


def get_homepage_text(url):
    """
    Fetches url and returns its cleaned text, or "" if anything goes
    wrong - a blocked or slow competitor site should never take down
    the whole weekly run over one company.
    """
    try:
        response = requests.get(url, headers=BROWSER_HEADER, timeout=10)
        response.raise_for_status()
    except requests.RequestException:
        return ""
    return clean_html_text(response.text)


def _parse_news_results(raw_results):
    """
    Turns Tavily's raw result list into the simple shape this project
    uses everywhere: [{"title": "...", "snippet": "..."}, ...]

    Pure function - tested below without hitting Tavily.
    """
    parsed = []
    for item in raw_results:
        title = item.get("title", "").strip()
        if not title:
            continue
        parsed.append({"title": title, "snippet": item.get("content", "").strip()[:300]})
    return parsed


def get_recent_news(name, max_results=NEWS_MAX_RESULTS):
    """Searches Tavily for "{name} news this week" and returns parsed results."""
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("No TAVILY_API_KEY found. Get a free key at tavily.com and add it to .env.")

    client = TavilyClient(api_key=api_key)
    response = client.search(query=f"{name} news this week", max_results=max_results)
    return _parse_news_results(response.get("results", []))


if __name__ == "__main__":
    # Run this file on its own to check the pure parsing works - no
    # network call, no API key needed:  python scrape.py
    print("Checking clean_html_text()...")
    fake_html = """
    <html><body>
      <nav>Home | About | Careers</nav>
      <main><h1>Acme Corp</h1><p>We build the future of widgets.</p></main>
      <footer>Copyright 2026</footer>
    </body></html>
    """
    text = clean_html_text(fake_html)
    assert "Home | About" not in text
    assert "Copyright" not in text
    assert "future of widgets" in text
    print("  OK -", repr(text))

    print("\nChecking _parse_news_results()...")
    fake_results = [
        {"title": "Acme raises Series B", "content": "Acme Corp announced a $20M raise..."},
        {"title": "", "content": "should be skipped, has no title"},
    ]
    parsed = _parse_news_results(fake_results)
    assert len(parsed) == 1
    assert parsed[0]["title"] == "Acme raises Series B"
    print("  OK - result with no title correctly skipped:", parsed)

    print("\nAll parsing checks passed.")
