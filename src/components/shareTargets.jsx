// Share destinations + their brand marks, shared by ShareRail (the floating
// left rail on desktop) and ShareRow (the inline row on narrow screens).
// Extracted so the two presentations can't drift apart on which platforms
// they offer or where they point.

// Brand glyphs as inline SVG: lucide-react v1 dropped every brand icon (no
// Linkedin/Facebook/Twitter export — confirmed against the installed
// build), and a share control loses most of its affordance if it doesn't
// look like the platform it posts to. currentColor so they inherit hover
// state like the lucide icons beside them.
const brandIcon = (path) => function BrandIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={path} />
    </svg>
  );
};

export const LinkedInIcon = brandIcon('M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z');
export const FacebookIcon = brandIcon('M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z');
export const WhatsAppIcon = brandIcon('M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.44 9.88-9.9 9.88M20.5 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.88c0 2.09.55 4.14 1.59 5.94L.06 24l6.33-1.66a11.87 11.87 0 0 0 5.66 1.44h.01c6.55 0 11.89-5.33 11.89-11.88 0-3.17-1.24-6.15-3.48-8.39');

// X is deliberately absent: the audience that matters for this business is
// on LinkedIn and WhatsApp. The admin-side copy panel still generates X
// copy for anyone posting from the brand account.
//
// LinkedIn's endpoint takes only a url — it pulls title and description
// from the page's own og: tags, which is why getting those right (see
// src/lib/ogCards.js) matters more than anything passed here.
export const TARGETS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: LinkedInIcon,
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    Icon: WhatsAppIcon,
    href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

/**
 * Copies `url`, returning whether it landed. The Clipboard API is
 * unavailable on insecure origins and in some in-app browsers, where
 * silently doing nothing would look like a broken button — so fall back to
 * a prompt the reader can copy out of by hand.
 */
export async function copyShareLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt('Copy this link:', url);
    return false;
  }
}
