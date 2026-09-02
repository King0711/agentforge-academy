"""
Step 1 of the Slack Morning Briefing Bot.

This file talks to Slack: pulling the last 24 hours of messages out of a
channel, and posting the finished briefing back as a DM.

Slack's history endpoint hands back everything - join notices, bot
messages, edited-to-empty messages, thread replies mixed with top-level
ones - not just the conversation a human would read. The two jobs below
are split on purpose: fetch_channel_history() needs a real bot token and
a live workspace, so it can't be checked here. filter_and_format_messages()
is pure - no network, no token - so it's the one this file's self-test
below actually exercises against realistic fake data.
"""

import time

from slack_sdk.errors import SlackApiError

# Slack timestamps ("ts") are UNIX seconds as a string, e.g. "1699999999.000100".
SECONDS_PER_DAY = 24 * 60 * 60


def fetch_channel_history(client, channel_id, hours=24):
    """
    Downloads raw messages from one Slack channel over the last `hours` hours.

    Returns the raw list of message dicts exactly as Slack sends them - see
    https://api.slack.com/methods/conversations.history for the shape.
    Requires a real bot token, so this function isn't part of the self-test
    at the bottom of this file; filter_and_format_messages() is, since
    that's where the logic actually worth testing lives.
    """
    oldest = str(time.time() - hours * SECONDS_PER_DAY)
    messages = []
    cursor = None

    # Slack paginates at 100 messages per page by default. A channel busier
    # than that in 24h needs this cursor loop - skip it and you silently
    # drop everything past the first page, which looks like "it works" in
    # a quiet test channel and then quietly under-reports in a real one.
    while True:
        try:
            response = client.conversations_history(
                channel=channel_id,
                oldest=oldest,
                cursor=cursor,
                limit=200,
            )
        except SlackApiError as error:
            raise ValueError(
                f"Could not read that channel: {error.response['error']}.\n"
                f"Most common cause: the bot hasn't been invited to it yet - "
                f"type /invite @YourBotName in that channel."
            )

        messages.extend(response["messages"])
        cursor = response.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break

    return messages


def filter_and_format_messages(raw_messages, channel_name):
    """
    Turns Slack's raw message list into clean "user: text" lines, oldest
    first, or None if there was nothing worth reporting.

        text = filter_and_format_messages(raw_messages, "general")

    This drops the noise Slack mixes into channel history - join/leave
    notices, topic changes, bot messages, messages edited down to nothing -
    so you aren't paying AI credits to have the model read and discard it
    for you. Real human messages have no "subtype" key at all; every kind
    of noise Slack injects does.
    """
    lines = []
    for msg in raw_messages:
        if msg.get("subtype") is not None:
            continue
        text = msg.get("text", "").strip()
        if not text:
            continue
        user = msg.get("user", "someone")
        lines.append(f"{user}: {text}")

    # Slack returns newest message first. Flip the order so the AI reads
    # the conversation the way it actually happened - it matters for
    # telling "this got decided" apart from "this is still open", which is
    # exactly the judgment call the briefing is supposed to make for you.
    lines.reverse()

    if not lines:
        return None

    return f"--- #{channel_name} ---\n" + "\n".join(lines)


def post_dm(client, user_id, text):
    """
    Sends `text` as a DM to `user_id`.

    Slack's chat.postMessage needs a conversation ID, not a user ID -
    conversations_open() finds (or silently creates, if this is the very
    first message) the DM channel between the bot and that person.
    """
    try:
        dm = client.conversations_open(users=[user_id])
        channel_id = dm["channel"]["id"]
        client.chat_postMessage(channel=channel_id, text=text)
    except SlackApiError as error:
        raise ValueError(f"Could not send the DM: {error.response['error']}")


if __name__ == "__main__":
    # Run this file on its own to check the filtering logic:
    #     python slack_client.py
    # This shape matches a real conversations.history response - see
    # https://api.slack.com/methods/conversations.history#examples
    fake_response = {
        "ok": True,
        "messages": [
            {"user": "U123", "text": "Ready for the 10am?", "ts": "1699999999.000100"},
            {"user": "U456", "text": "", "ts": "1699999998.000100"},
            {
                "type": "message",
                "subtype": "channel_join",
                "user": "U789",
                "text": "<@U789> has joined the channel",
                "ts": "1699999997.000100",
            },
            {"user": "U123", "text": "Yep, see you there", "ts": "1699999996.000100"},
        ],
    }

    formatted = filter_and_format_messages(fake_response["messages"], "general")
    print("Normal channel history:\n")
    print(formatted)

    assert formatted is not None
    assert "has joined the channel" not in formatted, "join notices should be dropped"
    assert formatted.index("Yep, see you there") < formatted.index("Ready for the 10am?"), (
        "messages should end up oldest-first"
    )

    # Break it on purpose: an empty channel (nobody posted in 24h, or every
    # message in the window was noise). This is the exact input a quiet
    # Slack channel produces on a Sunday morning - it must return None
    # cleanly, not raise, so main.py can skip the channel instead of crashing
    # the whole scheduled run over one quiet channel.
    empty = filter_and_format_messages([], "quiet-channel")
    print("\nEmpty channel history:", empty)
    assert empty is None

    noise_only = filter_and_format_messages(
        [{"type": "message", "subtype": "channel_join", "user": "U1", "text": "joined", "ts": "1"}],
        "quiet-channel",
    )
    assert noise_only is None, "a channel with only noise should also come back as None"

    print("\nAll slack_client.py self-tests passed.")
