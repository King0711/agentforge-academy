"""
Step 3 of the Code Review Agent (continued) - flattens per-file review
results into the flat comment list GitHub's review API expects.
"""

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _severity_from_body(body):
    for label in ("HIGH", "MEDIUM", "LOW"):
        if f"[{label}]" in body:
            return label.lower()
    return "low"


def collect_comments(files_with_reviews):
    """
    Turns [(filename, review_dict), ...] into a flat, HIGH-severity-first
    list of {"path", "line", "body"} dicts ready for GitHub's review API.

        collect_comments([("auth.py", {"comments": [{"line": 2, "severity": "high", "comment": "..."}]})])

    Pure function - tested below without any AI call.
    """
    flattened = []
    for filename, review in files_with_reviews:
        for comment in review.get("comments", []):
            flattened.append({
                "path": filename,
                "line": comment["line"],
                "body": f"**[{comment['severity'].upper()}]** {comment['comment']}",
            })

    flattened.sort(key=lambda c: SEVERITY_ORDER.get(_severity_from_body(c["body"]), 3))
    return flattened


if __name__ == "__main__":
    # Run this file on its own to check the flattening and sort order
    # work - no AI call, no credits spent:  python parse.py
    files_with_reviews = [
        ("auth.py", {"comments": [
            {"line": 5, "severity": "low", "comment": "minor style nit"},
            {"line": 2, "severity": "high", "comment": "hardcoded password"},
        ]}),
        ("db.py", {"comments": [
            {"line": 10, "severity": "medium", "comment": "SQL built with f-strings"},
        ]}),
    ]

    comments = collect_comments(files_with_reviews)
    print("Flattened and sorted comments:")
    for c in comments:
        print(" ", c)

    assert len(comments) == 3
    assert "[HIGH]" in comments[0]["body"]
    assert "[MEDIUM]" in comments[1]["body"]
    assert "[LOW]" in comments[2]["body"]
    print("\nAll checks passed - HIGH severity sorted first, LOW last.")
