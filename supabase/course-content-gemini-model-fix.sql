-- ============================================================================
-- Course guides: move the shared Gemini helper (sdt_ai.py) off gemini-2.5-flash
-- and stop Gemini's "thinking" from swallowing short answers.
--
-- Touches course_content rows 1-25 (Builder 1 + Builder 2) ONLY - the
-- `session` and `troubleshooting` columns. Nothing else.
--
-- WHY
--   * sdt_ai.py (pasted into 24 guides; every AI guide except #4) defaults to
--     GEMINI_MODEL="gemini-2.5-flash". Google now answers 404 "no longer
--     available to new users" for API keys created after ~late July 2026, and
--     is shutting the model down for everyone around 2026-10-16..20. Every
--     new student is blocked at the "run python sdt_ai.py" step.
--   * Gemini counts its hidden thinking tokens against maxOutputTokens. The
--     guides call ask_ai with max_tokens 50-300 for short replies (the
--     sdt_ai.py self-test uses 50), which can come back as an empty candidate
--     (finishReason MAX_TOKENS, no parts) -> "Unexpected reply shape".
--   * The live copies had drifted into 6 variants. The step text itself says
--     "it's the same file in every project", so all 24 are replaced with one
--     tested file rather than hand-patching six.
--
-- VERIFIED 2026-09-25 (ai.google.dev itself is blocked from the environment
-- this was written in, so these came from Google's other first-party sources)
--   * generativelanguage.googleapis.com v1beta discovery doc (revision
--     20260925): ThinkingConfig = {thinkingBudget:int, thinkingLevel:enum
--     MINIMAL|LOW|MEDIUM|HIGH, includeThoughts}. thinkingLevel: "Use with
--     earlier models results in an error" -> not safe on 2.5.
--   * google-gemini/cookbook (main): "thinking_budget is still supported by
--     Gemini 3 models"; thinking_budget=0 maps to MINIMAL; Pro models can't
--     turn thinking off. Current Flash models: gemini-3.8-flash (cookbook
--     default), 3.7, 3.6, 3.5-flash-lite.
--   * The live endpoint schema-checks the body before the API key:
--     thinkingConfig.thinkingBudget is accepted, a misspelt field is rejected
--     with "Unknown name". (Probed with a fake key - no quota used.)
--   * ai.google.dev/gemini-api/docs/models (via search index) still documents
--     gemini-flash-latest as the -latest alias: hot-swapped to each new Flash
--     release, 2 weeks' email notice before the target changes. Its exact
--     current target needs a real key to read (models.get); every source puts
--     it on a Gemini 3.x Flash. thinkingBudget:0 is used because it works on
--     2.5 AND 3.x, so a student who pins GEMINI_MODEL keeps working too.
--
-- WHAT CHANGES (for each of the 24 guides that paste sdt_ai.py)
--   1. The sdt_ai.py code block -> the new file below (identical in all 24).
--   2. That step's instruction gets one sentence telling students who already
--      made the file in an earlier project to replace their copy.
--   3. session.model badge: "Google Gemini (gemini-2.5-flash)" ->
--      "Google Gemini (gemini-flash-latest)".
--   4. troubleshooting: the "add GEMINI_MODEL=gemini-2.5-flash as a fallback"
--      tip is rewritten, and one entry is appended for the 404 / "Unexpected
--      reply shape" errors an old copy of the file produces.
--   Guide #4 (Make.com, no sdt_ai.py): "Gemini 1.5 Flash" and the 1.5-era
--   free-tier numbers (15 RPM / 1,500 per day) are replaced - 9 strings.
--
-- SAFETY
--   * Every edit is guarded: the pre-flight check aborts the whole migration,
--     changing nothing, unless every value being replaced still matches the
--     copy this was written against (md5 for the long code blocks, exact text
--     for everything else).
--   * The post-flight check aborts (rolling everything back) unless the end
--     state is exactly as intended.
--   * Backup of the two columns for rows 1-25 is written to
--     public.course_content_backup_20260925 - RLS on, no policies, and
--     anon/authenticated revoked (a CREATE TABLE AS copy does not inherit
--     RLS; see course_content_backup_20260831 in ai-credits-setup.sql).
--
-- HOW TO RUN - must be ONE transaction:
--   Supabase SQL editor (runs the whole script as one transaction), or
--   apply_migration, or `psql -1 -f`. The temp tables are ON COMMIT DROP, so
--   a non-transactional run (plain `psql -f`) fails at the first INSERT,
--   before anything is written.
--
-- NOT COVERED - read before publishing any draft
--   course_content_draft holds 24 unpublished drafts (courses 1-3, 5-25).
--   admin_publish_course_draft() overwrites the whole live row, so publishing
--   one would put back its own sdt_ai.py, which still has gemini-2.5-flash
--   (as a fallback), no thinking config, and the max_tokens=50 self-test.
--   Fix the drafts before publishing any of them.
--
-- ROLLBACK (reverts rows 1-25 to the backup - including any other edits
-- made to those two columns since this ran):
--   update public.course_content c
--      set session = b.session, troubleshooting = b.troubleshooting,
--          updated_at = b.updated_at
--     from public.course_content_backup_20260925 b
--    where b.course_id = c.course_id;
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. All new text, in one place.
-- ----------------------------------------------------------------------------
create temp table gemini_fix_text on commit drop as select
  $t$Google Gemini (gemini-2.5-flash)$t$::text as old_model,
  $t$Google Gemini (gemini-flash-latest)$t$::text as new_model,
  $t$This is the free tier's "high demand" 503 response - it usually clears within a minute. If it keeps happening, add GEMINI_MODEL=gemini-2.5-flash to your .env as a more reliable fallback model.$t$::text as old_tip,
  $t$This is the free tier's "high demand" 503 response - it usually clears within a few minutes. Wait a little and run it again; nothing in your code needs to change.$t$::text as new_tip,
  $t$Gemini error 404 "no longer available", or "Unexpected reply shape from Gemini"$t$::text as new_issue,
  $t$Your sdt_ai.py is an older copy that asks for a Gemini model Google has retired. Replace it with the sdt_ai.py shown in this guide, and if your .env file has a GEMINI_MODEL= line, delete it.$t$::text as new_issue_fix,
  $t$Made sdt_ai.py in an earlier project? If your copy mentions gemini-2.5-flash, replace it with this one - Google has closed that model to new API keys and is retiring it.$t$::text as instruction_note,
  -- The new sdt_ai.py, exactly as students will see it:
  $sdt_ai$"""
Social Dev Technologies - your connection to the AI.

You do NOT need a ChatGPT Plus or Claude Pro subscription, and you do NOT
need to pay for anything. This project runs on Google's Gemini API, which
has a free tier that's enough for everything you'll build in this course.

SETUP (you only do this once, ever):

  1. Go to https://aistudio.google.com/apikey and sign in with any Google
     account. Click "Create API key" - it's free, no card required.
  2. In the same folder as this file, create a file named exactly:  .env
  3. Put ONE line inside it - paste your own key after the = sign:

         GEMINI_API_KEY=paste_your_own_key_here

  4. Never share that key or put it on GitHub.

That's it. Every project in this course uses this same file.
"""

import os
import time

import requests
from dotenv import load_dotenv

# Reads the .env file sitting next to your project and loads GEMINI_API_KEY.
load_dotenv()

# "gemini-flash-latest" is Google's name for whatever its newest Flash model
# is, so this file keeps working when Google retires an older model - which
# it does regularly. You can pin one specific model with GEMINI_MODEL=... in
# your .env, but if you ever get a "not available" error, delete that line.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")

# Gemini "thinks" before it answers, and that hidden thinking counts toward
# the same token limit as the answer itself. With a small max_tokens (the
# 50-300 used for short replies in this course) the thinking could use up
# the whole limit and the answer would come back empty. So ask_ai turns
# thinking down to its minimum (these projects don't need it) and gives
# Gemini this many extra tokens on top of your max_tokens for whatever
# thinking is left.
THINKING_ALLOWANCE = 1024

# The free tier occasionally answers 503 ("model overloaded") during busy
# periods. That's not your code being wrong - retrying a couple of times
# almost always gets a real answer, so it's built in here rather than left
# for every project to handle separately.
MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 3


class AIError(Exception):
    """Something went wrong talking to the AI. The message explains what."""


def _endpoint(api_key):
    return (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={api_key}"
    )


def ask_ai(prompt, system=None, max_tokens=1000, project=None):
    """
    Send a question to the AI and get the answer back as text.

        answer = ask_ai("Write a haiku about Lagos traffic")
        print(answer)

    prompt      - what you want the AI to do. This is the important part.
    system      - optional. Sets the AI's role, e.g. "You are a careful editor."
    max_tokens  - roughly how long the answer may be. 1000 is plenty for most.
    project     - optional label, kept so call sites read the same across
                  every project regardless of which AI is behind this file.

    Returns the AI's answer as a plain string.
    Raises AIError with a readable message if something is wrong.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise AIError(
            "No GEMINI_API_KEY found.\n"
            "Get a free key at https://aistudio.google.com/apikey, then "
            "create a file named .env next to your code containing:\n"
            "    GEMINI_API_KEY=your_key_here"
        )

    generation_config = {"maxOutputTokens": max_tokens + THINKING_ALLOWANCE}
    # thinkingBudget 0 = "as little thinking as possible". Pro models can't
    # turn thinking down and reject this setting, so it's left off for them.
    if "-pro" not in GEMINI_MODEL:
        generation_config["thinkingConfig"] = {"thinkingBudget": 0}

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    last_problem = "no response"
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.post(_endpoint(api_key), json=body, timeout=90)
        except requests.RequestException:
            raise AIError(
                "Could not reach Gemini. Check your internet connection and try again."
            )

        if response.status_code == 503:
            last_problem = "Gemini is busy (503 - high demand on the free tier)"
            time.sleep(RETRY_DELAY_SECONDS)
            continue

        if response.status_code == 429:
            raise AIError(
                "Gemini says you've hit the free tier's rate limit. Wait a "
                "minute and try again - the free tier only allows a "
                "limited number of requests per minute."
            )

        if response.status_code == 404:
            if os.environ.get("GEMINI_MODEL"):
                advice = (
                    "Your .env file sets GEMINI_MODEL - delete that line so this "
                    "file uses its default model, then try again."
                )
            else:
                advice = "Check the course page for an updated copy of sdt_ai.py."
            raise AIError(
                f'Gemini says the model "{GEMINI_MODEL}" isn\'t available to your '
                f"API key - Google retires older models.\n{advice}\n"
                f"Details: {response.text[:300]}"
            )

        if response.status_code == 400:
            # If a future Gemini model ever refuses the thinking setting
            # above, ask again without it instead of failing.
            if "thinkingConfig" in generation_config and "thinking" in response.text.lower():
                del generation_config["thinkingConfig"]
                last_problem = "Gemini rejected the thinking setting"
                continue
            raise AIError(
                f"Gemini rejected the request - double check your GEMINI_API_KEY "
                f"is correct: {response.text[:300]}"
            )

        if response.status_code != 200:
            raise AIError(f"Gemini returned an error (status {response.status_code}): {response.text[:300]}")

        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            block_reason = (data.get("promptFeedback") or {}).get("blockReason")
            if block_reason:
                raise AIError(f"Gemini refused the prompt ({block_reason}). Try rephrasing it.")
            raise AIError(f"Unexpected reply from Gemini: {data}")
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason")

        # A response can come back with no text because Gemini's safety
        # filters blocked it (finishReason == "SAFETY"), not because of a
        # network problem - so this is not retried like the cases above.
        if finish_reason == "SAFETY":
            raise AIError("Gemini declined to answer (safety filter). Try rephrasing your prompt.")

        # An answer can arrive split across several parts, so join them all.
        # Any part marked "thought" is Gemini's thinking, not its answer.
        parts = (candidate.get("content") or {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts if not part.get("thought"))
        if text:
            return text

        if finish_reason == "MAX_TOKENS":
            raise AIError(
                "Gemini ran out of room before it wrote any answer - its thinking "
                f"used up all {generation_config['maxOutputTokens']} tokens it was "
                "allowed. Raise max_tokens in this ask_ai(...) call (try "
                f"max_tokens={max(max_tokens * 2, 4000)}) and run it again."
            )
        raise AIError(
            f"Gemini sent back an empty answer (finishReason: {finish_reason}). "
            "Try again, or rephrase your prompt."
        )

    raise AIError(
        f"Gemini was unavailable after {MAX_ATTEMPTS} tries ({last_problem}). "
        "This happens sometimes on the free tier during high demand - wait "
        "a minute and try again."
    )


def ask_ai_detailed(prompt, **kwargs):
    """
    Same as ask_ai, but returns a dict instead of a plain string. Kept for
    projects that expect this shape - Gemini's free tier has no per-request
    cost to report, so this just wraps the text.

        result = ask_ai_detailed("Summarise this", max_tokens=200)
        print(result["text"])
    """
    return {"text": ask_ai(prompt, **kwargs)}


if __name__ == "__main__":
    # Running this file directly checks that your setup works.
    print("Testing your Gemini connection...\n")
    try:
        result = ask_ai("Say hello in exactly five words.", max_tokens=50)
        print("The AI said:", result)
        print("\nYour setup works. You are ready to build.")
    except AIError as problem:
        print("Setup problem:\n")
        print(problem)$sdt_ai$::text as new_sdt_ai;


-- ----------------------------------------------------------------------------
-- 2. Where sdt_ai.py lives in each guide, and the md5 of what is there now.
--    The six live variants being replaced:
--      581c102a845c19aab3ea1a7379e57531  courses 1, 19, 20, 21
--      8dc9c8eec616e1bb367c91cea8a2e1ab  courses 2, 3, 5
--      ddbab98f8ebbebdc8de265bc1b5b9703  courses 6
--      72a441bc4c2cf2b5d8315b1f8d5fea34  courses 7, 8, 9, 10, 11, 12
--      dd07fd7993ed9fcd10a2ce53f003acad  courses 13, 14, 15, 16, 17, 18
--      433767be4194b9fcb01f4bf1e2baf553  courses 22, 23, 24, 25
-- ----------------------------------------------------------------------------
create temp table gemini_fix_targets (
  course_id           integer primary key,
  step_path           text[]  not null,  -- the step object holding the code block
  old_prompt_md5      text    not null,
  old_instruction_md5 text    not null
) on commit drop;

insert into gemini_fix_targets values
  ( 1, '{builds,1,steps,0}', '581c102a845c19aab3ea1a7379e57531', '1343b4b51ba86698f91a781f4f8c2415'),
  ( 2, '{builds,1,steps,0}', '8dc9c8eec616e1bb367c91cea8a2e1ab', 'd6d377e05545a9f617abd21f64fe9ad7'),
  ( 3, '{builds,1,steps,0}', '8dc9c8eec616e1bb367c91cea8a2e1ab', 'd6d377e05545a9f617abd21f64fe9ad7'),
  ( 5, '{builds,0,steps,0}', '8dc9c8eec616e1bb367c91cea8a2e1ab', 'e90e56898e1f2efd90d05ffec173b0ad'),
  ( 6, '{builds,0,steps,0}', 'ddbab98f8ebbebdc8de265bc1b5b9703', '64cbde078058007bfd6cdb5e6db5f165'),
  ( 7, '{builds,1,steps,0}', '72a441bc4c2cf2b5d8315b1f8d5fea34', '1343b4b51ba86698f91a781f4f8c2415'),
  ( 8, '{builds,1,steps,0}', '72a441bc4c2cf2b5d8315b1f8d5fea34', '1343b4b51ba86698f91a781f4f8c2415'),
  ( 9, '{builds,1,steps,0}', '72a441bc4c2cf2b5d8315b1f8d5fea34', 'a82f029fbb8c603aeb1f52473050d9f1'),
  (10, '{builds,2,steps,0}', '72a441bc4c2cf2b5d8315b1f8d5fea34', 'a82f029fbb8c603aeb1f52473050d9f1'),
  (11, '{builds,1,steps,0}', '72a441bc4c2cf2b5d8315b1f8d5fea34', '1343b4b51ba86698f91a781f4f8c2415'),
  (12, '{builds,0,steps,1}', '72a441bc4c2cf2b5d8315b1f8d5fea34', '1343b4b51ba86698f91a781f4f8c2415'),
  (13, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (14, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (15, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (16, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (17, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (18, '{builds,0,steps,0}', 'dd07fd7993ed9fcd10a2ce53f003acad', '1343b4b51ba86698f91a781f4f8c2415'),
  (19, '{builds,0,steps,0}', '581c102a845c19aab3ea1a7379e57531', '1343b4b51ba86698f91a781f4f8c2415'),
  (20, '{builds,0,steps,0}', '581c102a845c19aab3ea1a7379e57531', '1343b4b51ba86698f91a781f4f8c2415'),
  (21, '{builds,0,steps,0}', '581c102a845c19aab3ea1a7379e57531', '1343b4b51ba86698f91a781f4f8c2415'),
  (22, '{builds,0,steps,0}', '433767be4194b9fcb01f4bf1e2baf553', '1343b4b51ba86698f91a781f4f8c2415'),
  (23, '{builds,0,steps,0}', '433767be4194b9fcb01f4bf1e2baf553', '1343b4b51ba86698f91a781f4f8c2415'),
  (24, '{builds,0,steps,0}', '433767be4194b9fcb01f4bf1e2baf553', '1343b4b51ba86698f91a781f4f8c2415'),
  (25, '{builds,0,steps,0}', '433767be4194b9fcb01f4bf1e2baf553', '1343b4b51ba86698f91a781f4f8c2415');


-- ----------------------------------------------------------------------------
-- 3. Guide #4 (Make.com): exact old -> new text at each path.
-- ----------------------------------------------------------------------------
create temp table gemini_fix_guide4 (
  col       text   not null check (col in ('session', 'troubleshooting')),
  path      text[] not null,
  old_value text   not null,
  new_value text   not null
) on commit drop;

insert into gemini_fix_guide4 values
  ('session', '{0,model}',
    $t$Gemini 1.5 Flash (free)$t$,
    $t$Gemini Flash (free)$t$),
  ('session', '{1,model}',
    $t$Gemini 1.5 Flash (free)$t$,
    $t$Gemini Flash (free)$t$),
  ('session', '{0,builds,3,steps,2,instruction}',
    $t$Select Model: Gemini 1.5 Flash (or the latest Flash model available).$t$,
    $t$Select Model: the newest Gemini Flash model in the list (the highest version number with "Flash" in its name). Skip Gemini 1.5 and 2.x models - Google has retired them or closed them to new API keys.$t$),
  ('session', '{1,builds,3,steps,2,instruction}',
    $t$Select Model: Gemini 1.5 Flash (or the latest Flash model available).$t$,
    $t$Select Model: the newest Gemini Flash model in the list (the highest version number with "Flash" in its name). Skip Gemini 1.5 and 2.x models - Google has retired them or closed them to new API keys.$t$),
  ('session', '{0,builds,3,description}',
    $t$The zero-dollar AI brain. Gemini reads your headlines and writes a professional executive briefing. Up to 1,500 free requests per day — more than enough for a daily morning run.$t$,
    $t$The zero-dollar AI brain. Gemini reads your headlines and writes a professional executive briefing. The free tier allows far more requests per day than a daily morning run needs.$t$),
  ('session', '{1,builds,3,description}',
    $t$Gemini reads your aggregated headlines and writes a professional executive briefing. Get your free API key from aistudio.google.com — up to 1,500 requests per day at no cost, more than enough for a daily run.$t$,
    $t$Gemini reads your aggregated headlines and writes a professional executive briefing. Get your free API key from aistudio.google.com — the free tier allows far more requests per day than a daily run needs.$t$),
  ('session', '{0,troubleshooting,1,fix}',
    $t$You clicked Run too many times quickly. The free tier allows around 10-15 requests per minute. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$,
    $t$You clicked Run too many times quickly. The free tier only allows a limited number of requests per minute. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$),
  ('session', '{1,troubleshooting,5,fix}',
    $t$You clicked Run too many times quickly. The free tier allows around 15 requests per minute and 1,500 per day. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$,
    $t$You clicked Run too many times quickly. The free tier only allows a limited number of requests per minute. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$),
  ('troubleshooting', '{1,fix}',
    $t$You clicked Run too many times quickly. The free tier allows around 10-15 requests per minute. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$,
    $t$You clicked Run too many times quickly. The free tier only allows a limited number of requests per minute. For a daily scheduled run you will never hit this naturally. Wait 60 seconds and try again.$t$);


-- ----------------------------------------------------------------------------
-- 4a. Self-check: the text in sections 1-3 must be byte-for-byte what was
--     reviewed and tested. Catches copy/paste or transcription damage to
--     this file, which the drift checks below cannot see.
-- ----------------------------------------------------------------------------
do $$
begin
  if (select md5(new_sdt_ai) from gemini_fix_text) <> '265aee1f8ca263bb5ffcec5e85208704' then
    raise exception 'sdt_ai.py text in this file is not the reviewed copy - nothing was changed.';
  end if;
  if (select md5(concat_ws(E'\x1f', old_model, new_model, old_tip, new_tip, new_issue,
                           new_issue_fix, instruction_note, new_sdt_ai))
        from gemini_fix_text) <> 'a469b1fc4a0a0e2549ae4435e8682850' then
    raise exception 'Section 1 text in this file is not the reviewed copy - nothing was changed.';
  end if;
  if (select md5(string_agg(h, '' order by h collate "C"))
        from (select md5(concat_ws(E'\x1f', course_id::text, step_path::text,
                                   old_prompt_md5, old_instruction_md5)) as h
                from gemini_fix_targets) s) <> '6150683a2f21c06066c0d69802c23924' then
    raise exception 'Section 2 in this file is not the reviewed copy - nothing was changed.';
  end if;
  if (select md5(string_agg(h, '' order by h collate "C"))
        from (select md5(concat_ws(E'\x1f', col, path::text, old_value, new_value)) as h
                from gemini_fix_guide4) s) <> '3a50eb7bd87b508bef27a05acf4f3320' then
    raise exception 'Section 3 in this file is not the reviewed copy - nothing was changed.';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Pre-flight: abort, changing nothing, if live content has drifted.
-- ----------------------------------------------------------------------------
do $$
declare
  problems text;
begin
  if to_regclass('public.course_content_backup_20260925') is not null then
    raise exception 'public.course_content_backup_20260925 already exists - has this migration already run?';
  end if;

  select string_agg(format('course %s: %s', p.course_id, p.what), E'\n' order by p.course_id)
    into problems
    from (
      select t.course_id, 'sdt_ai.py code block differs from the audited copy' as what
        from gemini_fix_targets t
        left join public.course_content c on c.course_id = t.course_id
       where md5(c.session #>> (t.step_path || '{prompt}'::text[])) is distinct from t.old_prompt_md5
      union all
      select t.course_id, 'sdt_ai.py step instruction differs from the audited copy'
        from gemini_fix_targets t
        left join public.course_content c on c.course_id = t.course_id
       where md5(c.session #>> (t.step_path || '{instruction}'::text[])) is distinct from t.old_instruction_md5
      union all
      select t.course_id, 'session.model is not ' || x.old_model
        from gemini_fix_targets t
        cross join gemini_fix_text x
        left join public.course_content c on c.course_id = t.course_id
       where c.session ->> 'model' is distinct from x.old_model
      union all
      select t.course_id, 'expected exactly one troubleshooting entry with the old GEMINI_MODEL tip'
        from gemini_fix_targets t
        cross join gemini_fix_text x
        left join public.course_content c on c.course_id = t.course_id
       where (select count(*) from jsonb_array_elements(c.troubleshooting) e
               where e ->> 'fix' = x.old_tip) <> 1
      union all
      select 4, format('%s %s differs from the audited copy', g.col, g.path)
        from gemini_fix_guide4 g
        left join public.course_content c on c.course_id = 4
       where (case g.col when 'session' then c.session else c.troubleshooting end) #>> g.path
             is distinct from g.old_value
    ) p;

  if problems is not null then
    raise exception E'course_content no longer matches what this migration was written against. Nothing was changed.\n%', problems;
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 5. Backup (admin/service-role only; see header).
-- ----------------------------------------------------------------------------
create table public.course_content_backup_20260925 as
  select course_id, session, troubleshooting, updated_at
    from public.course_content
   where course_id between 1 and 25;

alter table public.course_content_backup_20260925 enable row level security;
revoke all on public.course_content_backup_20260925 from anon, authenticated;


-- ----------------------------------------------------------------------------
-- 6. The 24 sdt_ai.py guides: new code block + "replace your old copy" note.
-- ----------------------------------------------------------------------------
update public.course_content c
   set session = jsonb_set(
                   jsonb_set(c.session,
                             t.step_path || '{prompt}'::text[],
                             to_jsonb(x.new_sdt_ai)),
                   t.step_path || '{instruction}'::text[],
                   to_jsonb((c.session #>> (t.step_path || '{instruction}'::text[]))
                            || ' ' || x.instruction_note)),
       updated_at = now()
  from gemini_fix_targets t, gemini_fix_text x
 where c.course_id = t.course_id;


-- ----------------------------------------------------------------------------
-- 7. The 24 sdt_ai.py guides: model badge.
-- ----------------------------------------------------------------------------
update public.course_content c
   set session = jsonb_set(c.session, '{model}', to_jsonb(x.new_model)),
       updated_at = now()
  from gemini_fix_targets t, gemini_fix_text x
 where c.course_id = t.course_id;


-- ----------------------------------------------------------------------------
-- 8. The 24 sdt_ai.py guides: rewrite the old 503 tip in place (keeping its
--    position), then append the old-copy-of-sdt_ai.py entry.
-- ----------------------------------------------------------------------------
update public.course_content c
   set troubleshooting =
         (select jsonb_agg(case when e.item ->> 'fix' = x.old_tip
                                then jsonb_set(e.item, '{fix}', to_jsonb(x.new_tip))
                                else e.item end
                           order by e.ord)
            from jsonb_array_elements(c.troubleshooting) with ordinality as e(item, ord))
         || jsonb_build_array(jsonb_build_object('issue', x.new_issue, 'fix', x.new_issue_fix)),
       updated_at = now()
  from gemini_fix_targets t, gemini_fix_text x
 where c.course_id = t.course_id;


-- ----------------------------------------------------------------------------
-- 9. Guide #4.
-- ----------------------------------------------------------------------------
do $$
declare
  e record;
begin
  for e in select * from gemini_fix_guide4 loop
    if e.col = 'session' then
      update public.course_content
         set session = jsonb_set(session, e.path, to_jsonb(e.new_value)), updated_at = now()
       where course_id = 4 and session #>> e.path = e.old_value;
    else
      update public.course_content
         set troubleshooting = jsonb_set(troubleshooting, e.path, to_jsonb(e.new_value)), updated_at = now()
       where course_id = 4 and troubleshooting #>> e.path = e.old_value;
    end if;
    if not found then
      raise exception 'guide 4: % % did not match - nothing was changed', e.col, e.path;
    end if;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 10. Post-flight: roll everything back unless the end state is exact.
-- ----------------------------------------------------------------------------
do $$
declare
  problems text;
begin
  select string_agg(format('course %s: %s', p.course_id, p.what), E'\n' order by p.course_id)
    into problems
    from (
      select t.course_id, 'sdt_ai.py code block is not the new file' as what
        from gemini_fix_targets t
        cross join gemini_fix_text x
        join public.course_content c on c.course_id = t.course_id
       where c.session #>> (t.step_path || '{prompt}'::text[]) is distinct from x.new_sdt_ai
      union all
      select t.course_id, 'step instruction does not end with the replace-your-copy note'
        from gemini_fix_targets t
        cross join gemini_fix_text x
        join public.course_content c on c.course_id = t.course_id
       where right(c.session #>> (t.step_path || '{instruction}'::text[]), length(x.instruction_note))
             is distinct from x.instruction_note
      union all
      select t.course_id, 'model badge not updated'
        from gemini_fix_targets t
        cross join gemini_fix_text x
        join public.course_content c on c.course_id = t.course_id
       where c.session ->> 'model' is distinct from x.new_model
      union all
      -- The only gemini-2.5-flash left anywhere in guides 1-25 should be the
      -- single mention inside the replace-your-copy note.
      select c.course_id,
             format('%s gemini-2.5-flash mentions left, expected %s', n.found, n.expected)
        from public.course_content c
        cross join lateral (
          select (length(c.session::text || c.troubleshooting::text)
                  - length(replace(c.session::text || c.troubleshooting::text, 'gemini-2.5-flash', '')))
                 / length('gemini-2.5-flash') as found,
                 case when exists (select 1 from gemini_fix_targets t where t.course_id = c.course_id)
                      then 1 else 0 end as expected
        ) n
       where c.course_id between 1 and 25 and n.found <> n.expected
      union all
      select t.course_id, 'troubleshooting entry count is not old + 1'
        from gemini_fix_targets t
        join public.course_content c on c.course_id = t.course_id
        join public.course_content_backup_20260925 b on b.course_id = t.course_id
       where jsonb_array_length(c.troubleshooting) <> jsonb_array_length(b.troubleshooting) + 1
      union all
      select 4, 'still mentions Gemini 1.5 or the 1.5-era free-tier numbers'
        from public.course_content c
       where c.course_id = 4
         and (c.session::text || c.troubleshooting::text) ~ '1\.5 Flash|1,500|10-15 requests|15 requests per minute'
      union all
      select c.course_id, 'rows outside 1-25 must not change'
        from public.course_content c
       where c.course_id not between 1 and 25 and c.updated_at = now()
    ) p;

  if problems is not null then
    raise exception E'Post-flight check failed - rolling back.\n%', problems;
  end if;
end $$;


-- What changed (shown in the SQL editor's result pane).
select c.course_id,
       c.tier,
       c.session ->> 'model' as model_badge,
       jsonb_array_length(c.troubleshooting) as troubleshooting_entries,
       c.updated_at
  from public.course_content c
 where c.course_id between 1 and 25
 order by c.course_id;
