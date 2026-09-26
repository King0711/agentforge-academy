"""
Social Dev Technologies - your connection to the AI.

You have TWO ways to power this file. Pick ONE and set it in your .env:

  AI_PROVIDER=gemini    -> your own FREE Google Gemini API key
  AI_PROVIDER=claude    -> your own Claude/Anthropic API key

Every project in this course calls ask_ai(...) the exact same way no
matter which one you pick - this file is the only place that changes.

SETUP - OPTION 1: Gemini (free, no billing needed):

  1. Go to https://aistudio.google.com/apikey and sign in with any Google
     account. Click "Create API key" - free, no card required.
  2. In the same folder as this file, create a file named exactly: .env
  3. Put these two lines inside it:

         AI_PROVIDER=gemini
         GEMINI_API_KEY=paste_your_own_key_here

SETUP - OPTION 2: Claude (if you already have a paid Claude account):

  1. Go to https://console.anthropic.com/settings/keys and create an API
     key. This needs billing set up on your Anthropic account - it is a
     separate thing from a claude.ai Pro subscription, and is billed by
     Anthropic based on what you actually use.
  2. In your .env file, put these two lines instead:

         AI_PROVIDER=claude
         ANTHROPIC_API_KEY=paste_your_own_key_here

Never share either key or put it on GitHub - each one is billed to YOUR
account. That's it. Every project in this course reuses this same file.
"""

import os
import time

import requests
from dotenv import load_dotenv

# Reads the .env file sitting next to your project and loads your keys.
load_dotenv()

# "gemini-flash-latest" is Google's name for whatever its newest Flash model
# is, so this file keeps working when Google retires an older model - which
# it does regularly. You can pin one specific model with GEMINI_MODEL=... in
# your .env, but if you ever get a "not available" error, delete that line.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Gemini "thinks" before it answers, and that hidden thinking counts toward
# the same token limit as the answer itself. With a small max_tokens (the
# 50-300 used for short replies in this course) the thinking could use up
# the whole limit and the answer would come back empty. So this file turns
# thinking down to its minimum (these projects don't need it) and gives
# Gemini this many extra tokens on top of your max_tokens for whatever
# thinking is left.
THINKING_ALLOWANCE = 1024

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

# Both AIs occasionally answer "overloaded" during busy periods (Gemini's
# free tier especially). That's not your code being wrong - retrying a
# couple of times almost always gets a real answer, so it's built in here
# rather than left for every project to handle separately.
MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 3


class AIError(Exception):
    """Something went wrong talking to the AI. The message explains what."""


def _get_provider():
    """
    Reads AI_PROVIDER from .env. Falls back to guessing from whichever key
    is actually present, so forgetting to set AI_PROVIDER explicitly
    doesn't crash a setup that only has one key configured.
    """
    provider = os.environ.get("AI_PROVIDER", "").strip().lower()
    if provider in ("gemini", "claude"):
        return provider

    if os.environ.get("GEMINI_API_KEY"):
        return "gemini"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "claude"

    raise AIError(
        "No AI provider configured.\n"
        "Add ONE of these pairs to your .env file:\n\n"
        "    AI_PROVIDER=gemini\n"
        "    GEMINI_API_KEY=paste_your_free_key_here\n\n"
        "  ...or...\n\n"
        "    AI_PROVIDER=claude\n"
        "    ANTHROPIC_API_KEY=paste_your_own_key_here\n\n"
        "Get a free Gemini key at https://aistudio.google.com/apikey"
    )


