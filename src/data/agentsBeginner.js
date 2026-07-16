// Beginner Agents (1-12)
export const agentsBeginner = [
  {
    id: 1,
    title: 'Gmail AI Triage Agent',
    emoji: '📧',
    videoId: 'ScMzIvxBSi4', // Replace with your own YouTube video ID when ready
    department: ['Operations', 'Sales'],
    departmentIds: ['operations', 'sales'],
    difficulty: 'Beginner',
    description:
      'Connects to your Gmail, reads unread emails, classifies them by priority, auto-labels them, and drafts context-aware replies.',
    whatYouBuild:
      'An always-on email assistant that logs into your Gmail, pulls your latest unread messages, asks Claude to triage each one as URGENT, IMPORTANT, or LOW, applies matching Gmail labels automatically, and writes draft replies you can review and send with one click.',
    whatYouLearn: [
      'Authenticate with Google APIs using OAuth 2.0',
      'Read and parse Gmail messages with the Gmail API',
      'Design classification prompts for Claude',
      'Programmatically create labels and apply them to messages',
      'Generate and save draft replies via API',
      'Schedule recurring Python jobs',
    ],
    techStack: ['Python', 'Gmail API', 'Claude API'],
    buildTime: '2.5 hrs',
    xp: 300,
    popularity: 98,
    prerequisites: ['Basic Python', 'Gmail account', 'Google Cloud account (free)'],
    tags: ['automation', 'email', 'productivity'],
    session: {
      totalTime: '75 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Securely connect Claude to your Gmail account',
        'Have Claude build an email triage script that sorts your inbox into URGENT, IMPORTANT, and LOW',
        'Have Claude wire up auto-labeling and draft replies for the important stuff',
        'Schedule the whole thing to run on its own every 30 minutes',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A Gmail account',
        'A free Google Cloud account (console.cloud.google.com)',
      ],
      builds: [
        {
          number: 1,
          title: 'Connect Claude to your Gmail',
          time: '20 min',
          description: 'Before Claude can read your email, Google needs to give it permission. This part is a few clicks in your browser, then Claude writes the connection code.',
          steps: [
            {
              instruction: 'In your browser, go to console.cloud.google.com and create a new project called "AgentForge Gmail Agent". Then go to APIs & Services > Library, search for "Gmail API", and click Enable.',
            },
            {
              instruction: 'Still in Google Cloud Console, go to APIs & Services > OAuth consent screen, choose "External", fill in an app name, and add your own Gmail address as a Test User. Then go to Credentials > Create Credentials > OAuth client ID, choose "Desktop app", and download the JSON file. Rename it to credentials.json and drop it in your project folder.',
            },
            {
              instruction: 'Open Claude Code (or Cowork) in your project folder and paste this prompt:',
              prompt: 'I\'m building a Gmail automation agent in Python. I have a credentials.json file from Google Cloud in this folder.\n\nPlease:\n1. Create a requirements.txt with: google-auth, google-auth-oauthlib, google-api-python-client, anthropic, schedule\n2. Create auth.py with a get_credentials() function that runs the OAuth flow using credentials.json, caches the result in token.json, and refreshes the token automatically when it expires. Use these scopes: gmail.modify and gmail.compose\n3. Install the dependencies for me\n\nExplain each file briefly as you create it.',
              verify: 'Run `python -c "from auth import get_credentials; get_credentials()"`. A browser tab should pop up asking you to log in to Google and approve access. After you approve it, a new token.json file should appear in your folder.',
            },
          ],
          goFurther: 'Ask Claude to add a second Google account by saving tokens under different filenames, so you can triage two inboxes with one script.',
        },
        {
          number: 2,
          title: 'Build the triage classifier',
          time: '20 min',
          description: 'Now the fun part — Claude builds the script that reads your unread emails and decides what matters.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Using the auth.py from before, create fetcher.py with a get_unread_emails() function that fetches the last 50 unread emails from my Gmail inbox and returns a list of dicts with sender, subject, and a plain-text body for each one.\n\nThen create classifier.py that uses the Anthropic Python SDK (model "claude-sonnet-4-5") to classify each email as URGENT, IMPORTANT, or LOW priority, with a one-sentence reason. It should return clean JSON.\n\nAdd a small test at the bottom of classifier.py that fetches 3 real unread emails and prints their classification.',
              verify: 'Run `python classifier.py`. You should see up to 3 lines printed, each showing a real subject from your inbox alongside a priority (URGENT/IMPORTANT/LOW) and a short reason.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a 4th category, "NEWSLETTER", and have it skip those entirely so they never clutter your labels.',
        },
        {
          number: 3,
          title: 'Auto-label and draft replies',
          time: '20 min',
          description: 'Next, have Claude make the triage results actually show up in your inbox — as labels you can see and draft replies you can review.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create labels.py with two functions: get_or_create_label(service, name) which finds or creates a Gmail label, and apply_label(service, message_id, label_id) which applies a label and removes the UNREAD label from a message.\n\nThen create drafter.py with draft_reply(client, email) which asks Claude to write a short, professional reply (under 120 words) to an email, and save_draft(service, email, reply_text) which saves that reply as a Gmail draft addressed to the sender.\n\nKeep the style consistent with fetcher.py and classifier.py.',
              verify: 'Open your inbox in a browser. After the next full run (Build 4), check the left sidebar for new "URGENT", "IMPORTANT", and "LOW" labels, and check your Drafts folder for AI-written replies to anything urgent or important.',
            },
          ],
          goFurther: 'Ask Claude to color-code the labels (e.g. URGENT in red) using the Gmail API\'s label color settings.',
        },
        {
          number: 4,
          title: 'Put it all together and schedule it',
          time: '15 min',
          description: 'Last step — wire everything into one script that runs automatically, then take it for a real test drive.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create main.py that ties everything together:\n- Fetch unread emails with fetcher.py\n- Classify each one with classifier.py\n- Apply the matching label with labels.py\n- For URGENT or IMPORTANT emails, draft a reply with drafter.py\n- Print one line per email showing its priority and reason\n\nRun this once immediately, then repeat every 30 minutes using the `schedule` library, with a small sleep loop so it keeps running in the background.',
              verify: 'Run `python main.py`. It should immediately print one line per unread email, then sit there running quietly (press Ctrl+C to stop). Check Gmail to confirm the labels and drafts appeared.',
            },
            {
              instruction: 'Now do a real end-to-end test: send yourself two emails — one titled "URGENT: server is down" and a casual one like "Lunch on Friday?" — then run `python main.py` again.',
              verify: 'Within about a minute you should see: both emails labeled correctly, a new draft reply waiting for the urgent one, and console output showing the priority + reason Claude assigned to each.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to deploy main.py to a free always-on service (like Railway or a Raspberry Pi) so it keeps triaging your inbox even when your laptop is closed.',
        },
      ],
      portfolio: 'You just built a working email assistant that reads, prioritizes, labels, and drafts replies for your real inbox — entirely by directing Claude with plain-English prompts. Take a screenshot of your labeled inbox and the console output, and add "Gmail AI Triage Agent" to your build portfolio with a one-line description of what it does.',
      portfolioPrompt: 'I just built a Gmail AI Triage Agent that reads my unread emails, classifies them as URGENT, IMPORTANT, or LOW using Claude, auto-labels them in Gmail, and drafts replies for the important ones — then runs automatically every 30 minutes.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up Google Cloud project & enable Gmail API',
        description:
          'Create a new project in the Google Cloud Console, enable the Gmail API, then create an OAuth 2.0 Client ID for a Desktop App. Download the credentials file and save it as credentials.json in your project folder.',
        code: `# No code yet — this step is done in the Google Cloud Console:
# 1. console.cloud.google.com -> New Project -> "AgentForge Gmail Agent"
# 2. APIs & Services -> Library -> search "Gmail API" -> Enable
# 3. APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
#    Application type: Desktop app
# 4. Download JSON -> save as credentials.json in your project root`,
        tip: 'Add yourself as a test user under OAuth consent screen so Google does not block the login.',
        verify: 'In Google Cloud Console, go to APIs & Services > Enabled APIs — "Gmail API" should be listed. You should also have a credentials.json file saved in your project folder.',
      },
      {
        number: 2,
        title: 'Install dependencies',
        description: 'Create a virtual environment and install the Google API client libraries plus the Anthropic SDK.',
        code: `python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

pip install google-auth google-auth-oauthlib google-api-python-client anthropic`,
        tip: 'Pin your versions in a requirements.txt so the agent keeps working after library updates.',
        verify: 'Run `pip show anthropic` — it should print version info with no "package not found" error.',
      },
      {
        number: 3,
        title: 'Write the authentication module',
        description:
          'Build auth.py to handle the OAuth flow the first time the agent runs, then cache the resulting token in token.json so future runs do not require a browser login.',
        code: `# auth.py
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
]

def get_credentials():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return creds`,
        tip: 'gmail.modify lets you label messages; gmail.compose lets you create drafts. Request only what you need.',
        verify: 'Run `python -c "from auth import get_credentials; get_credentials()"`. A browser window should open asking you to log in and approve access — after approving, a new token.json file should appear in your project folder.',
      },
      {
        number: 4,
        title: 'Build the email fetcher',
        description: 'Use the Gmail API to fetch the last 50 unread emails and extract the sender, subject, and plain-text body.',
        code: `# fetcher.py
import base64
from googleapiclient.discovery import build
from auth import get_credentials

def get_gmail_service():
    creds = get_credentials()
    return build("gmail", "v1", credentials=creds)

def get_unread_emails(service, max_results=50):
    results = service.users().messages().list(
        userId="me", labelIds=["INBOX", "UNREAD"], maxResults=max_results
    ).execute()
    messages = results.get("messages", [])

    emails = []
    for msg in messages:
        full = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = full["payload"]["headers"]
        subject = next((h["value"] for h in headers if h["name"] == "Subject"), "(no subject)")
        sender = next((h["value"] for h in headers if h["name"] == "From"), "(unknown)")
        body = extract_body(full["payload"])
        emails.append({"id": msg["id"], "sender": sender, "subject": subject, "body": body})
    return emails

def extract_body(payload):
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain" and "data" in part["body"]:
                return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
    elif "body" in payload and "data" in payload["body"]:
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
    return ""`,
        tip: 'Gmail nests message parts recursively for multipart emails — recurse through "parts" if you need HTML bodies too.',
        verify: 'Run `python -c "from fetcher import get_gmail_service, get_unread_emails; s=get_gmail_service(); print(get_unread_emails(s, 3))"`. You should see a list of up to 3 dictionaries, each with sender, subject, and body fields populated.',
      },
      {
        number: 5,
        title: 'Build the Claude classifier',
        description:
          'Send each email to Claude and ask it to classify the message as URGENT, IMPORTANT, or LOW with a one-sentence reason.',
        code: `# classifier.py
import json
from anthropic import Anthropic

client = Anthropic()  # reads ANTHROPIC_API_KEY from env

def classify_email(email):
    prompt = f"""Classify this email's priority as URGENT, IMPORTANT, or LOW.

From: {email['sender']}
Subject: {email['subject']}
Body: {email['body'][:1500]}

Respond ONLY with JSON: {{"priority": "...", "reason": "..."}}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.content[0].text)`,
        tip: 'Truncate the body to ~1500 characters to keep latency and cost low for triage tasks.',
        verify: 'Test with a sample email: `classify_email({"sender": "boss@co.com", "subject": "URGENT: server down", "body": "Production is down, need help now"})` should return something like `{"priority": "URGENT", "reason": "..."}`.',
      },
      {
        number: 6,
        title: 'Build the label manager',
        description: 'Create the URGENT / IMPORTANT / LOW labels (if missing) and apply the right one to each message.',
        code: `# labels.py
def get_or_create_label(service, name):
    labels = service.users().labels().list(userId="me").execute().get("labels", [])
    for label in labels:
        if label["name"] == name:
            return label["id"]
    created = service.users().labels().create(
        userId="me", body={"name": name, "labelListVisibility": "labelShow", "messageListVisibility": "show"}
    ).execute()
    return created["id"]

def apply_label(service, message_id, label_id):
    service.users().messages().modify(
        userId="me", id=message_id, body={"addLabelIds": [label_id], "removeLabelIds": ["UNREAD"]}
    ).execute()`,
        tip: 'Cache label IDs in a dict at the start of each run so you do not call labels().list() per email.',
        verify: 'After running once, open Gmail in your browser — you should see new labels named URGENT, IMPORTANT, and LOW in the left sidebar, and the triaged emails should no longer show as Unread.',
      },
      {
        number: 7,
        title: 'Build the reply drafter',
        description: 'For URGENT and IMPORTANT emails, ask Claude to draft a context-aware reply and save it as a Gmail draft.',
        code: `# drafter.py
import base64
from email.mime.text import MIMEText

def draft_reply(client, email):
    prompt = f"""Write a short, professional reply to this email.

From: {email['sender']}
Subject: {email['subject']}
Body: {email['body'][:1500]}

Keep it under 120 words. Output only the reply body."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text

def save_draft(service, email, reply_text):
    message = MIMEText(reply_text)
    message["to"] = email["sender"]
    message["subject"] = "Re: " + email["subject"]
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()`,
        tip: 'Always keep AI-generated replies as drafts — never auto-send without a human review step.',
        verify: 'Open Gmail and check the Drafts folder — for any email classified URGENT or IMPORTANT, you should see a new draft reply addressed to the original sender.',
      },
      {
        number: 8,
        title: 'Add a scheduler',
        description: 'Wire everything together in main.py and run it every 30 minutes with the schedule library or a cron job.',
        code: `# main.py
import time
import schedule
from fetcher import get_gmail_service, get_unread_emails
from classifier import classify_email, client
from labels import get_or_create_label, apply_label
from drafter import draft_reply, save_draft

def run_triage():
    service = get_gmail_service()
    emails = get_unread_emails(service)
    print(f"Found {len(emails)} unread emails")

    for email in emails:
        result = classify_email(email)
        label_id = get_or_create_label(service, result["priority"])
        apply_label(service, email["id"], label_id)

        if result["priority"] in ("URGENT", "IMPORTANT"):
            reply = draft_reply(client, email)
            save_draft(service, email, reply)

        print(f"{result['priority']:9} | {email['subject'][:50]} -> {result['reason']}")

if __name__ == "__main__":
    run_triage()
    schedule.every(30).minutes.do(run_triage)
    while True:
        schedule.run_pending()
        time.sleep(30)`,
        tip: 'Run `python main.py` once manually first to complete the OAuth flow before scheduling it as a background job.',
        verify: 'Run `python main.py` — it should print one line per unread email showing its priority and reason, then keep running silently. Press Ctrl+C to stop, then check Gmail to confirm labels and drafts were applied correctly.',
      },
    ],
    testItOut:
      'Send yourself two test emails: one with subject "URGENT: server is down" and a casual one like "Lunch on Friday?". Run `python main.py` once. Within a minute you should see: (1) both emails labeled correctly in Gmail, (2) a draft reply waiting in your Drafts folder for the urgent one, and (3) console output showing the priority and reason for each email.',
    troubleshooting: [
      {
        issue: 'Error 403: access_denied during the OAuth login screen',
        fix: 'Go to Google Cloud Console > APIs & Services > OAuth consent screen > Test users, and add your own Google account email as a test user.',
      },
      {
        issue: 'Error: redirect_uri_mismatch',
        fix: 'Make sure your OAuth client ID was created with Application type "Desktop app", not "Web application" — desktop apps handle redirects automatically.',
      },
      {
        issue: "json.decoder.JSONDecodeError when parsing Claude's classification",
        fix: 'Add "Respond with raw JSON only, no markdown code fences or extra text" to the end of your prompt, and wrap the json.loads() call in a try/except as a safety net.',
      },
      {
        issue: 'google.auth.exceptions.RefreshError: invalid_grant',
        fix: 'Your cached token has expired or been revoked. Delete token.json and re-run the script to redo the OAuth login flow.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Gmail AI Triage Agent (starter)
Run: pip install google-auth google-auth-oauthlib google-api-python-client anthropic schedule
"""
import os, base64, json, time
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from anthropic import Anthropic

SCOPES = ["https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.compose"]
client = Anthropic()

def get_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)

def classify(email):
    prompt = f"""Classify priority as URGENT, IMPORTANT, or LOW.
From: {email['sender']}\\nSubject: {email['subject']}\\nBody: {email['body'][:1500]}
Respond ONLY with JSON: {{"priority": "...", "reason": "..."}}"""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    service = get_service()
    results = service.users().messages().list(userId="me", labelIds=["INBOX", "UNREAD"], maxResults=10).execute()
    for msg in results.get("messages", []):
        full = service.users().messages().get(userId="me", id=msg["id"], format="metadata").execute()
        headers = full["payload"]["headers"]
        subject = next((h["value"] for h in headers if h["name"] == "Subject"), "")
        sender = next((h["value"] for h in headers if h["name"] == "From"), "")
        result = classify({"sender": sender, "subject": subject, "body": subject})
        print(result["priority"], "-", subject)
`,
    resources: [
      { title: 'Gmail API Documentation', url: 'https://developers.google.com/gmail/api' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
      { title: 'Google OAuth 2.0 for Desktop Apps', url: 'https://developers.google.com/identity/protocols/oauth2/native-app' },
    ],
  },
  {
    id: 2,
    title: 'WhatsApp Auto-Reply Bot',
    emoji: '💬',
    department: ['Sales', 'Customer Support'],
    departmentIds: ['sales', 'support'],
    difficulty: 'Beginner',
    description:
      'A WhatsApp bot that receives messages, understands intent, and replies in your personal voice 24/7 using a persona file.',
    whatYouBuild:
      'A webhook-driven Node.js service connected to Twilio WhatsApp that receives every incoming message, feeds it plus your custom "persona" into Claude, and replies automatically — deployed to run around the clock on Railway.',
    whatYouLearn: [
      'Provision a WhatsApp-enabled number with Twilio',
      'Expose a local server to the internet with ngrok',
      'Build an Express webhook endpoint',
      'Engineer a persona file to control tone and voice',
      'Call the Claude API from Node.js',
      'Deploy a 24/7 Node service to Railway',
    ],
    techStack: ['Node.js', 'Twilio', 'Claude API'],
    buildTime: '3 hrs',
    xp: 350,
    popularity: 95,
    prerequisites: ['Basic JavaScript/Node.js', 'Twilio account', 'Personal phone for testing'],
    tags: ['automation', 'messaging', 'whatsapp'],
    session: {
      totalTime: '110 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Connect a WhatsApp number to your computer through Twilio',
        'Have Claude build a webhook server that receives WhatsApp messages',
        'Give your bot a custom "persona" so replies sound like you',
        'Deploy the bot so it runs 24/7 in the cloud',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free Twilio account (twilio.com)',
        'Your phone, to test WhatsApp messages',
        'A free Railway account (railway.app) for deployment',
      ],
      builds: [
        {
          number: 1,
          title: 'Connect your number to WhatsApp',
          time: '20 min',
          description: 'Set up the WhatsApp sandbox and a local tunnel so Twilio can reach your computer while you build.',
          steps: [
            {
              instruction: 'Sign up at twilio.com, go to Messaging > Try it out > Send a WhatsApp message, and follow the prompt to join your sandbox by texting the given code word from your phone to the Twilio number. Copy your Account SID and Auth Token from the dashboard.',
            },
            {
              instruction: 'Install ngrok (ngrok.com/download), then run `ngrok http 3000` in a terminal. Keep this running — you\'ll point Twilio at the https URL it gives you.',
              verify: 'You should see an ngrok session screen with a "Forwarding" line showing a URL like https://abcd1234.ngrok-free.app -> http://localhost:3000.',
            },
          ],
          goFurther: 'Once you\'re happy with the bot, look into a static ngrok domain (or Twilio\'s paid WhatsApp number) so you don\'t have to update the webhook URL every restart.',
        },
        {
          number: 2,
          title: 'Build the webhook server',
          time: '30 min',
          description: 'Have Claude scaffold a Node.js server that Twilio can call every time someone messages your sandbox number.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Set up a new Node.js project for a WhatsApp bot. Install express, twilio, @anthropic-ai/sdk, dotenv, and body-parser.\n\nCreate server.js with an Express app that:\n- Listens on port 3000 (or process.env.PORT)\n- Has a POST /webhook route that Twilio will call when a WhatsApp message arrives\n- Logs the sender and message body to the console\n- Replies with a simple TwiML message saying "Got it!" for now (using twilio\'s MessagingResponse)\n\nAlso create a .env file with placeholders for ANTHROPIC_API_KEY, TWILIO_SID, and TWILIO_AUTH_TOKEN.',
              verify: 'In the Twilio Console, set the Sandbox "When a message comes in" webhook to your ngrok URL + /webhook (e.g. https://abcd1234.ngrok-free.app/webhook). Run `node server.js`, then send a WhatsApp message to the sandbox number — your terminal should log the message, and you should get "Got it!" back on WhatsApp.',
            },
          ],
          goFurther: '🛠️ Ask Claude to log every incoming message to a local JSON file, so you build up a history of conversations over time.',
        },
        {
          number: 3,
          title: 'Give it a persona and connect Claude',
          time: '35 min',
          description: 'This is where the bot starts sounding like you instead of a generic chatbot.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create a persona.txt file describing how I want this WhatsApp bot to reply. Use this as a starting point and adjust the tone/rules to sound like me:\n\n"You are replying to WhatsApp messages on behalf of [your name], a [your role]. Tone: friendly, concise, slightly informal. Keep replies under 50 words. If asked about pricing, say you\'ll send a quote within 24 hours. If asked about availability, say you\'ll check your calendar and get back to them. Never make commitments about exact dates or prices."\n\nThen create responder.js that loads persona.txt as the system prompt and sends the incoming WhatsApp message to Claude (model "claude-sonnet-4-5", max_tokens 200) to generate a reply.\n\nFinally, update server.js to call responder.js and send Claude\'s reply back via TwiML instead of "Got it!".',
              verify: 'Send a WhatsApp message like "Are you free this week?" to the sandbox number. You should get an automatic reply within a few seconds, written in the voice and following the rules from persona.txt.',
            },
          ],
          goFurther: '🛠️ Send three different message types (a greeting, a pricing question, a complaint) and ask Claude to tune persona.txt until all three replies feel right.',
        },
        {
          number: 4,
          title: 'Deploy it so it runs 24/7',
          time: '25 min',
          description: 'Get the bot off your laptop and onto a server that\'s always on.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Help me deploy this WhatsApp bot to Railway. Walk me through:\n1. Initializing a git repo and pushing this project to a new GitHub repo (give me the exact commands)\n2. Connecting that repo to a new Railway project\n3. Which environment variables I need to add in the Railway dashboard\n4. Making sure server.js listens on process.env.PORT so Railway can route to it\n\nGive me a step-by-step checklist I can follow.',
              verify: 'Visit your Railway app\'s public URL in a browser — any response (even a 404) means it\'s live. Update the Twilio sandbox webhook to that URL + /webhook, turn off your local server, and message the sandbox number again — you should still get a reply.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a simple SQLite or JSON-based memory so the bot remembers the last few messages per phone number for multi-turn conversations.',
        },
      ],
      portfolio: 'You just built and deployed a 24/7 WhatsApp bot that replies in your own voice. Take a screenshot of a real conversation with the bot, and add "WhatsApp Auto-Reply Bot" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a WhatsApp bot using Node.js, Twilio, and Claude. It receives incoming WhatsApp messages via a webhook, generates replies in a custom persona/tone using Claude, and runs 24/7 deployed on Railway.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Create a Twilio account and WhatsApp sandbox',
        description: 'Sign up at twilio.com, activate the WhatsApp Sandbox under Messaging, and note your Account SID and Auth Token.',
        code: `# Twilio Console steps:
# 1. console.twilio.com -> Messaging -> Try it out -> Send a WhatsApp message
# 2. Join the sandbox by sending the code word to the Twilio number from your phone
# 3. Copy ACCOUNT_SID and AUTH_TOKEN from the dashboard into a .env file`,
        tip: 'The sandbox is free for development — you only need a real WhatsApp Business number for production.',
        verify: 'Send "join <your-sandbox-code>" to the Twilio sandbox number from WhatsApp on your phone — you should receive a reply confirming you\'ve joined the sandbox.',
      },
      {
        number: 2,
        title: 'Set up ngrok',
        description: 'Install ngrok and expose your local Express server so Twilio can reach your webhook during development.',
        code: `# Install ngrok (https://ngrok.com/download)
ngrok http 3000

# Copy the https forwarding URL, e.g. https://abcd1234.ngrok-free.app
# You'll point Twilio's webhook to: https://abcd1234.ngrok-free.app/webhook`,
        tip: 'ngrok URLs change every restart on the free plan — update the Twilio webhook each time, or grab a static domain.',
        verify: 'Visit the ngrok https URL in your browser — even a "Cannot GET /webhook" error from Express confirms ngrok is correctly forwarding requests to your local server.',
      },
      {
        number: 3,
        title: 'Initialize the Node.js project',
        description: 'Create a new project and install Express, the Twilio SDK, the Anthropic SDK, and dotenv.',
        code: `mkdir whatsapp-agent && cd whatsapp-agent
npm init -y
npm install express twilio @anthropic-ai/sdk dotenv body-parser`,
        tip: 'Add "type": "module" to package.json if you prefer ES module import/export syntax.',
        verify: 'Run `node -e "console.log(require(\'express\'))"` (or `node -e "import(\'express\').then(console.log)"` for ESM) — it should print the Express module without a "Cannot find module" error.',
      },
      {
        number: 4,
        title: 'Build the webhook receiver',
        description: 'Create an Express POST endpoint that Twilio calls whenever a new WhatsApp message arrives.',
        code: `// server.js
import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import { generateReply } from "./responder.js";
import twilioPkg from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const { MessagingResponse } = twilioPkg.twiml;

app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  console.log(\`Message from \${from}: \${incomingMsg}\`);

  const reply = await generateReply(incomingMsg);

  const twiml = new MessagingResponse();
  twiml.message(reply);
  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => console.log("Webhook listening on port 3000"));`,
        tip: 'Twilio expects a TwiML XML response — the MessagingResponse helper builds it for you.',
        verify: 'In the Twilio Console, set the Sandbox "When a message comes in" webhook to your ngrok URL + /webhook, then send a WhatsApp message to the sandbox number. Your terminal should log "Message from whatsapp:+1...: <your message>".',
      },
      {
        number: 5,
        title: 'Build the persona system',
        description: 'Create persona.txt describing your tone, vocabulary, and reply rules so Claude responds the way you would.',
        code: `# persona.txt
You are replying to WhatsApp messages on behalf of Alex, a freelance designer.
Tone: friendly, concise, slightly informal, uses occasional emoji.
Rules:
- Keep replies under 50 words
- If asked about pricing, say "I'll send a quote within 24 hours"
- If asked about availability, say "Let me check my calendar and get back to you"
- Never make commitments about exact dates or prices
- Sign off with "- Alex" only if the message is a new conversation`,
        tip: 'Iterate on this file like a prompt — test edge cases (rude messages, spam, FAQs) and refine the rules.',
        verify: 'Read persona.txt out loud — does it sound like how you\'d actually reply? Adjust the tone and rules until you\'d be comfortable with the bot replying on your behalf unsupervised.',
      },
      {
        number: 6,
        title: 'Build the Claude responder',
        description: 'Load the persona file and send the incoming message to Claude to generate a reply in your voice.',
        code: `// responder.js
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic();
const persona = readFileSync("./persona.txt", "utf-8");

export async function generateReply(message) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: persona,
    messages: [{ role: "user", content: message }],
  });
  return response.content[0].text;
}`,
        tip: 'For multi-turn conversations, store recent messages per phone number in memory or a small database.',
        verify: 'Send a WhatsApp message like "are you available this week?" to the sandbox number — you should receive an automatic reply within a few seconds, written in your persona\'s voice and following its rules.',
      },
      {
        number: 7,
        title: 'Send the reply within Twilio\'s webhook window',
        description: 'Twilio expects a response within 15 seconds — keep the Claude call fast and return TwiML immediately.',
        code: `// Already handled in server.js above via:
// const reply = await generateReply(incomingMsg);
// twiml.message(reply);
// res.type("text/xml").send(twiml.toString());

// If you need longer processing, use the Twilio REST API to send
// an async message instead of replying via TwiML:
import twilio from "twilio";
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

await client.messages.create({
  from: "whatsapp:+14155238886",
  to: from,
  body: reply,
});`,
        tip: 'If Claude responses occasionally take longer, set max_tokens lower (150-200) to stay under the limit.',
        verify: 'Time a few responses end-to-end (message sent to reply received). If they consistently take longer than ~10 seconds, lower max_tokens or switch to the async REST API approach shown above.',
      },
      {
        number: 8,
        title: 'Deploy to Railway',
        description: 'Push your project to GitHub, connect it to Railway, add your environment variables, and deploy for 24/7 uptime.',
        code: `# 1. git init && git add . && git commit -m "Initial WhatsApp bot"
# 2. Push to a new GitHub repo
# 3. railway.app -> New Project -> Deploy from GitHub repo
# 4. Add environment variables in Railway dashboard:
#    ANTHROPIC_API_KEY, TWILIO_SID, TWILIO_AUTH_TOKEN
# 5. Railway gives you a public URL — set that as your Twilio webhook:
#    https://your-app.up.railway.app/webhook`,
        tip: 'Set the start command to "node server.js" in Railway\'s settings, and the listening port to process.env.PORT.',
        verify: 'Visit your Railway app\'s public URL in a browser — your server should respond (even a basic 404 means it\'s alive). Update the Twilio sandbox webhook to that URL and message the sandbox number again to confirm replies still arrive with your local server turned off.',
      },
    ],
    testItOut:
      'From your phone, send three different WhatsApp messages to the sandbox number: a greeting, a question about availability, and a pricing question. You should get three distinct replies — each under 50 words, matching your persona\'s tone, and following its special rules (e.g. deferring on exact pricing or dates).',
    troubleshooting: [
      {
        issue: 'Twilio error 11200 (HTTP retrieval failure)',
        fix: 'Twilio could not reach your webhook URL. Confirm ngrok is still running, copy the current forwarding URL (it changes on restart), and update the Sandbox webhook field.',
      },
      {
        issue: 'No reply received on WhatsApp',
        fix: 'Sandbox sessions expire after about 72 hours of inactivity — re-send "join <your-code>" to the sandbox number to reconnect.',
      },
      {
        issue: "Error: Cannot find module 'twilio' (or '@anthropic-ai/sdk')",
        fix: 'Run `npm install` again from the project root — make sure you\'re in the same directory as package.json.',
      },
      {
        issue: 'App works locally but crashes after deploying to Railway',
        fix: '.env files are not deployed. Add ANTHROPIC_API_KEY, TWILIO_SID, and TWILIO_AUTH_TOKEN as environment variables directly in the Railway dashboard.',
      },
    ],
    starterCode: `// AgentForge Academy — WhatsApp Auto-Reply Bot (starter)
// npm install express twilio @anthropic-ai/sdk dotenv body-parser
import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import twilioPkg from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const { MessagingResponse } = twilioPkg.twiml;
const client = new Anthropic();

const PERSONA = \`You reply to WhatsApp messages in a friendly, concise tone.
Keep replies under 50 words. Never promise exact dates or prices.\`;

app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: PERSONA,
    messages: [{ role: "user", content: incomingMsg }],
  });

  const twiml = new MessagingResponse();
  twiml.message(response.content[0].text);
  res.type("text/xml").send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Webhook listening on port \${PORT}\`));
`,
    resources: [
      { title: 'Twilio WhatsApp Sandbox', url: 'https://www.twilio.com/docs/whatsapp/sandbox' },
      { title: 'Anthropic Node SDK', url: 'https://github.com/anthropics/anthropic-sdk-typescript' },
      { title: 'Railway Deployment Docs', url: 'https://docs.railway.app' },
    ],
  },
  {
    id: 3,
    title: 'Slack Morning Briefing Bot',
    emoji: '☀️',
    department: ['Operations'],
    departmentIds: ['operations'],
    difficulty: 'Beginner',
    description:
      'A bot that runs every morning at 8am, reads your top Slack channels for the past 24 hours, and sends a prioritized briefing to your DM.',
    whatYouBuild:
      'A scheduled Python job that pulls the last 24 hours of messages from your most important Slack channels, asks Claude to summarize them into Urgent / Decisions Needed / FYI sections, and posts that briefing directly to your Slack DM every morning.',
    whatYouLearn: [
      'Create and configure a Slack App with bot scopes',
      'Read channel history with the Slack Web API',
      'Design a multi-section summarization prompt',
      'Post formatted messages to a specific Slack user',
      'Schedule a daily job with cron or a hosting platform',
      'Handle Slack rate limits and pagination',
    ],
    techStack: ['Python', 'Slack API', 'Claude API'],
    buildTime: '2 hrs',
    xp: 250,
    popularity: 88,
    prerequisites: ['Basic Python', 'Slack workspace admin access'],
    tags: ['automation', 'slack', 'productivity'],
    session: {
      totalTime: '70 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Create a Slack app with the right permissions to read channels and send DMs',
        'Have Claude build a script that pulls the last 24 hours of messages from your key channels',
        'Have Claude summarize everything into Urgent / Decisions Needed / FYI sections',
        'Schedule it to DM you a fresh briefing every morning',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A Slack workspace where you have permission to install apps',
        'The channel IDs of 2-3 channels you want summarized',
      ],
      builds: [
        {
          number: 1,
          title: 'Create and connect your Slack app',
          time: '20 min',
          description: 'Slack needs to know your bot exists and what it\'s allowed to do before any code can run.',
          steps: [
            {
              instruction: 'Go to api.slack.com/apps, click "Create New App" > "From scratch", name it (e.g. "Morning Briefing Bot") and pick your workspace. Then go to OAuth & Permissions > Scopes > Bot Token Scopes and add: channels:history, chat:write, users:read, im:write. Click "Install to Workspace" and copy the Bot User OAuth Token (starts with xoxb-).',
            },
            {
              instruction: 'In each Slack channel you want summarized, type `/invite @YourBotName` so the bot can read its history. Then find your own Slack user ID via your profile photo > "Copy member ID".',
              verify: 'You should have a Bot User OAuth Token starting with xoxb-, your own Slack user ID (starts with U), and the bot showing as a member in each target channel.',
            },
          ],
          goFurther: 'Add the groups:history scope too if you want to summarize private channels the bot has been invited to.',
        },
        {
          number: 2,
          title: 'Build the briefing generator',
          time: '30 min',
          description: 'This is the core of the agent — pulling messages and asking Claude to turn them into a briefing.',
          steps: [
            {
              instruction: 'Create a .env file in your project folder with SLACK_BOT_TOKEN, ANTHROPIC_API_KEY, and SLACK_USER_ID, then paste this prompt into Claude:',
              prompt: 'I\'m building a Slack "Morning Briefing" bot in Python. I have a .env file with SLACK_BOT_TOKEN, ANTHROPIC_API_KEY, and SLACK_USER_ID.\n\nPlease create:\n1. A requirements.txt with slack_sdk, anthropic, python-dotenv\n2. slack_reader.py with get_recent_messages(client, channel_id, hours=24) that fetches all messages from the last N hours using conversations.history with pagination, and get_channel_name(client, channel_id)\n3. summarizer.py with summarize_briefing(channel_messages: dict) that combines messages from all channels and asks Claude (model "claude-sonnet-4-5") to produce a briefing with three sections: Urgent, Decisions Needed, and FYI, using Slack-flavored markdown\n4. notifier.py with send_dm(client, user_id, text) that opens a DM with that user and posts the message\n\nInstall the dependencies for me.',
              verify: 'Run `python -c "import os; from dotenv import load_dotenv; from slack_sdk import WebClient; load_dotenv(); print(WebClient(token=os.environ[\'SLACK_BOT_TOKEN\']).auth_test())"` — it should print your bot\'s user ID and team name with no error.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a fourth section, "Wins", that highlights any positive updates or completed tasks from the last 24 hours.',
        },
        {
          number: 3,
          title: 'Wire it together and schedule it',
          time: '20 min',
          description: 'Connect the pieces into one script, then make sure it runs automatically every morning.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now create main.py that ties everything together for my Slack Morning Briefing bot:\n\n- List my channel IDs in a CHANNEL_IDS array near the top (I\'ll fill these in)\n- For each channel, get its name and recent messages using slack_reader.py\n- Pass everything to summarize_briefing() from summarizer.py\n- Add a "*🌅 Morning Briefing — <today\'s date>*" header on top using Slack mrkdwn\n- Send the result as a DM to my user ID using notifier.py\n- Print "Briefing sent!" when done\n\nAlso show me the crontab line to run this every day at 8am, and how I\'d do the same thing using Railway\'s or Render\'s scheduled task feature instead.',
              verify: 'Replace CHANNEL_IDS with your real channel IDs (right-click a channel name > View channel details, scroll to the bottom), then run `python main.py`. Within about 20 seconds you should get a DM titled "Morning Briefing — <today\'s date>" with Urgent / Decisions Needed / FYI sections, and "Briefing sent!" in your console.',
            },
          ],
          goFurther: '🛠️🛠️ Deploy main.py to Railway or Render with a scheduled task so the briefing arrives even when your laptop is off.',
        },
      ],
      portfolio: 'You just built a daily briefing bot that reads your busiest Slack channels and gives you a prioritized summary every morning. Take a screenshot of a real briefing DM, and add "Slack Morning Briefing Bot" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a Slack bot that reads the last 24 hours of messages from my key channels, uses Claude to summarize them into Urgent / Decisions Needed / FYI sections, and DMs me the briefing every morning on a schedule.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Create a Slack App',
        description:
          'Go to api.slack.com/apps, create a new app "from scratch", and add Bot Token Scopes: channels:history, chat:write, users:read.',
        code: `# api.slack.com/apps -> Create New App -> From scratch
# OAuth & Permissions -> Scopes -> Bot Token Scopes:
#   - channels:history
#   - chat:write
#   - users:read
#   - im:write`,
        tip: 'Add groups:history too if you want to summarize private channels the bot is invited to.',
        verify: 'On the "OAuth & Permissions" page, confirm all four scopes (channels:history, chat:write, users:read, im:write) are listed under Bot Token Scopes before installing the app.',
      },
      {
        number: 2,
        title: 'Install the app and store the bot token',
        description: 'Install the app to your workspace, copy the Bot User OAuth Token (starts with xoxb-), and store it in .env.',
        code: `# .env
SLACK_BOT_TOKEN=xoxb-your-token-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
SLACK_USER_ID=U01ABCDEF  # your own Slack user ID for the DM

pip install slack_sdk anthropic python-dotenv`,
        tip: 'Find your Slack user ID via your profile -> "Copy member ID".',
        verify: 'Run `python -c "import os; from dotenv import load_dotenv; from slack_sdk import WebClient; load_dotenv(); print(WebClient(token=os.environ[\'SLACK_BOT_TOKEN\']).auth_test())"` — it should print your bot\'s user ID and team name with no error.',
      },
      {
        number: 3,
        title: 'Build the channel reader',
        description: 'Fetch messages from a list of channel IDs for the last 24 hours using conversations.history.',
        code: `# slack_reader.py
import time
from slack_sdk import WebClient

def get_recent_messages(client: WebClient, channel_id: str, hours: int = 24):
    oldest = time.time() - hours * 3600
    messages = []
    cursor = None

    while True:
        resp = client.conversations_history(channel=channel_id, oldest=oldest, cursor=cursor, limit=200)
        messages.extend(resp["messages"])
        cursor = resp.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break

    return messages

def get_channel_name(client: WebClient, channel_id: str):
    info = client.conversations_info(channel=channel_id)
    return info["channel"]["name"]`,
        tip: 'The bot must be a member of each channel — invite it with /invite @YourBotName.',
        verify: 'Call `get_recent_messages(client, "C0123456")` with one of your real channel IDs — you should get back a non-empty list of message dicts. An empty list usually means the bot hasn\'t been invited to that channel yet.',
      },
      {
        number: 4,
        title: 'Build the Claude summarizer',
        description: 'Combine messages from all channels and ask Claude to produce a prioritized briefing.',
        code: `# summarizer.py
from anthropic import Anthropic

client = Anthropic()

def summarize_briefing(channel_messages: dict):
    transcript = ""
    for channel, messages in channel_messages.items():
        transcript += f"\\n--- #{channel} ---\\n"
        for m in reversed(messages):
            text = m.get("text", "")
            if text:
                transcript += f"- {text}\\n"

    prompt = f"""Here are the last 24 hours of Slack messages across several channels:

{transcript[:12000]}

Summarize this into a Morning Briefing with three sections:
1. Urgent — anything needing immediate attention
2. Decisions Needed — open questions or choices waiting on someone
3. FYI — useful context, no action required

Use Slack-flavored markdown (*, _, bullet points)."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text`,
        tip: 'Truncate the transcript to ~12k characters to stay within reasonable token limits for very busy workspaces.',
        verify: 'Pass a small dict of sample messages to `summarize_briefing` — Claude\'s response should contain the three headers: "Urgent", "Decisions Needed", and "FYI".',
      },
      {
        number: 5,
        title: 'Format the output',
        description: 'Wrap the summary with a date header so the DM is easy to scan each morning.',
        code: `# formatter.py
from datetime import date

def format_briefing(summary: str):
    today = date.today().strftime("%A, %B %d")
    return f"*🌅 Morning Briefing — {today}*\\n\\n{summary}"`,
        tip: 'Slack mrkdwn uses single asterisks for bold, not double — Claude usually gets this right if you mention "Slack-flavored markdown".',
        verify: 'Call `format_briefing("test summary")` — the output should start with "*🌅 Morning Briefing — <Today\'s Date>*" followed by your summary text.',
      },
      {
        number: 6,
        title: 'Send the DM via Slack API',
        description: 'Open (or reuse) a DM channel with your user ID and post the formatted briefing.',
        code: `# notifier.py
def send_dm(client, user_id: str, text: str):
    dm = client.conversations_open(users=[user_id])
    channel_id = dm["channel"]["id"]
    client.chat_postMessage(channel=channel_id, text=text, mrkdwn=True)`,
        tip: 'conversations_open is idempotent — calling it repeatedly just returns the existing DM channel.',
        verify: 'Run `send_dm(client, "YOUR_USER_ID", "Test message")` — check Slack, you should receive a DM from your bot saying "Test message".',
      },
      {
        number: 7,
        title: 'Schedule with cron',
        description: 'Wire it all together in main.py and schedule it to run every morning at 8am.',
        code: `# main.py
import os
from dotenv import load_dotenv
from slack_sdk import WebClient
from slack_reader import get_recent_messages, get_channel_name
from summarizer import summarize_briefing
from formatter import format_briefing
from notifier import send_dm

load_dotenv()
CHANNEL_IDS = ["C0123456", "C0234567", "C0345678"]  # your top channels

def main():
    client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])
    channel_messages = {}
    for ch_id in CHANNEL_IDS:
        name = get_channel_name(client, ch_id)
        channel_messages[name] = get_recent_messages(client, ch_id)

    summary = summarize_briefing(channel_messages)
    briefing = format_briefing(summary)
    send_dm(client, os.environ["SLACK_USER_ID"], briefing)
    print("Briefing sent!")

if __name__ == "__main__":
    main()

# Crontab entry (runs at 8:00am every day):
# 0 8 * * * /path/to/venv/bin/python /path/to/main.py`,
        tip: 'On Render or Railway, use their "Cron Job" or "Scheduled Task" feature instead of crontab for managed hosting.',
        verify: 'Run `python main.py` manually once — within 10-20 seconds you should receive a full morning briefing DM covering all configured channels, ending with "Briefing sent!" in the console.',
      },
    ],
    testItOut:
      'Post a few varied messages in your test channels (a question, a decision, and an FYI-style update), then run `python main.py`. Within about 20 seconds you should receive a DM from your bot titled "Morning Briefing — <today\'s date>" that organizes those messages into the three sections: Urgent, Decisions Needed, and FYI.',
    troubleshooting: [
      {
        issue: 'slack_sdk.errors.SlackApiError: not_in_channel',
        fix: 'Invite the bot to each channel you want summarized by typing `/invite @YourBotName` in that channel.',
      },
      {
        issue: 'slack_sdk.errors.SlackApiError: missing_scope',
        fix: 'Go back to "OAuth & Permissions" in your Slack app settings, add the missing scope to Bot Token Scopes, then reinstall the app to your workspace to apply the change.',
      },
      {
        issue: 'Briefing arrives but is empty or says "no messages found"',
        fix: 'Double-check your CHANNEL_IDS — right-click a channel name > View channel details, and scroll to the bottom to find its ID (starts with C). Also confirm messages were actually posted in the last 24 hours.',
      },
      {
        issue: 'The cron job never seems to run',
        fix: 'Crontab uses an absolute path to your venv\'s Python — run the exact command from your crontab entry manually in a terminal first to confirm it works before scheduling it.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Slack Morning Briefing Bot (starter)
pip install slack_sdk anthropic python-dotenv
"""
import os, time
from datetime import date
from dotenv import load_dotenv
from slack_sdk import WebClient
from anthropic import Anthropic

load_dotenv()
slack = WebClient(token=os.environ["SLACK_BOT_TOKEN"])
claude = Anthropic()
CHANNEL_IDS = ["C0123456", "C0234567"]

def fetch_messages(channel_id, hours=24):
    oldest = time.time() - hours * 3600
    resp = slack.conversations_history(channel=channel_id, oldest=oldest, limit=200)
    return [m.get("text", "") for m in resp["messages"] if m.get("text")]

def main():
    transcript = ""
    for ch in CHANNEL_IDS:
        msgs = fetch_messages(ch)
        transcript += f"\\n--- {ch} ---\\n" + "\\n".join(msgs)

    prompt = f"""Summarize these Slack messages into Urgent / Decisions Needed / FYI:\\n{transcript[:12000]}"""
    resp = claude.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])

    today = date.today().strftime("%A, %B %d")
    text = f"*Morning Briefing — {today}*\\n\\n{resp.content[0].text}"

    dm = slack.conversations_open(users=[os.environ["SLACK_USER_ID"]])
    slack.chat_postMessage(channel=dm["channel"]["id"], text=text)

if __name__ == "__main__":
    main()
`,
    resources: [
      { title: 'Slack Web API', url: 'https://api.slack.com/web' },
      { title: 'Slack Bot Token Scopes', url: 'https://api.slack.com/scopes' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 4,
    title: 'Daily News & Industry Summary Agent',
    emoji: '📰',
    department: ['Executive / Strategy'],
    departmentIds: ['strategy'],
    difficulty: 'Beginner',
    description:
      'Pulls top news from your industry every morning, summarizes key stories with Claude, and emails you a 5-minute briefing.',
    whatYouBuild:
      'A Python script that queries NewsAPI for keywords relevant to your industry, deduplicates and ranks the results, asks Claude to write an executive summary, and sends it to your inbox as a clean HTML email each morning.',
    whatYouLearn: [
      'Call a REST API (NewsAPI) with requests',
      'Filter, deduplicate, and rank articles',
      'Write executive-summary prompts for Claude',
      'Build an HTML email template',
      'Send email via SMTP or a transactional email API',
      'Automate the whole pipeline as a daily script',
    ],
    techStack: ['Python', 'NewsAPI', 'Claude API'],
    buildTime: '1.5 hrs',
    xp: 200,
    popularity: 80,
    prerequisites: ['Basic Python', 'NewsAPI free account', 'Email account for sending'],
    tags: ['automation', 'news', 'briefing'],
    session: {
      totalTime: '60 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Pull fresh news articles for your industry from NewsAPI',
        'Have Claude write a 5-minute executive briefing from those articles',
        'Get that briefing delivered as a clean HTML email every morning',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free NewsAPI account (newsapi.org/register)',
        'An email account you can send from (e.g. Gmail with an App Password)',
      ],
      builds: [
        {
          number: 1,
          title: 'Get your news feed working',
          time: '20 min',
          description: 'Set up your API keys and have Claude build the fetcher that pulls today\'s articles.',
          steps: [
            {
              instruction: 'Register for a free key at newsapi.org/register, then create a .env file in your project folder with NEWS_API_KEY, ANTHROPIC_API_KEY, SMTP_USER, and SMTP_PASS (use a Gmail "App Password" if sending from Gmail with 2FA).',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a daily news briefing agent in Python. I have a .env file with NEWS_API_KEY, ANTHROPIC_API_KEY, SMTP_USER, and SMTP_PASS.\n\nPlease create:\n1. A requirements.txt with requests, anthropic, markdown2, python-dotenv\n2. topics.py with a TOPICS list containing 3-5 keywords relevant to my industry (ask me what industry I\'m in, or use ["artificial intelligence", "enterprise software", "cloud computing"] as a default)\n3. fetcher.py with fetch_articles(topic, page_size=10) that calls NewsAPI\'s /everything endpoint, sorted by publishedAt\n4. ranker.py with dedupe_and_rank(articles_by_topic, limit=15) that removes duplicate titles and filters out "[Removed]" stub articles, sorted by most recent\n\nInstall the dependencies for me.',
              verify: 'Run `python -c "from fetcher import fetch_articles; print(len(fetch_articles(\'artificial intelligence\')))"` — it should print a number greater than 0 with no errors.',
            },
          ],
          goFurther: 'Ask Claude to add a "trending score" that weighs articles by how many of your topics they appear under.',
        },
        {
          number: 2,
          title: 'Turn headlines into a briefing',
          time: '20 min',
          description: 'This is where Claude becomes your morning analyst.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create summarizer.py with a summarize(articles: list) function. It should build a bulleted list of "[topic] title — description (source)" for each article, then ask Claude (model "claude-sonnet-4-5", max_tokens 1200) to write a 5-minute executive briefing: group related stories, drop anything trivial, and write 5-8 short paragraphs, each starting with a bold one-line headline summary followed by 1-2 sentences of context. Ask Claude to output Markdown.',
              verify: 'Run a quick test with a handful of articles from Build 1 — `summarize(top_articles)` should return readable Markdown text with bold headline-style openers for each paragraph.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a one-sentence "Why this matters to you" line at the end of each paragraph, tailored to your role.',
        },
        {
          number: 3,
          title: 'Email it to yourself every morning',
          time: '20 min',
          description: 'Wrap the briefing in a nice HTML email and wire up the daily send.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now create:\n1. email_template.py with build_html(summary_md) that converts the Markdown briefing to HTML using markdown2, wraps it in a simple styled template with a "📰 Your Daily Industry Briefing" header and today\'s date, and a small footer\n2. mailer.py with send_email(to_email, subject, html_body) using smtplib over SMTP_SSL (smtp.gmail.com:465) with SMTP_USER/SMTP_PASS from .env\n3. main.py that ties everything together: fetch articles for each topic, dedupe/rank them, summarize with Claude, build the HTML, and email it to me\n\nAlso show me the crontab line to run main.py every day at 6:30am.',
              verify: 'Run `python main.py` — it should print "Briefing sent!" and within a minute or two you should receive an HTML email titled "Your Daily Industry Briefing" with today\'s date and a handful of summarized stories.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to deploy main.py as a scheduled task on Railway or Render so the email arrives even when your laptop is off.',
        },
      ],
      portfolio: 'You just built an automated news analyst that reads the day\'s headlines and writes you a briefing before you\'ve had coffee. Take a screenshot of the email you received, and add "Daily News & Industry Summary Agent" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a daily news briefing agent in Python that pulls articles from NewsAPI for my industry, uses Claude to write a 5-minute executive summary, and emails it to me as HTML every morning on a schedule.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Get a NewsAPI key',
        description: 'Register for a free account at newsapi.org — the free tier provides 100 requests per day, plenty for a daily job.',
        code: `# 1. Go to https://newsapi.org/register
# 2. Confirm your email and copy your API key
# 3. Store it in .env:
NEWS_API_KEY=your_newsapi_key
ANTHROPIC_API_KEY=sk-ant-your-key
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password`,
        tip: 'Use a Gmail "App Password" (not your normal password) if sending via Gmail SMTP with 2FA enabled.',
      },
      {
        number: 2,
        title: 'Define your topics',
        description: 'List the keywords and phrases relevant to your industry or role.',
        code: `# topics.py
TOPICS = [
    "artificial intelligence",
    "enterprise software",
    "cloud computing",
    "cybersecurity",
]`,
        tip: 'Keep the list to 3-5 topics — too many dilutes relevance and burns through your API quota faster.',
      },
      {
        number: 3,
        title: 'Build the news fetcher',
        description: 'Call the NewsAPI /everything endpoint for each topic, sorted by publish date.',
        code: `# fetcher.py
import os
import requests

def fetch_articles(topic: str, page_size: int = 10):
    resp = requests.get(
        "https://newsapi.org/v2/everything",
        params={
            "q": topic,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "apiKey": os.environ["NEWS_API_KEY"],
        },
    )
    resp.raise_for_status()
    return resp.json().get("articles", [])`,
        tip: 'NewsAPI free tier only returns articles up to 24 hours old for the /everything endpoint — perfect for a daily digest.',
      },
      {
        number: 4,
        title: 'Filter and rank articles',
        description: 'Remove duplicate headlines across topics and keep the most recent, highest-quality sources.',
        code: `# ranker.py
def dedupe_and_rank(articles_by_topic: dict, limit: int = 15):
    seen_titles = set()
    combined = []

    for topic, articles in articles_by_topic.items():
        for a in articles:
            title = a.get("title", "")
            if not title or title in seen_titles:
                continue
            seen_titles.add(title)
            combined.append({"topic": topic, **a})

    # Most recent first
    combined.sort(key=lambda a: a.get("publishedAt", ""), reverse=True)
    return combined[:limit]`,
        tip: 'Filter out articles where source.name is "[Removed]" — NewsAPI sometimes returns stub entries for delisted stories.',
      },
      {
        number: 5,
        title: 'Build the Claude summarizer',
        description: 'Send headlines and snippets to Claude and request a 5-minute executive briefing.',
        code: `# summarizer.py
from anthropic import Anthropic

client = Anthropic()

def summarize(articles: list):
    bullet_list = "\\n".join(
        f"- [{a['topic']}] {a['title']} — {a.get('description', '')} ({a['source']['name']})"
        for a in articles
    )

    prompt = f"""You are writing a 5-minute executive news briefing from these articles:

{bullet_list}

Group related stories, drop anything trivial, and write 5-8 short paragraphs.
Each paragraph should start with a bold one-line headline summary, followed by 1-2 sentences of context."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text`,
        tip: 'Ask Claude to output Markdown — it converts cleanly to HTML with a library like markdown2.',
      },
      {
        number: 6,
        title: 'Format as email HTML',
        description: 'Convert the Markdown summary into a clean HTML email template.',
        code: `# email_template.py
import markdown2
from datetime import date

def build_html(summary_md: str):
    body_html = markdown2.markdown(summary_md)
    today = date.today().strftime("%A, %B %d, %Y")
    return f"""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>📰 Your Daily Industry Briefing</h2>
      <p style="color:#666;">{today}</p>
      <div>{body_html}</div>
      <hr/>
      <p style="font-size:12px;color:#999;">Generated automatically by AgentForge Academy</p>
    </body></html>
    """`,
        tip: 'pip install markdown2 — it is more forgiving with edge cases than the base "markdown" package.',
      },
      {
        number: 7,
        title: 'Send via Gmail SMTP or SendGrid',
        description: 'Send the finished HTML email using Python\'s smtplib (or swap in SendGrid for higher volume).',
        code: `# mailer.py
import os, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_email(to_email: str, subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = os.environ["SMTP_USER"]
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        server.sendmail(os.environ["SMTP_USER"], to_email, msg.as_string())

# main.py
if __name__ == "__main__":
    from topics import TOPICS
    from fetcher import fetch_articles
    from ranker import dedupe_and_rank
    from summarizer import summarize
    from email_template import build_html

    articles_by_topic = {t: fetch_articles(t) for t in TOPICS}
    top_articles = dedupe_and_rank(articles_by_topic)
    summary = summarize(top_articles)
    html = build_html(summary)
    send_email("you@example.com", "Your Daily Industry Briefing", html)
    print("Briefing sent!")`,
        tip: 'Schedule main.py with cron at 6:30am so the email lands before your workday starts.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Daily News & Industry Summary Agent (starter)
pip install requests anthropic markdown2 python-dotenv
"""
import os
import requests
from anthropic import Anthropic

claude = Anthropic()
TOPICS = ["artificial intelligence", "enterprise software", "cloud computing"]

def fetch_articles(topic):
    resp = requests.get("https://newsapi.org/v2/everything", params={
        "q": topic, "language": "en", "sortBy": "publishedAt",
        "pageSize": 5, "apiKey": os.environ["NEWS_API_KEY"],
    })
    return resp.json().get("articles", [])

def main():
    all_articles = []
    for topic in TOPICS:
        for a in fetch_articles(topic):
            all_articles.append(f"[{topic}] {a['title']} — {a.get('description','')}")

    prompt = "Summarize these into a short executive news briefing:\\n" + "\\n".join(all_articles)
    resp = claude.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    print(resp.content[0].text)

if __name__ == "__main__":
    main()
`,
    resources: [
      { title: 'NewsAPI Documentation', url: 'https://newsapi.org/docs' },
      { title: 'Python smtplib', url: 'https://docs.python.org/3/library/smtplib.html' },
      { title: 'SendGrid API', url: 'https://docs.sendgrid.com' },
    ],
  },
  {
    id: 5,
    title: 'Meeting Notes Formatter Agent',
    emoji: '📝',
    department: ['Operations'],
    departmentIds: ['operations'],
    difficulty: 'Beginner',
    description:
      'Paste a raw meeting transcript or bullet points and get back professional meeting notes with decisions, action items, owners, and deadlines.',
    whatYouBuild:
      'A CLI tool that accepts raw notes (from a file, clipboard, or stdin), sends them to Claude with a structured-formatting prompt, and outputs polished Markdown meeting notes — optionally pushing the result straight into a new Google Doc.',
    whatYouLearn: [
      'Build flexible CLI input handling with argparse',
      'Engineer prompts that extract structured sections from messy text',
      'Produce clean, consistent Markdown output',
      'Authenticate with the Google Docs API',
      'Create and populate a Google Doc programmatically',
      'Validate output quality across varied inputs',
    ],
    techStack: ['Python', 'Claude API', 'Google Docs API'],
    buildTime: '2 hrs',
    xp: 280,
    popularity: 75,
    prerequisites: ['Basic Python', 'Google Cloud account (optional, for Docs export)'],
    tags: ['productivity', 'meetings', 'documentation'],
    session: {
      totalTime: '60 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Have Claude build a tool that turns messy meeting notes into structured minutes',
        'Accept input from a file, clipboard, or pasted text',
        'Automatically save every set of notes with Attendees, Decisions, and Action Items',
        '(Optional) Push the finished notes straight into a new Google Doc',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A raw meeting transcript or messy bullet-point notes to test with',
        '(Optional) A Google Cloud account if you want the Google Docs export',
      ],
      builds: [
        {
          number: 1,
          title: 'Build the core formatter',
          time: '20 min',
          description: 'This is the heart of the tool — turning chaos into clean, structured minutes.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a "Meeting Notes Formatter" CLI tool in Python.\n\nPlease create:\n1. A requirements.txt with anthropic and pyperclip\n2. formatter.py with format_notes(raw_notes: str) that sends the notes to Claude (model "claude-sonnet-4-5", max_tokens 1500) with a prompt asking it to convert raw notes into structured Markdown minutes with these exact sections: ## Attendees, ## Agenda, ## Key Discussions, ## Decisions Made, ## Action Items (as a table with columns Task | Owner | Deadline), ## Next Meeting. If info for a section is missing, the prompt should tell Claude to write "Not specified" rather than inventing details.\n3. A test_inputs folder with three sample files: standup.txt (a short standup with a couple of decisions), planning.txt (a longer multi-topic transcript), and messy_bullets.txt (rough unstructured bullet points)\n\nInstall the dependencies for me.',
              verify: 'Run a quick test: `python -c "from formatter import format_notes; print(format_notes(open(\'test_inputs/messy_bullets.txt\').read()))"`. You should get back Markdown with all six section headers, and the Action Items section formatted as a table.',
            },
          ],
          goFurther: '🛠️ If the Action Items table comes out malformed for messy input, ask Claude to tighten the prompt with an explicit Markdown table example.',
        },
        {
          number: 2,
          title: 'Build the CLI and save output',
          time: '20 min',
          description: 'Wrap the formatter in a command-line tool that\'s easy to run on any transcript.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now create:\n1. input_handler.py with get_input_text(file_path=None, use_clipboard=False) that reads from a file path, the clipboard (via pyperclip), or stdin\n2. output.py with save_markdown(content, prefix="meeting_notes") that saves the formatted notes to a timestamped .md file inside a /notes folder (creating it if needed)\n3. main.py using argparse with --input (file path), --clipboard (flag), and --export-docs (flag, for later). It should read the input, call format_notes(), save the result, print the saved filename, and print the formatted notes to the console.',
              verify: 'Run `python main.py --input test_inputs/standup.txt`. You should see the formatted minutes printed to your console, and a new timestamped file inside a /notes folder containing the same content.',
            },
          ],
          goFurther: 'Run all three test files (standup, planning, messy_bullets) and compare the output quality — ask Claude to tweak the prompt if any section feels weak.',
        },
        {
          number: 3,
          title: 'Add Google Docs export (optional)',
          time: '20 min',
          description: 'Send your polished notes straight into a shareable Google Doc.',
          steps: [
            {
              instruction: 'If you completed Agent #1 (Gmail AI Triage Agent), you already have an auth.py OAuth helper. If not, follow Build 1 of that session first to set up Google Cloud credentials, and add the scope "https://www.googleapis.com/auth/documents" to auth.py\'s SCOPES list.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create docs_export.py with export_to_google_docs(title, content) that uses the Google Docs API to create a new Google Doc with the given title, inserts `content` as plain text at the top, and returns the doc\'s edit URL. Reuse the get_credentials() function from auth.py.\n\nThen update main.py so that when --export-docs is passed, it calls export_to_google_docs() with the formatted notes and prints the returned URL.',
              verify: 'Run `python main.py --input test_inputs/standup.txt --export-docs`. A browser may open for Google auth the first time. You should get a Google Docs URL printed — open it and confirm your formatted meeting notes are inside.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to convert the Markdown headers and tables into real Google Docs formatting (headings, bold text, actual tables) using the Docs API\'s batchUpdate requests instead of plain text.',
        },
      ],
      portfolio: 'You just built a tool that turns messy meeting notes into polished, shareable minutes in seconds. Run it on a real transcript, take a screenshot of the formatted output, and add "Meeting Notes Formatter Agent" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a Python CLI tool that takes raw or messy meeting notes (from a file, clipboard, or transcript) and uses Claude to turn them into structured minutes with Attendees, Decisions Made, and an Action Items table — optionally exporting straight to Google Docs.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up the project',
        description: 'Install the Anthropic SDK and (optionally) the Google API client for Docs export.',
        code: `pip install anthropic google-auth google-auth-oauthlib google-api-python-client`,
        tip: 'You can build and test the formatter entirely without Google Docs — add that integration last as a stretch goal.',
      },
      {
        number: 2,
        title: 'Build the input handler',
        description: 'Accept input from a file path, the system clipboard, or stdin so the tool fits any workflow.',
        code: `# input_handler.py
import sys
import pyperclip  # pip install pyperclip

def get_input_text(file_path: str = None, use_clipboard: bool = False) -> str:
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    if use_clipboard:
        return pyperclip.paste()
    return sys.stdin.read()`,
        tip: 'On Linux, pyperclip needs xclip or xsel installed (apt install xclip).',
      },
      {
        number: 3,
        title: 'Build the Claude formatter',
        description:
          'Write a structured prompt that extracts Attendees, Agenda, Key Discussions, Decisions Made, Action Items (with owner + deadline), and Next Meeting.',
        code: `# formatter.py
from anthropic import Anthropic

client = Anthropic()

PROMPT_TEMPLATE = """You are an executive assistant. Convert the following raw meeting notes
into structured, professional meeting minutes using this exact Markdown structure:

## Attendees
## Agenda
## Key Discussions
## Decisions Made
## Action Items
(table with columns: Task | Owner | Deadline)
## Next Meeting

If information for a section is missing, write "Not specified" rather than inventing details.

RAW NOTES:
{raw_notes}
"""

def format_notes(raw_notes: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(raw_notes=raw_notes)}],
    )
    return response.content[0].text`,
        tip: 'Explicitly telling Claude to write "Not specified" prevents hallucinated owners or deadlines.',
      },
      {
        number: 4,
        title: 'Build the output formatter',
        description: 'Save the Markdown output to a timestamped file for easy archiving.',
        code: `# output.py
from datetime import datetime

def save_markdown(content: str, prefix: str = "meeting_notes") -> str:
    filename = f"{prefix}_{datetime.now().strftime('%Y-%m-%d_%H%M')}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    return filename`,
        tip: 'Store all generated notes in a /notes folder so they are easy to search later.',
      },
      {
        number: 5,
        title: 'Google Docs integration (optional)',
        description: 'Create a new Google Doc and paste the formatted notes into it using the Docs API.',
        code: `# docs_export.py
from googleapiclient.discovery import build
from auth import get_credentials  # reuse OAuth helper from Agent #1

def export_to_google_docs(title: str, content: str):
    creds = get_credentials()
    docs = build("docs", "v1", credentials=creds)

    doc = docs.documents().create(body={"title": title}).execute()
    doc_id = doc["documentId"]

    docs.documents().batchUpdate(
        documentId=doc_id,
        body={"requests": [{"insertText": {"location": {"index": 1}, "text": content}}]},
    ).execute()

    return f"https://docs.google.com/document/d/{doc_id}/edit"`,
        tip: 'Add the "https://www.googleapis.com/auth/documents" scope to your OAuth credentials for this to work.',
      },
      {
        number: 6,
        title: 'Build the CLI tool',
        description: 'Use argparse so users can run `python main.py --input transcript.txt` or `--clipboard`.',
        code: `# main.py
import argparse
from input_handler import get_input_text
from formatter import format_notes
from output import save_markdown
from docs_export import export_to_google_docs

def main():
    parser = argparse.ArgumentParser(description="Format raw meeting notes into structured minutes")
    parser.add_argument("--input", help="Path to a text file with raw notes")
    parser.add_argument("--clipboard", action="store_true", help="Read raw notes from clipboard")
    parser.add_argument("--export-docs", action="store_true", help="Also export to Google Docs")
    args = parser.parse_args()

    raw_notes = get_input_text(file_path=args.input, use_clipboard=args.clipboard)
    formatted = format_notes(raw_notes)
    filename = save_markdown(formatted)
    print(f"Saved to {filename}\\n")
    print(formatted)

    if args.export_docs:
        url = export_to_google_docs("Meeting Notes", formatted)
        print(f"\\nGoogle Doc: {url}")

if __name__ == "__main__":
    main()`,
        tip: 'Run `python main.py --input transcript.txt` first — the clipboard and Docs export are nice-to-haves.',
      },
      {
        number: 7,
        title: 'Test with three different transcripts',
        description: 'Run the tool on a short standup, a long planning meeting, and a messy bullet-point dump to verify quality.',
        code: `# test_inputs/standup.txt
# Quick sync. Sarah finished the API integration. Tom blocked on design assets,
# needs them by Thursday from Maria. Decided to push release to next Monday.

# test_inputs/planning.txt
# (paste a longer, multi-topic transcript here)

# test_inputs/messy_bullets.txt
# - sarah api done
# - tom blocked - needs design from maria thurs
# - release -> monday
# - next mtg tues 10am

# Run:
# python main.py --input test_inputs/standup.txt
# python main.py --input test_inputs/planning.txt
# python main.py --input test_inputs/messy_bullets.txt`,
        tip: 'If the action items table comes out malformed for messy input, tighten the prompt with an explicit Markdown table example.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Meeting Notes Formatter Agent (starter)
pip install anthropic
"""
import sys
from anthropic import Anthropic

client = Anthropic()

PROMPT = """Convert these raw meeting notes into structured Markdown minutes with sections:
## Attendees
## Agenda
## Key Discussions
## Decisions Made
## Action Items (table: Task | Owner | Deadline)
## Next Meeting

Write "Not specified" if information is missing.

RAW NOTES:
{notes}
"""

def format_notes(raw_notes: str) -> str:
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        messages=[{"role": "user", "content": PROMPT.format(notes=raw_notes)}],
    )
    return resp.content[0].text

if __name__ == "__main__":
    raw = sys.stdin.read()
    print(format_notes(raw))
`,
    resources: [
      { title: 'Google Docs API', url: 'https://developers.google.com/docs/api' },
      { title: 'argparse Documentation', url: 'https://docs.python.org/3/library/argparse.html' },
      { title: 'pyperclip', url: 'https://pypi.org/project/pyperclip/' },
    ],
  },
  {
    id: 6,
    title: 'Simple FAQ Chatbot',
    emoji: '🤖',
    department: ['Customer Support'],
    departmentIds: ['support'],
    difficulty: 'Beginner',
    description:
      'A web-based chatbot that answers questions from a custom FAQ document you provide — embeddable on any website.',
    whatYouBuild:
      'A Streamlit chat app that loads your FAQ document into Claude\'s system prompt, maintains multi-turn conversation history, gracefully escalates when it does not know an answer, and deploys for free to Streamlit Cloud.',
    whatYouLearn: [
      'Structure an FAQ document for use as LLM context',
      'Build multi-turn conversations with Claude',
      'Build a chat UI with Streamlit session state',
      'Design graceful "I don\'t know" fallback behavior',
      'Deploy a Python web app for free',
      'Manage API secrets in a hosted environment',
    ],
    techStack: ['Python', 'Claude API', 'Streamlit'],
    buildTime: '2 hrs',
    xp: 250,
    popularity: 90,
    prerequisites: ['Basic Python', 'Streamlit Cloud account (free)'],
    tags: ['chatbot', 'support', 'rag-lite'],
    session: {
      totalTime: '70 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Turn your FAQ into a knowledge base Claude can answer from',
        'Have Claude build a multi-turn chat UI with Streamlit',
        'Add a graceful "I don\'t know, let me connect you to a human" fallback',
        'Deploy your chatbot live on the web for free',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        '20-30 common questions and answers for your business (or use placeholders to start)',
        'A free Streamlit Cloud account (share.streamlit.io) and GitHub account for deployment',
      ],
      builds: [
        {
          number: 1,
          title: 'Write your FAQ and build the brain',
          time: '20 min',
          description: 'Everything starts with good source material — then Claude wires it into a prompt.',
          steps: [
            {
              instruction: 'Write 20-30 question/answer pairs covering your most common support topics. Save them as faq.json — a simple list of objects like `{ "question": "...", "answer": "..." }`. If you don\'t have real FAQs yet, write placeholders for a fictional business so you can test the flow.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a Streamlit FAQ chatbot in Python. I have a faq.json file with question/answer pairs.\n\nPlease create:\n1. A requirements.txt with streamlit and anthropic\n2. context.py with build_system_prompt(faq_path="faq.json") that loads the FAQ and returns a system prompt telling Claude to answer ONLY using that FAQ knowledge base, and if the answer isn\'t in the FAQ, to say it doesn\'t have that information and offer to connect the user with a human agent\n3. responder.py with get_response(system_prompt, history) that sends the conversation history plus the system prompt to Claude (model "claude-sonnet-4-5", max_tokens 400) and returns the reply\n\nInstall the dependencies for me.',
              verify: 'Run `python -c "from context import build_system_prompt; print(build_system_prompt()[:300])"` — it should print the start of a system prompt that includes a couple of your real Q&A pairs.',
            },
          ],
          goFurther: 'Add a "category" field to each FAQ entry and ask Claude to group related questions together in the system prompt — this helps with larger FAQs.',
        },
        {
          number: 2,
          title: 'Build the chat interface',
          time: '25 min',
          description: 'Turn your responder into something people can actually talk to.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create app.py — a Streamlit chat app that:\n- Sets the page title to "FAQ Assistant" with a 🤖 icon\n- Initializes st.session_state.messages as an empty list if not present\n- Builds the system prompt once using context.py\n- Renders the conversation history using st.chat_message\n- Uses st.chat_input to accept new questions\n- On each new message, calls responder.py\'s get_response() with the full history and renders the reply\n- Caps the stored history to the last 20 messages to keep things fast',
              verify: 'Run `streamlit run app.py`, ask it a question that IS in your faq.json, and confirm it answers correctly using that info. Then ask something totally unrelated and confirm it admits it doesn\'t know.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a sidebar showing example questions users can click to ask instantly.',
        },
        {
          number: 3,
          title: 'Add a human handoff and deploy',
          time: '25 min',
          description: 'Make sure no question falls through the cracks, then put it online.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Update app.py so that after each assistant reply, it checks if the reply contains phrases like "don\'t have that information" or "connect you with a human". If so, show an st.info box that says "Need more help?" with a button labeled "📧 Email our support team" that displays a mailto link to support@example.com (use my real support email if I give you one).',
              verify: 'Ask the chatbot something not in your FAQ — you should see the normal "I don\'t know" reply, followed by the "Need more help?" box with an email button.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Walk me through deploying this Streamlit app to share.streamlit.io for free:\n1. The exact git commands to push this project (app.py, faq.json, context.py, responder.py, requirements.txt) to a new GitHub repo\n2. How to create a new app on Streamlit Cloud pointed at app.py\n3. How to add ANTHROPIC_API_KEY as a Streamlit secret, and the one line of code I need in app.py to read it from st.secrets',
              verify: 'Visit your live Streamlit Cloud URL and chat with the deployed bot — it should respond the same way it did locally (note: the first load after inactivity can take ~30 seconds on the free tier).',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to log every escalated (unanswered) question to a file — review it weekly to find gaps in your FAQ.',
        },
      ],
      portfolio: 'You just built and deployed a live FAQ chatbot that anyone can talk to. Share the live Streamlit URL, take a screenshot of a conversation, and add "Simple FAQ Chatbot" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built and deployed a Streamlit-based FAQ chatbot that answers customer questions using Claude and a custom knowledge base, with multi-turn conversation memory and a human-handoff fallback for unanswered questions.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Prepare your FAQ',
        description: 'Write 20-30 question/answer pairs covering your most common support topics in a structured JSON file.',
        code: `// faq.json
[
  { "question": "What are your business hours?", "answer": "We're open Monday-Friday, 9am-6pm EST." },
  { "question": "How do I reset my password?", "answer": "Go to Settings > Security > Reset Password and follow the email link." },
  { "question": "Do you offer refunds?", "answer": "Yes, within 30 days of purchase with a valid receipt." }
]`,
        tip: 'Group related Q&As by topic with a "category" field — it helps Claude find relevant context faster for large FAQs.',
      },
      {
        number: 2,
        title: 'Build the context builder',
        description: 'Load the FAQ into a system prompt with clear formatting so Claude treats it as the source of truth.',
        code: `# context.py
import json

def build_system_prompt(faq_path: str = "faq.json") -> str:
    with open(faq_path, "r", encoding="utf-8") as f:
        faq = json.load(f)

    faq_text = "\\n\\n".join(f"Q: {item['question']}\\nA: {item['answer']}" for item in faq)

    return f"""You are a helpful customer support assistant. Answer ONLY using the
FAQ knowledge base below. If the answer isn't in the FAQ, say you don't have that
information and offer to connect the user with a human agent.

FAQ KNOWLEDGE BASE:
{faq_text}"""`,
        tip: 'Keep the FAQ under ~6000 characters so it fits comfortably in the system prompt alongside conversation history.',
      },
      {
        number: 3,
        title: 'Build the Claude responder',
        description: 'Send the full conversation history plus the system prompt to Claude on every turn.',
        code: `# responder.py
from anthropic import Anthropic

client = Anthropic()

def get_response(system_prompt: str, history: list) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=400,
        system=system_prompt,
        messages=history,  # [{"role": "user"/"assistant", "content": "..."}]
    )
    return response.content[0].text`,
        tip: 'history must alternate user/assistant roles — Claude will error if two user turns appear back to back.',
      },
      {
        number: 4,
        title: 'Build the Streamlit UI',
        description: 'Install Streamlit and build a chat interface using st.chat_message and st.chat_input.',
        code: `pip install streamlit anthropic`,
        tip: 'Run the app locally with `streamlit run app.py` — it auto-reloads on save.',
      },
      {
        number: 5,
        title: 'Add session state',
        description: 'Persist the conversation history across reruns using st.session_state.',
        code: `# app.py
