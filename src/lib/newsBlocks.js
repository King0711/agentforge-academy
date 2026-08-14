// Article bodies are stored as a small set of structured JSON blocks rather
// than markdown/HTML — no markdown parser is installed anywhere in this
// repo, and constraining the drafting LLM to a fixed block shape keeps its
// output predictable (no hallucinated markdown syntax to sanitize).
//
// This file is the plain-JS half of the renderer (usable from both a React
// component and the Vercel serverless function, which has no JSX build
// step) — escapeHtml + renderBlocksToHtml. The JSX half (renderBlocksToJsx)
// lives in the same file since Vite happily compiles JSX in any .js file
// with a JSX-producing function, keeping both renderers next to the one
// block-type switch they share conceptually.

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Plain-string HTML renderer — used server-side (api/news/[slug].js) where
// there's no React runtime, so crawlers/no-JS clients get real markup.
export function renderBlocksToHtml(blocks) {
  return (blocks || [])
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h2>${escapeHtml(block.text)}</h2>`;
        case 'quote':
          return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
        case 'list':
          return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
        case 'paragraph':
        default:
          return `<p>${escapeHtml(block.text)}</p>`;
      }
    })
    .join('\n');
}
