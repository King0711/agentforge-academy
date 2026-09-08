"""
Step 4 of the Meeting Notes Formatter Agent - the command you actually run.

Run it with:      python main.py sample_transcript.txt
Or pipe text in:  python main.py < my_notes.txt

This wires the other three files together: read the raw notes
(notes.py), ask the AI to pull out decisions/actions/summary
(formatter.py), then print and save the result (output.py).
"""

import sys

from formatter import format_notes
from notes import get_transcript_text
from output import render_markdown, save_markdown
from sdt_ai import AIError


def main():
    file_path = sys.argv[1] if len(sys.argv) > 1 else None

    try:
        transcript_text = get_transcript_text(file_path)
    except ValueError as problem:
        print(f"Could not read the transcript:\n{problem}")
        sys.exit(1)

    print(f"Read {len(transcript_text)} characters. Asking the AI to format them...\n")

    try:
        parsed = format_notes(transcript_text)
    except AIError as problem:
        # sdt_ai.py writes these messages to be read directly - show them as-is.
        print(f"AI request failed:\n{problem}")
        sys.exit(1)
    except ValueError as problem:
        print(f"Could not make sense of the AI's reply:\n{problem}")
        sys.exit(1)

    markdown = render_markdown(parsed)
    print(markdown)

    saved_path = save_markdown(markdown)
    print(f"\nSaved to: {saved_path}")


if __name__ == "__main__":
    main()
