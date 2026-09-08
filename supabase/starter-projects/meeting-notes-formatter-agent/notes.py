"""
Step 1 of the Meeting Notes Formatter Agent.

This file has one job: get the raw meeting transcript text, however the
student wants to supply it - a file path, or pasted straight into the
terminal (stdin). Nothing here talks to the AI; that's formatter.py.
"""

import os
import sys
import tempfile

# Stop after this many characters.
#
# This is a MONEY decision, not a technical one (see article.py in the
# Social Post Generator project for the same idea). A one-hour meeting
# transcript can run to 20,000+ characters once you include filler words
# ("um", "so", "yeah") and speaker labels. The AI doesn't need every
# "um" to spot the decisions and action items - 8000 characters is
# roughly a 45-60 minute meeting's worth of substance, and sending more
# than that mostly pays for filler, not better output.
MAX_CHARACTERS = 8000


def get_transcript_text(file_path=None):
    """
    Returns the raw transcript text, from a file or from stdin.

        text = get_transcript_text("sample_transcript.txt")

    Pass no file_path (or None) to read from stdin instead - useful if
    you want to pipe a transcript straight in:

        python main.py < my_meeting.txt

    Raises a clear error if the file is missing, or the transcript is
    too short to contain anything worth formatting.
    """
    if file_path:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except FileNotFoundError:
            raise ValueError(
                f"Could not find a file at '{file_path}'.\n"
                f"Check the path is correct and try again."
            )
    else:
        text = sys.stdin.read()

    text = text.strip()

    if len(text) < 20:
        raise ValueError(
            "That transcript looks empty (or almost empty).\n"
            "Paste in some real meeting notes - even a few bullet points "
            "of what was discussed - and try again."
        )

    return text[:MAX_CHARACTERS]


if __name__ == "__main__":
    # Run this file on its own to check it works:  python notes.py
    print("Reading sample_transcript.txt...\n")
    text = get_transcript_text("sample_transcript.txt")
    print(f"Got {len(text)} characters. First 200:\n")
    print(text[:200])

    print("\n--- Testing a missing file path ---")
    try:
        get_transcript_text("does_not_exist.txt")
        print("ERROR: should have raised ValueError")
    except ValueError as problem:
        print("Correctly raised an error:")
        print(problem)

    # A transcript with almost nothing in it (a mis-click, an empty paste)
    # should be rejected here - with a message telling the student what
    # to do - rather than reaching the AI and paying credits for garbage.
    print("\n--- Testing the empty-transcript guard ---")
    fd, tmp_path = tempfile.mkstemp(suffix=".txt")
    try:
        with os.fdopen(fd, "w") as f:
            f.write("hi")
        get_transcript_text(tmp_path)
        print("ERROR: should have raised ValueError")
    except ValueError as problem:
        print("Correctly raised an error:")
        print(problem)
    finally:
        os.remove(tmp_path)
