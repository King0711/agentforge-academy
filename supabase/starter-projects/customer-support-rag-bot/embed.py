"""
Step 2 of the Customer Support RAG Bot (part 2).

Turns text chunks into vectors using sentence-transformers, entirely on
your own machine - no API key, no per-call cost, and it works even with
your internet disconnected after the model's first download.
"""

from sentence_transformers import SentenceTransformer

# Loaded once at import time, not inside embed() - reloading a ~90MB
# model on every single call would make ingesting even a handful of
# documents painfully slow. The first import downloads and caches it;
# every import after that loads instantly from disk.
_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

EMBEDDING_DIMENSIONS = 384


def embed(texts):
    """
    Turns a list of text strings into a list of 384-dimensional vectors.

        vectors = embed(["How do I reset my password?", "Refund policy details"])

    Batches the whole list into one encode() call rather than looping
    one text at a time - meaningfully faster for anything more than a
    couple of texts, since the model processes a batch in parallel
    internally.
    """
    return _MODEL.encode(texts).tolist()


if __name__ == "__main__":
    # Run this file on its own to check embedding works. This downloads
    # the ~90MB model on first run (needs internet once), then runs
    # fully locally - no API key needed:  python embed.py
    vectors = embed(["How do I reset my password?", "What is your refund policy?"])

    assert len(vectors) == 2
    assert len(vectors[0]) == EMBEDDING_DIMENSIONS
    print(f"Embedded 2 texts into {len(vectors)} vectors of {len(vectors[0])} dimensions each.")

    print("\nChecking that similar questions produce more similar vectors than unrelated ones...")
    import math

    def cosine_similarity(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        return dot / (norm_a * norm_b)

    password_q1, password_q2, refund_q = embed([
        "How do I reset my password?",
        "How can I change my password?",
        "What is your refund policy?",
    ])

    similar_score = cosine_similarity(password_q1, password_q2)
    unrelated_score = cosine_similarity(password_q1, refund_q)
    print(f"  Similarity between two password questions: {similar_score:.3f}")
    print(f"  Similarity between a password and a refund question: {unrelated_score:.3f}")
    assert similar_score > unrelated_score
    print("  OK - semantically similar questions scored more similar than unrelated ones")

    print("\nAll embedding checks passed.")
