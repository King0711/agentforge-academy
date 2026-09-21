"""
Step 2 of the SEO Content Writer Agent (part 1) - fetches a competitor
page's readable text, same defensive pattern used across this course: a
blocked or slow page returns "" instead of crashing the whole batch.
"""

import re

import requests
from bs4 import BeautifulSoup

BROWSER_HEADER = {"User-Agent": "Mozilla/5.0 (compatible; SEOContentAgent/1.0)"}
NOT_THE_ARTICLE = ["script", "style", "nav", "footer", "header", "aside", "form"]


def clean_html_text(html, max_chars=1500):
    soup = BeautifulSoup(html, "html.parser")
    for junk in soup(NOT_THE_ARTICLE):
        junk.decompose()
    text = re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()
    return text[:max_chars]


def fetch_full_text(url, max_chars=1500):
    """Fetches url and returns cleaned text, or "" if anything goes wrong."""
    try:
        response = requests.get(url, headers=BROWSER_HEADER, timeout=10)
        response.raise_for_status()
    except requests.RequestException:
        return ""
    return clean_html_text(response.text, max_chars=max_chars)


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no network
    # call needed:  python scraper.py
    fake_html = "<html><body><nav>Menu</nav><article><p>Real article content here.</p></article></body></html>"
    text = clean_html_text(fake_html)
    assert "Menu" not in text
    assert "Real article content" in text
    print("Cleaned text:", repr(text))

    print("\nChecking a deliberately bad URL doesn't crash...")
    assert fetch_full_text("https://this-domain-does-not-exist-12345.example") == ""
    print("  OK - unreachable URL correctly returned '' instead of raising")

    print("\nAll checks passed.")
