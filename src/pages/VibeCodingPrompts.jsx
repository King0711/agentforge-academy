import { Link } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useVibeCodingPrompts } from '../hooks/useVibeCodingContent';

// Card text is plain: blank lines separate blocks, a line ending in ":" is a
// small label, and lines starting "- " are bullets. Anything else is a paragraph.
function renderBlock(block, i) {
  const lines = block.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return null;

  const items = [];
  let bullets = [];
  const flush = () => {
    if (bullets.length) {
      items.push(
        <ul key={`ul-${items.length}`} className="list-disc pl-5 space-y-1 mb-3">
          {bullets.map((b, j) => <li key={j}>{b}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      return;
    }
    flush();
    if (line.endsWith(':') && line.length < 70) {
      items.push(<p key={`l-${items.length}`} className="font-bold text-ink text-[13px] mt-1 mb-1.5">{line.slice(0, -1)}</p>);
    } else {
      items.push(<p key={`p-${items.length}`} className="mb-3">{line}</p>);
    }
  });
  flush();

  return <div key={i}>{items}</div>;
}

function GuideCard({ guide, number }) {
  const blocks = guide.prompt_text.split(/\n\s*\n/);
  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 sm:p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-link font-bold text-[13px] flex items-center justify-center flex-shrink-0">{number}</span>
        <h2 className="font-display font-bold text-[16px] text-ink">{guide.title}</h2>
      </div>
      <div className="text-[14px] text-body-strong leading-relaxed">
        {blocks.map(renderBlock)}
      </div>
    </div>
  );
}

export default function VibeCodingPrompts() {
  const { hasVibeCoding, proLoading } = usePro();
  const { prompts, loading, locked } = useVibeCodingPrompts();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link to="/vibe-coding" className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-link transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Vibe Coding Bootcamp
      </Link>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2">Concept guide</h1>
      <p className="text-body text-[14.5px] mb-8">
        Plain-English explanations of what you are building and what is happening underneath: the database, the backend, GitHub, security and more. Nothing to copy. Read a card, then tell the AI what to build and ask it to explain what it made.
      </p>

      {(proLoading || loading) ? (
        <div className="flex items-center justify-center py-16 text-body gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : !proLoading && (!hasVibeCoding || locked) ? (
        <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl">
          <Lock className="w-8 h-8 text-link" />
          <p className="font-bold text-ink">Join the launch cohort to unlock the concept guide</p>
          <Link to="/vibe-coding#pricing" className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            See the offer
          </Link>
        </div>
      ) : (
        <div>
          {prompts?.map((p, i) => <GuideCard key={p.id} guide={p} number={i + 1} />)}
        </div>
      )}
    </div>
  );
}
