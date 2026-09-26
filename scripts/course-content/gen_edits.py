"""Generate a guarded course_content edit migration from a small spec.

Every supabase/course-content-*.sql migration from 2026-09-25/26 was produced
by this script; see "Editing guide content" in CLAUDE.md.

    python3 scripts/course-content/gen_edits.py <snapshot.json> <spec.py> <out.sql> <expected.json> [spec args...]

snapshot.json: the live rows as a JSON array of
    {course_id, tier, session, troubleshooting, resources, updated_at}
(e.g. `select json_agg(c) from course_content c where course_id <= 25`).
Take it fresh: every edit is guarded against it, so a stale snapshot makes the
migration abort instead of overwriting newer content.

The spec module (it can read the snapshot path from sys.argv[1]) defines
TITLE, WHY (comment lines), BACKUP_TABLE and EDITS, applied in order, where
later ops see earlier ones:
    ('str', cid, col, 'dot.path', [(old_sub, new_sub[, count]), ...])  text leaf, md5-guarded
    ('json', cid, col, 'dot.path', value)                                whole value, equality-guarded
    ('add', cid, col, 'dot.path', value)                                 new object key; must not exist yet
    ('insert', cid, col, 'dot.path.N', value)                            insert before array index N; guarded by
        the array length and the md5 of the element now at N (its "instruction", or itself if a string)
A 'str' edit whose change is small next to its text ships as line hunks
('patch'): each must match exactly once, and the result must hash to the
reviewed md5.

expected.json is the snapshot with every edit applied. Load the snapshot into
a local Postgres, run out.sql with `psql -1`, and compare the rows to it
before applying the migration anywhere real.
"""
import hashlib, importlib.util, json, sys, copy, difflib

snap_path, spec_path, out_path, expected_path = sys.argv[1:5]
rows = {r['course_id']: r for r in json.load(open(snap_path))}
sys.argv = [spec_path, snap_path] + sys.argv[5:]
spec_mod = importlib.util.spec_from_file_location('spec', spec_path)
spec = importlib.util.module_from_spec(spec_mod); spec_mod.loader.exec_module(spec)

def md5(s): return hashlib.md5(s.encode('utf-8')).hexdigest()
def keys(path): return [int(k) if k.isdigit() else k for k in path.split('.')]
def get(doc, path):
    for k in keys(path): doc = doc[k]
    return doc
def put(doc, path, val):
    ks = keys(path)
    for k in ks[:-1]: doc = doc[k]
    doc[ks[-1]] = val
def ident(el): return el['instruction'] if isinstance(el, dict) else el

def make_patch(old, new):
    """Line hunks [(old_chunk, new_chunk), ...] that turn old into new when applied in order
    with plain replace(); each old_chunk must occur exactly once at the moment it is applied."""
    a, b = old.splitlines(keepends=True), new.splitlines(keepends=True)
    for ctx in (2, 4, 8, 16, 64):
        pairs, txt, ok = [], old, True
        for group in difflib.SequenceMatcher(None, a, b, autojunk=False).get_grouped_opcodes(ctx):
            i1, i2, j1, j2 = group[0][1], group[-1][2], group[0][3], group[-1][4]
            oc, nc = ''.join(a[i1:i2]), ''.join(b[j1:j2])
            if not oc or txt.count(oc) != 1:
                ok = False; break
            pairs.append([oc, nc]); txt = txt.replace(oc, nc)
        if ok and txt == new:
            return pairs
    return None
def dq(s, tag):
    assert f'${tag}$' not in s, tag
    return f'${tag}${s}${tag}$'