def _ask_gemini(prompt, system=None, max_tokens=1000):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise AIError(
            "AI_PROVIDER is set to gemini but no GEMINI_API_KEY was found.\n"
            "Get a free key at https://aistudio.google.com/apikey and add "
            "it to .env:\n"
            "    GEMINI_API_KEY=paste_your_own_key_here"
        )

    generation_config = {"maxOutputTokens": max_tokens + THINKING_ALLOWANCE}
    # thinkingBudget 0 = "as little thinking as possible". Pro models can't
    # turn thinking down and reject this setting, so it's left off for them.
    if "-pro" not in GEMINI_MODEL:
        generation_config["thinkingConfig"] = {"thinkingBudget": 0}

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    if system:
        payload["systemInstruction"] = {"parts": [{"text": system}]}

    url = GEMINI_URL_TEMPLATE.format(model=GEMINI_MODEL)
    # The key goes in a header rather than the URL, so it never shows up in
    # an error message or traceback you might paste somewhere for help.
    headers = {"x-goog-api-key": api_key}

    last_problem = "no response"
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=90)
        except requests.RequestException:
            raise AIError(
                "Could not reach Gemini. Check your internet connection and try again."
            ) from None

        if response.status_code in (500, 503):
            last_problem = f"Gemini is busy ({response.status_code} - high demand on the free tier)"
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY_SECONDS)
            continue

        if response.status_code == 429:
            raise AIError(
                "Gemini says you've hit the free tier's rate limit. Wait a "
                "minute and try again - the free tier only allows a "
                "limited number of requests per minute."
            )

        if response.status_code == 404:
            if os.environ.get("GEMINI_MODEL"):
                advice = (
                    "Your .env file sets GEMINI_MODEL - delete that line so this "
                    "file uses its default model, then try again."
                )
            else:
                advice = "Check the course page for an updated copy of sdt_ai.py."
            raise AIError(
                f'Gemini says the model "{GEMINI_MODEL}" isn\'t available to your '
                f"API key - Google retires older models.\n{advice}\n"
                f"Details: {response.text[:300]}"
            )

        if response.status_code == 400:
            # If a future Gemini model ever refuses the thinking setting
            # above, ask again without it instead of failing.
            if "thinkingConfig" in generation_config and "thinking" in response.text.lower():
                del generation_config["thinkingConfig"]
                last_problem = "Gemini rejected the thinking setting"
                continue
            raise AIError(
                f"Gemini rejected the request - double check your GEMINI_API_KEY "
                f"is correct: {response.text[:300]}"
            )

        if response.status_code != 200:
            raise AIError(
                f"Gemini returned an error (status {response.status_code}): {response.text[:300]}"
            )

        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            block_reason = (data.get("promptFeedback") or {}).get("blockReason")
            if block_reason:
                raise AIError(f"Gemini refused the prompt ({block_reason}). Try rephrasing it.")
            raise AIError(f"Unexpected reply from Gemini: {data}")
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason")

        # A response can come back with no text because Gemini's safety
        # filters blocked it (finishReason == "SAFETY"), not because of a
        # network problem - so this is not retried like the cases above.
        if finish_reason == "SAFETY":
            raise AIError("Gemini declined to answer (safety filter). Try rephrasing your prompt.")

        # An answer can arrive split across several parts, so join them all.
        # Any part marked "thought" is Gemini's thinking, not its answer.
        parts = (candidate.get("content") or {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts if not part.get("thought"))
        if not text:
            if finish_reason == "MAX_TOKENS":
                raise AIError(
                    "Gemini ran out of room before it wrote any answer - its thinking "
                    f"used up all {generation_config['maxOutputTokens']} tokens it was "
                    "allowed. Raise max_tokens in this ask_ai(...) call (try "
                    f"max_tokens={max(max_tokens * 2, 4000)}) and run it again."
                )
            raise AIError(
                f"Gemini sent back an empty answer (finishReason: {finish_reason}). "
                "Try again, or rephrase your prompt."
            )

        usage = data.get("usageMetadata") or {}
        return {
            "text": text,
            "input_tokens": usage.get("promptTokenCount"),
            "output_tokens": usage.get("candidatesTokenCount"),
        }

    raise AIError(
        f"Gemini was unavailable after {MAX_ATTEMPTS} tries ({last_problem}). "
        "This happens sometimes on the free tier during high demand - wait "
        "a minute and try again."
    )


def _ask_claude(prompt, system=None, max_tokens=1000):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIError(
            "AI_PROVIDER is set to claude but no ANTHROPIC_API_KEY was found.\n"
            "Create one at https://console.anthropic.com/settings/keys and "
            "add it to .env:\n"
            "    ANTHROPIC_API_KEY=paste_your_own_key_here"
        )

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        payload["system"] = system

    last_problem = "no response"
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": ANTHROPIC_VERSION,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=90,
            )
        except requests.RequestException:
            raise AIError(
                "Could not reach Claude. Check your internet connection and try again."
            ) from None

        # 529 is Anthropic's "overloaded" - like Gemini's 503, a retry
        # usually works.
        if response.status_code in (500, 503, 529):
            last_problem = f"Claude is busy ({response.status_code} - overloaded)"
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY_SECONDS)
            continue

        try:
            data = response.json()
        except ValueError:
            raise AIError(f"Unexpected reply from Claude (status {response.status_code}).") from None

        if response.status_code == 401:
            raise AIError(
                "Claude rejected your ANTHROPIC_API_KEY - double check it was copied correctly."
            )

        if response.status_code == 429:
            raise AIError("Claude says you've hit your rate or usage limit. Wait a moment and try again.")

        if response.status_code == 404:
            if os.environ.get("CLAUDE_MODEL"):
                advice = (
                    "Your .env file sets CLAUDE_MODEL - delete that line so this "
                    "file uses its default model, then try again."
                )
            else:
                advice = "Check the course page for an updated copy of sdt_ai.py."
            raise AIError(
                f'Claude says the model "{CLAUDE_MODEL}" isn\'t available to your '
                f"API key.\n{advice}"
            )

        if "error" in data or response.status_code != 200:
            error = data.get("error") or {}
            message = error.get("message") if isinstance(error, dict) else str(error)
            raise AIError(
                f"Claude returned an error (status {response.status_code}): "
                f"{message or str(data)[:300]}"
            )

        text = "".join(
            block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"
        )
        if not text:
            raise AIError(
                f"Claude sent back an empty answer (stop_reason: {data.get('stop_reason')}). "
                "Try again, or rephrase your prompt."
            )

        usage = data.get("usage") or {}
        return {
            "text": text,
            "input_tokens": usage.get("input_tokens"),
            "output_tokens": usage.get("output_tokens"),
        }

    raise AIError(
        f"Claude was unavailable after {MAX_ATTEMPTS} tries ({last_problem}). "
        "Wait a minute and try again."
    )


