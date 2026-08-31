"""
Step 1 of the Social Media Post Generator.

This file has one job: given a web address, get the actual words out of
that page. Web pages are full of menus, adverts and footers - we only
want the article itself.
"""

import requests
from bs4 import BeautifulSoup

# Websites often block programs that don't look like a real browser.
# Telling them we're a normal browser avoids most of that.
BROWSER_HEADER = {"User-Agent": "Mozilla/5.0"}

# Stop after this many characters.
#
# This is a MONEY decision, not a technical one. Everything you send to
# the AI costs credits, and a long article costs more than a short one.
# 6000 characters is roughly 2-3 pages - plenty for the AI to understand
# what an article is about. Sending the whole thing would cost several
# times more and produce almost the same posts.
MAX_CHARACTERS = 6000

# Parts of a page that are never the article.
NOT_THE_ARTICLE = ["script", "style", "nav", "footer", "header", "aside", "form"]


def get_article_text(url):
    """
    Downloads a web page and returns just its readable text.

        text = get_article_text("https://example.com/some-post")

    Raises a clear error if the page can't be fetched or has no text.
    """
    try:
        page = requests.get(url, headers=BROWSER_HEADER, timeout=15)
        page.raise_for_status()
    except requests.RequestException:
        raise ValueError(
            f"Could not open that link.\n"
            f"Check the address is correct and that the page opens in your browser."
        )

    # BeautifulSoup turns messy HTML into something we can search through.
    soup = BeautifulSoup(page.text, "html.parser")

    # Throw away the parts that are never article text.
    for junk in soup(NOT_THE_ARTICLE):
        junk.decompose()

    # Real article text lives in <p> (paragraph) tags almost every time.
    #
    # The " " matters. A paragraph containing a link looks like
    # <p>a field of <a>computer science</a>that studies...</p> and without
    # a separator you get "ofcomputer sciencethat" - words glued together.
    # The AI still copes, but it writes noticeably worse posts from mush.
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    text = "\n".join(p for p in paragraphs if p)

    if len(text) < 200:
        raise ValueError(
            "That page didn't have much readable text in it.\n"
            "Some sites load their words with JavaScript, which this can't see.\n"
            "Try a normal blog post or news article, or paste the text in directly."
        )

    return text[:MAX_CHARACTERS]


if __name__ == "__main__":
    # Run this file on its own to check it works:  python article.py
    sample = "https://en.wikipedia.org/wiki/Artificial_intelligence"
    print(f"Fetching: {sample}\n")
    words = get_article_text(sample)
    print(f"Got {len(words)} characters. First 300:\n")
    print(words[:300])
