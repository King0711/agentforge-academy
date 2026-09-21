# HR Recruitment Screening Agent — starter project

Build a tool that scores CVs against a job description, extracts
contact info, logs candidates to Airtable, and can re-run scoring with
names and schools redacted to check your own screening for bias.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Add your Airtable token and base ID to `.env`
5. Create `jd.txt` with the role you're hiring for, and put 3-5 sample CV PDFs in a `cvs/` folder
6. `python batch.py`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `cv_reader.py` | Extracts plain text from a CV PDF. |
| `score.py` | The core prompt: scores a CV against the job description. **Edit this one.** |
| `extract_contact.py` | Pulls name, email, and phone from the CV text. |
| `airtable_write.py` | Logs each scored candidate to your Airtable base. |
| `batch.py` | Runs scoring across every CV in `cvs/`. |
| `blind_review.py` | Redacts names, graduation years, and school mentions before re-scoring, so you can compare scores with and without that context. |
