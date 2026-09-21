"""
Step 4 of the Code Review Agent (part 2) - decides whether to approve,
comment, or request changes, based on what was actually found.
"""

from summary import count_severities

# Forced to always return COMMENT for now, regardless of findings - see
# review_event()'s docstring. This is a deliberate safety default: the
# bot should never auto-approve or auto-block a real PR until you've
# personally confirmed its findings are useful, not noisy, across a
# handful of real reviews.
FORCE_COMMENT_ONLY = True


def review_event(all_comments, force_comment_only=FORCE_COMMENT_ONLY):
    """
    Returns "REQUEST_CHANGES", "COMMENT", or "APPROVE" based on the
    highest severity found.

        review_event([{"body": "**[HIGH]** ..."}], force_comment_only=False)
        -> "REQUEST_CHANGES"

    While force_comment_only is True (the default, and the only mode
    main.py uses until you decide otherwise), always returns "COMMENT" -
    this lets you see exactly what the bot WOULD have decided (via the
    severity counts in the summary) without it ever blocking or
    auto-approving a real PR while you're still building trust in its
    judgment.
    """
    high, medium = count_severities(all_comments)

    if force_comment_only:
        return "COMMENT"

    if high > 0:
        return "REQUEST_CHANGES"
    if medium > 0:
        return "COMMENT"
    return "APPROVE"


if __name__ == "__main__":
    # Run this file on its own to check the decision logic works - no
    # AI call, no credits spent:  python decide.py
    high_comments = [{"body": "**[HIGH]** hardcoded password"}]
    medium_comments = [{"body": "**[MEDIUM]** SQL built with f-strings"}]
    clean_comments = []

    print("Checking the safety default (force_comment_only=True) overrides everything...")
    assert review_event(high_comments) == "COMMENT"
    assert review_event(medium_comments) == "COMMENT"
    assert review_event(clean_comments) == "COMMENT"
    print("  OK - all three cases return COMMENT under the default safe mode")

    print("\nChecking the real decision logic underneath, with the override explicitly off...")
    assert review_event(high_comments, force_comment_only=False) == "REQUEST_CHANGES"
    assert review_event(medium_comments, force_comment_only=False) == "COMMENT"
    assert review_event(clean_comments, force_comment_only=False) == "APPROVE"
    print("  OK - HIGH -> REQUEST_CHANGES, MEDIUM -> COMMENT, clean -> APPROVE")

    print("\nAll checks passed.")
