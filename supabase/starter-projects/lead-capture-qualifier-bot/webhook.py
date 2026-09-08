"""
Step 1 of the Lead Capture & Qualifier Bot.

This file has one job: take the raw JSON Typeform sends to your webhook
and turn it into a plain Python dict with the answers you actually care
about. Typeform's real payload is deeply nested (a form definition, an
answers list, a different shape per question type) - this hides all of
that so the rest of the project can just do lead["email"], lead["company"],
and so on.
"""

# The six questions this project's Typeform form is expected to have,
# and the exact title text used for each. Typeform gives every field a
# random ID that's different on every form, so title text - not ID - is
# what we use to line an answer up with a field. If you rename a
# question in Typeform, update the matching value here too.
FIELD_TITLES = {
    "full_name": "Full name",
    "email": "Work email",
    "company": "Company name",
    "company_size": "Company size",
    "budget": "Budget range",
    "challenge": "What's your biggest challenge right now?",
}


def _value_from_answer(answer):
    """
    Typeform sends a different JSON shape per question type - a short
    text answer looks nothing like a multiple-choice answer. This is
    the full list of shapes this form's six questions can use; see the
    Typeform webhook docs linked in this course's Resources for the
    handful of other types (files, dates, ratings) this form doesn't.
    """
    answer_type = answer.get("type")
    if answer_type == "text":
        return answer.get("text", "")
    if answer_type == "email":
        return answer.get("email", "")
    if answer_type == "number":
        return answer.get("number")
    if answer_type == "choice":
        # Single-select multiple choice: {"choice": {"label": "..."}}
        return answer.get("choice", {}).get("label", "")
    if answer_type == "choices":
        # Multi-select: {"choices": {"labels": ["...", "..."]}}
        return ", ".join(answer.get("choices", {}).get("labels", []))
    if answer_type == "boolean":
        return answer.get("boolean")
    # A field type this project doesn't use (e.g. a file upload). Returning
    # None instead of raising means one unexpected question type can't take
    # down the whole webhook - see this course's Troubleshooting section.
    return None


def parse_typeform_payload(payload):
    """
    Turns a raw Typeform webhook body into a simple lead dict.

        lead = parse_typeform_payload(request.get_json())
        lead["email"]    # "jane@acme.com"
        lead["company"]  # "Acme Inc"

    A question Typeform doesn't return an answer for (skipped because it
    wasn't required, or bypassed by Logic Jump) comes back as "" here
    rather than raising - Typeform only includes answered questions in
    the payload, so a missing one is normal, not an error.
    """
    form_response = payload.get("form_response", {})

    # Every webhook delivery includes the form's own field definitions,
    # not just the answers - which is what lets us build a
    # {field_id: title} lookup here instead of hardcoding your form's
    # (randomly generated, different-per-form) field IDs anywhere.
    fields = form_response.get("definition", {}).get("fields", [])
    title_by_id = {field["id"]: field["title"] for field in fields}

    answers_by_title = {}
    for answer in form_response.get("answers", []):
        field_id = answer.get("field", {}).get("id")
        title = title_by_id.get(field_id)
        if title is None:
            continue
        answers_by_title[title] = _value_from_answer(answer)

    return {
        key: answers_by_title.get(title, "")
        for key, title in FIELD_TITLES.items()
    }


if __name__ == "__main__":
    # Run this file on its own to check the parsing works: python webhook.py
    #
    # This is a trimmed but structurally real Typeform webhook payload -
    # the same shape Typeform actually sends, just missing extra fields
    # (like "hidden" or "landed_at") this project doesn't read.
    # parse_typeform_payload() ignores anything it doesn't recognise, so
    # trimming those out here doesn't change what's being tested.
    FAKE_PAYLOAD = {
        "event_id": "LtWXD3crgy",
        "event_type": "form_response",
        "form_response": {
            "form_id": "abc123",
            "token": "a3a12ec67",
            "submitted_at": "2026-08-20T10:15:00Z",
            "definition": {
                "id": "abc123",
                "title": "Book a demo",
                "fields": [
                    {"id": "f_name", "title": "Full name", "type": "short_text"},
                    {"id": "f_email", "title": "Work email", "type": "email"},
                    {"id": "f_company", "title": "Company name", "type": "short_text"},
                    {"id": "f_size", "title": "Company size", "type": "multiple_choice"},
                    {"id": "f_budget", "title": "Budget range", "type": "multiple_choice"},
                    {"id": "f_challenge", "title": "What's your biggest challenge right now?", "type": "long_text"},
                ],
            },
            "answers": [
                {"type": "text", "text": "Jane Okafor", "field": {"id": "f_name", "type": "short_text"}},
                {"type": "email", "email": "jane@acme.com", "field": {"id": "f_email", "type": "email"}},
                {"type": "text", "text": "Acme Inc", "field": {"id": "f_company", "type": "short_text"}},
                {"type": "choice", "choice": {"label": "51-200"}, "field": {"id": "f_size", "type": "multiple_choice"}},
                {"type": "choice", "choice": {"label": "$5k-$10k/month"}, "field": {"id": "f_budget", "type": "multiple_choice"}},
                {"type": "text", "text": "Our reporting is all manual spreadsheets.", "field": {"id": "f_challenge", "type": "long_text"}},
            ],
        },
    }

    lead = parse_typeform_payload(FAKE_PAYLOAD)
    print("Parsed lead:", lead)

    assert lead["email"] == "jane@acme.com"
    assert lead["company"] == "Acme Inc"
    assert lead["company_size"] == "51-200"
    assert lead["challenge"] == "Our reporting is all manual spreadsheets."
    print("\nParsing works.")
