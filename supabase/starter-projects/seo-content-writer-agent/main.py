"""
Step 4 of the SEO Content Writer Agent (part 3) - the full pipeline,
end to end.

Run it with:  python main.py "your target keyword"
"""

import os
import sys

from dotenv import load_dotenv
from export import export_article
from gap_analysis import find_gaps
from keywords import get_keyword_data
from meta import generate_meta
from outline import generate_outline
from scraper import fetch_full_text
from sdt_ai import AIError
from serp import get_top_results
from write_sections import write_article

load_dotenv()


def run(keyword):
    login = os.environ["DATAFORSEO_LOGIN"]
    password = os.environ["DATAFORSEO_PASSWORD"]

    print(f"Pulling keyword data and SERP results for '{keyword}'...")
    volume = get_keyword_data(keyword, login, password)
    top_results = get_top_results(keyword, login, password)
    print(f"  Search volume: {volume}. Found {len(top_results)} top-ranking pages.")

    print("Scraping competitor pages...")
    articles = []
    for result in top_results:
        text = fetch_full_text(result["url"])
        if text:
            articles.append({"title": result["title"], "text": text})
    print(f"  Successfully scraped {len(articles)} of {len(top_results)} pages.")

    print("Finding content gaps...")
    gaps = find_gaps(keyword, articles)
    print(f"  Found {len(gaps)} gaps.")

    print("Generating outline...")
    outline = generate_outline(keyword, gaps)

    print("Writing the article section by section...")
    article_md = write_article(keyword, outline)

    intro = article_md.split("\n\n")[1] if "\n\n" in article_md else article_md[:500]
    print("Generating SEO metadata...")
    meta = generate_meta(keyword, intro)

    slug = meta["slug"] or "article"
    filename = f"{slug}.md"
    export_article(meta, article_md, filename)

    print(f"\nDone. Exported to: {filename}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python main.py "your target keyword"')
        sys.exit(1)

    try:
        run(" ".join(sys.argv[1:]))
    except AIError as problem:
        print(f"AI request failed:\n{problem}")
    except ValueError as problem:
        print(f"Could not complete the pipeline:\n{problem}")
