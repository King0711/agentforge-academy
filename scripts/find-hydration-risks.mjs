// Finds JSX that will break hydration against a prerendered static snapshot.
//
// The bug: adjacent JSX children that BOTH produce text — e.g. `Week {week}`
// or `₦{price}` — render as two separate DOM text nodes on the client, but
// serialize into static HTML as one merged text node. React's hydration pass
// expects the two-node structure it would render, finds one, and throws
// #418 (see src/main.jsx's hydrateRoot call). Fix is to wrap the dynamic
// half in its own <span> so a real element boundary survives the round-trip.
//
// An intervening JSXElement is a barrier — it creates its own DOM node, so
// text on either side of it can't merge. Only runs of text/expression
// siblings with no element between them are reported.
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function classify(node) {
  if (node.type === 'JSXText') {
    if (node.value.trim()) return 'text';
    // Whitespace-only text is only dropped when it spans a line break. A
    // plain space on the same line survives — which is why `<Icon /> {t}`
    // still merges: its children are [element, " ", expression], and that
    // space and the expression are two adjacent text nodes on the client
    // but one in the serialized HTML. Missing this is what let a whole
    // category of these through the first time.
    return node.value.includes('\n') ? null : 'text';
  }
  if (node.type === 'JSXExpressionContainer') {
    const e = node.expression;
    if (e.type === 'JSXEmptyExpression') return null;      // a bare comment
    if (e.type === 'LogicalExpression') return 'maybe';    // {cond && <El/>} usually renders an element
    if (e.type === 'ConditionalExpression') return 'maybe';
    return 'expr';
  }
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return 'element';
  return null;
}

function snippet(src, node) {
  return src.slice(node.start, node.end).replace(/\s+/g, ' ').trim().slice(0, 70);
}

async function main() {
  const files = [];
  for await (const f of glob('src/**/*.jsx', { cwd: root })) files.push(f);
  files.sort();

  let total = 0;

  for (const rel of files) {
    const src = await readFile(path.join(root, rel), 'utf-8');
    let ast;
    try {
      ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
    } catch {
      console.error(`  ! could not parse ${rel}`);
      continue;
    }

    const hits = [];

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }

      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        const kids = node.children.map((c) => ({ kind: classify(c), node: c })).filter((k) => k.kind);
        // Walk the sibling run; an 'element' resets it.
        let run = [];
        for (const k of kids) {
          if (k.kind === 'element') { run = []; continue; }
          run.push(k);
          if (run.length >= 2) {
            const kinds = run.map((r) => r.kind);
            // Only a text+expr pair actually merges. expr+expr merges too.
            if (kinds.includes('expr') && (kinds.includes('text') || kinds.filter((x) => x === 'expr').length > 1)) {
              const line = run[0].node.loc.start.line;
              if (!hits.some((h) => h.line === line)) {
                hits.push({ line, code: snippet(src, node) });
              }
            }
          }
        }
      }
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        walk(node[key]);
      }
    };

    walk(ast.program.body);

    if (hits.length) {
      console.log(`\n${rel}`);
      for (const h of hits) {
        console.log(`  ${h.line}: ${h.code}`);
        total += 1;
      }
    }
  }

  console.log(`\n${total} potential hydration mismatch${total === 1 ? '' : 'es'} found.`);
}

main();
