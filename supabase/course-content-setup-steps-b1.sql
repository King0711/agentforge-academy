-- ============================================================================
-- Course guides: add the missing Python setup and install steps (2026-09-25) - Builder 1 guides
--
-- Every Python guide tells students to run `python <file>.py` within its first
-- few steps, but none of them says how to get Python or install the libraries
-- the code imports (only 23-25 even list them, and only in "What you need").
-- A student following the steps literally hits "command not found" or
-- ModuleNotFoundError before the first check can pass.
--
--   * Each Python guide (all but #4, the no-code Make.com one) gets a new first
--     step: check or install Python 3.10+, create a .venv, and install exactly
--     the libraries that guide imports, with Mac/Linux and Windows commands.
--     Using a venv also makes plain `python` work on every system, which is
--     what every later step already says.
--   * Builder 2 guides 13-22 have the AI assistant write requirements.txt; the
--     step after that prompt now starts with `pip install -r requirements.txt`.
--   * "What you need" now lists Python on every Python guide.
--
-- 22 guarded edits to course_content rows 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12.
-- Each edit checks the current value first (md5 for text, exact match for
-- structured values, absence for new keys, array length + neighbour for
-- inserted steps) and the whole migration aborts, changing nothing, on any
-- mismatch. Section 1 is checksummed so a copy/paste slip also aborts.
-- Backup of the touched rows: public.course_content_backup_20260925_setup_b1 (RLS on, anon and
-- authenticated revoked). Run as ONE transaction (SQL editor, apply_migration,
-- or psql -1); the temp table is ON COMMIT DROP, so a non-transactional run
-- fails before writing anything.
--
-- Rollback (touched rows only):
--   update public.course_content c set session = b.session,
--          troubleshooting = b.troubleshooting, resources = b.resources,
--          updated_at = b.updated_at
--     from public.course_content_backup_20260925_setup_b1 b where b.course_id = c.course_id;
-- ============================================================================

-- 1. The edits, in order. "final" is where each edit's value sits once every
--    later insert has shifted it; the post-check reads it there.
create temp table content_edits (
  ord int primary key, course_id int not null, col text not null check (col in ('session','troubleshooting','resources')),
  path text[] not null, final text[] not null, kind text not null check (kind in ('str','json','add','insert')),
  old_md5 text, old_json text, new_text text not null
) on commit drop;

insert into content_edits values
  (1, 1, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '0318da3fab3d92744811cc4327ffefe3', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (2, 2, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '024bd461cbc9cbd5f3686182c0e14c41', $o$5$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (3, 3, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '38c9937608e2fc77e294fb23a034a3bd', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (4, 5, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '21d2e9b1557d64eecc95ad14adb9dd98', $o$3$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (5, 6, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '21d2e9b1557d64eecc95ad14adb9dd98', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (6, 7, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '21d2e9b1557d64eecc95ad14adb9dd98', $o$3$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (7, 8, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '21d2e9b1557d64eecc95ad14adb9dd98', $o$3$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (8, 9, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '242d28c5984cd652aaeedb9d81374d11', $o$5$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (9, 10, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '6c8fdd85197ce0cf708c9554621222f3', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (10, 11, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '9b443c606e2b23965f7a2da48aadc493', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (11, 12, 'session', '{whatYouNeed,1}', '{whatYouNeed,1}', 'insert', '21d2e9b1557d64eecc95ad14adb9dd98', $o$4$o$,
    $n$"Python 3.10 or newer (free at python.org - the first step shows how to check and set it up)"$n$),
  (12, 1, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', 'ef0d6b58e10ee63f08f8a2dd6a1d0e62', $o$3$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (13, 2, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '792ffede9e2429680007d160d926177f', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install flask requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install flask requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (14, 3, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '3b5b0469c3601f74baa403ca1aff36f9', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install slack_sdk schedule requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install slack_sdk schedule requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (15, 5, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '5b63cefefb8b265480ab755276203e4b', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (16, 6, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '48c37e8db878b438271c029ccef8408a', $o$3$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install streamlit requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install streamlit requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (17, 7, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', 'd107dbd6ab651b414d72a7e65bf83eab', $o$1$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install streamlit requests beautifulsoup4 python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install streamlit requests beautifulsoup4 python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (18, 8, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '7899c2bd6cd2ec556e6fc423f98e450b', $o$1$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install PyPDF2 python-docx beautifulsoup4 requests python-dotenv fpdf2\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install PyPDF2 python-docx beautifulsoup4 requests python-dotenv fpdf2\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (19, 9, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', '92396d38b220d0fce0fa951f887b2cb7', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install flask requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install flask requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (20, 10, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', 'a476da39f967a71fa41c4a9bf542e8c4', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install requests beautifulsoup4 python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install requests beautifulsoup4 python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (21, 11, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', 'ce089671b0a2a2aa0acc7cdcb578e46d', $o$2$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install google-api-python-client google-auth-oauthlib requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install google-api-python-client google-auth-oauthlib requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$),
  (22, 12, 'session', '{builds,0,steps,0}', '{builds,0,steps,0}', 'insert', 'd7b9ad98fc6d20d9d6f9f49e5febd87c', $o$3$o$,
    $n${"instruction": "Set up Python for this project (once, about 5 minutes). Check your version with `python3 --version` on Mac/Linux or `py --version` on Windows. If it is missing or older than 3.10, install the latest Python from python.org/downloads (on Windows, tick \"Add python.exe to PATH\" on the installer's first screen), then open a new terminal. Now make an empty folder for this project, open a terminal in it (in VS Code: File > Open Folder, then Terminal > New Terminal), and run the commands below for your system. They create a virtual environment - a private set of libraries for this project only - and install the libraries this guide uses.", "prompt": "# Mac / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install pandas requests python-dotenv\n\n# Windows (PowerShell)\npy -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install pandas requests python-dotenv\n\n# Windows says \"running scripts is disabled\"? Run this once, then the Activate line again:\n#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\n# Ubuntu/Debian says venv or ensurepip is not available? Run: sudo apt install python3-venv", "verify": "Your terminal prompt now starts with (.venv), and the install ended with \"Successfully installed\". Each time you open a new terminal for this project, run the activate line again first - while it is active, plain `python` works on every system, and that is the command every step below uses."}$n$);

-- 2. Self-check, pre-flight guards, backup, apply, post-check.
do $$
declare e record; cur jsonb; par jsonb; n int;
begin
  if (select md5(string_agg(h, '' order by h collate "C")) from (
        select md5(concat_ws(E'\x1f', ord::text, course_id::text, col, array_to_string(path, '.'),
                             array_to_string(final, '.'), kind, new_text)) as h
          from content_edits) s) <> 'fc5a74bb0657df5bc9aa3c38731b8aef' then
    raise exception 'Section 1 is not the reviewed copy - nothing was changed.';
  end if;
  if to_regclass('public.course_content_backup_20260925_setup_b1') is not null then
    raise exception 'public.course_content_backup_20260925_setup_b1 already exists - has this migration already run?';
  end if;
  create table public.course_content_backup_20260925_setup_b1 as
    select course_id, session, troubleshooting, resources, updated_at from public.course_content
     where course_id in (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12);
  alter table public.course_content_backup_20260925_setup_b1 enable row level security;
  revoke all on public.course_content_backup_20260925_setup_b1 from anon, authenticated;

  for e in select * from content_edits order by ord loop
    n := array_length(e.path, 1);
    execute format('select %I #> $1, %I #> $2 from public.course_content where course_id = $3', e.col, e.col)
      into cur, par using e.path, e.path[1:n-1], e.course_id;
    if (e.kind = 'str' and md5(cur #>> '{}') is distinct from e.old_md5)
       or (e.kind = 'json' and cur is distinct from e.old_json::jsonb)
       or (e.kind = 'add' and (cur is not null or jsonb_typeof(par) is distinct from 'object'))
       or (e.kind = 'insert' and (jsonb_typeof(par) is distinct from 'array'
            or jsonb_array_length(par) <> e.old_json::int
            or md5(coalesce(cur ->> 'instruction', cur #>> '{}')) is distinct from e.old_md5)) then
      raise exception 'edit % (course % %.%) does not match the audited value - nothing was changed',
        e.ord, e.course_id, e.col, array_to_string(e.path, '.');
    end if;
    if e.kind = 'insert' then
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
    if cur is distinct from (case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end) then
      raise exception 'post-check: edit % (course %) did not land - rolling back', e.ord, e.course_id;
    end if;
  end loop;
  if exists (select 1 from public.course_content where updated_at = now() and course_id not in (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12)) then
    raise exception 'post-check: an untouched row changed - rolling back';
  end if;
end $$;
