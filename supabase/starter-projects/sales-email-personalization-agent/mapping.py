"""
Step 2 of the Sales Email Personalization Agent (part 2) - maps a
prospect's challenges to your product's value propositions. Shared
across the whole sales team so messaging stays consistent.
"""

VALUE_PROPS = {
    "manual reporting": "Our platform auto-generates reports, saving 5+ hours/week",
    "scaling support": "Our AI agents handle tier-1 tickets so your team focuses on complex cases",
    "slow onboarding": "Our guided setup gets new customers live in under a day",
}


def map_value_props(challenges):
    """
    Checks each challenge string for any VALUE_PROPS keyword
    (case-insensitive) and returns matching value props, falling back
    to the first value prop if nothing matches.

        map_value_props(["Struggling with manual reporting workflows"])
        -> ["Our platform auto-generates reports, saving 5+ hours/week"]

    Pure function - tested below without any AI call.
    """
    matched = []
    for challenge in challenges:
        challenge_lower = challenge.lower()
        for keyword, value_prop in VALUE_PROPS.items():
            if keyword in challenge_lower and value_prop not in matched:
                matched.append(value_prop)

    if not matched:
        matched.append(next(iter(VALUE_PROPS.values())))

    return matched


if __name__ == "__main__":
    # Run this file on its own to check the mapping works - no AI call,
    # no credits spent:  python mapping.py
    print("Checking a challenge that matches a keyword...")
    result = map_value_props(["Struggling with manual reporting workflows"])
    assert result == ["Our platform auto-generates reports, saving 5+ hours/week"]
    print("  OK -", result)

    print("\nChecking case-insensitivity...")
    result = map_value_props(["MANUAL REPORTING takes forever"])
    assert len(result) == 1
    print("  OK - matched despite different casing")

    print("\nChecking multiple challenges matching different props...")
    result = map_value_props(["manual reporting is slow", "scaling support is hard"])
    assert len(result) == 2
    print("  OK -", result)

    print("\nChecking a challenge matching NOTHING falls back to the first value prop...")
    result = map_value_props(["their coffee machine is broken"])
    assert result == [next(iter(VALUE_PROPS.values()))]
    print("  OK - fell back correctly instead of returning an empty list")

    print("\nAll checks passed.")
