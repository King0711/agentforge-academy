"""
Step 1 of the Calendar & Task Prioritizer Agent.

Logs into Google Calendar and turns its raw JSON reply into the small,
clean list of dicts the rest of this project works with.
"""

import datetime
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Read-only is the correct scope here. This project only ever reads your
# calendar to build a plan - it never creates, edits or deletes an event.
# Asking for the narrowest scope that does the job is good practice, and
# it also means the Google consent screen shows a shorter, less alarming
# permission list to whoever approves it (you, or a test user you add).
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"


def get_calendar_service():
    """
    Returns an authenticated Google Calendar API client.

    The first time you run this, a browser tab opens asking you to log in
    and approve access - that's the OAuth "consent screen". Approve it and
    a token.json file is written next to this one, so every run after that
    is silent. Delete token.json if you ever need to log in again (e.g. you
    revoked access, or you want to switch Google accounts).
    """
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # Tokens expire after about an hour. Refreshing silently with the
    # long-lived refresh token is much less annoying than re-opening a
    # browser tab to log in again every time you run this.
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    elif not creds or not creds.valid:
        if not os.path.exists(CREDENTIALS_FILE):
            raise FileNotFoundError(
                f"Missing {CREDENTIALS_FILE}.\n"
                "Download it from Google Cloud Console (see README Build 2) "
                "and put it in this same folder, then run this again."
            )
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)


def fetch_todays_events(service, calendar_id="primary"):
    """
    Asks Google for today's raw events.

    Deliberately split from get_today_events() below so the parsing logic
    (parse_events, further down) can be unit-tested against a realistic
    fake response dict without ever touching the network or needing a
    real Google account - which matters because this course can't assume
    every student has one, or that a live OAuth flow can be verified from
    an automated test.
    """
    today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    return service.events().list(
        calendarId=calendar_id,
        timeMin=today_start.isoformat() + "Z",
        timeMax=today_end.isoformat() + "Z",
        singleEvents=True,
        orderBy="startTime",
    ).execute()


def _clock_time(when):
    """
    Pulls just the HH:MM out of a Calendar API dateTime string, dropping
    the date and timezone offset - the prompt only needs to know when in
    the day something happens, not a full ISO timestamp.

        "2026-09-02T09:00:00+01:00" -> "09:00"
    """
    raw = when.get("dateTime", "")
    return raw[11:16] if len(raw) >= 16 else raw


def parse_events(response):
    """
    Turns Google's raw Calendar API response into the small, clean shape
    the rest of this project uses:

        [{"summary": "Standup", "start": "09:00", "end": "09:15", "all_day": False}, ...]

    Google represents two different kinds of events with two different
    keys, and this is the one place that deals with the difference:

    - Timed events:   start = {"dateTime": "2026-09-02T09:00:00+01:00"}
    - All-day events: start = {"date": "2026-09-02"}                <- no time at all!

    Skip that distinction and an all-day event crashes the whole run with
    a KeyError the first time your calendar has one - which, for most
    people, is more often than you'd think (birthdays, holidays, and
    "deadline" reminders people put on the calendar as all-day entries).
    """
    events = []
    for item in response.get("items", []):
        start = item.get("start", {})
        end = item.get("end", {})
        is_all_day = "dateTime" not in start

        events.append({
            "summary": item.get("summary", "(no title)"),
            "start": "all day" if is_all_day else _clock_time(start),
            "end": "all day" if is_all_day else _clock_time(end),
            "all_day": is_all_day,
        })
    return events


def get_today_events(calendar_id="primary"):
    """
    The one function main.py actually calls: authenticate, fetch, parse.

        events = get_today_events()
    """
    service = get_calendar_service()
    response = fetch_todays_events(service, calendar_id)
    return parse_events(response)


if __name__ == "__main__":
    # Run this file on its own to check the parsing logic works - no live
    # Google account, browser login or network access required:
    #     python calendar_client.py
    #
    # This is a realistic shape for what the Calendar API actually
    # returns (see https://developers.google.com/calendar/api/v3/reference/events/list),
    # not a simplified stand-in for it.
    fake_response = {
        "items": [
            {
                "summary": "Team standup",
                "start": {"dateTime": "2026-09-02T09:00:00+01:00"},
                "end": {"dateTime": "2026-09-02T09:15:00+01:00"},
            },
            {
                "summary": "Company holiday",
                "start": {"date": "2026-09-02"},
                "end": {"date": "2026-09-03"},
            },
            {
                "summary": "Client call",
                "start": {"dateTime": "2026-09-02T14:30:00+01:00"},
                "end": {"dateTime": "2026-09-02T15:00:00+01:00"},
            },
        ]
    }

    result = parse_events(fake_response)
    print(f"Parsed {len(result)} events:\n")
    for event in result:
        when = "all day" if event["all_day"] else f"{event['start']}-{event['end']}"
        print(f"  {when:>14}  {event['summary']}")

    assert len(result) == 3
    assert result[0]["start"] == "09:00" and result[0]["end"] == "09:15"
    assert result[1]["all_day"] is True and result[1]["start"] == "all day"
    assert result[2]["summary"] == "Client call" and result[2]["all_day"] is False

    # An empty calendar day is a real case (weekends, holidays) and must
    # not crash - it should just produce an empty list.
    assert parse_events({"items": []}) == []
    assert parse_events({}) == []

    print("\nAll checks passed.")
