# Contract Clause Extractor — starter project

Build a tool that reads a PDF or DOCX contract, extracts its key
clauses against a 15-item taxonomy, scores overall risk, checks each
clause against your own standard library, and exports a reviewed
Word document — with a quote-verification guard that flags anything
the AI claims is in the contract but isn't.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Edit `standard_library.py` to match your own standard clause language
5. `python main.py your_contract.pdf` (or `.docx`)

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `reader.py` | Extracts plain text from a PDF or DOCX contract. |
| `taxonomy.py` | The 15 clause types this tool looks for. |
| `extract.py` | The core prompt: pulls each clause type from the contract text, with a guard that verifies every quoted extract actually appears in the source. |
| `risk.py` | Rolls up individual clause risk ratings into one overall score. |
| `standard_library.py` | Your own standard clause language, and the check that flags deviations from it. **Edit this one.** |
| `compare.py` | Compares clauses between two contract versions. |
| `export.py` | Exports the full review to a Word document. |
| `main.py` | Wires read → extract → risk → export into one command. |
