# Builder 1 — Week 3

## Triage & Decisioning

*Session guides · No paid AI account required*

---

## About this week

Week 1 moved information. Week 2 reshaped it. **Week 3 makes decisions about it.**

Something arrives — an email, a price change, a new lead. The agent judges it: how urgent, how valuable, how worrying. Then it acts on that judgement without asking you first.

This is where agents stop being useful and start being *trusted*, which is a much higher bar. Every session this week includes a deliberate conversation about what your agent is allowed to do on its own.

| Session | Agent | Time | Main project |
|---|---|---|---|
| 1 | Gmail AI Triage | 75 min | ⭐ Yes |
| 2 | Price & Competitor Monitor | 90 min | No |
| 3 | Lead Capture & Qualifier | 90 min | No |

Completing **Session 1 alone** earns your Week 3 certificate.

**Still free, still no card.** You need the upgraded `llm.py` from Week 2 (the one with `chat_json()`). If `python -c "from llm import chat_json"` errors, go back and get it.

---

## The theme this week: judgement you can inspect

A summarizer that gets something slightly wrong wastes a minute of your time. A triage agent that gets something wrong **buries an urgent email**. The stakes change, and so should your engineering.

Three habits, used in every session below:

**1. Make the agent explain itself.** Never ask only for a label. Ask for the label *and a one-sentence reason*. It costs almost nothing and turns "the AI said LOW" into something you can actually audit. Every schema this week includes a `reason` field.

**2. Draft, don't send.** All three agents this week stop one step short of the irreversible action. Emails become drafts, not sends. Alerts go to you, not to the customer. You can always remove the safety catch later, once you trust it — you cannot un-send.

**3. Watch your volume.** Triage agents run on schedules, over batches, repeatedly. That is the pattern most likely to run into free-tier limits. Each session below tells you where the volume actually is and how to tune it.

---

# Session 1 — Gmail AI Triage Agent

⭐ **Week 3 main project** · 75 minutes · Python · Free tier

## What you will build

An assistant that logs into your Gmail, reads your unread mail, sorts each message into **URGENT / IMPORTANT / LOW** with a reason, applies matching Gmail labels automatically, and writes draft replies to the ones that need them.

## What you need

