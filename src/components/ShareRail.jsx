import { useEffect, useRef, useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';
import { shareUrl } from '../utils/shareText';
import { TARGETS, copyShareLink } from './shareTargets';

// Floating share control, pinned to the left gutter, in two different
// shapes depending on width.
//
// lg and up: the classic always-open vertical rail. The content column is
// max-w-3xl (768px) centred, so the gutter is (viewport - 768) / 2 -- 128px
// at lg, comfortably clearing the 44px rail plus its offset.
//
// Below lg: a collapsed 32px toggle that expands downward into the same
// icon set on tap. Below lg there is no real gutter, so an always-open rail
// either covers the text or forces the article to give back reading width
// permanently for something used once per visit. A collapsed toggle needs
// permanent space for only itself -- the expanded flyout is `absolute`, so
// it does not affect the container's box and can overlay text briefly
// without the article ever reserving room for it. GuidePage.jsx and
// NewsArticle.jsx reserve just enough left padding for the collapsed
// button; keep that padding and this button's size/offset in step.
export default function ShareRail({ section, slug, title }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mobileRef = useRef(null);

  useEffect(() => {
    if (!expanded) return undefined;
    const onPointerDown = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setExpanded(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const copyLink = async () => {
    if (await copyShareLink(shareUrl(section, slug, 'copy'))) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setExpanded(false);
      }, 1800);
    }
  };

  const pillCls =
    'flex flex-col items-center rounded-full bg-white/95 dark:bg-[#1C1B22]/95 backdrop-blur border border-border shadow-[0_8px_28px_rgba(26,19,51,.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,.5)]';

  const items = (size) => (
    <>
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
          onClick={() => setExpanded(false)}
          className={`group relative ${size} flex items-center justify-center text-body-strong hover:text-brand transition-colors ${
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
        className={`relative ${size} flex items-center justify-center text-body-strong hover:text-brand transition-colors before:absolute before:top-0 before:inset-x-2.5 before:h-px before:bg-border`}
      >
        {copied
          ? <Check className="w-[18px] h-[18px] text-green" />
          : <Link2 className="w-[18px] h-[18px]" />}
      </button>
    </>
  );

  return (
    <>
      {/* Colours: icons, dividers and the border use semantic tokens
          (text-body-strong, bg-border) with NO dark: override — those
          repaint themselves from :root[data-theme="dark"], per the note in
          src/index.css. Measured: the icon goes #3A3358 on the near-white
          pill in light and #E5E1EE on the dark pill in dark, both
          comfortably legible.

          Only the pill's own background and shadow carry an explicit dark:
          variant, because they're arbitrary values (bg-[#1C1B22]) rather
          than tokens — exactly the exception index.css calls out, since
          Tailwind bakes literal hex into the utility instead of
          referencing a variable. */}
      <div className={`hidden lg:flex fixed left-5 xl:left-8 top-1/2 -translate-y-1/2 z-30 py-1.5 ${pillCls}`}>
        {items('w-11 h-11')}
      </div>

      <div ref={mobileRef} className="lg:hidden fixed left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide share options' : 'Share this page'}
          className={`w-8 h-8 flex items-center justify-center text-body-strong ${pillCls}`}
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {expanded && (
          <div className={`absolute left-0 top-full mt-2 py-1 ${pillCls}`}>
            {items('w-9 h-9')}
          </div>
        )}
      </div>
    </>
  );
}