import streamlit as st
from context import build_system_prompt
from responder import get_response

st.set_page_config(page_title="FAQ Assistant", page_icon="🤖")
st.title("🤖 FAQ Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

system_prompt = build_system_prompt()

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Ask a question..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        reply = get_response(system_prompt, st.session_state.messages)
        st.markdown(reply)
    st.session_state.messages.append({"role": "assistant", "content": reply})`,
        tip: 'Cap st.session_state.messages to the last ~20 turns to keep token usage and latency low in long sessions.',
      },
      {
        number: 6,
        title: 'Add an "I don\'t know" handler',
        description: 'When Claude says it lacks the answer, surface an escalation button to contact a human.',
        code: `# Add after rendering the assistant reply in app.py
ESCALATION_PHRASES = ["don't have that information", "connect you with a human"]

if any(phrase in reply.lower() for phrase in ESCALATION_PHRASES):
    st.info("Need more help?")
    if st.button("📧 Email our support team"):
        st.markdown("[Click here to email support](mailto:support@example.com)")`,
        tip: 'Log escalated questions to a file or database — they are a goldmine for expanding your FAQ.',
      },
      {
        number: 7,
        title: 'Deploy to Streamlit Cloud',
        description: 'Push to GitHub, connect the repo on share.streamlit.io, and add your API key as a secret.',
        code: `# requirements.txt
streamlit
anthropic

# 1. Push project (app.py, faq.json, requirements.txt) to GitHub
# 2. share.streamlit.io -> New app -> select repo and app.py
# 3. App settings -> Secrets:
#    ANTHROPIC_API_KEY = "sk-ant-your-key"
# 4. In app.py, the Anthropic SDK reads st.secrets automatically if you set:
import os
os.environ["ANTHROPIC_API_KEY"] = st.secrets["ANTHROPIC_API_KEY"]`,
        tip: 'Streamlit Cloud free tier sleeps after inactivity — the first visitor each day will see a ~30 second cold start.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Simple FAQ Chatbot (starter)
pip install streamlit anthropic
Run: streamlit run app.py
"""
import json
import streamlit as st
from anthropic import Anthropic

client = Anthropic()

FAQ = [
    {"question": "What are your business hours?", "answer": "Monday-Friday, 9am-6pm EST."},
    {"question": "How do I reset my password?", "answer": "Settings > Security > Reset Password."},
]

SYSTEM_PROMPT = "Answer ONLY using this FAQ. If unknown, say so and offer human support.\\n\\n" + \\
    "\\n\\n".join(f"Q: {x['question']}\\nA: {x['answer']}" for x in FAQ)

st.set_page_config(page_title="FAQ Assistant", page_icon="🤖")
st.title("🤖 FAQ Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Ask a question..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    response = client.messages.create(
        model="claude-sonnet-4-5", max_tokens=400,
        system=SYSTEM_PROMPT, messages=st.session_state.messages,
    )
    reply = response.content[0].text
    with st.chat_message("assistant"):
        st.markdown(reply)
    st.session_state.messages.append({"role": "assistant", "content": reply})
`,
    resources: [
      { title: 'Streamlit Chat Elements', url: 'https://docs.streamlit.io/library/api-reference/chat' },
      { title: 'Streamlit Cloud Deployment', url: 'https://docs.streamlit.io/streamlit-community-cloud' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 7,
    title: 'Social Media Post Generator',
    emoji: '📱',
    department: ['Marketing'],
    departmentIds: ['marketing'],
    difficulty: 'Beginner',
    description:
      'Input a topic, URL, or article → generate 5 platform-optimized posts for LinkedIn, Twitter/X, Instagram, Facebook, and Threads.',
    whatYouBuild:
      'A Streamlit app where you paste a URL or topic, the agent scrapes the article content, and Claude generates five distinct posts — one per platform — each respecting that platform\'s tone, length, and hashtag conventions, with one-click copy buttons.',
    whatYouLearn: [
      'Scrape and clean article content with BeautifulSoup',
      'Design a single prompt that outputs structured multi-platform content',
      'Parse structured JSON output from Claude',
      'Build a card-based Streamlit layout with copy buttons',
      'Add tone and brand-voice customization options',
      'Handle scraping failures gracefully',
    ],
    techStack: ['Python', 'Claude API', 'Streamlit'],
    buildTime: '1.5 hrs',
    xp: 200,
    popularity: 92,
    prerequisites: ['Basic Python'],
    tags: ['marketing', 'content', 'social-media'],
    session: {
      totalTime: '50 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Have Claude build a tool that pulls the text from any article URL',
        'Generate 5 platform-specific posts (LinkedIn, Twitter/X, Instagram, Facebook, Threads) from one piece of content',
        'Let users pick a tone and add brand voice notes that shape every post',
        'Get a clean, copy-ready UI for each platform',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A blog post or article URL to test with',
      ],
      builds: [
        {
          number: 1,
          title: 'Build the article scraper',
          time: '15 min',
          description: 'Before Claude can write posts about an article, it needs the article\'s text.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a Streamlit app that generates social media posts from articles. Please:\n1. Create a requirements.txt with streamlit, anthropic, requests, beautifulsoup4\n2. Create scraper.py with scrape_article(url: str) that fetches the page with a realistic User-Agent header, removes script/style/nav/footer/header/aside tags, extracts the text from all <p> tags, and returns up to 8000 characters. Wrap it in a try/except that returns an empty string on failure.\n\nInstall the dependencies for me.',
              verify: 'Run `python -c "from scraper import scrape_article; print(scrape_article(\'https://en.wikipedia.org/wiki/Artificial_intelligence\')[:300])"` — you should see a few hundred characters of real article text printed.',
            },
          ],
          goFurther: 'Ask Claude to also extract the page title and a hero image URL using the <title> and <meta property="og:image"> tags, so you can show a preview card.',
        },
        {
          number: 2,
          title: 'Generate posts for 5 platforms at once',
          time: '20 min',
          description: 'One well-designed prompt produces a full week of content in a single call.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create prompts.py and generator.py for my social post generator.\n\nprompts.py should have build_prompt(content, tone, brand_voice) that returns a prompt asking Claude to create 5 social media posts from the content — one each for LinkedIn (professional, 3-5 short paragraphs, ends with a question, 3-5 hashtags), Twitter/X (under 280 characters, punchy, 1-2 hashtags), Instagram (caption style, emoji-friendly, 5-8 hashtags at the end), Facebook (conversational, 2-3 sentences, 0-2 hashtags), and Threads (casual, under 500 characters, 1-3 hashtags). It should include the chosen tone and any brand voice notes, and tell Claude to respond ONLY with JSON: {"linkedin": "...", "twitter": "...", "instagram": "...", "facebook": "...", "threads": "..."}, no markdown fences.\n\ngenerator.py should have generate_posts(content, tone="Educational", brand_voice="") that calls Claude (model "claude-sonnet-4-5", max_tokens 1200) with that prompt and returns the parsed JSON dict.',
              verify: 'Run `python -c "from generator import generate_posts; print(generate_posts(\'AI agents are transforming how small businesses operate.\', \'Casual\'))"` — you should get a dict with all 5 platform keys, each containing a post that matches its style rules.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a 6th platform, "Email Newsletter Blurb" — a 2-3 sentence teaser with a "Read more" link placeholder.',
        },
        {
          number: 3,
          title: 'Build the UI with copy buttons',
          time: '15 min',
          description: 'Bring it all together into a tool you (or your team) can actually use.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create app.py — a Streamlit app titled "📱 Social Media Post Generator" with wide layout. It should have:\n- A text area where users paste a URL or raw article text\n- A selectbox for tone: Formal, Casual, Inspiring, Educational\n- A text input for optional "Brand voice notes"\n- A "Generate Posts" button that, when clicked: if the input starts with "http", scrapes it with scraper.py, otherwise uses it as raw text; then calls generate_posts()\n- Displays the 5 results side by side in columns, each with a subheader (platform name) and the post text shown using st.code() so there\'s a built-in copy icon',
              verify: 'Run `streamlit run app.py`, paste in a real article URL, pick a tone, and click Generate Posts. You should see 5 columns, each with a platform name and a ready-to-copy post that fits that platform\'s style.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a "brand voice profile" sidebar where users can save and reload their brand voice notes from a local JSON file, so they don\'t retype them every session.',
        },
      ],
      portfolio: 'You just built a tool that turns any article into a week\'s worth of social content in one click. Generate posts from a real article, take a screenshot of the 5-platform output, and add "Social Media Post Generator" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a Streamlit app that scrapes any article URL and uses Claude to generate 5 platform-specific social media posts (LinkedIn, Twitter/X, Instagram, Facebook, Threads) in one click, with adjustable tone and brand voice.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up the Streamlit app',
        description: 'Install all required dependencies for scraping, AI generation, and the UI.',
        code: `pip install streamlit anthropic requests beautifulsoup4`,
        tip: 'Use a virtual environment so this project\'s dependencies don\'t clash with others.',
      },
      {
        number: 2,
        title: 'Build the URL scraper',
        description: 'Fetch a webpage and extract its main text content using requests and BeautifulSoup.',
        code: `# scraper.py
import requests
from bs4 import BeautifulSoup

def scrape_article(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AgentForgeBot/1.0)"}
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    paragraphs = soup.find_all("p")
    text = "\\n".join(p.get_text(strip=True) for p in paragraphs)
    return text[:8000]`,
        tip: 'Wrap the scrape in try/except — if it fails, fall back to letting the user paste text directly.',
      },
      {
        number: 3,
        title: 'Build the multi-platform prompt',
        description: 'Define formatting rules per platform — character limits, hashtag conventions, and tone.',
        code: `# prompts.py
PLATFORM_RULES = """
- LinkedIn: professional tone, 3-5 short paragraphs, end with a question, 3-5 hashtags
- Twitter/X: under 280 characters, punchy, 1-2 hashtags
- Instagram: caption style, emoji-friendly, 5-8 hashtags at the end
- Facebook: conversational, 2-3 sentences, 0-2 hashtags
- Threads: casual, conversational, under 500 characters, 1-3 hashtags
"""

def build_prompt(content: str, tone: str, brand_voice: str) -> str:
    return f"""Create 5 social media posts based on this content, one for each platform.

Tone: {tone}
Brand voice notes: {brand_voice or "none provided"}

Platform rules:
{PLATFORM_RULES}

Source content:
{content[:6000]}

Respond ONLY with JSON in this exact shape:
{{"linkedin": "...", "twitter": "...", "instagram": "...", "facebook": "...", "threads": "..."}}"""`,
        tip: 'Generating all 5 posts in a single call keeps messaging consistent across platforms and saves API cost.',
      },
      {
        number: 4,
        title: 'Build the post generator',
        description: 'Call Claude once with the structured prompt and parse the JSON response.',
        code: `# generator.py
import json
from anthropic import Anthropic
from prompts import build_prompt

client = Anthropic()

def generate_posts(content: str, tone: str = "Educational", brand_voice: str = "") -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1200,
        messages=[{"role": "user", "content": build_prompt(content, tone, brand_voice)}],
    )
    return json.loads(response.content[0].text)`,
        tip: 'If JSON parsing fails occasionally, add "Respond with valid JSON only, no markdown code fences" to the prompt.',
      },
      {
        number: 5,
        title: 'Build the copy UI',
        description: 'Display each generated post in its own card with a one-click copy button.',
        code: `# app.py
import streamlit as st
from scraper import scrape_article
from generator import generate_posts

st.set_page_config(page_title="Social Post Generator", page_icon="📱", layout="wide")
st.title("📱 Social Media Post Generator")

source = st.text_area("Paste a URL or article text")
tone = st.selectbox("Tone", ["Formal", "Casual", "Inspiring", "Educational"])
brand_voice = st.text_input("Brand voice notes (optional)")

if st.button("Generate Posts") and source:
    content = scrape_article(source) if source.startswith("http") else source
    posts = generate_posts(content, tone, brand_voice)

    cols = st.columns(len(posts))
    for col, (platform, text) in zip(cols, posts.items()):
        with col:
            st.subheader(platform.title())
            st.text_area("", text, height=200, key=platform)
            st.code(text, language=None)  # provides a built-in copy icon`,
        tip: 'st.code() renders a small copy-to-clipboard icon automatically — no extra JS needed.',
      },
      {
        number: 6,
        title: 'Add a tone selector',
        description: 'Already wired above via st.selectbox — verify each tone meaningfully changes the output.',
        code: `# Quick test matrix — run the generator with the same article and compare:
for tone in ["Formal", "Casual", "Inspiring", "Educational"]:
    posts = generate_posts(content, tone=tone)
    print(tone, "->", posts["linkedin"][:80])`,
        tip: 'If tones feel too similar, add explicit examples of each tone\'s vocabulary to the prompt.',
      },
      {
        number: 7,
        title: 'Add brand voice input',
        description: 'Let users paste brand guidelines that get woven into every generated post.',
        code: `# Already supported via the brand_voice parameter and prompt above.
# Example brand voice notes a user might enter:
brand_voice_example = """
We're a fintech startup. Avoid jargon like "synergy" or "leverage".
Always spell out numbers under 10. Use "we" not "I". Friendly but credible.
"""`,
        tip: 'Save brand voice notes to a text file so returning users do not have to retype them each session.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Social Media Post Generator (starter)
pip install streamlit anthropic requests beautifulsoup4
Run: streamlit run app.py
"""
import json
import requests
from bs4 import BeautifulSoup
import streamlit as st
from anthropic import Anthropic

client = Anthropic()

def scrape_article(url):
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    return "\\n".join(p.get_text(strip=True) for p in soup.find_all("p"))[:6000]

def generate_posts(content, tone):
    prompt = f"""Create 5 social posts (LinkedIn, Twitter, Instagram, Facebook, Threads)
from this content in a {tone} tone. Respond as JSON with keys:
linkedin, twitter, instagram, facebook, threads.

Content: {content}"""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=1200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

st.title("📱 Social Media Post Generator")
source = st.text_area("Paste a URL or article text")
tone = st.selectbox("Tone", ["Formal", "Casual", "Inspiring", "Educational"])

if st.button("Generate") and source:
    content = scrape_article(source) if source.startswith("http") else source
    posts = generate_posts(content, tone)
    for platform, text in posts.items():
        st.subheader(platform.title())
        st.code(text)
`,
    resources: [
      { title: 'BeautifulSoup Documentation', url: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/' },
      { title: 'Streamlit Layouts', url: 'https://docs.streamlit.io/library/api-reference/layout' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 8,
    title: 'Document Summarizer Agent',
    emoji: '📄',
    department: ['Legal', 'Operations'],
    departmentIds: ['legal', 'operations'],
    difficulty: 'Beginner',
    description:
      'Drop any PDF, Word doc, or URL and get an intelligent summary with key points, action items, and a one-paragraph executive brief.',
    whatYouBuild:
      'A Python tool that detects the type of document you give it (PDF, DOCX, URL, or plain text), extracts the text, splits long documents into chunks, and uses a map-reduce summarization pipeline with Claude to produce a structured summary.',
    whatYouLearn: [
      'Detect file types and route to the correct extractor',
      'Extract text from PDFs and DOCX files',
      'Implement token-aware chunking for long documents',
      'Apply the map-reduce summarization pattern',
      'Design a structured summary output format',
      'Handle multiple input sources in one tool',
    ],
    techStack: ['Python', 'Claude API', 'PyPDF2'],
    buildTime: '2 hrs',
    xp: 270,
    popularity: 85,
    prerequisites: ['Basic Python'],
    tags: ['documents', 'summarization', 'productivity'],
    session: {
      totalTime: '60 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Have Claude build a tool that extracts text from PDFs, Word docs, URLs, or plain text',
        'Handle long documents by splitting them into chunks and summarizing each piece',
        'Get a structured final report: Executive Summary, Key Points, Action Items, Entities Mentioned',
        'Run it on any document from the command line',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A PDF or Word document to test with (a contract, report, or article works well)',
      ],
      builds: [
        {
          number: 1,
          title: 'Build the extractors',
          time: '20 min',
          description: 'Before Claude can summarize anything, you need plain text — no matter what format the document arrives in.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a document summarizer in Python that should handle PDFs, Word docs, URLs, and plain text files.\n\nPlease create:\n1. A requirements.txt with anthropic, pypdf2, python-docx, requests, beautifulsoup4\n2. router.py with detect_type(source: str) that returns "url" if source starts with http(s), "pdf" if it ends in .pdf, "docx" if it ends in .docx, otherwise "text"\n3. extractors.py with extract_pdf(path) using PyPDF2, extract_docx(path) using python-docx, and extract_url(url) that fetches the page and extracts text from <p> tags after removing script/style/nav/footer tags\n\nInstall the dependencies for me.',
              verify: 'Run `python -c "from extractors import extract_pdf; print(len(extract_pdf(\'somefile.pdf\')))"` on a real PDF in your folder — it should print a character count greater than 0.',
            },
          ],
          goFurther: 'Ask Claude to add a .txt branch to router.py and a simple extractor that just reads the file directly — many real documents are plain text.',
        },
        {
          number: 2,
          title: 'Build the map-reduce summarizer',
          time: '25 min',
          description: 'For long documents, Claude summarizes each chunk first, then summarizes the summaries.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now create:\n1. chunker.py with chunk_text(text, max_chars=16000) that splits text into chunks along paragraph boundaries (never mid-sentence), each under max_chars\n2. summarizer.py with:\n   - summarize_chunk(chunk) that asks Claude (model "claude-sonnet-4-5", max_tokens 500) to summarize the chunk in 5-8 bullet points\n   - summarize_document(text) that chunks the text, summarizes each chunk, combines the summaries, and asks Claude (max_tokens 1200) to produce a final report with sections: ## Executive Summary (one paragraph), ## Key Points (bullets), ## Action Items (bullets, or "None identified"), ## Entities Mentioned (people, companies, products)\n\nFor documents under ~12,000 characters, summarize_document should skip the chunking step and summarize directly in one call.',
              verify: 'Test with a short piece of text: `python -c "from summarizer import summarize_document; print(summarize_document(open(\'somefile.txt\').read()))"`. You should see all four section headers in the output.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a progress print between chunk summaries for long documents, so you can see it\'s still working.',
        },
        {
          number: 3,
          title: 'Wire it into one command-line tool',
          time: '15 min',
          description: 'One command, any document.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create main.py that ties everything together: takes a file path or URL as a command-line argument (sys.argv[1]), uses router.py to detect the type, extracts the text with the matching function from extractors.py, prints how many characters were extracted and the detected type, then prints the result of summarize_document().',
              verify: 'Run `python main.py path/to/your/document.pdf` (or a .docx, .txt, or URL). You should see the character count, detected type, and a structured summary with Executive Summary, Key Points, Action Items, and Entities Mentioned.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to wrap main.py in a small Streamlit app with a file-upload widget, so non-technical teammates can drag and drop a document and get a summary.',
        },
      ],
      portfolio: 'You just built a tool that can summarize any contract, report, or article in seconds. Run it on a real document, take a screenshot of the structured summary, and add "Document Summarizer Agent" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a Python command-line tool that extracts text from PDFs, Word docs, URLs, or plain text, handles long documents with a map-reduce chunking strategy, and uses Claude to produce a structured summary with Executive Summary, Key Points, Action Items, and Entities Mentioned.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Install dependencies',
        description: 'Install libraries for PDF, DOCX, and web extraction alongside the Anthropic SDK.',
        code: `pip install anthropic pypdf2 python-docx requests beautifulsoup4`,
        tip: 'PyPDF2 struggles with scanned (image-based) PDFs — for those you would need OCR (e.g. pytesseract).',
      },
      {
        number: 2,
        title: 'Build the file router',
        description: 'Detect whether the input is a PDF, DOCX, URL, or plain text and call the right extractor.',
        code: `# router.py
import os

def detect_type(source: str) -> str:
    if source.startswith("http://") or source.startswith("https://"):
        return "url"
    ext = os.path.splitext(source)[1].lower()
    if ext == ".pdf":
        return "pdf"
    if ext == ".docx":
        return "docx"
    return "text"`,
        tip: 'Add a "txt" branch too — many users will just have plain .txt transcripts.',
      },
      {
        number: 3,
        title: 'Build the PDF extractor',
        description: 'Use PyPDF2 to extract text from every page of a multi-page PDF.',
        code: `# extractors.py
from PyPDF2 import PdfReader

def extract_pdf(path: str) -> str:
    reader = PdfReader(path)
    return "\\n".join(page.extract_text() or "" for page in reader.pages)`,
        tip: 'extract_text() can return None for image-only pages — the "or \\"\\"" guards against TypeErrors.',
      },
      {
        number: 4,
        title: 'Build the DOCX extractor',
        description: 'Use python-docx to extract every paragraph of text from a Word document.',
        code: `# extractors.py (continued)
from docx import Document

def extract_docx(path: str) -> str:
    doc = Document(path)
    return "\\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extract_url(url: str) -> str:
    import requests
    from bs4 import BeautifulSoup
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    return "\\n".join(p.get_text(strip=True) for p in soup.find_all("p"))`,
        tip: 'Tables in DOCX files are not captured by doc.paragraphs — iterate doc.tables separately if needed.',
      },
      {
        number: 5,
        title: 'Build the chunker',
        description: 'Split large documents into ~4000-token chunks (roughly 16,000 characters) so each fits comfortably in one Claude call.',
        code: `# chunker.py
def chunk_text(text: str, max_chars: int = 16000) -> list[str]:
    paragraphs = text.split("\\n")
    chunks, current = [], ""

    for para in paragraphs:
        if len(current) + len(para) > max_chars:
            chunks.append(current)
            current = ""
        current += para + "\\n"

    if current.strip():
        chunks.append(current)
    return chunks`,
        tip: 'Splitting on paragraph boundaries (rather than a hard character cut) keeps sentences intact for better summaries.',
      },
      {
        number: 6,
        title: 'Build the summarizer (map-reduce)',
        description: 'Summarize each chunk individually, then summarize the summaries into one final output.',
        code: `# summarizer.py
from anthropic import Anthropic
from chunker import chunk_text

client = Anthropic()

def summarize_chunk(chunk: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        messages=[{"role": "user", "content": f"Summarize the key points of this text in 5-8 bullet points:\\n\\n{chunk}"}],
    )
    return response.content[0].text

def summarize_document(text: str) -> str:
    chunks = chunk_text(text)
    chunk_summaries = [summarize_chunk(c) for c in chunks]
    combined = "\\n\\n".join(chunk_summaries)

    final_prompt = f"""Based on these section summaries of a document, produce a final report with:

## Executive Summary
(one paragraph)

## Key Points
(bullet list)

## Action Items
(bullet list, or "None identified")

## Entities Mentioned
(people, companies, products mentioned)

SECTION SUMMARIES:
{combined}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1200,
        messages=[{"role": "user", "content": final_prompt}],
    )
    return response.content[0].text`,
        tip: 'For documents under ~12,000 characters, skip map-reduce entirely and summarize in one call to save cost.',
      },
      {
        number: 7,
        title: 'Format the output',
        description: 'Tie everything together in a single CLI entry point.',
        code: `# main.py
