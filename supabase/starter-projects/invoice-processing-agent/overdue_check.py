"""
Step 4 of the Invoice Processing Agent (continued) - a separate script
to run once a day, re-checking EVERY logged invoice's due date against
today, not just newly-processed ones. An invoice logged weeks ago can
become overdue at any time without any new PDF ever arriving.
"""

import os

from dotenv import load_dotenv
from overdue import alert_if_overdue, is_overdue
from sheets import get_worksheet

load_dotenv()


def check_all_overdue(worksheet, webhook_url):
    rows = worksheet.get_all_records()
    overdue_count = 0
    for row in rows:
        alert_if_overdue(row, webhook_url)
        if is_overdue(row.get("due_date", "")):
            overdue_count += 1
    return overdue_count


if __name__ == "__main__":
    worksheet = get_worksheet()
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    count = check_all_overdue(worksheet, webhook_url)
    print(f"Checked all logged invoices. {count} currently overdue.")
