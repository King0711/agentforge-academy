# Web Research Agent — starter project

Build a tool that runs AI-optimized searches on a topic, scrapes full
page content for thin sources, and synthesizes everything into a
structured, cited research brief — then runs one follow-up round to
fill gaps in the first draft.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your free Tavily key to `.env` too (tavily.com - 1,000 searches/month free)
5. `python main.py "your research topic"`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `search.py` | Runs a Tavily search and parses the raw results. |
| `scraper.py` | Fetches and cleans full-page text for sources whose search snippet is too thin. |
| `synthesize.py` | The core prompt: turns sources into a structured brief, with a citation guard that strips any `[Source N]` the AI wasn't actually given. |
| `citations.py` | Builds the numbered reference list from the sources actually used. |
| `report.py` | Renders the brief to Markdown and saves it. |
| `followup.py` | Reads the first draft, decides what's still missing, and runs one more search round to fill it. |
| `main.py` | Wires search → scrape → synthesize → follow-up → report into one command. **Edit this one to change the pipeline.** |
| `challenge.py` | A deliberately under-sourced scenario for proving the citation guard catches an invented source. |
