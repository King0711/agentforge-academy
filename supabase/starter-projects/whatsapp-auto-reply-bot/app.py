"""
Step 3 of the WhatsApp Auto-Reply Bot - the webhook Twilio calls every
time someone messages your WhatsApp number.

Run it with:      python app.py
Stop it with:     Ctrl+C in the terminal

Twilio's servers talk to YOUR server here, not the other way around, and
there's no button for a human to click - a phone is the whole UI. That's
why this is a Flask app (something that answers programmatic requests)
rather than a Streamlit app (something a human clicks around in) like
the Social Media Post Generator.
"""

from flask import Flask, request

from reply import generate_reply

app = Flask(__name__)

# A small in-memory log of the last few messages per phone number, so the
# AI can hold a short conversation instead of answering every message
# with total amnesia of what was just said.
#
# Two honest limitations, on purpose, so you know what you're trading
# for simplicity: this resets to empty every time the server restarts,
# and it is NOT shared across multiple worker processes (a production
# host commonly runs 2+ copies of your app for reliability, and each
# copy would keep its own separate history). A real product would put
# this in a database table keyed by phone number instead - fine to build
# later, not needed to learn what a persona-driven reply loop is.
CONVERSATION_HISTORY = {}
MAX_HISTORY_TURNS = 6  # 3 back-and-forths of context - enough to feel continuous, bounded so cost can't grow forever


@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    """
    Twilio POSTs here as application/x-www-form-urlencoded - NOT JSON -
    every time a WhatsApp message arrives at your number. These are the
    real field names Twilio sends (there are dozens more - MessageSid,
    NumMedia, ProfileName, WaId... - we only need two of them):

        Body   - the message text, e.g. "Are you free this week?"
        From   - the sender, e.g. "whatsapp:+2348012345678"
    """
    incoming_message = request.form.get("Body", "")
    sender = request.form.get("From", "unknown")

    history = CONVERSATION_HISTORY.get(sender, [])
    reply_text = generate_reply(incoming_message, history=history)

    # Append this turn AFTER generating the reply (not before), so a
    # message that fails never gets written into history as if it had
    # succeeded.
    history = history + [
        {"from": "them", "text": incoming_message},
        {"from": "you", "text": reply_text},
    ]
    CONVERSATION_HISTORY[sender] = history[-MAX_HISTORY_TURNS:]

    return _twiml_response(reply_text)


def _twiml_response(message_text):
    """
    Twilio expects XML back - called TwiML - not plain text or JSON. This
    exact response is what tells Twilio's servers "send message_text back
    to this user on WhatsApp". It's built by hand with an f-string here
    (rather than pulling in Twilio's twiml.MessagingResponse helper
    class) to keep a first Flask project readable; the `twilio` package
    is still useful for provisioning your number, just not required for
    this one response.

    NOTE (see the Challenge build): this function does not check whether
    message_text is empty before wrapping it in <Message>...</Message> -
    an empty AI reply would currently produce a silently blank WhatsApp
    message rather than an error. That gap is deliberate - you'll find
    and fix it yourself.
    """
    escaped = (
        message_text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escaped}</Message></Response>'
    return xml, 200, {"Content-Type": "text/xml"}


if __name__ == "__main__":
    import os

    # 3000 locally, to match the ngrok/Twilio setup steps in the session
    # guide. Reading PORT from the environment (instead of hardcoding 3000
    # everywhere) is what lets the SAME file run unchanged on Railway too -
    # Railway assigns its own port at deploy time and tells your app which
    # one through this exact environment variable.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), debug=True)
