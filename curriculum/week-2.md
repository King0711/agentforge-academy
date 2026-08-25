# Builder 1 — Week 2

## Structuring

*Session guides · No paid AI account required*

---

## About this week

Week 1 was about moving information on a schedule. Week 2 is about **changing its shape**: messy input goes in, clean structured output comes out. Notes become minutes. A 40-page PDF becomes a one-page brief. A folder of scruffy text files becomes a spreadsheet.

This is the week your agents stop producing prose and start producing *data* — the thing other software can actually use.

| Session | Agent | Time | Main project |
|---|---|---|---|
| 1 | Meeting Notes Formatter | 60 min | ⭐ Yes |
| 2 | Document Summarizer | 60 min | No |
| 3 | Basic Data Extractor | 70 min | No |

Completing **Session 1 alone** earns your Week 2 certificate.

**Still free, still no card.** Same Gemini key, same free AI assistant for writing the code. If any step here seems to need a paid plan, that is a mistake in our instructions — tell us.

---

## New this week — upgrading `llm.py`

Week 1's `llm.py` does one thing: send text, get text. Session 3 needs something different — **guaranteed structured data**, not prose that happens to look like data.

So you are going to do something real engineers do constantly: **refactor your own tooling because a second requirement arrived.**

Replace your `llm.py` with the version below. It keeps `chat()` working exactly as before, adds `chat_json()`, and pulls the retry logic into one place all the functions share.

````python
"""
llm.py — one place to choose your AI provider.

    chat(prompt)              -> str    plain text back
    chat_json(prompt, schema) -> dict   structured data back      (Week 2)
    chat_turns(messages)      -> str    remembers a conversation  (Week 4)
"""
import json
import os
import random
import re
import time

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
MAX_RETRIES = 5

_client = None  # built once, on first use


class RateLimited(Exception):
    """The provider asked us to slow down. Handled for you automatically."""


class BadJSON(Exception):
    """The model returned something that wasn't valid JSON."""


# ── public API ────────────────────────────────────────────────────────────────

def chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str:
    """Send a prompt, get text back."""
    return _retry(lambda: _dispatch("text", prompt, system, max_tokens))


def chat_json(prompt: str, schema: dict, system: str = "", max_tokens: int = 1200) -> dict:
    """Send a prompt, get a Python dict back, shaped like `schema`.

    `schema` is a JSON Schema dict, e.g.
        {"type": "object",
         "properties": {"name": {"type": "string"},
                        "amount": {"type": "number"}},
         "required": ["name"]}
    """
    raw = _retry(lambda: _dispatch("json", prompt, system, max_tokens, schema=schema))
    return _parse_json(raw)


def chat_turns(messages: list, system: str = "", max_tokens: int = 1200) -> str:
    """Send a whole conversation, get the next reply. You'll use this in Week 4.

    `messages` is a list of {"role": "user"|"assistant", "content": "..."}
    """
    return _retry(lambda: _dispatch("turns", messages, system, max_tokens))


# ── retry wrapper ─────────────────────────────────────────────────────────────

def _retry(call):
    for attempt in range(MAX_RETRIES):
        try:
            return call()
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


def _dispatch(mode, payload, system, max_tokens, schema=None):
    if PROVIDER == "gemini":
        return _gemini(mode, payload, system, max_tokens, schema)
    if PROVIDER == "groq":
        return _groq(mode, payload, system, max_tokens, schema)
    raise ValueError(f"Unknown LLM_PROVIDER: {PROVIDER!r}. Use 'gemini' or 'groq'.")


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is missing. Add it to your .env file.")
    return value


def _parse_json(raw: str) -> dict:
    """Models sometimes wrap JSON in fences even when told not to."""
    text = raw.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.S)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise BadJSON(f"Model did not return valid JSON: {e}\nGot: {raw[:300]}") from e


# ── providers ─────────────────────────────────────────────────────────────────

