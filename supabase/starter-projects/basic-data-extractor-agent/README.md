# Basic Data Extractor Agent — starter project

Build a tool that reads messy, real-world text — a business card blurb, an
email signature, a listing, a job posting — and pulls out a clean set of
fields (name, email, phone, date, amount) into a CSV you could open
straight in Excel.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. `python main.py`

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `extractor.py` | Builds the extraction prompt and parses the AI's reply. **Edit this one.** |
| `csv_writer.py` | Turns extracted records into `output.csv` with pandas. No AI involved — fully testable on its own. |
| `main.py` | Loops over `sample_data/`, extracts every file, writes the CSV. |
| `sample_data/` | Five real, varied text samples to extract from and test against. |
