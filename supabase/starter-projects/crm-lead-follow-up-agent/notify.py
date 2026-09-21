"""
Step 4 of the CRM Lead Follow-Up Agent (part 3) - pings Slack once
drafts are ready, so reps don't have to remember to check Gmail.
"""

import requests


def build_message(count):
    """
    Turns a draft count into the exact Slack message text. Pure
    function - tested below without a real webhook.
    """
    if count == 1:
        return "1 stale deal just got an AI-drafted follow-up - check your Gmail drafts!"
    return f"{count} stale deals just got AI-drafted follow-ups - check your Gmail drafts!"


def notify_slack(webhook_url, count):
    """
    Posts build_message(count) to a Slack Incoming Webhook.

    Silently does nothing if webhook_url is empty - Slack notification
    is optional for this project, and a missing webhook shouldn't fail
    a run that otherwise completed successfully.
    """
    if not webhook_url:
        return

    try:
        requests.post(webhook_url, json={"text": build_message(count)}, timeout=10)
    except requests.RequestException as problem:
        # A dead webhook is annoying, not catastrophic - the drafts
        # themselves were already saved successfully by this point.
        print(f"Could not reach Slack (drafts were still saved): {problem}")


if __name__ == "__main__":
    # Run this file on its own to check the message text is right - no
    # webhook or network call needed:  python notify.py
    assert build_message(1) == "1 stale deal just got an AI-drafted follow-up - check your Gmail drafts!"
    assert build_message(3) == "3 stale deals just got AI-drafted follow-ups - check your Gmail drafts!"
    print("Message text correct for both singular and plural counts.")

    print("\nChecking an empty webhook URL does nothing (and doesn't crash)...")
    notify_slack("", 5)
    print("Confirmed: no request attempted with an empty URL.")

    print("\nAll checks passed.")
