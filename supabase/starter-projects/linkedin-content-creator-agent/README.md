# LinkedIn Content Creator Agent — starter project

Build a tool that turns a few rough notes about your week into five
different LinkedIn post types written in your own voice, with a cliché
guard that flags generic AI-sounding phrases before you post them.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Edit `persona.py` — replace the example posts with two of your own real posts
5. `streamlit run app.py`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `persona.py` | Your voice: rules, banned clichés, and real example posts. **Edit this one.** |
| `generator.py` | Turns your notes into five post types, and flags any post that slips in a banned cliché. |
| `app.py` | The Streamlit screen you review and approve posts from. |
| `save_posts.py` | Saves your approved posts as individual text files, ready to copy into a scheduler. |
