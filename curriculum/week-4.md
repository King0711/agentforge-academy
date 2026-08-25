# Builder 1 — Week 4

## Outward-Facing

*Session guides · No paid AI account required*

---

## About this week

The first three weeks built agents that worked *for you* — briefings you read, documents you summarised, emails you triaged. Everything stayed inside your own account.

**Week 4 is different. This week other people talk to what you built.**

That changes the engineering. Your agent now has to hold a conversation, stay in character, admit when it does not know something, and keep running when you are asleep. It also means someone other than you can break it — or spend your quota.

| Session | Agent | Time | Main project |
|---|---|---|---|
| 1 | Personal Auto-Reply Bot | 110 min | ⭐ Yes |
| 2 | Simple FAQ Chatbot | 70 min | No |
| 3 | Social Media Post Generator | 50 min | No |

Completing **Session 1 alone** earns your Week 4 certificate — and finishes Builder 1.

---

## New this week — conversations that remember

Sessions 1 and 2 both need something the previous weeks did not: **memory across turns.** A bot that answers "what did I just ask you?" with a blank stare is not a bot anyone will use twice.

You already have the function. `chat_turns()` came with the Week 2 upgrade:

```python
from llm import chat_turns

conversation = [
    {"role": "user",      "content": "Do you deliver to Enugu?"},
    {"role": "assistant", "content": "Yes, we deliver nationwide."},
    {"role": "user",      "content": "How much is it?"},
]

reply = chat_turns(conversation, system="You are a helpful support agent.")
```

That third question — "How much is it?" — is meaningless on its own. `chat_turns()` sends the whole exchange, so the model knows "it" means delivery to Enugu.

> ✅ **Check your work:** Run the snippet above. If you get `ImportError`, you are still on an older `llm.py` — go back to Week 2's *New this week* and replace it.

**One detail the shim handles for you.** Different providers name the roles differently — Gemini calls the assistant `"model"` while Groq calls it `"assistant"`. Your code writes `"assistant"` either way and `llm.py` translates. Hand-rolling this is exactly where people produce a bot that silently forgets half the conversation.

### Two habits for public-facing agents

**Cap the history.** Every turn you send costs tokens, and conversations grow forever. Keep the last 10–20 messages, not all of them.

**Assume strangers will find it.** A bot with a public URL can be used by anyone who finds that URL — including bots that crawl for them. On a free tier, that is your quota they are spending. Both sessions below address this.

---

# Session 1 — Personal Auto-Reply Bot

⭐ **Week 4 main project** · 110 minutes · Python · Free tier

## What you will build

A messaging bot that receives real messages from real people, understands what they are asking, and replies in *your* voice using a persona file you write. It remembers the conversation, and it runs 24/7 in the cloud after you close your laptop.

> **We build this on Telegram, not WhatsApp.** Telegram's Bot API is free permanently, needs no business verification, and takes about two minutes to set up. WhatsApp charges per message once you leave the sandbox, and requires a Meta Business account. The mechanism you learn — webhook in, persona, AI reply, send out — is identical, and Build 4 shows you what changing platform would involve.

## What you need

