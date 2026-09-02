"""
Step 3 of the Calendar & Task Prioritizer Agent - the actual "prioritizer".

Builds one prompt out of today's calendar events and open tasks, asks the
AI for a plan, and turns its reply into time-of-day blocks you can read,
print, or hand to main.py to save as a file.
"""

from sdt_ai import ask_ai

# Three broad blocks rather than exact time slots. Asking the AI to place
# things at precise minutes (like "09:07") invites it to invent precision
# it doesn't have - it doesn't know how long your commute is or how
# focused you'll actually be. Morning/afternoon/evening is honest about
# what an AI reading a calendar and a to-do list can judge well (relative
# priority, rough sequencing), and not what it can't (your real day).
SECTIONS = ["MORNING", "AFTERNOON", "EVENING"]

# Anything that doesn't fit lands here instead of vanishing. This section
# only appears in the AI's reply when something is genuinely left over.
OVERFLOW_SECTION = "UNSCHEDULED"

ALL_SECTIONS = SECTIONS + [OVERFLOW_SECTION]


def format_events_for_prompt(events):
    """Turns the list of event dicts from calendar_client into readable
    lines for the prompt. Kept separate so build_prompt stays skimmable."""
    if not events:
        return "(no calendar events today)"
    lines = []
    for event in events:
        when = "all day" if event["all_day"] else f"{event['start']}-{event['end']}"
        lines.append(f"- {when}: {event['summary']}")
    return "\n".join(lines)


def format_tasks_for_prompt(tasks):
    if not tasks:
        return "(no open tasks)"
    return "\n".join(f"- {task}" for task in tasks)


def build_prompt(events, tasks):
    """
    Writes the instructions sent to the AI. Kept in its own function so
    you can print it and read exactly what's being asked - the fastest
    way to fix a plan you don't like is to fix the prompt, not to argue
    with the AI about it.
    """
    return f"""You are a calendar assistant. Build today's plan from the
fixed calendar events and open tasks listed below.

TODAY'S CALENDAR EVENTS (fixed - do not move them or invent new ones):
{format_events_for_prompt(events)}

OPEN TASKS (fit these around the events above, in priority order):
{format_tasks_for_prompt(tasks)}

Rules:
- Every calendar event listed above must appear in the plan exactly once.
- Every task listed above must appear in the plan exactly once. If a task
  genuinely will not fit anywhere today, still list it - in an
  [{OVERFLOW_SECTION}] section at the end - with a one-line reason why.
- Do not invent tasks or events that were not given to you.

Format your answer EXACTLY like this, with the section name in square
brackets on its own line, then bullet points underneath it. Use only the
section names below, in this order, and skip a section entirely if
nothing belongs in it:

[MORNING]
- ...

[AFTERNOON]
- ...

[EVENING]
- ...

[{OVERFLOW_SECTION}]
- ...

After the last section, write [END] on its own line.

Do not add any explanation, introduction or closing remark.
"""


def split_plan(reply):
    """
    Turns the AI's one long answer into a dict, one entry per section:

        {"MORNING": "- ...\n- ...", "AFTERNOON": "...", ...}

    Same [MARKER] approach as the Social Post Generator project, for the
    same reason: markers degrade gracefully (a line we don't recognise is
    simply ignored) where asking for JSON instead degrades by crashing
    the whole program the first time the AI adds a stray comma.
    """
    plan = {}
    current_section = None
    current_lines = []

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        # [END] tells us the plan is finished. Without it, a friendly
        # sign-off like "Let me know if you'd like adjustments!" gets
        # glued onto the last section and saved into your plan file.
        if is_marker and marker == "END":
            break

        if is_marker and marker in ALL_SECTIONS:
            if current_section:
                plan[current_section] = "\n".join(current_lines).strip()
            current_section = marker
            current_lines = []
        elif current_section:
            # The AI sometimes wraps its whole answer in ``` code fences.
            # Those aren't part of the plan, so drop them.
            if stripped.startswith("```"):
                continue
            current_lines.append(line)

    if current_section:
        plan[current_section] = "\n".join(current_lines).strip()

    return plan


