"""
Step 3 of the Customer Support RAG Bot.

This is the anti-hallucination core: retrieve the most relevant chunks
for a question, then tell the AI to answer using ONLY that context. It
also carries this project's safety guard - the sources list returned to
the caller is checked against what was ACTUALLY retrieved, so the bot
can never claim it used a document it never saw.
"""

import os

from dotenv import load_dotenv
from embed import embed
from pinecone import Pinecone
from sdt_ai import ask_ai

load_dotenv()

TOP_K = 5
FALLBACK_PHRASE = "I don't have that information -- let me connect you with a human agent."


def _get_index():
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    return pc.Index(os.environ.get("PINECONE_INDEX", "support-kb"))


def retrieve(question, top_k=TOP_K):
    """
    Embeds the question and returns the top_k most similar chunks from
    Pinecone as a list of {"text", "source"} dicts.
    """
    index = _get_index()
    vector = embed([question])[0]
    results = index.query(vector=vector, top_k=top_k, include_metadata=True)
    return [
        {"text": match.metadata["text"], "source": match.metadata["source"]}
        for match in results.matches
    ]


def build_prompt(question, chunks):
    """Pure function, no network call - tested below against fake chunks."""
    context = "\n\n".join(f"[{c['source']}]: {c['text']}" for c in chunks)
    return f"""Answer the customer's question using ONLY the context below.

If the answer is not in the context, respond with EXACTLY this sentence
and nothing else: "{FALLBACK_PHRASE}"

Do not use any outside knowledge, and do not guess.

CONTEXT:
{context}

QUESTION: {question}"""


def validate_sources(answer, retrieved_chunks):
    """
    Returns the list of source filenames the answer is allowed to cite.

        validate_sources("some real answer", [{"source": "faq.txt"}, ...])

    Every filename actually retrieved for this question is a valid
    citation - the one thing this guards against is the FALLBACK case:
    if the AI said it doesn't have the information, the sources list
    must come back empty, even though chunks were technically retrieved,
    because none of them were actually used in the answer.
    """
    if answer.strip() == FALLBACK_PHRASE:
        return []
    seen = []
    for chunk in retrieved_chunks:
        if chunk["source"] not in seen:
            seen.append(chunk["source"])
    return seen


def answer_question(question):
    """
    The main function. Give it a customer question, get back:

        {"answer": "...", "sources": ["faq.txt", "returns-policy.md"]}

    sources is always a subset of what was actually retrieved for this
    specific question - never invented, and always empty for a fallback
    answer.
    """
    chunks = retrieve(question)
    if not chunks:
        return {"answer": FALLBACK_PHRASE, "sources": []}

    prompt = build_prompt(question, chunks)
    answer = ask_ai(prompt, max_tokens=400, project="support-rag-bot")

    return {"answer": answer, "sources": validate_sources(answer, chunks)}


if __name__ == "__main__":
    # Run this file on its own to check the prompt-building and source
    # guard work - no AI call, no Pinecone account needed:  python rag.py

    fake_chunks = [
        {"text": "Refunds are processed within 5-7 business days.", "source": "refunds.md"},
        {"text": "Refunds are only available within 30 days of purchase.", "source": "refunds.md"},
        {"text": "Password resets are self-service via the login page.", "source": "account.md"},
    ]

    print("Checking build_prompt()...")
    prompt = build_prompt("How long do refunds take?", fake_chunks)
    assert "[refunds.md]" in prompt
    assert "5-7 business days" in prompt
    assert FALLBACK_PHRASE in prompt
    print("  OK - context and fallback instruction both correctly included")

    print("\nChecking validate_sources() with a real answer...")
    sources = validate_sources("Refunds take 5-7 business days.", fake_chunks)
    assert sources == ["refunds.md", "account.md"]
    print("  OK - unique retrieved sources returned in order:", sources)

    print("\nChecking validate_sources() with the fallback phrase...")
    sources = validate_sources(FALLBACK_PHRASE, fake_chunks)
    assert sources == []
    print("  OK - fallback answer correctly returns an empty sources list, even though chunks were retrieved")

    print("\nAll checks passed.")
