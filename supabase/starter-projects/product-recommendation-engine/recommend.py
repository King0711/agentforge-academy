"""
Step 2 of the Product Recommendation Engine (part 2).

Asks the AI to recommend the top 5 products a customer is likely to buy
next. Two safety guards run on every reply: one drops any recommended
SKU that isn't actually in the catalog (a hallucinated product), and
one drops any recommended SKU the customer already owns - enforced in
code, not just requested in the prompt, since "exclude what they own"
is exactly the kind of instruction a model occasionally still misses.
"""

import json

from catalog import valid_skus
from sdt_ai import ask_ai


def build_prompt(customer, catalog):
    return f"""Customer profile:
Industry: {customer.get('industry', 'unknown')}
Company size segment: {customer.get('size_segment', 'unknown')}
Engagement segment: {customer.get('engagement_segment', 'unknown')}
Already owns (past purchases): {customer.get('past_purchases', [])}

Product catalog:
{json.dumps(catalog)}

Recommend the top 5 products this customer is most likely to buy next,
EXCLUDING any product they already own. For each, give a confidence
score (1-10, and vary it meaningfully based on how strong the fit is -
do not give every product the same score) and a one-sentence reason.

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"recommendations": [{{"sku": "...", "confidence": 0, "reason": "..."}}]}}"""


def parse_recommendations_reply(reply):
    """Defensive JSON parsing, same pattern used throughout this course. Returns None on real garbage."""
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    return data.get("recommendations", [])


def validate_recommendations(recommendations, catalog, past_purchases):
    """
    Drops any recommendation whose SKU isn't actually in the catalog
    (a hallucinated product), and any SKU the customer already owns -
    enforced here in code, not left to the prompt instruction alone.

        validate_recommendations(recs, catalog, ["BASIC-1"])
    """
    real_skus = valid_skus(catalog)
    owned = set(past_purchases)

    kept = []
    for rec in recommendations:
        sku = rec.get("sku")
        if sku not in real_skus:
            print(f"  Dropped recommendation for '{sku}' - not a real SKU in the catalog.")
            continue
        if sku in owned:
            print(f"  Dropped recommendation for '{sku}' - customer already owns it.")
            continue
        kept.append(rec)

    return kept


def recommend_for_customer(customer, catalog):
    """
    The main function. Give it one customer row (as a dict) and the
    catalog, get back a validated list of up to 5 recommendations.
    """
    prompt = build_prompt(customer, catalog)
    reply = ask_ai(prompt, max_tokens=600, project="product-recommendation-engine")

    recommendations = parse_recommendations_reply(reply)
    if recommendations is None:
        raise ValueError("The AI's reply wasn't valid JSON.\nRun it again - this usually fixes itself.")

    return validate_recommendations(recommendations, catalog, customer.get("past_purchases", []))


if __name__ == "__main__":
    # Run this file on its own to check parsing and both guards work -
    # no AI call, no credits spent:  python recommend.py
    catalog = [
        {"sku": "BASIC-1", "name": "Starter Plan"},
        {"sku": "PRO-1", "name": "Analytics Pro"},
        {"sku": "PRO-2", "name": "Automation Suite"},
    ]

    print("Checking a hallucinated SKU (not in the catalog) gets dropped...")
    recs = [
        {"sku": "PRO-1", "confidence": 8, "reason": "Good fit"},
        {"sku": "FAKE-999", "confidence": 9, "reason": "This SKU doesn't exist"},
    ]
    result = validate_recommendations(recs, catalog, past_purchases=[])
    assert len(result) == 1
    assert result[0]["sku"] == "PRO-1"
    print("  OK - the real SKU was kept, the hallucinated one was dropped")

    print("\nChecking an already-owned SKU gets dropped even though it's a real product...")
    recs = [
        {"sku": "BASIC-1", "confidence": 9, "reason": "Already owned - should be filtered"},
        {"sku": "PRO-2", "confidence": 7, "reason": "A genuinely new recommendation"},
    ]
    result = validate_recommendations(recs, catalog, past_purchases=["BASIC-1"])
    assert len(result) == 1
    assert result[0]["sku"] == "PRO-2"
    print("  OK - the owned product was dropped even though it's real, the new one was kept")

    print("\nChecking parse_recommendations_reply() strips a ```json code fence...")
    fenced = '```json\n{"recommendations": [{"sku": "PRO-1", "confidence": 8, "reason": "x"}]}\n```'
    assert len(parse_recommendations_reply(fenced)) == 1
    print("  OK")

    print("\nChecking a non-JSON reply returns None instead of crashing...")
    assert parse_recommendations_reply("Sorry, I can't recommend anything.") is None
    print("  OK")

    print("\nAll checks passed.")
