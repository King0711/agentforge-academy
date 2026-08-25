# Calendar & Task Prioritiser Agent

*Self-contained build guide · No paid Claude account required*

---

## What you will build

A morning automation that pulls today's Google Calendar events and your open task list, asks an AI to prioritise your day, and emails you a time-blocked schedule with your top three priorities and energy-management tips — before 7am.

This is one session from a larger free-tier curriculum. It stands on its own — everything you need is in this one document.

## Before you start

**Two different AI accounts are involved here, and neither needs to be paid:**

1. **The assistant that writes your code** — any free AI chat account works. A **free Claude.ai account** is completely fine for this; so is Google AI Studio, Gemini, or ChatGPT's free tier. Every prompt below is written to work with whichever one you use — just paste it in and get code back.
2. **The AI inside the finished agent** — this runs on **Google Gemini's free tier**, via a small file called `llm.py` that you set up once below. This is what actually runs every morning; it is separate from whichever assistant helped you write the code.

If any step below ever seems to require a paid plan, that's a mistake in these instructions — the whole thing is designed to run on $0.

## What you need

- Python 3.10+ installed locally
- A free Google AI Studio account — [aistudio.google.com](https://aistudio.google.com), no credit card
- A free AI assistant open in a browser tab (Claude.ai free tier, AI Studio, Gemini, or ChatGPT free)
- A Google Cloud account (free tier is fine) with the Calendar API enabled
- A Google Calendar you can share with a service account
- A Gmail account with an App Password for sending mail

## By the end

- Authenticate with Google Calendar via a service account — no browser login flow
- Combine two different data sources into one prompt
- Design a planning prompt that returns a real time-blocked schedule
- Get a daily plan emailed to you automatically every weekday morning

---

## Set up `llm.py` first

Every step below that talks to AI goes through one small file. Create a project folder, and inside it create `llm.py` with exactly this content — **copy it as-is, do not ask your assistant to write this one file, it's already written and tested for you:**

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

Then, in the same folder, create a `.env` file:

```
GEMINI_API_KEY=your_key_from_aistudio
LLM_PROVIDER=gemini
```

Get your key at **[aistudio.google.com](https://aistudio.google.com)** → click **Get API key**. Ninety seconds, no card.

Install what it needs and test it before building anything else:

```bash
pip install google-genai groq python-dotenv
python llm.py
```

> ✅ **Check your work:** You should see `Provider: gemini` and a five-word greeting. If you get `GEMINI_API_KEY is missing`, your `.env` isn't set up right. If you get a model-not-found error, open AI Studio, copy the exact name of the current Flash model, and add `GEMINI_MODEL=that-name` to your `.env`. **Don't move on until this works** — everything below depends on it.

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

**Go further:** Set `LLM_PROVIDER=groq` in your `.env` (with a free key from [console.groq.com](https://console.groq.com)) and run it again. Same planner, different company, one line changed. That's the entire reason `llm.py` exists.

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
