# Social Media Post Generator — starter project

Build a tool that turns any article into five ready-to-post social updates.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Get a free key at https://aistudio.google.com/apikey and paste it into `.env`
4. `streamlit run app.py`

No paid subscription is needed - just a free Gemini API key from Google AI
Studio.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `article.py` | Gets the readable text out of a web page. |
| `generator.py` | Turns article text into five posts. **Edit this one.** |
| `app.py` | The screen you click on. |