import sys
from router import detect_type
from extractors import extract_pdf, extract_docx, extract_url
from summarizer import summarize_document

EXTRACTORS = {
    "pdf": extract_pdf,
    "docx": extract_docx,
    "url": extract_url,
    "text": lambda p: open(p, encoding="utf-8").read(),
}

def main(source: str):
    doc_type = detect_type(source)
    text = EXTRACTORS[doc_type](source)
    print(f"Extracted {len(text)} characters ({doc_type})\\n")
    print(summarize_document(text))

if __name__ == "__main__":
    main(sys.argv[1])

# Usage:
# python main.py contract.pdf
# python main.py report.docx
# python main.py https://example.com/article`,
        tip: 'Add a progress print between chunk summaries for very long documents so users know it is still working.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Document Summarizer Agent (starter)
pip install anthropic pypdf2 python-docx requests beautifulsoup4
"""
import sys, os
from PyPDF2 import PdfReader
from anthropic import Anthropic

client = Anthropic()

def extract_text(path):
    if path.lower().endswith(".pdf"):
        reader = PdfReader(path)
        return "\\n".join(p.extract_text() or "" for p in reader.pages)
    return open(path, encoding="utf-8").read()

def summarize(text):
    prompt = f"""Summarize this document with sections:
## Executive Summary
## Key Points
## Action Items
## Entities Mentioned

