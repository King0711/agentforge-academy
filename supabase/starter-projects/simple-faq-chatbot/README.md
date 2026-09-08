# Simple FAQ Chatbot — starter project

Build a chatbot that answers questions using only a FAQ document you
provide — and admits when it doesn't know, instead of guessing.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. `streamlit run app.py`

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `faq.md` | The knowledge base. Everything the bot can know lives here. **Edit this one first.** |
| `faq.py` | Reads `faq.md` off disk. |
| `chatbot.py` | Builds the prompt and asks the AI. **Edit this one to change how it answers.** |
| `app.py` | The chat screen you click on. |