def _gemini(mode, payload, system, max_tokens, schema):
    global _client
    from google import genai
    from google.genai import errors, types

    if _client is None:
        _client = genai.Client(api_key=_require("GEMINI_API_KEY"))

    kwargs = {"max_output_tokens": max_tokens, "system_instruction": system or None}
    if mode == "json":
        kwargs["response_mime_type"] = "application/json"
        kwargs["response_json_schema"] = schema

    if mode == "turns":
        # Gemini calls the assistant "model", not "assistant".
        contents = [
            types.Content(
                role="model" if m["role"] == "assistant" else "user",
                parts=[types.Part(text=m["content"])],
            )
            for m in payload
        ]
    else:
        contents = payload

    try:
        response = _client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config=types.GenerateContentConfig(**kwargs),
        )
    except errors.ClientError as e:
        if getattr(e, "code", None) == 429:
            raise RateLimited from e
        raise

    return (response.text or "").strip()


def _groq(mode, payload, system, max_tokens, schema):
    global _client
    import groq

    if _client is None:
        _client = groq.Groq(api_key=_require("GROQ_API_KEY"))

    messages = []
    if system:
        messages.append({"role": "system", "content": system})

    if mode == "turns":
        messages.extend({"role": m["role"], "content": m["content"]} for m in payload)
    elif mode == "json":
        messages.append({
            "role": "user",
            "content": f"{payload}\n\nReply with JSON matching this schema:\n"
                       f"{json.dumps(schema, indent=2)}",
        })
    else:
        messages.append({"role": "user", "content": payload})

    kwargs = {
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "messages": messages,
        "max_tokens": max_tokens,
    }
    if mode == "json":
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = _client.chat.completions.create(**kwargs)
    except groq.RateLimitError as e:
        raise RateLimited from e

    return (response.choices[0].message.content or "").strip()


if __name__ == "__main__":
    print(f"Provider: {PROVIDER}")
    print(chat("Say hello in exactly five words."))
````

> ✅ **Check your work:** `python llm.py` should still print a five-word greeting, exactly as it did in Week 1. Nothing you built last week should break.

**What `chat_json()` actually does.** Both Gemini and Groq have a mode that *constrains* the model's output to valid JSON — it is not "please return JSON and hope". Gemini takes your schema directly; Groq gets it in the prompt plus a JSON-only flag. `llm.py` handles that difference so your agent never has to.

It also strips markdown code fences before parsing, because models sometimes wrap their JSON in one anyway — even when the schema told them not to. That one detail will save you an afternoon.

### Rate limits stop being theoretical this week

Week 1's agents made one AI call a morning. This week, Session 2 makes one call *per chunk* of a long document, and Session 3 makes one *per file* in a folder. Twenty files is twenty calls in quick succession — and free tiers cap requests per minute.

You do not need to do anything: `llm.py` already waits and retries. But now you will actually see it happen, and you should understand what you are looking at rather than thinking something broke.

---

# Session 1 — Meeting Notes Formatter Agent

⭐ **Week 2 main project** · 60 minutes · Python · Free tier

## What you will build

A command-line tool that takes raw meeting notes — from a file, your clipboard, or pasted text — and returns polished Markdown minutes with attendees, decisions, and a proper action-item table. Optionally pushes the result straight into a Google Doc.

## What you need

- Python 3.10+ and your `llm.py` from above
- Your free Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A free AI assistant open in a browser tab
- A raw meeting transcript or messy bullet-point notes to test with
- *(Optional)* A Google Cloud account if you want the Google Docs export

## By the end of this session

- Turn messy notes into structured minutes with consistent sections every time
- Accept input from a file, the clipboard, or pasted text
- Save every set of notes automatically with a timestamped filename
- *(Optional)* Push finished notes straight into a Google Doc

---

### Build 1 — Build the core formatter (20 min)

**1. Set up the project.** New folder, copy in `llm.py`, and create a `.env`:

