"""
Step 1 of the Gmail AI Triage Agent.

This file talks to Gmail: it logs you in with OAuth, fetches your unread
messages, and applies labels back onto them. Everything in here that
*parses* a message (get_header, get_plain_text, parse_message) is pure
Python with no network call in it - which is why the self-test at the
bottom can check all of it thoroughly without a Gmail account, a browser,
or credentials.json. The functions that DO need a real login
(get_gmail_service, list_unread_messages, apply_label, save_draft) can
only be checked by actually running Build 2 against your own inbox.
"""

import base64
import email.mime.text
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Two scopes, not one. gmail.modify lets us read mail and add/remove
# labels; gmail.compose lets us save draft replies. Neither includes
# gmail.send - this project only ever creates a DRAFT, it never sends
# email by itself. That's a deliberate safety boundary: a bad
# classification can leave the wrong label on a message, but it can
# never mail someone a reply you never saw.
SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

# How many unread emails to pull per run. This is a MONEY decision as
# much as a UX one: main.py calls the AI once per email in this list, so
# max_results scales your credit spend directly. 10 clears a normal
# inbox backlog without one run eating a big slice of your allotment -
# raising this to "all unread" is exactly the kind of change the
# ai-builder-credits cost model warns against.
MAX_RESULTS = 10


def get_gmail_service():
    """
    Logs you in to your own Gmail account and returns a ready-to-use API
    client (Google calls this a "service" object).

    The first time you run this, it opens a browser tab asking you to
    approve access - that's the OAuth consent screen from Build 2's
    setup. After you approve it, your login is cached in token.json so
    you won't be asked again until the token expires or you delete that
    file.
    """
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(
                    "credentials.json not found.\n"
                    "Download it from Google Cloud Console > APIs & Services > "
                    "Credentials (see the README's Build 2 setup), and save it "
                    "in this same folder, next to gmail_client.py."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token_file:
            token_file.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def get_header(headers, name):
    """
    Gmail stores each header (Subject, From, Date, ...) as its own small
    dict inside a list, rather than one dict you could index straight
    into - this walks that list and pulls out the one you asked for.

        get_header(payload["headers"], "Subject")

    Returns "" if the header isn't present, instead of raising, because a
    message with no Subject header is a normal thing some automated mail
    sends - it shouldn't crash triage over one missing header.
    """
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return header.get("value", "")
    return ""


def get_plain_text(payload):
    """
    Digs the readable text out of a Gmail message payload.

    A message with both an HTML and a plain-text version comes back as a
    "multipart" payload, where the text you actually want is buried
    inside payload["parts"] - and sometimes nested two levels deep
    (multipart/mixed containing multipart/alternative, for example, on a
    message with an attachment). This walks that structure recursively
    and returns the first text/plain part it finds.
    """
    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data")
        return _decode_base64url(data) if data else ""

    for part in payload.get("parts", []):
        text = get_plain_text(part)
        if text:
            return text

    return ""


def _decode_base64url(data):
    # Gmail encodes body data as "base64url" (using '-' and '_' in place
    # of the usual '+' and '/') and sometimes hands it back with the
    # trailing '=' padding stripped off. Padding it back out before
    # decoding avoids a binascii.Error: Incorrect padding crash that
    # otherwise looks completely unrelated to what's actually wrong.
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded).decode("utf-8", errors="replace")


def parse_message(message):
    """
    Turns one raw Gmail API message dict into the simple shape the rest
    of this project uses everywhere:

        {"id": "...", "sender": "...", "subject": "...", "body": "..."}

    Keeping this conversion in one place means classifier.py and main.py
    never have to know what Gmail's actual JSON looks like.
    """
    headers = message.get("payload", {}).get("headers", [])
    body = get_plain_text(message.get("payload", {}))

    return {
        "id": message.get("id", ""),
        "sender": get_header(headers, "From"),
        "subject": get_header(headers, "Subject") or "(no subject)",
        "body": body.strip(),
    }


