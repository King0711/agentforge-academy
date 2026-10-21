import { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

// A real live AI Agent Mastery class (Module 2, "Ready-Made Agent Recipes"),
// the whole Zoom view: the shared slide plus the instructor and attendee tiles,
// shown with the founder's approval. At hero width the slide's small print is
// too small to read, so it opens full size in a dialog (same approach as the
// screenshots in HowGuidesWork).
const SLIDE = {
  src: '/images/class-agent-recipes.webp',
  width: 1860,
  height: 850,
  alt: 'A live AI Agent Mastery class on Zoom. The shared slide, titled "Ready-Made Agent Recipes", shows four agent blueprints, each as a flow of steps: The Lead Qualifier, The Expense & Invoice Auditor, The FAQ & Escalation Guard and The Automated Research Briefing Agent. Video tiles of the instructor and students run down the right side.',
};

export default function ClassSlide() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // showModal() traps focus and closes on Esc; a click on the backdrop (the
  // dialog element itself, outside its content) closes it too.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/25 shadow-float-dark">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge the class screenshot"
          className="group relative block w-full cursor-zoom-in overflow-hidden bg-bg"
        >
          <img
            src={SLIDE.src}
            alt={SLIDE.alt}
            width={SLIDE.width}
            height={SLIDE.height}
            fetchPriority="high"
            decoding="async"
            className="block h-auto w-full"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-[#0F1A2A]/85 px-3 py-1.5 text-xs font-bold text-white"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Enlarge
          </span>
        </button>
      </div>
      <p className="mt-3.5 text-sm leading-normal text-body">A live AI Agent Mastery class on Zoom</p>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        aria-label="Class screenshot, full size"
        className="m-auto w-[min(1200px,94vw)] max-h-[92vh] overflow-auto rounded-2xl border border-border bg-surface p-3 md:p-4 text-ink backdrop:bg-black/70"
      >
        {open && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-deep transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={SLIDE.src} alt={SLIDE.alt} width={SLIDE.width} height={SLIDE.height} className="block h-auto w-full rounded-lg" />
          </div>
        )}
      </dialog>
    </>
  );
}