DOCUMENT:
{text[:15000]}"""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=1200,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text

if __name__ == "__main__":
    text = extract_text(sys.argv[1])
    print(summarize(text))
`,
    resources: [
      { title: 'PyPDF2 Documentation', url: 'https://pypdf2.readthedocs.io' },
      { title: 'python-docx Documentation', url: 'https://python-docx.readthedocs.io' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 9,
    title: 'Lead Capture & Qualifier Bot',
    emoji: '🎯',
    department: ['Sales'],
    departmentIds: ['sales'],
    difficulty: 'Beginner',
    description:
      'Receives new form submissions, scores the lead using Claude, and auto-creates a qualified contact in HubSpot with a lead score and follow-up task.',
    whatYouBuild:
      'A Flask webhook that receives Typeform submissions, asks Claude to score the lead 1-10 against your ICP and extract pain points, then creates (or updates) a HubSpot contact with that score and a follow-up task assigned by tier.',
    whatYouLearn: [
      'Build a Typeform lead capture form',
      'Receive and parse webhook payloads',
      'Design lead-scoring prompts grounded in ICP criteria',
      'Use the HubSpot API to create contacts and properties',
      'Create follow-up tasks programmatically',
      'Route leads by score tier',
    ],
    techStack: ['Python', 'Typeform API', 'Claude API', 'HubSpot API'],
    buildTime: '3 hrs',
    xp: 320,
    popularity: 87,
    prerequisites: ['Basic Python', 'Typeform account', 'HubSpot account (free CRM tier works)'],
    tags: ['sales', 'crm', 'lead-scoring'],
    session: {
      totalTime: '90 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Capture new leads from a Typeform form via webhook',
        'Have Claude score each lead 1-10 against your Ideal Customer Profile and extract their pain points',
        'Automatically create or update a HubSpot contact with that score',
        'Create a follow-up task assigned by lead tier (hot/warm/cold)',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free Typeform account',
        'A HubSpot account (the free CRM tier works) with a Private App token',
        'ngrok for local webhook testing',
      ],
      builds: [
        {
          number: 1,
          title: 'Set up your form and webhook',
          time: '20 min',
          description: 'Get leads flowing into your system before worrying about scoring them.',
          steps: [
            {
              instruction: 'In Typeform, create a new form with these fields: Full name (Short text), Work email (Email), Company name (Short text), Company size (Multiple choice: 1-10, 11-50, 51-200, 200+), Budget range (Multiple choice), and "What\'s your biggest challenge right now?" (Long text). Keep it to these 6 fields.',
            },
            {
              instruction: 'Run `ngrok http 5000` to get a public URL. In Typeform, go to your form > Connect > Webhooks, and add a webhook pointing to `<your-ngrok-url>/webhook/typeform`.',
              verify: 'You should see an ngrok "Forwarding" URL. Leave this running — you\'ll test the webhook in Build 2.',
            },
          ],
          goFurther: 'Submit a test response to your form now and check the Typeform Connect > Webhooks log to confirm a delivery attempt shows up (it\'ll fail until Build 2 is done — that\'s expected).',
        },
        {
          number: 2,
          title: 'Build the webhook receiver and lead scorer',
          time: '30 min',
          description: 'This is where Claude reads the raw form submission and turns it into a scored lead.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a Flask app that receives Typeform webhook submissions and scores leads with Claude.\n\nPlease create:\n1. A requirements.txt with flask, anthropic, python-dotenv, hubspot-api-client\n2. app.py with a Flask app and a parse_typeform(payload) function that extracts full_name, email, company, company_size, budget, and challenge from a Typeform webhook payload by matching field titles ("Full name", "Work email", "Company name", "Company size", "Budget range", "What\'s your biggest challenge right now?")\n3. scorer.py with score_lead(lead: dict) that defines an ICP (Ideal Customer Profile — ask me for my actual ICP, or use: company size 51-200 employees is the sweet spot, budget $5k+/month preferred, pain points around manual reporting/slow onboarding/disconnected tools as a default) and asks Claude (model "claude-sonnet-4-5", max_tokens 400) to score the lead 1-10, classify it as hot (8-10) / warm (5-7) / cold (1-4), and extract pain points. Respond ONLY with JSON: {"score": int, "tier": "...", "pain_points": [...], "notes": "..."}\n4. A POST /webhook/typeform route in app.py that parses the payload, scores the lead, prints the result, and returns {"status": "ok"}, 200',
              verify: 'Submit a test response to your Typeform. Your Flask app (running on port 5000) should log the parsed lead and the score/tier/pain_points JSON. If the field titles don\'t match, log the raw payload once and ask Claude to fix parse_typeform to match your exact field names.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add explicit examples of hot/warm/cold leads to the ICP prompt so scoring stays consistent as you test more submissions.',
        },
        {
          number: 3,
          title: 'Push scored leads into HubSpot',
          time: '25 min',
          description: 'Now the sales team sees AI-scored leads show up automatically in the CRM.',
          steps: [
            {
              instruction: 'In HubSpot, go to Settings > Integrations > Private Apps, create an app with scopes crm.objects.contacts.read/write and crm.objects.tasks.write, and copy the access token into your .env as HUBSPOT_TOKEN. Then in Settings > Properties, create three custom contact properties: lead_score (number), lead_tier (text), and ai_notes (text).',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create hubspot_client.py with:\n1. upsert_contact(lead, score_result) — creates a HubSpot contact with email, firstname, lastname (split from full_name), company, lead_score, lead_tier, and ai_notes properties. If the contact already exists (HubSpot returns a conflict), search for it by email and update it instead. Return the contact ID.\n2. create_followup_task(contact_id, lead, score_result) — creates a HubSpot task titled "Follow up: {company} ({TIER} - {score}/10)" with the pain points in the body, due in 2 hours for "hot" leads and 24 hours for everything else, and associates it with the contact.\n\nThen update the /webhook/typeform route in app.py to call upsert_contact() and create_followup_task() after scoring the lead.',
              verify: 'Submit another test response to Typeform. Within a few seconds, check your HubSpot Contacts — a new (or updated) contact should appear with lead_score, lead_tier, and ai_notes filled in, plus an associated follow-up task.',
            },
          ],
          goFurther: 'Ask Claude to add a REP_BY_TIER mapping so hot/warm/cold leads get assigned to different HubSpot owner IDs (e.g. senior AE vs. SDR queue).',
        },
        {
          number: 4,
          title: 'Test end-to-end and go live',
          time: '15 min',
          description: 'One last check before real leads start flowing through.',
          steps: [
            {
              instruction: 'Submit three test form responses representing different lead quality: a strong fit (large company, big budget, relevant pain points), a weak fit (1-10 employees, no budget mentioned), and a middle-of-the-road one.',
              verify: 'Check HubSpot — you should see three contacts with scores roughly matching hot/cold/warm, each with a follow-up task due at the right time (2 hours for hot, 24 hours for the others).',
            },
            {
              instruction: 'Ask Claude how to deploy app.py to Railway or Render so the webhook URL is permanent, then update the Typeform webhook to point at that URL instead of ngrok.',
              verify: 'After deploying, submit one more test response — it should still create a scored contact and task in HubSpot, confirming the live webhook works without ngrok running.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a daily summary email (reusing patterns from Agent #4) that lists all new leads captured that day, sorted by score.',
        },
      ],
      portfolio: 'You just built a lead qualification pipeline that scores and routes every new lead automatically. Take a screenshot of a scored HubSpot contact with its follow-up task, and add "Lead Capture & Qualifier Bot" to your build portfolio with a one-line description.',
      portfolioPrompt: 'I just built a lead qualification pipeline: a Flask webhook receives Typeform submissions, Claude scores each lead 1-10 against an ICP and extracts pain points, and the result is pushed into HubSpot as a contact with a tiered follow-up task.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Create a Typeform form',
        description: 'Build a lead capture form asking for company, company size, budget range, and main challenge.',
        code: `# Typeform fields to add:
# 1. Full name (Short text)
# 2. Work email (Email)
# 3. Company name (Short text)
# 4. Company size (Multiple choice: 1-10, 11-50, 51-200, 200+)
# 5. Budget range (Multiple choice)
# 6. "What's your biggest challenge right now?" (Long text)`,
        tip: 'Keep the form to 5-6 fields — conversion drops sharply after that on lead-gen forms.',
      },
      {
        number: 2,
        title: 'Set up a Typeform webhook',
        description: 'In Typeform Connect settings, add a webhook URL that fires on every new submission.',
        code: `# Typeform -> your form -> Connect -> Webhooks -> Add a webhook
# URL: https://your-app.up.railway.app/webhook/typeform
# Use ngrok during local development:
ngrok http 5000`,
        tip: 'Typeform retries failed webhook deliveries — make sure your endpoint responds 200 quickly even if processing is async.',
      },
      {
        number: 3,
        title: 'Build the webhook receiver',
        description: 'Create a Flask endpoint that parses the Typeform payload into a simple dict.',
        code: `# app.py
from flask import Flask, request, jsonify
from scorer import score_lead
from hubspot_client import upsert_contact, create_followup_task

app = Flask(__name__)

def parse_typeform(payload: dict) -> dict:
    answers = payload["form_response"]["answers"]
    parsed = {}
    field_map = {
        "full_name": "Full name",
        "email": "Work email",
        "company": "Company name",
        "company_size": "Company size",
        "budget": "Budget range",
        "challenge": "What's your biggest challenge right now?",
    }
    titles = {a["field"]["ref"]: a for a in answers}
    for key, title in field_map.items():
        for a in answers:
            if a["field"]["title"] == title:
                parsed[key] = a.get("text") or a.get("email") or a.get("choice", {}).get("label", "")
    return parsed

@app.route("/webhook/typeform", methods=["POST"])
def typeform_webhook():
    payload = request.get_json()
    lead = parse_typeform(payload)

    score_result = score_lead(lead)
    contact_id = upsert_contact(lead, score_result)
    create_followup_task(contact_id, lead, score_result)

    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(port=5000)`,
        tip: 'Log the raw payload to a file the first time — Typeform\'s field titles must match your parser exactly.',
      },
      {
        number: 4,
        title: 'Build the Claude lead scorer',
        description: 'Score the lead 1-10 against your Ideal Customer Profile and extract their stated pain points.',
        code: `# scorer.py
import json
from anthropic import Anthropic

client = Anthropic()

ICP = """
Ideal Customer Profile:
- Company size: 51-200 employees (sweet spot), 11-50 acceptable, 1-10 low priority
- Budget: $5k+/month preferred
- Pain points we solve: manual reporting, slow customer onboarding, disconnected tools
"""

def score_lead(lead: dict) -> dict:
    prompt = f"""{ICP}

