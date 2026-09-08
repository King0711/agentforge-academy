"""
Step 2 of the Simple FAQ Chatbot.

This file builds the prompt that turns the AI into a chatbot that only
knows what's in your FAQ - and, just as importantly, admits when a
question isn't covered instead of guessing.
"""

from sdt_ai import ask_ai

# The single most important instruction in this whole project. Language
# models are trained to be helpful, and their default instinct when they
# don't actually know something is to guess a plausible-sounding answer
# rather than say "I don't know" - a well-documented failure mode called
# hallucination. Telling the AI, in plain words, that it is ALLOWED and
# EXPECTED to say "I don't know" is the fix. Skip this instruction and you
# will get confident, wrong answers about your own business - see the
# hallucination entry in the README troubleshooting notes.
SYSTEM_INSTRUCTIONS = (
    "You are a helpful customer support assistant. Answer the customer's "
    "question using ONLY the FAQ content below - do not use any outside "
    "knowledge, and do not guess. If the question is not answered by the "
    "FAQ, say plainly that you don't have that information and suggest "
    "they contact the business directly. Keep answers short and friendly."
)

# Phrases the AI tends to use (because SYSTEM_INSTRUCTIONS asks it to)
# when the FAQ doesn't cover a question. Used only to decide whether to
# show a "still stuck?" nudge in the chat UI - it is NOT what keeps the
# AI honest, SYSTEM_INSTRUCTIONS is. A missed phrase here just means the
# nudge doesn't show up; the AI's own reply is shown to the customer
# either way.
UNKNOWN_PHRASES = [
    "don't have that information",
    "do not have that information",
    "don't know",
    "do not know",
    "not sure",
    "can't answer",
    "cannot answer",
    "not covered",
    "isn't in the faq",
    "not in the faq",
    "contact us directly",
    "contact the business directly",
]


def build_prompt(faq_text, question, history=None):
    """
    Assembles the full prompt sent to the AI: instructions + the FAQ +
    recent conversation + the new question.

        prompt = build_prompt(faq_text, "What are your opening hours?")

    Keeping this separate from the network call means you can print
    exactly what the AI is being asked - the fastest way to work out
    why an answer came back wrong or oddly worded.
    """
    history = history or []

    conversation = ""
    if history:
        lines = [
            f"{'Customer' if turn['role'] == 'user' else 'You'}: {turn['content']}"
            for turn in history
        ]
        conversation = "\n\nEarlier in this conversation:\n" + "\n".join(lines)

    return f"""{SYSTEM_INSTRUCTIONS}

FAQ:
{faq_text}
{conversation}

Customer's new question: {question}"""


def looks_unanswered(reply):
    """
    True if the AI's reply looks like an "I don't know" answer rather
    than a real answer pulled from the FAQ.

    This is a best-effort keyword check, not proof of anything - the AI
    writes in its own words every time, so no fixed list catches every
    phrasing, and a fluent WRONG guess looks exactly like a fluent RIGHT
    answer to this function. That's exactly why SYSTEM_INSTRUCTIONS,
    not this function, is what actually prevents hallucination - this
    only decides whether to show an extra "still stuck?" nudge.
    """
    lowered = reply.lower()
    return any(phrase in lowered for phrase in UNKNOWN_PHRASES)


def ask_faq_bot(faq_text, question, history=None):
    """
    The main function. Give it the FAQ text and a question, get back an
    answer grounded in that FAQ.

        answer = ask_faq_bot(faq_text, "Do you deliver?")
    """
    prompt = build_prompt(faq_text, question, history)

    # max_tokens caps the answer length, which caps what this costs you.
    # 300 is generous for a short support answer - FAQ answers are not
    # essays, and a shorter cap also means a lower worst-case credit
    # reservation on every single question (see ai_reserve_request in the
    # AI Builder credits system: it reserves against max_tokens up front).
    return ask_ai(
        prompt,
        max_tokens=300,
        project="simple-faq-chatbot",
    )


if __name__ == "__main__":
    # Run this file on its own to check the prompt-building and the
    # "did it admit it doesn't know" detector both work:
    #     python chatbot.py
    sample_faq = "Q: What are your hours?\nA: We're open 8am-6pm, Tuesday-Sunday."

    prompt = build_prompt(sample_faq, "What time do you open?")
    assert "8am-6pm" in prompt
    assert "What time do you open?" in prompt
    print("build_prompt: FAQ text and question are both present. OK")

    prompt_with_history = build_prompt(
        sample_faq,
        "What about Mondays?",
        history=[
            {"role": "user", "content": "What time do you open?"},
            {"role": "assistant", "content": "We open at 8am."},
        ],
    )
    assert "Customer: What time do you open?" in prompt_with_history
    print("build_prompt: earlier conversation turns are included. OK")

    # Two synthetic AI replies stand in for the live AI here, because we
    # can't force the real AI to misbehave inside an automated test - one
    # reply correctly admits it doesn't know, the other is what a normal
    # (or a confidently WRONG, hallucinated) answer looks like. Notice
    # looks_unanswered() cannot tell "answered_reply" apart from a
    # hallucination that happens to read fluently - only a human checking
    # a real off-FAQ question against the live bot can catch that. See
    # the README troubleshooting entry on hallucination for that manual
    # verification step.
    honest_reply = "I don't have that information in the FAQ - please contact us directly."
    answered_reply = "We're open Tuesday to Sunday, 8am to 6pm."

    assert looks_unanswered(honest_reply) is True
    assert looks_unanswered(answered_reply) is False
    print("looks_unanswered: tells an 'I don't know' reply apart from an answered one. OK")

    print("\nAll chatbot.py checks passed.")
