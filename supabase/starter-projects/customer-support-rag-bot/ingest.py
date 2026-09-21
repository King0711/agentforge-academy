"""
Step 2 of the Customer Support RAG Bot (part 3).

Reads every file in your docs/ folder, chunks and embeds each one, and
upserts the vectors into Pinecone. This is the one part of Build 2 that
needs a real Pinecone account - chunking and embedding are already
tested without one.
"""

import os

from chunker import chunk_text
from dotenv import load_dotenv
from embed import embed
from pinecone import Pinecone

load_dotenv()


def build_records(folder="docs"):
    """
    Reads every file in folder, chunks it, and returns a list of
    {"id", "text", "source"} dicts ready to embed and upsert.

    Does read from disk, but makes no network call - kept separate from
    the actual Pinecone upsert so you can inspect exactly what would be
    uploaded before spending a Pinecone write on it.
    """
    records = []
    for filename in sorted(os.listdir(folder)):
        path = os.path.join(folder, filename)
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()

        for i, chunk in enumerate(chunk_text(text)):
            records.append({"id": f"{filename}-{i}", "text": chunk, "source": filename})

    return records


def ingest_docs(folder="docs"):
    """
    The main function. Chunks and embeds every file in folder, and
    upserts them all to your Pinecone index. Returns how many chunks
    were upserted.
    """
    records = build_records(folder)
    if not records:
        raise ValueError(f"No files found in '{folder}/' - add your docs there first.")

    vectors = embed([r["text"] for r in records])

    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    index = pc.Index(os.environ.get("PINECONE_INDEX", "support-kb"))

    to_upsert = [
        (record["id"], vector, {"text": record["text"], "source": record["source"]})
        for record, vector in zip(records, vectors)
    ]
    index.upsert(vectors=to_upsert)

    return len(to_upsert)


if __name__ == "__main__":
    # This file's core logic (build_records) is checked without Pinecone
    # or an embedding model - only ingest_docs() itself needs both:
    #     python ingest.py
    import tempfile

    print("Checking build_records() against real temp files...")
    tmp_dir = tempfile.mkdtemp()
    with open(os.path.join(tmp_dir, "faq.txt"), "w", encoding="utf-8") as f:
        f.write(" ".join(f"word{i}" for i in range(30)))

    records = build_records(tmp_dir)
    assert len(records) == 1  # 30 words fits in one default-sized (200-word) chunk
    assert records[0]["id"] == "faq.txt-0"
    assert records[0]["source"] == "faq.txt"
    print("  OK -", records[0]["id"], "-", len(records[0]["text"].split()), "words")

    print("\nAll offline checks passed. Run ingest_docs() for real against your docs/ folder")
    print("and your actual Pinecone index once your .env is set up.")
