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
