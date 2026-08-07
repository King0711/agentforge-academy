import { useState } from 'react';
import { Play } from 'lucide-react';

// Lightweight "click-to-load" YouTube embed. The real iframe pulls in
// ~1.5MB of YouTube's own JS/CSS plus third-party cookies the instant it's
// in the DOM — loading that unconditionally on page load (as a plain
// <iframe src="youtube.com/embed/...">) was the single biggest render-
// blocking / third-party-cookie contributor on the homepage per Lighthouse.
// This renders just a thumbnail + play button until the user actually
// wants the video, and only then swaps in the real iframe.
export default function YouTubeFacade({ videoId, title, className = '', thumbnailSrc }) {
  const [playing, setPlaying] = useState(false);
  // Defaults to YouTube's own CDN (i.ytimg.com), which only serves a 2-hour
  // cache lifetime — fine for the many different per-agent thumbnails in
  // AgentModal, but the homepage hero passes a self-hosted thumbnailSrc
  // (see public/video-thumbnail.jpg) so that one specific always-loaded
  // image gets our own long-lived Cache-Control (vercel.json) instead.
  const thumbnail = thumbnailSrc || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`${className} relative flex items-center justify-center bg-cover bg-center group`}
      style={{ backgroundImage: `url(${thumbnail})` }}
    >
      <span className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
      <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <Play className="w-6 h-6 sm:w-7 sm:h-7 text-brand ml-1" fill="currentColor" />
      </span>
    </button>
  );
}
