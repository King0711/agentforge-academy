# Document Summarizer Agent — starter project

Build a tool that takes any PDF, Word doc, text file, or web link and
returns key points, action items, and a one-paragraph executive brief.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. `python main.py path/to/your/document.pdf`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `detector.py` | Works out if a source is .txt, .pdf, .docx, or a web link, and pulls the plain text out of it. |
| `summarizer.py` | Turns document text into key points, action items, and a brief. **Edit this one.** |
| `main.py` | The command you run. |

## Testing dependency note

`fpdf2` in `requirements.txt` is **test-only** — it's what `detector.py`'s
self-test uses to generate a real PDF to read back, so the PDF-extraction
path is checked against an actual file instead of just reading the code.
The app itself never writes PDFs, only reads them, so if you're just
running `main.py` on your own documents you can skip installing it.
