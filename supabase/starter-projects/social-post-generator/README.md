# Social Media Post Generator — starter project

Build a tool that turns any article into five ready-to-post social updates.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. `streamlit run app.py`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `article.py` | Gets the readable text out of a web page. |
| `generator.py` | Turns article text into five posts. **Edit this one.** |
| `app.py` | The screen you click on. |