def check_plan_coverage(plan, tasks):
    """
    Compares the parsed plan against the original task list and reports
    anything that looks wrong, INSTEAD OF trusting that the AI followed
    the "every task exactly once" rule we asked for in the prompt.

    Returns a list of human-readable warning strings (empty if the plan
    looks complete). Two specific failure modes this catches, because
    they are the two ways a plan that "looks fine at a glance" quietly
    loses real work:

    - A DROPPED task: it never appears anywhere in the reply. Easy to
      miss when skimming a long plan - you only notice at 4pm that the
      thing you asked about never got scheduled at all.
    - A DOUBLE-BOOKED task: the same task text shows up in more than one
      section. This happens more than you'd expect when a model is asked
      to both "prioritise" and "don't drop anything" for an ambiguous
      task - it sometimes hedges by placing it in two blocks instead of
      picking one.

    This is substring matching on the task text, not exact matching -
    the AI usually restates a task with a little of its own phrasing
    around it (e.g. adding a time or a note), so requiring an identical
    string would produce false "DROPPED" warnings on a plan that is
    actually fine.
    """
    warnings = []

    for task in tasks:
        task_lower = task.lower()
        appearances = sum(
            1 for section_text in plan.values() if task_lower in section_text.lower()
        )

        if appearances == 0:
            warnings.append(f'DROPPED: "{task}" does not appear anywhere in the plan.')
        elif appearances > 1:
            warnings.append(f'DOUBLE-BOOKED: "{task}" appears in {appearances} sections.')

    return warnings


def plan_day(events, tasks):
    """
    The main function. Give it events and tasks, get back a checked plan.

        result = plan_day(events, tasks)
        print(result["plan"])
        print(result["warnings"])

    Returns a dict rather than raw text because a plan you can't verify
    isn't a plan you can trust with your actual day - this hands back
    both what the AI said AND what we double-checked about it.
    """
    prompt = build_prompt(events, tasks)

    # max_tokens: a full day's plan (three sections plus a possible
    # overflow one, each a handful of bullets) fits comfortably in 700
    # tokens. This is also a Haiku-tier task - reorganising a short list
    # you already gave it is not a job that needs a pricier model.
    reply = ask_ai(
        prompt,
        max_tokens=700,
        project="calendar-task-prioritizer-agent",
    )

    plan = split_plan(reply)

    if not plan:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    warnings = check_plan_coverage(plan, tasks)

    return {"plan": plan, "warnings": warnings, "raw_reply": reply}


if __name__ == "__main__":
    # Run this file on its own to check both the parsing AND the
    # coverage-check logic, using two fake AI replies - one well-formed,
    # one broken the way a real model occasionally is:
    #     python prioritizer.py
    fake_tasks = [
        "Finish the Q3 budget review",
        "Reply to the vendor contract email",
        "Review pull request #482",
    ]

    good_reply = """[MORNING]
- 09:00-09:15 Team standup
- Finish the Q3 budget review

[AFTERNOON]
- 14:30-15:00 Client call
- Reply to the vendor contract email
- Review pull request #482

[EVENING]
- Wind down, nothing else scheduled

[END]"""

    print("--- Well-formed reply ---")
    good_plan = split_plan(good_reply)
    good_warnings = check_plan_coverage(good_plan, fake_tasks)
    print(f"Sections found: {list(good_plan.keys())}")
    print(f"Warnings: {good_warnings}")
    assert list(good_plan.keys()) == ["MORNING", "AFTERNOON", "EVENING"]
    assert good_warnings == []

    # A malformed reply: drops "Review pull request #482" entirely, and
    # double-books "Reply to the vendor contract email" into two sections.
    # A real model produces this kind of thing occasionally - the parser
    # must surface it, not silently hand back an incomplete plan.
    broken_reply = """[MORNING]
- 09:00-09:15 Team standup
- Finish the Q3 budget review
- Reply to the vendor contract email

[AFTERNOON]
- 14:30-15:00 Client call
- Reply to the vendor contract email

[END]"""

    print("\n--- Malformed reply (dropped + double-booked task) ---")
    broken_plan = split_plan(broken_reply)
    broken_warnings = check_plan_coverage(broken_plan, fake_tasks)
    for warning in broken_warnings:
        print(f"  {warning}")

    assert any("DROPPED" in w and "pull request #482" in w for w in broken_warnings)
    assert any("DOUBLE-BOOKED" in w and "vendor contract email" in w for w in broken_warnings)
    assert len(broken_warnings) == 2

    print("\nAll checks passed.")
