# Financial Reporting Agent — starter project

Build a tool that turns a raw transactions CSV into a real monthly
report: computed metrics, charts, AI commentary grounded only in the
real numbers, anomaly detection, and a finished PDF.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Export your real transactions to a CSV and note its actual column names
5. `python main.py your_transactions.csv`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `ingest.py` | Reads your CSV and renames columns to what the rest of the pipeline expects. **Edit `COLUMN_MAP` here for your own export format.** |
| `clean.py` | Drops duplicate transactions and normalizes category names. |
| `metrics.py` | Computes revenue, burn rate, and runway from the cleaned data. |
| `charts.py` | Renders a revenue trend chart and an expense breakdown pie chart. |
| `commentary.py` | The core prompt: writes commentary grounded only in the real computed numbers, with a guard against inventing figures. |
| `anomalies.py` | Flags transactions that are statistical outliers within their category. |
| `pdf_report.py` | Assembles the charts, metrics, and commentary into a finished PDF. |
| `main.py` | Wires the whole pipeline into one command. |
