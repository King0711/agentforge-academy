# Customer Support RAG Bot — starter project

Build a support bot that answers questions grounded only in your real
product docs — chunked, embedded, stored in Pinecone, and retrieved
fresh for every question — exposed as a real API endpoint.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Create a free Pinecone account and index (dimension 384), add its key to `.env`
5. Put 4-6 of your real docs in a `docs/` folder, then run `python ingest.py`
6. `uvicorn main:app --reload`

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `chunker.py` | Splits your docs into overlapping chunks small enough to embed and retrieve accurately. |
| `embed.py` | Turns text into vectors with a local sentence-transformers model — no API cost per embedding. |
| `ingest.py` | Chunks, embeds, and uploads your docs/ folder to Pinecone. Run this once, and again whenever docs change. |
| `rag.py` | The core prompt: retrieves the most relevant chunks and answers grounded only in them. **Edit this one.** |
| `main.py` | Exposes `rag.py` as a FastAPI `/chat` endpoint. |
