"""
Step 3 of the Competitor Intelligence Monitor (part 2) - converts the
Markdown briefing to a styled HTML email.
"""

import markdown as markdown_lib

EMAIL_CSS = """
body { font-family: -apple-system, Arial, sans-serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
h1 { font-size: 1.5em; } h2 { font-size: 1.2em; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
"""


def to_html_email(markdown_text):
    """
    Turns the Markdown briefing into a full HTML document ready to send
    as an email body.

        html = to_html_email(markdown_text)

    Pure function - tested below without sending any real email.
    """
    body_html = markdown_lib.markdown(markdown_text)
    return f"<html><head><style>{EMAIL_CSS}</style></head><body>{body_html}</body></html>"


if __name__ == "__main__":
    # Run this file on its own to check Markdown-to-HTML conversion
    # works:  python email_format.py
    sample_markdown = "# Weekly Briefing\n\n## Acme Corp\n\n**Threat Level:** HIGH"
    html = to_html_email(sample_markdown)

    assert "<h1>Weekly Briefing</h1>" in html
    assert "<h2>Acme Corp</h2>" in html
    assert "<strong>Threat Level:</strong> HIGH" in html
    print(html)
    print("\nAll checks passed.")
