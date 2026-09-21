# Competitor Intelligence Monitor — starter project

Build a tool that checks a list of competitors' sites, news, and job
postings on a schedule, has the AI decide what actually changed and
why it matters, and emails you a weekly briefing.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your free Tavily key and your email app password to `.env`
5. Edit `competitors.json` with the companies you actually want to track
6. `python main.py`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `competitors.json` | The list of competitors you're tracking. **Edit this one.** |
| `scrape.py` | Fetches each competitor's homepage and searches for recent news. |
| `jobs.py` | Pulls and cleans a competitor's job postings, a strong signal of what they're building next. |
| `analyze.py` | The core prompt: decides what changed and how significant it is, with an UNCLEAR fallback instead of a guessed severity. |
| `briefing.py` | Turns the week's analyses into one readable briefing. |
| `email_format.py` | Converts the briefing to HTML for email. |
| `main.py` | Wires scrape → analyze → brief → email into one weekly run. |
