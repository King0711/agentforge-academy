"""
Step 1 of the Sales Email Personalization Agent (part 2) - finds and
verifies an email address with Hunter.io.
"""

import requests

# Hunter.io itself recommends treating anything below this confidence
# score as too risky to send to - sending to an unverified address hurts
# sender reputation and deliverability for every FUTURE email you send,
# not just this one.
MIN_CONFIDENCE = 50

HUNTER_URL = "https://api.hunter.io/v2/email-finder"


def is_confident_enough(confidence, min_confidence=MIN_CONFIDENCE):
    """Pure function - tested below without a real Hunter.io account."""
    return confidence is not None and confidence >= min_confidence


def find_email(first_name, last_name, domain, api_key):
    """
    Calls Hunter.io's Email Finder API and returns
    {"email": ..., "confidence": ..., "usable": bool}.

    "usable" is False (not just a low number left for you to interpret)
    when confidence is below MIN_CONFIDENCE or no email was found at
    all - main.py skips sending to any prospect where usable is False.
    """
    response = requests.get(
        HUNTER_URL,
        params={"domain": domain, "first_name": first_name, "last_name": last_name, "api_key": api_key},
        timeout=15,
    )
    response.raise_for_status()
    data = response.json().get("data", {})

    email = data.get("email")
    confidence = data.get("score")

    return {
        "email": email,
        "confidence": confidence,
        "usable": bool(email) and is_confident_enough(confidence),
    }


if __name__ == "__main__":
    # Run this file on its own to check the confidence guard works - no
    # Hunter.io account or network call needed:  python hunter.py
    assert is_confident_enough(75) is True
    assert is_confident_enough(50) is True  # boundary is inclusive
    assert is_confident_enough(49) is False
    assert is_confident_enough(None) is False
    print("Confidence threshold correctly applied: 75/50 usable, 49/None not usable.")

    print("\nAll checks passed.")
