"""
Step 2 of the HR Recruitment Screening Agent (part 2).

Turns a CV and a job description into a structured, 1-10 score across
four dimensions. The JSON parsing is defensive (a stray code fence is
stripped, not fatal), and this project's safety guard checks that
overall_score is actually consistent with the four dimension scores
it's supposed to summarize - not just any number 1-10 the AI feels like.
"""

import json

from sdt_ai import ask_ai

SCORE_FIELDS = ["skills_match", "experience_level", "culture_fit", "growth_trajectory", "overall_score"]
VALID_RECOMMENDATIONS = {"Strong Yes", "Yes", "Maybe", "No"}

# How far overall_score is allowed to drift from the average of the 4
# dimension scores before this project flags it for manual review. A
# real LLM failure mode: it reasons carefully about each dimension, then
# writes an overall_score that doesn't actually follow from them (e.g.
# all four dimensions score 4-5, but overall_score comes back as 9).
MAX_OVERALL_SCORE_DRIFT = 3

MAX_CV_CHARACTERS = 6000


def build_prompt(cv_text, jd_text):
    trimmed = cv_text[:MAX_CV_CHARACTERS]
    return f"""Job description:
{jd_text}

Candidate CV:
{trimmed}

Score the candidate 1-10 on each of: skills_match, experience_level,
culture_fit, growth_trajectory. Then give an overall_score (1-10) that
should be roughly consistent with those four - not a separate,
unrelated judgment.

Also give top 3 strengths, top 2 gaps (as arrays of strings), and a
recommendation - exactly one of: "Strong Yes", "Yes", "Maybe", "No".

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"skills_match": 0, "experience_level": 0, "culture_fit": 0, "growth_trajectory": 0,
"overall_score": 0, "strengths": ["...", "...", "..."], "gaps": ["...", "..."],
"recommendation": "..."}}"""


def parse_score_reply(reply):
    """
    Turns the AI's reply into a dict, tolerating a ```json code fence.
    Returns None (never raises) if the reply isn't valid JSON at all.
    """
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def validate_score(data):
    """
    Checks the parsed score data for two things: every required field
    is present and numerically in range, and overall_score is actually
    consistent with the four dimension scores it's meant to summarize.

    Mutates and returns data with an extra "needs_review" field (and a
    "review_reason" if True) - this NEVER changes overall_score itself,
    it only flags a suspicious one for a human to double check, the same
    "flag, don't silently fix" pattern used throughout this course.
    """
    missing = [f for f in SCORE_FIELDS if not isinstance(data.get(f), (int, float))]
    if missing:
        data["needs_review"] = True
        data["review_reason"] = f"Missing or non-numeric field(s): {', '.join(missing)}"
        return data

    out_of_range = [f for f in SCORE_FIELDS if not (1 <= data[f] <= 10)]
    if out_of_range:
        data["needs_review"] = True
        data["review_reason"] = f"Field(s) outside the 1-10 range: {', '.join(out_of_range)}"
        return data

    dimension_scores = [data[f] for f in SCORE_FIELDS if f != "overall_score"]
    average = sum(dimension_scores) / len(dimension_scores)
    drift = abs(data["overall_score"] - average)

    if drift > MAX_OVERALL_SCORE_DRIFT:
        data["needs_review"] = True
        data["review_reason"] = (
            f"overall_score ({data['overall_score']}) is {drift:.1f} points away from "
            f"the average of the four dimension scores ({average:.1f}) - check whether "
            f"either number actually reflects the CV."
        )
        return data

    if data.get("recommendation") not in VALID_RECOMMENDATIONS:
        data["needs_review"] = True
        data["review_reason"] = f"Unrecognised recommendation: {data.get('recommendation')!r}"
        return data

    data["needs_review"] = False
    data["review_reason"] = ""
    return data


def score_candidate(cv_text, jd_text):
    """
    The main function. Give it CV text and a job description, get back
    the validated score dict.
    """
    prompt = build_prompt(cv_text, jd_text)
    reply = ask_ai(prompt, max_tokens=600, project="hr-recruitment-screening-agent")

    data = parse_score_reply(reply)
    if data is None:
        raise ValueError(
            "The AI's reply wasn't valid JSON.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return validate_score(data)


if __name__ == "__main__":
    # Run this file on its own to check parsing and the consistency
    # guard work - no AI call, no credits spent:  python score.py

    print("Checking a well-formed, internally consistent score...")
    good = {
        "skills_match": 8, "experience_level": 7, "culture_fit": 7, "growth_trajectory": 8,
        "overall_score": 7, "strengths": ["a", "b", "c"], "gaps": ["x", "y"],
        "recommendation": "Yes",
    }
    result = validate_score(dict(good))
    assert result["needs_review"] is False
    print("  OK - needs_review is False")

    print("\nChecking a score where overall_score doesn't match the dimensions at all...")
    inconsistent = dict(good)
    inconsistent["overall_score"] = 2
    result = validate_score(inconsistent)
    assert result["needs_review"] is True
    assert "overall_score" in result["review_reason"]
    print("  OK -", result["review_reason"])

    print("\nChecking a score with a field out of the 1-10 range...")
    out_of_range = dict(good)
    out_of_range["skills_match"] = 15
    result = validate_score(out_of_range)
    assert result["needs_review"] is True
    assert "skills_match" in result["review_reason"]
    print("  OK -", result["review_reason"])

    print("\nChecking a score with a missing field entirely...")
    missing_field = dict(good)
    del missing_field["culture_fit"]
    result = validate_score(missing_field)
    assert result["needs_review"] is True
    assert "culture_fit" in result["review_reason"]
    print("  OK -", result["review_reason"])

    print("\nChecking an unrecognised recommendation string...")
    bad_recommendation = dict(good)
    bad_recommendation["recommendation"] = "Definitely hire!!"
    result = validate_score(bad_recommendation)
    assert result["needs_review"] is True
    print("  OK -", result["review_reason"])

    print("\nChecking parse_score_reply() strips a ```json code fence...")
    fenced = '```json\n{"overall_score": 7}\n```'
    assert parse_score_reply(fenced) == {"overall_score": 7}
    print("  OK")

    print("\nChecking a non-JSON reply returns None instead of crashing...")
    assert parse_score_reply("Sorry, I can't score that.") is None
    print("  OK")

    print("\nAll checks passed.")
