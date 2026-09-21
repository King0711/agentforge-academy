"""
Step 3 of the Competitor Intelligence Monitor (part 1) - combines
per-competitor analyses into one Markdown briefing, with an executive
summary generated across all of them.
"""

from sdt_ai import ask_ai

SECTION_TITLES = {
    "WHATSNEW": "What's New",
    "SIGNALS": "Strategic Signals",
    "THREAT": "Threat Level",
    "REASONING": "Reasoning",
    "OPPORTUNITIES": "Opportunities",
}


def _format_analysis(analysis):
    lines = []
    for key, title in SECTION_TITLES.items():
        lines.append(f"**{title}:** {analysis.get(key, '(not available)')}")
    return "\n\n".join(lines)


def build_briefing(analyses, exec_summary=""):
    """
    Turns {"Acme": {...analysis dict...}, "Globex": {...}} into one
    Markdown document.

        markdown = build_briefing(analyses, exec_summary)

    Pure function - tested below without any AI call.
    """
    lines = ["# Weekly Competitive Intelligence Briefing", ""]
    if exec_summary:
        lines.append("## Executive Summary")
        lines.append(exec_summary)
        lines.append("")

    for name, analysis in analyses.items():
        lines.append(f"## {name}")
        lines.append(_format_analysis(analysis))
        lines.append("")

    return "\n".join(lines)


def generate_exec_summary(analyses):
    """
    Sends all the analyses to the AI in one call and asks for a 3-4
    sentence executive summary across every competitor.
    """
    combined = "\n\n".join(
        f"{name}: threat={a.get('THREAT', 'UNCLEAR')}. {a.get('WHATSNEW', '')}"
        for name, a in analyses.items()
    )
    prompt = f"""Below is this week's per-competitor intelligence. Write a 3-4
sentence executive summary across ALL of them for a leadership team who
won't read the full briefing.

{combined}"""

    return ask_ai(prompt, max_tokens=250, project="competitor-intelligence-monitor")


if __name__ == "__main__":
    # Run this file on its own to check the Markdown assembly works - no
    # AI call, no credits spent:  python briefing.py
    sample_analyses = {
        "Acme Corp": {
            "WHATSNEW": "Announced a new pricing tier.",
            "SIGNALS": "Hiring ML engineers.",
            "THREAT": "HIGH",
            "REASONING": "Clear new direction.",
            "OPPORTUNITIES": "Highlight our AI features.",
        },
        "Globex Inc": {
            "WHATSNEW": "Nothing notable.",
            "SIGNALS": "Flat hiring.",
            "THREAT": "LOW",
            "REASONING": "No changes detected.",
            "OPPORTUNITIES": "None significant.",
        },
    }
    markdown = build_briefing(
        sample_analyses,
        exec_summary="Overall, low competitive movement this week except Acme's new AI push.",
    )
    print(markdown)

    assert "# Weekly Competitive Intelligence Briefing" in markdown
    assert "## Executive Summary" in markdown
    assert "## Acme Corp" in markdown
    assert "## Globex Inc" in markdown
    assert "**Threat Level:** HIGH" in markdown
    print("\nAll checks passed.")
