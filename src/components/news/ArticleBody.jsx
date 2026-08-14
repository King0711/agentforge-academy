// React counterpart to renderBlocksToHtml in src/lib/newsBlocks.js — same
// block-type switch, kept intentionally tiny so the two stay easy to keep
// in sync by eye. React already escapes text content, so no manual
// escaping is needed here (unlike the string-based HTML renderer).
export default function ArticleBody({ blocks }) {
  return (
    <div className="space-y-4 text-[16px] leading-relaxed text-body">
      {(blocks || []).map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={i} className="font-display font-extrabold text-[22px] text-ink mt-8 mb-1">
                {block.text}
              </h2>
            );
          case 'quote':
            return (
              <blockquote key={i} className="border-l-[3px] border-brand pl-4 italic text-body-strong">
                {block.text}
              </blockquote>
            );
          case 'list':
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5">
                {(block.items || []).map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case 'paragraph':
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </div>
  );
}
