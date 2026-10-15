// Details a visitor already typed into the WhatsApp pre-chat form, carried to
// the guest checkout form (CheckoutAuthModal) when they choose "Pay now" so
// they don't type their name and email twice. sessionStorage, not the URL, so
// personal data never lands in a link, and it goes when the tab closes.
const KEY = 'sdt_checkout_prefill';

export function saveCheckoutPrefill({ name = '', email = '' }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));
  } catch {
    // storage blocked (private window) — the form just opens empty
  }
}

export function readCheckoutPrefill() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) || '{}');
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
    };
  } catch {
    return { name: '', email: '' };
  }
}