expected = copy.deepcopy(rows)
ops = []
for n, e in enumerate(spec.EDITS, 1):
    kind, cid, col, path = e[:4]
    op = dict(n=n, cid=cid, col=col, path=path, final=path, kind=kind, om=None, oj=None)
    if kind == 'insert':
        ppath, idx = path.rsplit('.', 1); idx = int(idx)
        parent = get(expected[cid][col], ppath)
        assert isinstance(parent, list) and 0 <= idx <= len(parent), (n, cid, path)
        op['om'] = md5(ident(parent[idx])) if idx < len(parent) else None
        op['oj'] = str(len(parent))
        op['new'] = json.dumps(e[4], ensure_ascii=False)
        # every earlier op whose final location sits at/after idx in this array moves down one
        pre = ppath + '.'
        for o in ops:
            if o['cid'] == cid and o['col'] == col and o['final'].startswith(pre):
                rest = o['final'][len(pre):].split('.')
                if int(rest[0]) >= idx:
                    rest[0] = str(int(rest[0]) + 1); o['final'] = pre + '.'.join(rest)
        parent.insert(idx, copy.deepcopy(e[4]))
    elif kind == 'add':
        ppath, key = path.rsplit('.', 1)
        parent = get(expected[cid][col], ppath)
        assert isinstance(parent, dict) and key not in parent, (n, cid, path)
        op['new'] = json.dumps(e[4], ensure_ascii=False)
        parent[key] = copy.deepcopy(e[4])
    elif kind == 'str':
        old = get(expected[cid][col], path)
        assert isinstance(old, str), (cid, path)
        new = old
        for rep in e[4]:
            a, b = rep[0], rep[1]; cnt = rep[2] if len(rep) > 2 else 1
            assert new.count(a) == cnt, f'edit {n} ({cid} {col}.{path}): expected {cnt}x {a[:60]!r}, found {new.count(a)}'
            new = new.replace(a, b)
        assert new != old, (n, cid, path)
        op['om'] = md5(old); op['new'] = new
        pt = make_patch(old, new)
        if pt is not None:
            pj = json.dumps(pt, ensure_ascii=False)
            if len(pj) < 0.7 * len(new):
                op['kind'] = 'patch'; op['patch'] = pj; op['nm'] = md5(new)
        put(expected[cid][col], path, new)
    elif kind == 'json':
        old = get(expected[cid][col], path)
        op['oj'] = json.dumps(old, ensure_ascii=False); op['new'] = json.dumps(e[4], ensure_ascii=False)
        assert old != e[4], (n, cid, path)
        put(expected[cid][col], path, copy.deepcopy(e[4]))
    else:
        raise ValueError(kind)
    ops.append(op)

# every op's final value must be what expected holds at its final path
for o in ops:
    want = get(expected[o['cid']][o['col']], o['final'])
    have = o['new'] if o['kind'] in ('str', 'patch') else json.loads(o['new'])
    assert want == have, ('final-path bookkeeping is wrong', o['n'], o['final'])

json.dump(list(expected.values()), open(expected_path, 'w'), ensure_ascii=False)
touched = sorted({o['cid'] for o in ops})
SEP = '\x1f'
def shipped(o): return o['patch'] if o['kind'] == 'patch' else o['new']
checksum = md5(''.join(sorted(md5(SEP.join([str(o['n']), str(o['cid']), o['col'], o['path'], o['final'], o['kind'], shipped(o), o.get('nm') or ''])) for o in ops)))

L = []; w = L.append
w('-- ' + '=' * 76)
w(f'-- {spec.TITLE}')
w('--')
for line in spec.WHY: w(f'-- {line}'.rstrip())
w('--')
w(f'-- {len(ops)} guarded edits to course_content rows {", ".join(map(str, touched))}.')
w('-- Each edit checks the current value first (md5 for text, exact match for')
w('-- structured values, absence for new keys, array length + neighbour for')
w('-- inserted steps) and the whole migration aborts, changing nothing, on any')
w('-- mismatch. Section 1 is checksummed so a copy/paste slip also aborts.')
w('-- Long texts with small changes ship as "patch" hunks: each hunk must match')
w('-- exactly once and the patched text must hash to the reviewed new_md5.')
w(f'-- Backup of the touched rows: public.{spec.BACKUP_TABLE} (RLS on, anon and')
w('-- authenticated revoked). Run as ONE transaction (SQL editor, apply_migration,')
w('-- or psql -1); the temp table is ON COMMIT DROP, so a non-transactional run')
w('-- fails before writing anything.')
w('--')
w('-- Rollback (touched rows only):')
w('--   update public.course_content c set session = b.session,')
w('--          troubleshooting = b.troubleshooting, resources = b.resources,')
w('--          updated_at = b.updated_at')
w(f'--     from public.{spec.BACKUP_TABLE} b where b.course_id = c.course_id;')
w('-- ' + '=' * 76)
w('')
w('-- 1. The edits, in order. "final" is where each edit\'s value sits once every')
w('--    later insert has shifted it; the post-check reads it there.')
w('create temp table content_edits (')
w("  ord int primary key, course_id int not null, col text not null check (col in ('session','troubleshooting','resources')),")
w("  path text[] not null, final text[] not null, kind text not null check (kind in ('str','patch','json','add','insert')),")
w('  old_md5 text, old_json text, new_text text not null, new_md5 text')
w(') on commit drop;')
w('')
w('insert into content_edits values')
vals = []
for o in ops:
    p = '{' + ','.join(o['path'].split('.')) + '}'
    f = '{' + ','.join(o['final'].split('.')) + '}'
    om = f"'{o['om']}'" if o['om'] else 'null'
    oj = dq(o['oj'], 'o') if o['oj'] is not None else 'null'
    nm = f"'{o['nm']}'" if o.get('nm') else 'null'
    vals.append(f"  ({o['n']}, {o['cid']}, '{o['col']}', '{p}', '{f}', '{o['kind']}', {om}, {oj},\n    {dq(shipped(o), 'n')}, {nm})")
