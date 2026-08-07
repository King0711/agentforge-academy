// Shared full-bleed layout for every webinar slide — mirrors the hero/section
// patterns from Home.jsx (radial gradients, floaty decorative blobs, centered
// max-width content) so slides read as zoomed-in homepage sections rather
// than a foreign presentation tool.
export default function SlideShell({ children, background, decorations = false, contentClassName = '', className = '' }) {
  return (
    <div
      className={`relative w-full min-h-full flex items-center justify-center overflow-hidden px-5 sm:px-10 lg:px-16 py-14 sm:py-20 ${className}`}
      style={background ? { background } : undefined}
    >
      {decorations && (
        <>
          <div
            className="absolute top-10 right-[10%] w-[130px] h-[130px] bg-yellow opacity-40 animate-floaty pointer-events-none hidden sm:block"
            style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
          />
          <div
            className="absolute bottom-10 left-[12%] w-[80px] h-[80px] bg-emerald-400 opacity-30 animate-floaty pointer-events-none hidden sm:block"
            style={{ borderRadius: '50%', animationDelay: '.5s' }}
          />
        </>
      )}
      <div className={`relative w-full max-w-5xl mx-auto ${contentClassName}`}>{children}</div>
    </div>
  );
}
