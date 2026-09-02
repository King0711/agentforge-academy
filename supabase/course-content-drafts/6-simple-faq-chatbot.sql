insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  6,
  $wyb$A Streamlit chat app that answers questions using only a FAQ document you provide, keeps track of the back-and-forth conversation across turns, and is explicitly instructed to admit when a question falls outside what it was given instead of inventing a plausible-sounding answer. There's no vector database or embeddings involved: the whole FAQ is short enough to hand the AI directly in the prompt every time (this is the "RAG-lite" pattern), which is exactly how a real small business's FAQ behaves in practice.$wyb$,
  $wyl$[
  "Read a real file off disk and turn it into context an AI can answer from",
  "Write a system prompt that makes an AI refuse to guess outside its source material",
  "Build a multi-turn chat UI with Streamlit's chat_message and chat_input",
  "Keep conversation history in st.session_state across Streamlit reruns",
  "Call a shared AI gateway with your own credits instead of managing an API key",
  "Test prompt-construction and reply-detection logic without spending a single credit",
  "Recognize and defend against LLM hallucination through prompt design, not code"
]$wyl$::jsonb,
  $sess${
  "model": "Claude Haiku 4.5 (via your AI Builder credits)",
  "totalTime": "120 min",
  "buildCount": 4,
  "whatYouNeed": [
    "Your AI Builder key (Credits page on your dashboard)",
    "Python 3.10+ installed",
    "A free Streamlit Cloud account (share.streamlit.io) - only needed for the deploy step"
  ],
  "outcomes": [
    "Turn a real FAQ document into an AI's entire knowledge base - no database required",
    "Write a system prompt that makes an AI say \"I don't know\" instead of guessing",
    "Build a working multi-turn chat interface with Streamlit",
    "Call AI through your platform credits instead of managing your own API key",
    "Test prompt-construction and reply-detection logic offline, for free",
    "Deploy a Python chat app live on the web for free"
  ],
  "builds": [
    {
      "number": 1,
      "title": "Give the bot something to know",
      "time": "20 min",
      "description": "The FAQ file is the entire brain of this bot. Before any AI is involved, there needs to be real content sitting on disk that Python can reliably read - get that right first and everything downstream is simple.",
      "steps": [
        {
          "instruction": "Create `faq.md` with this content (a real, working example FAQ for a small Lagos bakery - you'll make it your own in the Challenge):",
          "prompt": "# Golden Crust Bakery - Frequently Asked Questions\n\n## What are your opening hours?\nWe're open Tuesday to Sunday, 8:00 AM to 7:00 PM. We're closed every Monday for baking prep and stock-taking.\n\n## Where are you located?\nWe're at 14 Adeniran Ogunsanya Street, Surulere, Lagos. We don't have a second branch yet.\n\n## Do you deliver?\nYes, we deliver within Lagos mainland for a flat NGN 1,500 fee. Orders placed before 12 PM are usually delivered the same day; anything placed after that goes out the next day.\n\n## How far in advance do I need to order a custom cake?\nCustom and celebration cakes need at least 48 hours' notice. Wedding cakes and orders above 5kg need at least 7 days' notice so we can plan tiers and delivery properly.\n\n## What payment methods do you accept?\nWe accept bank transfer, POS on delivery or pickup, and cash. We don't currently accept cheques.\n\n## Can you cater for allergies or dietary needs?\nWe offer an eggless option for most cakes and a gluten-free vanilla sponge on request. We are NOT a nut-free kitchen - all our cakes are made in the same space as products containing groundnuts and cashews, so we can't guarantee zero cross-contact.\n\n## What sizes and prices do your cakes come in?\nOur round cakes start at NGN 8,000 for a 6-inch (serves 8-10) and go up to NGN 35,000 for a 12-inch (serves 40-50). Custom designs and fondant work are quoted separately based on the design.\n\n## Can I cancel or change my order after paying?\nOrders can be changed or cancelled for a full refund up to 24 hours before your pickup or delivery time. Inside 24 hours, we can only offer a 50% refund since ingredients are already prepped.\n\n## Do you do wholesale or bulk orders for events and offices?\nYes - for orders of 20 units or more (small chops, cupcakes, pastries) we offer a 10% discount and can discuss a standing weekly order for offices. Reach out at least a week ahead.\n\n## How do I get in touch with a real person?\nCall or WhatsApp us on 0803-000-0000 between 8 AM and 7 PM, Tuesday to Sunday, or email goldencrustlagos@example.com.\n",
          "verify": "Open faq.md and count the sections - you should have 10 \"## question\" headings, each followed by an answer paragraph."
        },
        {
          "instruction": "Create `faq.py` with this code:",
          "prompt": "\"\"\"\nStep 1 of the Simple FAQ Chatbot.\n\nThis file has one job: read the FAQ document off disk and hand back its\ntext, so chatbot.py can drop it straight into the prompt. This project is\n\"RAG-lite\" - no database, no embeddings, no search step. The FAQ file IS\nthe knowledge base. Whatever text is in faq.md is exactly what the AI can\nknow about your business, word for word.\n\"\"\"\n\nimport os\n\nFAQ_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), \"faq.md\")\n\n# Stop after this many characters - the same kind of MONEY decision as\n# article.py's MAX_CHARACTERS in the Social Post Generator project.\n# chatbot.py resends this whole file with EVERY question a customer asks\n# (see the caching note in chatbot.py for how prompt caching keeps repeat\n# sends cheap), so a 200-page FAQ would make every single question\n# expensive. 8000 characters is roughly 15-20 well-written Q&A pairs -\n# plenty for a small business, and a hard ceiling that keeps costs\n# predictable even if someone pastes in a much bigger document later.\nMAX_CHARACTERS = 8000\n\n\ndef load_faq(path=FAQ_PATH):\n    \"\"\"\n    Reads the FAQ file and returns its text.\n\n        text = load_faq()\n\n    Raises a clear error if the file is missing or empty - an empty FAQ\n    means the chatbot has nothing to answer from, which would otherwise\n    fail silently and confusingly deep inside a prompt to the AI instead\n    of here, where the problem is obvious.\n    \"\"\"\n    if not os.path.exists(path):\n        raise FileNotFoundError(\n            f\"Could not find {path}.\\n\"\n            f\"Create a faq.md file next to this one with your questions and answers.\"\n        )\n\n    with open(path, \"r\", encoding=\"utf-8\") as f:\n        text = f.read().strip()\n\n    if not text:\n        raise ValueError(\n            f\"{path} is empty.\\n\"\n            f\"Add at least a few questions and answers before running the chatbot.\"\n        )\n\n    return text[:MAX_CHARACTERS]\n\n\nif __name__ == \"__main__\":\n    # Run this file on its own to check it works:  python faq.py\n    text = load_faq()\n    print(f\"Loaded {len(text)} characters from {FAQ_PATH}\\n\")\n    print(text[:300])\n",
          "verify": "Run `python faq.py` - it should print `Loaded 2060 characters from <the path to your faq.md>` followed by the start of the Golden Crust Bakery FAQ text. The character count will be exactly 2060 if you used the faq.md above unchanged."
        }
      ],
      "goFurther": "Add a few more Q&A pairs of your own to faq.md - no code changes needed, faq.py picks up whatever is in the file at load time."
    },
    {
      "number": 2,
      "title": "Build the chatbot's brain",
      "time": "30 min",
      "description": "This is where the actual defense against hallucination lives: the instructions you write here decide whether the bot admits it doesn't know something or confidently invents an answer.",
      "steps": [
        {
          "instruction": "Create `chatbot.py` with this code:",
          "prompt": "\"\"\"\nStep 2 of the Simple FAQ Chatbot.\n\nThis file builds the prompt that turns the AI into a chatbot that only\nknows what's in your FAQ - and, just as importantly, admits when a\nquestion isn't covered instead of guessing.\n\"\"\"\n\nfrom sdt_ai import ask_ai\n\n# The single most important instruction in this whole project. Language\n# models are trained to be helpful, and their default instinct when they\n# don't actually know something is to guess a plausible-sounding answer\n# rather than say \"I don't know\" - a well-documented failure mode called\n# hallucination. Telling the AI, in plain words, that it is ALLOWED and\n# EXPECTED to say \"I don't know\" is the fix. Skip this instruction and you\n# will get confident, wrong answers about your own business - see the\n# hallucination entry in the README troubleshooting notes.\nSYSTEM_INSTRUCTIONS = (\n    \"You are a helpful customer support assistant. Answer the customer's \"\n    \"question using ONLY the FAQ content below - do not use any outside \"\n    \"knowledge, and do not guess. If the question is not answered by the \"\n    \"FAQ, say plainly that you don't have that information and suggest \"\n    \"they contact the business directly. Keep answers short and friendly.\"\n)\n\n# Phrases the AI tends to use (because SYSTEM_INSTRUCTIONS asks it to)\n# when the FAQ doesn't cover a question. Used only to decide whether to\n# show a \"still stuck?\" nudge in the chat UI - it is NOT what keeps the\n# AI honest, SYSTEM_INSTRUCTIONS is. A missed phrase here just means the\n# nudge doesn't show up; the AI's own reply is shown to the customer\n# either way.\nUNKNOWN_PHRASES = [\n    \"don't have that information\",\n    \"do not have that information\",\n    \"don't know\",\n    \"do not know\",\n    \"not sure\",\n    \"can't answer\",\n    \"cannot answer\",\n    \"not covered\",\n    \"isn't in the faq\",\n    \"not in the faq\",\n    \"contact us directly\",\n    \"contact the business directly\",\n]\n\n\ndef build_prompt(faq_text, question, history=None):\n    \"\"\"\n    Assembles the full prompt sent to the AI: instructions + the FAQ +\n    recent conversation + the new question.\n\n        prompt = build_prompt(faq_text, \"What are your opening hours?\")\n\n    Keeping this separate from the network call means you can print\n    exactly what the AI is being asked - the fastest way to work out\n    why an answer came back wrong or oddly worded.\n    \"\"\"\n    history = history or []\n\n    conversation = \"\"\n    if history:\n        lines = [\n            f\"{'Customer' if turn['role'] == 'user' else 'You'}: {turn['content']}\"\n            for turn in history\n        ]\n        conversation = \"\\n\\nEarlier in this conversation:\\n\" + \"\\n\".join(lines)\n\n    return f\"\"\"{SYSTEM_INSTRUCTIONS}\n\nFAQ:\n{faq_text}\n{conversation}\n\nCustomer's new question: {question}\"\"\"\n\n\ndef looks_unanswered(reply):\n    \"\"\"\n    True if the AI's reply looks like an \"I don't know\" answer rather\n    than a real answer pulled from the FAQ.\n\n    This is a best-effort keyword check, not proof of anything - the AI\n    writes in its own words every time, so no fixed list catches every\n    phrasing, and a fluent WRONG guess looks exactly like a fluent RIGHT\n    answer to this function. That's exactly why SYSTEM_INSTRUCTIONS,\n    not this function, is what actually prevents hallucination - this\n    only decides whether to show an extra \"still stuck?\" nudge.\n    \"\"\"\n    lowered = reply.lower()\n    return any(phrase in lowered for phrase in UNKNOWN_PHRASES)\n\n\ndef ask_faq_bot(faq_text, question, history=None):\n    \"\"\"\n    The main function. Give it the FAQ text and a question, get back an\n    answer grounded in that FAQ.\n\n        answer = ask_faq_bot(faq_text, \"Do you deliver?\")\n    \"\"\"\n    prompt = build_prompt(faq_text, question, history)\n\n    # max_tokens caps the answer length, which caps what this costs you.\n    # 300 is generous for a short support answer - FAQ answers are not\n    # essays, and a shorter cap also means a lower worst-case credit\n    # reservation on every single question (see ai_reserve_request in the\n    # AI Builder credits system: it reserves against max_tokens up front).\n    return ask_ai(\n        prompt,\n        max_tokens=300,\n        project=\"simple-faq-chatbot\",\n    )\n\n\nif __name__ == \"__main__\":\n    # Run this file on its own to check the prompt-building and the\n    # \"did it admit it doesn't know\" detector both work:\n    #     python chatbot.py\n    sample_faq = \"Q: What are your hours?\\nA: We're open 8am-6pm, Tuesday-Sunday.\"\n\n    prompt = build_prompt(sample_faq, \"What time do you open?\")\n    assert \"8am-6pm\" in prompt\n    assert \"What time do you open?\" in prompt\n    print(\"build_prompt: FAQ text and question are both present. OK\")\n\n    prompt_with_history = build_prompt(\n        sample_faq,\n        \"What about Mondays?\",\n        history=[\n            {\"role\": \"user\", \"content\": \"What time do you open?\"},\n            {\"role\": \"assistant\", \"content\": \"We open at 8am.\"},\n        ],\n    )\n    assert \"Customer: What time do you open?\" in prompt_with_history\n    print(\"build_prompt: earlier conversation turns are included. OK\")\n\n    # Two synthetic AI replies stand in for the live AI here, because we\n    # can't force the real AI to misbehave inside an automated test - one\n    # reply correctly admits it doesn't know, the other is what a normal\n    # (or a confidently WRONG, hallucinated) answer looks like. Notice\n    # looks_unanswered() cannot tell \"answered_reply\" apart from a\n    # hallucination that happens to read fluently - only a human checking\n    # a real off-FAQ question against the live bot can catch that. See\n    # the README troubleshooting entry on hallucination for that manual\n    # verification step.\n    honest_reply = \"I don't have that information in the FAQ - please contact us directly.\"\n    answered_reply = \"We're open Tuesday to Sunday, 8am to 6pm.\"\n\n    assert looks_unanswered(honest_reply) is True\n    assert looks_unanswered(answered_reply) is False\n    print(\"looks_unanswered: tells an 'I don't know' reply apart from an answered one. OK\")\n\n    print(\"\\nAll chatbot.py checks passed.\")\n",
          "verify": "Run `python chatbot.py` - it should print exactly:\n\nbuild_prompt: FAQ text and question are both present. OK\nbuild_prompt: earlier conversation turns are included. OK\nlooks_unanswered: tells an 'I don't know' reply apart from an answered one. OK\n\nAll chatbot.py checks passed."
        }
      ],
      "goFurther": "Change the wording in SYSTEM_INSTRUCTIONS to answer in a different tone (more formal, or bilingual) and see how the AI's real answers change."
    },
    {
      "number": 3,
      "title": "Build the chat interface and put it online",
      "time": "40 min",
      "description": "Turn the chatbot function into something a real customer could actually talk to, with memory of what they already asked, then make it reachable by anyone with a link.",
      "steps": [
        {
          "instruction": "Create `app.py` with this code:",
          "prompt": "\"\"\"\nStep 3 of the Simple FAQ Chatbot - the screen you actually use.\n\nRun it with:      streamlit run app.py\nStop it with:     Ctrl+C in the terminal\n\nStreamlit reruns this whole file top-to-bottom every time you send a\nmessage. That is normal - it's why the FAQ text and chat history both\nlive in st.session_state below, instead of a plain variable, which would\nreset to empty on every single message.\n\"\"\"\n\nimport streamlit as st\n\nfrom chatbot import ask_faq_bot, looks_unanswered\nfrom faq import load_faq\nfrom sdt_ai import AIError\n\nst.set_page_config(page_title=\"FAQ Assistant\", page_icon=\"💬\")\n\nst.title(\"💬 FAQ Assistant\")\nst.caption(\"Ask a question - answers come only from the FAQ this bot was given.\")\n\n# Load the FAQ once per session, not on every rerun. It's the same file\n# every time, so re-reading it on every keystroke is wasted disk work -\n# cheap on its own, but there's no reason to pay it repeatedly.\nif \"faq_text\" not in st.session_state:\n    try:\n        st.session_state.faq_text = load_faq()\n    except (FileNotFoundError, ValueError) as problem:\n        st.error(str(problem))\n        st.stop()\n\nif \"messages\" not in st.session_state:\n    st.session_state.messages = []\n\n# Replay the conversation so far on every rerun - without this, the chat\n# window would appear empty again after every message you send, even\n# mid-conversation.\nfor message in st.session_state.messages:\n    with st.chat_message(message[\"role\"]):\n        st.write(message[\"content\"])\n\nquestion = st.chat_input(\"Ask a question about the business...\")\n\nif question:\n    st.session_state.messages.append({\"role\": \"user\", \"content\": question})\n    with st.chat_message(\"user\"):\n        st.write(question)\n\n    answer = None\n    with st.chat_message(\"assistant\"):\n        try:\n            # Send only the last 6 messages as history - enough for the AI\n            # to follow a quick \"what about weekends?\" follow-up, without\n            # resending an ever-growing transcript that costs more credits\n            # with every single turn of a long conversation.\n            with st.spinner(\"Checking the FAQ...\"):\n                answer = ask_faq_bot(\n                    st.session_state.faq_text,\n                    question,\n                    history=st.session_state.messages[:-1][-6:],\n                )\n            st.write(answer)\n\n            if looks_unanswered(answer):\n                st.info(\n                    \"Didn't find what you needed? Contact the business \"\n                    \"directly using the details in the FAQ.\"\n                )\n        except AIError as problem:\n            # These messages are written to be read - show them as they are.\n            st.error(str(problem))\n\n    if answer is not None:\n        st.session_state.messages.append({\"role\": \"assistant\", \"content\": answer})\n",
          "verify": "Run `streamlit run app.py`. The terminal should print \"You can now view your Streamlit app in your browser\" with nothing that looks like an error below it, and a browser tab should open showing \"💬 FAQ Assistant\". Ask \"What are your opening hours?\" - the reply should mention Tuesday to Sunday, 8am to 7pm, matching faq.md."
        },
        {
          "instruction": "Push your project to GitHub, then deploy it on Streamlit Cloud:",
          "prompt": "git init\ngit add app.py chatbot.py faq.py faq.md sdt_ai.py requirements.txt .env.example README.md\ngit commit -m \"Simple FAQ Chatbot\"\ngit branch -M main\ngit remote add origin https://github.com/<your-username>/<your-repo>.git\ngit push -u origin main\n\n# Never run \"git add .env\" and never commit your real key - only\n# .env.example (which has no real key in it) should ever reach GitHub.\n\nThen on share.streamlit.io: click \"New app\", pick your repo and branch, set the main file path to app.py, and click Deploy. Once it's building, open your app's Settings -> Secrets and paste:\n\nSDT_API_KEY = \"sdt_live_your_real_key_here\"\n\n(sdt_ai.py reads SDT_API_KEY from the environment, and Streamlit exposes anything you put in Secrets as an environment variable the same way it exposes a local .env - so no code change is needed to deploy.)",
          "verify": "Visit your live Streamlit Cloud URL and ask the same FAQ question you tested locally - you should get an answer the same way it worked on your machine. (The first load after a period of inactivity can take about 30 seconds on the free tier - that's normal, not a bug.)"
        }
      ],
      "goFurther": "🛠️ Break it on purpose: ask the deployed bot something totally unrelated to the business, like \"What's the capital of France?\". It should decline rather than guess - if it doesn't, tighten the wording in SYSTEM_INSTRUCTIONS (chatbot.py) and redeploy."
    },
    {
      "number": 4,
      "phaseLabel": "🎯 Challenge",
      "title": "Challenge: make it actually yours",
      "time": "30 min",
      "description": "The real test of whether you understand this tool isn't whether the demo runs - it's whether it still correctly refuses to answer once you point it at content you wrote yourself, and whether you can extend it without breaking that guarantee.",
      "steps": [
        {
          "instruction": "Add this skeleton to chatbot.py and finish the three TODOs so unanswered questions get logged to a file for later review:",
          "prompt": "def log_unanswered(question, answer, path=\"unanswered.log\"):\n    \"\"\"\n    Appends a line to a text file whenever the bot admits it doesn't know\n    an answer, so you can review real gaps in your FAQ later without\n    reading through every conversation by hand.\n\n    TODO 1: only write anything when looks_unanswered(answer) is True.\n    TODO 2: write one line per entry, formatted as:  question <TAB> answer\n    TODO 3: open the file in append mode, so earlier entries aren't erased.\n    \"\"\"\n    # Your code here\n    pass\n",
          "verify": "Run `python -c \"from chatbot import log_unanswered; log_unanswered('a test question', 'I do not have that information.'); print(open('unanswered.log').read())\"` - it should print a line containing \"a test question\"."
        },
        {
          "instruction": "Now make the FAQ genuinely yours. Replace faq.md's content with this starting shape, filled in for a real business you know (or extend Golden Crust Bakery's FAQ with 3 more entries of your own):",
          "prompt": "# <Your Business Name> - Frequently Asked Questions\n\n## <A real question your customers actually ask>\n<A real, specific answer - not a placeholder>\n\n## <Another real question>\n<Another real answer>\n\n# Add at least 3 more Q&A pairs of your own below.\n# (Or, if you don't have a business in mind yet, add 3 more pairs to\n# Golden Crust Bakery's FAQ instead - just keep the same \"## question\"\n# format so faq.py's loader treats them the same way.)\n",
          "verify": "Ask a question with no answer in your FAQ. The reply must say it does not know - not invent a plausible-sounding answer. Then ask a question that IS covered, and confirm the reply matches what's actually written in your faq.md, not a guess."
        }
      ]
    }
  ],
  "portfolio": "You built and can demo a live chat interface that answers only from a document you provided, and correctly declines when a question falls outside it - a pattern used in real customer-support tools. Share a screenshot of it correctly refusing an out-of-scope question alongside one it answers well.",
  "portfolioPrompt": "I built a Streamlit FAQ chatbot in Python that answers customer questions using only a business's own FAQ document (a lightweight retrieval pattern with no vector database - the FAQ is short enough to send directly in the prompt), keeps multi-turn conversation history, and is explicitly instructed to say it doesn't know rather than invent an answer when a question falls outside the FAQ.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "The chatbot confidently answers a question that isn't actually in your FAQ (hallucination)",
    "fix": "This is the core risk of any tool like this: language models default to sounding helpful even when they don't actually know something, instead of admitting it. The real defense is SYSTEM_INSTRUCTIONS in chatbot.py, which explicitly tells the AI to answer ONLY from the FAQ and to say when it doesn't know - the looks_unanswered() keyword check in the same file only decides whether to show an extra nudge in the UI, it does not keep the AI honest. If you see a confidently wrong answer, tighten the wording (e.g. add \"If the FAQ does not clearly answer this, you MUST say so\") and re-test with the same off-FAQ question. You have to check this by hand against the real, live bot - an automated test can't force the live AI to misbehave on demand, which is why this isn't something chatbot.py's self-test can cover."
  },
  {
    "issue": "\"streamlit: command not found\" in the terminal",
    "fix": "Your terminal is likely using a different Python environment than the one you installed Streamlit into. Reinstall with `python -m pip install streamlit` and run it with `python -m streamlit run app.py`."
  },
  {
    "issue": "The chatbot forgets earlier messages in the conversation",
    "fix": "Conversation history needs to live in st.session_state, not a plain local variable - a local variable resets every time Streamlit reruns the script after each message."
  },
  {
    "issue": "faq.py raises FileNotFoundError even though faq.md clearly exists",
    "fix": "faq.py looks for faq.md next to its own file location, not your terminal's current folder - so this usually means faq.md was renamed, moved, or the two files ended up in different folders. Keep faq.md in the same folder as faq.py."
  },
  {
    "issue": "Getting an AIError that says \"No SDT_API_KEY found\"",
    "fix": "Your .env file is either missing, misnamed, or not in the same folder as sdt_ai.py. Copy .env.example to a new file named exactly .env (not .env.example or .env.txt), and paste your real key from the Credits page after SDT_API_KEY=."
  }
]$tsh$::jsonb,
  $res$[
  {
    "url": "https://docs.streamlit.io/develop/api-reference/chat",
    "title": "Streamlit Chat Elements"
  },
  {
    "url": "https://docs.streamlit.io/develop/api-reference/caching-and-state/st.session_state",
    "title": "Streamlit Session State"
  },
  {
    "url": "https://docs.streamlit.io/deploy/streamlit-community-cloud",
    "title": "Streamlit Community Cloud Deployment"
  }
]$res$::jsonb,
  'builder1',
  'Option-B rewrite: real tested Python code + AI Builder credits gateway, replaces paste-into-Claude workflow. See supabase/starter-projects/simple-faq-chatbot/.'
)
on conflict (course_id) do update set
  what_you_build = excluded.what_you_build, what_you_learn = excluded.what_you_learn, session = excluded.session,
  starter_code = excluded.starter_code, test_it_out = excluded.test_it_out, troubleshooting = excluded.troubleshooting,
  resources = excluded.resources, tier = excluded.tier, change_note = excluded.change_note, updated_at = now();
