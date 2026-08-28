# WhatsApp support agent — setup

Auto-replies to questions about products, prices, and opening hours; hands
everything else to you via email + the `/admin/support` inbox.

- `supabase/functions/whatsapp-support-agent/index.ts` — the webhook
- `supabase/functions/whatsapp-support-agent/knowledge-base.ts` — **what the bot knows; edit this file to change its answers**
- `supabase/whatsapp-support-setup.sql` — tables + admin RPCs
- `src/pages/admin/AdminSupport.jsx` — the escalation inbox

---

## ⚠️ Read this before you start: the phone number

A number connected to the WhatsApp **Cloud API** can no longer be used in the
normal WhatsApp or WhatsApp Business **app**. Registering it moves it to the
API permanently, and moving it back means deleting it from the Business
account and re-verifying — you lose the chat history on that number.

**+234 906 600 6963 is currently live on the site** (the float button, the FAQ
page, the footer). If that number is one you actually chat from, do not
register it. Get a second number for the bot, and either point the site at it
or leave the site pointing at your personal one.

Decide this first — it is the one genuinely hard-to-undo step here.

---

## 1. Meta setup (you have to do this part — it's account-level)

1. **developers.facebook.com** → My Apps → Create App → **Business**.
2. Add the **WhatsApp** product to the app.
3. Under WhatsApp → API Setup, note the **Phone number ID** and the
   **WhatsApp Business Account ID**. Add and verify the bot's phone number.
4. Generate a **permanent** access token: Business Settings → Users → System
   Users → add a system user with the Admin role, assign it the app, then
   Generate Token with `whatsapp_business_messaging` and
   `whatsapp_business_management`. The 24-hour token on the API Setup page is
   for testing only — it will silently break the bot the next day.
5. Copy the **App Secret** from App Settings → Basic.
6. Invent a **verify token** — any random string you choose, e.g.
   `openssl rand -hex 16`. Meta only echoes it back during the handshake.

Leave the webhook step for after deployment (step 4 below).

## 2. Database

Run `supabase/whatsapp-support-setup.sql` in the Supabase SQL editor.

Then confirm the RPCs are locked down — per `CLAUDE.md`, the `is_admin()`
guard inside a function is not sufficient on this project:

```sql
select p.proname, a.grantee::regrole::text, a.privilege_type
from pg_proc p, aclexplode(p.proacl) a
where p.proname like 'admin_%whatsapp%';
```

Every row should be `postgres`, `authenticated`, or `service_role`. If you see
an empty grantee (that's `PUBLIC`) or `anon`, re-run the REVOKE statements.

## 3. Secrets and deploy

```bash
supabase link --project-ref qkrfpuckvymjpewcszgs
```

```bash
supabase secrets set WHATSAPP_TOKEN=EAA... WHATSAPP_PHONE_NUMBER_ID=... WHATSAPP_APP_SECRET=... WHATSAPP_VERIFY_TOKEN=...
```

Only the WhatsApp secrets are new. Three others are already set and reused:

- `GEMINI_API_KEY` — the same key `generate-news-digest` runs on, same model.
- `RESEND_API_KEY` and `ADMIN_NOTIFY_EMAIL` — from the email functions, reused
  for the hand-off notification.

Confirm with `supabase secrets list` (names only, values aren't readable back).
If `GEMINI_API_KEY` isn't listed, set it too.

The webhook must be reachable by Meta without a Supabase JWT, so deploy it
with verification off — the function does its own, stronger check (an HMAC
signature over the request body using your app secret):

```bash
supabase functions deploy whatsapp-support-agent --no-verify-jwt
```

## 4. Point Meta at it

Webhook URL:

```
https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/whatsapp-support-agent
```

In the app dashboard → WhatsApp → Configuration → Edit webhook: paste that
URL, paste your verify token, click Verify and Save, then **Subscribe to the
`messages` field**. Missing that last subscription is the single most common
reason a correctly-deployed bot receives nothing.

## 5. Test

Message the bot's number from your own phone:

| Send | Expect |
|---|---|
| "How much is Builder 1?" | ₦50,000, one-time, 6 months |
| "What are your opening hours?" | The hours from the knowledge base |
| "Do I need to know how to code?" | No — Builder 1 assumes none |
| "I paid but I can't log in" | Holding reply + email to you + row in `/admin/support` |
| "Can I get 50% off?" | Holding reply — discounts always escalate |

Watch logs with `supabase functions logs whatsapp-support-agent`.

---

## Changing what it says

Edit `knowledge-base.ts` and redeploy. The agent answers **only** from that
file — anything not written there gets handed to you instead of guessed at,
which is deliberate. Adding a fact is how you reduce escalations.

`OPENING_HOURS` currently holds placeholder hours. Set your real ones.

## What it will not do

Deliberately, for blast radius: the agent has no tools. It can only read the
knowledge base and write a text reply. It cannot look up a customer's account,
see payments, grant access, issue refunds, or promise anything — every one of
those routes to you. Customer messages are treated as data, and the prompt
tells it to hand off rather than comply if someone tries to instruct it.

## ⚠️ Turn on Gemini billing before real customers message it

The bot runs on `gemini-3.7-flash`. Get the key from Google AI Studio.

The **free tier is fine while you test against your own phone**, but Google's
API terms say free-tier input and output are used to improve their products
and that *human reviewers may read, annotate, and process* it. The input here
is customer support messages — names, and things like "I paid ₦50,000 and
can't log in". Your customers didn't agree to that, and it's the kind of
processing NDPA cares about.

Enabling billing on the project stops both the training use and the human
review. It is a switch in Google AI Studio — **no code change and no
redeploy**, same key, same model.

So: test on free, enable billing before you point real customers at it.

## Cost and limits

- Model calls: free tier covers testing. On paid, Flash is cheap enough that
  low support volume lands in the low hundreds of naira a month.
- Free-tier rate limits are roughly 10–15 requests/minute and a few hundred to
  ~1,500 a day — not the constraint here. The data terms are.
- WhatsApp: replies inside the 24-hour customer service window are free, and
  since the bot only ever replies to an inbound message it is always inside
  that window. No paid message templates needed.
- Abuse guard: after 20 inbound messages from one number in an hour the agent
  stops replying to it. Messages are still logged.

## Checking the voice before you ship

This runs the real prompt against a set of questions — including the same
question three times, so you can see whether the wording actually varies — and
flags any that route the wrong way. No WhatsApp, no Meta, no deploy needed.

Add your Gemini key to `.env` (gitignored) once:

```bash
GEMINI_API_KEY=your-key-here
```

Then, from the project folder:

```bash
npm run test:voice
```

Runs on Node, so there's nothing extra to install — only the edge function
itself needs Deno, and that runs on Supabase, not on your machine.

Re-run it after editing `knowledge-base.ts`. If repeated questions start
coming back identically worded, the facts have drifted back into
pre-written sentences — rewrite them as terse data.
