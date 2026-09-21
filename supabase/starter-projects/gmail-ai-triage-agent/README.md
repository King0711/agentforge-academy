# Gmail AI Triage Agent — starter project

Build a tool that reads your unread Gmail, decides what's actually
urgent, labels every message automatically, and drafts a reply for
anything that needs one.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Follow the Google Cloud steps in Build 2 of the session guide to get
   `credentials.json`, then run `python gmail_client.py` once on its own
   to check the parsing (no Google account needed for that part)
5. `python main.py` to triage your real inbox

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

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
they only grant access to your Gmail account, not your AI key.
