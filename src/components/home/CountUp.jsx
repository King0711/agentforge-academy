import { useEffect, useRef, useState } from 'react';

// Counts a figure up from 0 the first time it scrolls into view. `value` is the
// text exactly as it should end up ("500+", "25"): the leading digits are
// animated and anything after them ("+") is kept.
//
// The final figure is always what renders first, so the prerendered snapshot,
// a visitor with JavaScript off, and anyone who asks for reduced motion all see
// the real number. The script that builds the snapshot is a headless browser
// (navigator.webdriver), which is skipped on purpose: otherwise it would bake
// a half-counted number into the page. Screen readers get the final figure
// only, not every step on the way.
const DURATION_MS = 1600;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

export default function CountUp({ value }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const match = /^(\d+)(.*)$/.exec(value);
    const skip =
      !el ||
      !match ||
      typeof IntersectionObserver === 'undefined' ||
      navigator.webdriver ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (skip) return undefined;

    const target = Number(match[1]);
    const suffix = match[2];
    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          setShown(t < 1 ? `${Math.round(target * easeOutCubic(t))}${suffix}` : value);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        setShown(`0${suffix}`);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
