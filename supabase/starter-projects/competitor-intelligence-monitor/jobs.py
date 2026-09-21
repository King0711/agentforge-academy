"""
Step 1 of the Competitor Intelligence Monitor (part 2).

Pulls job titles off a competitor's careers page - a hiring pattern
(3 open "ML Engineer" roles, say) is often a stronger strategic signal
than anything on their homepage. The title-filtering logic is pure and
tested below; only the live page fetch needs a real network call.
"""

import requests
from bs4 import BeautifulSoup

from scrape import BROWSER_HEADER

MIN_TITLE_LENGTH = 5
MAX_TITLE_LENGTH = 80
MAX_TITLES = 30

# A careers page's h2/h3/a tags mix real job titles ("Senior Backend
# Engineer") with site furniture ("Careers", "Apply now"). Length alone
# doesn't catch every case ("Careers" is 7 characters, well within a
# normal title's length) - this explicit list catches the common nav
# words that length filtering alone would miss.
NAV_JUNK_WORDS = {"careers", "jobs", "apply", "apply now", "home", "about", "about us", "contact"}


def parse_job_titles(html):
    """
    Pulls candidate job titles out of raw careers-page HTML: the text of
    every h2, h3, and a tag, kept only if it isn't obvious navigation
    text and its length is between MIN_TITLE_LENGTH and MAX_TITLE_LENGTH
    characters.

        parse_job_titles("<h2>Senior Backend Engineer</h2>...")
        -> ["Senior Backend Engineer", ...]

    De-duplicates (a title often appears as both a heading and a link on
    the same page) and caps at MAX_TITLES, since a large careers page
    can list hundreds of roles and the strategic signal is in the
    PATTERN, not every single listing.
    """
    soup = BeautifulSoup(html, "html.parser")
    candidates = soup.find_all(["h2", "h3", "a"])

    titles = []
    seen = set()
    for tag in candidates:
        text = tag.get_text(strip=True)
        if text.lower() in NAV_JUNK_WORDS:
            continue
        if MIN_TITLE_LENGTH <= len(text) <= MAX_TITLE_LENGTH and text not in seen:
            titles.append(text)
            seen.add(text)
        if len(titles) >= MAX_TITLES:
            break

    return titles


def get_job_titles(jobs_url):
    """
    Fetches jobs_url and returns up to MAX_TITLES candidate job titles,
    or an empty list if anything goes wrong - including a JS-rendered
    careers page returning no usable HTML text at all, a real and common
    limitation of a simple requests-based scraper, not a bug to fix here.
    """
    try:
        response = requests.get(jobs_url, headers=BROWSER_HEADER, timeout=10)
        response.raise_for_status()
    except requests.RequestException:
        return []
    return parse_job_titles(response.text)


if __name__ == "__main__":
    # Run this file on its own to check the title-filtering logic works
    # - no network call needed:  python jobs.py
    fake_html = """
    <html><body>
      <h2>Careers</h2>
      <h3>Senior Backend Engineer</h3>
      <h3>ML</h3>
      <a href="/apply">Apply now</a>
      <a href="/jobs/pm">Senior Product Manager - Platform</a>
      <h3>Senior Backend Engineer</h3>
    </body></html>
    """
    titles = parse_job_titles(fake_html)
    print("Parsed titles:", titles)

    assert "Senior Backend Engineer" in titles
    assert titles.count("Senior Backend Engineer") == 1
    assert "Senior Product Manager - Platform" in titles
    assert "ML" not in titles
    assert "Careers" not in titles
    assert "Apply now" not in titles
    print("  OK - short entries, duplicates, and nav junk all correctly filtered")

    print("\nAll checks passed.")
