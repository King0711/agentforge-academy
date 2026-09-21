"""
Step 1 of the SEO Content Writer Agent (part 2).

Pulls the top 10 organic results for your target keyword. Same
pure/live split as keywords.py.
"""

import requests

SERP_URL = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"


def _parse_serp_response(response_json):
    """
    Pulls the top organic results out of DataForSEO's real response
    shape, as [{"title": ..., "url": ...}, ...].

    Skips any item missing a URL entirely, and skips paid/featured-
    snippet items that aren't type "organic" - this project is
    specifically about what genuinely RANKS organically, not what Google
    happens to show above it.
    """
    try:
        tasks = response_json.get("tasks", [])
        items = tasks[0]["result"][0].get("items", [])
    except (IndexError, KeyError, TypeError):
        return []

    results = []
    for item in items:
        if item.get("type") != "organic":
            continue
        url = item.get("url")
        if not url:
            continue
        results.append({"title": item.get("title", "").strip(), "url": url})

    return results[:10]


def get_top_results(keyword, login, password):
    """POSTs to DataForSEO and returns the top 10 organic results for `keyword`."""
    payload = [{"keyword": keyword, "location_code": 2840, "language_code": "en"}]
    response = requests.post(SERP_URL, json=payload, auth=(login, password), timeout=30)
    response.raise_for_status()
    return _parse_serp_response(response.json())


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no
    # DataForSEO account or network call needed:  python serp.py
    fake_response = {
        "tasks": [{"result": [{"items": [
            {"type": "organic", "title": "Best AI Agents 2026", "url": "https://example.com/a"},
            {"type": "featured_snippet", "title": "Should be skipped", "url": "https://example.com/skip"},
            {"type": "organic", "title": "No URL here", "url": None},
            {"type": "organic", "title": "Another Real Result", "url": "https://example.com/b"},
        ]}]}]
    }
    results = _parse_serp_response(fake_response)
    assert len(results) == 2
    assert results[0]["title"] == "Best AI Agents 2026"
    print("Parsed", len(results), "organic results, correctly skipping the featured snippet and the no-URL item:")
    for r in results:
        print(" ", r)

    print("\nAll checks passed.")
