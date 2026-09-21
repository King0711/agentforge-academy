"""
Step 4 of the CRM Lead Follow-Up Agent (part 2) - saves a generated
follow-up as a Gmail draft.

Uses the exact same OAuth pattern as the Gmail AI Triage Agent from
Builder 1 (gmail.compose scope only - this can create drafts, never
send mail on its own). If you already have a token.json from that
project with gmail.compose access, you can reuse it here.
"""

import base64
import email.mime.text
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]
TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"


def get_gmail_service():
    """
    Logs you in to your own Gmail account and returns a ready-to-use API
    client. See the Gmail AI Triage Agent (Builder 1) for the full setup
    walkthrough if this is your first time - same pattern, narrower scope.
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
                    "credentials.json not found. Download it from Google Cloud "
                    "Console > APIs & Services > Credentials, and save it in "
                    "this same folder."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token_file:
            token_file.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def save_gmail_draft(service, to_email, subject, body):
    """
    Saves body as a Gmail DRAFT addressed to to_email. Never sends
    anything - same safety boundary as the Gmail Triage Agent: a bad
    follow-up can leave the wrong draft sitting in Drafts, but it can
    never mail someone without a human reading it first.
    """
    mime_message = email.mime.text.MIMEText(body)
    mime_message["to"] = to_email
    mime_message["subject"] = subject
    raw = base64.urlsafe_b64encode(mime_message.as_bytes()).decode()

    service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()


if __name__ == "__main__":
    print("This file only wraps live Gmail API calls - there's no offline")
    print("self-test to run here. It's exercised for real in Build 4's main.py.")
