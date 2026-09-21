"""
Step 3 of the Competitor Intelligence Monitor (part 3) - the command you
actually run, ideally every Monday morning.

Run it with:  python main.py
"""

import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from analyze import analyze_competitor
from briefing import build_briefing, generate_exec_summary
from dotenv import load_dotenv
from email_format import to_html_email
from jobs import get_job_titles
from scrape import get_homepage_text, get_recent_news
from sdt_ai import AIError

load_dotenv()


def gather_and_analyze(competitor):
    name = competitor["name"]
    print(f"Gathering data for {name}...")
    homepage_text = get_homepage_text(competitor["website"])
    news = get_recent_news(name)
    job_titles = get_job_titles(competitor["jobs_url"])

    print(f"Analyzing {name}...")
    return analyze_competitor(name, homepage_text, news, job_titles)


def send_email(html_body, subject="Weekly Competitive Intelligence Briefing"):
    smtp_user = os.environ["SMTP_USER"]
    smtp_pass = os.environ["SMTP_PASS"]

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = smtp_user
    message["To"] = smtp_user
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(smtp_user, smtp_pass)
        server.send_message(message)


if __name__ == "__main__":
    with open("competitors.json", encoding="utf-8") as f:
        competitors = json.load(f)

    analyses = {}
    for competitor in competitors:
        try:
            analyses[competitor["name"]] = gather_and_analyze(competitor)
        except (AIError, ValueError) as problem:
            print(f"  Skipped {competitor['name']}: {problem}")

    if not analyses:
        print("No competitors were successfully analyzed - nothing to send.")
    else:
        print("Generating executive summary...")
        exec_summary = generate_exec_summary(analyses)
        markdown_briefing = build_briefing(analyses, exec_summary)
        html = to_html_email(markdown_briefing)

        send_email(html)
        print(f"\nDone. Briefing sent covering {len(analyses)} competitor(s).")
