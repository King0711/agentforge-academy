"""
Step 3 (continued) of the Web Research Agent - renders the brief and
references as Markdown and saves it to a file.
"""

import os
import re
from datetime import datetime

SECTION_TITLES = {
    "BACKGROUND": "Background",
    "FINDINGS": "Key Findings",
    "DATAPOINTS": "Data Points",
    "CONFLICTING": "Conflicting Views",
    "CONCLUSION": "Conclusion",
}


def _slugify(topic):
    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")
    return slug[:40] or "topic"


def render_markdown(topic, brief, references):
    """
    Turns a topic, a brief dict, and a references string into one
    Markdown document.

        markdown = render_markdown(topic, brief, references)
    """
    lines = [f"# Research Brief: {topic}", ""]
    for key, title in SECTION_TITLES.items():
        lines.append(f"## {title}")
        lines.append(brief.get(key, "").strip() or "_Not available._")
        lines.append("")
    lines.append(references)
    lines.append("")
    return "\n".join(lines)


def save_report(topic, brief, references, output_dir="reports"):
    """
    Renders and saves a report, returning the path it used.

    Timestamped + slugified filename, same reasoning as the Meeting Notes
    Formatter's save_markdown(): running this tool twice on related
    topics should never silently overwrite an earlier report.
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = _slugify(topic)
    path = os.path.join(output_dir, f"report_{slug}_{timestamp}.md")

    markdown = render_markdown(topic, brief, references)
    with open(path, "w", encoding="utf-8") as f:
        f.write(markdown)

    return path


if __name__ == "__main__":
    # Run this file on its own to check rendering and saving work:
    #     python report.py
    sample_brief = {
        "BACKGROUND": "Some background.",
        "FINDINGS": "- A finding [Source 1]",
        "CONCLUSION": "A conclusion.",
        # DATAPOINTS and CONFLICTING deliberately missing, to check the
        # "_Not available._" fallback below
    }
    markdown = render_markdown(
        "AI agents in sales",
        sample_brief,
        "## References\n\n1. [Test](https://example.com)",
    )
    print(markdown)
    assert "_Not available._" in markdown

    path = save_report(
        "AI agents in sales!!",
        sample_brief,
        "## References\n\n1. [Test](https://example.com)",
    )
    print(f"\nSaved to: {path}")
    assert os.path.exists(path)
    print("Confirmed the file was written.")
