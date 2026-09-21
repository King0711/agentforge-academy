"""
Step 2 of the Customer Support RAG Bot (part 1).

Splits a document into overlapping word-based chunks small enough to
embed and retrieve individually. Pure function, no network call - fully
testable without Pinecone, sentence-transformers, or any API key.
"""


def chunk_text(text, chunk_size=200, overlap=40):
    """
    Splits text into word-based chunks of chunk_size words, with overlap
    words shared between consecutive chunks.

        chunk_text("word1 word2 ... word500", chunk_size=200, overlap=40)

    The overlap exists so a sentence that happens to fall right on a
    chunk boundary doesn't get split across two chunks with neither one
    containing the whole idea - each chunk after the first repeats the
    last `overlap` words of the one before it.

    200 words (not the 512 used for some other embedding tasks) retrieves
    more precisely for a support bot, where a customer question usually
    maps to one specific paragraph, not several.
    """
    words = text.split()
    if not words:
        return []

    step = chunk_size - overlap
    if step <= 0:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []
    for start in range(0, len(words), step):
        chunk_words = words[start:start + chunk_size]
        chunks.append(" ".join(chunk_words))
        if start + chunk_size >= len(words):
            break

    return chunks


if __name__ == "__main__":
    # Run this file on its own to check the chunking logic works:
    #     python chunker.py
    words = [f"word{i}" for i in range(50)]
    text = " ".join(words)

    chunks = chunk_text(text, chunk_size=20, overlap=5)
    print(f"Split 50 words (chunk_size=20, overlap=5) into {len(chunks)} chunks:")
    for i, chunk in enumerate(chunks):
        print(f"  chunk {i}: {len(chunk.split())} words")

    assert len(chunks) == 3
    print("\nChecking the overlap is real...")
    chunk0_end = chunks[0].split()[-5:]
    chunk1_start = chunks[1].split()[:5]
    assert chunk0_end == chunk1_start
    print("  OK - the last 5 words of chunk 0 match the first 5 words of chunk 1")

    print("\nChecking every word from the original text appears in at least one chunk...")
    all_chunked_words = set()
    for chunk in chunks:
        all_chunked_words.update(chunk.split())
    assert all_chunked_words == set(words)
    print("  OK - no word was dropped by the chunking")

    print("\nChecking a short document (fewer words than chunk_size) returns one chunk...")
    short = chunk_text("just six words in this sentence", chunk_size=200, overlap=40)
    assert len(short) == 1
    assert short[0] == "just six words in this sentence"
    print("  OK -", short)

    print("\nChecking empty text returns an empty list, not a crash...")
    assert chunk_text("", chunk_size=200, overlap=40) == []
    print("  OK")

    print("\nAll chunking checks passed.")
