"""
Step 3 of the Financial Reporting Agent (part 1) - turns monthly
revenue and expense data into chart images for the PDF report.
"""

import matplotlib
matplotlib.use("Agg")  # no GUI backend needed - this runs in a script, not a notebook
import matplotlib.pyplot as plt


def make_revenue_chart(monthly_revenue, path="revenue.png"):
    """
    Plots monthly revenue as a line chart with markers, saves to path,
    and returns path. Always closes the figure after saving - a chart
    left open in memory is exactly what the "PDF assembly fails with an
    image error" troubleshooting item traces back to.
    """
    fig, ax = plt.subplots()
    ax.plot(monthly_revenue.index.astype(str), monthly_revenue.values, marker="o")
    ax.set_title("Monthly Revenue")
    ax.set_ylabel("Revenue")
    fig.savefig(path)
    plt.close(fig)
    return path


def make_expense_pie(df, path="expenses.png"):
    """Plots a pie chart of expenses grouped by category, saves to path, and returns path."""
    expenses_by_category = df[df["amount"] < 0].groupby("category")["amount"].sum().abs()

    fig, ax = plt.subplots()
    ax.pie(expenses_by_category.values, labels=expenses_by_category.index, autopct="%1.0f%%")
    ax.set_title("Expenses by Category")
    fig.savefig(path)
    plt.close(fig)
    return path


if __name__ == "__main__":
    # Run this file on its own to check both charts render and save
    # correctly - a real chart written to disk, then cleaned up:
    #     python charts.py
    import os

    import pandas as pd

    monthly_revenue = pd.Series([1000.0, 1500.0], index=pd.PeriodIndex(["2026-07", "2026-08"], freq="M"))
    path = make_revenue_chart(monthly_revenue, path="test_revenue.png")
    assert os.path.exists(path)
    assert os.path.getsize(path) > 0
    print("Revenue chart saved:", path, f"({os.path.getsize(path)} bytes)")
    os.remove(path)

    df = pd.DataFrame({
        "amount": [-400.0, -200.0, -100.0],
        "category": ["Rent", "Payroll", "Rent"],
    })
    path = make_expense_pie(df, path="test_expenses.png")
    assert os.path.exists(path)
    assert os.path.getsize(path) > 0
    print("Expense pie chart saved:", path, f"({os.path.getsize(path)} bytes)")
    os.remove(path)

    print("\nAll checks passed - both charts rendered, saved, and cleaned up without leaving a figure open.")
