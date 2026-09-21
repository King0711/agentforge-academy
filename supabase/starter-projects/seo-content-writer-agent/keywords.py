"""
Step 1 of the SEO Content Writer Agent (part 1).

Pulls search volume for your target keyword from DataForSEO. The
response-parsing helper is pure and tested below against a fake
response shaped like DataForSEO's real one; only the live POST needs a
real account and spends a real, paid credit.
"""

import requests

DATAFORSEO_URL = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live"


def _parse_search_volume_response(response_json):
    """
    Pulls the search volume number out of DataForSEO's real (deeply
    nested) response shape.

        _parse_search_volume_response(fake_response) -> 1600

    Returns None (never raises) if the shape isn't what's expected -
    DataForSEO returns an error status with no "result" at all on a bad
    request, and this shouldn't crash the whole pipeline over one
    malformed response.
    """
    try:
        tasks = response_json.get("tasks", [])
        result = tasks[0]["result"][0]
        return result.get("search_volume")
    except (IndexError, KeyError, TypeError):
        return None


def get_keyword_data(keyword, login, password):
    """
    POSTs to DataForSEO and returns the search volume for `keyword`, or
    None if the response shape is unexpected. Costs a real DataForSEO
    credit per call - see Build 1's goFurther note on caching results
    locally during development.
    """
    payload = [{"keyword": keyword, "location_code": 2840, "language_code": "en"}]
    response = requests.post(DATAFORSEO_URL, json=payload, auth=(login, password), timeout=30)
    response.raise_for_status()
    return _parse_search_volume_response(response.json())


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no
    # DataForSEO account or network call needed:  python keywords.py
    fake_response = {"tasks": [{"result": [{"keyword": "ai agents", "search_volume": 1600}]}]}
    assert _parse_search_volume_response(fake_response) == 1600
    print("Parsed a fake DataForSEO response correctly: search_volume = 1600")

    print("\nChecking a malformed/empty response doesn't crash...")
    assert _parse_search_volume_response({"tasks": []}) is None
    assert _parse_search_volume_response({}) is None
    print("  OK - both returned None instead of raising")

    print("\nAll checks passed.")
