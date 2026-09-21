"""
Step 3 of the Financial Reporting Agent (part 2) - turns the computed
metrics into plain-English commentary a non-finance person can read.
This project's safety guard checks that the commentary actually
references the REAL computed numbers, rather than the AI improvising
plausible-sounding figures of its own.
"""

import re

from sdt_ai import ask_ai


def build_prompt(metrics):
    growth_line = (
        f"Month-over-month revenue growth: {metrics['mom_growth']:.1f}%"
        if metrics["mom_growth"] is not None
        else "Month-over-month revenue growth: not available (only one month of data)"
    )
    runway_line = (
        f"Cash runway: {metrics['runway_months']:.1f} months"
        if metrics["runway_months"] is not None
        else "Cash runway: not burning cash this month"
    )

    return f"""You are a CFO writing a monthly update for the leadership team.

Revenue: {metrics['revenue']:.2f}
Expenses: {metrics['expenses']:.2f}
Gross margin: {metrics['margin']:.1f}%
{growth_line}
{runway_line}

Write 3 short plain-English paragraphs: overall health, what's driving
the numbers, and one recommended action. No jargon. Reference the
actual figures above - do not invent different numbers."""


def mentions_real_numbers(commentary, metrics):
    """
    Returns True if the commentary text contains at least one number
    that's close to one of the REAL computed metrics (margin, growth,
    runway - each rounded to the nearest whole number, since prose
    commentary naturally rounds).

        mentions_real_numbers("Margin came in around 42%...", {"margin": 42.3, ...})

    This doesn't try to fact-check every sentence - that's not
    realistically checkable against free text. It catches the cruder,
    more common failure: the AI ignoring the provided numbers entirely
    and writing generic commentary that could apply to any company. If
    NONE of the real figures show up anywhere in the text, that's worth
    flagging before the report goes out.
    """
    numbers_in_text = {int(round(float(n))) for n in re.findall(r"-?\d+(?:\.\d+)?", commentary)}

    real_numbers = set()
    for key in ("margin", "mom_growth", "runway_months"):
        value = metrics.get(key)
        if value is not None:
            real_numbers.add(int(round(value)))

    # Allow off-by-one for rounding differences (42.6% might get written as "43%").
    return any(abs(n - r) <= 1 for n in numbers_in_text for r in real_numbers)


def write_commentary(metrics):
    """
    The main function. Give it the computed metrics dict, get back the
    commentary string. Prints a warning (does not raise - a warning is
    the right severity here, not a hard failure over prose) if none of
    the real numbers appear anywhere in the AI's reply.
    """
    prompt = build_prompt(metrics)
    commentary = ask_ai(prompt, max_tokens=500, project="financial-reporting-agent")

    if not mentions_real_numbers(commentary, metrics):
        print(
            "  Warning: the commentary doesn't seem to reference any of the actual "
            "computed figures - read it before including it in the report."
        )

    return commentary


if __name__ == "__main__":
    # Run this file on its own to check prompt-building and the
    # number-reference guard work - no AI call, no credits spent:
    #     python commentary.py
    metrics = {"revenue": 1500.0, "expenses": 1000.0, "margin": 33.3, "mom_growth": 50.0, "runway_months": None}

    print("Checking build_prompt() includes the real figures...")
    prompt = build_prompt(metrics)
    assert "33.3" in prompt
    assert "50.0%" in prompt
    assert "not burning cash" in prompt
    print("  OK")

    print("\nChecking mentions_real_numbers() with commentary that DOES reference the real figures...")
    good_commentary = "Revenue grew about 50% this month, and margin held around 33%. Strong month overall."
    assert mentions_real_numbers(good_commentary, metrics) is True
    print("  OK")

    print("\nChecking mentions_real_numbers() with generic commentary that ignores the real figures...")
    generic_commentary = "The company is performing reasonably well this quarter with steady progress."
    assert mentions_real_numbers(generic_commentary, metrics) is False
    print("  OK - correctly flagged as not referencing any real number")

    print("\nChecking a single-month case (mom_growth=None) still builds a valid prompt...")
    single_month_metrics = {"revenue": 1000.0, "expenses": 400.0, "margin": 60.0, "mom_growth": None, "runway_months": None}
    prompt = build_prompt(single_month_metrics)
    assert "not available" in prompt
    print("  OK")

    print("\nAll checks passed.")
