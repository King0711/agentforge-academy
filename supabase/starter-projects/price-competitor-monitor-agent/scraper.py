"""
Step 1 of the Price & Competitor Monitor Agent.

This file has one job: given a product page's URL and two CSS selectors,
pull out the product name and price. Everything else on the page --
navigation, footer, "customers also bought" -- is noise we ignore.
"""

import requests
from bs4 import BeautifulSoup

# Websites often block programs that don't look like a real browser.
# Telling them we're a normal browser avoids most of that.
BROWSER_HEADER = {"User-Agent": "Mozilla/5.0"}


def scrape_product(url, name_selector, price_selector):
    """
    Downloads a page and pulls out the product name + price using the
    CSS selectors you give it.

        product = scrape_product(
            "https://example.com/widget",
            name_selector=".product-title",
            price_selector=".price",
        )
        print(product)  # {"name": "Widget Pro", "price": "$49.00"}

    Raises a clear error if the page can't be fetched, or if a selector
    doesn't match anything on the page (which almost always means the
    site's HTML changed, or you copied the wrong selector).
    """
    try:
        page = requests.get(url, headers=BROWSER_HEADER, timeout=15)
        page.raise_for_status()
    except requests.RequestException as problem:
        raise ValueError(
            f"Could not open {url}.\n"
            f"Check the address is correct and that the page opens in your browser.\n"
            f"(Details: {problem})"
        )

    return parse_product_html(page.text, name_selector, price_selector)


def parse_product_html(html, name_selector, price_selector):
    """
    The actual extraction logic, kept separate from the network call above.

    Splitting it out like this lets us test the parsing against a fixed
    piece of HTML we control (see the self-test at the bottom) instead
    of depending on a live website's markup staying the same forever. A
    real competitor site can change its CSS class names at any time with
    zero warning; a hand-written fixture string never breaks by surprise
    months from now for a reason unrelated to your code.
    """
    soup = BeautifulSoup(html, "html.parser")

    name_tag = soup.select_one(name_selector)
    price_tag = soup.select_one(price_selector)

    if name_tag is None or price_tag is None:
        missing = []
        if name_tag is None:
            missing.append(f"name selector '{name_selector}'")
        if price_tag is None:
            missing.append(f"price selector '{price_selector}'")
        raise ValueError(
            "Couldn't find " + " or ".join(missing) + " on that page.\n"
            "The site's HTML probably changed since you picked the selector, "
            "or you copied the wrong one. Open the page in your browser, "
            "right-click the price, choose Inspect, and copy the new selector."
        )

    return {
        "name": name_tag.get_text(strip=True),
        "price": price_tag.get_text(strip=True),
    }


if __name__ == "__main__":
    # Run this file on its own to check the parsing logic works:
    #     python scraper.py
    #
    # This is a hand-written fixture, not a live page. A real competitor
    # site can redesign its pricing page at any time with no warning --
    # if this test depended on requests.get() hitting a real URL, it
    # could start failing months from now for a reason that has nothing
    # to do with your code. Testing against a string we control means
    # this test only ever fails when parse_product_html() itself breaks.
    fake_page = """
    <html><body>
      <nav>Home | Pricing | Contact</nav>
      <div class="product-card">
        <h2 class="product-title">Widget Pro</h2>
        <span class="price">$49.00</span>
      </div>
      <footer>(c) 2026 Example Store</footer>
    </body></html>
    """

    result = parse_product_html(
        fake_page, name_selector=".product-title", price_selector=".price"
    )
    print("Parsed:", result)
    assert result == {"name": "Widget Pro", "price": "$49.00"}, "Parsing broke!"

    # A selector that matches nothing should raise a clear error, not
    # crash with an AttributeError three lines later on a None value.
    try:
        parse_product_html(fake_page, name_selector=".no-such-class", price_selector=".price")
        raise AssertionError("Expected a ValueError for a missing selector")
    except ValueError as problem:
        print("\nCorrectly raised an error for a bad selector:")
        print(problem)

    print("\nSelf-test passed.")

    # Optional secondary demo: a real fetch against books.toscrape.com,
    # a public site built specifically for scraping practice (its HTML
    # is meant to stay stable). May still need updating if that changes.
    #
    # live = scrape_product(
    #     "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
    #     name_selector=".product_main h1",
    #     price_selector="p.price_color",
    # )
    # print("\nLive fetch result:", live)
