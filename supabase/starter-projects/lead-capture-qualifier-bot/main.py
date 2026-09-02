"""
Step 4 of the Lead Capture & Qualifier Bot - the Flask app that ties
webhook parsing, AI scoring and HubSpot together.

Test the wiring:    python main.py
Run the real server: flask --app main run --port 5000

This file deliberately contains almost no logic of its own - parsing
lives in webhook.py, scoring in scorer.py, HubSpot payloads in
hubspot_client.py. main.py's only job is calling them in the right
order and turning the result into an HTTP response. If a step's own
behaviour ever needs fixing, you'll know exactly which file to open.
"""

from flask import Flask, request, jsonify

import hubspot_client
import scorer
from sdt_ai import AIError
from webhook import parse_typeform_payload

app = Flask(__name__)


@app.route("/webhook/typeform", methods=["POST"])
def typeform_webhook():
    payload = request.get_json(force=True, silent=True) or {}
    lead = parse_typeform_payload(payload)

    # Typeform only omits an answer if a question was skipped or bypassed
    # by Logic Jump - but a lead with no email is useless to a sales
    # team, so it's worth catching explicitly here rather than letting
    # HubSpot reject it later with a less obvious error.
    if not lead.get("email"):
        return jsonify({"status": "ignored", "reason": "no email in submission"}), 200

    try:
        result = scorer.score_lead(lead)
    except AIError as problem:
        # Returning 500 here would make Typeform retry the delivery a
        # few minutes later, which would score (and could HubSpot-create)
        # the same lead twice. Returning 200 with an error status stops
        # the retry - you catch the failure by checking your own logs or
        # Credits page, not by Typeform hammering the same URL.
        return jsonify({"status": "error", "stage": "scoring", "error": str(problem)}), 200
    except ValueError as problem:
        return jsonify({"status": "error", "stage": "scoring", "error": str(problem)}), 200

    try:
        contact_id = hubspot_client.create_contact(lead, result)
        hubspot_client.create_followup_task(contact_id, lead, result)
    except Exception as problem:
        # requests' raise_for_status() raises an error with HubSpot's own
        # message attached - showing str(problem) surfaces the real cause
        # (a missing scope, an unknown property) instead of hiding it
        # behind a bare "500 Internal Server Error".
        return jsonify({"status": "error", "stage": "hubspot", "error": str(problem)}), 200

    return jsonify({
        "status": "ok",
        "email": lead["email"],
        "score": result["score"],
        "tier": result["tier"],
        "contact_id": contact_id,
    }), 200


if __name__ == "__main__":
    # Run this file on its own to check the pipeline is wired correctly:
    # python main.py
    #
    # This proves webhook.py -> scorer.py -> hubspot_client.py are all
    # connected correctly, WITHOUT spending an AI credit or touching a
    # real HubSpot account - it fakes both network calls, clearly
    # commented below as fakes for this test only. To run the real
    # server against real Typeform submissions, use the Flask CLI
    # instead: flask --app main run --port 5000

    FAKE_TYPEFORM_PAYLOAD = {
        "event_id": "LtWXD3crgy",
        "event_type": "form_response",
        "form_response": {
            "form_id": "abc123",
            "definition": {
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
                {"type": "text", "text": "Jane Okafor", "field": {"id": "f_name"}},
                {"type": "email", "email": "jane@acme.com", "field": {"id": "f_email"}},
                {"type": "text", "text": "Acme Inc", "field": {"id": "f_company"}},
                {"type": "choice", "choice": {"label": "51-200"}, "field": {"id": "f_size"}},
                {"type": "choice", "choice": {"label": "$5k-$10k/month"}, "field": {"id": "f_budget"}},
                {"type": "text", "text": "Our reporting is all manual spreadsheets.", "field": {"id": "f_challenge"}},
            ],
        },
    }

    # FAKE for this test only: a canned AI reply, so this test costs zero
    # credits and works even with no .env file at all. score_lead()'s own
    # parsing and tier logic - the part actually worth testing here -
    # still runs for real against this fake text.
    def fake_ask_ai(prompt, **kwargs):
        return "[SCORE]\n9\n[REASON]\nStrong fit on size and budget.\n[END]"

    # FAKE for this test only: no real HubSpot account is needed to prove
    # main.py calls create_contact() then create_followup_task() with the
    # right arguments, in the right order.
    def fake_send_to_hubspot(endpoint, payload, api_key):
        if endpoint == "/crm/v3/objects/contacts":
            return {"id": "fake-contact-42"}
        return {"id": "fake-task-99"}

    scorer.ask_ai = fake_ask_ai
    hubspot_client.send_to_hubspot = fake_send_to_hubspot

    with app.test_client() as client:
        response = client.post("/webhook/typeform", json=FAKE_TYPEFORM_PAYLOAD)
        data = response.get_json()

    print("Response:", data)
    assert response.status_code == 200, data
    assert data["status"] == "ok", data
    assert data["score"] == 9
    assert data["tier"] == "hot"
    assert data["contact_id"] == "fake-contact-42"
    print("\nPipeline wiring test passed: webhook -> score -> HubSpot all connected correctly.")
