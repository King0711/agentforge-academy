# Lead Capture & Qualifier Bot — starter project

Build a webhook that receives new Typeform submissions, scores each
lead with AI against your Ideal Customer Profile, and automatically
creates a qualified contact (with a follow-up task) in HubSpot.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Test the wiring: `python main.py` — this costs no credits and needs no HubSpot account yet
5. Once you've created a HubSpot Private App token (see Build 3) and added it to `.env`, run the real server: `flask --app main run --port 5000`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `webhook.py` | Turns a raw Typeform webhook payload into a simple lead dict. |
| `scorer.py` | Scores a lead against your ICP and gets a one-line reason from the AI. **Edit this one.** |
| `hubspot_client.py` | Builds and sends the HubSpot contact + follow-up task. |
| `main.py` | Wires webhook → score → HubSpot together. Run this to test, or serve it with Flask. |
