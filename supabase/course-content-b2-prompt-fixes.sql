-- ============================================================================
-- Course guides: fix the Builder 2 prompts that produce broken code (2026-09-26)
--
-- Builder 2 guides have students paste prompts into an AI assistant, so a
-- wrong prompt reliably produces wrong code:
--   * #16 asked for the pinecone-client package, which was renamed to
--     pinecone; current pinecone-client releases refuse to import.
--   * #17 never said how to create the Google service account whose key the
--     code loads, and its requirements.txt left out requests/python-dotenv
--     that sdt_ai.py needs. Its final check referred to a row "you manually
--     backdated in Build 3" that no step ever asked for.
--   * #19 asked the AI for line numbers "in the diff", but GitHub inline review
--     comments take new-file line numbers (side RIGHT) and only on lines in
--     the diff; one bad line makes GitHub reject the whole review with 422.
--   * #23 asked for all 15 clauses with verbatim quotes in one 4000-token
--     reply, which runs out of room and returns truncated JSON.
--   * #25 hardcoded "news 2025" into the prospect research search.
--
-- 9 guarded edits to course_content rows 16, 17, 19, 23, 25.
-- Each edit checks the current value first (md5 for text, exact match for
-- structured values, absence for new keys, array length + neighbour for
-- inserted steps) and the whole migration aborts, changing nothing, on any
-- mismatch. Section 1 is checksummed so a copy/paste slip also aborts.
-- Long texts with small changes ship as "patch" hunks: each hunk must match
-- exactly once and the patched text must hash to the reviewed new_md5.
-- Backup of the touched rows: public.course_content_backup_20260926_b2_fixes (RLS on, anon and
-- authenticated revoked). Run as ONE transaction (SQL editor, apply_migration,
-- or psql -1); the temp table is ON COMMIT DROP, so a non-transactional run
-- fails before writing anything.
--
-- Rollback (touched rows only):
--   update public.course_content c set session = b.session,
--          troubleshooting = b.troubleshooting, resources = b.resources,
--          updated_at = b.updated_at
--     from public.course_content_backup_20260926_b2_fixes b where b.course_id = c.course_id;
-- ============================================================================

-- 1. The edits, in order. "final" is where each edit's value sits once every
--    later insert has shifted it; the post-check reads it there.
create temp table content_edits (
  ord int primary key, course_id int not null, col text not null check (col in ('session','troubleshooting','resources')),
  path text[] not null, final text[] not null, kind text not null check (kind in ('str','patch','json','add','insert')),
  old_md5 text, old_json text, new_text text not null, new_md5 text
) on commit drop;

