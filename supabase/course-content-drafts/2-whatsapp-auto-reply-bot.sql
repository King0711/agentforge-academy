insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  2,
  $wyb$A Flask webhook connected to Twilio WhatsApp that receives every incoming message, builds a prompt from your own persona file, asks the AI for a reply through your AI Builder credits, and sends back a properly formatted TwiML response — tested offline first with Flask's own test client, then deployed to run around the clock on Railway.$wyb$,
  $wyl$[
  "Provision a WhatsApp-enabled number with Twilio's free sandbox",
  "Expose a local server to the internet with ngrok",
  "Design a persona file that controls tone, voice, and hard rules",
  "Build a prompt that turns one incoming message into one in-character reply",
  "Build a Flask webhook that parses Twilio's form-encoded payload and returns valid TwiML",
  "Test a webhook offline with Flask's test_client(), without spending credits",
  "Deploy an always-on Flask service to Railway"
]$wyl$::jsonb,
  $sess${
  "model": "Claude Haiku 4.5 (via your AI Builder credits)",
  "totalTime": "155 min",
  "buildCount": 6,
  "whatYouNeed": [
    "Your AI Builder key (Credits page on your dashboard)",
    "Python 3.10+ installed",
    "A free Twilio account (twilio.com)",
    "Your phone, to test WhatsApp messages",
    "A free Railway account (railway.app) for deployment"
  ],
  "outcomes": [
    "Connect a WhatsApp number to your computer through Twilio's sandbox",
    "Write a persona file that makes every reply sound like you, not a generic bot",
    "Build the prompt-and-call logic that turns a message into a reply using your AI Builder credits",
    "Build a Flask webhook that speaks Twilio's TwiML format",
    "Test the whole thing offline before a single real WhatsApp message or credit is spent",
    "Deploy the bot so it keeps replying 24/7, even when your laptop is closed"
  ],
  "builds": [
    {
      "number": 1,
      "title": "Connect your number to WhatsApp",
      "time": "20 min",
      "description": "Twilio's WhatsApp sandbox is free and takes minutes to set up — but it only reaches your computer once you tunnel your local server to the internet, which is what ngrok is for.",
      "steps": [
        {
          "instruction": "Sign up at twilio.com, then go to Messaging > Try it out > Send a WhatsApp message. Follow the prompt to join your sandbox by texting the given code word from your own phone to the Twilio number. Copy your Account SID and Auth Token from the Twilio Console — the webhook itself doesn't need them, but you will if you later use the Twilio Python SDK to manage your number from code.",
          "verify": "Twilio's console shows your sandbox number and confirms “You are all set! Your sandbox can now send/receive messages.”"
        },
        {
          "instruction": "Install ngrok (ngrok.com/download), then run `ngrok http 3000` in a terminal. Keep this running — Build 4 points Twilio at whatever URL it gives you.",
          "verify": "You see an ngrok session screen with a “Forwarding” line showing a URL like https://abcd1234.ngrok-free.app -> http://localhost:3000."
        }
      ],
      "goFurther": "Once you're happy with the bot, look into a static ngrok domain (or a real Twilio WhatsApp number) so you don't have to update the webhook URL every time you restart ngrok."
    },
    {
      "number": 2,
      "title": "Give your bot a persona",
      "time": "20 min",
      "description": "Before writing any prompt logic, decide who is replying. This is the file you'll keep coming back to — it's the entire difference between a generic chatbot and one that sounds like you.",
      "steps": [
        {
          "instruction": "Create `persona.py` with this code:",
          "prompt": "\"\"\"\nYour bot's personality - the ONE file here you should feel free to\nrewrite completely so replies sound like you, not a generic chatbot.\n\nThis is a plain Python dictionary, not a prompt by itself. reply.py turns\nit into instructions for the AI. Keeping your voice separate from the\nprompt-building logic means you can change how the bot sounds without\ntouching any code that could break it - you're just editing text.\n\"\"\"\n\nPERSONA = {\n    \"name\": \"Ada\",\n    \"role\": \"a freelance graphic designer\",\n    # Short bullet points beat one long paragraph here - the AI treats\n    # each line as a rule to apply, not prose it has to first summarize\n    # before using it.\n    \"personality_notes\": [\n        \"Friendly and warm, but gets to the point quickly\",\n        \"Uses 'Hey!' rather than 'Dear Sir/Madam'\",\n        \"Keeps replies under 50 words - this is WhatsApp, not email\",\n        \"Uses at most one emoji per reply, never more\",\n    ],\n    # Real examples teach the AI your voice far better than adjectives\n    # like \"friendly\" do on their own. Two or three is enough - more\n    # starts costing you input tokens on every single reply for very\n    # little extra improvement.\n    \"example_phrases\": [\n        \"Hey! Thanks for reaching out 🙂\",\n        \"Let me check on that and get back to you shortly.\",\n        \"I'll need to look at my calendar for that one - can I confirm tomorrow?\",\n    ],\n    # What the bot must NEVER do on its own. This list gets folded\n    # straight into the prompt in reply.py, so it is the actual safety\n    # rail your customers experience, not just a note to yourself.\n    \"hard_rules\": [\n        \"Never quote a specific price - say a full quote will follow within 24 hours\",\n        \"Never confirm a specific date or time - say you'll check your calendar and confirm\",\n        \"If directly asked whether this is a bot, be honest that it's an assistant replying on their behalf\",\n    ],\n}\n\n\nif __name__ == \"__main__\":\n    # Run this file on its own to sanity-check your persona is complete\n    # before wiring it into reply.py:      python persona.py\n    #\n    # A typo like \"personality_note\" (missing the s) would otherwise fail\n    # silently deep inside a KeyError the first time a real message comes\n    # in - much easier to catch here, for free, before that happens.\n    required_keys = [\"name\", \"role\", \"personality_notes\", \"example_phrases\", \"hard_rules\"]\n    missing = [key for key in required_keys if key not in PERSONA]\n\n    if missing:\n        print(\"Your PERSONA is missing:\", missing)\n    else:\n        print(f\"Persona '{PERSONA['name']}' looks complete.\")\n        print(f\"- role: {PERSONA['role']}\")\n        print(f\"- {len(PERSONA['personality_notes'])} personality notes\")\n        print(f\"- {len(PERSONA['example_phrases'])} example phrases\")\n        print(f\"- {len(PERSONA['hard_rules'])} hard rules\")",
          "verify": "Run `python persona.py` — you should see: Persona 'Ada' looks complete. followed by the counts of your notes, phrases, and rules."
        },
        {
          "instruction": "Now make it actually yours: change name, role, personality_notes, example_phrases, and hard_rules to describe how YOU actually reply to messages.",
          "verify": "Run `python persona.py` again — the printed name should now be yours, not 'Ada'."
        }
      ],
      "goFurther": "Add a second persona dict (e.g. AFTER_HOURS_PERSONA) with stricter rules for messages that arrive outside business hours, and have reply.py pick which one to use based on the time of day."
    },
    {
      "number": 3,
      "title": "Write the reply brain",
      "time": "35 min",
      "description": "This is the file that actually thinks: it takes persona.py's rules plus the incoming message and turns them into one prompt, sends it through your AI Builder credits, and hands back plain text — no markers to parse, because a WhatsApp reply is a single message, not five platform-specific posts like the Social Post Generator.",
      "steps": [
        {
          "instruction": "Create `reply.py` with this code:",
          "prompt": "\"\"\"\nStep 2 of the WhatsApp Auto-Reply Bot.\n\nThis file turns one incoming WhatsApp message into one reply, written in\nyour persona's voice. app.py handles the WhatsApp/Twilio plumbing; this\nfile only thinks about what to say.\n\"\"\"\n\nfrom persona import PERSONA\nfrom sdt_ai import ask_ai\n\n# A WhatsApp reply is a single short message, not several labelled\n# sections - so unlike the Social Post Generator's [PLATFORM] markers,\n# there is nothing to parse here. We ask the AI for plain text and send\n# it back exactly as it comes.\n#\n# ~150 words is a generous WhatsApp reply. Capping it here keeps every\n# single reply cheap - this function runs once per INCOMING message, so\n# a chatty back-and-forth burns through max_tokens many times over,\n# unlike a one-off report a student generates a few times a day.\nMAX_REPLY_TOKENS = 200\n\n\ndef build_prompt(message_text, history=None):\n    \"\"\"\n    Builds the full prompt sent to the AI: persona + optional recent\n    history + the new incoming message.\n\n    history - optional list of {\"from\": \"them\" | \"you\", \"text\": \"...\"}\n    dicts, oldest first. Keep this short: every past message in history\n    gets retyped into the prompt and billed as input tokens on EVERY\n    reply from now on, not just once when it was first said.\n    \"\"\"\n    notes = \"\\n\".join(f\"- {note}\" for note in PERSONA[\"personality_notes\"])\n    examples = \"\\n\".join(f'- \"{phrase}\"' for phrase in PERSONA[\"example_phrases\"])\n    rules = \"\\n\".join(f\"- {rule}\" for rule in PERSONA[\"hard_rules\"])\n\n    history_block = \"\"\n    if history:\n        lines = [\n            f'{\"Them\" if turn[\"from\"] == \"them\" else \"You\"}: {turn[\"text\"]}'\n            for turn in history\n        ]\n        history_block = \"Recent conversation so far (oldest first):\\n\" + \"\\n\".join(lines) + \"\\n\\n\"\n\n    return f\"\"\"You are replying to a WhatsApp message on behalf of {PERSONA[\"name\"]}, {PERSONA[\"role\"]}.\n\nPersonality:\n{notes}\n\nExamples of how {PERSONA[\"name\"]} actually writes:\n{examples}\n\nRules you must always follow:\n{rules}\n\n{history_block}New message from the customer:\n\"{message_text}\"\n\nWrite ONLY the reply text - no quotation marks around it, no \"Reply:\" \\\nprefix, no explanation of your reasoning. Just the message exactly as it \\\nshould be sent on WhatsApp.\"\"\"\n\n\ndef generate_reply(message_text, history=None):\n    \"\"\"\n    The main function. Give it the incoming message text, get back the\n    reply to send.\n\n        reply = generate_reply(\"Are you free this week?\")\n\n    An empty message is handled here, before the AI is ever called - not\n    because it's rare, but because it's routine: WhatsApp lets someone\n    send just a photo, a voice note, or a sticker with no text caption,\n    and Twilio still POSTs to your webhook with Body=\"\". Sending an empty\n    prompt to the AI would still cost credits for a reply to nothing, so\n    this case is caught for free instead.\n    \"\"\"\n    message_text = (message_text or \"\").strip()\n    if not message_text:\n        return \"Hey! Looks like that came through without any text - mind sending that again?\"\n\n    prompt = build_prompt(message_text, history)\n\n    reply_text = ask_ai(\n        prompt,\n        max_tokens=MAX_REPLY_TOKENS,\n        project=\"whatsapp-auto-reply-bot\",\n    )\n\n    return reply_text.strip()\n\n\nif __name__ == \"__main__\":\n    # Run this file on its own to check the prompt-building and the\n    # empty-message guard - both work without spending any credits or\n    # needing the internet, because neither path here calls the AI:\n    #\n    #     python reply.py\n    #\n    # persona.py's example phrases include an emoji, and some Windows\n    # terminals default to an older codepage that can't print one -\n    # reconfiguring stdout to UTF-8 (harmless everywhere else) avoids a\n    # crash here that has nothing to do with your actual code.\n    import sys\n\n    if hasattr(sys.stdout, \"reconfigure\"):\n        sys.stdout.reconfigure(encoding=\"utf-8\")\n\n    print(\"--- Prompt that would be sent to the AI ---\\n\")\n    print(build_prompt(\"Hey, are you free for a logo design this week?\"))\n\n    print(\"\\n--- Empty-message guard (should NOT call the AI) ---\")\n    result = generate_reply(\"   \")\n    print(\"Reply:\", result)\n    assert \"ask_ai\" not in result  # sanity check we returned the canned line, not a real call\n    print(\"\\nBoth checks ran without touching the network. Looks good.\")",
          "verify": "Run `python reply.py` — you should see the full prompt printed, then: Reply: Hey! Looks like that came through without any text - mind sending that again? and finally Both checks ran without touching the network. Looks good. Neither line spent a credit — the empty-message guard returns before ask_ai is ever called."
        },
        {
          "instruction": "Now try a real message. Open a Python shell in this folder and run:\nfrom reply import generate_reply\nprint(generate_reply(\"Hey, are you free for a logo design this week?\"))",
          "verify": "Within a few seconds you get back a short, in-character reply that follows persona.py's rules (no exact price, no exact date) — and it costs roughly 1-2 credits, visible on your Credits page afterwards."
        }
      ],
      "goFurther": "Try lowering MAX_REPLY_TOKENS to 20 and asking a longer question — watch the reply get cut off mid-sentence. This is the tradeoff every project in this course makes: a lower max_tokens is cheaper per reply, but too low starts truncating real answers."
    },
    {
      "number": 4,
      "title": "Build the webhook and go live",
      "time": "40 min",
      "description": "app.py is what actually talks to Twilio: it receives the raw form-encoded payload Twilio sends on every message, calls reply.py to think of an answer, and wraps it in the exact XML format (TwiML) Twilio expects back. test_app.py proves all of that works before you spend a single credit or send a single real WhatsApp message.",
      "steps": [
        {
          "instruction": "Create `app.py` with this code:",
          "prompt": "\"\"\"\nStep 3 of the WhatsApp Auto-Reply Bot - the webhook Twilio calls every\ntime someone messages your WhatsApp number.\n\nRun it with:      python app.py\nStop it with:     Ctrl+C in the terminal\n\nTwilio's servers talk to YOUR server here, not the other way around, and\nthere's no button for a human to click - a phone is the whole UI. That's\nwhy this is a Flask app (something that answers programmatic requests)\nrather than a Streamlit app (something a human clicks around in) like\nthe Social Media Post Generator.\n\"\"\"\n\nfrom flask import Flask, request\n\nfrom reply import generate_reply\n\napp = Flask(__name__)\n\n# A small in-memory log of the last few messages per phone number, so the\n# AI can hold a short conversation instead of answering every message\n# with total amnesia of what was just said.\n#\n# Two honest limitations, on purpose, so you know what you're trading\n# for simplicity: this resets to empty every time the server restarts,\n# and it is NOT shared across multiple worker processes (a production\n# host commonly runs 2+ copies of your app for reliability, and each\n# copy would keep its own separate history). A real product would put\n# this in a database table keyed by phone number instead - fine to build\n# later, not needed to learn what a persona-driven reply loop is.\nCONVERSATION_HISTORY = {}\nMAX_HISTORY_TURNS = 6  # 3 back-and-forths of context - enough to feel continuous, bounded so cost can't grow forever\n\n\n@app.route(\"/whatsapp\", methods=[\"POST\"])\ndef whatsapp_webhook():\n    \"\"\"\n    Twilio POSTs here as application/x-www-form-urlencoded - NOT JSON -\n    every time a WhatsApp message arrives at your number. These are the\n    real field names Twilio sends (there are dozens more - MessageSid,\n    NumMedia, ProfileName, WaId... - we only need two of them):\n\n        Body   - the message text, e.g. \"Are you free this week?\"\n        From   - the sender, e.g. \"whatsapp:+2348012345678\"\n    \"\"\"\n    incoming_message = request.form.get(\"Body\", \"\")\n    sender = request.form.get(\"From\", \"unknown\")\n\n    history = CONVERSATION_HISTORY.get(sender, [])\n    reply_text = generate_reply(incoming_message, history=history)\n\n    # Append this turn AFTER generating the reply (not before), so a\n    # message that fails never gets written into history as if it had\n    # succeeded.\n    history = history + [\n        {\"from\": \"them\", \"text\": incoming_message},\n        {\"from\": \"you\", \"text\": reply_text},\n    ]\n    CONVERSATION_HISTORY[sender] = history[-MAX_HISTORY_TURNS:]\n\n    return _twiml_response(reply_text)\n\n\ndef _twiml_response(message_text):\n    \"\"\"\n    Twilio expects XML back - called TwiML - not plain text or JSON. This\n    exact response is what tells Twilio's servers \"send message_text back\n    to this user on WhatsApp\". It's built by hand with an f-string here\n    (rather than pulling in Twilio's twiml.MessagingResponse helper\n    class) to keep a first Flask project readable; the `twilio` package\n    is still useful for provisioning your number, just not required for\n    this one response.\n\n    NOTE (see the Challenge build): this function does not check whether\n    message_text is empty before wrapping it in <Message>...</Message> -\n    an empty AI reply would currently produce a silently blank WhatsApp\n    message rather than an error. That gap is deliberate - you'll find\n    and fix it yourself.\n    \"\"\"\n    escaped = (\n        message_text.replace(\"&\", \"&amp;\")\n        .replace(\"<\", \"&lt;\")\n        .replace(\">\", \"&gt;\")\n    )\n    xml = f'<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{escaped}</Message></Response>'\n    return xml, 200, {\"Content-Type\": \"text/xml\"}\n\n\nif __name__ == \"__main__\":\n    import os\n\n    # 3000 locally, to match the ngrok/Twilio setup steps in the session\n    # guide. Reading PORT from the environment (instead of hardcoding 3000\n    # everywhere) is what lets the SAME file run unchanged on Railway too -\n    # Railway assigns its own port at deploy time and tells your app which\n    # one through this exact environment variable.\n    app.run(host=\"0.0.0.0\", port=int(os.environ.get(\"PORT\", 3000)), debug=True)",
          "verify": "The file saves without errors. You'll test it in the next two steps."
        },
        {
          "instruction": "Create `test_app.py` with this code. It stubs the AI so you can test the route without spending credits or needing the internet:",
          "prompt": "\"\"\"\nProves the webhook works WITHOUT spending any credits or needing the\ninternet.\n\nFlask's test_client() calls your route function directly in memory, the\nsame way Twilio's real request would arrive, but nothing leaves your\ncomputer. This is a testing tool, not something Twilio ever talks to -\nrunning app.py itself (python app.py) is what actually serves requests.\n\nRun it with:      python test_app.py\n\"\"\"\n\nimport app as app_module\nimport reply as reply_module\n\nCANNED_REPLY = \"Hey! Thanks for the message - I'll get back to you soon.\"\n\n\ndef _stub_ask_ai(prompt, max_tokens=200, project=None):\n    \"\"\"\n    TEST-ONLY STUB - the real app never calls this. reply.py normally\n    calls the real ask_ai from sdt_ai.py, which needs your .env key,\n    spends real credits, and needs network access. Swapping it out here\n    lets us prove the Flask route, the TwiML XML, and the prompt-building\n    logic all work end-to-end, without any of that in an automated test.\n    \"\"\"\n    return CANNED_REPLY\n\n\ndef test_whatsapp_webhook_returns_valid_twiml():\n    # reply.py did `from sdt_ai import ask_ai`, which copies a reference\n    # into reply.py's OWN namespace. So we patch reply_module.ask_ai, not\n    # sdt_ai.ask_ai - patching sdt_ai's copy after reply.py already\n    # imported its own would have no effect on the one reply.py calls.\n    original_ask_ai = reply_module.ask_ai\n    reply_module.ask_ai = _stub_ask_ai\n\n    try:\n        client = app_module.app.test_client()\n\n        # Shaped exactly like Twilio's real incoming webhook: form-encoded\n        # (not JSON), using the field names Twilio actually sends.\n        response = client.post(\n            \"/whatsapp\",\n            data={\n                \"Body\": \"Hey, are you free for a logo design this week?\",\n                \"From\": \"whatsapp:+15551234567\",\n                \"To\": \"whatsapp:+15559876543\",\n                \"MessageSid\": \"SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\",\n                \"NumMedia\": \"0\",\n            },\n        )\n\n        assert response.status_code == 200\n        assert response.content_type.startswith(\"text/xml\")\n\n        body = response.get_data(as_text=True)\n        assert \"<Response>\" in body and \"<Message>\" in body\n        assert CANNED_REPLY in body\n\n        print(\"Status code:\", response.status_code)\n        print(\"Content-Type:\", response.content_type)\n        print(\"Response body:\")\n        print(body)\n        print(\"\\nPASS: valid TwiML containing the expected reply.\")\n    finally:\n        # Restore the real ask_ai so nothing else importing this module\n        # keeps using the stub by accident.\n        reply_module.ask_ai = original_ask_ai\n\n\ndef test_empty_message_never_reaches_the_ai():\n    \"\"\"\n    An empty Body is routine, not an edge case - WhatsApp lets someone\n    send just a photo or sticker with no text. This proves reply.py's\n    own guard catches it before the AI is ever called, so a blank\n    message never costs a credit.\n    \"\"\"\n\n    def _fail_if_called(*args, **kwargs):\n        raise AssertionError(\"ask_ai should not be called for an empty message\")\n\n    original_ask_ai = reply_module.ask_ai\n    reply_module.ask_ai = _fail_if_called\n    try:\n        client = app_module.app.test_client()\n        response = client.post(\"/whatsapp\", data={\"Body\": \"\", \"From\": \"whatsapp:+15551234567\"})\n        body = response.get_data(as_text=True)\n        # This is reply.py's own canned guard text, not anything the AI wrote -\n        # proof the AI path was never reached.\n        assert \"mind sending that again\" in body\n        print(\"\\nResponse to an empty Body:\")\n        print(body)\n        print(\"PASS: the AI was never called for an empty message.\")\n    finally:\n        reply_module.ask_ai = original_ask_ai\n\n\nif __name__ == \"__main__\":\n    test_whatsapp_webhook_returns_valid_twiml()\n    test_empty_message_never_reaches_the_ai()",
          "verify": "Run `python test_app.py` — you should see: Status code: 200 / Content-Type: text/xml / ...then PASS: valid TwiML containing the expected reply. followed by a second PASS for the empty-message check."
        },
        {
          "instruction": "Now start the real thing: run `python app.py`, then in the Twilio Console set your Sandbox's “When a message comes in” webhook to your ngrok URL from Build 1 plus /whatsapp (e.g. https://abcd1234.ngrok-free.app/whatsapp). Send a real WhatsApp message to your sandbox number.",
          "verify": "You get an automatic reply on WhatsApp within a few seconds, written in your persona's voice — and it now shows up as a real request in your ngrok terminal window, not just in test_app.py."
        }
      ],
      "goFurther": "Break it on purpose: temporarily edit generate_reply in reply.py to `return \"\"` right before it calls the AI (simulating the AI coming back with nothing), restart app.py, and message your sandbox number again. Look at what WhatsApp shows you — probably nothing, or a blank bubble. Now look at _twiml_response in app.py: it wraps message_text in <Message> with no check for empty. Nothing in this project currently defends against a blank AI reply reaching a real customer — that's a gap worth closing before you'd trust this with a client, e.g. by adding `if not reply_text: reply_text = \"Sorry, could you rephrase that?\"` inside generate_reply."
    },
    {
      "number": 5,
      "title": "Deploy so it runs 24/7",
      "time": "20 min",
      "description": "Your laptop closing shouldn't mean your bot stops replying. Railway keeps app.py running permanently, on a public URL Twilio can always reach.",
      "steps": [
        {
          "instruction": "Push this project to a new GitHub repo (`git init`, `git add .`, `git commit -m \"whatsapp bot\"`, create a repo on GitHub, then `git remote add origin <url>` and `git push -u origin main`). Do not commit your `.env` file — only `.env.example` should ever be pushed.",
          "verify": "Your GitHub repo shows app.py, reply.py, persona.py, sdt_ai.py, requirements.txt, and .env.example — but NOT .env."
        },
        {
          "instruction": "In Railway (railway.app), create a New Project > Deploy from GitHub repo, and select this repo. In the project's Variables tab, add SDT_API_KEY with your real key — Railway's environment, not your local .env, is what the deployed bot reads.",
          "verify": "Railway's build log finishes with your app listening, and the project's generated public URL responds (even a 404 on / is fine — it means the server is up; /whatsapp is a POST-only route)."
        },
        {
          "instruction": "Update the Twilio Sandbox webhook to your Railway URL + /whatsapp, then turn off your local `python app.py` and ngrok. Message the sandbox number again.",
          "verify": "You still get a reply, now served entirely from Railway — your laptop can be closed and the bot keeps working."
        }
      ],
      "goFurther": "🛠️ Add a lightweight persistence layer (even a single JSON file, or a Supabase table if you're comfortable) so CONVERSATION_HISTORY survives a Railway redeploy instead of resetting to empty every time."
    },
    {
      "number": 6,
      "phaseLabel": "🎯 Challenge",
      "title": "Challenge: teach your bot to hand off",
      "time": "20 min",
      "description": "Real client messages aren't all small talk — a real business needs the bot to recognize when a message needs an actual human, and say so clearly instead of guessing. This is the real test of whether you understand how persona + prompt + AI fit together, not just whether the code runs.",
      "steps": [
        {
          "instruction": "In reply.py, add a new HANDOFF_KEYWORDS list (e.g. \"refund\", \"complaint\", \"speak to a human\", \"urgent\"). Before calling the AI at all, check whether any of these appear in the incoming message (case-insensitive). If one does, skip the AI call completely and return a fixed message telling the customer a human will follow up soon. Write the check and the fixed message yourself — only a starting point is given below.",
          "prompt": "# Starting point - fill in the check yourself:\n\nHANDOFF_KEYWORDS = [\"refund\", \"complaint\", \"speak to a human\", \"urgent\"]\n\n\ndef needs_human(message_text):\n    \"\"\"Return True if this message should skip the AI and go straight to a human.\"\"\"\n    # your code here\n    ...\n",
          "verify": "generate_reply(\"I want to speak to a human about a refund\") returns your fixed handoff message WITHOUT calling the AI — prove it by temporarily pointing ask_ai at a function that raises an error; if your test still passes, the AI was genuinely never reached. generate_reply(\"Are you free this week?\") should still go through the AI as normal."
        }
      ]
    }
  ],
  "portfolio": "You built and deployed a 24/7 WhatsApp bot that replies in your own voice, using AI Builder credits instead of your own API key. Take a screenshot of a real conversation on your phone, and add “WhatsApp Auto-Reply Bot” to your build portfolio with a one-line description.",
  "portfolioPrompt": "I just built a WhatsApp auto-reply bot using Python, Flask, and Twilio. It receives incoming WhatsApp messages via a webhook, builds a prompt from a custom persona file to generate replies in my own voice, and runs 24/7 deployed on Railway — all AI calls go through a shared credit-metered gateway instead of my own API key.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "Twilio error 11200 (HTTP retrieval failure)",
    "fix": "Twilio could not reach your webhook URL. Confirm ngrok is still running, copy the CURRENT forwarding URL (it changes every restart unless you're on a paid static domain), and update the Sandbox webhook field to match."
  },
  {
    "issue": "No reply received on WhatsApp at all",
    "fix": "Twilio sandbox sessions expire after about 72 hours of inactivity — re-send “join <your-code>” to the sandbox number to reconnect before testing again."
  },
  {
    "issue": "ModuleNotFoundError: No module named 'flask' (or 'twilio')",
    "fix": "Run `pip install -r requirements.txt` again from the same folder as requirements.txt — a common cause is running the command from a different directory than the project lives in."
  },
  {
    "issue": "The bot replies, but sounds generic instead of following persona.py's rules",
    "fix": "Check that reply.py is actually importing your CURRENT persona.py — a stale __pycache__ or editing the wrong copy of the file are the usual culprits. Also keep hard_rules short and specific; vague rules ('be professional') get followed less reliably than concrete ones ('never quote a price')."
  },
  {
    "issue": "A WhatsApp message arrives completely blank",
    "fix": "This happens when the AI returns an empty string and app.py's _twiml_response wraps it in <Message> with no check (see the Build 4 ‘break it on purpose’ exercise). Add a fallback inside generate_reply, e.g. `if not reply_text: reply_text = \"Sorry, could you rephrase that?\"`, so an empty AI reply never reaches a real customer."
  },
  {
    "issue": "App works locally but crashes immediately after deploying to Railway",
    "fix": "Environment variables in .env are NOT deployed — .env is meant to stay on your own machine and out of git. Add SDT_API_KEY as an actual environment variable inside the Railway dashboard's Variables tab."
  }
]$tsh$::jsonb,
  $res$[
  {
    "title": "Twilio WhatsApp Sandbox",
    "url": "https://www.twilio.com/docs/whatsapp/sandbox"
  },
  {
    "title": "Twilio Webhook Request Parameters",
    "url": "https://www.twilio.com/docs/messaging/guides/webhook-request"
  },
  {
    "title": "Flask Quickstart",
    "url": "https://flask.palletsprojects.com/en/stable/quickstart/"
  },
  {
    "title": "Railway Docs",
    "url": "https://docs.railway.com/"
  }
]$res$::jsonb,
  'builder1',
  'Option-B rewrite: real tested Python (converted from Node.js) + AI Builder credits gateway, replaces paste-into-Claude workflow. See supabase/starter-projects/whatsapp-auto-reply-bot/.'
)
on conflict (course_id) do update set
  what_you_build = excluded.what_you_build, what_you_learn = excluded.what_you_learn, session = excluded.session,
  starter_code = excluded.starter_code, test_it_out = excluded.test_it_out, troubleshooting = excluded.troubleshooting,
  resources = excluded.resources, tier = excluded.tier, change_note = excluded.change_note, updated_at = now();
