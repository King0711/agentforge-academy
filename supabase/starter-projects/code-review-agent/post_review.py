"""
Step 4 of the Code Review Agent (part 3) - posts the review back to
GitHub as inline comments plus a summary.
"""

import requests

from github_client import GITHUB_API


def submit_review(token, repo, pr_number, commit_id, comments, summary_body, event="COMMENT"):
    """
    Posts one PR review with inline comments and a summary body.

    comments must be GitHub's expected shape: [{"path", "line", "body"}, ...]
    - exactly what collect_comments() produces.
    """
    payload = {
        "commit_id": commit_id,
        "body": summary_body,
        "event": event,
        "comments": comments,
    }
    response = requests.post(
        f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}/reviews",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
        json=payload,
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    print("This file only wraps a live GitHub API call - there's no offline")
    print("self-test to run here. It's exercised for real in Build 4's webhook.py.")
