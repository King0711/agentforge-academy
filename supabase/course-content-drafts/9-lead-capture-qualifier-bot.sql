insert into public.course_content_draft (course_id, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources, tier, change_note)
values (
  9,
  $wyb$A lead qualifier that scores every enquiry for you, built entirely with free Google tools. Using a sample business, BrightHome Solar, a Google Form collects each enquiry into a Google Sheet. A short Google Apps Script then reads every new submission the moment it arrives: plain rules discard the impossible leads instantly (outside the service area, renters, empty forms), free Gemini AI scores the rest from 1 to 10, ordinary code turns the score into a hot, warm or cold tier, a follow-up deadline is logged, and a hot lead emails the salesperson straight away. Nothing to install, no server to run and no cost.$wyb$,
  $wyl$[
  "Design a lead form where every question helps decide whether a lead is worth a phone call",
  "Link a Google Form to a Google Sheet that acts as your free CRM",
  "Write a Google Apps Script that runs by itself on every form submission",
  "Use plain rules for the obvious cases and AI only for judgment calls",
  "Get structured JSON from Gemini and keep the tier decision in code, not in the AI",
  "Make failures safe: a lead is never lost when the AI is down",
  "Test with realistic leads and adapt the bot to any service business"
]$wyl$::jsonb,
  $sess${
  "model": "Gemini (free API key) in Google Apps Script",
  "totalTime": "90 min",
  "buildCount": 6,
  "whatYouNeed": [
    "A Google account (for Forms, Sheets and Apps Script)",
    "A free Gemini API key from aistudio.google.com/apikey (no card needed)",
    "A computer with a browser. Nothing to install and no server to run",
    "Your own email address to receive the hot-lead alerts while you test"
  ],
  "outcomes": [
    "Build a lead form where every question helps qualify the lead",
    "Score every new submission automatically with rules first and Gemini second",
    "Tier leads hot, warm or cold in code so the same score always gives the same tier",
    "Get an email the moment a hot lead arrives, with a follow-up deadline for every lead",
    "Adapt the bot to any service business by changing the form, the ICP and the rules"
  ],
  "builds": [
    {
      "number": 1,
      "title": "The business and your free AI key",
      "time": "15 min",
      "description": "Meet the sample business, see what the bot replaces from the course tools, and get a free Gemini key.",
      "steps": [
        {
          "instruction": "Read the problem. BrightHome Solar installs solar panels and backup batteries for homes and small businesses in one city. Its website form brings in about 40 enquiries a week. About 10 are serious buyers who want to install within weeks, about 15 are just curious or researching, about 8 are renters who cannot approve an installation, and about 7 live outside the service area. One salesperson calls in order of arrival, so the best buyers wait two days behind the wrong people and a competitor calls first.",
          "callout": {
            "variant": "tip",
            "text": "**The bot does the first read.** Every submission is scored in seconds, sorted into hot, warm or cold, logged with a follow-up deadline, and a hot lead emails the salesperson immediately."
          }
        },
        {
          "instruction": "See what changed from the original course version. Everything below is free and nothing needs installing.",
          "table": {
            "header": [
              "Course version",
              "This version",
              "Why it is easier"
            ],
            "rows": [
              [
                "Typeform",
                "Google Form",
                "Free, no webhook parsing"
              ],
              [
                "HubSpot CRM",
                "Google Sheet",
                "Your CRM, visible instantly"
              ],
              [
                "Python + Flask + ngrok",
                "Google Apps Script",
                "Runs on Google's servers; nothing to install or host"
              ],
              [
                "Follow-up task",
                "\"Follow-up Due\" column + email alert",
                "Same result, zero setup"
              ]
            ]
          }
        },
        {
          "instruction": "Check you have a Google account. That is all you need besides a free Gemini key."
        },
        {
          "instruction": "Go to aistudio.google.com/apikey, sign in, click Create API key and copy it. Paste it into a private note for Build 3.",
          "callout": {
            "variant": "warning",
            "text": "Keep the key private. Never paste it into code or share it. If the page will not load or says unavailable, use a personal Gmail account, not a work or school one."
          },
          "verify": "Your Gemini key is copied into a private note."
        }
      ]
    },
    {
      "number": 2,
      "title": "Build the form",
      "time": "10 min",
      "description": "Every question exists because it helps decide whether a lead is worth a phone call. If a question does not help you decide, do not ask it: long forms lose people.",
      "steps": [
        {
          "instruction": "Go to forms.google.com and create a blank form titled \"Get a Free Solar Quote\"."
        },
        {
          "instruction": "Add these nine questions. Copy the titles exactly, because the code matches on them.",
          "table": {
            "header": [
              "Question title",
              "Type",
              "Options"
            ],
            "rows": [
              [
                "Full name",
                "Short answer",
                ""
              ],
              [
                "Phone number",
                "Short answer",
                ""
              ],
              [
                "Email address",
                "Short answer",
                ""
              ],
              [
                "Is your property in or near Greenfield?",
                "Multiple choice",
                "Yes / No"
              ],
              [
                "Property type",
                "Multiple choice",
                "Home / Small business / Large commercial or industrial"
              ],
              [
                "Do you own the property?",
                "Multiple choice",
                "Yes, I own it / No, I rent / I manage it for the owner"
              ],
              [
                "Monthly energy spend",
                "Multiple choice",
                "Under $50 / $50-$150 / $150-$400 / Over $400"
              ],
              [
                "When do you want to install?",
                "Multiple choice",
                "Within 1 month / 1-3 months / 3-6 months / Just researching"
              ],
              [
                "What do you want solar to help with?",
                "Paragraph",
                ""
              ]
            ]
          }
        },
        {
          "instruction": "Mark Full name, Phone number and Email address as Required."
        },
        {
          "instruction": "Open the Responses tab, click the green Link to Sheets icon and choose Create a new spreadsheet."
        },
        {
          "instruction": "Submit one test response with the Preview (eye) icon so the sheet gets its header row.",
          "callout": {
            "variant": "warning",
            "text": "If you rename a question later, update FIELDS in the code too. Trailing spaces and curly versus straight apostrophes are the usual culprits."
          },
          "verify": "Row 1 of the sheet shows the question titles and row 2 shows your test answers."
        }
      ]
    },
    {
      "number": 3,
      "title": "Add the brain",
      "time": "30 min",
      "description": "The bot is one Google Apps Script attached to your sheet. Only the SETTINGS block at the top and the RULES section need editing when you adapt it to another business.",
      "steps": [
        {
          "instruction": "In your response sheet open Extensions, then Apps Script. Delete the default code and rename the project \"Solar Lead Qualifier\"."
        },
        {
          "instruction": "Store your key safely. Click the gear icon (Project Settings), scroll to Script properties and click Add script property. Name it GEMINI_API_KEY, paste your key as the value and save.",
          "callout": {
            "variant": "warning",
            "text": "The name must match exactly. The key lives here and never inside the code."
          }
        },
        {
          "instruction": "Paste all of this into Code.gs, replacing what is there, then click Save.",
          "prompt": "// ============ SETTINGS (edit for YOUR business) ============\nconst MODEL = \"gemini-flash-latest\";\n\n// Question titles, EXACTLY as in your form\nconst FIELDS = {\n  full_name: \"Full name\",\n  phone: \"Phone number\",\n  email: \"Email address\",\n  in_area: \"Is your property in or near Greenfield?\",\n  property_type: \"Property type\",\n  ownership: \"Do you own the property?\",\n  spend: \"Monthly energy spend\",\n  timeline: \"When do you want to install?\",\n  goal: \"What do you want solar to help with?\",\n};\n\n// Your Ideal Customer Profile in plain English: the AI's whole brief.\nconst ICP = `\nBrightHome Solar installs solar panels and backup batteries for homes\nand small businesses in Greenfield.\n\nBest customers (score 8-10):\n- Own their property (or manage it for the owner).\n- Home or small business.\n- Spend $150+ per month on energy.\n- Want to install within 3 months.\n- Goal mentions outages, high bills, backup power, or keeping a\n  business running during outages.\n\nMedium (score 5-7):\n- Large commercial or industrial sites (we only handle small systems,\n  so these need a specialist hand-off).\n- Spend $50-$150 per month, or timeline is 3-6 months.\n\nWeak (score 1-4):\n- Just researching, spend under $50, or a vague goal with no urgency.\n`.trim();\n\nconst FOLLOW_UP_HOURS = { hot: 2, warm: 24, cold: 72, error: 24 };\nconst OUT = { score: \"Lead Score\", tier: \"Tier\", reason: \"Reason\", due: \"Follow-up Due\", status: \"Status\" };\n\n// ============ ENTRY POINT (runs on every form submission) ============\nfunction onFormSubmit(e) {\n  const sheet = e.range.getSheet();\n  const row = e.range.getRow();\n  const lead = readLead(e.namedValues);\n  let result;\n  try {\n    result = scoreLead(lead);\n  } catch (err) {\n    // Never lose a lead because the AI failed\n    result = { score: \"\", tier: \"error\", reason: \"Scoring failed: \" + err.message };\n  }\n  writeResult(sheet, row, result);\n  if (result.tier === \"hot\") sendHotAlert(lead, result);\n}\n\nfunction readLead(nv) {\n  const lead = {};\n  for (const key in FIELDS) {\n    const v = nv[FIELDS[key]];\n    lead[key] = v && v[0] ? String(v[0]).trim() : \"\";\n  }\n  return lead;\n}\n\n// ============ SCORING ============\nfunction scoreLead(lead) {\n  // ---- RULES: free, instant, consistent. No AI needed. ----\n  if (!lead.email && !lead.phone) return { score: 1, tier: \"cold\", reason: \"No way to contact this person.\" };\n  if (lead.in_area.toLowerCase().startsWith(\"no\")) return { score: 1, tier: \"cold\", reason: \"Outside our service area.\" };\n  if (lead.ownership.toLowerCase().startsWith(\"no, i rent\")) return { score: 2, tier: \"cold\", reason: \"Renter: cannot approve an installation.\" };\n  if (!lead.spend && !lead.timeline && !lead.goal) return { score: 2, tier: \"cold\", reason: \"Not enough information to qualify.\" };\n\n  // ---- JUDGMENT: the AI scores everything that remains ----\n  const ai = askGemini(buildPrompt(lead));\n  const score = Math.max(1, Math.min(10, Math.round(Number(ai.score))));\n  if (isNaN(score)) throw new Error(\"AI returned a non-numeric score\");\n  return { score: score, tier: scoreToTier(score), reason: ai.reason || \"No reason given.\" };\n}\n\n// AI judges fit; plain code does the bucketing\nfunction scoreToTier(s) { return s >= 8 ? \"hot\" : s >= 5 ? \"warm\" : \"cold\"; }\n\nfunction buildPrompt(lead) {\n  return `Score this sales lead against the Ideal Customer Profile below.\n\n${ICP}\n\nLEAD:\nProperty type: ${lead.property_type || \"not provided\"}\nOwnership: ${lead.ownership || \"not provided\"}\nMonthly energy spend: ${lead.spend || \"not provided\"}\nInstall timeline: ${lead.timeline || \"not provided\"}\nWhat they want solar to help with: ${lead.goal || \"not provided\"}\n\nGive a score from 1 to 10 (10 = perfect fit) and ONE sentence explaining it.\nIf a field is \"not provided\", assume nothing good about it; score only on the evidence given.`;\n}\n\n// ============ GEMINI ============\nfunction askGemini(prompt) {\n  const key = PropertiesService.getScriptProperties().getProperty(\"GEMINI_API_KEY\");\n  if (!key) throw new Error(\"GEMINI_API_KEY is missing in Script properties\");\n  const url = \"https://generativelanguage.googleapis.com/v1beta/models/\" + MODEL + \":generateContent\";\n  const body = {\n    contents: [{ role: \"user\", parts: [{ text: prompt }] }],\n    generationConfig: {\n      temperature: 0,\n      maxOutputTokens: 1024,\n      responseMimeType: \"application/json\",\n      responseSchema: {\n        type: \"OBJECT\",\n        properties: { score: { type: \"INTEGER\" }, reason: { type: \"STRING\" } },\n        required: [\"score\", \"reason\"],\n      },\n      thinkingConfig: { thinkingBudget: 0 },\n    },\n  };\n  let last = \"no response\";\n  for (let i = 1; i <= 3; i++) {\n    const res = UrlFetchApp.fetch(url, {\n      method: \"post\",\n      contentType: \"application/json\",\n      headers: { \"x-goog-api-key\": key },\n      payload: JSON.stringify(body),\n      muteHttpExceptions: true,\n    });\n    const code = res.getResponseCode();\n    if (code === 200) {\n      const data = JSON.parse(res.getContentText());\n      const c = data.candidates && data.candidates[0];\n      const parts = (c && c.content && c.content.parts) || [];\n      const text = parts.map(function (p) { return p.text || \"\"; }).join(\"\");\n      if (!text) throw new Error(\"Gemini returned an empty answer\");\n      return JSON.parse(text);\n    }\n    last = \"Gemini error \" + code + \": \" + res.getContentText().slice(0, 200);\n    if (code === 429 || code === 500 || code === 503) Utilities.sleep(3000 * i); else break;\n  }\n  throw new Error(last);\n}\n\n// ============ SHEET + ALERT ============\nfunction writeResult(sheet, row, r) {\n  const due = new Date(Date.now() + FOLLOW_UP_HOURS[r.tier] * 3600 * 1000);\n  setCell(sheet, row, OUT.score, r.score);\n  setCell(sheet, row, OUT.tier, r.tier);\n  setCell(sheet, row, OUT.reason, r.reason);\n  setCell(sheet, row, OUT.due, due);\n  setCell(sheet, row, OUT.status, \"To follow up\");\n}\n\n// Finds a column by header name (creates it if missing), then writes\nfunction setCell(sheet, row, header, value) {\n  const lastCol = sheet.getLastColumn();\n  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];\n  let col = headers.indexOf(header) + 1;\n  if (col === 0) { col = lastCol + 1; sheet.getRange(1, col).setValue(header); }\n  sheet.getRange(row, col).setValue(value);\n}\n\nfunction sendHotAlert(lead, r) {\n  MailApp.sendEmail(\n    Session.getEffectiveUser().getEmail(),\n    \"HOT solar lead: \" + lead.full_name + \" (\" + r.score + \"/10)\",\n    \"CALL NOW: \" + lead.phone + \"\\n\\n\" +\n    \"Name: \" + lead.full_name + \"\\nEmail: \" + lead.email + \"\\n\" +\n    \"Property: \" + lead.property_type + \" (\" + lead.ownership + \")\\n\" +\n    \"Monthly spend: \" + lead.spend + \"\\nTimeline: \" + lead.timeline + \"\\n\" +\n    \"Goal: \" + lead.goal + \"\\n\\nWhy \" + r.score + \": \" + r.reason + \"\\n\\n\" +\n    \"Follow up within \" + FOLLOW_UP_HOURS.hot + \" hours.\"\n  );\n}\n\n// ============ SETUP + TESTS (run by hand) ============\nfunction createTrigger() { // run ONCE\n  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });\n  ScriptApp.newTrigger(\"onFormSubmit\").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();\n  Logger.log(\"Trigger created.\");\n}\n\nfunction testOutOfArea() { // rule only, no AI call\n  Logger.log(JSON.stringify(scoreLead({\n    full_name: \"Test\", phone: \"000\", email: \"t@example.com\", in_area: \"No\",\n    property_type: \"Home\", ownership: \"Yes, I own it\", spend: \"Over $400\",\n    timeline: \"Within 1 month\", goal: \"Backup power\" })));\n}\n\nfunction testGreatLead() { // real AI call\n  Logger.log(JSON.stringify(scoreLead({\n    full_name: \"Ada Obi\", phone: \"0800000000\", email: \"ada@example.com\", in_area: \"Yes\",\n    property_type: \"Small business\", ownership: \"Yes, I own it\", spend: \"$150-$400\",\n    timeline: \"Within 1 month\",\n    goal: \"My bakery loses power daily and we burn through fuel running a generator.\" })));\n}\n\nfunction testWeakLead() { // real AI call\n  Logger.log(JSON.stringify(scoreLead({\n    full_name: \"Sam Lee\", phone: \"0800000001\", email: \"sam@example.com\", in_area: \"Yes\",\n    property_type: \"Home\", ownership: \"Yes, I own it\", spend: \"Under $50\",\n    timeline: \"Just researching\", goal: \"Curious how it works.\" })));\n}\n",
          "promptKind": "code",
          "verify": "The code is saved and the function dropdown next to Run lists onFormSubmit, createTrigger and the three test functions."
        },
        {
          "instruction": "Test the free rule path first. Pick testOutOfArea in the function dropdown next to Run and click Run. The first time, Google asks for permission: Review permissions, choose your account, then \"Google hasn't verified this app\", Advanced, Go to Solar Lead Qualifier (unsafe), Allow. This is normal for your own scripts.",
          "verify": "The Execution log shows score 1, tier cold, \"Outside our service area.\" and no AI call was made."
        },
        {
          "instruction": "Run testGreatLead. This is a real AI call.",
          "verify": "The log shows a score of 8 or higher (hot)."
        },
        {
          "instruction": "Run testWeakLead. This is a real AI call.",
          "verify": "The log shows a score of 4 or lower (cold)."
        },
        {
          "instruction": "Turn the bot on. Run createTrigger once.",
          "verify": "Under the clock icon (Triggers) in the left bar you can see onFormSubmit."
        }
      ]
    },
    {
      "number": 4,
      "title": "Test it end to end with realistic leads",
      "time": "10 min",
      "description": "Submit the form once per lead below, using your own email so the alert reaches you.",
      "steps": [
        {
          "instruction": "Open your form and submit these five leads, one submission each.",
          "table": {
            "header": [
              "Lead",
              "Answers",
              "Expected"
            ],
            "rows": [
              [
                "Bakery owner",
                "In area, small business, owns, $150-$400, within 1 month, \"daily outages, generator costs\"",
                "**Hot** + email"
              ],
              [
                "Factory manager",
                "In area, large commercial, manages for owner, over $400, 1-3 months",
                "Warm (needs specialist)"
              ],
              [
                "Curious student",
                "In area, home, owns, under $50, just researching",
                "Cold"
              ],
              [
                "Renter",
                "In area, rents",
                "Cold, instantly, no AI"
              ],
              [
                "Out of town",
                "Outside the area",
                "Cold, instantly, no AI"
              ]
            ]
          },
          "verify": "Five rows appear with Lead Score, Tier, Reason, Follow-up Due and Status filled in, and the bakery owner's hot-lead email reaches your inbox."
        },
        {
          "instruction": "Make the sheet usable. Select the Tier column, then Format, Conditional formatting. Add three rules with \"Text is exactly\": hot in red, warm in orange and cold in grey."
        },
        {
          "instruction": "Then choose Data, Create a filter and sort by Follow-up Due.",
          "callout": {
            "variant": "tip",
            "text": "The salesperson now sees reds at the top and calls the bakery owner within the hour."
          },
          "verify": "Hot leads are red and sit at the top of the sheet."
        }
      ]
    },
    {
      "number": 5,
      "title": "Understand how it works",
      "time": "5 min",
      "description": "Understanding this part is what turns \"I copied it\" into \"I built it\".",
      "steps": [
        {
          "instruction": "Form submits, then Google fires the trigger and onFormSubmit runs. That function reads the new row, scores the lead, writes the result back to the same row and sends the alert if the lead is hot."
        },
        {
          "instruction": "Rules first, AI second. Out-of-area leads, renters and empty forms are decided by plain code: free, instant and consistent. The AI only handles judgment calls, such as how urgent a lead sounds."
        },
        {
          "instruction": "Structured output. Gemini returns JSON in a fixed shape (a score and a reason), so there is no fragile text parsing. The code still clamps the score to the range 1 to 10."
        },
        {
          "instruction": "The tier is code, not AI. The AI judges fit; scoreToTier does the arithmetic, so the same score always gives the same tier (8 to 10 hot, 5 to 7 warm, 1 to 4 cold)."
        },
        {
          "instruction": "Failures never lose a lead. If the AI is down, the row is still saved with the tier error and the reason, so nothing disappears.",
          "verify": "You can explain why a rule beats the AI for a renter, and why the tier is decided by code."
        }
      ]
    },
    {
      "number": 6,
      "title": "Make it your business",
      "time": "20 min",
      "description": "You change three things: the form questions, the ICP text and the hard rules. The ICP (Ideal Customer Profile) is the AI's whole brief.",
      "steps": [
        {
          "instruction": "Ask: what answer makes a lead impossible or worthless no matter what else they say? That becomes a hard rule.",
          "callout": {
            "variant": "tip",
            "text": "A free email address would be a red flag for B2B software but is completely normal for BrightHome's household customers. Rules depend on your business."
          }
        },
        {
          "instruction": "See how the same bot fits other businesses.",
          "table": {
            "header": [
              "Business",
              "Strong signals",
              "Hard rules (skip the AI)"
            ],
            "rows": [
              [
                "Real estate agent",
                "Pre-approved, moving within 3 months",
                "Budget far below your market, outside your area"
              ],
              [
                "Web design agency",
                "Budget of $1k+, launch date",
                "\"Under $100\", no business"
              ],
              [
                "Gym or studio",
                "Lives close, wants to start this month",
                "Too far to attend"
              ],
              [
                "Law firm",
                "Case type you handle, time-sensitive",
                "Wrong practice area or jurisdiction"
              ]
            ]
          }
        },
        {
          "instruction": "List the 5 to 8 facts that decide whether a lead is worth a call."
        },
        {
          "instruction": "Turn them into form questions. Multiple choice is cleanest."
        },
        {
          "instruction": "Update FIELDS so each title exactly matches your sheet's headers."
        },
        {
          "instruction": "Rewrite ICP with best, medium and weak customers. Examples beat adjectives."
        },
        {
          "instruction": "Rewrite the hard rules in scoreLead, then update buildPrompt to include your new fields."
        },
        {
          "instruction": "Re-run the tests and compare the scores with 3 to 5 real past leads.",
          "verify": "The bot scores your own sample leads the way you would."
        }
      ],
      "goFurther": "Level up: auto-reply to every lead with a faster promise for hot ones, catch duplicates by email or phone number, send a morning digest of leads due today with a time-driven trigger, or push scored leads into HubSpot's free tier with UrlFetchApp."
    }
  ],
  "portfolio": "You built a Lead Qualifier Bot for BrightHome Solar: a Google Form feeds an Apps Script that discards impossible leads with rules, scores the rest with Gemini, tiers them hot, warm or cold in code, and emails the salesperson instantly. It is free, serverless and adaptable to any service business. Add a screenshot of your colour-coded sheet.",
  "portfolioPrompt": "I just built a Lead Qualifier Bot for a sample solar business. A Google Form feeds a Google Sheet; a Google Apps Script discards impossible leads with plain rules (outside the service area, renters, empty forms), scores the rest from 1 to 10 with Gemini using structured JSON, turns the score into a hot, warm or cold tier in code, logs a follow-up deadline, and emails the salesperson straight away for hot leads. A failure never loses a lead.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows"
}$sess$::jsonb,
  null, null,
  $tsh$[
  {
    "issue": "First stop for any problem",
    "fix": "Open the Executions tab in the left bar of Apps Script. It shows every run and its exact error."
  },
  {
    "issue": "Nothing happens on submission",
    "fix": "The trigger is not installed. Run createTrigger and check the Triggers page (clock icon)."
  },
  {
    "issue": "Cannot read properties of undefined",
    "fix": "You ran onFormSubmit by hand. It only works from a real form submission; use the test functions instead."
  },
  {
    "issue": "Fields are blank, or everyone is \"Outside our service area\"",
    "fix": "A title in FIELDS does not exactly match the sheet header. Compare them character by character."
  },
  {
    "issue": "GEMINI_API_KEY is missing",
    "fix": "There is a typo in the name, or it was not saved under Script properties."
  },
  {
    "issue": "Gemini error 404",
    "fix": "The model was retired. Change MODEL to a current Flash model name."
  },
  {
    "issue": "Gemini error 400 about thinking",
    "fix": "Delete the thinkingConfig line."
  },
  {
    "issue": "Gemini error 429",
    "fix": "Free-tier rate limit. The code retries; wait a minute if many forms arrive at once."
  },
  {
    "issue": "Rows show tier error",
    "fix": "Read the Reason column for the real message, then re-score the lead by hand."
  },
  {
    "issue": "No hot-lead email",
    "fix": "Check your spam folder. A personal Gmail account also has a daily email cap (around 100)."
  },
  {
    "issue": "Scores do not match your judgment",
    "fix": "Sharpen the ICP with concrete examples and compare against 3 to 5 real past leads."
  },
  {
    "issue": "Edits have no effect",
    "fix": "Press Save before testing."
  }
]$tsh$::jsonb,
  $res$[
  {
    "title": "Google Forms",
    "url": "https://forms.google.com"
  },
  {
    "title": "Google Apps Script",
    "url": "https://script.google.com"
  },
  {
    "title": "Google AI Studio: create a Gemini API key",
    "url": "https://aistudio.google.com/apikey"
  },
  {
    "title": "Apps Script triggers guide",
    "url": "https://developers.google.com/apps-script/guides/triggers"
  }
]$res$::jsonb,
  'builder1',
  $note$Replace the Python/Flask/HubSpot guide with the free 'Build a Free Lead Qualifier Bot: BrightHome Solar' guide (Google Form + Google Sheet + Apps Script + Gemini). Content from lead-qualifier-bot-guide.html; code unchanged from the source (syntax-checked with node).$note$
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
