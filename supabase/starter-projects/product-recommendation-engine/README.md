# Product Recommendation Engine — starter project

Build a tool that segments customers from their purchase history,
recommends a next product grounded only in your real catalog (never a
product that doesn't exist), and runs the whole thing as a batch with
confidence filtering and A/B tracking.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Edit `catalog.json` with your own 6-8 real products
5. Bring your own `customers.csv` (customer_id, past_purchases, industry, company_size)
6. `python main.py customers.csv`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `load.py` | Reads your customers CSV. |
| `segment.py` | Buckets each customer by spend and engagement. |
| `catalog.json` | Your real product catalog. **Edit this one.** |
| `catalog.py` | Loads the catalog and exposes the set of real SKUs, used to catch a hallucinated recommendation. |
| `recommend.py` | The core prompt: recommends a product grounded only in real SKUs. |
| `filter.py` | Drops any recommendation below your confidence threshold. |
| `batch.py` | Runs recommendations across your full customer file. |
| `crm_push.py` | Writes a recommendation as a note on a CRM contact record. |
| `ab_test.py` | Splits customers into test groups and tags each with a campaign ID. |
| `main.py` | Wires the whole pipeline into one command. |
