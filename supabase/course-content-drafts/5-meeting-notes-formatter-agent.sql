insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  5,
  $wyb$A Meeting Notes Agent you build without writing code. Claude writes it as one web page (index.html) from a single prompt, and a free Gemini key does the thinking. Paste a messy meeting transcript and get clean notes: a summary, key points, decisions and a table of action items with owner, deadline and priority. It never invents names: if nobody took a task it says Unassigned, and if no date was mentioned it says No deadline set. A built-in safety check verifies every owner and every piece of evidence against your transcript. It can also write the follow-up email, answer questions like "who agreed to do what?", export Markdown and CSV, and remember your last 10 meetings.$wyb$,
  $wyl$[
  "Get Claude to build a complete web app from one well-written prompt, with no coding",
  "Use a free Gemini key stored only in your own browser",
  "Ask an AI for structured JSON notes and force it to use only what is in the transcript",
  "Check an AI's answer with plain code: verify owners and evidence, and catch invented names",
  "Spot the most important test: a task nobody accepted must stay Unassigned",
  "Improve the agent by describing problems to Claude in plain words",
  "Publish it free with Netlify and optionally add audio upload and a by-person task view"
]$wyl$::jsonb,
  $sess${
  "model": "Claude chat (free account) + Gemini (free API key)",
  "totalTime": "60 min",
  "buildCount": 7,
  "whatYouNeed": [
    "A laptop or desktop computer",
    "A free Claude account at claude.ai",
    "A free Gemini API key from aistudio.google.com/apikey (no card needed)",
    "A meeting transcript or rough notes to try it on, with speaker names if possible",
    "Optional, for Build 6: a free Netlify account"
  ],
  "outcomes": [
    "Get Claude to build a complete Meeting Notes Agent as one index.html file, with no coding",
    "Turn a messy transcript into a summary, decisions and an action item table",
    "Trust the result because owners and evidence are checked against your transcript",
    "Draft a follow-up email and ask questions about the meeting",
    "Export notes as Markdown and action items as CSV",
    "Publish it free and open it from your phone"
  ],
  "builds": [
    {
      "number": 1,
      "title": "Get ready",
      "time": "10 min",
      "description": "A Meeting Notes Agent is a web page where you paste a messy meeting transcript and get back clean notes. You will not write code: you copy a prompt, paste it to Claude, save the file Claude gives you, and open it.",
      "steps": [
        {
          "instruction": "Know what you are building. The agent turns a transcript into a summary, the decisions, and a table of action items with owner, deadline and priority. It can also write the follow-up email and answer questions like \"who agreed to do what?\". The whole agent is one file named index.html. Claude writes it for you, and a free Google Gemini key does the thinking.",
          "callout": {
            "variant": "tip",
            "text": "**It never invents names.** If nobody took a task, it says **Unassigned**. If no date was mentioned, it says **No deadline set**."
          }
        },
        {
          "instruction": "Learn the words you will see in this guide.",
          "table": {
            "header": [
              "Word",
              "Meaning"
            ],
            "rows": [
              [
                "Prompt",
                "The message you send Claude. Copy prompts from the boxes."
              ],
              [
                "Transcript",
                "The written record of what people said in a meeting, or your rough notes."
              ],
              [
                "API key",
                "A free password that lets your page use Google's AI. Keep it private."
              ],
              [
                "Browser",
                "Chrome, Safari, Edge or Firefox."
              ],
              [
                "Host / deploy",
                "Put your file on the internet so you can open it by link."
              ]
            ]
          }
        },
        {
          "instruction": "Check you have a laptop or desktop computer, and that you can chat with Claude at claude.ai. A free account is fine."
        },
        {
          "instruction": "On your Desktop, create a folder named my-notes-agent. Everything goes here."
        },
        {
          "instruction": "Show file extensions, which are the ending of a file name, like .html. Hidden extensions cause confusing mistakes later.",
          "table": {
            "header": [
              "Computer",
              "How to show extensions"
            ],
            "rows": [
              [
                "Windows 11",
                "Open a folder, click **View**, then **Show**, then tick **File name extensions**."
              ],
              [
                "Windows 10",
                "Open a folder, click **View**, tick **File name extensions**."
              ],
              [
                "Mac",
                "In Finder go to **Finder**, **Settings**, **Advanced**, tick **Show all filename extensions**."
              ]
            ]
          }
        },
        {
          "instruction": "Get your free Gemini key. Go to aistudio.google.com/apikey, sign in with any Google account, click Create API key and copy it. No card is needed. Paste it into a Notepad file for now.",
          "callout": {
            "variant": "warning",
            "text": "Never share your key or post it online."
          },
          "verify": "You have a folder and a Gemini key copied somewhere safe."
        }
      ]
    },
    {
      "number": 2,
      "title": "Ask Claude to build the agent",
      "time": "10 min",
      "description": "One prompt gives you the whole agent. There is nothing to fill in.",
      "steps": [
        {
          "instruction": "Open a new chat with Claude."
        },
        {
          "instruction": "Click Copy on the prompt below, paste it into the message box and press Enter. Claude builds the agent in under a minute.",
          "prompt": "Build me a complete Meeting Notes Agent as ONE self-contained HTML file (no libraries, no server, free). I am a complete beginner, so keep the code simple and comment it in plain English.\n\nRequirements:\n1. At the top of the script, a section labelled \"EDIT THIS SECTION ONLY\" with: GEMINI_MODEL = \"gemini-flash-latest\" and MAX_CHARS = 100000.\n2. On first use, ask me to paste my free Gemini API key. Save it ONLY in this browser's localStorage. Add a \"Change key\" button. Never write the key into the file.\n3. A big box for the transcript, a \"Meeting type\" dropdown (General, Daily stand-up, Client call, Interview, Brainstorm, Project review), an \"Write the notes in\" language box (default English), and a Generate button with a loading message. Reject text shorter than 20 characters with a friendly message.\n4. Call the Gemini API from the browser (generateContent, key sent in the x-goog-api-key header) and ask for JSON using responseMimeType application/json plus a responseSchema with: title, attendees, summary, key_points, decisions (each with decision and evidence), action_items (each with task, owner, deadline, priority High/Medium/Low, evidence), open_questions, risks. Retry twice after a short wait if the reply is 429 or 503.\n5. The instructions sent to the AI must say: use ONLY what is in the transcript; never invent names, dates, tasks or decisions; if nobody clearly took a task the owner is \"Unassigned\"; if no deadline was said it is \"No deadline set\"; evidence must be the exact words from the transcript, in their original language; if a decision changed later, keep only the final one; no duplicate tasks.\n6. A safety check in plain JavaScript after the reply: if an owner's name (first word) does not appear in the transcript, change it to \"Unassigned\". Replace vague values like TBD, N/A, none with \"Unassigned\" or \"No deadline set\". Mark each action item \"Verified\" if its evidence text really appears in the transcript, otherwise \"Check\". Remove attendees who do not appear in the transcript.\n7. Show the results as: summary, key points, decisions, an action items table (Task, Owner, Deadline, Priority, Check), open questions, risks, and four counters (decisions, actions, need an owner, worth double-checking). Action item cells must be editable.\n8. Buttons: Copy notes as Markdown, Download .md, Download action items as .csv, \"Draft follow-up email\" (with a tone dropdown: Professional, Friendly, Brief; it asks Gemini to write from the notes only and flags Unassigned tasks as needing a volunteer), and an \"Ask about this meeting\" box that answers from the transcript only and says so if the answer is not there.\n9. Save the last 10 meetings in localStorage and show a \"Past meetings\" list I can click to reopen.\n10. Friendly error messages: wrong key (400/401/403), free limit reached (429), model not found (404), no internet.\n11. Clean, modern, mobile-friendly design with light and dark mode and large readable text. Use textContent (not innerHTML) for anything that came from the transcript or the AI.\n\nGive me the result as a downloadable file named index.html if you can. If you cannot, give it as one code block.",
          "verify": "Claude has replied with the agent, as a file or a code block."
        }
      ]
    },
    {
      "number": 3,
      "title": "Save the file and open it",
      "time": "10 min",
      "description": "Claude gives you the agent either as a download or as a code block. Either way it ends up as index.html in your my-notes-agent folder.",
      "steps": [
        {
          "instruction": "If Claude gave you a download, click it, then move index.html into your my-notes-agent folder."
        },
        {
          "instruction": "If Claude gave you a code block, click Copy on the block, then save it carefully:",
          "table": {
            "header": [
              "Computer",
              "How to save it"
            ],
            "rows": [
              [
                "Windows",
                "Open **Notepad** and press **Ctrl + V**. Then **File**, **Save As**. Set **Save as type** to **All files**, **File name** to **index.html**, **Encoding** to **UTF-8**, and save inside **my-notes-agent**."
              ],
              [
                "Mac",
                "Open **TextEdit**, choose **Format**, then **Make Plain Text**, and paste with **Cmd + V**. Save it as **index.html** and click **Use .html** if asked."
              ]
            ]
          }
        },
        {
          "instruction": "Double-click index.html. It opens in your browser. Paste your Gemini key when it asks.",
          "callout": {
            "variant": "warning",
            "text": "See code text instead of a page? The file was saved as **index.html.txt** or as rich text. Turn on extensions (Build 1) and save it again as above."
          },
          "verify": "Your agent opens in the browser and accepted your key."
        }
      ]
    },
    {
      "number": 4,
      "title": "Test it with a sample meeting",
      "time": "10 min",
      "description": "Practise on a meeting where you already know the right answer.",
      "steps": [
        {
          "instruction": "Copy this practice meeting, paste it into the agent's transcript box and press Generate.",
          "prompt": "Weekly Product Sync - Sept 1\nAttendees: Amaka, Tunde, Chidi\n\nAmaka: ok let's get started. The onboarding redesign is behind.\nChidi: I can start on it Monday if nobody else is on it.\nAmaka: sounds good, go ahead Chidi.\nAmaka: do we keep the old three-tier pricing page or switch to the single-price page?\nTunde: switch, the old one confuses people.\nChidi: agreed.\nAmaka: decision made, we're moving to the single-price layout.\nTunde: someone needs to email the beta testers about the pricing change before we ship.\nChidi: not me, I'm heads down on onboarding.\nTunde: I can't this week either, I'm out Thursday and Friday.\nAmaka: ok someone needs to own that, let's figure it out after the call.\nAmaka: can we get the pricing switch live by end of month?\nTunde: should be doable, maybe the 28th.\nAmaka: let's lock the 28th as the target.",
          "promptKind": "example"
        },
        {
          "instruction": "Compare the result with what a correct result looks like: the decision is to move to the single-price layout with the 28th as the target date; Chidi owns the onboarding redesign with a deadline of Monday; and the task \"email the beta testers\" says Unassigned.",
          "callout": {
            "variant": "tip",
            "text": "**\"Email the beta testers\" must say Unassigned.** Both people refused it, so a trustworthy agent never gives it to either of them. This is the most important test."
          }
        },
        {
          "instruction": "Try the other buttons: draft the follow-up email, download the Markdown (opens in Word-friendly editors) or the CSV (opens in Excel), and ask \"Who declined the email task?\" in the Ask about this meeting box. Then try a real meeting of your own.",
          "verify": "The beta tester task shows Unassigned."
        }
      ]
    },
    {
      "number": 5,
      "title": "Improve it with Claude",
      "time": "10 min",
      "description": "Real meetings are messier than the sample. Use the agent on a few and let Claude fix what you find.",
      "steps": [
        {
          "instruction": "Use your agent on 3 real meetings. Write down anything wrong, missing or annoying."
        },
        {
          "instruction": "Go back to the same Claude chat and paste this prompt with your list filled in.",
          "prompt": "Please update the Meeting Notes Agent. Here is what I want changed:\n- [problem or wish 1, for example: tasks are sometimes missed when people say \"I'll handle it\"]\n- [problem or wish 2, for example: make the summary shorter]\n\nKeep everything else the same and keep it one index.html file. Give me the full updated file."
        },
        {
          "instruction": "Save the new file over the old index.html and refresh your browser. Press Ctrl + F5 to force it.",
          "callout": {
            "variant": "tip",
            "text": "Too many \"Check\" warnings? Tell Claude: \"Make the evidence check more forgiving.\" Owners wrong? Tell Claude: \"Make the owner check stricter.\""
          },
          "verify": "Your agent handles 3 real meetings well enough to use."
        }
      ]
    },
    {
      "number": 6,
      "title": "Put it online for free (optional)",
      "time": "10 min",
      "description": "This lets you open the agent on your phone and any computer. Netlify hosts simple sites free.",
      "steps": [
        {
          "instruction": "Make sure my-notes-agent contains a file named exactly index.html."
        },
        {
          "instruction": "Go to app.netlify.com/drop and sign up if asked (Google or email)."
        },
        {
          "instruction": "Drag the whole my-notes-agent folder onto the page."
        },
        {
          "instruction": "After a few seconds you get a link like https://random-name.netlify.app. Open it on your phone.",
          "callout": {
            "variant": "warning",
            "text": "**About your key:** your key is never inside the file. Each person who opens the link pastes their own, and it stays in their browser only. Do not share a link with your key typed in. If a browser blocks the Generate button when you double-click the file on your computer, use the Netlify link instead."
          },
          "verify": "Your agent opens from a link on your phone."
        },
        {
          "instruction": "To update it later, save the new index.html and drag the folder onto the same site's Deploys page."
        }
      ]
    },
    {
      "number": 7,
      "title": "Optional upgrades",
      "time": "15 min",
      "description": "Do these only after Builds 1 to 5 work. Paste each into the same Claude chat, then save the new file.",
      "steps": [
        {
          "instruction": "Upgrade A: upload a recording. Paste this into Claude.",
          "prompt": "Add an \"Upload a recording\" option (mp3, wav, aac, ogg, flac, up to 18 MB). Send the audio to Gemini as base64 inline data and ask it to transcribe word for word, one line per speaker as \"Name: text\", using Speaker 1, Speaker 2 if names are not said. Put the result into the transcript box so I can edit it before generating notes. Give me the full updated index.html."
        },
        {
          "instruction": "Upgrade B: a task tracker view. Paste this into Claude.",
          "prompt": "Add a \"By person\" view that groups all action items by owner, with Unassigned at the top highlighted. Add tick boxes to mark tasks done, saved in localStorage. Give me the full updated index.html.",
          "verify": "Your new index.html opens and the new feature works."
        }
      ],
      "goFurther": "Good habits: always skim the notes and double-check anything marked Check. Put speaker names in your transcript (like \"Amaka: ...\") so owners can be matched. As far as we know, content sent through Google's free tier may be used to improve Google's products, so remove private details from confidential meetings first. Never share your key or paste it into the file itself."
    }
  ],
  "portfolio": "You built a Meeting Notes Agent without writing code: it turns a messy transcript into a summary, decisions and an action item table, never invents an owner, and checks its own evidence against the transcript. Share the live link and a screenshot of the sample meeting with the beta tester task correctly marked Unassigned.",
  "portfolioPrompt": "I just built a Meeting Notes Agent without writing code. Claude built it as one web page from a single prompt, and a free Gemini key does the thinking. It turns a transcript into a summary, key points, decisions and an action item table with owner, deadline and priority. A plain JavaScript safety check replaces invented owners with Unassigned and marks each action item Verified or Check by looking for its evidence in the transcript. It also drafts follow-up emails, exports Markdown and CSV, and saves my last 10 meetings.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "I see code instead of a page",
    "fix": "The file was saved as .txt or as rich text. Save it again with the Build 3 settings."
  },
  {
    "issue": "The page is blank or the buttons do nothing",
    "fix": "Tell Claude: \"My agent is blank. Here is the file,\" paste it, and ask for a fixed version."
  },
  {
    "issue": "\"Wrong key\" message",
    "fix": "Click Change key and paste it again. Copy the whole key with no spaces."
  },
  {
    "issue": "\"Free limit reached\"",
    "fix": "You used it too fast. Wait a minute and try again."
  },
  {
    "issue": "\"Model not found\"",
    "fix": "Google renamed its AI. Ask Claude: \"Update GEMINI_MODEL to the current Gemini Flash model name.\""
  },
  {
    "issue": "Could not reach Gemini",
    "fix": "Check your internet. If it only fails from the double-clicked file, use the Netlify link (Build 6)."
  },
  {
    "issue": "Changes do not show",
    "fix": "Save, then refresh with Ctrl + F5."
  },
  {
    "issue": "Owners or tasks look wrong",
    "fix": "Make sure speaker names are spelled consistently in the transcript, then use the Build 5 prompt."
  },
  {
    "issue": "Stuck on a step",
    "fix": "Tell Claude the build and step number and what you see on your screen, and ask it to walk you through the fix."
  }
]$tsh$::jsonb,
  $res$[
  {
    "title": "Claude (free account)",
    "url": "https://claude.ai"
  },
  {
    "title": "Google AI Studio: create a Gemini API key",
    "url": "https://aistudio.google.com/apikey"
  },
  {
    "title": "Netlify Drop: publish a folder by dragging it",
    "url": "https://app.netlify.com/drop"
  }
]$res$::jsonb,
  'builder1',
  $note$Replace the Python guide with the no-code 'Get Claude to build your Meeting Notes Agent, for free' guide (Claude writes one index.html, Gemini key kept in the browser, optional Netlify hosting). Content from 'Build Your Meeting Notes Agent with Claude_ Beginner Guide.html'; prompts copied verbatim.$note$
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
