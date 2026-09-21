"""
Step 4 of the Financial Reporting Agent (part 2) - assembles the final
PDF report from the commentary, charts, and any flagged anomalies.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer


def build_pdf(commentary, chart_paths, anomalies, output="report.pdf"):
    """
    Assembles a PDF with a title, the commentary as paragraphs, the
    chart images, and (if anomalies exist) a section listing each
    flagged transaction.

        build_pdf(commentary_text, ["revenue.png", "expenses.png"], anomalies)
    """
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(output, pagesize=letter)
    story = [Paragraph("Monthly Financial Report", styles["Title"]), Spacer(1, 12)]

    for paragraph_text in commentary.split("\n\n"):
        if paragraph_text.strip():
            story.append(Paragraph(paragraph_text.strip(), styles["Normal"]))
            story.append(Spacer(1, 12))

    for chart_path in chart_paths:
        story.append(Image(chart_path, width=400, height=300))
        story.append(Spacer(1, 12))

    if anomalies:
        story.append(Paragraph("Flagged Transactions", styles["Heading2"]))
        for row in anomalies:
            line = f"{row.get('date')} - {row.get('amount')} - {row.get('category')} - {row.get('description')}"
            story.append(Paragraph(line, styles["Normal"]))

    doc.build(story)
    return output


if __name__ == "__main__":
    print("This file only wraps a real PDF build with real chart image files -")
    print("there's no meaningful offline self-test to run here without those inputs.")
    print("It's exercised for real in Build 4's main.py.")
