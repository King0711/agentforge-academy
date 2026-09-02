# Slack Morning Briefing Bot — starter project

Build a bot that reads your busiest Slack channels overnight and DMs you a
prioritized briefing every morning: what needs a decision today, and what's
just useful to know.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. Create a Slack app (see below) and add its bot token + your user ID to
   the same `.env` file
5. Add your channel IDs to `CHANNEL_IDS` near the top of `main.py`
6. `python main.py`

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

### Creating your Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
   Name it (e.g. "Morning Briefing Bot") and pick your workspace.
2. Go to **OAuth & Permissions** → **Scopes** → **Bot Token Scopes** and add:
   `channels:history`, `chat:write`, `users:read`, `im:write`.
3. Click **Install to Workspace**, then copy the **Bot User OAuth Token**
   (starts with `xoxb-`) into `.env` as `SLACK_BOT_TOKEN`.
4. In each channel you want summarized, type `/invite @YourBotName` -
   without this, `slack_client.py` gets a `not_in_channel` error for that
   channel (see Troubleshooting in the course guide).
5. Find your own Slack user ID: click your profile photo → **Copy member ID**
   (starts with `U`). Put that in `.env` as `SLACK_USER_ID` - this is who the
   briefing gets DMed to.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `slack_client.py` | Fetches channel history from Slack and posts the DM. |
| `summarizer.py` | Turns raw messages into a prioritized briefing. **Edit this one.** |
| `main.py` | Ties it together, and runs on a schedule. |

## Running it every morning

`python main.py --schedule` works, but only while that process stays
running on a machine that's on. For something that survives a reboot:

- **Mac/Linux (cron):** `crontab -e`, then add a line like
  `0 8 * * * /full/path/to/.venv/bin/python /full/path/to/main.py` -
  use the full path to your virtual environment's Python, not just `python`.
- **Windows (Task Scheduler):** create a Basic Task, trigger "Daily" at
  8:00 AM, action "Start a program", pointing at your `.venv\Scripts\python.exe`
  with `main.py`'s full path as the argument.

Either way, run the exact command by hand first and confirm it sends a DM
before you schedule it - a typo in a cron line fails silently at 8am with
nobody watching.
