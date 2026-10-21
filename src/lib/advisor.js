// The floating chat button (WhatsAppFloatButton) listens for this window event
// and opens its form, so any "Talk to an advisor" button on a page can open the
// same one instead of carrying its own copy of the form.
export const OPEN_ADVISOR_EVENT = 'sdt:open-advisor';

export function openAdvisor() {
  window.dispatchEvent(new Event(OPEN_ADVISOR_EVENT));
}
