"""
Step 3 of the Code Review Agent.

This is where the actual code review happens. The AI's JSON reply is
parsed defensively (a stray code fence is stripped, not fatal), and the
line-number guard here is the project's core safety feature: any
comment whose line number isn't actually part of the diff is dropped,
since the AI can't have legitimately reviewed a line it was never shown.
"""

import json
import re

from sdt_ai import ask_ai

SEVERITIES = {"low", "medium", "high"}


def build_prompt(filename, patch):
    return f"""Review this diff for bugs, security issues, performance problems,
and readability. Prioritize bugs, security, and performance - do not
flag pure style preferences.

File: {filename}
Diff:
{patch}

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"comments": [{{"line": <line number in the diff>, "severity": "low|medium|high", "comment": "..."}}], "summary": "one sentence"}}

If there are no issues, return {{"comments": [], "summary": "Looks good"}}."""


def parse_review_reply(reply):
    """
    Turns the AI's reply into {"comments": [...], "summary": "..."},
    tolerating a code fence and dropping any comment with an
    unrecognised severity.

        parse_review_reply('```json\\n{"comments": [], "summary": "Looks good"}\\n```')

    Returns None (never raises) if the reply isn't valid JSON at all.
    """
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return None

    comments = [
        c for c in data.get("comments", [])
        if isinstance(c.get("line"), int) and c.get("severity") in SEVERITIES
    ]
    return {"comments": comments, "summary": data.get("summary", "")}


def valid_line_numbers(patch):
    """
    Parses a unified diff patch (GitHub's `files[].patch` field) and
    returns the set of NEW-file line numbers that actually appear in the
    diff - only these are valid positions for a GitHub PR review comment.

        valid_line_numbers("@@ -1,3 +1,4 @@\\n def foo():\\n-    return 1\\n+    return 2\\n+    # comment")
        -> {1, 2, 3}
    """
    valid = set()
    new_line = None
    for line in patch.splitlines():
        if line.startswith("@@"):
            match = re.search(r"\+(\d+)", line)
            new_line = int(match.group(1)) if match else None
            continue
        if new_line is None:
            continue
        if line.startswith("-"):
            continue
        valid.add(new_line)
        new_line += 1
    return valid


def filter_valid_comments(comments, patch):
    """
    Drops any comment whose line number isn't actually part of the diff.

    This is the project's core safety guard: the AI is asked for a line
    number inside the diff, but nothing stops it from citing a line
    outside the changed range - hallucinating a line further down an
    unchanged part of the file it never actually saw. A comment on a
    line GitHub's API would reject anyway is worse than no comment - it
    would silently fail to post instead of flagging the real issue.
    """
    valid_lines = valid_line_numbers(patch)
    kept = []
    for comment in comments:
        if comment["line"] in valid_lines:
            kept.append(comment)
        else:
            print(f"  Dropped a comment on line {comment['line']} - not part of this diff.")
    return kept


def review_file(filename, patch):
    """
    The main function. Give it one changed file's name and patch, get
    back {"comments": [...], "summary": "..."} with every comment's
    line number validated against the actual diff.
    """
    prompt = build_prompt(filename, patch)
    reply = ask_ai(prompt, max_tokens=1500, project="code-review-agent")

    parsed = parse_review_reply(reply)
    if parsed is None:
        raise ValueError(
            "The AI's reply wasn't valid JSON.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    parsed["comments"] = filter_valid_comments(parsed["comments"], patch)
    return parsed


if __name__ == "__main__":
    # Run this file on its own to check parsing and the line-number
    # guard work - no AI call, no credits spent:  python reviewer.py

    SAMPLE_PATCH = "@@ -1,3 +1,4 @@\n def foo():\n-    return 1\n+    return 2\n+    # comment"

    print("Checking valid_line_numbers()...")
    lines = valid_line_numbers(SAMPLE_PATCH)
    assert lines == {1, 2, 3}
    print("  OK -", lines)

    print("\nChecking parse_review_reply() with a clean reply...")
    clean_reply = '{"comments": [{"line": 2, "severity": "high", "comment": "hardcoded value"}], "summary": "One issue found"}'
    result = parse_review_reply(clean_reply)
    assert len(result["comments"]) == 1
    print("  OK -", result)

    print("\nChecking a ```json-fenced reply gets stripped correctly...")
    fenced = '```json\n{"comments": [], "summary": "Looks good"}\n```'
    assert parse_review_reply(fenced) == {"comments": [], "summary": "Looks good"}
    print("  OK")

    print("\nChecking a comment with an invalid severity gets dropped by parse_review_reply()...")
    bad_severity = '{"comments": [{"line": 2, "severity": "critical", "comment": "x"}], "summary": "..."}'
    assert parse_review_reply(bad_severity)["comments"] == []
    print("  OK - unrecognised severity 'critical' correctly dropped")

    print("\nChecking filter_valid_comments() drops an out-of-range line number...")
    comments = [
        {"line": 2, "severity": "high", "comment": "real issue, line 2 is in the diff"},
        {"line": 999, "severity": "high", "comment": "hallucinated - line 999 was never in this diff"},
    ]
    kept = filter_valid_comments(comments, SAMPLE_PATCH)
    assert len(kept) == 1
    assert kept[0]["line"] == 2
    print("  OK - the out-of-range comment was dropped, the real one was kept")

    print("\nChecking a reply that isn't JSON at all...")
    assert parse_review_reply("Sorry, I can't review that.") is None
    print("  OK - returned None instead of crashing")

    print("\nAll checks passed.")