```
GEMINI_API_KEY=your_key_from_aistudio
LLM_PROVIDER=gemini
```

```bash
pip install google-genai groq python-dotenv pyperclip
python llm.py
```

> ✅ **Check your work:** `Provider: gemini` and a five-word greeting. Fix this before going further — everything else depends on it.

**2. Paste this into your free AI assistant:**

```
I'm building a "Meeting Notes Formatter" CLI tool in Python.

I already have a working llm.py in this folder that exposes:
    chat(prompt: str, system: str = "", max_tokens: int = 1200) -> str
Use that function for all AI calls. Do not import any AI SDK directly, and do not rewrite llm.py.

Please create formatter.py with format_notes(raw_notes: str) that sends the notes to chat() and returns structured Markdown minutes with these exact sections:

## Attendees
## Agenda
## Key Discussions
## Decisions Made
## Action Items   (as a table with columns: Task | Owner | Deadline)
## Next Meeting

Pass the "you are an executive assistant writing formal minutes" role instruction as the `system` argument, not inside the prompt text. Use max_tokens=1500.

If a section has no content in the source notes, still include the heading with "None recorded" underneath, so the output shape is always identical.

Also create requirements.txt with google-genai, groq, python-dotenv, and pyperclip.
```

> ✅ **Check your work:** Write three scruffy lines of fake meeting notes into a file, run `format_notes()` on it, and confirm you get all six headings back — even the ones your notes did not cover.

**Go further:** Ask your assistant to add a `--style` flag offering "formal" and "casual" tones, passed through as a different `system` argument.

---

### Build 2 — Build the CLI and save the output (20 min)

**Paste this into your assistant:**

```
Now add the input and output layers to my meeting notes tool:

1. input_handler.py with get_input_text(file_path=None, use_clipboard=False) that reads from a file path, the clipboard (via pyperclip), or stdin
2. output.py with save_markdown(content, prefix="meeting_notes") that saves the formatted notes to a timestamped .md file inside a /notes folder, creating the folder if needed
3. main.py using argparse with --input (file path), --clipboard (flag), and --export-docs (flag, for later). It should read the input, call format_notes(), save the result, and print where it saved to

If no input is given at all, print a helpful usage message rather than crashing.
```

> ✅ **Check your work:** Run `python main.py --input notes.txt`. You should get a timestamped `.md` file in `/notes` and a printed path. Copy some text and try `--clipboard` too.

---

### Build 3 — Add Google Docs export (20 min, optional)

Skip this if you did not do the Google Cloud setup — the tool is complete without it.

**1.** If you completed the Gmail Triage agent in Week 3, you will already have an `auth.py` OAuth helper you can reuse. If not, you will need a Google Cloud project with the Docs API enabled.

**2. Paste this into your assistant:**

```
Create docs_export.py with export_to_google_docs(title, content) that uses the Google Docs API to create a new Google Doc with the given title, inserts `content` as plain text, and returns the doc's edit URL.

Then update main.py so that when --export-docs is passed, it calls export_to_google_docs() with the formatted notes and prints the returned URL.

Tell me exactly which Google Cloud APIs and scopes I need to enable.
```

> ✅ **Check your work:** Run with `--export-docs` and open the URL it prints. Your minutes should be there.

