// Header images for news articles and guides — where they live and what
// URL gets written into a row's image_url.
//
// Files go in the Supabase Storage bucket the news pipeline already writes
// to (see supabase/functions/generate-news-digest/index.ts), but rows store
// a first-party URL, not the raw storage one: vercel.json rewrites
// /article-images/* onto the bucket's public endpoint. Two reasons — the
// image is attributed to socialdevtechnologies.com rather than a
// supabase.co host, and swapping storage providers later becomes a rewrite
// change instead of a rewrite of every image_url in the database.
import { SITE_URL } from './ogCards.js';

export const IMAGE_BUCKET = 'news-images';

/** Path prefix served by the vercel.json rewrite. Keep the two in step. */
export const IMAGE_URL_PREFIX = '/article-images/';

// Matches the bucket's allowed_mime_types. Kept as an allowlist rather than
// a bare "image/*" so the client rejects a file with the same message the
// server would, instead of surfacing a raw storage error after the upload.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Mirrors the bucket's file_size_limit. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Every on-site placement renders the image in a 16:9 box with
// object-cover — the two listing cards (News.jsx, GuidesIndex.jsx) and the
// two article heroes (NewsArticle.jsx, GuidePage.jsx). 1200x675 therefore
// fits all four exactly, and still clears LinkedIn's 1200x627 floor for the
// og:image, which crops to ~1.91:1 and loses only a couple dozen pixels.
export const TARGET_IMAGE_WIDTH = 1200;
export const TARGET_IMAGE_HEIGHT = 675;

const TARGET_RATIO = TARGET_IMAGE_WIDTH / TARGET_IMAGE_HEIGHT;

/** Public URL for a stored object, on our own domain. */
export function publicImageUrl(path) {
  return `${SITE_URL}${IMAGE_URL_PREFIX}${path}`;
}

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Storage path for an upload.
 *
 * Deliberately unique per upload rather than a stable `<slug>.jpg`: these
 * are served with a one-year immutable Cache-Control, so re-uploading over
 * an existing path would leave viewers on the old image until the CDN entry
 * expired. A fresh path sidesteps that entirely — the cost is that replaced
 * images linger in the bucket, which is cheap and easy to prune.
 */
export function storagePathFor(slug, file) {
  const base = (slug || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image';
  return `${base}-${Date.now().toString(36)}.${EXTENSIONS[file.type] || 'jpg'}`;
}

/** Human-readable reason this file can't be uploaded, or null if it can. */
export function imageRejectionReason(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG or WebP.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 2MB.`;
  }
  return null;
}

/**
 * Reads a file's pixel dimensions. Resolves null if the browser can't decode
 * it — the caller treats that as "no warning to show", never as a failure,
 * since the upload itself is what matters.
 */
export function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Advisory note about an image's shape, or null if it's fine. Never blocks
 * an upload — an off-ratio image still renders, it just gets cropped by the
 * object-cover boxes, and the admin is better served by a note than a
 * refusal.
 */
export function imageSizeWarning(size) {
  if (!size) return null;
  const ratio = size.width / size.height;
  // ~2% tolerance, which accepts 1920x1080 and 1280x720 alongside the target
  // but still catches a square or a 3:2 straight out of an image generator.
  if (Math.abs(ratio - TARGET_RATIO) > 0.04) {
    return `That image is ${size.width}x${size.height} (${ratio.toFixed(2)}:1). It will be cropped to fit — ${TARGET_IMAGE_WIDTH}x${TARGET_IMAGE_HEIGHT} fits exactly.`;
  }
  if (size.width < TARGET_IMAGE_WIDTH) {
    return `That image is only ${size.width}px wide — ${TARGET_IMAGE_WIDTH}px is the target, and social cards need at least 1200px.`;
  }
  return null;
}
