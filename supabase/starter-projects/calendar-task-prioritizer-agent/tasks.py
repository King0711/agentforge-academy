"""
Step 2 of the Calendar & Task Prioritizer Agent.

Reads your task list. Deliberately boring: a plain text file, one task per
line. No task-manager account, no API, no OAuth - just something you can
open and edit in two seconds when your day changes.
"""

import os

DEFAULT_TASKS_FILE = "tasks.txt"

# Written to tasks.txt the first time this runs, so the project works out
# of the box before you've written your own list - you see the expected
# format instead of the program crashing on a missing file.
SAMPLE_TASKS = [
    "Finish the Q3 budget review",
    "Reply to the vendor contract email",
    "Prepare slides for Friday's demo",
    "Review pull request #482",
    "Book the dentist appointment",
]


def clean_task_line(line):
    """
    Strips one raw line from tasks.txt down to the task text, or returns
    "" if the line isn't a task at all (blank, or a "# comment").

    Split out from get_tasks() below so it can be tested against a list
    of fake lines without needing a real tasks.txt on disk.
    """
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return ""

    # People naturally write "- Finish the report" or "* Finish the
    # report" in a plain text list. Strip the common leading markers so
    # they don't end up as literal characters inside the AI prompt later.
    for marker in ("- ", "* "):
        if stripped.startswith(marker):
            stripped = stripped[len(marker):]
            break

    return stripped.strip()


def get_tasks(path=DEFAULT_TASKS_FILE):
    """
    Returns your tasks as a list of plain strings, one per line.

        tasks = get_tasks()

    Creates tasks.txt with sample tasks the first time it's called, so
    running main.py before you've customised anything still works and
    shows you what the file should look like, instead of crashing.
    """
    if not os.path.exists(path):
        _write_sample_file(path)

    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    cleaned = [clean_task_line(line) for line in lines]
    return [task for task in cleaned if task]


def _write_sample_file(path):
    with open(path, "w", encoding="utf-8") as f:
        f.write("# One task per line. Lines starting with # are ignored.\n")
        for task in SAMPLE_TASKS:
            f.write(f"- {task}\n")


if __name__ == "__main__":
    # Run this file on its own to check the line-cleaning logic works:
    #     python tasks.py
    fake_lines = [
        "- Finish the Q3 budget review\n",
        "\n",
        "# this is a comment, skip it\n",
        "* Reply to the vendor contract email\n",
        "Book the dentist appointment\n",
        "   \n",
    ]

    cleaned = [clean_task_line(line) for line in fake_lines]
    cleaned = [task for task in cleaned if task]

    print(f"Cleaned {len(cleaned)} tasks from {len(fake_lines)} raw lines:\n")
    for task in cleaned:
        print(f"  - {task}")

    assert cleaned == [
        "Finish the Q3 budget review",
        "Reply to the vendor contract email",
        "Book the dentist appointment",
    ]
    print("\nAll checks passed.")