**Go further:** Have the agent email the Google Doc link to every attendee it found in the notes.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GEMINI_API_KEY is missing` | Your `.env` is not loaded. Make sure `load_dotenv()` runs before the first `chat()` call. |
| Model-not-found error | Model names change. Copy the current Flash model name from AI Studio and add `GEMINI_MODEL=that-name` to `.env`. |
| Sections come back inconsistently | Your prompt is drifting. Put the exact heading list in the prompt and repeat that empty sections must still appear — models follow explicit shape instructions far better than implied ones. |
| The action-item table is not a real Markdown table | Say so explicitly: "a Markdown table with a header row and separator row". Show an example row in the prompt. |
| `pyperclip` errors on Linux | Install a clipboard backend: `sudo apt install xclip`. Or just use `--input` with a file. |

## Add this to your portfolio

You built a tool that turns fifteen minutes of scribbled notes into minutes you would actually send to a client. Screenshot a before-and-after and add it to your portfolio.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a command-line tool in Python that converts raw, unstructured meeting notes into professionally formatted Markdown minutes with attendees, decisions, and an action-item table. It accepts input from files, the clipboard, or stdin, saves timestamped output, and optionally exports directly to Google Docs. I built it on a provider abstraction layer so the underlying AI model can be swapped with a single config change.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 2 — Document Summarizer Agent

60 minutes · Python · Free tier

## What you will build

A tool you point at any PDF, Word document, URL, or text file. It works out what it is looking at, pulls the text, splits it into manageable pieces, and produces a structured brief: executive summary, key points, action items, entities mentioned.

This is the session where you learn **map-reduce** — the standard technique for handling documents larger than one AI call can comfortably take.

## What you need

- Python 3.10+ and your `llm.py`
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A PDF or Word document to test with — a contract, report, or long article works well

## By the end of this session

- Extract text from PDFs, Word docs, URLs, or plain text with one interface
- Split long documents into chunks that never cut mid-sentence
- Summarise each chunk, then summarise the summaries
- Get a structured final report every time
- Watch rate-limit backoff do its job on a real workload

---

### Build 1 — Build the extractors (20 min)

**Paste this into your assistant:**

```
I'm building a document summarizer in Python that handles PDFs, Word docs, URLs, and plain text files.

I already have a working llm.py exposing chat(prompt, system="", max_tokens=1200) -> str. Use it for all AI calls; don't import an AI SDK directly.

Please create:
1. requirements.txt with google-genai, groq, python-dotenv, pypdf, python-docx, requests, beautifulsoup4
2. router.py with detect_type(source: str) returning "url" if it starts with http(s), "pdf" if it ends in .pdf, "docx" if it ends in .docx, otherwise "text"
3. extractors.py with extract_pdf(path), extract_docx(path), extract_url(url) (strip script/style/nav/footer tags, keep paragraph text), and extract_text(path)

Each extractor should raise a clear, human-readable error if the file is missing or unreadable — not a raw library traceback.
```

> ✅ **Check your work:** Run each extractor on a real file and print the first 300 characters. If a PDF returns almost nothing, it is probably a scanned image rather than real text — try a different document.

---

### Build 2 — Build the map-reduce summarizer (25 min)

This is the heart of the session.

**Paste this into your assistant:**

```
Now create the summarization layer:

1. chunker.py with chunk_text(text, max_chars=16000) that splits text into chunks along paragraph boundaries, never mid-sentence, each under max_chars

2. summarizer.py with:
   - summarize_chunk(chunk) — asks chat() for 5-8 bullet points, max_tokens=500
   - summarize_document(text) — chunks the text, summarizes each chunk, combines those summaries, then asks chat() for a final structured report with these sections: Executive Summary, Key Points, Action Items, Entities Mentioned (max_tokens=1200)

Print progress as it goes ("Summarizing chunk 2 of 7...") so I can see it working on long documents.

If the whole document fits in one chunk, skip the combining step and summarize it directly.
```

> ✅ **Check your work:** Run it on a long PDF. You should see the progress lines tick up, then a structured report. **If you see "Rate limited — waiting 1.4s"** appear between chunks, that is `llm.py` doing exactly its job — let it run.

**Understanding what you just built.** Map-reduce means: summarise each piece (map), then summarise the summaries (reduce). It exists because early AI models could only read a few thousand words at a time.

Modern models can read far more — Gemini could often swallow your whole document in one call. So why chunk?

Three reasons, and they are worth knowing: **cost** (you pay per token; summarising summaries is cheaper), **attention** (models reason more reliably over shorter passages than enormous ones), and **scale** (a 900-page document still will not fit, whatever the model). Chunking is a technique you choose, not a limitation you suffer.

**Go further:** Add a `--max-chars` flag and try 4000 versus 30000 on the same document. Compare the summaries. Which is better? That question has no fixed answer, and noticing *why* is the actual skill.

---

### Build 3 — Wire it into one command (15 min)

**Paste this into your assistant:**

```
Create main.py that ties everything together: takes a file path or URL as a command-line argument, uses router.py to detect the type, extracts text with the matching function from extractors.py, prints the detected type and character count, then prints the result of summarize_document().