def list_unread_messages(service, max_results=MAX_RESULTS):
    """
    Fetches your most recent unread inbox messages, already converted to
    the simple dict shape from parse_message().

    This makes two kinds of Gmail API call per message: one to list
    message IDs, then one per ID to fetch the full message. That's how
    Gmail's API works - the list endpoint deliberately returns only IDs,
    to keep a mailbox-wide search cheap even when you don't need every
    message's full contents.
    """
    response = (
        service.users()
        .messages()
        .list(userId="me", labelIds=["UNREAD", "INBOX"], maxResults=max_results)
        .execute()
    )

    messages = []
    for item in response.get("messages", []):
        full = (
            service.users()
            .messages()
            .get(userId="me", id=item["id"], format="full")
            .execute()
        )
        messages.append(parse_message(full))

    return messages


def get_or_create_label(service, name):
    """
    Finds the Gmail label ID for `name`, creating the label if it doesn't
    exist yet. Gmail's API identifies labels by an opaque ID everywhere
    except this one lookup-by-name call - so every other function in
    this project can just say "URGENT" instead of juggling IDs.
    """
    existing = service.users().labels().list(userId="me").execute()
    for label in existing.get("labels", []):
        if label["name"] == name:
            return label["id"]

    created = (
        service.users()
        .labels()
        .create(
            userId="me",
            body={
                "name": name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show",
            },
        )
        .execute()
    )
    return created["id"]


def apply_label(service, message_id, label_name):
    """
    Applies a label to a message and removes UNREAD, so a triaged message
    stops showing up as unread once it's been through this pipeline.
    """
    label_id = get_or_create_label(service, label_name)
    service.users().messages().modify(
        userId="me",
        id=message_id,
        body={"addLabelIds": [label_id], "removeLabelIds": ["UNREAD"]},
    ).execute()


def save_draft(service, message_id, sender, reply_text):
    """
    Saves an AI-written reply as a Gmail DRAFT addressed to the sender -
    it never sends anything. You read and send every draft yourself.
    `message_id` isn't used by the Gmail API call itself, but it's kept
    in the signature so main.py's call reads clearly next to apply_label.
    """
    mime_message = email.mime.text.MIMEText(reply_text)
    mime_message["to"] = sender
    raw = base64.urlsafe_b64encode(mime_message.as_bytes()).decode()

    service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no Gmail
    # account, browser, or credentials.json needed:  python gmail_client.py
    fake_message = {
        "id": "18abc123",
        "payload": {
            "mimeType": "multipart/alternative",
            "headers": [
                {"name": "From", "value": "boss@example.com"},
                {"name": "Subject", "value": "Server is down"},
            ],
            "parts": [
                {
                    "mimeType": "text/plain",
                    "body": {
                        "data": base64.urlsafe_b64encode(
                            b"Please call me ASAP, prod is down."
                        ).decode()
                    },
                },
                {
                    "mimeType": "text/html",
                    "body": {
                        "data": base64.urlsafe_b64encode(
                            b"<p>Please call me ASAP, prod is down.</p>"
                        ).decode()
                    },
                },
            ],
        },
    }

    parsed = parse_message(fake_message)
    print("Parsed a fake multipart message:")
    print(parsed)
    assert parsed["sender"] == "boss@example.com"
    assert parsed["subject"] == "Server is down"
    assert "ASAP" in parsed["body"]

    # A message missing its Subject header entirely - real automated mail
    # does this. Must not crash.
    no_subject = {
        "payload": {
            "mimeType": "text/plain",
            "headers": [{"name": "From", "value": "a@b.com"}],
            "body": {"data": base64.urlsafe_b64encode(b"hi").decode()},
        }
    }
    assert parse_message(no_subject)["subject"] == "(no subject)"
    print("\nMessage with no Subject header correctly defaulted to '(no subject)'.")

    # Gmail sometimes strips the '=' padding base64 normally requires.
    # Confirm _decode_base64url() copes with that, not just with the
    # neatly-padded strings base64.urlsafe_b64encode() always produces.
    unpadded = base64.urlsafe_b64encode(b"stripped padding test").decode().rstrip("=")
    assert _decode_base64url(unpadded) == "stripped padding test"
    print("Un-padded base64 (Gmail's real quirk) decoded correctly.")

    print("\nAll parsing checks passed. Real Gmail API responses have this exact shape.")
