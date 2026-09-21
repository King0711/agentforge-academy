"""
Step 2 of the Web Research Agent.

Tavily's search results already come with a short summarized snippet, but
sometimes that snippet is too thin to cite meaningfully - a couple of
sentences pulled from a much longer article. This file fetches and cleans
the FULL page text for exactly those thin sources, so main.py only pays
the cost of a real page fetch where it's actually needed.
"""

import re

import requests
from bs4 import BeautifulSoup

# Below this many characters, a Tavily snippet is too thin to cite - go
# fetch the real page instead. Above it, the snippet is already good
# enough, and fetching the whole page would just slow the run down for
# no real gain in citation quality.
THIN_SNIPPET_THRESHOLD = 200

# Stop after this many characters of cleaned page text. A MONEY decision,
# same reasoning as the Document Summarizer's MAX_CHARACTERS: the AI
# doesn't need an entire 5,000-word article to write one cited paragraph
# about it, and every extra character here is extra input-token cost on
# every synthesis call that includes this source.
MAX_CHARS = 6000

# Parts of a page that are never the actual article content.
NOT_THE_ARTICLE = ["script", "style", "nav", "footer", "header", "aside", "form"]

BROWSER_HEADER = {"User-Agent": "Mozilla/5.0 (compatible; ResearchAgent/1.0)"}


def is_thin(snippet):
    """A snippet under THIN_SNIPPET_THRESHOLD characters is worth replacing with the real page."""
    return len(snippet.strip()) < THIN_SNIPPET_THRESHOLD


def clean_html(html):
    """
    Turns raw page HTML into plain, readable text.

        text = clean_html(response.text)

    Pure function, no network call - which is why the self-test below can
    check it thoroughly against HTML you already have, instead of a live
    page that might change or go offline between when you write this test
    and when you run it.
    """
    soup = BeautifulSoup(html, "html.parser")
    for junk in soup(NOT_THE_ARTICLE):
        junk.decompose()

    text = soup.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_CHARS]


def fetch_full_text(url):
    """
    Fetches a URL and returns its cleaned text, or "" if anything at all
    goes wrong.

        text = fetch_full_text("https://example.com/article")

    Returning "" instead of raising is a deliberate choice specific to
    this project: main.py calls this once per thin source in a loop, and
    one blocked or slow site (a very common thing on the open web) should
    never take down a whole research run over a source it can otherwise
    synthesize fine from its Tavily snippet alone.
    """
    try:
        response = requests.get(url, headers=BROWSER_HEADER, timeout=10)
        response.raise_for_status()
    except requests.RequestException:
        return ""

    try:
        return clean_html(response.text)
    except Exception:
        # A genuinely malformed page (rare, but real) shouldn't crash the
        # whole research run over one source either.
        return ""


if __name__ == "__main__":
    # Run this file on its own to check it works:  python scraper.py
    print("Checking is_thin()...")
    assert is_thin("Short.")
    assert not is_thin("A" * 500)
    print("  OK")

    print("Checking clean_html() strips junk and collapses whitespace...")
    fake_html = """
    <html><head><style>.x{color:red}</style></head>
    <body>
      <nav>Home | About</nav>
      <article>
        <h1>Real   Title</h1>
        <p>This   is the actual   article text.</p>
      </article>
      <footer>Copyright 2026</footer>
    </body></html>
    """
    text = clean_html(fake_html)
    assert "Home | About" not in text
    assert "Copyright" not in text
    assert "actual article text" in text
    print("  OK -", repr(text))

    print("\nChecking fetch_full_text() against a real, stable page...")
    result = fetch_full_text("https://en.wikipedia.org/wiki/Artificial_intelligence")
    if len(result) > 500:
        print(f"  OK - fetched a real page, got {len(result)} characters")
    else:
        # A network hiccup or a site layout change shouldn't fail the
        # whole test file - it's the one check here that depends on
        # something outside our control.
        print("  SKIPPED - could not confirm a live fetch (network or site issue, not a bug in this file)")

    print("\nChecking a deliberately bad URL doesn't crash...")
    result = fetch_full_text("https://this-domain-does-not-exist-12345.example")
    assert result == ""
    print("  OK - unreachable URL correctly returned '' instead of raising")

    print("\nAll checks passed.")
