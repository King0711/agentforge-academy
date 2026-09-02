# Calendar & Task Prioritizer Agent — starter project

Build a morning agent that reads today's Google Calendar events and your
open tasks, and uses Claude to turn both into a time-blocked plan for the day.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Paste your AI Builder key from your dashboard (Credits → Copy my key)
4. Follow Build 2 in the course guide to download `credentials.json` from
   Google Cloud Console and put it in this same folder
5. `python main.py`

No AI subscription and no API key from any AI company is needed. Your
AI Builder credits come with the course.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `calendar_client.py` | Logs into Google Calendar and fetches today's events. |
| `tasks.py` | Reads your open tasks from `tasks.txt`. |
| `prioritizer.py` | Turns events + tasks into a time-blocked plan. **Edit this one.** |
| `main.py` | Runs the whole pipeline and saves `todays_plan.txt`. |

## A simplification worth knowing about

The course description mentions the plan being emailed to you. This starter
project prints the plan and saves it to `todays_plan.txt` instead of sending
real email — that way the only account you need for the core build is Google
Calendar, not an SMTP app password too. Wiring up real email sending is a
`goFurther` stretch once the core agent is working end to end.
