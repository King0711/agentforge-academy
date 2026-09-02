"""
Social Dev AI Builder - your connection to the AI.

You do NOT need a ChatGPT Plus or Claude Pro subscription, and you do NOT
need an API key from any AI company. Your AI Builder credits come with
your course, and this file is what spends them.

SETUP (you only do this once, ever):

  1. Open your dashboard on socialdevtechnologies.com
  2. Go to Credits, and click "Copy my AI Builder key"
  3. In the same folder as this file, create a file named exactly:  .env
  4. Put ONE line inside it - paste your own key after the = sign:

         SDT_API_KEY=sdt_live_paste_your_own_key_here

  5. Never share that key or put it on GitHub. It spends YOUR credits.

That's it. Every project in this course uses this same file.
"""

import os

import requests
from dotenv import load_dotenv

# Reads the .env file sitting next to your project and loads SDT_API_KEY.
load_dotenv()

# Where your requests go. This is Social Dev's server, not an AI company's.
# It checks your credits, then talks to the AI for you.
GATEWAY_URL = "https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/ai-gateway"

# This one is safe to have in the code - it is a public key that only
# identifies the Social Dev project, not you. Your personal key is the
# one in .env.
PUBLIC_PROJECT_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcmZwdWNrdnltanBld2NzemdzIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3ODExMDk1MTQsImV4cCI6MjA5NjY4NTUxNH0."
    "Pv8MYd0zAQyk7tiConCLSUindSpMS83r4lY8dFU_5yE"
)


class AIError(Exception):
    """Something went wrong talking to the AI. The message explains what."""


def ask_ai(prompt, system=None, max_tokens=1000, project=None):
    """
    Send a question to the AI and get the answer back as text.

        answer = ask_ai("Write a haiku about Lagos traffic")
        print(answer)

    prompt      - what you want the AI to do. This is the important part.
    system      - optional. Sets the AI's role, e.g. "You are a careful editor."
    max_tokens  - roughly how long the answer may be. 1000 is plenty for most.
    project     - optional label so you can see usage per project later.

    Returns the AI's answer as a plain string.
    Raises AIError with a readable message if something is wrong.
    """
    api_key = os.environ.get("SDT_API_KEY")
    if not api_key:
        raise AIError(
            "No SDT_API_KEY found.\n"
            "Create a file named .env next to your code, containing:\n"
            "    SDT_API_KEY=sdt_live_your_key_here\n"
            "Copy your key from the Credits page on your dashboard."
        )

    payload = {"prompt": prompt, "max_tokens": max_tokens}
    if system:
        payload["system"] = system
    if project:
        payload["project"] = project

    try:
        response = requests.post(
            GATEWAY_URL,
            headers={
                "Authorization": f"Bearer {PUBLIC_PROJECT_KEY}",
                "X-SDT-Key": api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
        )
    except requests.RequestException:
        raise AIError(
            "Could not reach the AI server. Check your internet connection "
            "and try again. You were not charged any credits."
        )

    try:
        data = response.json()
    except ValueError:
        raise AIError(f"Unexpected reply from the AI server (status {response.status_code}).")

    # The server explains problems in plain English - show that message as-is
    # rather than a status code, because it is written to be read by you.
    if "error" in data:
        raise AIError(data["error"])

    return data["text"]


def ask_ai_detailed(prompt, **kwargs):
    """
    Same as ask_ai, but returns the whole reply including how many credits
    it cost. Useful while you are learning what things cost.

        result = ask_ai_detailed("Summarise this", max_tokens=200)
        print(result["text"])
        print("cost:", result["credits_charged"], "credits")
    """
    api_key = os.environ.get("SDT_API_KEY")
    if not api_key:
        raise AIError("No SDT_API_KEY found. See the setup notes at the top of sdt_ai.py.")

    payload = {"prompt": prompt}
    for name in ("system", "max_tokens", "project"):
        if name in kwargs and kwargs[name] is not None:
            payload[name] = kwargs[name]

    response = requests.post(
        GATEWAY_URL,
        headers={
            "Authorization": f"Bearer {PUBLIC_PROJECT_KEY}",
            "X-SDT-Key": api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=90,
    )
    data = response.json()
    if "error" in data:
        raise AIError(data["error"])
    return data


if __name__ == "__main__":
    # Running this file directly checks that your setup works.
    print("Testing your AI Builder connection...\n")
    try:
        result = ask_ai_detailed("Say hello in exactly five words.", max_tokens=50)
        print("The AI said:", result["text"])
        print("Credits used:", result["credits_charged"])
        print("\nYour setup works. You are ready to build.")
    except AIError as problem:
        print("Setup problem:\n")
        print(problem)
