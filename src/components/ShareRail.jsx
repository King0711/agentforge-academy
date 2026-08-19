import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { shareUrl } from '../utils/generateArticleShareText';
import { TARGETS, copyShareLink } from './shareTargets';

// Floating vertical share rail, pinned to the left gutter.
//
// Replaces relying on the inline ShareRow alone, which sits below the whole
// article: on a long guide that put it 5034px down a 5959px page, so a
// reader had to scroll past every word and the FAQs before finding any way
// to share. A fixed rail is in view for the entire read.
//
// lg: and up ONLY. The content column is max-w-3xl (768px) centred, so the
// gutter is (viewport - 768) / 2 -- 128px at the lg breakpoint (1024px),
// which comfortably clears the 44px rail plus its offset, but only ~66px at
// 900px, where the rail would sit on top of the text. Below lg the inline
// ShareRow is shown instead, and the two are mutually exclusive so no
// screen ever gets both.
// Colours: icons, dividers and the border use semantic tokens
// (text-body-strong, bg-border) with NO dark: override — those repaint
// themselves from :root[data-theme="dark"], per the note in src/index.css.
// Measured: the icon goes #3A3358 on the near-white pill in light and
// #E5E1EE on the dark pill in dark, both comfortably legible.
//
// Only the pill's own background and shadow carry an explicit dark:
// variant, because they're arbitrary values (bg-[#1C1B22]) rather than
// tokens — exactly the exception index.css calls out, since Tailwind bakes
// literal hex into the utility instead of referencing a variable.
export default function ShareRail({ section, slug, title }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (await copyShareLink(shareUrl(section, slug, 'copy'))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="hidden lg:flex fixed left-5 xl:left-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center py-1.5 rounded-full bg-white/95 dark:bg-[#1C1B22]/95 backdrop-blur border border-border shadow-[0_8px_28px_rgba(26,19,51,.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,.5)]">
      {/* Not a <nav>/<ul>: this is a small set of controls, and the label
          below already names the group for screen readers. */}
      <span className="sr-only" id="share-rail-label">Share this page</span>

      {TARGETS.map(({ id, label, Icon, href }, i) => (
        <a
          key={id}
          href={href(shareUrl(section, slug, id), title)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Share on ${label}`}
          title={`Share on ${label}`}
          className={`group relative w-11 h-11 flex items-center justify-center text-body-strong hover:text-brand transition-colors ${
            i > 0 ? 'before:absolute before:top-0 before:inset-x-2.5 before:h-px before:bg-border' : ''
          }`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title={copied ? 'Link copied' : 'Copy link'}
        className="relative w-11 h-11 flex items-center justify-center text-body-strong hover:text-brand transition-colors before:absolute before:top-0 before:inset-x-2.5 before:h-px before:bg-border"
      >
        {copied
          ? <Check className="w-[18px] h-[18px] text-green" />
          : <Link2 className="w-[18px] h-[18px]" />}
      </button>
    </div>
  );
}
