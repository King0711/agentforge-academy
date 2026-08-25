# Testing the Week 1–4 guides

Two things are worth testing, and they are different jobs.

## 1. Smoke-test `llm.py` (2 minutes)

This is the file every agent in Builder 1 depends on. It has passed 34 automated
tests against mocked SDKs, but **it has never made a real API call** — there was no
key in the environment where it was written. This is the check that closes that gap.

```bash
# 1. Get a free Gemini key (no credit card): https://aistudio.google.com -> "Get API key"

# 2. Set up
pip install google-genai groq python-dotenv
export GEMINI_API_KEY="paste_your_key_here"

# 3. Run it
python llm.py
```

**Expected:** `Provider: gemini` followed by a five-word greeting.

If you get a model-not-found error, model names have moved on. Open AI Studio, copy
the current Flash model name, and:

```bash
export GEMINI_MODEL="whatever-the-current-flash-model-is"
```

Then test the other two functions:

```bash
python -c "
from llm import chat_json, chat_turns
print(chat_json('Extract: Acme Ltd was invoiced 4200 naira.',
      {'type':'object',
       'properties':{'company':{'type':'string'},'amount':{'type':'number'}},
       'required':['company','amount']}))
print(chat_turns([
      {'role':'user','content':'Do you deliver to Enugu?'},
      {'role':'assistant','content':'Yes, we deliver nationwide.'},
      {'role':'user','content':'How much is it?'}]))
"
```

**Expected:** a Python dict like `{'company': 'Acme Ltd', 'amount': 4200}`, then a reply
that understands "it" means delivery to Enugu. If the second reply asks "how much is
what?", conversation memory is broken.

To check the Groq fallback path, get a free key at https://console.groq.com and repeat
with `LLM_PROVIDER=groq`.

## 2. Walk a full session (30–90 minutes)

Reading a guide will not tell you whether a student can follow it. Someone has to
actually do one, start to finish, without skipping steps.

**Fastest to verify:** Week 1 Session 3 (Calendar & Task Prioritiser) — calendar read,
one AI call, one email. About 45 minutes and it exercises the whole chain.

**Most valuable to verify:** Week 3 Session 1 (Gmail Triage) — it is a main project, it
uses `chat_json()`, and OAuth setup is where students get stuck.

**Most likely to have problems:** Week 4 Session 1 (Auto-Reply Bot) — the heaviest
rewrite, with a new platform (Telegram), a new host (Render), and a language change.

Watch for anything a guide assumes but does not say. That is what breaks people, and it
is invisible when you already know the answer.

## What is already verified

- `llm.py` structure against the real installed SDKs (`google-genai` 2.19.0, `groq` 1.6.0),
  with the API surface introspected rather than recalled — 34/34 tests
- Every markdown document: fence balance, `<details>` pairing, and every Python block
  parses
- The code embedded in `week-2.md` is AST-identical to the tested file

## What is not

- **No live API call has been made.** Section 1 above fixes that.
- **Free-tier limits** quoted in the guides are directionally right, not freshly checked.
- **No session has been walked end to end** by a person.
