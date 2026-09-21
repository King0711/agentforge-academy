# Invoice Processing Agent — starter project

Build a tool that watches a folder for new invoice PDFs, extracts
vendor/amount/due-date with the AI, catches duplicate invoices before
they get paid twice, logs everything to a Google Sheet, and flags
what's overdue.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Create a Google Sheet called "Invoice Tracker" and share it with your service account
5. Put 3-5 sample invoice PDFs in an `invoices/` folder
6. `python main.py` to process what's there, or `python watcher.py` to watch the folder continuously

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `extract.py` | The core prompt: pulls vendor, amount, and due date from an invoice's text. **Edit this one.** |
| `validate.py` | Sanity-checks the AI's extraction (a real date, a plausible amount) before it ever reaches the sheet. |
| `duplicates.py` | Catches the same invoice being logged twice. |
| `sheets.py` | Writes rows to your Google Sheet. |
| `overdue.py` | Flags invoices past their due date. |
| `watcher.py` | Watches `invoices/` for new files and processes them automatically. |
| `main.py` | Runs the full pipeline once over whatever's in `invoices/`. |
| `overdue_check.py` | Standalone: run this on a schedule to check for newly-overdue invoices. |

## Files this project creates but you never edit by hand

| File | Where it comes from |
|------|----------------------|
| `credentials.json` | A Google Cloud service account key, downloaded from Google Cloud Console |

Keep it out of version control the same way you keep `.env` out of it — it grants write access to your real Google Sheet.
