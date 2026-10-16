insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  8,
  $wyb$A Document Summarizer Agent you build without writing code. Claude writes it as one web page (summarizer.html) from a single prompt; the page talks to Google's free Gemini AI with your own free key. Drop in a PDF, a Word file, a text file, a web link or pasted text and it returns an executive brief, key points, action items, and risks and open questions, plus a chat box for follow-up questions about the same document. Unlike the course version it reads long documents completely, can read scanned PDFs, lets you choose the summary style, and lets you copy or download the result.$wyb$,
  $wyl$[
  "Get Claude to build a complete web page from one detailed prompt, with nothing to install",
  "Store a free Gemini key safely in your own browser instead of in the file",
  "Extract text from PDF, Word, text and web pages, and read scanned PDFs with AI vision",
  "Summarize a document of any length with map and reduce: chunk, take notes, then merge",
  "Use forgiving section markers instead of fragile JSON",
  "Test the hard cases: empty input, no key, wrong file type, scanned PDF, long text, no internet",
  "Publish the tool online for free and describe it for your portfolio"
]$wyl$::jsonb,
  $sess${
  "model": "Claude chat (free account) + Gemini (free API key)",
  "totalTime": "90 min",
  "buildCount": 8,
  "whatYouNeed": [
    "A computer (a phone can run the finished tool, but building is easier on a computer)",
    "A Google account (for the free Gemini key)",
    "A web browser: Chrome, Edge, Firefox or Safari",
    "A Claude chat at claude.ai",
    "One test document: a report, contract, article or any PDF with real text"
  ],
  "outcomes": [
    "Get Claude to write a complete Document Summarizer as one summarizer.html file, with no coding",
    "Summarize PDF, Word, text, pasted text and web links into four clear sections",
    "Read long documents completely and scanned PDFs with AI vision",
    "Ask follow-up questions about the same document and download the result",
    "Publish it online for free with your own key kept private"
  ],
  "builds": [
    {
      "number": 1,
      "title": "What you are building, and your free Gemini key",
      "time": "15 min",
      "description": "Skip the Python setup. The course version needed Python, a virtual environment, five code files and a terminal. This version is one file that runs in any browser.",
      "steps": [
        {
          "instruction": "Know what the page does. You give it a document and it returns an Executive brief (one short paragraph you can read in 15 seconds), Key points, Action items (tasks, deadlines and commitments), Risks and open questions, and an Ask a follow-up chat box for the same document."
        },
        {
          "instruction": "See how this version differs from the course version.",
          "table": {
            "header": [
              "Course version",
              "This version"
            ],
            "rows": [
              [
                "Install Python, a venv and libraries",
                "Nothing to install"
              ],
              [
                "5 files and terminal commands",
                "**1 file**: summarizer.html"
              ],
              [
                "Runs only on your computer",
                "Runs in any browser, phone included"
              ],
              [
                "Reads the first ~8 pages only",
                "Reads the whole document"
              ],
              [
                "Cannot read scanned PDFs",
                "Can read scanned PDFs"
              ]
            ]
          },
          "callout": {
            "variant": "tip",
            "text": "**How it works in one sentence:** you ask Claude to write the page, you save it as one file, and the page talks to Google's free Gemini AI using your own free key. The code comes from Claude, the AI is Gemini, PDF and Word reading use free open-source libraries (PDF.js and Mammoth) that load automatically, and hosting is free on Netlify Drop or GitHub Pages."
          }
        },
        {
          "instruction": "Check you have what you need: a computer, a Google account, a web browser (Chrome, Edge, Firefox or Safari), a Claude chat, and one test document such as a report, contract, article or any PDF with real text. You do not need to know how to code."
        },
        {
          "instruction": "Go to aistudio.google.com/apikey and sign in with Google. Click Create API key (accept the default project if asked), then copy the key and paste it into a private note.",
          "callout": {
            "variant": "warning",
            "text": "Never post the key on social media, in a chat or on GitHub, and never paste it inside the HTML file. Our page will ask you to paste it into a box instead, which is safer (more on this in Build 6). If the key page is blank, try an incognito window or a personal Google account, since some organizations block it."
          }
        },
        {
          "instruction": "Know the privacy rule. On Google's free tier, the content you send may be used to improve its products, and AI summaries can miss things or get details wrong.",
          "callout": {
            "variant": "warning",
            "text": "Do not upload contracts, medical records, passwords or anything confidential while using the free key. For anything important, such as legal, money or health matters, treat the summary as a quick guide and check the original document."
          },
          "verify": "You have a Gemini key saved in a private note."
        }
      ]
    },
    {
      "number": 2,
      "title": "Ask Claude to write the page",
      "time": "15 min",
      "description": "This is the main step. You paste one prompt and Claude gives you the whole tool.",
      "steps": [
        {
          "instruction": "Open a new chat with Claude. This keeps things clean."
        },
        {
          "instruction": "Copy the entire prompt below and send it. Claude replies with a file or a block of code. If it makes a file, download it. If it shows code, copy all of it.",
          "prompt": "Build me a Document Summarizer Agent as ONE single file called summarizer.html.\nAll HTML, CSS and JavaScript must be inside that one file. I am a complete\nbeginner, so keep the code clean and add short comments explaining each part.\n\nWHAT IT DOES\nThe user gives it a document and it returns a structured summary.\n\nINPUTS (3 tabs):\n1. Upload a file: drag-and-drop or click. Support .pdf, .docx and .txt.\n2. Paste text: a big text box.\n3. Web link: the user pastes a URL.\n\nOUTPUT (shown as separate cards, each with a Copy button):\n- Executive Brief: one paragraph, 3 to 5 sentences\n- Key Points: 3 to 6 bullets\n- Action Items: tasks, deadlines, commitments (write \"None identified\" if none)\n- Risks and Open Questions: 2 to 3 bullets (write \"None identified\" if none)\nAlso add a \"Download as .md\" button for the whole summary, and a \"Copy all\" button.\n\nSUMMARY STYLE: a dropdown with Executive (short and punchy), Detailed,\nand Simple (plain language for a beginner). Change the AI instructions\naccordingly.\n\nAI CONNECTION\n- Use the Google Gemini REST API from the browser with fetch().\n- Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent\n- Send the key in the header x-goog-api-key (never in the URL).\n- Set generationConfig.thinkingConfig.thinkingBudget to 0 and maxOutputTokens\n  to 2000. If the API returns a 400 error mentioning thinking, retry once\n  without thinkingConfig.\n- API key handling: show a \"Gemini API key\" box at the top. Save the key in\n  localStorage so it is remembered on this device only. Add a \"Forget key\"\n  button. NEVER hardcode a key in the file. Add a link to\n  aistudio.google.com/apikey and a one-line explanation that the key stays\n  in the user's own browser.\n- Retry up to 3 times with a 3 second pause on HTTP 500 and 503. On 429,\n  show: \"Free tier rate limit reached. Wait a minute and try again.\"\n  Show a friendly message for 400, 403 and 404 errors that says what to fix.\n\nREADING DOCUMENTS (free libraries from cdnjs.cloudflare.com only):\n- PDF: use PDF.js (pdf.js 3.11.174 and its worker file). Extract text page by page.\n- Word: use Mammoth (mammoth 1.6.0 browser build) with extractRawText.\n- TXT: read with FileReader.\n- Web link: fetch https://r.jina.ai/ followed by the URL, which returns the\n  page as clean readable text and works from a browser. If it fails, show a\n  message telling the user to copy the article text and use the Paste tab.\n- SCANNED PDFs: if a PDF yields almost no text (under 50 characters), show\n  a notice and a button \"Read with AI vision\". That button sends the PDF\n  to Gemini as inline base64 data (mime type application/pdf) and asks for\n  the same summary. Block files over 15 MB with a clear message.\n\nLONG DOCUMENTS (important):\n- If the text is under 30,000 characters, summarize it in one call.\n- If it is longer, split it into chunks of about 12,000 characters (break at\n  paragraph ends), summarize each chunk into short notes, then make ONE final\n  call that merges all the notes into the final structured summary.\n- Process at most 10 chunks. If the document is bigger, tell the user clearly\n  that only the first part was used and how many characters were covered.\n- Pause about 4 seconds between chunk calls so the free tier rate limit is\n  not hit. Show live progress like \"Reading part 3 of 7...\".\n\nREPLY FORMAT (do NOT use JSON):\nAsk the AI to answer with these markers, each on its own line:\n[BRIEF] [KEYPOINTS] [ACTIONS] [RISKS] and finish with [END].\nWrite a forgiving parser: ignore anything unrecognised, remove ``` code\nfences, stop at [END], and if a section is missing show \"None identified\"\ninstead of crashing. If NO markers are found at all, show the raw reply in a\nsingle card with a note that the format was unexpected, plus a \"Try again\"\nbutton.\n\nFOLLOW-UP CHAT:\nAfter a summary, show a box \"Ask a question about this document\". Send the\ndocument text (or its notes if it was long) plus the question to Gemini and\nshow the answer under it. Keep the conversation on screen.\n\nEXTRA FEATURES:\n- A \"History\" panel that saves the last 10 summaries (title, date, summary)\n  in localStorage, with a Clear history button.\n- A visible loading state with a spinner and disabled buttons while working.\n- A one-line privacy note: \"Your document is sent to Google's Gemini API to\n  be summarized. Do not upload confidential files.\"\n- Wrap every localStorage read and write in try/catch.\n\nDESIGN\nClean, modern, mobile friendly, with light and dark mode that follows the\ndevice setting. Calm colors, rounded cards, readable font size, plenty of\nspacing. A clear title and a short subtitle explaining what it does.\n\nWhen you are done, give me: (1) the complete file, and (2) a short\nplain-English list of how to test it.",
          "callout": {
            "variant": "warning",
            "text": "If Claude's answer stops halfway, reply \"Continue from where you stopped and give me the complete file again\". If you only got an explanation, reply \"Give me the complete summarizer.html file now.\" If Claude shows the page in a preview panel (an artifact), that is fine for a quick look, but you still need the downloaded file for the next steps."
          },
          "verify": "Claude has given you a complete HTML file, a few hundred lines long."
        }
      ]
    },
    {
      "number": 3,
      "title": "Save the file and open it",
      "time": "5 min",
      "description": "Whichever way you got it, the page must end up as summarizer.html.",
      "steps": [
        {
          "instruction": "If Claude gave you a downloadable file, save it as summarizer.html. You are done with this build."
        },
        {
          "instruction": "If Claude gave you code to copy, create a folder on your Desktop called summarizer-agent."
        },
        {
          "instruction": "Open Notepad (Windows) or TextEdit (Mac). On a Mac, choose Format, then Make Plain Text first, otherwise the file will be saved wrongly."
        },
        {
          "instruction": "Paste all the code and save it as summarizer.html inside your folder. The name must end in .html, not .html.txt. On Windows, choose Save as type: All files. If you cannot see file extensions, open File Explorer, click View and tick File name extensions."
        },
        {
          "instruction": "Double-click the file. It opens in your browser.",
          "callout": {
            "variant": "warning",
            "text": "Raw code instead of a page means the file was saved as .txt, so rename it to end in .html. A blank white page means some code was cut off when you copied, so ask Claude for the complete file again and copy from the very first line to the very last."
          },
          "verify": "You see the page with the title, the key box and the three input tabs."
        }
      ]
    },
    {
      "number": 4,
      "title": "Test it",
      "time": "15 min",
      "description": "Test in this order. Do one thing at a time so you know exactly what works.",
      "steps": [
        {
          "instruction": "Key test. Paste your key into the API key box and refresh the page. The key should still be there. Click Forget key to confirm that button works, then paste it again."
        },
        {
          "instruction": "Paste test. Open the Paste tab, use this text and click Summarize. You should see all four cards, and the risks card should mention the unapproved budget and the missing mockups.",
          "prompt": "Quarterly Planning Notes\n\nRevenue is up 12% this quarter. The team agreed to open a second office\nin Abuja, but the budget has not been approved yet. Action: renew the\nLagos office lease by Friday. Action: finance to send the revised budget\nto the CEO by the 30th. The new pricing page is planned for next week,\nalthough design has not delivered the final mockups.",
          "promptKind": "example"
        },
        {
          "instruction": "TXT test. Save the same text as test.txt and upload it."
        },
        {
          "instruction": "PDF test. Upload a real PDF with selectable text."
        },
        {
          "instruction": "Word test. Upload a .docx."
        },
        {
          "instruction": "Link test. Try a normal article link. A blog post or news story works best."
        },
        {
          "instruction": "Follow-up test. Ask a question whose answer is in the document, then one whose answer is not in it. A good agent says the document does not mention it."
        },
        {
          "instruction": "Style test. Summarize the same document as Executive, then as Simple. The two results should feel clearly different.",
          "verify": "Each input type produces a summary, and the follow-up answers come from the document."
        }
      ]
    },
    {
      "number": 5,
      "title": "Test the hard cases",
      "time": "15 min",
      "description": "A real agent is judged by how it behaves when things go wrong. Try each of these.",
      "steps": [
        {
          "instruction": "Run each test and compare it with what should happen.",
          "table": {
            "header": [
              "Test",
              "What should happen"
            ],
            "rows": [
              [
                "Click Summarize with nothing added",
                "A friendly \"add a document first\" message, no crash"
              ],
              [
                "Delete your key and summarize",
                "A clear message telling you to paste the key"
              ],
              [
                "Upload a .pptx or .png",
                "A message saying which formats are supported"
              ],
              [
                "Upload a scanned PDF",
                "A notice and the \"Read with AI vision\" button"
              ],
              [
                "Paste a very long text (copy a long article several times)",
                "Progress text like \"Reading part 2 of 5\" and one final summary"
              ],
              [
                "Turn off your Wi-Fi and summarize",
                "A message about connection, not a frozen page"
              ]
            ]
          }
        },
        {
          "instruction": "If any test fails, copy the exact problem into Claude with this fix prompt, filling in the brackets and pasting your full file. This is how professional builders work: test, find a break, describe it, fix it.",
          "prompt": "My summarizer.html has a problem.\nWhat I did: [describe the steps]\nWhat I expected: [what should have happened]\nWhat actually happened: [what you saw]\nError message from the browser console (F12 > Console): [paste it, or write \"none\"]\nHere is my current file: [paste it]\nPlease find the cause, explain it in simple words, and give me the complete fixed file.",
          "callout": {
            "variant": "tip",
            "text": "Habits that save hours: keep a copy of the file every time it works (summarizer-v1.html, summarizer-v2.html); change one thing at a time, then test; always ask for the **complete** file, not just the changed part; and describe problems with exact words from the screen, not \"it does not work\"."
          },
          "verify": "You tested at least three error cases and the page handled each one."
        }
      ]
    },
    {
      "number": 6,
      "title": "Put it online for free",
      "time": "15 min",
      "description": "Right now it only lives on your computer. Putting it online gives you a link you can open on your phone and show in your portfolio. It is safe with this design: the key is never inside the file, each visitor pastes their own, and it stays in their own browser.",
      "steps": [
        {
          "instruction": "Option A, Netlify Drop. Go to app.netlify.com/drop and sign up free if asked. Netlify Drop publishes a folder, so make sure your file is inside your summarizer-agent folder and rename it to index.html so the site opens it automatically."
        },
        {
          "instruction": "Drag the folder onto the Drop page. In a few seconds you get a link. Open it and test."
        },
        {
          "instruction": "Option B, GitHub Pages. Create a free account at github.com, click New repository, name it summarizer-agent, set it to Public and create it."
        },
        {
          "instruction": "Click Add file, then Upload files, and upload the file renamed as index.html. Click Commit."
        },
        {
          "instruction": "Go to Settings, then Pages. Under Source choose Deploy from a branch, pick main and the / (root) folder, then Save. After a minute or two your site appears at yourusername.github.io/summarizer-agent.",
          "callout": {
            "variant": "warning",
            "text": "A 404 means the file is not named exactly index.html, or it is inside a sub-folder. If the page loads but summaries fail online only, press F12, open the Console, look for a red message and paste it to Claude. If a friend sees no key, that is correct: every visitor needs their own free key, so add a short note on your portfolio explaining that."
          },
          "verify": "The online link opens, you paste your key, and a summary works."
        }
      ]
    },
    {
      "number": 7,
      "title": "Challenge: make it yours",
      "time": "20 min",
      "description": "Pick at least two features and ask Claude to add them.",
      "steps": [
        {
          "instruction": "Choose at least two upgrades. Compare two documents (a table of what changed and what is the same, great for contract versions); translate the summary (English, French, Yoruba, Igbo, Hausa, Pidgin and others); a custom focus box such as \"Focus on money and deadlines only\"; reading time saved (\"Original: 14 min read, summary: 40 seconds\"); export to PDF; a tone detector (formal, urgent, positive or negative); or confidence checks that mark each action item with the exact sentence it came from."
        },
        {
          "instruction": "Always paste your current code and ask for the full updated file. Use this template.",
          "prompt": "Here is my current summarizer.html:\n[paste the whole file]\n\nPlease add: [your feature].\nKeep everything that already works. Give me the complete updated file.",
          "verify": "Your page has at least two new features and everything that worked before still works."
        }
      ]
    },
    {
      "number": 8,
      "title": "How it actually works",
      "time": "10 min",
      "description": "Understanding this part is what turns \"I copied it\" into \"I built it\".",
      "steps": [
        {
          "instruction": "Detecting the document type. The page looks at the file name ending (.pdf, .docx, .txt) or whether you typed a link. This decides which reader to use. An unknown type gets a clear message instead of garbage."
        },
        {
          "instruction": "Extracting text. AI models read text, not file formats. A PDF, a Word file and a web page all store words differently, so a small extractor for each turns them into plain text first. That is what PDF.js and Mammoth do."
        },
        {
          "instruction": "Why scanned PDFs fail. A scanned PDF is a photo of a page with no text inside, so text extractors find nothing. Gemini can look at the PDF as an image instead, which is what the Read with AI vision button does."
        },
        {
          "instruction": "The prompt. The page sends Gemini your text plus strict instructions: use these section markers, keep the brief short, and write \"None identified\" if a section is empty."
        },
        {
          "instruction": "Markers instead of JSON. JSON breaks if the AI adds one stray comma or quote. Markers like [BRIEF] are forgiving: unknown lines are ignored and good sections are kept."
        },
        {
          "instruction": "Handling long documents (map and reduce). A very long document is split into chunks, each chunk is summarized into notes (map), then the notes are combined into one final summary (reduce). This is how real summarization tools handle a 100-page report. It uses more calls, which is why we cap it at 10 chunks and pause between calls."
        },
        {
          "instruction": "Cost control. On the free tier you pay nothing, but you have limits on requests per minute and per day. The chunk cap, the pause and the retry logic all protect you from hitting them."
        },
        {
          "instruction": "Where the key lives. In your browser's localStorage, on your device only. That is why you can publish the page safely.",
          "verify": "You can explain map and reduce, and why the key is safe in the browser."
        }
      ]
    }
  ],
  "portfolio": "Run your tool on a public document, such as a news article or a public report, and take a screenshot showing the four cards. Add your live link and write one line, for example: \"Document Summarizer Agent: upload a PDF, Word file or link and get an executive brief, key points, action items and risks, with long-document and scanned-PDF support. Built with Gemini and plain HTML.\"",
  "portfolioPrompt": "I just built a Document Summarizer Agent as one HTML page, written by Claude. You upload a PDF, Word file or text file, paste a web link or paste text and it returns an executive brief, key points, action items, and risks and open questions using the free Gemini API. It reads long documents by splitting them into chunks and merging the notes, reads scanned PDFs with AI vision, has Executive, Detailed and Simple styles, answers follow-up questions about the document, and keeps the API key only in the user's browser. I published it free online.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "\"Rate limit reached\" or a 429 error",
    "fix": "The free tier allows only so many requests per minute and per day. Wait a minute and retry. For long documents, test with shorter files. Limits can change, so check the limits shown in Google AI Studio."
  },
  {
    "issue": "503 or \"model overloaded\"",
    "fix": "It is a busy period on the free tier. The page already retries 3 times. Wait a few minutes and try again."
  },
  {
    "issue": "404 \"model not found\"",
    "fix": "Google retired or renamed the model. Tell Claude: \"The model name in my file returns 404. Update it to the current Gemini Flash model.\""
  },
  {
    "issue": "400 or 403 error",
    "fix": "The key is wrong or blocked, or it was copied with a space. Delete the key, create a fresh one and paste it carefully without spaces."
  },
  {
    "issue": "Nothing happens on click",
    "fix": "A JavaScript error. Press F12, open Console, copy the red error and give it to Claude with the fix prompt in Build 5."
  },
  {
    "issue": "Link summary fails",
    "fix": "The site blocks readers, needs a login, or the page is a PDF link. Save the content as a file, or copy the text and use the Paste tab."
  },
  {
    "issue": "PDF extracts jumbled text",
    "fix": "The layout has columns or tables. Try the Read with AI vision button, which handles layouts better."
  },
  {
    "issue": "Word file is empty",
    "fix": "The text is inside text boxes or images. Save it as PDF from Word, then upload the PDF."
  },
  {
    "issue": "The summary misses details",
    "fix": "A very long document hit the 10-chunk cap. Split the document into two files, or ask Claude to raise the cap (watch your rate limits)."
  },
  {
    "issue": "The AI invents something",
    "fix": "Language models sometimes guess. Use the follow-up box to ask \"Where does the document say this?\" and add the confidence-check feature from Build 7."
  },
  {
    "issue": "Free Gemini is not available to you",
    "fix": "Region, account type or a policy change. Backup plan: ask Claude to adapt the file for another free-tier AI provider, such as Groq or OpenRouter free models, or use a paid Claude API key if you already have billing set up. Tell Claude which provider and it will rewrite only the AI connection part."
  },
  {
    "issue": "The key box asks again every time",
    "fix": "Your browser blocks localStorage (private mode or strict settings). Use a normal window, or paste the key each session."
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
  },
  {
    "title": "GitHub Pages documentation",
    "url": "https://docs.github.com/pages"
  }
]$res$::jsonb,
  'builder1',
  $note$Replace the Python guide with the free no-code 'Build Your Document Summarizer Agent' guide (Claude writes summarizer.html, Gemini key kept in the browser; long documents, scanned PDFs, follow-up chat). Content from 'Build Your Document Summarizer Agent (Free, No-Code Session Guide).md'; prompts copied verbatim.$note$
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