- Python 3.10+ and your upgraded `llm.py` (with `chat_json()`)
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A Gmail account
- A free Google Cloud account — [console.cloud.google.com](https://console.cloud.google.com)

## By the end of this session

- Connect a Python script to your real Gmail securely via OAuth
- Classify email by priority with an auditable reason attached
- Auto-apply Gmail labels
- Generate draft replies that sit in Drafts until you approve them
- Schedule the whole thing to run on its own

---

### Build 1 — Connect to your Gmail (20 min)

**1. Create the Google Cloud project.** Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project called "SocialDevTech Gmail Agent". Then **APIs & Services → Library**, search for **Gmail API**, and enable it.

**2. Set up OAuth.** Go to **APIs & Services → OAuth consent screen**, choose **External**, fill in an app name, and — this is the step everyone misses — **add your own Gmail address as a Test User**. Without that you will get `Error 403: access_denied` later.

Then **Credentials → Create Credentials → OAuth client ID → Desktop app**. Download the JSON and save it as `credentials.json` in your project folder.

**3. Set up the project.** Copy in `llm.py`, create a `.env` with your `GEMINI_API_KEY` and `LLM_PROVIDER=gemini`, then:

```bash
pip install google-genai groq python-dotenv google-auth google-auth-oauthlib google-api-python-client schedule
python llm.py
```

> ✅ **Check your work:** `Provider: gemini` and a five-word greeting.

**4. Paste this into your free AI assistant:**

```
I'm building a Gmail automation agent in Python. I have a credentials.json file from Google Cloud in this folder.

Please create auth.py with a get_credentials() function that runs the OAuth flow using credentials.json, caches the result in token.json, and refreshes the token automatically when it expires. Use these scopes: gmail.modify and gmail.compose.

Add a small test at the bottom that prints my email address when run directly, so I can confirm the connection works.
```

> ✅ **Check your work:** Run `auth.py`. A browser window opens, you approve access, and it prints your email address. A `token.json` appears — **add it to `.gitignore`, it is a live credential.**

---

### Build 2 — Build the triage classifier (25 min)

**Paste this into your assistant:**

```
Using the auth.py from before, I'm building the classification layer for my Gmail triage agent.

I have a working llm.py exposing:
    chat_json(prompt: str, schema: dict, system: str = "", max_tokens: int = 1200) -> dict
Use it for all AI calls. Do not import an AI SDK directly and do not rewrite llm.py.

Please create:

1. fetcher.py with get_unread_emails(limit=10) that fetches the most recent unread emails from my inbox and returns a list of dicts with sender, subject, and a plain-text body for each. Truncate each body to 1500 characters.

2. classifier.py with:
   - TRIAGE_SCHEMA, a JSON Schema dict with two required fields: "priority" (string, one of exactly URGENT, IMPORTANT, LOW) and "reason" (string, one sentence explaining the call)
   - classify(email) that calls chat_json() with that schema and returns the dict

Pass the "you are triaging a busy professional's inbox" role instruction as the `system` argument. In the prompt, define what each priority level means rather than leaving it to the model's judgement.

Add a test at the bottom that classifies 3 unread emails and prints priority + reason for each.
```

> ✅ **Check your work:** Send yourself two test emails — one titled "URGENT: server is down" and one like "Lunch on Friday?" — then run `classifier.py`. You should see sensible labels **and a readable reason for each**.

**Read the reasons, not just the labels.** If the reasoning is wrong but the label happens to be right, your prompt is weak and will fail on a harder email next week. Tighten the priority definitions until the reasons make sense.

**A note on volume.** `get_unread_emails` defaults to 10, not 50. Ten emails is ten AI calls. On a schedule every 30 minutes, that is 480 calls a day — comfortably inside free limits, and enough to be genuinely useful. Raise it once you have seen how your quota behaves, not before.

---

### Build 3 — Auto-label and draft replies (20 min)

**Paste this into your assistant:**

```
Now add the action layer to my Gmail triage agent:

1. labels.py with get_or_create_label(service, name) that finds or creates a Gmail label, and apply_label(service, message_id, label_id) that applies a label to a message

2. drafter.py with:
   - draft_reply(email) that calls chat() from llm.py to write a short, professional reply (under 120 words) to an email
   - save_draft(service, email, reply_text) that saves that reply as a Gmail DRAFT addressed to the sender

Important: save_draft must create a draft only. It must never send. Do not use the send endpoint anywhere in this file.
```

> ✅ **Check your work:** Run it and check Gmail. You should see new labels applied and replies waiting in **Drafts** — nothing sent. Open a draft and read it; would you send that as-is?

**Why drafts.** An agent that sends email on your behalf can damage a relationship in a way you cannot take back. An agent that drafts email saves you the same amount of typing and costs you two seconds of review. Take the two seconds until you have watched it work for a month.

---

### Build 4 — Put it together and schedule it (10 min)

**Paste this into your assistant:**

```
Create main.py that ties my Gmail triage agent together:
- Fetch unread emails with fetcher.py
- Classify each with classifier.py
- Apply the matching label with labels.py
- For URGENT or IMPORTANT emails only, draft a reply with drafter.py
- Print one line per email: priority, reason, and whether a draft was created
- If one email fails to process, print a warning and continue with the rest

Run once immediately, then repeat every 30 minutes using the `schedule` library.

Also show me how to run this as a cron job instead, and tell me the tradeoffs between the two.
```

> ✅ **Check your work:** Run `python main.py`. Within a minute: both test emails labelled correctly in Gmail, a draft waiting for the urgent one, and a readable line per email in your console.

**Go further:** Add a fourth category, `NEWSLETTER`, that gets labelled and archived without a draft. Most inboxes are 60% newsletters, and removing them makes the other three categories far more useful.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Error 403: access_denied` on the Google login screen | Add your own Google account as a Test User under OAuth consent screen. This catches almost everyone. |
| `insufficient authentication scopes` | You changed scopes after `token.json` was created. Delete `token.json` and re-run to re-authorise. |
| Classification returns something other than the three labels | Your schema's `enum` is missing or too loose. `chat_json()` constrains output — make the schema list exactly the three permitted strings. |
| Drafts are addressed to the wrong person | You are replying to the `To` header instead of `From`. Reply to the sender. |
| Rate-limit waiting on every run | Lower the `limit` in `get_unread_emails`, widen the schedule interval, or switch to `LLM_PROVIDER=groq`. |
| The scheduled job stops when you close your laptop | Expected — `schedule` runs in your terminal. Use cron, or host it free on Render or Hugging Face Spaces. |

## Add this to your portfolio

You built something that touches your real inbox and makes real judgement calls. Screenshot your labelled inbox next to a generated draft.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built an email triage agent in Python that connects to Gmail via OAuth, classifies unread messages into priority tiers using constrained JSON output from an LLM with an auditable reason for each decision, auto-applies Gmail labels, and generates draft replies for high-priority mail. I designed it draft-only so no message is ever sent without human review, and it runs on a schedule with rate-limit handling.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 2 — Price & Competitor Monitor Agent

90 minutes · Python · Free tier

## What you will build

An agent that checks competitor pages on a schedule, notices when a price or product detail changes, asks an AI what the change might mean competitively, and emails you an alert.

This is the **cheapest agent in Builder 1 to run** — the AI only fires when something actually changed, which on most pages is a few times a month.

## What you need

- Python 3.10+ and your `llm.py`
- Your free Gemini API key
- A free AI assistant open in a browser tab
- 2–5 competitor pages you want to watch, plus five minutes with browser dev tools
- A Gmail account with an App Password for sending alerts

## By the end of this session

- Scrape specific values off a page with CSS selectors
- Store snapshots locally and detect what changed between runs
- Have an AI assess the competitive meaning of a change
- Get an email alert only when something actually happened
- Run it all on a schedule

---

### Build 1 — Pick your targets and build the scraper (30 min)

**1. Find your selectors.** Open 2–3 competitor pricing pages, right-click the price → **Inspect**, and note the CSS selector for the price and the plan name. Write them down — this is the fiddly part, and it is normal for it to take a few tries.

**2. Set up.** New folder, copy in `llm.py`, `.env` with your Gemini key, then:

```bash
pip install google-genai groq python-dotenv requests beautifulsoup4
python llm.py
```

**3. Paste this into your assistant** (filling in your real URLs and selectors):

```
I want to monitor competitor pricing pages for changes. Here are my targets:

[paste a list like: "Competitor A - Pro Plan: https://competitor-a.com/pricing, price selector .pro-plan .price, name selector .pro-plan .plan-name" — one per line]

I have a working llm.py exposing chat(prompt, system="", max_tokens=1200) -> str. Use it for AI calls later; this build is scraping only.

Please create:
1. targets.json with this list
2. scraper.py with scrape_target(target) that fetches the page with a realistic User-Agent header, parses it with BeautifulSoup, extracts the price and plan name using the selectors, and returns a dict

If a selector matches nothing, return None for that field and print a clear warning naming the target — do not crash. Websites change their markup constantly and this will happen to you.
```

> ✅ **Check your work:** Run `scraper.py`. You should see current prices for each target. If one returns `None`, re-check that selector in dev tools — the page may render it with JavaScript, in which case pick a different target for now.

---

### Build 2 — Detect changes and ask what they mean (30 min)

**Paste this into your assistant:**

```
Now add change detection to my price monitor:

1. storage.py using sqlite3 with a snapshots table (name TEXT PRIMARY KEY, data TEXT), plus:
   - get_previous(conn, name)
   - save_current(conn, name, data)
   - detect_changes(previous, current) that compares "price" and "plan_name" and returns a list of readable change strings, e.g. "price: '$49' -> '$59'". If there is no previous snapshot, return an empty list — the first run establishes a baseline and should never alert.

2. analyzer.py with analyze_change(target_name, changes) that calls chat() from llm.py to assess what the change might mean competitively — in 2-3 sentences, covering what they are likely doing and whether it matters. Pass the "you are a competitive intelligence analyst" instruction as the `system` argument.

Only call the AI when the changes list is non-empty. There is nothing to analyse otherwise, and I don't want to burn quota on unchanged pages.
```

> ✅ **Check your work:** Run it twice in a row. The first run saves a baseline and stays quiet. Then manually edit a stored price in the database and run again — you should see a detected change and an AI assessment.

**Note the design.** The AI is behind an `if`. Most runs cost nothing at all. That is deliberate, and it is a pattern worth carrying into every scheduled agent you build: **do the cheap check first, and only wake the expensive part when there is something to think about.**

---

### Build 3 — Send alerts and schedule it (30 min)

**1. Generate a Gmail App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Add `SMTP_USER` and `SMTP_PASS` to `.env`.

**2. Paste this into your assistant:**

```
Add alerting and scheduling to my price monitor:

1. email_alert.py with send_alert(to_email, target_name, changes, analysis) that sends an HTML email via smtplib SMTP_SSL (smtp.gmail.com) showing the target name, a bulleted list of changes, and the AI analysis. Read SMTP_USER and SMTP_PASS from environment variables.

2. main.py that loops over all targets, scrapes each, detects changes, and — only when there are changes — analyses and sends an alert. Print a summary line per target either way so I can see it ran.

3. If one target fails entirely (site down, timeout), log it and continue with the others.

Then give me the crontab line to run this every 6 hours, and explain why 6 hours is a more sensible default than every 5 minutes for this kind of monitoring.
```

> ✅ **Check your work:** Force a change in your database, run `main.py`, and check your inbox for an alert containing both the change and the analysis.

**Go further:** Add a `history` table that keeps every snapshot rather than overwriting. After a month you can chart a competitor's pricing over time — which is genuinely valuable, and something almost nobody bothers to collect.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Selector returns `None` every time | The page probably renders prices with JavaScript, so the HTML you fetch does not contain them. Either pick a server-rendered page, or note this as a limitation — headless browsers are beyond this session. |
| The site returns 403 to your script | Some sites block obvious bots. A realistic `User-Agent` header usually fixes it. If not, respect it and choose a different target. |
| Alerts fire on the very first run | `detect_changes` should return `[]` when there is no previous snapshot. Check that branch. |
| Alerts fire constantly with meaningless diffs | You are capturing surrounding whitespace or a rotating element. Strip whitespace, and narrow the selector. |
| The email never arrives | Check spam, then confirm your App Password. Your normal Google password will not work. |

## Add this to your portfolio

You built a competitive intelligence system that watches the market while you sleep. Screenshot an alert email with a real analysis in it.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a competitor price monitoring agent in Python that scrapes target pages on a schedule, detects changes against a local SQLite snapshot store, and uses an LLM to assess the competitive significance of any change before emailing an alert. I designed it so the AI call only fires when something actually changed, keeping it nearly free to operate.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 3 — Lead Capture & Qualifier Bot

90 minutes · Python · Free tier

## What you will build

A webhook that receives form submissions the moment someone fills in your form, scores the lead 1–10 against your ideal customer profile, extracts their stated pain points, and creates a properly tagged contact plus a follow-up task in your CRM.

## What you need

- Python 3.10+ and your upgraded `llm.py` (with `chat_json()`)
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A Google account (for Google Forms) **or** a free [Tally](https://tally.so) account
- A free HubSpot account — the free CRM tier is genuinely sufficient
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-tunnel/) for local webhook testing

> **Why not Typeform?** The original version of this session used Typeform, whose free tier caps at roughly 10 responses a month — you would exhaust it while testing. **Google Forms** is free and unlimited, and **Tally** has a far more generous free tier. Both do the same job here.

> **Why not ngrok?** ngrok's free tier now imposes session limits that interrupt a build session. **Cloudflare Tunnel** is free and does not time out on you mid-build.

## By the end of this session

- Receive a form submission via webhook, live
- Score a lead against your ICP with a reason you can audit
- Extract structured pain points from free-text answers
- Create or update a CRM contact automatically
- Create a follow-up task assigned by priority

---

### Build 1 — Set up your form and webhook (25 min)

**1. Build the form.** In Google Forms (or Tally), create a form with: Full name, Work email, Company name, Company size, Budget range, and a free-text "What's your biggest challenge?".

**2. Wire up the webhook.**

*Google Forms route:* open the form's **Script editor** (⋮ → Apps Script) and add an `onFormSubmit` trigger that POSTs the responses as JSON to your endpoint. Ask your AI assistant for the Apps Script if you have not written one before — it is about fifteen lines.

*Tally route:* Tally has webhooks built in under **Integrations → Webhooks**. Paste your URL in and you are done.

**3. Expose your local server.** Install Cloudflare Tunnel and run:

```bash
cloudflared tunnel --url http://localhost:5000
```

Copy the public HTTPS URL it prints and point your form's webhook at `<that-url>/webhook`.

> ✅ **Check your work:** Keep the tunnel running in its own terminal. Submitting the form should reach your machine once the Flask app in Build 2 is up.

---

### Build 2 — Receive and score the lead (35 min)

**Set up:** copy in `llm.py`, `.env` with your Gemini key, then:

```bash
pip install google-genai groq python-dotenv flask hubspot-api-client
python llm.py
```

**Paste this into your assistant:**

```
I'm building a Flask app that receives form-submission webhooks and scores leads with AI.

I have a working llm.py exposing:
    chat_json(prompt: str, schema: dict, system: str = "", max_tokens: int = 1200) -> dict
Use it for all AI calls. Do not import an AI SDK directly and do not rewrite llm.py.

Please create:

1. app.py with a Flask app and a POST /webhook route, plus parse_submission(payload) that extracts full_name, email, company, company_size, budget, and challenge from the incoming JSON. Make the field matching tolerant of slightly different key names since form tools vary.

2. scorer.py with:
   - LEAD_SCHEMA, a JSON Schema dict requiring: "score" (integer 1-10), "tier" (string, one of exactly HOT, WARM, COLD), "reason" (string, one sentence), and "pain_points" (array of strings)
   - score_lead(lead) that calls chat_json() with that schema

Put my Ideal Customer Profile in a plain-text ICP file that the prompt loads, so I can edit my criteria without touching code. Pass the "you are a sales qualification specialist" instruction as the `system` argument.

3. Always return HTTP 200 to the webhook quickly, even if scoring fails — form tools retry aggressively on non-200 responses and I don't want a retry storm.
```

> ✅ **Check your work:** Run the Flask app, submit the form, and watch your terminal. You should see the parsed lead and its score, tier, reason, and pain points.

**Submit three deliberately different leads** — a great fit, a poor fit, and an ambiguous one — and read the reasons. If the ambiguous one gets a confident 9, your ICP file is too vague. This is the tuning loop, and it is the actual work of this session.

---

### Build 3 — Push scored leads into HubSpot (20 min)

**1.** In HubSpot: **Settings → Integrations → Private Apps**, create an app with the `crm.objects.contacts.read/write` and `crm.objects.tasks.write` scopes. Copy the token into `.env` as `HUBSPOT_TOKEN`.

**2. Paste this into your assistant:**

```
Create hubspot_client.py with:

1. upsert_contact(lead, score_result) — creates a HubSpot contact with email, firstname, lastname (split from full_name), company, lead_score, lead_tier, and ai_notes properties. If the contact already exists (HubSpot returns a conflict), search by email and update instead. Return the contact ID.

2. create_followup_task(contact_id, lead, score_result) — creates a HubSpot task titled "Follow up: {company} ({TIER} - {score}/10)" with the reason and pain points in the body. Set the due date based on tier: HOT = tomorrow, WARM = 3 days, COLD = 2 weeks.

Then wire both into app.py after scoring.

Tell me which custom contact properties I need to create in HubSpot first, and exactly where in the UI to create them.
```

> ✅ **Check your work:** Submit a test lead and look in HubSpot. A contact with a score, and a task dated according to tier.

---

### Build 4 — Test end to end and go live (10 min)

**1.** Submit three test submissions representing different lead quality. Confirm each produces the right tier, the right HubSpot record, and a sensibly-dated task.

**2. Deploy it.** Ask your assistant:

```
Walk me through deploying this Flask app free on Render (or Hugging Face Spaces) so the webhook URL is permanent and I can stop running Cloudflare Tunnel. Tell me which environment variables to set there, and how to update my form's webhook URL to point at the deployed app.
```

> ✅ **Check your work:** Update the form webhook to your deployed URL, close your laptop, submit the form from your phone, and check HubSpot from your phone too.

**Go further:** Add a Slack or Telegram notification for `HOT` leads only. The whole point of scoring is that the top 10% gets a human response within the hour.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook never reaches your machine | Check the tunnel is still running and the form's webhook URL includes the `/webhook` path. Watch the tunnel's own log — it shows incoming requests. |
| Fields come through empty | Form tools name their payload keys differently. Print the raw JSON first, then match on what is actually there. |
| Scores are always 8-9 | Your ICP file is too generous or too vague. Add explicit disqualifiers — "companies under 10 people are COLD regardless of budget". |
| `tier` comes back as something other than the three values | Your schema needs an `enum` with exactly those three strings. |
| HubSpot rejects your custom properties | They must exist in HubSpot before you write to them. Create `lead_score`, `lead_tier`, and `ai_notes` under Settings → Properties. |
| Duplicate contacts on repeat submissions | Your conflict branch is not firing. HubSpot returns a specific conflict error — catch it and search by email instead. |

## Add this to your portfolio

You built a system that qualifies leads while you sleep and tells your sales team who to call first. Screenshot the HubSpot contact with its AI score and the auto-created task.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a lead qualification pipeline in Python and Flask that receives form submissions via webhook, scores each lead 1-10 against a configurable Ideal Customer Profile using constrained JSON output from an LLM, extracts structured pain points from free-text answers, and automatically creates or updates a CRM contact with a priority-based follow-up task. It's deployed with a permanent webhook endpoint and returns fast acknowledgements to avoid retry storms.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

## Appendix — notes for the team

*Not student-facing. Remove before publishing.*

### What changed from the original sessions

| Agent | Change | Why |
|---|---|---|
| **#1 Gmail Triage** | Runtime → `chat_json()`; **default batch cut from 50 to 10** | 50 emails every 30 min is 2,400 calls/day — fights free-tier quota all day. 10 is still useful and comfortably inside limits. Tradeoff is now explained rather than hidden. |
| **#1 Gmail Triage** | Classification schema gained a required `reason` field | The original returned a bare label. Unauditable. |
| **#10 Price Monitor** | Runtime → `chat()`. Nothing else. | Only paid dependency was the Anthropic key. `sqlite3` and `smtplib` are stdlib. |
| **#9 Lead Capture** | **Typeform → Google Forms / Tally** | Typeform free tier ≈10 responses/month — exhausted during testing. |
| **#9 Lead Capture** | **ngrok → Cloudflare Tunnel** | ngrok free tier now has session limits that interrupt a 90-minute build. |
| **#9 Lead Capture** | ICP moved to an editable text file | Was hardcoded in the prompt. Students need to tune it, and that is the actual lesson. |

HubSpot's free CRM tier is genuinely sufficient — no change needed there.

### Deliberate additions

- **The "judgement you can inspect" preamble** — Week 3 is where mistakes start to cost something. Every schema now carries a `reason`, and every agent stops short of the irreversible action (drafts not sends, alerts to you not the customer).
- **#10's "AI behind an `if`" note** — the cheap-check-first pattern is genuinely good architecture and generalises well beyond this build.
- **#9's fast-200 webhook rule** — form tools retry aggressively on non-200s; without this students create retry storms against their own quota.
- **`token.json` gitignore warning** in #1 — it is a live credential and the original never said so.

### Metadata that needs updating (not edited here — it ships live)

In `src/data/agentsBeginner.js`:

| Agent | Current `techStack` | Should become |
|---|---|---|
| #1 Gmail Triage | `Python \| Gmail API \| Claude API` | `Python \| Gmail API \| Gemini (free)` |
| #10 Price Monitor | `Python \| requests \| Claude API` | `Python \| requests \| Gemini (free)` |
| #9 Lead Capture | `Python \| Typeform API \| Claude API \| HubSpot API` | `Python \| Google Forms \| Gemini (free) \| HubSpot API` |

#9's `prerequisites` also names a Typeform account — needs the same swap.

### Still outstanding

- Live API call to verify the wire, not just the structure.
- Free-tier limits quoted are directionally right, not freshly checked.
- Nothing written to `course_content`.
