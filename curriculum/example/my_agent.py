"""
my_agent.py — a tiny agent, to show how it uses llm.py.

This is YOUR code. It knows nothing about Gemini, Groq, or any AI company.
It just asks llm.py for an answer.

Run it with:   python my_agent.py notes.txt
"""
import sys

from llm import chat   # <-- this is the only AI-related line in the whole file


def summarise(text: str) -> str:
    return chat(
        f"Summarise the following in three bullet points:\n\n{text}",
        system="You are a concise assistant. Use plain language.",
        max_tokens=300,
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python my_agent.py <file>")
        sys.exit(1)

    with open(sys.argv[1], encoding="utf-8") as f:
        contents = f.read()

    print(summarise(contents))
