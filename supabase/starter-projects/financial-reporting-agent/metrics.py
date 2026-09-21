"""
Step 2 of the Financial Reporting Agent - turns raw transactions into
the numbers a CFO actually cares about. Every division here is guarded
against a zero denominator, since a $0-revenue month or a break-even
month is a real, not-rare case in transaction data, and a raw
ZeroDivisionError (or a silently wrong infinite/NaN percentage) is worse
than an honest, capped number.
"""


def compute_metrics(df, cash_balance):
    """
    Groups df by month and returns:

        {"revenue": ..., "expenses": ..., "margin": ..., "mom_growth": ...,
         "runway_months": ...}

    for the LATEST month in the data.

        compute_metrics(df, cash_balance=50000)

    Guards three separate divide-by-zero risks:
      - mom_growth: divides by the PREVIOUS month's revenue
      - margin: divides by the CURRENT month's revenue
      - runway_months: divides by burn (expenses - revenue); if burn is
        zero or negative (breaking even or profitable), runway is
        reported as None ("not burning cash") rather than infinity or
        a crash.
    """
    monthly_revenue = df[df["amount"] > 0].groupby("month")["amount"].sum()
    monthly_expenses = df[df["amount"] < 0].groupby("month")["amount"].sum().abs()

    months = sorted(set(monthly_revenue.index) | set(monthly_expenses.index))
    if not months:
        raise ValueError("No transactions with a valid month found - nothing to report on.")

    latest = months[-1]
    revenue = float(monthly_revenue.get(latest, 0))
    expenses = float(monthly_expenses.get(latest, 0))

    margin = (revenue - expenses) / max(revenue, 1) * 100

    if len(months) >= 2:
        previous = months[-2]
        prev_revenue = float(monthly_revenue.get(previous, 0))
        mom_growth = (revenue - prev_revenue) / max(prev_revenue, 1) * 100
    else:
        mom_growth = None  # no prior month to compare against - be honest about that, don't fake a 0%

    burn = expenses - revenue
    runway_months = cash_balance / burn if burn > 0 else None

    return {
        "revenue": revenue,
        "expenses": expenses,
        "margin": margin,
        "mom_growth": mom_growth,
        "runway_months": runway_months,
    }


if __name__ == "__main__":
    # Run this file on its own to check every divide-by-zero guard
    # actually holds - real pandas DataFrames built in memory, no CSV
    # file needed:  python metrics.py
    import pandas as pd

    print("Checking a normal two-month case with growth...")
    df = pd.DataFrame({
        "date": pd.to_datetime(["2026-07-01", "2026-07-15", "2026-08-01", "2026-08-15"]),
        "amount": [1000.0, -400.0, 1500.0, -400.0],
        "category": ["Sales", "Rent", "Sales", "Rent"],
        "description": ["a", "b", "c", "d"],
        "month": pd.to_datetime(["2026-07-01", "2026-07-15", "2026-08-01", "2026-08-15"]).to_period("M"),
    })
    result = compute_metrics(df, cash_balance=10000)
    assert result["revenue"] == 1500.0
    assert result["mom_growth"] == 50.0  # (1500-1000)/1000 * 100
    print("  OK -", result)

    print("\nChecking a $0-revenue month doesn't crash margin or mom_growth...")
    zero_revenue_df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-01"]),
        "amount": [-500.0],
        "category": ["Rent"],
        "description": ["a"],
        "month": pd.to_datetime(["2026-08-01"]).to_period("M"),
    })
    result = compute_metrics(zero_revenue_df, cash_balance=10000)
    assert result["revenue"] == 0.0
    assert result["margin"] == -50000.0  # (0 - 500) / max(0,1) * 100 -- finite, not NaN/crash
    print("  OK - zero revenue produced a finite (if dramatic) margin instead of crashing:", result["margin"])

    print("\nChecking a single-month DataFrame (no prior month) reports mom_growth as None, not a fake 0%...")
    assert result["mom_growth"] is None
    print("  OK")

    print("\nChecking a profitable month (revenue > expenses, so burn <= 0) reports runway as None, not infinity...")
    profitable_df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-01", "2026-08-02"]),
        "amount": [2000.0, -500.0],
        "category": ["Sales", "Rent"],
        "description": ["a", "b"],
        "month": pd.to_datetime(["2026-08-01", "2026-08-02"]).to_period("M"),
    })
    result = compute_metrics(profitable_df, cash_balance=10000)
    assert result["runway_months"] is None
    print("  OK - runway_months is None (\"not burning cash\") rather than float('inf') or a crash")

    print("\nChecking a real burn produces a finite, sane runway...")
    burning_df = pd.DataFrame({
        "date": pd.to_datetime(["2026-08-01", "2026-08-02"]),
        "amount": [500.0, -1500.0],
        "category": ["Sales", "Payroll"],
        "description": ["a", "b"],
        "month": pd.to_datetime(["2026-08-01", "2026-08-02"]).to_period("M"),
    })
    result = compute_metrics(burning_df, cash_balance=10000)
    assert result["runway_months"] == 10.0  # burn=1000, 10000/1000
    print("  OK - runway_months =", result["runway_months"])

    print("\nAll checks passed.")
