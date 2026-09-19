# Price & Competitor Monitor Agent — starter project

Build a tool that watches competitor product pages, notices when a price
or product lineup changes, and writes you a plain-English summary of
what changed.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Get a free key at https://aistudio.google.com/apikey and paste it into `.env`
4. Edit the `TARGETS` list at the top of `main.py` with the pages you
   want to watch and the CSS selectors for their name/price
5. `python main.py`

No paid subscription is needed - just a free Gemini API key from Google AI
Studio.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `scraper.py` | Downloads a product page and pulls out its name + price. |
| `tracker.py` | Compares today's scrape to the last saved snapshot and lists what changed. |
| `alert.py` | Turns a list of changes into a plain-English email summary. **Edit this one** to change the tone or add more detail. |
| `main.py` | Wires the three files together and runs the full check. **Edit this one** to add your own competitor pages. |
