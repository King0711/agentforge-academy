# Meeting Notes Formatter Agent — starter project

Build a tool that turns a raw meeting transcript into clean, structured
minutes — decisions, action items with owners and deadlines, and a
short summary.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Get a free key at https://aistudio.google.com/apikey and paste it into `.env`
4. `python main.py sample_transcript.txt`

No paid subscription is needed - just a free Gemini API key from Google AI
Studio.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `notes.py` | Reads the raw transcript from a file, or from stdin. |
| `formatter.py` | Turns transcript text into decisions, action items and a summary. **Edit this one.** |
| `output.py` | Renders the result as Markdown and saves it to a file. |
| `main.py` | The command you actually run. |
| `sample_transcript.txt` | A realistic, messy meeting transcript to test with. |
