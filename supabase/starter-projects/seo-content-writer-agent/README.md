# SEO Content Writer Agent — starter project

Build a tool that pulls real keyword data and the current top-10
ranking pages, scrapes them to find what they're missing, then writes
a full outlined article that fills those gaps, complete with SEO
metadata.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your DataForSEO credentials to `.env` (pay-as-you-go - watch your usage)
5. `python main.py "your target keyword"`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `keywords.py` | Pulls search volume and difficulty for your target keyword. |
| `serp.py` | Pulls the current top-10 ranking pages for that keyword. |
| `scraper.py` | Fetches and cleans the full text of each competing page. |
| `gap_analysis.py` | The core prompt: finds what the top-ranking pages are missing. **Edit this one.** |
| `outline.py` | Turns the gaps into a structured article outline. |
| `write_sections.py` | Writes each section, aware of what came before so it doesn't repeat itself. |
| `meta.py` | Generates a title tag, meta description, and slug. |
| `export.py` | Writes the finished article to a Markdown file. |
| `main.py` | Wires the whole pipeline into one command. |