Score this lead from 1-10 based on fit with our ICP, and extract their pain points.

Lead:
- Company: {lead.get('company')}
- Size: {lead.get('company_size')}
- Budget: {lead.get('budget')}
- Stated challenge: {lead.get('challenge')}

Respond ONLY with JSON: {{"score": <int>, "tier": "hot|warm|cold", "pain_points": ["..."], "notes": "..."}}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.content[0].text)`,
        tip: 'Define "hot" (8-10), "warm" (5-7), "cold" (1-4) explicitly in the prompt so tiers are consistent across runs.',
      },
      {
        number: 5,
        title: 'Build the HubSpot integration',
        description: 'Install the HubSpot client and create a private app token with CRM scopes.',
        code: `pip install hubspot-api-client flask

# HubSpot -> Settings -> Integrations -> Private Apps -> Create app
# Scopes needed: crm.objects.contacts.read/write, crm.objects.tasks.write
# Copy the access token into .env as HUBSPOT_TOKEN`,
        tip: 'Private apps are scoped per-account — use a HubSpot sandbox account while developing.',
      },
      {
        number: 6,
        title: 'Add the lead score as a HubSpot property',
        description: 'Create a custom contact property for lead score and notes, then upsert the contact.',
        code: `# hubspot_client.py
import os
from hubspot import HubSpot
from hubspot.crm.contacts import SimplePublicObjectInputForCreate, ApiException

client = HubSpot(access_token=os.environ["HUBSPOT_TOKEN"])

def upsert_contact(lead: dict, score_result: dict) -> str:
    properties = {
        "email": lead.get("email"),
        "firstname": lead.get("full_name", "").split(" ")[0],
        "lastname": " ".join(lead.get("full_name", "").split(" ")[1:]),
        "company": lead.get("company"),
        "lead_score": str(score_result["score"]),
        "lead_tier": score_result["tier"],
        "ai_notes": score_result["notes"],
    }
    try:
        result = client.crm.contacts.basic_api.create(
            simple_public_object_input_for_create=SimplePublicObjectInputForCreate(properties=properties)
        )
        return result.id
    except ApiException:
        # Contact likely already exists — search and update instead
        search = client.crm.contacts.search_api.do_search(
            public_object_search_request={
                "filterGroups": [{"filters": [{"propertyName": "email", "operator": "EQ", "value": lead["email"]}]}]
            }
        )
        contact_id = search.results[0].id
        client.crm.contacts.basic_api.update(contact_id, simple_public_object_input={"properties": properties})
        return contact_id`,
        tip: 'Create lead_score, lead_tier, and ai_notes as custom properties in HubSpot Settings before running this.',
      },
      {
        number: 7,
        title: 'Create a follow-up task in HubSpot',
        description: 'Assign a follow-up task to a sales rep based on the lead\'s score tier.',
        code: `# hubspot_client.py (continued)
from datetime import datetime, timedelta

REP_BY_TIER = {
    "hot": "12345678",   # HubSpot owner ID for senior AE
    "warm": "23456789",  # mid AE
    "cold": "34567890",  # SDR / nurture queue
}

def create_followup_task(contact_id: str, lead: dict, score_result: dict):
    due = datetime.utcnow() + timedelta(hours=2 if score_result["tier"] == "hot" else 24)

    task_properties = {
        "hs_task_subject": f"Follow up: {lead.get('company')} ({score_result['tier'].upper()} - {score_result['score']}/10)",
        "hs_task_body": "Pain points: " + ", ".join(score_result["pain_points"]),
        "hs_task_status": "NOT_STARTED",
        "hs_timestamp": str(int(due.timestamp() * 1000)),
        "hubspot_owner_id": REP_BY_TIER.get(score_result["tier"], REP_BY_TIER["cold"]),
    }

    client.crm.objects.tasks.basic_api.create(
        simple_public_object_input_for_create={"properties": task_properties}
    )

    # Associate the task with the contact
    client.crm.objects.tasks.associations_api.create(
        task_id="LATEST",  # in production, capture the created task ID and use it here
        to_object_type="contacts",
        to_object_id=contact_id,
        association_type="task_to_contact",
    )`,
        tip: 'Hot leads get a 2-hour SLA, everyone else gets 24 hours — tune these thresholds to your sales capacity.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Lead Capture & Qualifier Bot (starter)
pip install flask anthropic hubspot-api-client
"""
import os, json
from flask import Flask, request, jsonify
from anthropic import Anthropic
from hubspot import HubSpot

app = Flask(__name__)
claude = Anthropic()
hubspot = HubSpot(access_token=os.environ["HUBSPOT_TOKEN"])

def score_lead(lead):
    prompt = f"""Score this lead 1-10 for fit with a B2B SaaS targeting 50-200 employee companies.
Lead: {json.dumps(lead)}
Respond as JSON: {{"score": <int>, "tier": "hot|warm|cold", "pain_points": ["..."]}}"""
    resp = claude.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

@app.route("/webhook/typeform", methods=["POST"])
def webhook():
    payload = request.get_json()
    answers = payload["form_response"]["answers"]
    lead = {a["field"]["title"]: a.get("text") or a.get("email", "") for a in answers}

    result = score_lead(lead)
    print("Lead scored:", result)
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(port=5000)
`,
    resources: [
      { title: 'Typeform Webhooks', url: 'https://www.typeform.com/help/a/webhooks-360029583951/' },
      { title: 'HubSpot API Reference', url: 'https://developers.hubspot.com/docs/api/overview' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 10,
    title: 'Price & Competitor Monitor Agent',
    emoji: '🔍',
    department: ['Operations', 'Marketing'],
    departmentIds: ['operations', 'marketing'],
    difficulty: 'Beginner',
    description:
      'Monitor competitor product pages and pricing — get an email alert when prices change or new products appear.',
    whatYouBuild:
      'A scheduled scraper that checks a list of competitor pages every few hours, detects changes by comparing against a stored snapshot, asks Claude to assess the competitive impact of any change, and emails (or Slacks) you a before/after alert.',
    whatYouLearn: [
      'Scrape structured data with CSS selectors',
      'Persist and diff state between runs using SQLite/JSON',
      'Use Claude to interpret the significance of a change',
      'Build a before/after HTML email alert',
      'Schedule recurring scrapers responsibly',
      'Add Slack as an alternate notification channel',
    ],
    techStack: ['Python', 'requests', 'Claude API'],
    buildTime: '2.5 hrs',
    xp: 300,
    popularity: 78,
    prerequisites: ['Basic Python', 'Basic HTML/CSS selector knowledge'],
    tags: ['competitive-intel', 'scraping', 'monitoring'],
    session: {
      totalTime: '90 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Track prices and product info on competitor pages automatically',
        'Detect changes between runs using a local snapshot database',
        'Have Claude assess what each change might mean competitively',
        'Get an email (and optionally Slack) alert whenever something changes',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A list of 2-5 competitor pages you want to monitor, plus 5 minutes with browser dev tools to find their price elements',
        'An email account you can send from (e.g. Gmail with an app password)',
        '(Optional) A Slack Incoming Webhook URL',
      ],
      builds: [
        {
          number: 1,
          title: 'Pick your targets and build the scraper',
          time: '30 min',
          description: 'Tell Claude which pages to watch and what to extract from each.',
          steps: [
            {
              instruction: 'Open dev tools (right-click > Inspect) on 2-3 competitor pricing pages and find the CSS selector for the price and plan name. Note these down — you\'ll hand them to Claude.',
            },
            {
              instruction: 'Paste this prompt into Claude, filling in your actual competitor URLs and selectors:',
              prompt: 'I want to monitor competitor pricing pages for changes. Here are my targets:\n\n[paste a list like: "Competitor A - Pro Plan: https://competitor-a.com/pricing, price selector .pro-plan .price, name selector .pro-plan .plan-name" — one per line]\n\nPlease create:\n1. targets.json with this list\n2. requirements.txt with requests, beautifulsoup4, anthropic\n3. scraper.py with a scrape_target(target) function that uses requests + BeautifulSoup (with a realistic User-Agent header) to return {"name": ..., "price": ..., "plan_name": ...} for each target\n\nAdd a small main block that loops over targets.json and prints each result so I can confirm the selectors work.',
              verify: 'Run the script — it should print the current price and plan name for each target. If a value comes back None, re-check the selector in dev tools and ask Claude to adjust it.',
            },
          ],
          goFurther: 'Ask Claude to add a rate limit (e.g. 2-second delay between requests) so you\'re a polite scraper if you add more targets later.',
        },
        {
          number: 2,
          title: 'Detect changes and ask Claude what they mean',
          time: '30 min',
          description: 'Store a snapshot of each page so you can compare it to the next run — and get an AI read on any change.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now add change detection to my price monitor:\n\n1. storage.py using sqlite3 with a snapshots table (name TEXT PRIMARY KEY, data TEXT), plus get_previous(conn, name), save_current(conn, name, data), and detect_changes(previous, current) that compares "price" and "plan_name" and returns a list of human-readable change strings (e.g. "price: \'$49\' -> \'$59\'"). If there\'s no previous snapshot, return an empty list (first run).\n2. analyzer.py with analyze_change(target_name, changes) that sends the change list to Claude (model "claude-sonnet-4-5", max_tokens 200) asking for a 2-3 sentence read on what the change might signal (price war, repositioning, new segment) and one suggested response for our team.\n3. Update main.py to scrape each target, compare against the stored snapshot, call analyze_change() if anything changed, print the result, and save the new snapshot either way.',
              verify: 'Run it twice in a row. The first run should print "No change" for everything (nothing to compare yet). Manually edit one value in snapshots.db (or temporarily hardcode a different price in scraper.py) and run again — it should print a detected change plus Claude\'s analysis.',
            },
          ],
          goFurther: '🛠️ Ask Claude to track price history over time (append to a list instead of overwriting) so you can later chart price trends.',
        },
        {
          number: 3,
          title: 'Send alerts and put it on a schedule',
          time: '30 min',
          description: 'Make sure you actually see a change when it happens, without checking manually.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add alerting to my price monitor:\n\n1. email_alert.py with send_alert(to_email, target_name, changes, analysis) that sends an HTML email via smtplib (SMTP_SSL, smtp.gmail.com) showing the target name, a bulleted list of changes, and the AI analysis. Use SMTP_USER and SMTP_PASS from environment variables.\n2. (Optional) slack_alert.py with send_slack_alert(target_name, changes, analysis) that posts the same info to a Slack Incoming Webhook URL from the SLACK_WEBHOOK_URL environment variable.\n3. Update main.py to call send_alert() (and send_slack_alert() if configured) whenever changes are detected.\n\nThen tell me the exact crontab line to run main.py every 6 hours.',
              verify: 'Trigger a fake change again (like in Build 2) and confirm you receive an email — and a Slack message if you set that up. Then add the crontab line Claude gives you.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a weekly digest mode that summarizes all price changes from the past 7 days into one email, even on days with no changes.',
        },
      ],
      portfolio: 'You just built a competitive intelligence agent that watches the market for you 24/7. Take a screenshot of an alert email with the AI analysis, and add "Price & Competitor Monitor Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a competitor price monitoring agent: it scrapes competitor pricing pages on a schedule, detects changes against a stored snapshot, asks Claude to assess the competitive significance of each change, and sends an email/Slack alert.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Build a target list',
        description: 'Define each competitor page you want to track, along with the CSS selectors for price and product name.',
        code: `// targets.json
[
  {
    "name": "Competitor A - Pro Plan",
    "url": "https://competitor-a.com/pricing",
    "price_selector": ".pro-plan .price",
    "name_selector": ".pro-plan .plan-name"
  },
  {
    "name": "Competitor B - Starter Plan",
    "url": "https://competitor-b.com/pricing",
    "price_selector": "#starter .amount",
    "name_selector": "#starter h3"
  }
]`,
        tip: 'Use your browser\'s "Inspect Element" to find stable selectors — prefer IDs and data-attributes over generated class names.',
      },
      {
        number: 2,
        title: 'Build the web scraper',
        description: 'Use requests + BeautifulSoup to extract the current price and name for each target.',
        code: `# scraper.py
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AgentForgeBot/1.0)"}

def scrape_target(target: dict) -> dict:
    resp = requests.get(target["url"], headers=HEADERS, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")

    price_el = soup.select_one(target["price_selector"])
    name_el = soup.select_one(target["name_selector"])

    return {
        "name": target["name"],
        "price": price_el.get_text(strip=True) if price_el else None,
        "plan_name": name_el.get_text(strip=True) if name_el else None,
    }`,
        tip: 'Respect robots.txt and rate-limit your requests (e.g. 1 every few seconds) when monitoring multiple pages.',
      },
      {
        number: 3,
        title: 'Build the change detector',
        description: 'Store the latest snapshot in SQLite and compare new scrapes against it.',
        code: `# storage.py
import sqlite3
import json

DB_PATH = "snapshots.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS snapshots (name TEXT PRIMARY KEY, data TEXT)")
    conn.commit()
    return conn

def get_previous(conn, name: str):
    row = conn.execute("SELECT data FROM snapshots WHERE name = ?", (name,)).fetchone()
    return json.loads(row[0]) if row else None

def save_current(conn, name: str, data: dict):
    conn.execute(
        "INSERT INTO snapshots (name, data) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET data = excluded.data",
        (name, json.dumps(data)),
    )
    conn.commit()

def detect_changes(previous: dict, current: dict) -> list[str]:
    if previous is None:
        return []  # first run, nothing to compare
    changes = []
    for key in ("price", "plan_name"):
        if previous.get(key) != current.get(key):
            changes.append(f"{key}: '{previous.get(key)}' -> '{current.get(key)}'")
    return changes`,
        tip: 'SQLite is perfect here — no server setup, and the whole DB is a single portable file.',
      },
      {
        number: 4,
        title: 'Build the Claude analyzer',
        description: 'When a change is detected, ask Claude to assess what it might mean competitively.',
        code: `# analyzer.py
from anthropic import Anthropic

client = Anthropic()

def analyze_change(target_name: str, changes: list[str]) -> str:
    prompt = f"""A competitor monitoring system detected the following change:

Competitor/Plan: {target_name}
Changes: {"; ".join(changes)}

In 2-3 sentences, explain what this change might signal (e.g. price war, repositioning,
new market segment) and suggest one possible response for our team."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text`,
        tip: 'Small, frequent price changes (A/B tests) are common — Claude can help you distinguish noise from real strategy shifts.',
      },
      {
        number: 5,
        title: 'Build the alert email',
        description: 'Format detected changes as an HTML email with a clear before/after comparison.',
        code: `# email_alert.py
import os, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_alert(to_email: str, target_name: str, changes: list[str], analysis: str):
    rows = "".join(f"<li>{c}</li>" for c in changes)
    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>⚠️ Competitor Change Detected</h2>
      <p><strong>{target_name}</strong></p>
      <ul>{rows}</ul>
      <p><strong>AI Analysis:</strong> {analysis}</p>
    </body></html>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Competitor Alert: {target_name}"
    msg["From"] = os.environ["SMTP_USER"]
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        server.sendmail(os.environ["SMTP_USER"], to_email, msg.as_string())`,
        tip: 'Include both the old and new values explicitly in the email body — "what changed" is the most important info.',
      },
      {
        number: 6,
        title: 'Schedule with cron',
        description: 'Combine everything in main.py and run it every 6 hours.',
        code: `# main.py
import json
from scraper import scrape_target
from storage import init_db, get_previous, save_current, detect_changes
from analyzer import analyze_change
from email_alert import send_alert

def main():
    targets = json.load(open("targets.json"))
    conn = init_db()

    for target in targets:
        current = scrape_target(target)
        previous = get_previous(conn, target["name"])
        changes = detect_changes(previous, current)

        if changes:
            analysis = analyze_change(target["name"], changes)
            send_alert("you@example.com", target["name"], changes, analysis)
            print(f"ALERT: {target['name']} changed -> {changes}")
        else:
            print(f"No change: {target['name']}")

        save_current(conn, target["name"], current)

if __name__ == "__main__":
    main()

# Crontab — every 6 hours:
# 0 */6 * * * /path/to/venv/bin/python /path/to/main.py`,
        tip: 'On the very first run every target will look "new" (no previous snapshot) — that is expected and won\'t trigger alerts.',
      },
      {
        number: 7,
        title: 'Add a Slack notification option',
        description: 'Post the same alert to a #competitive-intel Slack channel using an Incoming Webhook.',
        code: `# slack_alert.py
import os, requests

def send_slack_alert(target_name: str, changes: list[str], analysis: str):
    text = f"*⚠️ Competitor Alert: {target_name}*\\n" + "\\n".join(f"- {c}" for c in changes) + f"\\n\\n_{analysis}_"
    requests.post(os.environ["SLACK_WEBHOOK_URL"], json={"text": text})

# In main.py, alongside (or instead of) send_alert():
# send_slack_alert(target["name"], changes, analysis)`,
        tip: 'Incoming Webhooks (api.slack.com/messaging/webhooks) are simpler than the full Slack SDK for one-way alerts.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Price & Competitor Monitor Agent (starter)
pip install requests beautifulsoup4 anthropic
"""
import json, sqlite3
import requests
from bs4 import BeautifulSoup
from anthropic import Anthropic

claude = Anthropic()
HEADERS = {"User-Agent": "Mozilla/5.0"}

def scrape(target):
    resp = requests.get(target["url"], headers=HEADERS, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")
    price_el = soup.select_one(target["price_selector"])
    return {"price": price_el.get_text(strip=True) if price_el else None}

def main():
    targets = json.load(open("targets.json"))
    conn = sqlite3.connect("snapshots.db")
    conn.execute("CREATE TABLE IF NOT EXISTS snapshots (name TEXT PRIMARY KEY, data TEXT)")

    for target in targets:
        current = scrape(target)
        row = conn.execute("SELECT data FROM snapshots WHERE name=?", (target["name"],)).fetchone()
        previous = json.loads(row[0]) if row else None

        if previous and previous["price"] != current["price"]:
            prompt = f"Competitor {target['name']} price changed from {previous['price']} to {current['price']}. What might this mean?"
            resp = claude.messages.create(model="claude-sonnet-4-5", max_tokens=150,
                messages=[{"role": "user", "content": prompt}])
            print("ALERT:", resp.content[0].text)

        conn.execute("INSERT INTO snapshots VALUES (?,?) ON CONFLICT(name) DO UPDATE SET data=excluded.data",
                      (target["name"], json.dumps(current)))
        conn.commit()

if __name__ == "__main__":
    main()
`,
    resources: [
      { title: 'BeautifulSoup Documentation', url: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/' },
      { title: 'Slack Incoming Webhooks', url: 'https://api.slack.com/messaging/webhooks' },
      { title: 'SQLite3 in Python', url: 'https://docs.python.org/3/library/sqlite3.html' },
    ],
  },
  {
    id: 11,
    title: 'Calendar & Task Prioritizer Agent',
    emoji: '🗓️',
    department: ['Operations'],
    departmentIds: ['operations'],
    difficulty: 'Beginner',
    description:
      'Every morning, reads your Google Calendar and task list, uses Claude to prioritize your day, and sends a structured plan to your email.',
    whatYouBuild:
      'A morning automation that pulls today\'s Google Calendar events and your open tasks, sends both to Claude for prioritization, and emails you a time-blocked schedule with top priorities and energy-management tips before 7am.',
    whatYouLearn: [
      'Authenticate with Google Calendar via a service account',
      'Fetch and format calendar events for a given day',
      'Combine multiple data sources into one prompt',
      'Design a "daily planning" prompt with time-blocking output',
      'Send scheduled emails',
      'Optionally add text-to-speech output',
    ],
    techStack: ['Python', 'Google Calendar API', 'Claude API'],
    buildTime: '2 hrs',
    xp: 250,
    popularity: 76,
    prerequisites: ['Basic Python', 'Google Cloud account'],
    tags: ['productivity', 'calendar', 'planning'],
    session: {
      totalTime: '80 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Pull today\'s events straight from your Google Calendar',
        'Combine your calendar with an open task list',
        'Have Claude turn both into a time-blocked daily plan with priorities and energy tips',
        'Get that plan emailed to you automatically every weekday morning',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A Google Cloud account (free tier is fine)',
        'A Google Calendar you can share with a service account',
        'An email account you can send from (e.g. Gmail with an app password)',
      ],
      builds: [
        {
          number: 1,
          title: 'Connect to Google Calendar',
          time: '25 min',
          description: 'Set up read-only access to your calendar without any browser login flow.',
          steps: [
            {
              instruction: 'In the Google Cloud Console: enable the "Google Calendar API", go to IAM & Admin > Service Accounts, create a service account, and download its JSON key as service_account.json. Then open Google Calendar > Settings > Share with specific people, and share your calendar with the service account\'s email address (it ends in @...iam.gserviceaccount.com) with "See all event details" permission.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create calendar_reader.py for a Python project. It should:\n1. Use google-auth and google-api-python-client to authenticate with service_account.json (read-only Calendar scope)\n2. Have a get_today_events(calendar_id="primary") function that returns today\'s events as a list of {"summary": ..., "start": ..., "description": ...} dicts, handling both timed events (dateTime) and all-day events (date)\n3. Print the result when run directly\n\nAlso create requirements.txt with google-auth, google-api-python-client, and anthropic.',
              verify: 'Run calendar_reader.py — it should print a list of today\'s events. If you get a permission error, double-check the calendar is shared with the exact service account email.',
            },
          ],
          goFurther: 'Try running it on a day with no events and a day with several — confirm both cases work without errors.',
        },
        {
          number: 2,
          title: 'Add your tasks and build the Claude planner',
          time: '30 min',
          description: 'This is the core of the agent — turning your raw schedule and to-dos into an actual plan.',
          steps: [
            {
              instruction: 'Create a tasks.txt file in your project folder with your open tasks, one per line, e.g.:\n- Finish Q3 budget review\n- Reply to vendor contract email\n- Prep slides for Friday demo\n- Review pull request #482',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now build the planning layer:\n\n1. tasks_reader.py with get_tasks_from_file(path="tasks.txt") that reads each non-empty line, stripping leading "- " markers, and returns a list of task strings\n2. planner.py with plan_day(events, tasks) that sends both lists to Claude (model "claude-sonnet-4-5", max_tokens 900) with a prompt asking for: (1) a time-blocked schedule that fits tasks around meetings, (2) the top 3 priorities with reasoning, (3) two energy-management tips based on how busy the day looks. Handle the case where events or tasks are empty.\n3. A main.py that calls get_today_events(), get_tasks_from_file(), plan_day(), and prints the result',
              verify: 'Run main.py — you should see a readable daily plan that references your actual calendar events and tasks.txt items, with a clear top-3 priority list.',
            },
          ],
          goFurther: '🛠️ If your calendar is packed, ask Claude to have the planner also flag which tasks realistically won\'t fit today.',
        },
        {
          number: 3,
          title: 'Email it to yourself every morning',
          time: '25 min',
          description: 'The plan only helps if it shows up in your inbox before your day starts.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my daily planner agent:\n\n1. template.py with build_html(plan) that wraps the plan text in a simple HTML email (heading with today\'s date, plan content with line breaks preserved)\n2. mailer.py with send_email(to_email, subject, html_body) using smtplib SMTP_SSL with smtp.gmail.com, reading SMTP_USER and SMTP_PASS from environment variables\n3. Update main.py to build the HTML and call send_email() with subject "Your Daily Plan"\n\nThen tell me the crontab line to run this at 6:30am on weekdays only.',
              verify: 'Run main.py and check your inbox for a "Your Daily Plan" email with a readable, time-blocked schedule. Then add the crontab line Claude gives you.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add an optional voice mode using pyttsx3 (offline) that reads the plan aloud when you run the script with a --speak flag.',
        },
      ],
      portfolio: 'You just built a personal AI chief-of-staff that plans your day before you wake up. Take a screenshot of one of your morning plan emails (redact anything private), and add "Calendar & Task Prioritizer Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a daily planning agent: it pulls today\'s events from Google Calendar, combines them with my open tasks, and uses Claude to generate a time-blocked schedule with top priorities and energy-management tips — emailed to me automatically every weekday morning.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up Google Calendar API',
        description: 'Enable the Calendar API, create a service account, download its JSON key, and share your calendar with the service account email.',
        code: `# 1. console.cloud.google.com -> Enable "Google Calendar API"
# 2. IAM & Admin -> Service Accounts -> Create service account
# 3. Create key (JSON) -> save as service_account.json
# 4. Open Google Calendar -> Settings -> Share with specific people
#    -> add the service account's email (xxx@project.iam.gserviceaccount.com)
#    -> permission: "See all event details"`,
        tip: 'Service accounts avoid the OAuth browser flow entirely — ideal for unattended scheduled jobs.',
      },
      {
        number: 2,
        title: 'Build the calendar reader',
        description: 'Fetch all of today\'s events with their start/end times and descriptions.',
        code: `# calendar_reader.py
from datetime import datetime, timedelta, timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

def get_calendar_service():
    creds = service_account.Credentials.from_service_account_file("service_account.json", scopes=SCOPES)
    return build("calendar", "v3", credentials=creds)

def get_today_events(calendar_id: str = "primary"):
    service = get_calendar_service()
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=start.isoformat(),
        timeMax=end.isoformat(),
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    events = []
    for e in events_result.get("items", []):
        start_time = e["start"].get("dateTime", e["start"].get("date"))
        events.append({"summary": e.get("summary", "(no title)"), "start": start_time, "description": e.get("description", "")})
    return events`,
        tip: 'All-day events have a "date" field instead of "dateTime" — handle both as shown above.',
      },
      {
        number: 3,
        title: 'Integrate the task list',
        description: 'Read open tasks from a plain text file, Notion database, or Todoist API.',
        code: `# tasks_reader.py
def get_tasks_from_file(path: str = "tasks.txt") -> list[str]:
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip("- \\n") for line in f if line.strip()]

# tasks.txt example:
# - Finish Q3 budget review
# - Reply to vendor contract email
# - Prep slides for Friday demo
# - Review pull request #482`,
        tip: 'Swap this function out for a Notion or Todoist API call without changing anything downstream.',
      },
      {
        number: 4,
        title: 'Build the Claude planner',
        description: 'Send the calendar events and task list to Claude, requesting a prioritized, time-blocked plan.',
        code: `# planner.py
from anthropic import Anthropic

client = Anthropic()

def plan_day(events: list[dict], tasks: list[str]) -> str:
    events_text = "\\n".join(f"- {e['start']}: {e['summary']}" for e in events) or "No meetings today."
    tasks_text = "\\n".join(f"- {t}" for t in tasks) or "No open tasks."

    prompt = f"""Today's calendar:
{events_text}

Open tasks:
{tasks_text}

Create a daily plan with:
1. A time-blocked schedule that fits tasks around meetings
2. Top 3 priorities for the day, with reasoning
3. Two energy-management tips (e.g. when to take breaks, batch deep work) based on the schedule's intensity"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text`,
        tip: 'If your calendar is very busy, ask Claude to also flag tasks that realistically won\'t fit today.',
      },
      {
        number: 5,
        title: 'Format the output',
        description: 'Wrap the plan in a simple HTML email template.',
        code: `# template.py
from datetime import date

def build_html(plan: str) -> str:
    today = date.today().strftime("%A, %B %d")
    plan_html = plan.replace("\\n", "<br/>")
    return f"""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>🗓️ Your Daily Plan — {today}</h2>
      <div>{plan_html}</div>
    </body></html>
    """`,
        tip: 'For nicer formatting, ask Claude for Markdown output and convert with markdown2 as in Agent #4.',
      },
      {
        number: 6,
        title: 'Send via email',
        description: 'Send the daily plan email before 7am using the same SMTP approach as Agent #4.',
        code: `# main.py
from calendar_reader import get_today_events
from tasks_reader import get_tasks_from_file
from planner import plan_day
from template import build_html
from mailer import send_email  # reuse from Agent #4

def main():
    events = get_today_events()
    tasks = get_tasks_from_file()
    plan = plan_day(events, tasks)
    html = build_html(plan)
    send_email("you@example.com", "Your Daily Plan", html)
    print("Daily plan sent!")

if __name__ == "__main__":
    main()

# Crontab — runs at 6:30am every weekday:
# 30 6 * * 1-5 /path/to/venv/bin/python /path/to/main.py`,
        tip: 'Schedule it 30 minutes before you typically start work so you have time to review and adjust.',
      },
      {
        number: 7,
        title: 'Add a voice output option',
        description: 'Optionally have the plan read aloud using ElevenLabs (cloud, natural) or pyttsx3 (offline, free).',
        code: `# voice.py
import pyttsx3

def speak_plan(plan_text: str):
    engine = pyttsx3.init()
    engine.setProperty("rate", 175)
    engine.say(plan_text)
    engine.runAndWait()

# For higher quality voice, use ElevenLabs instead:
# import requests
# def speak_with_elevenlabs(text, voice_id, api_key):
#     resp = requests.post(
#         f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
#         headers={"xi-api-key": api_key},
#         json={"text": text, "model_id": "eleven_monolingual_v1"},
#     )
#     with open("plan.mp3", "wb") as f:
#         f.write(resp.content)`,
        tip: 'pyttsx3 works fully offline and is great for a quick "read my plan while I make coffee" feature.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Calendar & Task Prioritizer Agent (starter)
pip install google-auth google-api-python-client anthropic
"""
from datetime import datetime, timedelta, timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build
from anthropic import Anthropic

claude = Anthropic()
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

def get_today_events():
    creds = service_account.Credentials.from_service_account_file("service_account.json", scopes=SCOPES)
    service = build("calendar", "v3", credentials=creds)
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    result = service.events().list(calendarId="primary", timeMin=start.isoformat(),
        timeMax=end.isoformat(), singleEvents=True, orderBy="startTime").execute()
    return [e.get("summary", "(no title)") for e in result.get("items", [])]

def main():
    events = get_today_events()
    tasks = ["Finish Q3 budget review", "Reply to vendor email", "Prep demo slides"]

    prompt = f"""Calendar today: {events}\\nOpen tasks: {tasks}
Create a time-blocked daily plan with top 3 priorities and 2 energy tips."""
    resp = claude.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    print(resp.content[0].text)

if __name__ == "__main__":
    main()
`,
    resources: [
      { title: 'Google Calendar API', url: 'https://developers.google.com/calendar/api' },
      { title: 'Service Accounts Guide', url: 'https://cloud.google.com/iam/docs/service-account-overview' },
      { title: 'pyttsx3 Documentation', url: 'https://pyttsx3.readthedocs.io' },
    ],
  },
  {
    id: 12,
    title: 'Basic Data Extractor Agent',
    emoji: '🧮',
    department: ['Data & Analytics'],
    departmentIds: ['data'],
    difficulty: 'Beginner',
    description:
      'Paste unstructured text (emails, PDFs, web pages) and extract structured data — names, dates, numbers, entities — into a clean CSV.',
    whatYouBuild:
      'A batch processing tool that takes a folder of text files, sends each to Claude with a structured-extraction prompt and a defined JSON schema, validates the output, and compiles everything into a single CSV using pandas.',
    whatYouLearn: [
      'Define extraction schemas for structured output',
      'Engineer prompts that reliably return valid JSON',
      'Validate LLM output against a schema',
      'Convert JSON records to a pandas DataFrame and CSV',
      'Build a folder-based batch processor',
      'Measure extraction accuracy against ground truth',
    ],
    techStack: ['Python', 'Claude API', 'pandas'],
    buildTime: '1.5 hrs',
    xp: 220,
    popularity: 82,
    prerequisites: ['Basic Python', 'Basic pandas familiarity'],
    tags: ['data-extraction', 'automation', 'csv'],
    session: {
      totalTime: '70 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Define a custom extraction schema for the fields you care about',
        'Have Claude turn messy text into clean, validated JSON records',
        'Batch-process a whole folder of documents into one CSV',
        'Measure extraction accuracy against known answers',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A folder of 5-10 sample text files (emails, invoices, notes — whatever you want to extract from)',
        'Basic familiarity with pandas/CSV',
      ],
      builds: [
        {
          number: 1,
          title: 'Define your schema and build the extractor',
          time: '25 min',
          description: 'Decide what fields matter, then have Claude pull them out as JSON.',
          steps: [
            {
              instruction: 'Look at 2-3 of your sample documents and list the 4-6 fields you want extracted (e.g. person_name, company, date, amount, email, summary).',
            },
            {
              instruction: 'Paste this prompt into Claude, substituting your own field list:',
              prompt: 'I want to extract structured data from text documents. My fields are:\n\n[list your fields, e.g.:\n- person_name: Full name of the primary person mentioned, or null\n- company: Company name mentioned, or null\n- date: Any date mentioned, in YYYY-MM-DD format, or null\n- amount: Any monetary amount as a number, or null\n- email: Any email address mentioned, or null\n- summary: One-sentence summary of the document\'s purpose]\n\nPlease create:\n1. schema.py with an EXTRACTION_SCHEMA dict matching these fields and descriptions\n2. extractor.py with extract_data(text) that builds a prompt listing the schema fields, sends it to Claude (model "claude-sonnet-4-5", max_tokens 400) asking for ONLY a JSON object with exactly these keys, and parses + returns the JSON\n3. requirements.txt with anthropic and pandas',
              verify: 'Run extract_data() on one sample document\'s text. You should get back a JSON dict with all your schema keys, with sensible values (or null where info is missing).',
            },
          ],
          goFurther: 'Try a document that\'s missing several fields entirely — confirm Claude returns null rather than making something up or breaking the JSON.',
        },
        {
          number: 2,
          title: 'Validate output and export to CSV',
          time: '20 min',
          description: 'Make the pipeline robust even when Claude\'s output is slightly inconsistent.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now add validation and export to my extraction tool:\n\n1. validator.py with validate_record(record) that ensures every key in EXTRACTION_SCHEMA is present in the output dict, filling in None for any missing keys\n2. input_handler.py with read_input(source) that reads a file if the source is a valid file path, otherwise treats the source as raw text\n3. exporter.py with export_csv(records, output_path="extracted_data.csv") that converts a list of dicts to a pandas DataFrame and writes it to CSV, returning the output path',
              verify: 'Manually call validate_record() on a dict missing one key, and confirm it comes back with that key set to null. Then export a list of 2-3 validated records and open the resulting CSV to confirm the columns look right.',
            },
          ],
          goFurther: '🛠️ Ask Claude to add a source_file column so each row in the CSV traces back to its original document.',
        },
        {
          number: 3,
          title: 'Batch process a folder and check accuracy',
          time: '25 min',
          description: 'Run it on everything at once, then sanity-check how well it\'s doing.',
          steps: [
            {
              instruction: 'Put all your sample text files into a folder called documents/. Paste this prompt into Claude:',
              prompt: 'Create main.py with a process_folder(folder_path) function that loops over every .txt file in the folder, reads it with read_input(), extracts data with extract_data(), validates it with validate_record(), adds a source_file field with the filename, and collects all records into a list. In the main block, call process_folder("documents"), export the results with export_csv(), and print how many records were saved.',
              verify: 'Run main.py — it should print "Processed <filename>" for each file, then "Saved N records to extracted_data.csv". Open the CSV and check that each row\'s data matches its source document.',
            },
            {
              instruction: 'Pick 5 documents, write down what you\'d expect each field to be, then ask Claude:',
              prompt: 'Create test_accuracy.py that reads a ground_truth.json file (a list of {"file": ..., "expected": {field: value, ...}}), runs extract_data() on each file, compares each expected field to the extracted value (case-insensitive), and prints the overall field-level accuracy as a percentage.',
              verify: 'Run test_accuracy.py. If accuracy is below ~85% on any field, add a short example of a correct extraction for that field into the prompt in extractor.py (few-shot) and re-run.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a --watch mode that re-processes the documents/ folder every time a new file is added, using the watchdog library.',
        },
      ],
      portfolio: 'You just built a reusable data extraction pipeline that turns messy documents into clean spreadsheets. Take a screenshot of your CSV output next to a sample input document, and add "Basic Data Extractor Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a data extraction agent: it takes a folder of unstructured text documents, uses Claude to extract a custom set of fields as validated JSON, and compiles everything into a single CSV with pandas — plus a script to measure extraction accuracy against ground truth.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Define the extraction schema',
        description: 'Decide which fields you want extracted from each document — for example, contact info from emails or line items from invoices.',
        code: `# schema.py
EXTRACTION_SCHEMA = {
    "person_name": "Full name of the primary person mentioned, or null",
    "company": "Company name mentioned, or null",
    "date": "Any date mentioned, in YYYY-MM-DD format, or null",
    "amount": "Any monetary amount mentioned as a number (no currency symbol), or null",
    "email": "Any email address mentioned, or null",
    "summary": "One-sentence summary of the document's purpose",
}`,
        tip: 'Start with 4-6 fields — you can always add more once you see how well the basics work.',
      },
      {
        number: 2,
        title: 'Build the Claude extractor',
        description: 'Build a prompt that asks Claude to fill in the schema as JSON for any given text.',
        code: `# extractor.py
import json
from anthropic import Anthropic
from schema import EXTRACTION_SCHEMA

client = Anthropic()

def extract_data(text: str) -> dict:
    schema_description = "\\n".join(f'- "{k}": {v}' for k, v in EXTRACTION_SCHEMA.items())

    prompt = f"""Extract the following fields from this text. If a field isn't present, use null.

Fields:
{schema_description}

Text:
{text[:6000]}

Respond ONLY with a JSON object using exactly these keys: {list(EXTRACTION_SCHEMA.keys())}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.content[0].text)`,
        tip: 'Listing the exact expected keys at the end of the prompt significantly reduces missing/extra fields.',
      },
      {
        number: 3,
        title: 'Build the input handler',
        description: 'Accept a single string, a file, or read from the clipboard.',
        code: `# input_handler.py
