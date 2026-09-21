"""
Step 4 of the HR Recruitment Screening Agent - an optional bias-
reduction mode that strips a few common identity signals from a CV
before it's scored, so the model judges substance first.

This is a real, useful mitigation, not a complete solution - a name,
school, or writing style can still leak plenty of the same signal even
after this redaction. Treat it as one input into a broader bias-
reduction process, not a guarantee of an unbiased score.
"""

import re

# Gendered pronouns and titles, matched as whole words only so this
# doesn't also mangle unrelated text that happens to contain these
# letters.
GENDERED_TERMS = re.compile(r"\b(he|she|his|her|hers|mr\.?|ms\.?|mrs\.?)\b", re.IGNORECASE)

# A 4-digit year within about 30 characters of the word "graduat..." -
# close enough to almost always be a graduation year, not, say, a phone
# number or an unrelated date elsewhere on the page.
GRADUATION_YEAR = re.compile(r"(graduat\w*.{0,30}?)\b(19|20)\d{2}\b", re.IGNORECASE)


def redact_pii(cv_text):
    """
    Replaces gendered pronouns/titles with "[REDACTED]" and a nearby
    graduation year with "[YEAR]".

        redact_pii("She graduated in 2015 with honors.")

    Pure function, no network call - tested below with real regex
    matches, not mocked data.
    """
    text = GENDERED_TERMS.sub("[REDACTED]", cv_text)
    text = GRADUATION_YEAR.sub(lambda m: m.group(1) + "[YEAR]", text)
    return text


if __name__ == "__main__":
    # Run this file on its own to check the redaction works - no
    # network call, no AI needed:  python blind_review.py
    print("Checking gendered pronouns and titles are redacted...")
    text = "She led the team. Ms. Obi later became Mr. Chen's manager. His performance was strong."
    redacted = redact_pii(text)
    assert "She" not in redacted and "His" not in redacted
    assert "Ms." not in redacted and "Mr." not in redacted
    assert redacted.count("[REDACTED]") == 4
    print("  OK -", redacted)

    print("\nChecking a graduation year near the word 'graduated' is redacted...")
    text2 = "She graduated in 2015 from State University."
    redacted2 = redact_pii(text2)
    assert "2015" not in redacted2
    assert "[YEAR]" in redacted2
    print("  OK -", redacted2)

    print("\nChecking an unrelated 4-digit number elsewhere is NOT redacted...")
    text3 = "Managed a team and grew revenue to 2015 thousand dollars."
    redacted3 = redact_pii(text3)
    assert "2015" in redacted3
    print("  OK - a number with no nearby 'graduat...' context was correctly left alone:", redacted3)

    print("\nAll checks passed.")