- Python 3.10+ and your upgraded `llm.py` (with `chat_turns()`)
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A Telegram account on your phone
- A free [Render](https://render.com) or [Hugging Face Spaces](https://huggingface.co/spaces) account for deployment

## By the end of this session

- Create a messaging bot and connect it to your code
- Give it a persona so replies sound like you, not like a chatbot
- Keep conversation context so follow-up questions make sense
- Deploy it so it runs when your laptop is closed
- Know exactly what it would take to move it to another platform

---

### Build 1 — Create your bot and connect it (25 min)

**1. Create the bot.** Open Telegram and message **@BotFather**. Send `/newbot`, pick a name and a username ending in `bot`. BotFather replies with a token that looks like `123456789:ABCdef...`. **That token is a password — treat it like one.**

**2. Set up the project.** New folder, copy in `llm.py`, and create a `.env`:

```
GEMINI_API_KEY=your_key_from_aistudio
LLM_PROVIDER=gemini
TELEGRAM_TOKEN=the_token_from_botfather
```

```bash
pip install google-genai groq python-dotenv python-telegram-bot
python llm.py
```

> ✅ **Check your work:** `Provider: gemini` and a five-word greeting.

**3. Paste this into your free AI assistant:**

```
I'm building a Telegram bot in Python using python-telegram-bot (v20+, the async API).

I have a working llm.py exposing:
    chat_turns(messages: list, system: str = "", max_tokens: int = 1200) -> str
where messages is a list of {"role": "user"|"assistant", "content": "..."}.
Use it for all AI calls. Do not import an AI SDK directly and do not rewrite llm.py.

For this first build, just get the plumbing working:

Create bot.py that:
- Loads TELEGRAM_TOKEN from .env
- Starts a bot with polling (not webhooks — that comes later)
- Has a /start handler replying "I'm awake."
- Has a message handler that echoes back whatever text it receives, prefixed with "You said: "
- Prints every incoming message to the console so I can see it working

Explain the difference between polling and webhooks and why polling is the right choice while developing.
```

> ✅ **Check your work:** Run `bot.py`, open Telegram, find your bot by its username, and send it a message. You should get an echo back and see it in your terminal. **Do not move on until this round trip works** — everything else builds on it.

---

### Build 2 — Give it a persona and a brain (30 min)

**1. Write your persona.** Create `persona.txt`. This is the file that makes the bot sound like you rather than like customer support:

```
You are replying to messages on behalf of [your name], a [your role].

Tone: friendly, concise, slightly informal. Keep replies under 50 words.

Rules:
- If asked about pricing, say you'll send a quote within 24 hours.
- If asked about availability, say you'll check your calendar and get back to them.
- Never commit to exact dates or prices.
- If you don't know something, say so plainly and offer to pass it to [your name].
- Never claim to be a human. If asked directly, say you're an assistant.
```

**2. Paste this into your assistant:**

```
Now add the AI layer to my Telegram bot.

Replace the echo handler so that it:
- Loads persona.txt once at startup and passes it as the `system` argument to chat_turns()
- Keeps a separate conversation history per Telegram chat_id, stored in a dict
- Appends each incoming user message to that chat's history, calls chat_turns(), appends the reply, and sends the reply back
- Caps each chat's stored history to the last 20 messages so it doesn't grow forever
- Shows a "typing" indicator while the AI is thinking
- If chat_turns() raises, replies with a friendly "Sorry, I'm having trouble right now — try again in a moment" rather than crashing or leaking a stack trace

Add a /reset command that clears the history for that chat.
```

> ✅ **Check your work:** Message the bot three times in a row where the third message only makes sense given the first two — e.g. "Do you build websites?" → "How much?" → "And how long?". If it answers the last two sensibly, memory is working.

**Read the replies critically.** Do they sound like you, or like a generic assistant? The persona file is a prompt, and tuning it is the real work of this session. Be specific — "concise" is weak, "under 50 words, no bullet points, never start with 'Certainly'" is strong.

**A word on honesty.** The persona above includes *never claim to be a human*. Keep that. A bot that pretends to be you when someone asks directly is a problem — legally in some places, and reputationally everywhere.

---

### Build 3 — Deploy it so it runs 24/7 (35 min)

Polling works while your terminal is open. To run permanently, deploy it.

**Paste this into your assistant:**

```
Help me deploy this Telegram bot to Render's free tier so it runs 24/7:

1. The exact git commands to push this project to a new GitHub repo
2. A .gitignore that excludes .env, token files, and __pycache__
3. What kind of Render service this needs (it's a long-running process, not a web server that receives requests — tell me which service type is correct and why)
4. Which environment variables to set in the Render dashboard
5. Any file Render needs that I don't have yet

Important: my .env must never be committed. Walk me through setting the variables in Render's dashboard instead.

Also explain what happens on Render's free tier when the service is idle, and whether that affects a polling bot.
```

> ✅ **Check your work:** Once deployed, **close your laptop entirely** and message the bot from your phone. If it replies, you have shipped something that exists independently of you. That is a genuinely different feeling from everything else in this course.

**Go further:** Hugging Face Spaces is a good alternative and is generous with always-on free compute. Try deploying there too and compare.

---

### Build 4 — What moving to WhatsApp would take (20 min)

You do not have to build this. Read it, and understand what changes and what does not.

Ask your assistant:

```
I have a working Telegram bot in Python that uses a persona file and conversation history via chat_turns() from my llm.py.

Explain what would need to change to run the same bot on WhatsApp via the Twilio API:
1. Which parts of my code stay exactly the same
2. Which parts change, and how
3. What it costs — be specific about Twilio's per-message pricing beyond the sandbox
4. What business verification Meta requires for a production WhatsApp bot

Don't write the code. I want to understand the shape of the change and the cost before deciding.
```

> ✅ **Check your work:** You should be able to answer, in one sentence: *which parts of my bot were platform-specific, and which were not?*

**This is the actual lesson of Build 4.** Your persona file, your history management, your `llm.py`, and your error handling are all platform-independent. Only the receive-and-send layer is Telegram-specific — maybe thirty lines. **You built a bot, not a Telegram bot.** That is what good structure buys you, and it is the same reason swapping AI providers costs you one line.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Bot never responds in Telegram | Check the token, and that `bot.py` is actually running. BotFather's `/mybots` shows whether the token is still valid. |
| `Conflict: terminated by other getUpdates request` | Two copies are polling the same bot — usually a local run plus a deployed one. Stop one. |
| The bot forgets everything between messages | Your history dict is being recreated per message. It must live outside the handler function. |
| Replies are far too long | The persona says "concise", which models read loosely. Give a hard number and a `max_tokens` cap. |
| Replies sound like a generic chatbot | Add examples to `persona.txt`. Two or three real messages you have actually sent will beat any amount of adjectives. |
| Works locally, dead after deploy | Almost always missing environment variables in the host's dashboard. Check the deploy logs first. |
| Rate-limit waiting under load | Expected if several people message at once. Switch to `LLM_PROVIDER=groq` for faster free throughput. |

## Add this to your portfolio

You built something other people can talk to, running in the cloud, in your voice. Screenshot a real conversation.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a conversational messaging bot in Python that receives messages via the Telegram Bot API, maintains per-conversation context with a capped history window, and replies using a configurable persona file so responses match a specific voice. It's deployed to run 24/7, handles AI provider failures gracefully, and is structured so the messaging platform and the AI provider can each be swapped without touching the core logic.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 2 — Simple FAQ Chatbot

70 minutes · Python · Free tier

## What you will build

A web-based chatbot that answers questions from your own FAQ — and, crucially, **admits when it does not know** and offers to hand over to a human. Deployed free on the web with a URL you can share.

> **This is not RAG.** You will hear that term a lot. RAG means storing documents in a vector database and retrieving relevant chunks per question. You do not need it here — your whole FAQ fits comfortably in the system prompt. No embeddings, no vector database, no Pinecone account. Builder 2 covers RAG properly, for when your knowledge base is too big to fit. Knowing *when you don't need* a technique is worth as much as knowing the technique.

## What you need

- Python 3.10+ and your upgraded `llm.py` (with `chat_turns()`)
- Your free Gemini API key
- A free AI assistant open in a browser tab
- 20–30 question/answer pairs for your business (or placeholders)
- A free [Streamlit Cloud](https://share.streamlit.io) account and a GitHub account

## By the end of this session

- Turn an FAQ into a knowledge base the AI answers from
- Build a multi-turn chat interface
- Add a graceful "I don't know — let me connect you to a human" fallback
- Deploy it live on the web for free
- Understand what a public bot exposes you to

---

### Build 1 — Write your FAQ and build the brain (20 min)

**1. Write `faq.json`** — 20–30 question/answer pairs covering your most common topics:

```json
[
  {"question": "What are your delivery times?",
   "answer": "3-5 working days nationwide, next-day within Lagos."},
  {"question": "Do you offer refunds?",
   "answer": "Yes, within 14 days of delivery, unopened."}
]
```

If you do not have real FAQs yet, write placeholders for a fictional business — the flow is what matters today.

**2. Set up** and confirm `llm.py`:

```bash
pip install google-genai groq python-dotenv streamlit
python llm.py
```

**3. Paste this into your assistant:**

```
I'm building a Streamlit FAQ chatbot in Python. I have faq.json with question/answer pairs.

I have a working llm.py exposing:
    chat_turns(messages: list, system: str = "", max_tokens: int = 1200) -> str
where messages is a list of {"role": "user"|"assistant", "content": "..."}.
Use it for all AI calls. Do not import an AI SDK directly and do not rewrite llm.py.

Please create:
1. requirements.txt with streamlit, google-genai, groq, python-dotenv
2. context.py with build_system_prompt(faq_path="faq.json") that loads the FAQ and returns a system prompt instructing the assistant to answer ONLY from that knowledge base — and, when the answer isn't there, to say it doesn't have that information and offer to connect the user with a human. It must never guess or invent policy.
3. responder.py with get_response(system_prompt, history) that calls chat_turns() with the history and system prompt, using max_tokens=400

Cap the history passed to the model at the last 20 messages.
```

> ✅ **Check your work:** `python -c "from context import build_system_prompt; print(build_system_prompt()[:300])"` should print the start of a prompt containing a couple of your real Q&A pairs.

**Then test the boundary.** Ask it something clearly outside the FAQ. If it invents an answer, your system prompt is too soft — say explicitly: *"If the answer is not in the knowledge base above, you must say you don't have that information. Never guess."*

---

### Build 2 — Build the chat interface (25 min)

**Paste this into your assistant:**

```
Create app.py — a Streamlit chat app that:
- Sets the page title to "FAQ Assistant" with a 🤖 icon
- Initializes st.session_state.messages as an empty list if not present
- Builds the system prompt once using context.py and caches it with st.cache_data
- Renders conversation history with st.chat_message
- Uses st.chat_input to accept new questions
- On each new message, calls get_response() with the full history and renders the reply
- Caps stored history to the last 20 messages
- Shows a spinner while waiting for the AI
- If get_response() raises, shows a friendly error in the chat rather than a Streamlit traceback
```

> ✅ **Check your work:** `streamlit run app.py`. Ask something in your FAQ — it should answer correctly. Ask something unrelated — it should admit it does not know. Then ask a follow-up that depends on your previous question, to confirm memory works.

---

### Build 3 — Add human handoff and deploy (25 min)

**1. Paste this into your assistant:**

```
Update app.py so that after each assistant reply, it checks whether the reply contains phrases like "don't have that information" or "connect you with a human". If so, show an st.info box saying "Need more help?" with a mailto link to my support email.

Also log every unanswered question to a local file called gaps.txt with a timestamp.
```

**That `gaps.txt` file is the most valuable output of this session.** After a week it tells you exactly which questions your FAQ is missing — real demand, in your customers' own words. Most businesses guess at this. You will know.

**2. Deploy it. Paste this into your assistant:**

```
Walk me through deploying this Streamlit app to share.streamlit.io for free:
1. The exact git commands to push this project to a new GitHub repo
2. A .gitignore excluding .env and __pycache__
3. How to create a new app on Streamlit Cloud pointed at app.py
4. How to add GEMINI_API_KEY as a Streamlit secret, and the code to read it from st.secrets with a fallback to os.getenv for local development
```

> ✅ **Check your work:** Open your live URL on your phone and have a conversation with it.

**3. Now think about who else can open that URL.** Anyone with the link can use your bot, and every message spends your free quota. Nobody is likely to attack a small FAQ bot — but crawlers find public URLs, and a shared link travels.

Before you post the link anywhere public, ask your assistant:

```
My Streamlit FAQ chatbot is deployed publicly and uses my personal free-tier AI key. What are the simplest ways to limit exposure? Cover: a simple shared password with st.secrets, per-session message caps in st.session_state, and what each does and doesn't protect against.
```

Pick one and add it. **Understanding that a public endpoint is a spending endpoint is a real engineering lesson**, and it applies to every hosted thing you build from here.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Bot invents answers not in the FAQ | Strengthen the system prompt with an explicit refusal instruction. Models default to helpfulness over accuracy unless told otherwise. |
| Bot forgets the previous question | You are passing only the latest message. Pass the full (capped) history to `chat_turns()`. |
| App reloads and history vanishes | Streamlit reruns the script on every interaction — anything not in `st.session_state` is lost. |
| Deployed app can't find the API key | Streamlit Cloud uses secrets, not `.env`. Read `st.secrets` first, fall back to `os.getenv` locally. |
| First load after inactivity takes ~30 seconds | Normal on Streamlit Cloud's free tier — the app sleeps when idle. |
| Rate-limit waiting with several users | Expected on a free tier. Switch to `LLM_PROVIDER=groq`, or add the per-session cap from step 3. |

## Add this to your portfolio

You deployed a live chatbot anyone can talk to. Share the URL, screenshot a conversation including a graceful "I don't know".

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built and deployed a customer-facing FAQ chatbot using Streamlit and an LLM, with multi-turn conversation memory, a knowledge base loaded from structured FAQ data, and a graceful human-handoff fallback when a question falls outside its scope. It logs unanswered questions so the FAQ can be improved from real demand, and includes access controls to protect the API quota on a public endpoint.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 3 — Social Media Post Generator

50 minutes · Python · Free tier

## What you will build

Paste in a URL or a topic, pick a tone, and get five platform-optimised posts back — LinkedIn, Twitter/X, Instagram, Facebook, Threads — each respecting that platform's length, tone, and hashtag conventions. With copy buttons, because you will actually use this one.

## What you need

- Python 3.10+ and your `llm.py`
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A blog post or article URL to test with

## By the end of this session

- Pull clean text out of any article URL
- Generate five genuinely different posts from one source
- Control tone and brand voice from the interface
- Ship a tool you will keep using

---

### Build 1 — Build the article scraper (15 min)

```bash
pip install google-genai groq python-dotenv streamlit requests beautifulsoup4
python llm.py
```

**Paste this into your assistant:**

```
I'm building a Streamlit app that generates social media posts from articles.

I have a working llm.py exposing chat(prompt, system="", max_tokens=1200) -> str. Use it for AI calls; don't import an AI SDK directly.

Please create scraper.py with scrape_article(url: str) that:
- Fetches the page with a realistic User-Agent header
- Removes script, style, nav, footer, header, and aside tags
- Prefers <article> or <main> content if present, falling back to all <p> tags
- Returns up to 8000 characters of clean text
- Returns an empty string on failure rather than raising, and prints a clear warning
```

> ✅ **Check your work:** Run it on a real article and print the first 300 characters. You should see article prose — not menus or cookie banners.

---

### Build 2 — Generate posts for five platforms (20 min)

**Paste this into your assistant:**

```
Create prompts.py and generator.py for my social post generator.

prompts.py should have build_prompt(content, tone, brand_voice) returning a prompt that asks for 5 posts from the content:
- LinkedIn: professional, 3-5 short paragraphs, ends with a question, 3-5 hashtags
- Twitter/X: under 280 characters, punchy, 1-2 hashtags
- Instagram: caption style, emoji-friendly, 5-8 hashtags at the end
- Facebook: conversational, 2-3 short paragraphs
- Threads: casual and direct, under 500 characters

Ask for the platforms separated by a clear delimiter I can split on reliably.

generator.py should have generate_posts(content, tone, brand_voice) that calls chat() with max_tokens=2000, splits the response by platform, and returns a dict keyed by platform name. If a platform is missing from the response, include it with a placeholder rather than raising a KeyError.

Pass the "you are a social media manager" instruction as the `system` argument.
```

> ✅ **Check your work:** Generate from a real article. **Count the characters on the Twitter post.** If it is over 280, tighten the prompt — models treat length limits as suggestions unless you are firm.

---

### Build 3 — Build the interface (15 min)

**Paste this into your assistant:**

```
Create app.py — a Streamlit app titled "📱 Social Media Post Generator" with wide layout:
- A text area where users paste a URL or raw article text
- A selectbox for tone: Formal, Casual, Inspiring, Educational
- A text input for optional brand voice notes
- A "Generate Posts" button that scrapes if the input starts with "http", otherwise uses it as raw text, then calls generate_posts()
- Displays the 5 results in tabs, each with a character count and a st.code block so there's a built-in copy button
- Shows a spinner while generating and a friendly message if scraping returns nothing
```

> ✅ **Check your work:** Run it, paste a URL, generate. Then actually post one. The test of this tool is whether you would use its output unedited.

**Go further:** Add a "regenerate this one" button per tab so you can reroll a single platform without redoing all five.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Scraper returns navigation and cookie text | Prefer `<article>`/`<main>` before falling back to `<p>` tags. |
| Twitter posts exceed 280 characters | Put the limit in the prompt as a hard rule *and* validate after generation — regenerate that one if it is over. |
| All five posts sound identical | Your prompt is not differentiating enough. Give each platform its own voice description, not just a length. |
| Splitting the response fails | Your delimiter is too fragile. Use something unmistakable like `===LINKEDIN===`. |
| Scraping fails on some sites | Some render content with JavaScript. Paste the text directly instead — the app already supports that. |

## Add this to your portfolio

This is the most immediately useful thing in Builder 1. Screenshot the interface with real generated posts.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a Streamlit app that turns any article URL or block of text into five platform-optimized social media posts, each respecting the target platform's length limits, tone conventions, and hashtag norms, with configurable tone and brand voice and one-click copy for each output.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

## You just finished Builder 1

Twelve agents. Four certificates. Nothing paid.

Look at what carried across all four weeks: **one `llm.py`**. You wrote it in Week 1, extended it once in Week 2, and every agent since has used it without caring which company answers. You can switch providers in one line — which means no vendor's pricing decision can break what you built.

That is the actual skill. The agents were the excuse to learn it.

---
---

## Appendix — notes for the team

*Not student-facing. Remove before publishing.*

### The big change: #2 is now Telegram, not WhatsApp

The original had **three** paid or dead dependencies stacked in one session: Twilio (per-message beyond sandbox), Railway (free tier removed), and the Anthropic key. It was the single most expensive build in Builder 1 and the hardest to complete free.

| Was | Now | Why |
|---|---|---|
| Twilio WhatsApp | **Telegram Bot API** | Free permanently, no business verification, ~2 min setup |
| Railway | **Render / HF Spaces** | Railway's free tier no longer exists |
| Node.js | **Python** | Reuses the student's existing `llm.py`; keeps the whole tier in one language |
| Claude API | `chat_turns()` → Gemini free | |
| Stateless replies | Per-chat history, capped at 20 | The original had no memory at all — a notable quality upgrade |

**Build 4 is new**: instead of dropping WhatsApp silently, it has students *analyse* what porting to WhatsApp would cost. That keeps the original topic honest, teaches platform-independence, and surfaces Twilio's real pricing rather than pretending it does not exist.

**Naming decision needed — your call.** The session is titled "Personal Auto-Reply Bot" here, but the site calls it "WhatsApp Auto-Reply Bot" with slug `whatsapp-auto-reply-bot`. Options:
1. **Keep the slug, change the display title** — no broken URLs, no SEO loss. Recommended.
2. Change both — cleaner, but breaks existing links and loses any ranking on the WhatsApp term.
3. Keep both names as-is and let Build 4 explain the difference.

Note there is also a separate public `WhatsAppBotGuide.jsx` lead-magnet page (Groq + `whatsapp-web.js`) which is unaffected.

### Session 2 (#6) — what changed

- Runtime → `chat_turns()`. **No Pinecone, no embeddings** — the original was already not RAG, but never said so. Students who do not know that will over-engineer every future chatbot.
- Added `gaps.txt` logging of unanswered questions. Genuinely useful, costs one line.
- Added the **public-endpoint-is-a-spending-endpoint** section. The original deployed a public bot on the student's personal key with no discussion of it.

### Session 3 (#7) — straight swap

Runtime → `chat()`. Streamlit was already free. Added `<article>`/`<main>` preference to the scraper and post-generation length validation for the 280-char limit.

### Metadata that needs updating (not edited here — it ships live)

In `src/data/agentsBeginner.js`:

| Agent | Current `techStack` | Should become |
|---|---|---|
| #2 Auto-Reply Bot | `Node.js \| Twilio \| Claude API` | `Python \| Telegram \| Gemini (free)` |
| #6 FAQ Chatbot | `Python \| Claude API \| Streamlit` | `Python \| Gemini (free) \| Streamlit` |
| #7 Social Post Generator | `Python \| Claude API \| Streamlit` | `Python \| Gemini (free) \| Streamlit` |

#2's `prerequisites` also names "Basic JavaScript/Node.js" and "Twilio account", and its `description` names WhatsApp and Twilio. All need revisiting alongside the naming decision above.

### Builder 1 is now complete and free

All twelve agents across all four weeks run on free tiers, and all four week-certificates are earnable with no card. `llm.py` is the through-line: introduced Week 1, extended Week 2, used unchanged in Weeks 3 and 4.

### Still outstanding across all four weeks

- **Live API call.** Structure is verified against the real SDKs (34/34 tests), but no call has gone over the wire — there is no key in the build environment. **This is the highest-value remaining check.**
- **Free-tier limits** quoted throughout are directionally right, not freshly verified.
- **Nothing written to `course_content`.** All four documents are drafts for review.
- Pre-existing bugs noted in earlier weeks: #4's `resources` using `label` where both renderers read `title`; #11's null `test_it_out`.
