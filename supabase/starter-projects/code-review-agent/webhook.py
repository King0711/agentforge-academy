"""
Step 4 of the Code Review Agent (final version) - receives GitHub's
webhook, reviews every changed file, scores the PR, and posts the
review back - all through the safety-forced COMMENT-only mode from
decide.py.
"""

import hashlib
import hmac
import os
import sys

from decide import review_event
from dotenv import load_dotenv
from flask import Flask, request
from github_client import get_installation_token, get_pr_files
from parse import collect_comments
from post_review import submit_review
from reviewer import review_file
from sdt_ai import AIError
from summary import build_summary

load_dotenv()

app = Flask(__name__)

RELEVANT_ACTIONS = {"opened", "synchronize"}


def verify_signature(payload_body, signature_header, secret):
    """Same signature check from Build 1 - see webhook.py's original version for the full explanation."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def review_pr(payload):
    repo = payload["repository"]["full_name"]
    pr_number = payload["pull_request"]["number"]
    commit_id = payload["pull_request"]["head"]["sha"]
    installation_id = payload["installation"]["id"]

    app_id = os.environ["GITHUB_APP_ID"]
    with open("private-key.pem") as f:
        private_key = f.read()

    token = get_installation_token(app_id, private_key, installation_id)
    files = get_pr_files(token, repo, pr_number)

    files_with_reviews = []
    for file in files:
        try:
            review = review_file(file["filename"], file["patch"])
        except (AIError, ValueError) as problem:
            print(f"  Skipped {file['filename']}: {problem}")
            continue
        files_with_reviews.append((file["filename"], review))

    all_comments = collect_comments(files_with_reviews)
    summary_body = build_summary(all_comments)
    event = review_event(all_comments)  # force_comment_only=True by default - see decide.py

    submit_review(token, repo, pr_number, commit_id, all_comments, summary_body, event=event)
    print(f"Posted review on {repo}#{pr_number}: {len(all_comments)} comment(s), event={event}")


@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Hub-Signature-256", "")
    secret = os.environ["WEBHOOK_SECRET"]

    if not verify_signature(request.data, signature, secret):
        return "Invalid signature", 401

    payload = request.get_json()
    if payload.get("action") in RELEVANT_ACTIONS:
        review_pr(payload)

    return "", 200


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        secret = "my-secret"
        body = b'{"action": "opened"}'
        correct_sig = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        assert verify_signature(body, correct_sig, secret) is True
        assert verify_signature(body, "sha256=wrongvalue", secret) is False
        print("Signature checks still pass after wiring in the full pipeline.")
    else:
        app.run(port=5000)
