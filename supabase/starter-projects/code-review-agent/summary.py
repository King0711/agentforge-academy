"""
Step 4 of the Code Review Agent (part 1) - scores the PR and writes a
short Markdown summary.
"""


def count_severities(comments):
    """Pure function - counts how many HIGH and MEDIUM comments are in the list."""
    high = sum(1 for c in comments if "[HIGH]" in c["body"])
    medium = sum(1 for c in comments if "[MEDIUM]" in c["body"])
    return high, medium


def compute_score(high, medium):
    """
    A simple, transparent scoring formula - deliberately not a black
    box, so anyone reading a review can sanity-check WHY a PR scored 65
    just by counting its own HIGH/MEDIUM comments.

        compute_score(high=1, medium=1) -> 65   (100 - 25 - 10)
    """
    return max(0, 100 - high * 25 - medium * 10)


def build_summary(all_comments):
    """
    The main function. Give it the flattened comment list, get back a
    Markdown summary string with the score and counts.
    """
    high, medium = count_severities(all_comments)
    score = compute_score(high, medium)

    return (
        f"## AI Code Review Summary\n\n"
        f"**Score: {score}/100**\n\n"
        f"- {high} high-severity issue(s)\n"
        f"- {medium} medium-severity issue(s)\n"
        f"- {len(all_comments) - high - medium} low-severity issue(s)"
    )


if __name__ == "__main__":
    # Run this file on its own to check scoring works - no AI call, no
    # credits spent:  python summary.py
    comments = [
        {"body": "**[HIGH]** hardcoded password"},
        {"body": "**[MEDIUM]** SQL string built with f-strings"},
        {"body": "**[LOW]** inconsistent naming"},
    ]

    high, medium = count_severities(comments)
    assert (high, medium) == (1, 1)
    print(f"Counted {high} high, {medium} medium.")

    score = compute_score(high, medium)
    assert score == 65
    print("Score:", score)

    summary = build_summary(comments)
    assert "Score: 65/100" in summary
    print("\n" + summary)

    print("\nChecking a clean PR scores 100...")
    assert compute_score(0, 0) == 100
    print("  OK")

    print("\nChecking the score never goes negative...")
    assert compute_score(high=10, medium=10) == 0
    print("  OK")

    print("\nAll checks passed.")
