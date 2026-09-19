"""
Social Dev Technologies - your connection to the AI.

You do NOT need a ChatGPT Plus or Claude Pro subscription, and you do NOT
need to pay for anything. This project runs on Google's Gemini API, which
has a free tier that's enough for everything you'll build in this course.

SETUP (you only do this once, ever):

  1. Go to https://aistudio.google.com/apikey and sign in with any Google
     account. Click "Create API key" - it's free, no card required.
  2. In the same folder as this file, create a file named exactly:  .env
  3. Put ONE line inside it - paste your own key after the = sign:

         GEMINI_API_KEY=paste_your_own_key_here

  4. Never share that key or put it on GitHub.

That's it. Every project in this course uses this same file.
"""

import os
import time

import requests
from dotenv import load_dotenv

# Reads the .env file sitting next to your project and loads GEMINI_API_KEY.
load_dotenv()

# Overridable via .env (GEMINI_MODEL=...) if you ever want to try a
# different one - gemini-2.5-flash is the default because it's the model
# that has actually held up under free-tier load when we've tested this;
# newer "flash" models sometimes return 503 "high demand" far more often
# on the free tier. If that happens to you, add GEMINI_MODEL=gemini-2.5-flash
# (or check https://ai.google.dev/gemini-api/docs/models for a current
# fallback) to your .env.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# The free tier occasionally answers 503 ("model overloaded") during busy
# periods. That's not your code being wrong - retrying a couple of times
# almost always gets a real answer, so it's built in here rather than left
# for every project to handle separately.
MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 3


class AIError(Exception):
    """Something went wrong talking to the AI. The message explains what."""


def _endpoint(api_key):
    return (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={api_key}"
    )


def ask_ai(prompt, system=None, max_tokens=1000, project=None):
    """
    Send a question to the AI and get the answer back as text.

        answer = ask_ai("Write a haiku about Lagos traffic")
        print(answer)

    prompt      - what you want the AI to do. This is the important part.
    system      - optional. Sets the AI's role, e.g. "You are a careful editor."
    max_tokens  - roughly how long the answer may be. 1000 is plenty for most.
    project     - optional label, kept so call sites read the same across
                  every project regardless of which AI is behind this file.

    Returns the AI's answer as a plain string.
    Raises AIError with a readable message if something is wrong.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise AIError(
            "No GEMINI_API_KEY found.\n"
            "Get a free key at https://aistudio.google.com/apikey, then "
            "create a file named .env next to your code containing:\n"
            "    GEMINI_API_KEY=your_key_here"
        )

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    last_problem = "no response"
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.post(_endpoint(api_key), json=body, timeout=90)
        except requests.RequestException:
            raise AIError(
                "Could not reach Gemini. Check your internet connection and try again."
            )

        if response.status_code == 503:
            last_problem = "Gemini is busy (503 - high demand on the free tier)"
            time.sleep(RETRY_DELAY_SECONDS)
            continue

        if response.status_code == 429:
            raise AIError(
                "Gemini says you've hit the free tier's rate limit. Wait a "
                "minute and try again - the free tier only allows a "
                "limited number of requests per minute."
            )

        if response.status_code == 400:
            raise AIError(
                f"Gemini rejected the request - double check your GEMINI_API_KEY "
                f"is correct: {response.text[:300]}"
            )

        if response.status_code != 200:
            raise AIError(f"Gemini returned an error (status {response.status_code}): {response.text[:300]}")

        data = response.json()
        try:
            candidate = data["candidates"][0]
        except (KeyError, IndexError):
            raise AIError(f"Unexpected reply from Gemini: {data}")

        # A response can come back with no text because Gemini's safety
        # filters blocked it (finishReason == "SAFETY"), not because of a
        # network problem - so this is not retried like the cases above.
        if candidate.get("finishReason") == "SAFETY":
            raise AIError("Gemini declined to answer (safety filter). Try rephrasing your prompt.")

        try:
            return candidate["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise AIError(f"Unexpected reply shape from Gemini: {data}")

    raise AIError(
        f"Gemini was unavailable after {MAX_ATTEMPTS} tries ({last_problem}). "
        "This happens sometimes on the free tier during high demand - wait "
        "a minute and try again."
    )


def ask_ai_detailed(prompt, **kwargs):
    """
    Same as ask_ai, but returns a dict instead of a plain string. Kept for
    projects that expect this shape - Gemini's free tier has no per-request
    cost to report, so this just wraps the text.

        result = ask_ai_detailed("Summarise this", max_tokens=200)
        print(result["text"])
    """
    return {"text": ask_ai(prompt, **kwargs)}


if __name__ == "__main__":
    # Running this file directly checks that your setup works.
    print("Testing your Gemini connection...\n")
    try:
        result = ask_ai("Say hello in exactly five words.", max_tokens=50)
        print("The AI said:", result)
        print("\nYour setup works. You are ready to build.")
    except AIError as problem:
        print("Setup problem:\n")
        print(problem)
