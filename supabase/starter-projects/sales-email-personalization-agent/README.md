# Sales Email Personalization Agent — starter project

Build a tool that enriches a lead with real company intelligence,
writes a genuinely personalized cold email (with a guard against
generic openers), and builds out a multi-day follow-up sequence.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your free Hunter.io and Tavily keys to `.env`
5. `python main.py "First Last" "Company Name" companydomain.com`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `enrich.py` | Searches for real, recent facts about the lead's company. |
| `hunter.py` | Verifies the lead's email address before you ever send to it. |
| `intelligence.py` | The core prompt: turns raw search results into structured company intelligence. |
| `mapping.py` | Maps a company's likely challenges to your own value propositions. **Edit this one.** |
| `write_email.py` | Writes the personalized email, with a guard against generic "I hope this finds you well" openers. |
| `subjects.py` | Generates and length-checks subject line options. |
| `sequence.py` | Builds a multi-day follow-up sequence from the first email. |
| `crm_export.py` | Formats the sequence for import into your CRM's sequencing tool. |
| `main.py` | Wires the whole pipeline into one command. |
