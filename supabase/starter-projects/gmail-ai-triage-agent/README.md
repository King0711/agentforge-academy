# Gmail AI Triage Agent — starter project

Build a tool that reads your unread Gmail, decides what's actually
urgent, labels every message automatically, and drafts a reply for
anything that needs one.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Get a free key at https://aistudio.google.com/apikey and paste it into `.env`
4. Follow the Google Cloud steps in Build 2 of the session guide to get
   `credentials.json`, then run `python gmail_client.py` once on its own
   to check the parsing (no Google account needed for that part)
5. `python main.py` to triage your real inbox

No paid subscription is needed - just a free Gemini API key from Google AI
Studio.

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

Both live next to `gmail_client.py`. Neither is a Gemini API key —
they only grant access to your Gmail account, not your credits.
