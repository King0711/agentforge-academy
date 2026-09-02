"""
Step 3 of the Meeting Notes Formatter Agent.

This file turns the dictionary formatter.py produces into clean,
readable Markdown - either as a string to print, or as a saved .md file
you can drop straight into Notion, GitHub, Slack, or anywhere else that
renders Markdown.
"""

import os
from datetime import datetime


def render_markdown(parsed, title="Meeting Notes"):
    """
    Turns {"decisions": [...], "actions": [...], "summary": "..."} into
    a Markdown string.

        markdown = render_markdown(result)
        print(markdown)

    Works even when a section is empty - a very short transcript that
    produced no decisions still gets a readable document with a "no
    decisions recorded" line, rather than a header with nothing under it.
    """
    lines = [f"# {title}", ""]

    lines.append("## Summary")
    lines.append(parsed["summary"] if parsed["summary"] else "_No summary available._")
    lines.append("")

    lines.append("## Decisions")
    if parsed["decisions"]:
        lines.extend(f"- {d}" for d in parsed["decisions"])
    else:
        lines.append("_No decisions recorded._")
    lines.append("")

    lines.append("## Action Items")
    if parsed["actions"]:
        lines.append("| Task | Owner | Deadline |")
        lines.append("|------|-------|----------|")
        for action in parsed["actions"]:
            # A "|" inside the AI's own wording would split a Markdown
            # table cell in two, so swap any it wrote for a dash.
            task = action["task"].replace("|", "-")
            owner = action["owner"].replace("|", "-")
            deadline = action["deadline"].replace("|", "-")
            lines.append(f"| {task} | {owner} | {deadline} |")
    else:
        lines.append("_No action items recorded._")
    lines.append("")

    return "\n".join(lines)


def save_markdown(markdown_text, output_dir="notes_output"):
    """
    Saves markdown_text to a timestamped .md file inside output_dir
    (created if it doesn't exist yet), and returns the path it used.

        path = save_markdown(markdown)
        print(f"Saved to {path}")

    Timestamping the filename (instead of always writing e.g.
    meeting_notes.md) means running this twice in a row keeps both
    sets of notes, instead of silently overwriting the first one -
    the exact kind of thing that's easy to miss on a Friday afternoon.
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(output_dir, f"meeting_notes_{timestamp}.md")

    with open(path, "w", encoding="utf-8") as f:
        f.write(markdown_text)

    return path


if __name__ == "__main__":
    # Run this file on its own to check rendering and saving work,
    # entirely offline:  python output.py
    sample = {
        "decisions": ["Ship v2 on the 15th", "Drop CSV export from this release"],
        "actions": [
            {"task": "Update the release notes", "owner": "Priya", "deadline": "Friday"},
            {"task": "Notify beta testers", "owner": "Unassigned", "deadline": "No deadline set"},
        ],
        "summary": "The team pushed the launch back five days to finish load testing.",
    }

    markdown = render_markdown(sample)
    print(markdown)

    print("\n--- Testing a fully empty result (nothing recorded anywhere) ---")
    empty = {"decisions": [], "actions": [], "summary": ""}
    print(render_markdown(empty))

    print("--- Saving to disk ---")
    saved_path = save_markdown(markdown)
    print(f"Saved to: {saved_path}")
    with open(saved_path, encoding="utf-8") as f:
        saved_content = f.read()
    assert saved_content == markdown, "Saved file doesn't match what we rendered!"
    print("Confirmed: saved file matches the rendered Markdown.")
