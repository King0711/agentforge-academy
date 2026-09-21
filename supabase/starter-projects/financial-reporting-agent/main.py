"""
Step 4 of the Financial Reporting Agent (part 3) - the full pipeline,
end to end.

Run it with:  python main.py transactions.csv <cash_balance>
"""

import sys

from anomalies import find_anomalies
from charts import make_expense_pie, make_revenue_chart
from clean import clean_transactions
from commentary import write_commentary
from ingest import load_transactions
from metrics import compute_metrics
from pdf_report import build_pdf
from sdt_ai import AIError


def run(csv_path, cash_balance):
    print("Loading and cleaning transactions...")
    df = load_transactions(csv_path)
    df = clean_transactions(df)

    print("Computing metrics...")
    metrics = compute_metrics(df, cash_balance)
    print(f"  Revenue: {metrics['revenue']:.2f}, Expenses: {metrics['expenses']:.2f}, Margin: {metrics['margin']:.1f}%")

    print("Generating charts...")
    monthly_revenue = df[df["amount"] > 0].groupby("month")["amount"].sum()
    revenue_chart = make_revenue_chart(monthly_revenue)
    expense_chart = make_expense_pie(df)

    print("Writing commentary...")
    commentary = write_commentary(metrics)

    print("Checking for anomalies...")
    anomalies = find_anomalies(df)
    print(f"  Found {len(anomalies)} anomalous transaction(s).")

    print("Assembling PDF...")
    output = build_pdf(commentary, [revenue_chart, expense_chart], anomalies)
    print(f"\nDone. Report saved to: {output}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python main.py transactions.csv <cash_balance>")
        sys.exit(1)

    try:
        run(sys.argv[1], float(sys.argv[2]))
    except AIError as problem:
        print(f"AI request failed:\n{problem}")
    except ValueError as problem:
        print(f"Could not complete the pipeline:\n{problem}")
