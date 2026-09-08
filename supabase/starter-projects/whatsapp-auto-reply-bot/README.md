# WhatsApp Auto-Reply Bot — starter project

Build a webhook that receives WhatsApp messages through Twilio, understands
them, and replies 24/7 in your own voice using a persona file.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. Edit `persona.py` so the bot sounds like you, not the example designer
5. `python app.py` (starts the webhook on port 3000)
6. Point Twilio's WhatsApp Sandbox webhook at your server (see the session
   guide for the ngrok steps) and message your sandbox number

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `persona.py` | Your bot's name, tone, and hard rules. **Edit this one first.** |
| `reply.py` | Builds the prompt from persona + incoming message, calls the AI, returns the reply text. |
| `app.py` | The Flask webhook Twilio calls on every incoming message. Run this to go live. |
| `test_app.py` | Proves the webhook + TwiML formatting work, without spending credits or needing the internet. |

## Why Flask, not Streamlit

The Social Media Post Generator has a screen you click. This project
doesn't — WhatsApp is the whole interface, and Twilio's servers call
yours automatically whenever a message arrives. Flask is a small library
for exactly that: answering requests from other programs, not from a
person clicking a button.
