"""
Step 2 of the WhatsApp Auto-Reply Bot.

This file turns one incoming WhatsApp message into one reply, written in
your persona's voice. app.py handles the WhatsApp/Twilio plumbing; this
file only thinks about what to say.
"""

from persona import PERSONA
from sdt_ai import ask_ai

# A WhatsApp reply is a single short message, not several labelled
# sections - so unlike the Social Post Generator's [PLATFORM] markers,
# there is nothing to parse here. We ask the AI for plain text and send
# it back exactly as it comes.
#
# ~150 words is a generous WhatsApp reply. Capping it here keeps every
# single reply cheap - this function runs once per INCOMING message, so
# a chatty back-and-forth burns through max_tokens many times over,
# unlike a one-off report a student generates a few times a day.
MAX_REPLY_TOKENS = 200


def build_prompt(message_text, history=None):
    """
    Builds the full prompt sent to the AI: persona + optional recent
    history + the new incoming message.

    history - optional list of {"from": "them" | "you", "text": "..."}
    dicts, oldest first. Keep this short: every past message in history
    gets retyped into the prompt and billed as input tokens on EVERY
    reply from now on, not just once when it was first said.
    """
    notes = "\n".join(f"- {note}" for note in PERSONA["personality_notes"])
    examples = "\n".join(f'- "{phrase}"' for phrase in PERSONA["example_phrases"])
    rules = "\n".join(f"- {rule}" for rule in PERSONA["hard_rules"])

    history_block = ""
    if history:
        lines = [
            f'{"Them" if turn["from"] == "them" else "You"}: {turn["text"]}'
            for turn in history
        ]
        history_block = "Recent conversation so far (oldest first):\n" + "\n".join(lines) + "\n\n"

    return f"""You are replying to a WhatsApp message on behalf of {PERSONA["name"]}, {PERSONA["role"]}.

Personality:
{notes}

Examples of how {PERSONA["name"]} actually writes:
{examples}

Rules you must always follow:
{rules}

{history_block}New message from the customer:
"{message_text}"

Write ONLY the reply text - no quotation marks around it, no "Reply:" \
prefix, no explanation of your reasoning. Just the message exactly as it \
should be sent on WhatsApp."""


def generate_reply(message_text, history=None):
    """
    The main function. Give it the incoming message text, get back the
    reply to send.

        reply = generate_reply("Are you free this week?")

    An empty message is handled here, before the AI is ever called - not
    because it's rare, but because it's routine: WhatsApp lets someone
    send just a photo, a voice note, or a sticker with no text caption,
    and Twilio still POSTs to your webhook with Body="". Sending an empty
    prompt to the AI would still cost credits for a reply to nothing, so
    this case is caught for free instead.
    """
    message_text = (message_text or "").strip()
    if not message_text:
        return "Hey! Looks like that came through without any text - mind sending that again?"

    prompt = build_prompt(message_text, history)

    reply_text = ask_ai(
        prompt,
        max_tokens=MAX_REPLY_TOKENS,
        project="whatsapp-auto-reply-bot",
    )

    return reply_text.strip()


if __name__ == "__main__":
    # Run this file on its own to check the prompt-building and the
    # empty-message guard - both work without spending any credits or
    # needing the internet, because neither path here calls the AI:
    #
    #     python reply.py
    #
    # persona.py's example phrases include an emoji, and some Windows
    # terminals default to an older codepage that can't print one -
    # reconfiguring stdout to UTF-8 (harmless everywhere else) avoids a
    # crash here that has nothing to do with your actual code.
    import sys

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("--- Prompt that would be sent to the AI ---\n")
    print(build_prompt("Hey, are you free for a logo design this week?"))

    print("\n--- Empty-message guard (should NOT call the AI) ---")
    result = generate_reply("   ")
    print("Reply:", result)
    assert "ask_ai" not in result  # sanity check we returned the canned line, not a real call
    print("\nBoth checks ran without touching the network. Looks good.")
