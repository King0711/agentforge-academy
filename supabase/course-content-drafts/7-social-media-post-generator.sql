insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  7,
  $wyb$A free Social Media Post Agent for a small business. You type the news once in plain words, pick a tone and a goal, click one button and get five ready-to-post versions: LinkedIn, X, Instagram, Facebook and Threads. The sample business is Bloom & Butter, a handmade skincare brand. The agent works in four moves: it drafts all five posts in a structured format, plain Python checks every post (length, hashtag count, the brand hashtag, banned words), it asks the AI to rewrite only the failing posts with the exact problems listed (at most two rounds), and it shows each post with a character counter and a copy button. That draft, check, fix loop is the core pattern behind most business agents. It is a small Streamlit web app using Python and a free Gemini API key, and a single brand.json file lets the same agent serve any business.$wyb$,
  $wyl$[
  "Set up a Python project with a virtual environment and keep a secret key out of your code",
  "Describe a business in one brand.json file so the same agent can serve any client",
  "Get structured output from Gemini with a pydantic schema instead of splitting text",
  "Write a plain-Python checker for length, hashtags, the brand hashtag and banned words",
  "Build the draft, check, fix loop that repairs only the posts that failed",
  "Build a Streamlit screen with character counters and copy buttons",
  "Add a platform or swap the business by changing one list or one file"
]$wyl$::jsonb,
  $sess${
  "model": "Gemini (free API key) with Python and Streamlit",
  "totalTime": "90 min",
  "buildCount": 10,
  "whatYouNeed": [
    "A computer and internet",
    "A free Google account for the Gemini API key (no card required)",
    "Python 3.10 or newer (python.org/downloads; on Windows tick \"Add python.exe to PATH\")",
    "VS Code (code.visualstudio.com), free",
    "Optional, for Build 9: a free GitHub account and a free Streamlit Community Cloud account"
  ],
  "outcomes": [
    "Turn one plain-words update into five ready-to-post versions with a single click",
    "Have plain Python check length, hashtags, the brand hashtag and banned words",
    "Let the agent repair only the posts that fail, with at most two rounds",
    "Swap in a different business by editing one brand.json file",
    "Add a new platform by adding one entry to a list"
  ],
  "builds": [
    {
      "number": 1,
      "title": "Understand the business problem",
      "time": "10 min",
      "description": "Meet the sample business, what you will build, and the two ways to build it.",
      "steps": [
        {
          "instruction": "Read the problem. Bloom & Butter is a small handmade skincare brand. The owner, Amara, makes body butters, soaps and lip balms. Every time she launches a product she spends about an hour rewriting the same news for five platforms. The posts end up inconsistent: sometimes she forgets how to order, sometimes the tweet is too long, and sometimes she writes \"cures dry skin\", which a skincare brand should never claim."
        },
        {
          "instruction": "Learn the brand details the agent must respect.",
          "table": {
            "header": [
              "Business detail",
              "Bloom & Butter"
            ],
            "rows": [
              [
                "What they sell",
                "Handmade body butters, soaps and lip balms"
              ],
              [
                "Customers",
                "Women 22 to 40 who want gentle, natural skincare"
              ],
              [
                "Brand voice",
                "Warm, calm, honest, a little playful, never pushy"
              ],
              [
                "How people order",
                "WhatsApp message, or the link in the bio"
              ],
              [
                "Brand hashtag",
                "#BloomAndButter"
              ],
              [
                "Words never allowed",
                "cure, miracle, guaranteed, 100% safe"
              ],
              [
                "Goal of every post",
                "Get people to order the new product"
              ]
            ]
          }
        },
        {
          "instruction": "Know what success looks like. You will test these at the end: time per launch drops from about 60 minutes to about 5 minutes, every post fits its platform's length limit, every post that should carry the brand hashtag does, and there are no banned words and no invented prices or facts."
        },
        {
          "instruction": "Know what you are building. A small web app where Amara types the news in plain words, picks a tone and a goal, clicks one button and gets five ready-to-post versions. It works in four moves: Draft (one AI call writes all five posts in a structured format), Check (plain Python tests each post), Fix (if any post fails, the AI rewrites only the failing posts, at most two rounds) and Show (each post appears with a character counter and a copy button).",
          "callout": {
            "variant": "tip",
            "text": "**Why this counts as a real agent:** it does not just generate text. It checks its own work against rules and repairs it. That draft, check, fix loop is the core pattern behind most business agents."
          }
        },
        {
          "instruction": "Choose how to build it. Option A is no code: create a Gemini Gem or Claude Project holding the brand details, then paste each announcement. It takes 10 minutes but has no checking step, so you must proof-read length and rules yourself. Option B is this guide: one Python app and a free Gemini key, about 90 minutes, and a real tool you can show clients, change and later sell as a service. This guide builds Option B.",
          "verify": "You can explain the draft, check, fix, show loop in your own words."
        }
      ]
    },
    {
      "number": 2,
      "title": "Project folder and virtual environment",
      "time": "10 min",
      "description": "You need a computer, internet, a free Google account (for the Gemini key, no card required), Python 3.10 or newer (python.org/downloads, and on Windows tick \"Add python.exe to PATH\") and VS Code (code.visualstudio.com).",
      "steps": [
        {
          "instruction": "Create a folder called post-agent. In VS Code choose File, then Open Folder, and open it."
        },
        {
          "instruction": "Open a terminal: Terminal, then New Terminal."
        },
        {
          "instruction": "Create and switch on a private Python environment. Use the lines for your computer.",
          "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1",
          "promptKind": "code",
          "callout": {
            "variant": "warning",
            "text": "If Windows says scripts are disabled, run Set-ExecutionPolicy -Scope CurrentUser RemoteSigned and activate again."
          },
          "verify": "The terminal line starts with (.venv). Run the activate line again every time you open a new terminal for this project."
        }
      ]
    },
    {
      "number": 3,
      "title": "Get your free Gemini key",
      "time": "3 min",
      "description": "The key lets your app use Google's AI.",
      "steps": [
        {
          "instruction": "Go to aistudio.google.com/apikey and sign in."
        },
        {
          "instruction": "Click Create API key and copy it.",
          "callout": {
            "variant": "warning",
            "text": "Treat it like a password. Never paste it in chats, screenshots or public code."
          },
          "verify": "Your key is copied into a private note."
        }
      ]
    },
    {
      "number": 4,
      "title": "Create four small files",
      "time": "7 min",
      "description": "Save each file inside post-agent with exactly these names.",
      "steps": [
        {
          "instruction": "Create requirements.txt with these four lines.",
          "prompt": "streamlit\ngoogle-genai\npython-dotenv\npydantic",
          "promptKind": "code"
        },
        {
          "instruction": "Create .env (note the dot at the start; no quotes and no spaces around =) and paste your own key in place of the placeholder.",
          "prompt": "GEMINI_API_KEY=paste_your_key_here",
          "promptKind": "code"
        },
        {
          "instruction": "Create .gitignore. It keeps your key out of GitHub if you upload later.",
          "prompt": ".env\n.venv\n__pycache__",
          "promptKind": "code"
        },
        {
          "instruction": "Create brand.json. The business lives here, so the same agent can serve any client by swapping this one file.",
          "prompt": "{\n  \"name\": \"Bloom & Butter\",\n  \"what\": \"a small handmade skincare brand selling body butters, soaps and lip balms\",\n  \"audience\": \"women aged 22 to 40 who want gentle, natural skincare\",\n  \"voice\": \"warm, calm, honest, a little playful, never pushy\",\n  \"how_to_order\": \"send us a WhatsApp message or use the link in our bio\",\n  \"hashtag\": \"#BloomAndButter\",\n  \"never_say\": [\"cure\", \"miracle\", \"guaranteed\", \"100% safe\"]\n}",
          "promptKind": "code"
        },
        {
          "instruction": "Install the libraries.",
          "prompt": "python -m pip install -r requirements.txt",
          "promptKind": "code",
          "callout": {
            "variant": "warning",
            "text": "On Windows, turn on File name extensions in File Explorer so .env is not saved as .env.txt."
          },
          "verify": "The output ends with \"Successfully installed ...\"."
        }
      ]
    },
    {
      "number": 5,
      "title": "Test the key before building anything",
      "time": "5 min",
      "description": "If this works, any later problem is in the app code, not your key.",
      "steps": [
        {
          "instruction": "Create test_key.py with this code.",
          "prompt": "import os\nfrom dotenv import load_dotenv\nfrom google import genai\n\nload_dotenv()\nclient = genai.Client(api_key=os.environ[\"GEMINI_API_KEY\"])\nreply = client.models.generate_content(\n    model=\"gemini-flash-latest\",\n    contents=\"Say hello in exactly five words.\",\n)\nprint(reply.text)",
          "promptKind": "code"
        },
        {
          "instruction": "Run it in the terminal.",
          "prompt": "python test_key.py",
          "promptKind": "code",
          "verify": "A short greeting prints. If it fails, check Troubleshooting below."
        }
      ]
    },
    {
      "number": 6,
      "title": "Write the agent, app.py",
      "time": "25 min",
      "description": "This is the whole agent in one file. Read the comments as you go.",
      "steps": [
        {
          "instruction": "Create app.py and paste in the full code.",
          "prompt": "\"\"\"Social Media Post Agent: one update in, five checked posts out.\nRun with:  streamlit run app.py\n\"\"\"\nimport json\nimport os\nimport re\n\nimport streamlit as st\nfrom dotenv import load_dotenv\nfrom google import genai\nfrom google.genai import types\nfrom pydantic import BaseModel\n\nload_dotenv()\n\nMODEL = \"gemini-flash-latest\"  # if Google renames models, change only this line\n\n\ndef get_key():\n    key = os.getenv(\"GEMINI_API_KEY\")  # from your .env file\n    if key:\n        return key\n    try:\n        return st.secrets[\"GEMINI_API_KEY\"]  # used when deployed online\n    except Exception:\n        return \"\"\n\n\nAPI_KEY = get_key()\n\n# ---- 1. The business (lives in brand.json) ----\nwith open(\"brand.json\", encoding=\"utf-8\") as f:\n    BRAND = json.load(f)\n\n# ---- 2. The platform rules. One list drives the prompt, the checker and the screen ----\nPLATFORMS = {\n    \"LINKEDIN\": {\n        \"rule\": \"Professional but warm. 3 short paragraphs. Say how to order. End with a question. Up to 3 hashtags, including the brand hashtag.\",\n        \"max_chars\": 1300, \"max_hashtags\": 3,\n    },\n    \"X\": {\n        \"rule\": \"Punchy, one idea. Say how to order. Up to 2 hashtags, including the brand hashtag.\",\n        \"max_chars\": 280, \"max_hashtags\": 2,\n    },\n    \"INSTAGRAM\": {\n        \"rule\": \"Warm and personal, a few emojis, short lines. Say how to order. Put 5 hashtags at the very end, including the brand hashtag.\",\n        \"max_chars\": 2000, \"max_hashtags\": 5,\n    },\n    \"FACEBOOK\": {\n        \"rule\": \"Chatty, like talking to a neighbour. 2 or 3 sentences. Say how to order. No hashtags.\",\n        \"max_chars\": 600, \"max_hashtags\": 0,\n    },\n    \"THREADS\": {\n        \"rule\": \"Casual and short. Exactly 1 hashtag: the brand hashtag.\",\n        \"max_chars\": 400, \"max_hashtags\": 1,\n    },\n}\n\nSAMPLE_NOTE = \"\"\"New product: Shea & Oat Whipped Body Butter, launching this Friday.\nMade with raw shea butter, oats and a little coconut oil. Light vanilla scent, no heavy perfume.\nComes in a 200ml jar and feels light, not greasy. Great for dry hands, elbows and legs.\nLaunch offer: 15% off for the first 20 orders.\"\"\"\n\nSYSTEM = f\"\"\"You are the social media manager for {BRAND['name']}, {BRAND['what']}.\nCustomers: {BRAND['audience']}.\nBrand voice: {BRAND['voice']}.\nHow customers order: {BRAND['how_to_order']}.\nBrand hashtag: {BRAND['hashtag']}.\nWrite as \"we\". Use only facts from the owner's update.\nNever invent prices, discounts, dates, ingredients or health claims.\nNever use these words: {', '.join(BRAND['never_say'])}.\"\"\"\n\n\n# ---- 3. The shape of the AI's answer (Gemini must follow this) ----\nclass Post(BaseModel):\n    platform: str\n    text: str\n\n\nclass PostSet(BaseModel):\n    posts: list[Post]\n\n\ndef call_ai(prompt):\n    client = genai.Client(api_key=API_KEY)\n    response = client.models.generate_content(\n        model=MODEL,\n        contents=prompt,\n        config=types.GenerateContentConfig(\n            system_instruction=SYSTEM,\n            response_mime_type=\"application/json\",\n            response_schema=PostSet,\n            temperature=0.7,\n        ),\n    )\n    if response.parsed is None:\n        raise RuntimeError(\"The AI sent back something unreadable. Click Generate again.\")\n    return {p.platform.strip().upper(): p.text.strip() for p in response.parsed.posts}\n\n\ndef rules_text(names):\n    return \"\\n\".join(f\"- {n}: {PLATFORMS[n]['rule']} (max {PLATFORMS[n]['max_chars']} characters)\" for n in names)\n\n\ndef draft_prompt(note, tone, goal):\n    return f\"\"\"Write one post for each platform about the update below.\nGoal of every post: {goal}\nTone: {tone}\nPlatforms and rules:\n{rules_text(PLATFORMS)}\nReturn a post for each of: {', '.join(PLATFORMS)}.\n\nOWNER'S UPDATE:\n{note}\"\"\"\n\n\n# ---- 4. The checker: plain Python, free and exact ----\ndef check_post(platform, text):\n    spec, problems = PLATFORMS[platform], []\n    if len(text) > spec[\"max_chars\"]:\n        problems.append(f\"too long: {len(text)} characters, the limit is {spec['max_chars']}\")\n    hashtags = re.findall(r\"#\\w+\", text)\n    if len(hashtags) > spec[\"max_hashtags\"]:\n        problems.append(f\"{len(hashtags)} hashtags, the maximum is {spec['max_hashtags']}\")\n    if spec[\"max_hashtags\"] > 0 and BRAND[\"hashtag\"].lower() not in text.lower():\n        problems.append(f\"missing the brand hashtag {BRAND['hashtag']}\")\n    for word in BRAND[\"never_say\"]:\n        if word.lower() in text.lower():\n            problems.append(f'uses the banned word \"{word}\"')\n    return problems\n\n\ndef find_failures(posts):\n    failed = {}\n    for name in PLATFORMS:\n        text = posts.get(name, \"\")\n        problems = check_post(name, text) if text else [\"post is missing\"]\n        if problems:\n            failed[name] = (text, problems)\n    return failed\n\n\n# ---- 5. The fixer: rewrite only what failed ----\ndef fix_prompt(failed, note):\n    blocks = \"\\n\\n\".join(\n        f\"{name}\\nCurrent post: {text or '(none)'}\\nProblems: {'; '.join(problems)}\"\n        for name, (text, problems) in failed.items()\n    )\n    return f\"\"\"Rewrite ONLY the posts below so every problem is fixed.\nKeep the brand voice and the facts from the owner's update.\nRules:\n{rules_text(failed)}\n\n{blocks}\n\nOWNER'S UPDATE:\n{note}\"\"\"\n\n\n# ---- 6. The agent loop: draft, check, fix ----\ndef run_agent(note, tone, goal, status):\n    status.write(\"Drafting five posts...\")\n    posts = call_ai(draft_prompt(note, tone, goal))\n    for round_number in (1, 2):  # at most two repair rounds\n        failed = find_failures(posts)\n        if not failed:\n            break\n        status.write(f\"Fixing {', '.join(failed)} (round {round_number})...\")\n        posts.update(call_ai(fix_prompt(failed, note)))\n    return posts\n\n\n# ---- 7. The screen ----\nst.set_page_config(page_title=f\"{BRAND['name']} Post Agent\", page_icon=\"📱\")\nst.title(f\"📱 {BRAND['name']} Post Agent\")\nst.caption(\"Describe your news once. Get five checked, ready-to-post versions.\")\n\nuse_sample = st.checkbox(\"Load the sample product update\")\nnote = st.text_area(\"What's the news?\", value=SAMPLE_NOTE if use_sample else \"\", height=180)\ncol1, col2 = st.columns(2)\ntone = col1.selectbox(\"Tone\", [\"Friendly\", \"Educational\", \"Confident\", \"Inspiring\", \"Formal\"])\ngoal = col2.selectbox(\"Goal\", [\"Get people to order\", \"Build awareness\", \"Announce an offer\", \"Start a conversation\"])\n\nif st.button(\"Generate posts\", type=\"primary\"):\n    if not note.strip():\n        st.warning(\"Type or paste your news first.\")\n        st.stop()\n    if not API_KEY:\n        st.error(\"No GEMINI_API_KEY found. Check that .env is next to app.py.\")\n        st.stop()\n    try:\n        with st.status(\"Working...\", expanded=True) as status:\n            st.session_state.posts = run_agent(note.strip(), tone, goal, status)\n            status.update(label=\"Done\", state=\"complete\")\n    except Exception as e:\n        msg = str(e)\n        if \"429\" in msg or \"RESOURCE_EXHAUSTED\" in msg:\n            st.error(\"Free-tier limit reached. Wait a minute (or until tomorrow) and try again.\")\n        elif \"404\" in msg or \"NOT_FOUND\" in msg:\n            st.error(\"Model name not available. Update MODEL at the top of app.py.\")\n        elif \"400\" in msg or \"403\" in msg or \"API key\" in msg:\n            st.error(\"Gemini rejected the key. Copy it again from aistudio.google.com/apikey.\")\n        else:\n            st.error(f\"Something went wrong: {msg[:300]}\")\n        st.stop()\n\nposts = st.session_state.get(\"posts\")\nif posts:\n    st.divider()\n    for name in PLATFORMS:\n        if name in posts:\n            text = posts[name]\n            st.subheader(name.title())\n            st.code(text, language=None, wrap_lines=True)  # built-in copy button\n            st.caption(f\"{len(text)} / {PLATFORMS[name]['max_chars']} characters\")\n            for problem in check_post(name, text):\n                st.warning(f\"Still needs attention: {problem}\")",
          "promptKind": "code",
          "callout": {
            "variant": "tip",
            "text": "**One list drives everything.** PLATFORMS feeds the prompt, the checker and the screen, so one edit changes all three. The AI is asked for data in a fixed shape (a list of platform and text pairs), so there is no fragile cutting of a long reply. Counting characters and hashtags is exact in Python, so the AI is used only for the writing."
          },
          "verify": "app.py is saved and shows no red marks in VS Code."
        }
      ]
    },
    {
      "number": 7,
      "title": "Run it and test properly",
      "time": "15 min",
      "description": "Start the app and run three tests.",
      "steps": [
        {
          "instruction": "Start the app. A browser tab opens, usually at http://localhost:8501. To stop the app, click in the terminal and press Ctrl + C.",
          "prompt": "streamlit run app.py",
          "promptKind": "code"
        },
        {
          "instruction": "Happy path. Tick the sample box and click Generate. Expect five posts, each with a counter under its limit, the brand hashtag where hashtags are allowed, and the 15% launch offer mentioned accurately."
        },
        {
          "instruction": "Thin input. Type only: New lavender soap bar. Three for the price of two. The posts should stay short and must not invent ingredients, prices or dates."
        },
        {
          "instruction": "The trap. Type: New balm that cures dry lips and is a miracle for winter. The banned words should be caught and rewritten. Watch the status box say \"Fixing...\". That is the agent checking its own work.",
          "callout": {
            "variant": "tip",
            "text": "If the status box never says \"Fixing\" on any test, the AI got everything right first time. That is fine. The checker is a safety net, not something that must trigger."
          },
          "verify": "All three tests give sensible posts and the banned words are caught."
        }
      ]
    },
    {
      "number": 8,
      "title": "Make it yours",
      "time": "10 min",
      "description": "Change only brand.json and the sample note to serve a different business.",
      "steps": [
        {
          "instruction": "To serve a different business, change only brand.json and the sample note. Examples: a restaurant, a salon, a school, a real estate agent. Change never_say to that industry's risky words, for example \"guaranteed returns\" for a property business."
        },
        {
          "instruction": "To add a sixth platform, add one entry to PLATFORMS. The prompt, the checker and the screen all pick it up automatically. Use one capitalised word with no spaces for the name.",
          "prompt": "\"TIKTOK\": {\"rule\": \"A caption under 150 characters with 3 hashtags including the brand hashtag.\", \"max_chars\": 150, \"max_hashtags\": 3},",
          "promptKind": "code",
          "verify": "Your agent works for a second business and shows a sixth platform."
        }
      ]
    },
    {
      "number": 9,
      "title": "Optional: put it online for free",
      "time": "15 min",
      "description": "Share the agent with a client through Streamlit Community Cloud.",
      "steps": [
        {
          "instruction": "Create a free GitHub account and a private repository. Upload app.py, brand.json and requirements.txt. Do not upload .env."
        },
        {
          "instruction": "Go to share.streamlit.io, sign in with GitHub, choose the repo and app.py, and deploy."
        },
        {
          "instruction": "In the app's Settings, then Secrets, add: GEMINI_API_KEY = \"your_key\"."
        },
        {
          "instruction": "Set the app to private or invite-only.",
          "callout": {
            "variant": "warning",
            "text": "A public link lets strangers use up your free quota."
          },
          "verify": "Your app opens from its link and generates posts."
        }
      ]
    },
    {
      "number": 10,
      "title": "Free-tier reality check and finish line",
      "time": "10 min",
      "description": "Know the limits of free tools before you rely on them, then measure the result.",
      "steps": [
        {
          "instruction": "Free limits change and are per project. Google no longer publishes one simple table, and reports for October 2026 disagree (from about 20 requests per day on some Flash models to about 1,500). Open aistudio.google.com/rate-limit to see your real limits. One click of Generate uses one to three calls."
        },
        {
          "instruction": "Model names change. gemini-flash-latest is an alias that follows Google's newest Flash model, which is why the code uses it. If you ever get a 404, update MODEL at the top of app.py."
        },
        {
          "instruction": "Privacy. On the free tier, Google's terms allow it to use what you send to improve its products. Social posts are public anyway, but never paste customer names, phone numbers or private business data into the update box."
        },
        {
          "instruction": "Client work. Before charging clients for a tool built on the free tier, read Google's current terms on commercial use, and consider linking billing (usage is cheap) once you have real volume."
        },
        {
          "instruction": "Measure the business result. Time yourself writing five posts by hand for one announcement, then time the agent. Write both numbers down. This before and after is your proof when you show the tool to a real business.",
          "verify": "test_key.py printed a greeting, the sample produced five posts within their limits, the trap test caught the banned words, you swapped brand.json for a second business, and you added a sixth platform."
        }
      ],
      "goFurther": "Upgrades for the next session: read an article from a link (add requests and beautifulsoup4), a \"regenerate just this post\" button per platform, save every generated set to a file as a posting history, generate an image prompt for each post, or schedule posts through a free tool such as Buffer's free plan or n8n. Tips: change one thing at a time and re-run; read errors from the bottom up; paste the last 10 lines of any error into Claude or Google when stuck; never share .env."
    }
  ],
  "portfolio": "You built a Social Media Post Agent that turns one update into five platform-ready posts and checks its own work: length, hashtags, the brand hashtag and banned words, with an automatic fix loop. Share a screenshot of the five posts with their counters, and the before and after times you measured.",
  "portfolioPrompt": "I just built a Social Media Post Agent in Python with Streamlit and a free Gemini key. For a sample skincare brand it turns one product update into five posts (LinkedIn, X, Instagram, Facebook, Threads) using structured output, checks every post in plain Python for length, hashtag count, the brand hashtag and banned words, and asks the AI to rewrite only the failing posts. The brand lives in one brand.json file so it can serve any business.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "python or pip is not recognised",
    "fix": "Reopen the terminal. On Windows use py, or reinstall Python with \"Add to PATH\" ticked."
  },
  {
    "issue": "No (.venv) at the start of the line",
    "fix": "Run the activate command again. Do this in every new terminal."
  },
  {
    "issue": "ModuleNotFoundError (streamlit, google, dotenv)",
    "fix": "You are outside the virtual environment. Activate it, then run python -m pip install -r requirements.txt."
  },
  {
    "issue": "\"No GEMINI_API_KEY found\"",
    "fix": ".env must be next to app.py and named exactly .env, not .env.txt. Turn on \"File name extensions\" in Windows Explorer."
  },
  {
    "issue": "400 or 403 error",
    "fix": "The key is wrong or has spaces or quotes around it. Copy it again from aistudio.google.com/apikey."
  },
  {
    "issue": "429 error",
    "fix": "Free-tier limit reached. Wait a minute, or until tomorrow if it is a daily limit. Check aistudio.google.com/rate-limit."
  },
  {
    "issue": "404 \"model not found\"",
    "fix": "Google retired or renamed the model. Check the current Flash model name in AI Studio and update MODEL."
  },
  {
    "issue": "503 or \"busy\"",
    "fix": "Google is overloaded. Wait a minute and click Generate again."
  },
  {
    "issue": "FileNotFoundError: brand.json",
    "fix": "Run streamlit run app.py from inside the post-agent folder, and check the file name."
  },
  {
    "issue": "JSONDecodeError on startup",
    "fix": "A comma or quote is wrong in brand.json. Paste it into a JSON validator and fix it."
  },
  {
    "issue": "IndentationError",
    "fix": "Python needs exact spacing. Re-paste the code and do not mix tabs and spaces."
  },
  {
    "issue": "A platform is missing from the results",
    "fix": "This is rare. Click Generate again. The checker normally catches and refills it."
  },
  {
    "issue": "Blank page or red error box",
    "fix": "Read the last line of the error in the terminal. It usually names the real problem."
  }
]$tsh$::jsonb,
  $res$[
  {
    "title": "Google AI Studio: create a Gemini API key",
    "url": "https://aistudio.google.com/apikey"
  },
  {
    "title": "Gemini API rate limits",
    "url": "https://aistudio.google.com/rate-limit"
  },
  {
    "title": "Python downloads",
    "url": "https://www.python.org/downloads/"
  },
  {
    "title": "Streamlit documentation",
    "url": "https://docs.streamlit.io"
  },
  {
    "title": "Streamlit Community Cloud",
    "url": "https://share.streamlit.io"
  }
]$res$::jsonb,
  'builder1',
  $note$Replace the old guide with 'Build a Free Social Media Post Agent: One-Session Guide' (Bloom & Butter, brand.json, draft/check/fix loop, Streamlit, gemini-flash-latest). Content from 'Build a Free Social Media Post Agent One-Session Guide.md'; code copied verbatim (app.py compiled and its checker smoke-tested).$note$
)
on conflict (course_id) do update set
  what_you_build = excluded.what_you_build,
  what_you_learn = excluded.what_you_learn,
  session = excluded.session,
  starter_code = excluded.starter_code,
  test_it_out = excluded.test_it_out,
  troubleshooting = excluded.troubleshooting,
  resources = excluded.resources,
  tier = excluded.tier,
  change_note = excluded.change_note, updated_at = now();
