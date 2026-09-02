"""
Step 3 of the Slack Morning Briefing Bot - the entrypoint that ties
everything together and actually runs every morning.

Run it once, right now, to check everything works:
    python main.py

Run it forever, sending itself at 08:00 every day:
    python main.py --schedule

Or skip the `schedule` package entirely and let your OS handle the timing -
see the README for the crontab (Mac/Linux) and Task Scheduler (Windows)
equivalents. Both approaches call the same run_briefing() function; only
who presses the button (this file, or your OS) is different.
"""

import os
import sys
import time
from datetime import datetime

import schedule
from dotenv import load_dotenv
from slack_sdk import WebClient

from sdt_ai import AIError
from slack_client import fetch_channel_history, filter_and_format_messages, post_dm
from summarizer import format_dm_text, summarize_briefing

load_dotenv()

# Fill these in with your own channel IDs before running this for real -
# right-click a channel name in Slack > View channel details > scroll to
# the bottom.
#
# Keep this list to 2-3 channels, not "every channel I'm in": each channel
# adds to the character count summarizer.py sends to the AI (a cost you pay
# every single morning, 365 mornings a year), and a briefing that digests
# ten channels stops being something you actually read before coffee.
CHANNEL_IDS = [
    # "C0123456789",  # e.g. #general
    # "C9876543210",  # e.g. #eng-team
]


def run_briefing():
    """
    Fetches, summarizes, and DMs one briefing. This is the whole program -
    everything else in this file is either scheduling this function or
    reading its own .env / CHANNEL_IDS setup.

    Every failure path here prints a plain-English reason and returns
    instead of raising, on purpose: this is meant to run unattended inside
    cron or Task Scheduler, where an uncaught exception just looks like
    "nothing happened" in a log nobody reads until the DM doesn't arrive.
    """
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    user_id = os.environ.get("SLACK_USER_ID")

    if not bot_token or not user_id:
        print(
            "Missing SLACK_BOT_TOKEN or SLACK_USER_ID.\n"
            "Copy .env.example to .env, uncomment those two lines, and fill "
            "them in - see README.md for where to find each value."
        )
        return

    if not CHANNEL_IDS:
        print("CHANNEL_IDS is empty. Add at least one channel ID near the top of main.py.")
        return

    client = WebClient(token=bot_token)

    channel_texts = []
    for channel_id in CHANNEL_IDS:
        try:
            info = client.conversations_info(channel=channel_id)
            channel_name = info["channel"]["name"]
        except Exception:
            # A bad or renamed channel ID shouldn't take the whole briefing
            # down - fall back to the raw ID so the summary still labels
            # this channel's messages with something, and keep going.
            channel_name = channel_id

        try:
            raw_messages = fetch_channel_history(client, channel_id, hours=24)
        except ValueError as problem:
            print(f"Skipping #{channel_name}: {problem}")
            continue

        formatted = filter_and_format_messages(raw_messages, channel_name)
        if formatted:
            channel_texts.append(formatted)
        else:
            print(f"#{channel_name} had nothing worth reporting in the last 24h.")

    try:
        sections = summarize_briefing(channel_texts)
    except (ValueError, AIError) as problem:
        print(f"Briefing not sent: {problem}")
        return

    today = datetime.now().strftime("%A, %B %d")
    text = format_dm_text(sections, f"\U0001F305 Morning Briefing — {today}")

    try:
        post_dm(client, user_id, text)
    except ValueError as problem:
        print(f"Could not deliver the briefing: {problem}")
        return

    print("Briefing sent!")


if __name__ == "__main__":
    if "--schedule" in sys.argv:
        # The `schedule` package keeps this process running and calls
        # run_briefing() every day at 08:00 in your machine's local time.
        # This only works while the process itself stays alive - if your
        # laptop sleeps or you close the terminal, nothing runs. Cron /
        # Task Scheduler (see README) survive both; this is the quick way
        # to test the daily timing without setting either up first.
        schedule.every().day.at("08:00").do(run_briefing)
        print("Scheduled for 08:00 daily. Leave this running... (Ctrl+C to stop)")
        while True:
            schedule.run_pending()
            time.sleep(30)
    else:
        # No flag: run the briefing once, immediately. This is how you
        # test the whole pipeline before trusting it to a schedule you
        # won't be watching.
        run_briefing()
