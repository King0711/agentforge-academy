# Gmail AI Triage Agent — starter project

Build a tool that reads your unread Gmail, decides what's actually
urgent, labels every message automatically, and drafts a reply for
anything that needs one.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. Follow the Google Cloud steps in Build 2 of the session guide to get
   `credentials.json`, then run `python gmail_client.py` once on its own
   to check the parsing (no Google account needed for that part)
5. `python main.py` to triage your real inbox

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `gmail_client.py` | Logs in to Gmail, fetches unread messages, applies labels, saves drafts. |
| `classifier.py` | Turns one email into a priority, a reason, and an optional reply. **Edit this one.** |
| `main.py` | Wires fetch → classify → label → draft into one run. |

## Files this project creates but you never edit by hand

| File | Where it comes from |
|------|----------------------|
| `credentials.json` | Downloaded from Google Cloud Console (Build 2) |
| `token.json` | Created automatically the first time you log in |

Both live next to `gmail_client.py`. Neither is an AI Builder credential —
they only grant access to your Gmail account, not your credits.
