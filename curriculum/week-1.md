# Builder 1 — Week 1

## Scheduled Digests

*Session guides · No paid AI account required*

---

## About this week

Week 1 teaches one mechanism three times: **read a source on a timer, summarise it, deliver it somewhere useful.** By the end you will have three agents running on schedules you set, delivering to your inbox and your team chat, without you touching them.

**Everything this week is free.** No Claude Pro. No ChatGPT Plus. No API credits. No credit card, virtual or otherwise. That applies to both halves of the work — the AI that runs *inside* your agents, and the AI assistant that helps you *write* them.

| Session | Agent | Time | Main project |
|---|---|---|---|
| 1 | Daily News & Industry Summary | 1 hr | ⭐ Yes |
| 2 | Slack Morning Briefing Bot | 70 min | No |
| 3 | Calendar & Task Prioritiser | 80 min | No |

Completing **Session 1 alone** earns your Week 1 certificate. Sessions 2 and 3 are optional depth — but they are where you start writing real code, so do them if you can.

---

## Before you start — read this once

Four things that apply to every build from here to Week 4.

### 1. The AI *inside* your agent — free

Your agents call **Google Gemini** through Google AI Studio. Free, no credit card, and you sign in with the Google account you already have.

Get your key at **[aistudio.google.com](https://aistudio.google.com)** → click **Get API key**. Ninety seconds.

**Groq** ([console.groq.com](https://console.groq.com)) is your backup — also free, also no card, and noticeably faster. If Gemini ever rate-limits you mid-session, switch to Groq and carry on. Session 2 shows you how.

### 2. The AI that *helps you write* — also free

Several sessions say "paste this prompt into your AI assistant." Any of these work, and all are free:

| Assistant | Where | Notes |
|---|---|---|
| **Google AI Studio** | [aistudio.google.com](https://aistudio.google.com) | **Recommended** — you are already there for your API key, and it writes code well |
| Gemini | [gemini.google.com](https://gemini.google.com) | Same models, chat-style interface |
| ChatGPT (free tier) | [chatgpt.com](https://chatgpt.com) | Works fine for these prompts |
| Claude (free tier) | [claude.ai](https://claude.ai) | Works fine — you will hit usage limits sooner, but you do **not** need Pro |

Pick one and stick with it for the week. If it stops mid-answer or hits a limit, switch to another and paste the same prompt — none of these prompts depend on a specific assistant.

> **You do not need a paid plan for any of this.** If a step ever seems to require one, it is a mistake in our instructions — tell us and we will fix it.

### 3. `llm.py` — the file that keeps you free

Every agent you build calls one function: `chat()`. It lives in `llm.py`, and it is the only file that knows which AI company is answering. Change one line and every agent you have built switches provider.

**Copy this file exactly as it is.** Do not ask an AI to generate it — this is the one file where a subtle mistake breaks every agent you build afterwards, so we have written and tested it for you.

```python
"""
llm.py — one place to choose your AI provider.

Every agent you build calls chat(). Nothing else in your project needs to
know which AI company is answering. Change LLM_PROVIDER in your .env and
every agent you have built switches with it.
"""
import os
import random
import time

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
MAX_RETRIES = 5

_client = None  # built once, on first use


class RateLimited(Exception):
    """The provider asked us to slow down. chat() handles this for you."""


def chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str:
    """Send a prompt, get text back. Waits and retries if we hit a rate limit."""
    for attempt in range(MAX_RETRIES):
        try:
            if PROVIDER == "gemini":
                return _gemini(prompt, system, max_tokens)
            if PROVIDER == "groq":
                return _groq(prompt, system, max_tokens)
            raise ValueError(
                f"Unknown LLM_PROVIDER: {PROVIDER!r}. Use 'gemini' or 'groq'."
            )
        except RateLimited:
            if attempt == MAX_RETRIES - 1:
                break
            wait = 2**attempt + random.random()
            print(f"  Rate limited — waiting {wait:.1f}s, then retrying...")
            time.sleep(wait)

    raise RuntimeError(
        f"Still rate limited after {MAX_RETRIES} tries. Wait a minute, or set "
        f"LLM_PROVIDER=groq in your .env and run again."
    )


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is missing. Add it to your .env file.")
    return value


def _gemini(prompt: str, system: str, max_tokens: int) -> str:
    global _client
    from google import genai
    from google.genai import errors, types

    if _client is None:
        _client = genai.Client(api_key=_require("GEMINI_API_KEY"))

    config = types.GenerateContentConfig(
        max_output_tokens=max_tokens,
        system_instruction=system or None,
    )
    try:
        response = _client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config=config,
        )
    except errors.ClientError as e:
        if getattr(e, "code", None) == 429:
            raise RateLimited from e
        raise

    return (response.text or "").strip()


def _groq(prompt: str, system: str, max_tokens: int) -> str:
    global _client
    import groq

    if _client is None:
        _client = groq.Groq(api_key=_require("GROQ_API_KEY"))

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = _client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=messages,
            max_tokens=max_tokens,
        )
    except groq.RateLimitError as e:
        raise RateLimited from e

    return (response.choices[0].message.content or "").strip()


if __name__ == "__main__":
    print(f"Provider: {PROVIDER}")
    print(chat("Say hello in exactly five words."))
```

Install what it needs:

```bash
pip install google-genai groq python-dotenv
```

Then test it on its own before building anything:

```bash
python llm.py
```

> ✅ **Check your work:** You should see `Provider: gemini` and a five-word greeting. If you get `GEMINI_API_KEY is missing`, your `.env` is not set up yet. If you get a model-not-found error, open AI Studio, copy the exact name of the current Flash model from the dropdown, and add `GEMINI_MODEL=that-name` to your `.env`.

**Why this file matters more than it looks.** Most people learning this hard-code one company's SDK straight into their agent. Then that company changes its pricing, or deprecates the model, and everything they built stops working. You are learning the version that survives that. **A well-built agent does not care which model answers it.**

### 4. Two habits to build now

**Free tiers have speed limits.** Free plans cap requests per minute. Week 1's agents run once a morning, so you will rarely hit one — and `llm.py` already waits and retries so you never see a raw error. This matters properly in Week 2, when you start processing whole folders.

**Be deliberate about what you send.** Free AI tiers generally train on the data you send them. For a test Slack channel or your own calendar, that is completely fine. It is **not** fine for a real client's contract or a stranger's CV — both of which turn up in Weeks 2 and 3. That is the point where paying for a private tier starts to make sense. Not before.

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
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

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

This is your first real code build, and where `llm.py` earns its keep.

## What you need

- Python 3.10+ installed locally
- Your free Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A free AI assistant open in a browser tab (see the table in *Before you start*)
- **Either** a Slack workspace where you can install apps, **or** a Discord server you own — Build 1 covers both
- 2–3 channels with real conversation in them to summarise

> **A note on Slack.** Most people cannot install apps in their employer's Slack — that permission belongs to admins. If that is you, use the **Discord route** in Build 1. It is free, you own the server, you can create one in two minutes, and every other step in this session is identical. You are not missing out on anything.

## By the end of this session

- Connect a bot to your team chat and read channel history
- Use the provider shim so your agent is not locked to one AI company
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

### Build 2 — Set up your project and the AI layer (20 min)

**1. Create your project folder** and a `.env` file inside it:

```
GEMINI_API_KEY=your_key_from_aistudio
LLM_PROVIDER=gemini
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_USER_ID=your-user-id
```

*(Discord users: use `DISCORD_BOT_TOKEN` and `DISCORD_USER_ID` instead.)*

**2. Add `llm.py`.** Copy it from *Before you start* into your project folder, exactly as written. Then:

```bash
pip install google-genai groq python-dotenv slack_sdk
python llm.py
```

> ✅ **Check your work:** You should see `Provider: gemini` and a five-word greeting. **Do not move on until this works** — every remaining step depends on it, and debugging it now is far easier than debugging it buried inside the agent.

**3. Now build the reader and summariser.** Paste this into your free AI assistant:

```
I'm building a "Morning Briefing" bot in Python that reads my team chat and summarizes the last 24 hours.

I already have a working llm.py in my project folder that exposes:
    chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str
Use that function for all AI calls. Do not import any AI SDK directly, and do not rewrite llm.py.

I have a .env file with GEMINI_API_KEY, LLM_PROVIDER, SLACK_BOT_TOKEN, and SLACK_USER_ID.
(If I'm using Discord instead, use DISCORD_BOT_TOKEN and DISCORD_USER_ID and the discord.py library.)

Please create:

1. chat_reader.py with get_recent_messages(channel_id, hours=24) that fetches all messages from the last N hours (handling pagination), and get_channel_name(channel_id). Load the .env with python-dotenv.

2. summarizer.py with summarize_briefing(channel_messages: dict) that combines messages from all channels into one prompt and calls chat() to produce a briefing with exactly three sections — Urgent, Decisions Needed, and FYI. Ask for my platform's markdown flavour in the prompt. Pass the role instruction as the `system` argument, not inside the prompt text.

3. notifier.py with send_dm(user_id, text) that opens a DM and posts the message.

Show me each file in full, and tell me what to run to test each one on its own.
```

> ✅ **Check your work:** Run `chat_reader.py` directly. It should print real message text from your channels. An empty list means the bot is not in the channel (Slack) or Message Content Intent is off (Discord).

**Go further:** Ask your assistant to add a fourth section, "Wins", highlighting anything positive or completed in the last 24 hours.

---

### Build 3 — Wire it together and schedule it (30 min)

**1. Paste this into your AI assistant:**

```
Now create main.py that ties my Morning Briefing bot together:

- List my channel IDs in a CHANNEL_IDS array near the top (I'll fill these in)
- For each channel, get its name and recent messages using chat_reader.py
- Pass everything to summarize_briefing() from summarizer.py
- Add a "🌅 Morning Briefing — <today's date>" header on top
- Send the result as a DM to my user ID using notifier.py
- Print "Briefing sent!" when done
- If a channel has no messages in the window, skip it rather than sending an empty section
- If any single channel fails to load, print a warning and carry on with the others rather than crashing

Also show me the crontab line to run this every weekday at 8am, and explain how I'd host it free on Render or Hugging Face Spaces so it runs when my laptop is off.
```

> ✅ **Check your work:** Fill in your real channel IDs and run `python main.py`. Within about 20 seconds you should get a DM titled "Morning Briefing — *today's date*" with Urgent / Decisions Needed / FYI sections, and "Briefing sent!" in your console.

**2. Add the crontab line** so it runs tomorrow morning on its own. Use the absolute path to your virtual environment's Python — run the exact command manually once first to confirm it works before trusting cron with it.

**3. Now prove the point of `llm.py`.** Get a free key at [console.groq.com](https://console.groq.com), add `GROQ_API_KEY=...` to your `.env`, and change one line:

```
LLM_PROVIDER=groq
```

Run `python main.py` again.

> ✅ **Check your work:** You get the same briefing, generated by a completely different company's model, and you changed one line to do it. **Nothing in your agent code knew or cared.** That is the lesson of this session — remember it when a provider changes its pricing.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GEMINI_API_KEY is missing` | Your `.env` is not being loaded, or the key name is misspelled. `llm.py` reads it via `os.getenv` — make sure something calls `load_dotenv()` before your first `chat()` call. |
| Model-not-found error from Gemini | Model names change. Open AI Studio, copy the exact name of the current Flash model, and add `GEMINI_MODEL=that-name` to your `.env`. |
| Slack: `SlackApiError: not_in_channel` | Type `/invite @YourBotName` in each channel you want summarised. The bot can only read channels it has joined. |
| Slack: `SlackApiError: missing_scope` | Go back to OAuth & Permissions, add the missing scope, then **reinstall** the app to your workspace to apply the change. |
| Discord: bot connects but every message is empty | Message Content Intent is off. Turn it ON in the Bot tab of the Developer Portal and restart your script. |
| Rate-limit messages that never stop | `llm.py` retries five times, then tells you to switch. Set `LLM_PROVIDER=groq` in `.env` and run again. |
| Briefing arrives but is empty | Check your channel IDs, and confirm messages were posted in the last 24 hours. Post a few test messages and re-run. |
| The cron job never runs | Crontab needs an absolute path to your venv's Python. Run the exact command from your crontab entry manually first. |

## Add this to your portfolio

You just built a bot that reads your team's chat and hands you a prioritised briefing every morning — running on a free AI tier, with a provider layer that means you are not locked to any one company. Screenshot the DM it sent you and add it to your portfolio.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built an automated morning briefing bot in Python that reads the last 24 hours of messages from my team chat channels, uses an LLM to summarize them into Urgent / Decisions Needed / FYI sections, and delivers the briefing to my DMs on a daily schedule. I architected it with a provider abstraction layer so the underlying AI model can be swapped with a single config change, and it handles rate limits with exponential backoff.

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
- Your free Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A free AI assistant open in a browser tab
- A Google Cloud account (free tier is fine) with the Calendar API enabled
- A Google Calendar you can share with a service account
- A Gmail account with an App Password for sending mail

## By the end of this session

- Authenticate with Google Calendar via a service account — no browser login flow
- Combine two different data sources into one prompt
- Design a planning prompt that returns a real time-blocked schedule
- Reuse `llm.py` across a second project
- Get a daily plan emailed to you automatically every weekday morning

---

### Build 1 — Connect to Google Calendar (25 min)

Set up read-only access to your calendar without any browser login flow.

**1. Set up the service account.** In the Google Cloud Console, enable the **Google Calendar API**. Go to **IAM & Admin → Service Accounts**, create a service account, and download its JSON key as `service_account.json` into your project folder.

Then open Google Calendar → **Settings → Settings for my calendars → your calendar → Share with specific people**, and add the service account's email address with "See all event details". You will find that email inside the JSON key file as `client_email`.

**2. Paste this into your free AI assistant:**

```
Create calendar_reader.py for a Python project. It should:
1. Use google-auth and google-api-python-client to authenticate with service_account.json (read-only Calendar scope)
2. Have a get_today_events(calendar_id="primary") function that returns today's events as a list of {"summary": ..., "start": ..., "description": ...} dicts, handling both timed events (dateTime) and all-day events (date)
3. Convert event times to my local timezone before returning them
4. Print the result when run directly

Also tell me the pip install command for the packages it needs.
```

> ✅ **Check your work:** Run `calendar_reader.py` — it should print today's events with times matching what you see in Google Calendar. A permission error means the calendar is not shared with the exact service account email.

**Go further:** Try it on a day with no events and a day with several — confirm both work without errors.

---

### Build 2 — Add your tasks and build the planner (30 min)

**1. Create a `tasks.txt`** in your project folder, one task per line:

```
- Finish Q3 budget review
- Reply to vendor contract email
- Draft the team update
```

**2. Copy `llm.py`** from *Before you start* into this project folder too — same file, second project. Add a `.env` with your `GEMINI_API_KEY` and `LLM_PROVIDER=gemini`, then:

```bash
pip install google-genai groq python-dotenv google-auth google-api-python-client
python llm.py
```

> ✅ **Check your work:** `Provider: gemini` and a five-word greeting. Fix this before going further.

**3. Paste this into your AI assistant:**

```
Now build the planning layer for my daily planner agent.

I already have a working llm.py in this folder that exposes:
    chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str
Use that function for all AI calls. Do not import any AI SDK directly, and do not rewrite llm.py.

Please create:

1. tasks_reader.py with get_tasks_from_file(path="tasks.txt") that reads each non-empty line, strips leading "- " markers, and returns a list of task strings

2. planner.py with plan_day(events, tasks) that sends both lists to chat(), asking for:
   (1) a time-blocked schedule that fits my tasks around my meetings
   (2) the top 3 priorities with a sentence of reasoning each
   (3) two energy-management tips based on how busy the day looks
   Pass the "you are an executive assistant" role instruction as the `system` argument, not inside the prompt text. Handle the case where events or tasks are empty.

3. main.py that calls get_today_events(), get_tasks_from_file(), plan_day(), and prints the result
```

> ✅ **Check your work:** Run `main.py`. You should see a readable daily plan referencing your actual calendar events and `tasks.txt` items, with a clear top-three priority list.

**Go further:** If your calendar is packed, ask your assistant to have the planner also flag which tasks realistically will not fit today.

---

### Build 3 — Email it to yourself every morning (25 min)

**1. Generate a Gmail App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — Google blocks scripts using your normal password. Add `SMTP_USER` and `SMTP_PASS` to your `.env`.

**2. Paste this into your AI assistant:**

```
Finish my daily planner agent:

1. template.py with build_html(plan) that wraps the plan text in a simple HTML email (heading with today's date, plan content with line breaks preserved)
2. mailer.py with send_email(to_email, subject, html_body) using smtplib SMTP_SSL with smtp.gmail.com, reading SMTP_USER and SMTP_PASS from environment variables
3. Update main.py to build the HTML and call send_email() with subject "Your Daily Plan"

Then tell me the crontab line to run this at 6:30am on weekdays only.
```

> ✅ **Check your work:** Run `main.py` and check your inbox for a "Your Daily Plan" email with a readable, time-blocked schedule. Check spam if it does not arrive. Then add the crontab line.

**Go further:** Set `LLM_PROVIDER=groq` in your `.env` (with a free key from [console.groq.com](https://console.groq.com)) and run it again. Same planner, different company, one line changed — exactly as in Session 2.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "No events found" though your calendar clearly has events | `"primary"` is the *service account's* own empty calendar unless you shared yours with it. Confirm you added the service account email under Share with specific people, and try your actual calendar's ID. |
| Google returns a 403 | Either the calendar is not shared with the service account, or the Calendar API is not enabled on the project. Check both. The service account email is in the JSON key file as `client_email`. |
| Times in the email look wrong | Google Calendar returns times in UTC or the event's own zone. Convert to local before displaying — the Build 1 prompt asks for this, but confirm it happened. |
| `GEMINI_API_KEY is missing` | `.env` is not loaded or the name is misspelled. Make sure `load_dotenv()` runs before your first `chat()` call. |
| Rate-limit messages that never stop | Set `LLM_PROVIDER=groq` in `.env` and run again. |
| The email never arrives | Check spam, then confirm your Gmail App Password is correct. Your normal Google password will not work. |

## Add this to your portfolio

You just built an agent that reads your calendar, weighs it against your task list, and emails you a time-blocked plan before you wake up — on a free AI tier. Screenshot the email and add it to your portfolio.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

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

*Not student-facing. Remove before publishing.*

### What makes this version Claude-free

The previous guides assumed a paid Claude account at **two** separate points. Both are now closed:

| Where | Before | Now |
|---|---|---|
| **Runtime** — the AI inside the agent | `client = Anthropic()`, needs an API key with credits | `chat()` from `llm.py` → Gemini free tier |
| **Authoring** — writing the code | "Open Claude Code / paste into Claude" | Named free assistants, AI Studio recommended |

The authoring fix is the one that was missing from the earlier draft. Every prompt is now written to be assistant-agnostic, and each one states the `chat()` contract explicitly so the assistant does not reach for an SDK on its own.

### `llm.py` is tested, not guessed

The shim was written against the installed SDKs (`google-genai` 2.19.0, `groq` 1.6.0), with the API surface introspected rather than recalled. It passes 15 tests covering: missing-key errors, unknown provider, the Gemini success path, `system_instruction` and `max_output_tokens` plumbing, 429 → backoff → recovery, non-429 errors *not* being swallowed as rate limits, the exhausted-retry message, and the Groq path including system-message placement.

**It has not been run against a live API** — we have no key in the build environment. Someone must do one real call before this ships. That is the single highest-value verification step remaining.

`GEMINI_MODEL` is overridable by env var precisely because model names go stale; the default is a starting point, not a guarantee.

### Still outstanding

- **Verify free-tier limits** for Gemini and Groq. Figures quoted are directionally right, not freshly checked.
- **Run all three sessions end to end.** Session 3 is fastest (calendar → Gemini → email). Do not tell students a path works until someone has walked it.
- **Course #4's resource links render blank.** Its `resources` rows use `label`; `BuilderSession.jsx:334` and `AgentModal.jsx:226` both read `title`. Worth grepping the other 43 rows for the same drift.
- **Courses #3 and #11 omit the API key** from `whatYouNeed` while their existing Claude build steps require it. If those guides are kept as a paid second tab, fix the lists.
- **Course #11 has `test_it_out` set to `null`.**
- Nothing here has been written to `course_content`. That table is live paywalled content on a service-role-only write path.