Handle the case where extraction returns empty text — print a clear message explaining the file may be a scanned image, rather than sending an empty prompt to the AI.
```

> ✅ **Check your work:** `python main.py report.pdf` and `python main.py https://some-long-article.com` should both produce a structured brief.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| PDF extraction returns almost nothing | The PDF is a scanned image, not text. OCR is out of scope here — test with a text-based PDF. |
| Lots of rate-limit waiting on long documents | Expected and handled. To go faster, raise `max_chars` so there are fewer chunks, or switch to `LLM_PROVIDER=groq`. |
| The final summary contradicts itself | Chunks are being summarised without context of each other. Ask your assistant to include the document title and a one-line description in every chunk prompt. |
| URL extraction returns navigation menus and cookie banners | Your tag-stripping is too gentle. Ask for `<article>` or `<main>` content first, falling back to `<p>` tags. |
| `BadJSON` error | You are on the wrong function — this session uses `chat()`, not `chat_json()`. |

## Add this to your portfolio

You built a tool that reads a 40-page document and hands back a one-page brief. Screenshot the input and output side by side.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a document summarization tool in Python that accepts PDFs, Word documents, URLs, or plain text, automatically detects the source type, and uses a map-reduce summarization pipeline to produce a structured brief with an executive summary, key points, action items, and named entities. It chunks long documents along paragraph boundaries and handles API rate limits with exponential backoff.

Help me write:
1. A 2-3 sentence project description for my portfolio site
2. A short LinkedIn post announcing it
3. Three resume-style bullet points describing what I built and the skills it shows
```
</details>

---
---

# Session 3 — Basic Data Extractor Agent

70 minutes · Python · Free tier

## What you will build

A batch tool that takes a folder of messy text files — emails, invoices, notes — and turns them into one clean CSV. You define the fields you want; the agent finds them in every file and validates that nothing is missing.

Then you do something most people learning this never do: **you measure how accurate it actually is.**

## What you need

- Python 3.10+ and your **upgraded** `llm.py` (the one with `chat_json()`)
- Your free Gemini API key
- A free AI assistant open in a browser tab
- A folder of 5–10 sample text files to extract from
- Basic familiarity with pandas/CSV

## By the end of this session

- Define a custom extraction schema for exactly the fields you care about
- Get guaranteed-valid structured data back, not prose you have to parse
- Batch-process a whole folder into one CSV
- Measure your extraction accuracy against known answers
- Compare two AI models on the same task and pick with evidence

---

### Build 1 — Define your schema and build the extractor (25 min)

**1. Decide your fields.** Look at 2–3 of your sample documents and list the 4–6 things you want pulled out. Be specific about types — "amount as a number, not a string with a currency symbol".

**2. Confirm your `llm.py` is the upgraded one:**

```bash
python -c "from llm import chat_json; print('chat_json is ready')"
```

> ✅ **Check your work:** If that prints an ImportError, you are still on Week 1's `llm.py`. Go back to *New this week* and replace it.

**3. Paste this into your assistant** (substituting your own fields):

```
I want to extract structured data from text documents using chat_json() from my existing llm.py.

llm.py exposes:
    chat_json(prompt: str, schema: dict, system: str = "", max_tokens: int = 1200) -> dict
where `schema` is a JSON Schema dict. It returns a parsed Python dict and raises BadJSON if the model misbehaves. Use it for all AI calls — do not import an AI SDK and do not rewrite llm.py.

