# CRM Lead Follow-Up Agent — starter project

Build a tool that reads deals sitting quietly in HubSpot, writes a
personalized follow-up drawing on their real notes, drafts it in Gmail
for you to review, and pings Slack when drafts are ready.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your HubSpot Private App token to `.env`
5. Follow the Google Cloud steps in the session guide to get `credentials.json`, then run `python main.py`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `hubspot_client.py` | Fetches stale deals and their notes from HubSpot. |
| `enrich.py` | Parses HubSpot's note objects into a clean list of recent activity. |
| `writer.py` | The core prompt: writes a follow-up grounded only in real notes, with a guard against inventing history and a banned-topic check. **Edit this one.** |
| `gmail_draft.py` | Logs in to Gmail and saves the follow-up as a draft. |
| `seen_tracker.py` | Remembers which deals already got a follow-up, so re-runs don't duplicate. |
| `notify.py` | Pings a Slack webhook when drafts are ready. |
| `main.py` | Wires fetch → enrich → write → draft → notify into one run. |
