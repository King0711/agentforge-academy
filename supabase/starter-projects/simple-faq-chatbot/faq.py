"""
Step 1 of the Simple FAQ Chatbot.

This file has one job: read the FAQ document off disk and hand back its
text, so chatbot.py can drop it straight into the prompt. This project is
"RAG-lite" - no database, no embeddings, no search step. The FAQ file IS
the knowledge base. Whatever text is in faq.md is exactly what the AI can
know about your business, word for word.
"""

import os

FAQ_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "faq.md")

# Stop after this many characters - the same kind of MONEY decision as
# article.py's MAX_CHARACTERS in the Social Post Generator project.
# chatbot.py resends this whole file with EVERY question a customer asks
# (see the caching note in chatbot.py for how prompt caching keeps repeat
# sends cheap), so a 200-page FAQ would make every single question
# expensive. 8000 characters is roughly 15-20 well-written Q&A pairs -
# plenty for a small business, and a hard ceiling that keeps costs
# predictable even if someone pastes in a much bigger document later.
MAX_CHARACTERS = 8000


def load_faq(path=FAQ_PATH):
    """
    Reads the FAQ file and returns its text.

        text = load_faq()

    Raises a clear error if the file is missing or empty - an empty FAQ
    means the chatbot has nothing to answer from, which would otherwise
    fail silently and confusingly deep inside a prompt to the AI instead
    of here, where the problem is obvious.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Could not find {path}.\n"
            f"Create a faq.md file next to this one with your questions and answers."
        )

    with open(path, "r", encoding="utf-8") as f:
        text = f.read().strip()

    if not text:
        raise ValueError(
            f"{path} is empty.\n"
            f"Add at least a few questions and answers before running the chatbot."
        )

    return text[:MAX_CHARACTERS]


if __name__ == "__main__":
    # Run this file on its own to check it works:  python faq.py
    text = load_faq()
    print(f"Loaded {len(text)} characters from {FAQ_PATH}\n")
    print(text[:300])
