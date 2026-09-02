"""
Calendar & Task Prioritizer Agent - runs the whole pipeline.

Run with:      python main.py

This is deliberately a single plain script with no screen to click
"Generate" on (unlike the Social Post Generator's Streamlit app). A
morning-planning tool you'd actually want to run automatically - from
cron on Mac/Linux, or Task Scheduler on Windows - needs to work as a
script with no browser tab involved, which is also why it saves the plan
to a file instead of only printing it.
"""

import datetime

from calendar_client import get_today_events
from tasks import get_tasks
from prioritizer import ALL_SECTIONS, plan_day
from sdt_ai import AIError

PLAN_FILE = "todays_plan.txt"

# Fixed display order. The AI writes sections in whatever order it
# chooses, and split_plan() (in prioritizer.py) hands them back as a
# dict, so relying on dict order would mean today's saved file might
# read Morning/Evening/Afternoon depending on how the model felt like
# answering. Pinning the order here means it always reads top-to-bottom.
DISPLAY_ORDER = ALL_SECTIONS


def render_plan_text(plan, warnings):
    """
    Turns the {"MORNING": ..., ...} dict into one plain-text document,
    ready to print or save. Pure formatting - no network calls - so it's
    the one piece of main.py's logic that can be checked with a fake
    plan below, no live Google or AI account required.
    """
    today = datetime.date.today().strftime("%A, %B %d")
    lines = [f"Your plan for {today}", "=" * 40, ""]

    for section in DISPLAY_ORDER:
        if section not in plan:
            continue
        lines.append(section.title())
        lines.append("-" * len(section))
        lines.append(plan[section])
        lines.append("")

    if warnings:
        lines.append("Double-check these before trusting the plan:")
        for warning in warnings:
            lines.append(f"  - {warning}")
        lines.append("")

    return "\n".join(lines)


def main():
    print("Fetching today's calendar events...")
    try:
        events = get_today_events()
    except FileNotFoundError as problem:
        # This is the expected failure the first time anyone runs this
        # without having done the Google Cloud Console setup in Build 1 -
        # show the friendly message from calendar_client.py, not a stack
        # trace, and stop cleanly instead of crashing further down.
        print(problem)
        return
    print(f"Found {len(events)} event(s).")

    print("Reading your task list...")
    tasks = get_tasks()
    print(f"Found {len(tasks)} task(s).")

    if not events and not tasks:
        print(
            "Nothing to plan - add events to your Google Calendar or "
            "tasks to tasks.txt, then try again."
        )
        return

    print("Asking the AI to build today's plan...")
    try:
        result = plan_day(events, tasks)
    except AIError as problem:
        # Written to be read - show it as-is, same convention as every
        # other project in this course.
        print(problem)
        return

    text = render_plan_text(result["plan"], result["warnings"])
    print("\n" + text)

    with open(PLAN_FILE, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Saved to {PLAN_FILE}")

    if result["warnings"]:
        print(
            f"\n{len(result['warnings'])} warning(s) above - the AI's plan "
            "didn't fully match your task list. Read them before you rely "
            "on this plan for your day."
        )


if __name__ == "__main__":
    # A quick self-check of the pure formatting logic before doing
    # anything that needs live accounts - if this fails, nothing below
    # it will work right either, so it's worth 5 lines to catch early.
    _fake_plan = {
        "MORNING": "- Standup",
        "UNSCHEDULED": '- Book dentist appointment (no free slot today)',
    }
    _text = render_plan_text(_fake_plan, warnings=['DROPPED: "Something" does not appear anywhere in the plan.'])
    assert "Morning" in _text and "Unscheduled" in _text and "DROPPED" in _text
    assert "Afternoon" not in _text  # sections with nothing in them are skipped entirely

    main()