def ask_ai_detailed(prompt, system=None, max_tokens=1000, project=None):
    """
    Same as ask_ai, but returns the whole reply as a dict.

        result = ask_ai_detailed("Summarise this", max_tokens=200)
        print(result["text"])
    """
    provider = _get_provider()
    if provider == "gemini":
        return _ask_gemini(prompt, system=system, max_tokens=max_tokens)
    return _ask_claude(prompt, system=system, max_tokens=max_tokens)


def ask_ai(prompt, system=None, max_tokens=1000, project=None):
    """
    Send a question to the AI and get the answer back as text.

        answer = ask_ai("Write a haiku about Lagos traffic")
        print(answer)

    prompt      - what you want the AI to do. This is the important part.
    system      - optional. Sets the AI's role, e.g. "You are a careful editor."
    max_tokens  - roughly how long the answer may be. 1000 is plenty for most.
    project     - unused, kept so call sites read the same across every
                  project regardless of which AI is behind this file.

    Works identically whichever provider your .env is set to - every
    project in this course calls this one function and never needs to
    know which AI is actually answering.

    Returns the AI's answer as a plain string.
    Raises AIError with a readable message if something is wrong.
    """
    return ask_ai_detailed(prompt, system=system, max_tokens=max_tokens, project=project)["text"]


if __name__ == "__main__":
    # Running this file directly checks that your setup works.
    print("Testing your AI connection...\n")
    try:
        provider = _get_provider()
        model = GEMINI_MODEL if provider == "gemini" else CLAUDE_MODEL
        result = ask_ai_detailed("Say hello in exactly five words.", max_tokens=50)
        print(f"Provider: {provider} ({model})")
        print("The AI said:", result["text"])
        print("\nYour setup works. You are ready to build.")
    except AIError as problem:
        print("Setup problem:\n")
        print(problem)
