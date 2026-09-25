-- ============================================================================
-- Course guides: bring third-party service steps up to date (2026-09-25)
--
-- Checked against each vendor on 2026-09-25:
--   * HubSpot: private-app creation is disabled for new accounts from
--     2026-09-28 (existing: 2026-10-26); Service Keys (Settings > Integrations
--     > Service Keys) replace them and are used as the same Bearer token.
--     Guides 9, 14, 24. #14 also listed a notes scope its setup never asks for.
--   * Buffer: the REST API (api.bufferapp.com, access token + profile ID) is
--     retired; the current API is GraphQL at api.buffer.com with a personal
--     API key and createPost(channelId, mode: addToQueue). Guide 15.
--   * Airtable: plain API keys were retired in 2024; personal access tokens
--     replace them (same Bearer header). Guide 20.
--   * DataForSEO: auth uses the API login + API password from Dashboard >
--     API Access, which is not the account password. Guide 21.
--   * ngrok needs a free account and a one-time authtoken. Guides 2, 9, 19.
--   * Railway: one-time $5 trial for 30 days, then $1/month of free usage;
--     docs moved to docs.railway.com. Guides 2, 9.
--   * Port 5000 is taken by AirPlay Receiver on current macOS: 9 and 19 use
--     5050 instead.
--   * Guide 4 stored its resource links under "label", but the page renders
--     "title", so all four links showed up blank.
--
-- 29 guarded edits to course_content rows 2, 4, 9, 14, 15, 19, 20, 21, 24.
-- Each edit checks the current value first (md5 for text, exact match for
-- structured values) and the whole migration aborts, changing nothing, on
-- any mismatch. Section 1 is checksummed so a copy/paste slip also aborts.
-- Backup of the touched rows: public.course_content_backup_20260925_services (RLS on, anon and
-- authenticated revoked). Run as ONE transaction (SQL editor, apply_migration,
-- or psql -1); the temp table is ON COMMIT DROP, so a non-transactional run
-- fails before writing anything.
--
-- Rollback (touched rows only):
--   update public.course_content c set session = b.session,
--          troubleshooting = b.troubleshooting, resources = b.resources,
--          updated_at = b.updated_at
--     from public.course_content_backup_20260925_services b where b.course_id = c.course_id;
-- ============================================================================

-- 1. The edits, in order.
create temp table content_edits (
  ord int primary key, course_id int not null, col text not null check (col in ('session','troubleshooting','resources')),
  path text[] not null, kind text not null check (kind in ('str','json')),
  old_md5 text, old_json text, new_text text not null
) on commit drop;