My fields are:
- person_name: Full name of the primary person mentioned, or null
- company: Company name mentioned, or null
- date: Any date mentioned, in YYYY-MM-DD format, or null
- amount: Any monetary amount as a NUMBER (no currency symbols), or null
- email: Any email address mentioned, or null
- summary: One-sentence summary of the document's purpose

Please create:
1. schema.py with EXTRACTION_SCHEMA as a JSON Schema dict describing exactly those fields, with correct types and nullability
2. extractor.py with extract_data(text: str) -> dict that calls chat_json() with that schema and returns the result

Nulls matter: the schema must allow null for missing fields rather than forcing the model to invent values.
```

> ✅ **Check your work:** Run `extract_data()` on one file and print the dict. Every one of your fields should be present — with `None` where the document genuinely had nothing, not a guess.

**Why this beats asking for JSON in a prompt.** `chat_json()` uses the provider's *constrained output* mode. The model is not politely asked for JSON — it is prevented from producing anything else. That is the difference between a demo and something you would run unattended on a folder of 500 files.

---

### Build 2 — Validate and export to CSV (20 min)

**Paste this into your assistant:**

```
Now add validation and export to my extraction tool:

1. validator.py with validate_record(record) that ensures every key in EXTRACTION_SCHEMA is present, filling in None for any that are missing
2. input_handler.py with read_input(source) that reads a file if source is a valid path, otherwise treats it as raw text
3. exporter.py with export_csv(records, output_path="extracted_data.csv") that converts a list of dicts to a pandas DataFrame and writes it to CSV, with columns in the same order as my schema

Add pandas to requirements.txt.
```

> ✅ **Check your work:** Extract from three files, export, and open the CSV. Column order should match your schema, and empty cells should be genuinely empty — not the text "None".

---

### Build 3 — Batch the folder, then measure it (25 min)

**1. Put your sample files in a `documents/` folder. Paste this into your assistant:**

```
Create main.py with process_folder(folder_path) that loops over every .txt file in the folder, reads it, extracts data, validates the record, adds a source_file field with the filename, and collects everything into a list.

If one file fails (BadJSON or any other error), print a warning naming the file and carry on with the rest — one bad document must not kill a 200-file run.

Add a short pause between files so we stay inside free-tier rate limits.

In the main block, call process_folder("documents"), export with export_csv(), and print how many records were saved and how many failed.
```

> ✅ **Check your work:** Run it. You should get a CSV with one row per file and a count printed. Deliberately put one garbage file in the folder and confirm the run survives it.

**2. Now measure the accuracy.** Pick 5 documents and write down what each field *should* be.

```
Create test_accuracy.py that reads a ground_truth.json file — a list of {"file": ..., "expected": {field: value, ...}} — runs extract_data() on each file, compares each expected field to the extracted value (case-insensitive, trimmed), and prints:
- overall field-level accuracy as a percentage
- a per-field breakdown so I can see which fields are hardest
- a list of specific mismatches showing expected vs actual
```

> ✅ **Check your work:** Run it. You now have a number — say 87% — instead of a feeling.

**3. Compare two models and choose with evidence.** Get a free Groq key at [console.groq.com](https://console.groq.com), add `GROQ_API_KEY` to `.env`, then run your accuracy test twice:

```bash
LLM_PROVIDER=gemini python test_accuracy.py
LLM_PROVIDER=groq   python test_accuracy.py
```

> ✅ **Check your work:** Two accuracy numbers on the identical task, and you changed nothing but one environment variable.

**This is the most valuable half-hour in Builder 1.** Most people choose AI models on vibes or on whichever one they heard about most recently. You just chose one on evidence, for your specific task, with a repeatable test you can re-run whenever a new model appears. That skill outlasts every model named in this course.

**Go further:** Add a third run with a smaller/faster model and plot accuracy against speed. The best model is rarely the biggest one — it is the cheapest one that clears your accuracy bar.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ImportError: cannot import name 'chat_json'` | You are on Week 1's `llm.py`. Replace it with the version in *New this week*. |
| `BadJSON` on a particular file | That document probably contains something that confused the model. `llm.py` includes the raw text in the error — read it. Usually the fix is a clearer field description in your schema. |
| Amounts come back as `"₦4,200"` instead of `4200` | Your schema says string. Set the type to `number` and say "no currency symbols or separators" in the field description. |
| Every field comes back `null` on some files | Check the file actually has content — `read_input()` may be silently reading an empty file. |
| Lots of rate-limit waiting during batch runs | Expected. Increase the pause between files, or switch to `LLM_PROVIDER=groq`. |
| Accuracy is lower than you hoped | Good — that is information. Look at the per-field breakdown: usually one or two fields drag the average down, and a sharper description fixes them. |

