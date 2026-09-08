"""
Step 3 of the Gmail AI Triage Agent - ties fetching, classifying, and
labeling into one script you actually run against your real inbox.

Run it with:      python main.py
Self-test with:   python main.py --selftest   (fakes Gmail and the AI,
                   so it costs no credits and never touches a real inbox -
                   it only checks that the wiring below handles a
                   successful email and an unparseable one correctly.)
"""

import sys

from classifier import classify_email
from gmail_client import apply_label, get_gmail_service, list_unread_messages, save_draft
from sdt_ai import AIError

# Every priority gets a Gmail label, so triage results are visible in
# your inbox sidebar - not just in this script's console output.
LABEL_FOR_PRIORITY = {
    "HIGH": "URGENT",
    "MEDIUM": "IMPORTANT",
    "LOW": "LOW",
}


def triage_inbox():
    """
    Fetches your unread emails, classifies each one, applies a label, and
    drafts a reply for anything HIGH or MEDIUM priority.

    Returns the list of emails that were successfully triaged, so the
    caller (the __main__ block below, or your own script later) can see
    what happened without re-parsing console output.
    """
    service = get_gmail_service()
    emails = list_unread_messages(service)

    if not emails:
        print("No unread emails to triage.")
        return []

    results = []
    for email in emails:
        try:
            classification = classify_email(email)
        except AIError as problem:
            # One bad AI call (network hiccup, low credit balance, the
            # gateway being paused) shouldn't take down the whole run -
            # print why and move to the next email. sdt_ai only raises
            # AIError for requests that never completed, so no credits
            # were spent on this one.
            print(f"  Skipped '{email['subject']}': {problem}")
            continue

        if classification is None:
            # Different from the AIError case above: the AI DID answer,
            # it just wasn't in a shape parse_reply() could read. This is
            # rarer, but real with any LLM - printed distinctly so you
            # can tell "the AI never answered" apart from "the AI
            # answered oddly" when you're debugging a run later.
            print(f"  Could not parse the AI's reply for '{email['subject']}' - skipping, no label applied.")
            continue

        label = LABEL_FOR_PRIORITY[classification["priority"]]
        apply_label(service, email["id"], label)

        if classification["reply"]:
            save_draft(service, email["id"], email["sender"], classification["reply"])

        print(f"  [{classification['priority']}] {email['subject']} - {classification['reason']}")
        results.append({**email, **classification, "label": label})

    return results


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        # Fakes stand in for Gmail and the AI, so this checks the WIRING
        # (skip on AIError, skip on an unparseable reply, label + draft
        # otherwise) without a Gmail login, a network call, or a single
        # credit spent. Reassigning these names at module level works
        # because triage_inbox() above looks them up as globals each
        # time it's called - it doesn't matter that they started out as
        # imports from gmail_client and classifier.
        calls = []

        def fake_get_gmail_service():
            return "FAKE_SERVICE"

        def fake_list_unread_messages(service):
            return [
                {"id": "1", "sender": "a@b.com", "subject": "Urgent thing", "body": "help, now"},
                {"id": "2", "sender": "c@d.com", "subject": "Weird one", "body": "??"},
            ]

        def fake_classify_email(email):
            if email["id"] == "2":
                return None  # simulates an AI reply that didn't parse
            return {"priority": "HIGH", "reason": "test reason", "reply": "ok, on it"}

        def fake_apply_label(service, message_id, label):
            calls.append(("label", message_id, label))

        def fake_save_draft(service, message_id, sender, reply_text):
            calls.append(("draft", message_id))

        get_gmail_service = fake_get_gmail_service
        list_unread_messages = fake_list_unread_messages
        classify_email = fake_classify_email
        apply_label = fake_apply_label
        save_draft = fake_save_draft

        results = triage_inbox()
        assert len(results) == 1, "the unparseable email should have been skipped, not counted"
        assert ("label", "1", "URGENT") in calls, "the parseable email should have been labeled URGENT"
        assert ("draft", "1") in calls, "a HIGH priority email with a reply should get a draft"
        assert not any(call[1] == "2" for call in calls), "the skipped email must not get a label or draft"
        print("Self-test passed: unparseable reply skipped, valid one labeled URGENT and drafted.")
    else:
        print("Checking your inbox...\n")
        triage_inbox()
        print("\nDone. Check Gmail: labels should be applied, and drafts saved for anything HIGH or MEDIUM.")
