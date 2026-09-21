# Code Review Agent — starter project

Build a GitHub App that reviews every pull request automatically:
fetches the diff, has the AI flag real issues by severity with a
line-number guard against hallucinated locations, and posts the
review back as a comment — never auto-merging or auto-approving.

## Setup

1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Add your AI key to `.env` - a free Gemini key (aistudio.google.com/apikey) or your own Claude/Anthropic key (console.anthropic.com/settings/keys)
4. Register a GitHub App (see the session guide's Build 1) and download its `private-key.pem`
5. Run `python webhook.py`, and point ngrok at it so GitHub's webhook can reach your machine
6. Open a real pull request on your throwaway test repo

You pick which AI powers this project - Gemini's free tier costs nothing, or use your own Claude/Anthropic account if you already have one. See `sdt_ai.py` for full setup steps.

## The files

| File | What it does |
|------|--------------|
| `sdt_ai.py` | Talks to the AI. Same in every project — you never edit it. |
| `github_client.py` | Authenticates as your GitHub App and fetches a PR's diff. |
| `parse.py` | Flattens the AI's per-file comments into one sorted list, worst severity first. |
| `reviewer.py` | The core prompt: reviews one file's diff, with a guard that drops any comment pointing at a line that doesn't exist. **Edit this one.** |
| `summary.py` | Scores the PR overall from its individual comments. |
| `decide.py` | Decides COMMENT / REQUEST_CHANGES / APPROVE - safety-forced to COMMENT-only by default. |
| `post_review.py` | Posts the finished review back to GitHub. |
| `webhook.py` | Receives GitHub's webhook, verifies its signature, and runs the whole pipeline. |

## Files this project creates but you never edit by hand

| File | Where it comes from |
|------|----------------------|
| `private-key.pem` | Downloaded from your GitHub App's settings page |

Keep it out of version control the same way you keep `.env` out of it — it proves your app's identity to GitHub.