## Add this to your portfolio

You built a batch extraction pipeline **and** measured how well it works. The measurement is the part that impresses people — screenshot your accuracy breakdown alongside the CSV.

<details>
<summary>Need help writing it up? Paste this into any free AI assistant</summary>

```
I built a batch data-extraction pipeline in Python that processes folders of unstructured text documents into a clean CSV using constrained JSON output from an LLM, with schema validation, per-file error isolation, and rate-limit handling. I also built an accuracy harness that scores extraction against a ground-truth set field by field, which I used to benchmark two different models on the same task and select one on measured accuracy rather than reputation.

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

All three Week 2 builds were **pure LLM swaps** — the only paid dependency was the Anthropic key. No third-party service needed replacing. Runtime moves to `chat()`/`chat_json()`; authoring moves from "paste into Claude" to any free assistant.

### `llm.py` v2 is tested

The upgraded shim was written against the installed SDKs (`google-genai` 2.19.0, `groq` 1.6.0) with the API surface introspected, not recalled. Test results:

- **19/19** on the new functions — `chat_json()` schema plumbing (`response_mime_type` + `response_json_schema` on Gemini, `response_format` + in-prompt schema on Groq), markdown-fence stripping, `BadJSON` on malformed output, `chat_turns()` role mapping, 429 → backoff → recovery on the new paths.
- **15/15 regression** — Week 1's `chat()` suite passes unchanged against the refactored file, so nobody's Week 1 agents break.

One detail worth knowing if you ever touch `_gemini()`: **Gemini calls the assistant role `"model"`, not `"assistant"`.** The shim maps it; a hand-rolled implementation would silently produce a broken conversation.

**Still not run against a live API** — no key in the build environment. One real call before this ships to students.

### Deliberate content additions

- **Session 2's "why chunk at all"** — the original taught map-reduce without explaining that modern context windows make it a choice rather than a necessity. Students who do not know that will cargo-cult chunking forever.
- **Session 3's model comparison** — extends the existing `test_accuracy.py` step into an A/B across two providers. This is the strongest teaching moment in Builder 1 and it costs nothing to run.
- **Error isolation in batch runs** — the original had no guidance on one bad file killing a long run.

### Metadata that needs updating (not edited here — it ships live)

In `src/data/agentsBeginner.js`, these still advertise Claude:

| Agent | Current `techStack` | Should become |
|---|---|---|
| #5 Meeting Notes | `Python \| Claude API \| Google Docs API` | `Python \| Gemini (free) \| Google Docs API` |
| #8 Document Summarizer | `Python \| Claude API \| PyPDF2` | `Python \| Gemini (free) \| pypdf` |
| #12 Data Extractor | `Python \| Claude API \| pandas` | `Python \| Gemini (free) \| pandas` |

Note #8 also names **PyPDF2**, which is deprecated — the guide above uses `pypdf`.

### Still outstanding

- Live API call to verify the wire, not just the structure.
- Free-tier limits quoted are directionally right, not freshly checked.
- Nothing written to `course_content`.