w(',\n'.join(vals) + ';')
w('')
w('-- 2. Self-check, pre-flight guards, backup, apply, post-check.')
w('do $$')
w('declare e record; cur jsonb; par jsonb; n int; txt text; pr jsonb;')
w('begin')
w("  if (select md5(string_agg(h, '' order by h collate \"C\")) from (")
w("        select md5(concat_ws(E'\\x1f', ord::text, course_id::text, col, array_to_string(path, '.'),")
w("                             array_to_string(final, '.'), kind, new_text, coalesce(new_md5, ''))) as h")
w(f"          from content_edits) s) <> '{checksum}' then")
w("    raise exception 'Section 1 is not the reviewed copy - nothing was changed.';")
w('  end if;')
w(f"  if to_regclass('public.{spec.BACKUP_TABLE}') is not null then")
w(f"    raise exception 'public.{spec.BACKUP_TABLE} already exists - has this migration already run?';")
w('  end if;')
w(f'  create table public.{spec.BACKUP_TABLE} as')
w('    select course_id, session, troubleshooting, resources, updated_at from public.course_content')
w(f'     where course_id in ({", ".join(map(str, touched))});')
w(f'  alter table public.{spec.BACKUP_TABLE} enable row level security;')
w(f'  revoke all on public.{spec.BACKUP_TABLE} from anon, authenticated;')
w('')
w('  for e in select * from content_edits order by ord loop')
w("    n := array_length(e.path, 1);")
w("    execute format('select %I #> $1, %I #> $2 from public.course_content where course_id = $3', e.col, e.col)")
w('      into cur, par using e.path, e.path[1:n-1], e.course_id;')
w("    if (e.kind in ('str', 'patch') and md5(cur #>> '{}') is distinct from e.old_md5)")
w("       or (e.kind = 'json' and cur is distinct from e.old_json::jsonb)")
w("       or (e.kind = 'add' and (cur is not null or jsonb_typeof(par) is distinct from 'object'))")
w("       or (e.kind = 'insert' and (jsonb_typeof(par) is distinct from 'array'")
w("            or jsonb_array_length(par) <> e.old_json::int")
w("            or md5(coalesce(cur ->> 'instruction', cur #>> '{}')) is distinct from e.old_md5)) then")
w("      raise exception 'edit % (course % %.%) does not match the audited value - nothing was changed',")
w("        e.ord, e.course_id, e.col, array_to_string(e.path, '.');")
w('    end if;')
w("    if e.kind = 'patch' then")
w("      -- replay the reviewed hunks; each must match exactly once, and the result must hash to new_md5")
w("      txt := cur #>> '{}';")
w("      for pr in select value from jsonb_array_elements(e.new_text::jsonb) loop")
w("        if (length(txt) - length(replace(txt, pr ->> 0, ''))) / length(pr ->> 0) <> 1 then")
w("          raise exception 'edit % (course %): a patch hunk does not match exactly once - nothing was changed', e.ord, e.course_id;")
w("        end if;")
w("        txt := replace(txt, pr ->> 0, pr ->> 1);")
w("      end loop;")
w("      if md5(txt) <> e.new_md5 then")
w("        raise exception 'edit % (course %): patched text is not the reviewed result - nothing was changed', e.ord, e.course_id;")
w("      end if;")
w("      execute format('update public.course_content set %I = jsonb_set(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)")
w('        using e.path, to_jsonb(txt), e.course_id;')
w("    elsif e.kind = 'insert' then")
w("      execute format('update public.course_content set %I = jsonb_insert(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)")
w('        using e.path, e.new_text::jsonb, e.course_id;')
w('    else')
w("      execute format('update public.course_content set %I = jsonb_set(%I, $1, $2), updated_at = now() where course_id = $3', e.col, e.col)")
w("        using e.path, case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end, e.course_id;")
w('    end if;')
w('  end loop;')
w('')
w('  for e in select * from content_edits order by ord loop')
w("    execute format('select %I #> $1 from public.course_content where course_id = $2', e.col)")
w('      into cur using e.final, e.course_id;')
w("    if (e.kind = 'patch' and md5(cur #>> '{}') is distinct from e.new_md5)")
w("       or (e.kind <> 'patch' and cur is distinct from (case when e.kind = 'str' then to_jsonb(e.new_text) else e.new_text::jsonb end)) then")
w("      raise exception 'post-check: edit % (course %) did not land - rolling back', e.ord, e.course_id;")
w('    end if;')
w('  end loop;')
w(f'  if exists (select 1 from public.course_content where updated_at = now() and course_id not in ({", ".join(map(str, touched))})) then')
w("    raise exception 'post-check: an untouched row changed - rolling back';")
w('  end if;')
w('end $$;')
open(out_path, 'w').write('\n'.join(L) + '\n')
print(f'{len(ops)} edits on rows {touched} -> {out_path} ({sum(len(x) for x in L)} chars)')
