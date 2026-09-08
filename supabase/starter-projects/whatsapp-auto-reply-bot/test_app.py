"""
Proves the webhook works WITHOUT spending any credits or needing the
internet.

Flask's test_client() calls your route function directly in memory, the
same way Twilio's real request would arrive, but nothing leaves your
computer. This is a testing tool, not something Twilio ever talks to -
running app.py itself (python app.py) is what actually serves requests.

Run it with:      python test_app.py
"""

import app as app_module
import reply as reply_module

CANNED_REPLY = "Hey! Thanks for the message - I'll get back to you soon."


def _stub_ask_ai(prompt, max_tokens=200, project=None):
    """
    TEST-ONLY STUB - the real app never calls this. reply.py normally
    calls the real ask_ai from sdt_ai.py, which needs your .env key,
    spends real credits, and needs network access. Swapping it out here
    lets us prove the Flask route, the TwiML XML, and the prompt-building
    logic all work end-to-end, without any of that in an automated test.
    """
    return CANNED_REPLY


def test_whatsapp_webhook_returns_valid_twiml():
    # reply.py did `from sdt_ai import ask_ai`, which copies a reference
    # into reply.py's OWN namespace. So we patch reply_module.ask_ai, not
    # sdt_ai.ask_ai - patching sdt_ai's copy after reply.py already
    # imported its own would have no effect on the one reply.py calls.
    original_ask_ai = reply_module.ask_ai
    reply_module.ask_ai = _stub_ask_ai

    try:
        client = app_module.app.test_client()

        # Shaped exactly like Twilio's real incoming webhook: form-encoded
        # (not JSON), using the field names Twilio actually sends.
        response = client.post(
            "/whatsapp",
            data={
                "Body": "Hey, are you free for a logo design this week?",
                "From": "whatsapp:+15551234567",
                "To": "whatsapp:+15559876543",
                "MessageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "NumMedia": "0",
            },
        )

        assert response.status_code == 200
        assert response.content_type.startswith("text/xml")

        body = response.get_data(as_text=True)
        assert "<Response>" in body and "<Message>" in body
        assert CANNED_REPLY in body

        print("Status code:", response.status_code)
        print("Content-Type:", response.content_type)
        print("Response body:")
        print(body)
        print("\nPASS: valid TwiML containing the expected reply.")
    finally:
        # Restore the real ask_ai so nothing else importing this module
        # keeps using the stub by accident.
        reply_module.ask_ai = original_ask_ai


def test_empty_message_never_reaches_the_ai():
    """
    An empty Body is routine, not an edge case - WhatsApp lets someone
    send just a photo or sticker with no text. This proves reply.py's
    own guard catches it before the AI is ever called, so a blank
    message never costs a credit.
    """

    def _fail_if_called(*args, **kwargs):
        raise AssertionError("ask_ai should not be called for an empty message")

    original_ask_ai = reply_module.ask_ai
    reply_module.ask_ai = _fail_if_called
    try:
        client = app_module.app.test_client()
        response = client.post("/whatsapp", data={"Body": "", "From": "whatsapp:+15551234567"})
        body = response.get_data(as_text=True)
        # This is reply.py's own canned guard text, not anything the AI wrote -
        # proof the AI path was never reached.
        assert "mind sending that again" in body
        print("\nResponse to an empty Body:")
        print(body)
        print("PASS: the AI was never called for an empty message.")
    finally:
        reply_module.ask_ai = original_ask_ai


if __name__ == "__main__":
    test_whatsapp_webhook_returns_valid_twiml()
    test_empty_message_never_reaches_the_ai()