insert into content_edits values
  (1, 9, 'session', '{builds,2,steps,0,instruction}', 'str', '106be93c294258a00e811bcb2e48fa5d', null,
    $n$In HubSpot, go to Settings > Integrations > Service Keys, create a key with the crm.objects.contacts.read/write and crm.objects.tasks.write scopes, and copy the key into your .env as HUBSPOT_API_KEY. (Service Keys replace private apps, which HubSpot stops letting you create from September 2026; you need Super Admin or Developer tools access to make one.) Then in Settings > Properties, create three custom contact properties: lead_score (Number), lead_tier (Single-line text), and ai_notes (Multi-line text) - hubspot_client.py assumes these already exist.$n$),
  (2, 9, 'session', '{whatYouNeed,2}', 'str', 'e6823cd24e012ebab16a80eebd37bc85', null,
    $n$A HubSpot account (the free CRM tier works) with a Service Key$n$),
  (3, 9, 'troubleshooting', '{1,fix}', 'str', '02a462b276a5375ce39e6b56c294278e', null,
    $n$Your Service Key is missing scopes, or HUBSPOT_API_KEY isn't set in your .env. In HubSpot, open Settings > Integrations > Service Keys, edit the key and make sure crm.objects.contacts.read and crm.objects.contacts.write are both enabled.$n$),
  (4, 14, 'session', '{builds,0,steps,1,instruction}', 'str', 'f0562cf93dc1257cb45e56c718ee16bd', null,
    $n$In HubSpot, go to Settings > Integrations > Service Keys, create a key with crm.objects.deals.read/write, crm.objects.contacts.read, and crm.objects.companies.read scopes, and copy the key into your .env as HUBSPOT_TOKEN. (Service Keys replace private apps, which HubSpot stops letting you create from September 2026; you need Super Admin or Developer tools access to make one.)$n$),
  (5, 14, 'session', '{whatYouNeed,2}', 'str', 'ba476d86cd81f2fb622634e08dc9b910', null,
    $n$A HubSpot account (free tier works) with a Service Key$n$),
  (6, 14, 'troubleshooting', '{0,fix}', 'str', '0286e399225991b1bb669f9e51e74352', null,
    $n$Your Service Key is missing scopes. Check that crm.objects.deals.read, crm.objects.contacts.read, and crm.objects.companies.read are all enabled (the ones the setup step lists).$n$),
  (7, 24, 'session', '{whatYouNeed,4}', 'str', '143005a5045f363ff957862654a14e7d', null,
    $n$Optional: a HubSpot account with a Service Key (Settings > Integrations > Service Keys) for the CRM push$n$),
  (8, 15, 'session', '{builds,3,steps,0,instruction}', 'str', '81e7db2dd51fc82015ff11419beed934', null,
    $n$Create a personal API key in Buffer (free accounts get one; see developers.buffer.com/guides/getting-started.html) and look up the ID of the LinkedIn channel to post to (developers.buffer.com/guides/your-first-post.html shows how). Add them to .env as BUFFER_API_KEY and BUFFER_CHANNEL_ID, and set that channel's posting schedule in Buffer to the slots you want (e.g. Mon-Fri at 9am).$n$),
  (9, 15, 'session', '{builds,3,steps,1,prompt}', 'str', 'c3495b6575a16926e541fee4e8578f2d', null,
    $n$Finish my LinkedIn content generator:

1. schedule_post.py with schedule_to_buffer(api_key, channel_id, text) that sends Buffer's GraphQL createPost mutation to https://api.buffer.com (header Authorization: Bearer <api_key>) with channelId, text, schedulingType: automatic and mode: addToQueue, and raises an error with Buffer's message if the response is a MutationError (Buffer retired its old REST API, so not api.bufferapp.com)
2. Wire app.py's "Approve & Schedule" buttons to call schedule_to_buffer() with the edited text + hashtags appended (Buffer's queue puts each one in the channel's next free posting slot)
3. feedback.py with update_persona_with_results(persona_path, top_post, engagement) that appends a "Performance note" line to persona.txt describing what worked$n$),
  (10, 15, 'session', '{whatYouNeed,3}', 'str', 'd4211356326e3870e4fc8202b5ba8e37', null,
    $n$A Buffer account for scheduling (the free plan works and includes one API key)$n$),
  (11, 15, 'troubleshooting', '{2}', 'json', null, $o${"fix": "Your access token has expired or you are pointing at the wrong workspace ID. Regenerate the token from the platform's developer settings.", "issue": "401 from the Buffer/Postiz API"}$o$,
    $n${"issue": "401 or \"unauthorized\" from the Buffer API", "fix": "Your Buffer API key is wrong or was revoked. Create a new one in Buffer, update BUFFER_API_KEY in .env, and make sure it is sent as \"Authorization: Bearer <key>\"."}$n$),
  (12, 15, 'troubleshooting', '{3,fix}', 'str', 'ab896a79589eb17f63a9128b0582588f', null,
    $n$Buffer adds each post to the channel's queue at its next open posting slot. If posts land too close together, add or change that channel's posting-schedule slots in Buffer.$n$),
  (13, 20, 'session', '{builds,0,steps,2,instruction}', 'str', '804ef876effdf5d3c3b8edaaa1427253', null,
    $n$In Airtable, create a base with a "Candidates" table containing fields: Name (text), Email (text), Score (number), Strengths (long text), Gaps (long text), Recommendation (single select: Strong Yes/Yes/Maybe/No). Create a view sorted by Score descending. Copy your Base ID (the part of the base's URL that starts with "app"), then create a personal access token at airtable.com/create/tokens with the data.records:write scope and access to this base. Airtable retired plain API keys in 2024; this token is what the code calls api_key.$n$),
  (14, 20, 'session', '{builds,2,steps,0,prompt}', 'str', 'c01be7a725aa0fd0573dfdb604f5af37', null,
    $n$Add to my HR screening agent:

1. airtable_write.py with push_to_airtable(base_id, table, api_key, record) that POSTs a record to the Airtable REST API (https://api.airtable.com/v0/{base_id}/{table}, sending api_key, an Airtable personal access token, as "Authorization: Bearer <api_key>") with the record dict as "fields"
2. batch.py with process_all(folder="cvs") that reads jd.txt, loops over read_cvs(folder), calls extract_contact() and score_candidate() for each, and pushes a record to Airtable with Name, Email, Score (=overall_score), Strengths (joined with newlines), Gaps (joined with newlines), and Recommendation. Add a small sleep(0.25) between Airtable calls to stay under the rate limit, and print "Processed {name}: {score}/10" for each.$n$),
  (15, 21, 'session', '{builds,0,steps,1,instruction}', 'str', '53b7b641774acb53b7568374fba01624', null,
    $n$Sign up at dataforseo.com, then open Dashboard > API Access and add your API login and API password to your .env as DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD. The API password is generated for you and is not the password you log in with.$n$),
  (16, 21, 'troubleshooting', '{0,fix}', 'str', '3dd79817284b81583e2ac63fc0dd5206', null,
    $n$DataForSEO uses Basic Auth with the API login and API password from Dashboard > API Access — not your account password, and not a bearer token.$n$),
  (17, 2, 'session', '{builds,0,steps,1,instruction}', 'str', 'fc2727b05f89739ee656a218d9c6aab3', null,
    $n$Install ngrok (ngrok.com/download), create a free ngrok account and run `ngrok config add-authtoken <your-token>` once (the token is on your ngrok dashboard; ngrok will not start without it), then run `ngrok http 3000` in a terminal. Keep this running - you'll point Twilio at the https URL it gives you.$n$),
  (18, 2, 'session', '{whatYouNeed,4}', 'str', '4d5884df4943c3eb4c3b1663a931a8c3', null,
    $n$A Railway account (railway.com) for deployment. New accounts get a one-time $5 trial credit for 30 days; after that the free plan includes only $1 of usage a month, so a bot that stays online all month usually needs the $5/month Hobby plan.$n$),
  (19, 2, 'resources', '{2,url}', 'str', '8e64af004b91d05bea36d0cd6ec61075', null,
    $n$https://docs.railway.com$n$),
  (20, 9, 'session', '{builds,3,steps,0,prompt}', 'str', 'bc2960d3e8dc8a11be3625e334bded42', null,
    $n$"""
Step 4 of the Lead Capture & Qualifier Bot - the Flask app that ties
webhook parsing, AI scoring and HubSpot together.

Test the wiring:    python main.py
Run the real server: flask --app main run --port 5050

This file deliberately contains almost no logic of its own - parsing
lives in webhook.py, scoring in scorer.py, HubSpot payloads in
hubspot_client.py. main.py's only job is calling them in the right
order and turning the result into an HTTP response. If a step's own
behaviour ever needs fixing, you'll know exactly which file to open.
"""

from flask import Flask, request, jsonify

import hubspot_client
import scorer
from sdt_ai import AIError
from webhook import parse_typeform_payload

app = Flask(__name__)


@app.route("/webhook/typeform", methods=["POST"])
def typeform_webhook():
    payload = request.get_json(force=True, silent=True) or {}
    lead = parse_typeform_payload(payload)

    # Typeform only omits an answer if a question was skipped or bypassed
    # by Logic Jump - but a lead with no email is useless to a sales
    # team, so it's worth catching explicitly here rather than letting
    # HubSpot reject it later with a less obvious error.
    if not lead.get("email"):
        return jsonify({"status": "ignored", "reason": "no email in submission"}), 200

    try:
        result = scorer.score_lead(lead)
    except AIError as problem:
        # Returning 500 here would make Typeform retry the delivery a
        # few minutes later, which would score (and could HubSpot-create)
        # the same lead twice. Returning 200 with an error status stops
        # the retry - you catch the failure by checking your own logs or
        # Credits page, not by Typeform hammering the same URL.
        return jsonify({"status": "error", "stage": "scoring", "error": str(problem)}), 200
    except ValueError as problem:
        return jsonify({"status": "error", "stage": "scoring", "error": str(problem)}), 200

    try:
        contact_id = hubspot_client.create_contact(lead, result)
        hubspot_client.create_followup_task(contact_id, lead, result)
    except Exception as problem:
        # requests' raise_for_status() raises an error with HubSpot's own
        # message attached - showing str(problem) surfaces the real cause
        # (a missing scope, an unknown property) instead of hiding it
        # behind a bare "500 Internal Server Error".
        return jsonify({"status": "error", "stage": "hubspot", "error": str(problem)}), 200

    return jsonify({
        "status": "ok",
        "email": lead["email"],
        "score": result["score"],
        "tier": result["tier"],
        "contact_id": contact_id,
    }), 200


if __name__ == "__main__":
    # Run this file on its own to check the pipeline is wired correctly:
    # python main.py
    #
    # This proves webhook.py -> scorer.py -> hubspot_client.py are all
    # connected correctly, WITHOUT spending an AI credit or touching a
    # real HubSpot account - it fakes both network calls, clearly
    # commented below as fakes for this test only. To run the real
    # server against real Typeform submissions, use the Flask CLI
    # instead: flask --app main run --port 5050

    FAKE_TYPEFORM_PAYLOAD = {
        "event_id": "LtWXD3crgy",
        "event_type": "form_response",
        "form_response": {
            "form_id": "abc123",
            "definition": {
                "fields": [
                    {"id": "f_name", "title": "Full name", "type": "short_text"},
                    {"id": "f_email", "title": "Work email", "type": "email"},
                    {"id": "f_company", "title": "Company name", "type": "short_text"},
                    {"id": "f_size", "title": "Company size", "type": "multiple_choice"},
                    {"id": "f_budget", "title": "Budget range", "type": "multiple_choice"},
                    {"id": "f_challenge", "title": "What's your biggest challenge right now?", "type": "long_text"},
                ],
            },
            "answers": [
                {"type": "text", "text": "Jane Okafor", "field": {"id": "f_name"}},
                {"type": "email", "email": "jane@acme.com", "field": {"id": "f_email"}},
                {"type": "text", "text": "Acme Inc", "field": {"id": "f_company"}},
                {"type": "choice", "choice": {"label": "51-200"}, "field": {"id": "f_size"}},
                {"type": "choice", "choice": {"label": "$5k-$10k/month"}, "field": {"id": "f_budget"}},
                {"type": "text", "text": "Our reporting is all manual spreadsheets.", "field": {"id": "f_challenge"}},
            ],
        },
    }

    # FAKE for this test only: a canned AI reply, so this test costs zero
    # credits and works even with no .env file at all. score_lead()'s own
    # parsing and tier logic - the part actually worth testing here -
    # still runs for real against this fake text.
    def fake_ask_ai(prompt, **kwargs):
        return "[SCORE]\n9\n[REASON]\nStrong fit on size and budget.\n[END]"

    # FAKE for this test only: no real HubSpot account is needed to prove
    # main.py calls create_contact() then create_followup_task() with the
    # right arguments, in the right order.
    def fake_send_to_hubspot(endpoint, payload, api_key):
        if endpoint == "/crm/v3/objects/contacts":
            return {"id": "fake-contact-42"}
        return {"id": "fake-task-99"}

    scorer.ask_ai = fake_ask_ai
    hubspot_client.send_to_hubspot = fake_send_to_hubspot

    with app.test_client() as client:
        response = client.post("/webhook/typeform", json=FAKE_TYPEFORM_PAYLOAD)
        data = response.get_json()

    print("Response:", data)
    assert response.status_code == 200, data
    assert data["status"] == "ok", data
    assert data["score"] == 9
    assert data["tier"] == "hot"
    assert data["contact_id"] == "fake-contact-42"
    print("\nPipeline wiring test passed: webhook -> score -> HubSpot all connected correctly.")$n$),
  (21, 9, 'session', '{builds,3,steps,1,instruction}', 'str', 'ad0a4b573e143037277406b68d283cef', null,
    $n$Run `ngrok http 5050` to get a public URL (ngrok needs a free account: sign up, then run `ngrok config add-authtoken <your-token>` once), then in Typeform go to your form > Connect > Webhooks and add a webhook pointing to <your-ngrok-url>/webhook/typeform. Start the real server with `flask --app main run --port 5050` (5050, not 5000: on a Mac, AirPlay Receiver already uses port 5000).$n$),
  (22, 9, 'session', '{builds,3,steps,2,instruction}', 'str', '7f33de7e843ad5459a1b7abece77db38', null,
    $n$Ask an AI assistant (or follow their docs) how to deploy main.py to an always-on host like Railway or Render (neither keeps a service running 24/7 for free, so check their current plans) so the webhook URL is permanent, then update the Typeform webhook to point at that URL instead of ngrok.$n$),
  (23, 9, 'session', '{whatYouNeed,3}', 'str', '30a5c3d4165af94b614fd5b8e7121344', null,
    $n$ngrok (free account + authtoken) for local webhook testing$n$),
  (24, 19, 'session', '{builds,0,steps,2,instruction}', 'str', 'f061c58d4ea2521bbd55271bcd2380b2', null,
    $n$Run `ngrok http 5050` (ngrok needs a free account: sign up, then run `ngrok config add-authtoken <your-token>` once). Use 5050, not 5000: on a Mac, AirPlay Receiver already uses port 5000, so start your Flask server on 5050 too when you get to it. Then set your GitHub App's webhook URL to <ngrok-url>/webhook, then open your AI coding assistant of choice (Claude Code, Cursor, Gemini CLI, ChatGPT, etc.) and paste this prompt:$n$),
  (25, 19, 'session', '{whatYouNeed,3}', 'str', '0ea8874a86beb39254c0b8ac95f0c628', null,
    $n$ngrok (free account + authtoken) for receiving webhooks locally$n$),
  (26, 4, 'resources', '{0}', 'json', null, $o${"url": "https://make.com", "label": "Make.com — Create free account"}$o$,
    $n${"url": "https://make.com", "title": "Make.com — Create free account"}$n$),
  (27, 4, 'resources', '{1}', 'json', null, $o${"url": "https://aistudio.google.com", "label": "Google AI Studio — Get free Gemini API key"}$o$,
    $n${"url": "https://aistudio.google.com", "title": "Google AI Studio — Get free Gemini API key"}$n$),
  (28, 4, 'resources', '{2}', 'json', null, $o${"url": "https://news.google.com/rss", "label": "Google News RSS format guide"}$o$,
    $n${"url": "https://news.google.com/rss", "title": "Google News RSS format guide"}$n$),
  (29, 4, 'resources', '{3}', 'json', null, $o${"url": "https://myaccount.google.com/apppasswords", "label": "Gmail App Passwords (for authentication)"}$o$,
    $n${"url": "https://myaccount.google.com/apppasswords", "title": "Gmail App Passwords (for authentication)"}$n$);

-- 2. Self-check, pre-flight guards, backup, apply, post-check.
do $$
declare e record; cur jsonb;
begin
  if (select md5(string_agg(h, '' order by h collate "C")) from (
        select md5(concat_ws(E'\x1f', ord::text, course_id::text, col, array_to_string(path, '.'), kind, new_text)) as h
          from content_edits) s) <> '510bb65f7fab9dbd9ddd5bbc256ac5d3' then
    raise exception 'Section 1 is not the reviewed copy - nothing was changed.';
  end if;
  if to_regclass('public.course_content_backup_20260925_services') is not null then
    raise exception 'public.course_content_backup_20260925_services already exists - has this migration already run?';
  end if;
  create table public.course_content_backup_20260925_services as
    select course_id, session, troubleshooting, resources, updated_at from public.course_content
     where course_id in (2, 4, 9, 14, 15, 19, 20, 21, 24);
  alter table public.course_content_backup_20260925_services enable row level security;
  revoke all on public.course_content_backup_20260925_services from anon, authenticated;

  for e in select * from content_edits order by ord loop
    execute format('select %I #> $1 from public.course_content where course_id = $2', e.col)
      into cur using e.path, e.course_id;
    if (e.kind = 'str' and md5(cur #>> '{}') is distinct from e.old_md5)
       or (e.kind = 'json' and cur is distinct from e.old_json::jsonb) then
      raise exception 'edit % (course % %.%) does not match the audited value - nothing was changed',
        e.ord, e.course_id, e.col, array_to_string(e.path, '.');
    end if;
    execute format('update public.course_content set %I = jsonb_set(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)
      using e.path, case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end, e.course_id;
  end loop;

  for e in select * from content_edits order by ord loop
    execute format('select %I #> $1 from public.course_content where course_id = $2', e.col)
      into cur using e.path, e.course_id;
    if cur is distinct from (case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end) then
      raise exception 'post-check: edit % (course %) did not land - rolling back', e.ord, e.course_id;
    end if;
  end loop;
  if exists (select 1 from public.course_content where updated_at = now() and course_id not in (2, 4, 9, 14, 15, 19, 20, 21, 24)) then
    raise exception 'post-check: an untouched row changed - rolling back';
  end if;
end $$;
