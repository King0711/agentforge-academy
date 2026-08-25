# Builder 1 — Week 1

## Scheduled Digests

*Revamped session instructions · Free-tier build paths*

---

## About this week

Week 1 teaches one mechanism three times: **read a source on a timer, summarise it, deliver it somewhere useful.** By Sunday you will have three agents running on schedules you set, delivering to your inbox and your team chat, without you touching them.

Every build this week runs on a **free AI tier**. No credit card, no subscription, no dollar card. If you already have a paid Claude plan, each session also includes the Claude path — but you do not need it to finish the week or earn your certificate.

| Session | Agent | Time | Main project |
|---|---|---|---|
| 1 | Daily News & Industry Summary | 1 hr | ⭐ Yes |
| 2 | Slack Morning Briefing Bot | 70 min | No |
| 3 | Calendar & Task Prioritiser | 80 min | No |

Completing **Session 1 alone** earns your Week 1 certificate. Sessions 2 and 3 are optional depth — but they are where you start writing real code, so do them if you can.

---

## Before you start — read this once

These four things apply to every Python build from here to Week 4. Learn them now and the rest of the programme is smoother.

### 1. Your AI provider is free, and it is a choice

We use **Google AI Studio (Gemini)** as the default. It is free, it needs no credit card, and you sign in with the Google account you already have. Get your key at [aistudio.google.com](https://aistudio.google.com) — click **Get API key**. It takes about ninety seconds.

**Groq** ([console.groq.com](https://console.groq.com)) is your backup. Also free, also no card, noticeably faster. If Gemini ever rate-limits you mid-session, switch to Groq and carry on.

You will notice we never tell you to use a specific model version. Model names change every few months. Pick whatever the current Flash model is in the dropdown — the instructions are written to survive that.

### 2. `llm.py` — the file that keeps you free

Every agent you build from now on will call one function: `chat()`. That function lives in a file called `llm.py`, and it is the only place that knows which AI company you are using.

```python
# llm.py — one place to choose your AI provider.
# Swap PROVIDER and every agent you have built switches with it.
import os, time, random

PROVIDER = os.getenv("LLM_PROVIDER", "gemini")   # "gemini" | "groq" | "claude"
MAX_RETRIES = 5


class RateLimited(Exception):
    """Raised when the provider says we are going too fast."""


def chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str:
    """Send a prompt, get text back. Retries politely on rate limits."""
    for attempt in range(MAX_RETRIES):
        try:
            if PROVIDER == "gemini":
                return _gemini(prompt, system, max_tokens)
            if PROVIDER == "groq":
                return _groq(prompt, system, max_tokens)
            if PROVIDER == "claude":
                return _claude(prompt, system, max_tokens)
            raise ValueError(f"Unknown LLM_PROVIDER: {PROVIDER!r}")
        except RateLimited:
            wait = (2 ** attempt) + random.random()
            print(f"Rate limited — waiting {wait:.1f}s, then retrying...")
            time.sleep(wait)
    raise RuntimeError(f"Still rate limited after {MAX_RETRIES} attempts.")
```

You will generate the provider functions in Session 2. Do not skip this file or inline the AI call directly into your agent. The habit matters more than the code: **a well-built agent does not care which model answers it.** Engineers who understand that are worth more than engineers who memorised one company's SDK.

### 3. Free tiers have speed limits — that is fine

Free plans cap how many requests you can send per minute. Week 1's agents run once a morning, so you will almost never hit a limit. But `llm.py` handles it automatically by waiting and retrying, so you never see a raw error.

You will meet this properly in Week 2, when you start processing whole folders of files. The groundwork is here.

### 4. Be deliberate about what you send

Free AI tiers generally train on the data you send them. For a test Slack channel or your own calendar, that is completely fine.

It is **not** fine for a real client's contract or a stranger's CV — both of which turn up in Weeks 2 and 3. When you get there, that is the point at which paying for a private tier starts to make sense. Not before.

---

# Session 1 — Daily News & Industry Summary Agent

⭐ **Week 1 main project** · 1 hour · No code · Completing this earns your Week 1 certificate

## What you will build

A fully automated briefing agent built entirely on Make.com — zero code, zero cost. Every morning it pulls the top ten headlines from Google News for your chosen industry, passes them to Gemini to write a clean five-minute executive summary, and delivers a professionally styled email to your inbox on a schedule. All before your first coffee.

## What you need

- A free Make.com account — [make.com](https://make.com)
- A Gmail account
- A free Google AI Studio account — [aistudio.google.com](https://aistudio.google.com), no credit card needed

## By the end of this session

- A live, scheduled automation pulling industry headlines every morning
- A Gemini-powered executive briefing delivered to your inbox at zero cost
- A reusable Make.com workflow you can repurpose for any industry or topic
- A finished portfolio project you can show employers or clients

---

### Build 1 — Set up your visual canvas (5 min)

Create your workspace. This is where you build the entire agent without writing a single line of code — think of it as a digital assembly line where data moves left to right.

1. Go to [make.com](https://make.com) and create a free account.
2. Click **Scenarios** in the left menu, then **Create a new scenario** in the top right.
3. You will see a large circular **+** button in the middle of your screen. This is where you plug in your building blocks. Click it to begin.

> ✅ **Check your work:** You should see a search bar with a list of app integrations. If you see this, your canvas is ready.

---

### Build 2 — Pull fresh industry news (10 min)

Connect Google News via RSS. Completely free, requires no signup with Google News, and gives you real-time headlines for any industry keyword.

1. Click the **+** icon on your canvas and search for **RSS**.
2. Select **Retrieve RSS feed items**.
3. In the URL box, paste `https://news.google.com/rss/search?q=YOUR_KEYWORD` — replace `YOUR_KEYWORD` with your industry (e.g. `project+management` or `artificial+intelligence`). Use `+` instead of spaces.
4. Set **Maximum number of returned items** to 10. Click **OK**.

> ✅ **Check your work:** Click **Run once** at the bottom. You should see 10 article items returned with Title, Link, and Description fields.

**Go further:** Try combining two keywords to pull from two topics at once — e.g. `artificial+intelligence` and `productivity`.

---

### Build 3 — Aggregate the articles into one packet (10 min)

Group all the news into a single readable packet before passing it to Gemini. Skip this step and your automation will try to send ten separate emails — one per article.

1. Hover over the right edge of your RSS module and click **Add another module**.
2. Search for **Tools** and select **Text aggregator**.
3. Under **Source Module**, pick your RSS module.
4. In the **Text** box, select the RSS data fields from the popup: Title, Link, and Description. Click **OK**.

> ✅ **Check your work:** Run once again — you should now see one single output bundle containing all 10 articles.

---

### Build 4 — Connect Gemini to write the briefing (15 min)

The zero-cost AI brain. Gemini reads your headlines and writes a professional executive briefing.

1. Add a new module after the Text Aggregator. Search for **Google AI Studio (Gemini)** and select **Generate Content**. Do not pick Google Vertex AI — that one requires cloud billing.
2. Get your free API key: open [aistudio.google.com](https://aistudio.google.com), sign in with your Google account, and click **Get API Key**. Paste it into Make.com. No credit card required.
3. Select the current **Flash** model from the dropdown.
4. In the **Text** box, paste the Master Prompt below. Then click where it says `[Insert Text Aggregator Output Variable Here]` and select the actual output variable from your Text Aggregator module.

````
You are an elite industry analyst preparing a 5-minute morning briefing for a business executive.

Here are today's top raw industry news articles:

[Insert Text Aggregator Output Variable Here]

Please read through these articles and generate a clean, executive-ready HTML email briefing following these rules:

1. Group & Filter: Group related stories together and drop anything repetitive or low-value.

2. Format: Write 4 to 6 concise paragraphs. Each paragraph MUST start with a bold, 1-line headline summary, followed by 2 sentences of critical context.

3. Impact: Add a sentence at the end of each topic explaining: "Why this matters to the business."

4. HTML Output: Wrap the result in clean, modern HTML with professional inline styling (dark grey font #333, standard readable line heights, simple section dividers). Return ONLY valid HTML. Do not wrap the output in markdown code blocks like ```html.
````

> ✅ **Check your work:** Click **Run once**. If Gemini returns a block of HTML with headings and paragraphs, your prompt is working.

**Go further:** Personalise the prompt by naming your reader at the top: *You are briefing a marketing executive in the SaaS sector.*

---

### Build 5 — Deliver as a styled email and schedule it (10 min)

Automate daily delivery so the briefing arrives before you start work, without you doing anything.

1. Add the final module: search for **Gmail** and select **Send an Email**.
2. Connect your Gmail account when prompted.
3. In the **To** field, enter your target email. In **Subject**, type: `Daily Executive Industry Briefing`. In the **Content HTML** field, select the Text output variable from the Gemini module.
4. Set the schedule: click the clock icon on the first RSS module, set it to run **Every day at 06:30 AM**, then flip the main toggle switch at the bottom left to **ON**.

> ✅ **Check your work:** Click **Run once** first — check your inbox. If the styled HTML briefing arrives, flip the schedule to ON and you are done.

**Go further:** Add a second Gmail module to CC your team, so the briefing goes to the whole department automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| RSS module returns zero articles | Your keyword has a space in the URL. Use `+` instead of a space — `artificial+intelligence`, not `artificial intelligence`. |
| 429 Too Many Requests from Gemini | You clicked Run too many times too quickly. The free tier allows roughly 10–15 requests per minute. A daily scheduled run will never hit this naturally. Wait 60 seconds and try again. |
| Gmail authentication error | Google blocks automated scripts using your main password. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), generate an App Password, and use that in Make.com instead. |
| Gemini returns raw HTML code instead of a formatted email | Make sure you selected **HTML** in the Gmail module's Content field, not Plain text. |

## Add this to your portfolio

You just built an automated news analyst that reads industry headlines and writes you a professional briefing — on a permanent zero-cost architecture. Take a screenshot of the email you received and add this project to your portfolio.

<details>
<summary>Need help writing it up? Use this prompt</summary>

```
I just built a daily news briefing agent using a visual workflow builder (Make.com) that automatically pulls RSS articles for my industry, uses the Google Gemini API to write a 5-minute executive summary, and delivers it to me via email every morning on a schedule.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 2 — Slack Morning Briefing Bot

70 minutes · Python · Free tier

## What you will build

A scheduled Python job that pulls the last 24 hours of messages from your most important team channels, asks an AI to sort them into **Urgent / Decisions Needed / FYI**, and posts that briefing directly to your DMs every morning.

This is your first real code build, and where you create `llm.py` — the provider shim you reuse for the rest of the programme.

## What you need

- Python 3.10+ installed locally
- A free Google AI Studio account — [aistudio.google.com](https://aistudio.google.com), no credit card
- **Either** a Slack workspace where you can install apps, **or** a Discord server you own — Build 1 covers both
- 2–3 channels with real conversation in them to summarise

> **A note on Slack.** Most people cannot install apps in their employer's Slack — that permission belongs to admins. If that is you, use the Discord route in Build 1. It is free, you own the server, you can create one in two minutes, and every other step in this session is identical. You are not missing out on anything.

## By the end of this session

- Connect a bot to your team chat and read channel history
- Build a provider shim so your agent is not locked to one AI company
- Design a multi-section summarisation prompt
- Get a prioritised briefing delivered to your DMs every morning
- Schedule the whole thing to run without you

---

### Build 1 — Connect to your workspace (20 min)

Get a bot into the channels you want summarised. Two routes — pick the one that matches what you have access to.

**1. Decide your route.** If you can install apps in a Slack workspace, use the Slack route. If you cannot, use the Discord route. The rest of the session is the same either way.

**2a. Slack route.** Go to [api.slack.com/apps](https://api.slack.com/apps), click **Create New App → From scratch**, name it (e.g. "Morning Briefing Bot") and pick your workspace. Under **OAuth & Permissions**, add these Bot Token Scopes:

```
channels:history    channels:read    chat:write    im:write    users:read
```

Click **Install to Workspace** and copy the Bot User OAuth Token (it starts with `xoxb-`).

**2b. Discord route.** Go to [discord.com/developers/applications](https://discord.com/developers/applications), click **New Application**, name it, then open the **Bot** tab and click **Reset Token** to reveal your bot token. Under **Privileged Gateway Intents**, turn **ON** "Message Content Intent" — without it your bot reads empty messages and nothing works. Then open **OAuth2 → URL Generator**, tick `bot`, tick **Read Message History** and **Send Messages**, and open the generated URL to invite the bot to your own server.

**3. Get your channel IDs.** In Slack: right-click a channel → View channel details → scroll to the bottom (starts with `C`). In Discord: enable **Settings → Advanced → Developer Mode**, then right-click a channel → **Copy Channel ID**. Grab 2–3 of them, plus your own user ID so the bot knows who to DM.

> ✅ **Check your work:** You should have a bot token, 2–3 channel IDs, and your own user ID saved somewhere. In Slack, also type `/invite @YourBotName` in each channel — the bot cannot read a channel it has not joined.

**Go further:** Post a few varied test messages in one channel now — a question, a decision, and a casual update — so you have something realistic to summarise in Build 2.

---

### Build 2 — Build the briefing generator (30 min)

The core of the agent: pulling messages and turning them into a briefing. You will also build the provider shim you reuse for every agent after this one.

**1. Get your free Gemini API key.** Open [aistudio.google.com](https://aistudio.google.com), sign in with your Google account, and click **Get API key**. No credit card required. Create a `.env` file in your project folder with `GEMINI_API_KEY`, your bot token, and your user ID.

**2. Paste this prompt into your AI assistant:**

```
I'm building a "Morning Briefing" bot in Python that reads my team chat and summarizes the last 24 hours.

I have a .env file with GEMINI_API_KEY, SLACK_BOT_TOKEN, and SLACK_USER_ID. (If I'm using Discord instead, use DISCORD_BOT_TOKEN and DISCORD_USER_ID and the discord.py library.)

Please create:

1. requirements.txt with slack_sdk, google-generativeai, python-dotenv

2. llm.py — a provider shim so this agent isn't locked to one AI company. It should have:
   - A PROVIDER constant at the top read from the LLM_PROVIDER env var, defaulting to "gemini"
   - chat(prompt, system="", max_tokens=1200) that routes to the right provider and returns plain text
   - Support for "gemini" (use the latest Flash model), and stubs for "groq" and "claude" I can fill in later
   - On a rate-limit (429) error, retry up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s) plus small random jitter, printing what it's waiting for before each retry

3. chat_reader.py with get_recent_messages(channel_id, hours=24) that fetches all messages from the last N hours (handling pagination), and get_channel_name(channel_id)

4. summarizer.py with summarize_briefing(channel_messages: dict) that combines messages from all channels and calls chat() from llm.py to produce a briefing with exactly three sections — Urgent, Decisions Needed, and FYI — using the markdown flavour my platform renders

5. notifier.py with send_dm(user_id, text) that opens a DM and posts the message

Install the dependencies for me.
```

> ✅ **Check your work:** Run `python -c "from llm import chat; print(chat('Say hello in exactly five words'))"` — it should print a short greeting with no error. That confirms your Gemini key works before you wire anything else together.

**3. Test the reader on its own.** Run `chat_reader.py` directly and confirm it prints real messages from your channels, not an empty list.

> ✅ **Check your work:** You should see actual message text. An empty list usually means the bot is not in the channel (Slack) or Message Content Intent is off (Discord).

**Go further:** Ask your assistant to add a fourth section, "Wins", that highlights anything positive or completed in the last 24 hours.

---

### Build 3 — Wire it together and schedule it (20 min)

Connect the pieces into one script, then make it run every morning without you.

**1. Paste this prompt into your AI assistant:**

```
Now create main.py that ties my Morning Briefing bot together:

- List my channel IDs in a CHANNEL_IDS array near the top (I'll fill these in)
- For each channel, get its name and recent messages using chat_reader.py
- Pass everything to summarize_briefing() from summarizer.py
- Add a "🌅 Morning Briefing — <today's date>" header on top
- Send the result as a DM to my user ID using notifier.py
- Print "Briefing sent!" when done
- If a channel has no messages in the window, skip it rather than sending an empty section

Also show me the crontab line to run this every weekday at 8am, and explain how I'd host it free on Render or Hugging Face Spaces so it runs when my laptop is off.
```

> ✅ **Check your work:** Fill in your real channel IDs and run `python main.py`. Within about 20 seconds you should get a DM titled "Morning Briefing — *today's date*" with Urgent / Decisions Needed / FYI sections, and "Briefing sent!" in your console.

**2. Add the crontab line** so it runs tomorrow morning on its own. Use the absolute path to your virtual environment's Python — run the exact command manually once first to confirm it works before trusting cron with it.

**Go further:** Swap `LLM_PROVIDER` to `groq` in your `.env`, fill in the Groq stub in `llm.py`, and run it again. Same briefing, different company, one line changed. That is the entire point of the shim.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Slack: `SlackApiError: not_in_channel` | Type `/invite @YourBotName` in each channel you want summarised. The bot can only read channels it has joined. |
| Slack: `SlackApiError: missing_scope` | Go back to OAuth & Permissions, add the missing scope to Bot Token Scopes, then reinstall the app to your workspace to apply the change. |
| Discord: the bot connects but every message body is empty | Message Content Intent is off. Go to your app's Bot tab in the Discord Developer Portal, turn ON "Message Content Intent" under Privileged Gateway Intents, and restart your script. |
| 429 / "resource exhausted" from Gemini | You are calling faster than the free tier allows. The backoff in `llm.py` handles this automatically — if you are still seeing it after all retries, you are testing in a tight loop. Wait 60 seconds. A once-a-morning briefing will never hit this. |
| Briefing arrives but is empty or says "no messages found" | Double-check your channel IDs, and confirm messages were actually posted in the last 24 hours. Post a few test messages and re-run. |
| The cron job never seems to run | Crontab needs an absolute path to your venv's Python. Run the exact command from your crontab entry manually in a terminal first. |

## Add this to your portfolio

You just built a bot that reads your team's chat and hands you a prioritised briefing every morning — running on a free AI tier, with a provider shim that means you are not locked to any one company. Screenshot the DM it sent you and add it to your portfolio.

<details>
<summary>Need help writing it up? Use this prompt</summary>

```
I built an automated morning briefing bot in Python that reads the last 24 hours of messages from my team chat channels, uses an LLM to summarize them into Urgent / Decisions Needed / FYI sections, and delivers the briefing to my DMs on a daily schedule. I architected it with a provider abstraction layer so the underlying AI model can be swapped with a single config change.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 3 — Calendar & Task Prioritiser Agent

80 minutes · Python · Free tier

## What you will build

A morning automation that pulls today's Google Calendar events and your open task list, asks an AI to prioritise your day, and emails you a time-blocked schedule with your top three priorities and energy-management tips — before 7am.

## What you need

- Python 3.10+ installed locally
- A free Google AI Studio account — [aistudio.google.com](https://aistudio.google.com), no credit card
- A Google Cloud account (free tier is fine) with the Calendar API enabled
- A Google Calendar you can share with a service account
- A Gmail account with an App Password for sending mail

## By the end of this session

- Authenticate with Google Calendar via a service account — no browser login flow
- Combine two different data sources into one prompt
- Design a planning prompt that returns a real time-blocked schedule
- Reuse the provider shim so the agent is not tied to one AI company
- Get a daily plan emailed to you automatically every weekday morning

---

### Build 1 — Connect to Google Calendar (25 min)

Set up read-only access to your calendar without any browser login flow.

**1. Set up the service account.** In the Google Cloud Console, enable the **Google Calendar API**. Go to **IAM & Admin → Service Accounts**, create a service account, and download its JSON key as `service_account.json` into your project folder.

Then open Google Calendar → **Settings → Settings for my calendars → your calendar → Share with specific people**, and add the service account's email address with "See all event details". You will find that email inside the JSON key file as `client_email`.

**2. Paste this prompt into your AI assistant:**

```
Create calendar_reader.py for a Python project. It should:
1. Use google-auth and google-api-python-client to authenticate with service_account.json (read-only Calendar scope)
2. Have a get_today_events(calendar_id="primary") function that returns today's events as a list of {"summary": ..., "start": ..., "description": ...} dicts, handling both timed events (dateTime) and all-day events (date)
3. Convert event times to my local timezone before returning them
4. Print the result when run directly

Also create requirements.txt with google-auth, google-api-python-client, google-generativeai, and python-dotenv.
```

> ✅ **Check your work:** Run `calendar_reader.py` — it should print a list of today's events with times that match what you see in Google Calendar. If you get a permission error, double-check the calendar is shared with the exact service account email.

**Go further:** Try running it on a day with no events and a day with several — confirm both cases work without errors.

---

### Build 2 — Add your tasks and build the planner (30 min)

The core of the agent: turning your raw schedule and to-dos into an actual plan. You will build the provider shim here too.

**1. Create a `tasks.txt` file** in your project folder with your open tasks, one per line:

```
- Finish Q3 budget review
- Reply to vendor contract email
- Draft the team update
```

**2. Get your free Gemini API key** at [aistudio.google.com](https://aistudio.google.com) — sign in with your Google account, click **Get API key**, no credit card required. Add `GEMINI_API_KEY` to a `.env` file.

**3. Paste this prompt into your AI assistant:**

```
Now build the planning layer for my daily planner agent.

1. llm.py — a provider shim so this agent isn't locked to one AI company. It should have:
   - A PROVIDER constant at the top read from the LLM_PROVIDER env var, defaulting to "gemini"
   - chat(prompt, system="", max_tokens=1200) that routes to the right provider and returns plain text
   - Support for "gemini" (use the latest Flash model), and stubs for "groq" and "claude" I can fill in later
   - On a rate-limit (429) error, retry up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s) plus small random jitter, printing what it's waiting for before each retry

2. tasks_reader.py with get_tasks_from_file(path="tasks.txt") that reads each non-empty line, stripping leading "- " markers, and returns a list of task strings

3. planner.py with plan_day(events, tasks) that sends both lists to chat() from llm.py, asking for: (1) a time-blocked schedule that fits tasks around my meetings, (2) the top 3 priorities with a sentence of reasoning each, and (3) two energy-management tips based on how busy the day looks. Handle the case where events or tasks are empty.

4. main.py that calls get_today_events(), get_tasks_from_file(), plan_day(), and prints the result
```

> ✅ **Check your work:** Run `python -c "from llm import chat; print(chat('Say hello in exactly five words'))"` first — a short greeting means your key works. Then run `main.py`: you should see a readable daily plan that references your actual calendar events and `tasks.txt` items, with a clear top-three priority list.

**Go further:** If your calendar is packed, ask your assistant to have the planner also flag which tasks realistically will not fit today.

---

### Build 3 — Email it to yourself every morning (25 min)

The plan only helps if it shows up in your inbox before your day starts.

**1. Generate a Gmail App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — Google blocks scripts using your normal password. Add `SMTP_USER` and `SMTP_PASS` to your `.env` file.

**2. Paste this prompt into your AI assistant:**

```
Finish my daily planner agent:

1. template.py with build_html(plan) that wraps the plan text in a simple HTML email (heading with today's date, plan content with line breaks preserved)
2. mailer.py with send_email(to_email, subject, html_body) using smtplib SMTP_SSL with smtp.gmail.com, reading SMTP_USER and SMTP_PASS from environment variables
3. Update main.py to build the HTML and call send_email() with subject "Your Daily Plan"

Then tell me the crontab line to run this at 6:30am on weekdays only.
```

> ✅ **Check your work:** Run `main.py` and check your inbox for a "Your Daily Plan" email with a readable, time-blocked schedule. Check spam if it does not arrive. Then add the crontab line.

**Go further:** Swap `LLM_PROVIDER` to `groq` in your `.env`, fill in the Groq stub in `llm.py`, and run it again. Same planner, different company, one line changed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "No events found" even though your calendar clearly has events today | `"primary"` is the *service account's* own empty calendar unless you shared yours with it. Confirm you added the service account email under Share with specific people, and try your actual calendar's ID. |
| Google returns a 403 permission error | Either the calendar is not shared with the service account, or the Calendar API is not enabled on the project. Confirm both. The service account email is in the JSON key file as `client_email`. |
| The times in your schedule email look wrong | Google Calendar returns times in UTC or the event's own time zone. Convert to your local time zone before displaying — the Build 1 prompt asks for this, but double-check it happened. |
| 429 / "resource exhausted" from Gemini | You are calling faster than the free tier allows. The backoff in `llm.py` handles this. A once-a-morning planner will never hit this naturally. |
| The email never arrives | Check spam first, then confirm your Gmail App Password is set up correctly. Your normal Google password will not work. |

## Add this to your portfolio

You just built an agent that reads your calendar, weighs it against your task list, and emails you a time-blocked plan before you wake up — on a free AI tier. Screenshot the email and add it to your portfolio.

<details>
<summary>Need help writing it up? Use this prompt</summary>

```
I built a daily planning agent in Python that pulls my Google Calendar events via a service account, combines them with an open task list, uses an LLM to generate a time-blocked schedule with prioritized tasks and energy-management advice, and emails it to me automatically every weekday morning on a cron schedule. I architected it with a provider abstraction layer so the underlying AI model can be swapped with a single config change.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

## Appendix — notes for the team

*Not student-facing. Delete before publishing.*

### How this maps onto the site

Each session above becomes a **two-guide** `course_content.session` entry — a JSON array where index 0 is the free guide and index 1 is the existing Claude guide, relabelled. `SessionGuide.jsx:7` already detects the array and renders a two-tab switcher, so **no frontend work is required.** Agent #4 already ships in this shape; sessions 2 and 3 are being brought up to match it.

Three rules the renderer enforces:

1. **Exactly two guides** — the switcher is `grid-cols-2` (`SessionGuide.jsx:22`). A third breaks the layout.
2. **Free guide first** — the active tab defaults to index 0 (`SessionGuide.jsx:17`).
3. **`outcomes`, `whatYouNeed`, and `builds` are mandatory on every guide** — those `.map()` calls are unguarded (lines 70, 83, 94). Omitting any one crashes the session page.

### Two fixes to Agent #4 while we are in here

**Blank resource links (live bug).** `BuilderSession.jsx:334` and `AgentModal.jsx:226` both render `r.title`, but course 4's `resources` rows use `label` — so its resource links currently render as empty rows in both places. Normalise to `title`. Worth grepping the other 43 rows for the same drift.

**Stale model pin.** Guide 1's badge reads `"Gemini 1.5 Flash (free)"`. Change to `"Gemini Flash (free tier)"` to match the version-agnostic wording used in the steps.

### Corrections to the Claude guides

Both sessions 2 and 3 currently list only "Claude Code, Cowork, or Claude Desktop" under **What you need**, while their build steps require an Anthropic API key at runtime. Add to both:

> An Anthropic API key with credits (console.anthropic.com) — the finished agent calls the API on every run

Course 11 also has `test_it_out` set to `null`. Suggested fill:

> Add two or three events to today's calendar and a few lines to `tasks.txt`, then run `python main.py`. Within about 30 seconds you should get a "Your Daily Plan" email containing a time-blocked schedule that references your real events by name, a top-three priority list, and two energy tips.

### Before this goes live

- **Verify current free-tier limits** for Gemini and Groq. The figures here are directionally right, not freshly checked, and they move.
- **Run one build end to end on the free tier.** Session 3 is fastest to verify (calendar read → Gemini → email). Do not tell students a path works until someone has walked it.
- **Do not write to `course_content` casually** — it is live paywalled content and the write path is service-role only.

### Still open

The authoring step still assumes a paid plan — every session says "paste this into Claude". We ship `starter_code` for all 12 Builder 1 sessions, so a free authoring path already exists; it just is not written up as one. Worth deciding before Week 2.
