// "Put it on my calendar" helpers for lead follow-ups. A web page can't write to
// someone's calendar without an OAuth integration, so we hand over the two
// things every calendar accepts: a pre-filled Google Calendar link and an .ics
// file (Apple Calendar, Outlook and Google all open it).
const DEFAULT_MINUTES = 30;

const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function range(startIso, minutes = DEFAULT_MINUTES) {
  const start = new Date(startIso);
  return { start, end: new Date(start.getTime() + minutes * 60 * 1000) };
}

export function googleCalendarUrl({ title, details = '', startIso, minutes }) {
  const { start, end } = range(startIso, minutes);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    dates: `${stamp(start)}/${stamp(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 text escaping.
const icsText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

export function buildIcs({ id, title, details = '', startIso, minutes }) {
  const { start, end } = range(startIso, minutes);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Social Dev Technologies//Lead follow-ups//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${id}@socialdevtechnologies.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lead follow-up',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(event, filename = 'follow-up.ics') {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
