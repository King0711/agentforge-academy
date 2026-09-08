"""
Step 3 of the Document Summarizer Agent - the command you actually run.

Run it with:      python main.py path/to/document.pdf
Works with:       .txt, .pdf, .docx files, and http(s) web links
"""

import sys

from detector import extract_text
from sdt_ai import AIError
from summarizer import summarize_document


def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <path-to-document-or-url>")
        print("Supports .txt, .pdf, .docx files, and http(s) web links.")
        sys.exit(1)

    path = sys.argv[1]

    try:
        print(f"Reading {path}...")
        text = extract_text(path)
        print(f"Extracted {len(text)} characters.\n")
    except ValueError as problem:
        # These messages are written to be read - show them as they are,
        # not wrapped in a stack trace a beginner has to decode.
        print(f"Could not read that file:\n{problem}")
        sys.exit(1)

    try:
        print("Summarizing (this calls the AI - one request, a few credits)...\n")
        summary = summarize_document(text)
    except AIError as problem:
        print(f"AI error:\n{problem}")
        sys.exit(1)
    except ValueError as problem:
        print(f"Could not parse the summary:\n{problem}")
        sys.exit(1)

    print("=" * 60)
    print("KEY POINTS")
    print("=" * 60)
    print(summary.get("KEYPOINTS", "(none returned)"))
    print()
    print("=" * 60)
    print("ACTION ITEMS")
    print("=" * 60)
    print(summary.get("ACTIONS", "(none returned)"))
    print()
    print("=" * 60)
    print("EXECUTIVE BRIEF")
    print("=" * 60)
    print(summary.get("BRIEF", "(none returned)"))


if __name__ == "__main__":
    main()