def read_input(source: str) -> str:
    import os
    if os.path.isfile(source):
        with open(source, "r", encoding="utf-8") as f:
            return f.read()
    return source  # treat as raw text`,
        tip: 'Reuse the clipboard handler from Agent #5 if you want a "paste and extract" workflow.',
      },
      {
        number: 4,
        title: 'Build the JSON validator',
        description: 'Ensure Claude\'s output matches the expected schema and fill in any missing keys with null.',
        code: `# validator.py
from schema import EXTRACTION_SCHEMA

def validate_record(record: dict) -> dict:
    validated = {}
    for key in EXTRACTION_SCHEMA:
        validated[key] = record.get(key, None)
    return validated`,
        tip: 'This defensive step prevents pandas from erroring out on rows with inconsistent columns.',
      },
      {
        number: 5,
        title: 'Build the CSV exporter',
        description: 'Convert a list of validated records into a pandas DataFrame and write to CSV.',
        code: `# exporter.py
import pandas as pd

def export_csv(records: list[dict], output_path: str = "extracted_data.csv"):
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    return output_path`,
        tip: 'Open the CSV in a spreadsheet tool right after export to spot-check a few rows for quality.',
      },
      {
        number: 6,
        title: 'Build the batch processor',
        description: 'Process every .txt file in a folder automatically.',
        code: `# main.py
import os
from input_handler import read_input
from extractor import extract_data
from validator import validate_record
from exporter import export_csv

def process_folder(folder_path: str) -> list[dict]:
    records = []
    for filename in os.listdir(folder_path):
        if not filename.endswith(".txt"):
            continue
        path = os.path.join(folder_path, filename)
        text = read_input(path)
        record = extract_data(text)
        record = validate_record(record)
        record["source_file"] = filename
        records.append(record)
        print(f"Processed {filename}")
    return records

if __name__ == "__main__":
    records = process_folder("documents")
    output = export_csv(records)
    print(f"Saved {len(records)} records to {output}")`,
        tip: 'Add a small time.sleep(0.5) between calls if you are processing hundreds of files, to stay under rate limits.',
      },
      {
        number: 7,
        title: 'Test accuracy',
        description: 'Run the extractor on 10 sample documents with known answers and measure field-level accuracy.',
        code: `# test_accuracy.py
import json
from extractor import extract_data

# ground_truth.json: list of {"file": "...", "expected": {...}}
ground_truth = json.load(open("ground_truth.json"))

correct, total = 0, 0
for item in ground_truth:
    text = open(item["file"], encoding="utf-8").read()
    extracted = extract_data(text)
    for key, expected_value in item["expected"].items():
        total += 1
        if str(extracted.get(key)).strip().lower() == str(expected_value).strip().lower():
            correct += 1

print(f"Field-level accuracy: {correct}/{total} = {correct/total:.1%}")`,
        tip: 'If accuracy is below ~85% on a field, add an example of correct extraction for that field directly into the prompt (few-shot).',
      },
    ],
    starterCode: `"""
AgentForge Academy — Basic Data Extractor Agent (starter)
pip install anthropic pandas
"""
import os, json
import pandas as pd
from anthropic import Anthropic

client = Anthropic()

SCHEMA = ["person_name", "company", "date", "amount", "email", "summary"]

def extract_data(text):
    prompt = f"""Extract these fields as JSON (use null if missing): {SCHEMA}
Text: {text[:6000]}
Respond ONLY with a JSON object using exactly these keys."""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def main(folder):
    records = []
    for filename in os.listdir(folder):
        if filename.endswith(".txt"):
            text = open(os.path.join(folder, filename), encoding="utf-8").read()
            record = extract_data(text)
            record["source_file"] = filename
            records.append(record)

    df = pd.DataFrame(records)
    df.to_csv("extracted_data.csv", index=False)
    print(f"Saved {len(records)} records to extracted_data.csv")

if __name__ == "__main__":
    main("documents")
`,
    resources: [
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
      { title: 'JSON Schema', url: 'https://json-schema.org/' },
    ],
  },
];