insert into content_edits values
  (1, 16, 'session', '{builds,1,steps,0,prompt}', '{builds,1,steps,0,prompt}', 'str', '5608a5c3a2bd96ac91829f4144ddcf25', null,
    $n$I'm building a RAG support bot. I already have sdt_ai.py in this folder with an ask_ai(prompt, system=None, max_tokens=1000) function that talks to Google's Gemini API - never call Gemini or any AI SDK directly, always go through ask_ai(). Please create:
1. requirements.txt with pinecone, sentence-transformers, fastapi, uvicorn, python-dotenv, requests
2. chunker.py with chunk_text(text, chunk_size=512, overlap=50) that splits text into word-based chunks of chunk_size words with overlap words of overlap between consecutive chunks
3. embed.py using sentence-transformers' "all-MiniLM-L6-v2" model with an embed(texts) function that returns a list of 384-dim vectors for a list of texts (batch the encode call)
4. ingest.py with ingest_docs(folder="docs") that reads every file in the folder, chunks it, embeds the chunks, and upserts each as a vector to Pinecone (use the current SDK from the "pinecone" package: pc = Pinecone(api_key=...), then pc.Index(PINECONE_INDEX) - the old pinecone-client package and its pinecone.init() no longer work) with id "{filename}-{chunk_index}" and metadata {"text": chunk, "source": filename}. Print how many chunks were upserted.$n$, null),
  (2, 17, 'session', '{builds,1,steps,0,prompt}', '{builds,1,steps,0,prompt}', 'str', 'e4103c2183af042918f135d11d65e58c', null,
    $n$I'm building an invoice processing agent. I already have sdt_ai.py in this folder with an ask_ai(prompt, system=None, max_tokens=1000) function that talks to Google's Gemini API - never call Gemini or any AI SDK directly, always go through ask_ai(). Please create:
1. requirements.txt with pypdf2, gspread, google-auth, watchdog, requests, python-dotenv
2. extract.py with a SCHEMA constant describing this JSON shape: {"vendor_name": "...", "invoice_number": "...", "date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "total": 0.00, "currency": "USD", "line_items": [{"description": "...", "amount": 0.00}]}, and an extract_invoice(pdf_path) function that reads the PDF text with PyPDF2, calls ask_ai() (max_tokens=1000) with a prompt to extract data matching the schema exactly (JSON only), and returns the parsed JSON
3. validate.py with validate(data) that checks for missing required fields (vendor_name, invoice_number, date, total), sets data["needs_review"] = True if any are missing, and sets data["missing_fields"] to a comma-separated list of the missing ones$n$, null),
  (3, 17, 'session', '{builds,3,steps,0,verify}', '{builds,3,steps,0,verify}', 'str', '18b699920c25ab25d5a0a0bd17f4766f', null,
    $n$Start watcher.py, then drop a new PDF into invoices/ — within a few seconds it should appear as a new row in the sheet. Then change one row's due_date in the sheet to a date in the past and run overdue_check.py — it should post a Slack alert for that row.$n$, null),
  (4, 17, 'session', '{builds,0,steps,2}', '{builds,0,steps,2}', 'insert', 'ab2a81cc06cb3f8cb80b296a56dab2f6', $o$4$o$,
    $n${"instruction": "Create the Google service account the code logs in with. In Google Cloud Console (console.cloud.google.com), create a project, then go to APIs & Services > Library and enable both the Google Sheets API and the Google Drive API (gspread needs Drive to find a sheet by its name). Next go to IAM & Admin > Service Accounts > Create service account, give it any name and skip the optional permission steps. Open it, go to Keys > Add key > Create new key > JSON, and save the downloaded file in your project folder as service_account.json. Treat that file like a password: never commit or share it. If Google says key creation is disabled by an organization policy, you are signed in with a work or school account - use a personal Google account instead.", "verify": "service_account.json is in your project folder. Open it and copy its \"client_email\" value (it ends in .iam.gserviceaccount.com) - that is the address you share the sheet with next."}$n$, null),
  (5, 19, 'session', '{builds,2,steps,0,prompt}', '{builds,2,steps,0,prompt}', 'str', 'b9ea5afb4cf3032888eef1dc2a4b3121', null,
    $n$Add the review logic:

1. reviewer.py with number_patch(patch) that walks the patch's @@ -a,b +c,d @@ hunk headers and prefixes every added (+) and unchanged ( ) line with its line number in the NEW version of the file (counting from c, and not counting removed - lines), returning the numbered text plus the set of those line numbers; and review_file(filename, patch) that sends the numbered diff to the AI via ask_ai(prompt, max_tokens=1500) from sdt_ai.py (the shared Gemini helper you already created), asking it to review for bugs, security issues, performance problems, and readability, and return JSON: {"comments": [{"line": <the new-file line number shown next to the line>, "severity": "low|medium|high", "comment": "..."}], "summary": "one sentence"}. If no issues, return {"comments": [], "summary": "Looks good"}.
2. parse.py with collect_comments(files_with_reviews) that takes a list of (filename, review, valid_lines) tuples and flattens them into a list of {"path": filename, "line": ..., "side": "RIGHT", "body": "**[SEVERITY]** comment"} dicts, sorted with HIGH severity first. GitHub only accepts inline comments on lines that appear in the diff, so drop any comment whose line is not in that file's valid_lines (print a note, and keep its text for the summary instead of losing it)$n$, null),
  (6, 19, 'session', '{builds,3,steps,0,prompt}', '{builds,3,steps,0,prompt}', 'str', '3d0570462816ed0d70e30b68a11102f5', null,
    $n$Finish my code review bot:

1. post_review.py with submit_review(token, repo, pr_number, commit_id, comments, event="COMMENT") that POSTs to /repos/{repo}/pulls/{pr_number}/reviews with the commit_id, a body of "AI Code Review", the event type, and the inline comments (each with path, line, side "RIGHT" and body). If GitHub answers 422 (it rejects the WHOLE review when even one inline comment points at a line outside the diff), retry once with no inline comments and their text listed in the review body instead, so one bad line never loses the entire review
2. summary.py with build_summary(all_findings) that counts HIGH and MEDIUM severity comments, computes score = max(0, 100 - high*25 - medium*10), and returns a Markdown summary string with the score and counts
3. decide.py with review_event(all_findings) that returns "REQUEST_CHANGES" if any HIGH findings exist, "COMMENT" if any MEDIUM findings exist (but no HIGH), otherwise "APPROVE"
4. Update webhook.py's review_pr() to call review_file() on every changed file (passing each file's valid line numbers from number_patch() on to collect_comments()), collect_comments(), build_summary(), review_event(), and submit_review() with the summary appended to the comments

For now, force review_event() to always return "COMMENT" regardless of findings, so the bot never auto-approves or auto-blocks while you build trust in it.$n$, null),
  (7, 19, 'troubleshooting', '{2,fix}', '{2,fix}', 'str', 'b19838c2673e9da04924fad982a8b5ca', null,
    $n$Inline review comments take the line number in the NEW version of the file (with side "RIGHT"), and only lines that appear in the diff can be commented on. Number the patch lines from its @@ hunk headers before the AI sees them (number_patch in reviewer.py), and drop any comment whose line is not in the diff - one such line makes GitHub reject the whole review with a 422.$n$, null),
  (8, 23, 'session', '{builds,1,steps,0,prompt}', '{builds,1,steps,0,prompt}', 'str', '8637f922aabe968b06c064e6a52be914', null,
    $n$Write extract.py for a contract analysis tool using the shared sdt_ai.py helper - call ask_ai() from it, never call Gemini directly.

Create a function extract_clauses(contract_text, clause_types) that:
- Builds a prompt containing the first 12000 characters of contract_text (note in a comment that longer contracts should be split in half and the JSON results merged)
- Works through clause_types in batches of 5 (three ask_ai calls for the 15 standard types), because verbatim quotes for all 15 in one reply run past the output limit and come back as cut-off, unparseable JSON. For each clause type in the batch, asks the AI to find: exact_text (a verbatim quote of the key sentence or two, at most about 400 characters, or "Not found"), summary (one plain-English sentence), and risk (one of "red", "yellow", "green" based on how favorable/standard the clause is)
- Calls ask_ai(prompt, max_tokens=4000) once per batch
- Asks for a JSON response in the form {"clauses": {"Payment Terms": {"exact_text": "...", "summary": "...", "risk": "..."}, ...}}
- Strips any ``` code fences from each reply, parses the JSON, merges the batches' "clauses" dicts into one, and returns {"clauses": {...}} with all the clause types

Make the risk rating instructions specific: red = unusual/unfavorable to our side, yellow = present but worth a second look, green = standard/favorable language.$n$, null),
  (9, 25, 'session', '{builds,0,steps,2,prompt}', '{builds,0,steps,2,prompt}', 'str', '3a42654503e603d66381307ef9e11ccd', null,
    $n$Write two Python files for a sales prospecting tool.

1) enrich.py using tavily-python with enrich_prospect(name, company) that:
- Searches for "{name} {company} LinkedIn" and returns the top 3 results as the profile
- Searches for "{company} news" with topic="news" (Tavily's news search, which favours recent articles) and returns the top 3 results as company_news - never hardcode a year into the query, or the "recent" news goes stale on January 1st
- Returns {"profile": [...], "news": [...]}

Add a comment that searching for the LinkedIn profile via a general search (rather than scraping LinkedIn directly) avoids LinkedIn's anti-scraping measures.

2) hunter.py using requests with find_email(first_name, last_name, domain, api_key) that:
- Calls Hunter.io's Email Finder API (https://api.hunter.io/v2/email-finder) with the domain, first_name, last_name, and api_key
- Returns {"email": ..., "confidence": ...} from the response data

Add a comment that prospects with confidence below 50 should be skipped, since sending to unverified addresses hurts sender reputation.$n$, null);

-- 2. Self-check, pre-flight guards, backup, apply, post-check.
do $$
declare e record; cur jsonb; par jsonb; n int; txt text; pr jsonb;
begin
  if (select md5(string_agg(h, '' order by h collate "C")) from (
        select md5(concat_ws(E'\x1f', ord::text, course_id::text, col, array_to_string(path, '.'),
                             array_to_string(final, '.'), kind, new_text, coalesce(new_md5, ''))) as h
          from content_edits) s) <> '1e2903c75b33f52acf5aea6ac704e294' then
    raise exception 'Section 1 is not the reviewed copy - nothing was changed.';
  end if;
  if to_regclass('public.course_content_backup_20260926_b2_fixes') is not null then
    raise exception 'public.course_content_backup_20260926_b2_fixes already exists - has this migration already run?';
  end if;
  create table public.course_content_backup_20260926_b2_fixes as
    select course_id, session, troubleshooting, resources, updated_at from public.course_content
     where course_id in (16, 17, 19, 23, 25);
  alter table public.course_content_backup_20260926_b2_fixes enable row level security;
  revoke all on public.course_content_backup_20260926_b2_fixes from anon, authenticated;

  for e in select * from content_edits order by ord loop
    n := array_length(e.path, 1);
    execute format('select %I #> $1, %I #> $2 from public.course_content where course_id = $3', e.col, e.col)
      into cur, par using e.path, e.path[1:n-1], e.course_id;
    if (e.kind in ('str', 'patch') and md5(cur #>> '{}') is distinct from e.old_md5)
       or (e.kind = 'json' and cur is distinct from e.old_json::jsonb)
       or (e.kind = 'add' and (cur is not null or jsonb_typeof(par) is distinct from 'object'))
       or (e.kind = 'insert' and (jsonb_typeof(par) is distinct from 'array'
            or jsonb_array_length(par) <> e.old_json::int
            or md5(coalesce(cur ->> 'instruction', cur #>> '{}')) is distinct from e.old_md5)) then
      raise exception 'edit % (course % %.%) does not match the audited value - nothing was changed',
        e.ord, e.course_id, e.col, array_to_string(e.path, '.');
    end if;
    if e.kind = 'patch' then
      -- replay the reviewed hunks; each must match exactly once, and the result must hash to new_md5
      txt := cur #>> '{}';
      for pr in select value from jsonb_array_elements(e.new_text::jsonb) loop
        if (length(txt) - length(replace(txt, pr ->> 0, ''))) / length(pr ->> 0) <> 1 then
          raise exception 'edit % (course %): a patch hunk does not match exactly once - nothing was changed', e.ord, e.course_id;
        end if;
        txt := replace(txt, pr ->> 0, pr ->> 1);
      end loop;
      if md5(txt) <> e.new_md5 then
        raise exception 'edit % (course %): patched text is not the reviewed result - nothing was changed', e.ord, e.course_id;
      end if;
      execute format('update public.course_content set %I = jsonb_set(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)
        using e.path, to_jsonb(txt), e.course_id;
    elsif e.kind = 'insert' then
      execute format('update public.course_content set %I = jsonb_insert(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)
        using e.path, e.new_text::jsonb, e.course_id;
    else
      execute format('update public.course_content set %I = jsonb_set(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)
        using e.path, case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end, e.course_id;
    end if;
  end loop;

  for e in select * from content_edits order by ord loop
    execute format('select %I #> $1 from public.course_content where course_id = $2', e.col)
      into cur using e.final, e.course_id;
    if (e.kind = 'patch' and md5(cur #>> '{}') is distinct from e.new_md5)
       or (e.kind <> 'patch' and cur is distinct from (case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end)) then
      raise exception 'post-check: edit % (course %) did not land - rolling back', e.ord, e.course_id;
    end if;
  end loop;
  if exists (select 1 from public.course_content where updated_at = now() and course_id not in (16, 17, 19, 23, 25)) then
    raise exception 'post-check: an untouched row changed - rolling back';
  end if;
end $$;
