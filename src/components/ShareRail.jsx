import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { shareUrl } from '../utils/shareText';
import { TARGETS, copyShareLink } from './shareTargets';

// Floating vertical share rail, pinned to the left gutter.
//
// Replaces relying on the inline ShareRow alone, which sits below the whole
// article: on a long guide that put it 5034px down a 5959px page, so a
// reader had to scroll past every word and the FAQs before finding any way
// to share. A fixed rail is in view for the entire read.
//
// Rendered at every width, always in the left gutter.
//
// From lg up there is a real gutter to sit in: the content column is
// max-w-3xl (768px) centred, so the gutter is (viewport - 768) / 2 -- 128px
// at lg, comfortably clearing the 44px rail plus its offset.
//
// Below lg there is no gutter, so the rail would cover the text if nothing
// else changed. Two things make it fit instead: it shrinks (36px buttons at
// an 8px offset, a 44px footprint against 64px at lg), and both article
// containers carry a matching left padding below lg -- see the pl-14 on
// GuidePage.jsx and NewsArticle.jsx. Those paddings and the offsets here
// are one measurement in two places; change them together or the rail lands
// on the first character of every line.
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
    <div className="flex fixed left-2 sm:left-3 lg:left-5 xl:left-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center py-1 lg:py-1.5 rounded-full bg-white/95 dark:bg-[#1C1B22]/95 backdrop-blur border border-border shadow-[0_8px_28px_rgba(26,19,51,.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,.5)]">
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
          className={`group relative w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center text-body-strong hover:text-brand transition-colors ${
            i > 0 ? 'before:absolute before:top-0 before:inset-x-2 lg:before:inset-x-2.5 before:h-px before:bg-border' : ''
          }`}
        >
          <Icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title={copied ? 'Link copied' : 'Copy link'}
        className="relative w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center text-body-strong hover:text-brand transition-colors before:absolute before:top-0 before:inset-x-2 lg:before:inset-x-2.5 before:h-px before:bg-border"
      >
        {copied
          ? <Check className="w-4 h-4 lg:w-[18px] lg:h-[18px] text-green" />
          : <Link2 className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />}
      </button>
    </div>
  );
}
