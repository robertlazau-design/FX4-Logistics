import { track } from '@vercel/analytics';

// Lead events for the monthly growth report (Vercel Web Analytics custom events), named the same
// as on Robert's other client sites. Every event carries two properties at most: the page, and
// where on it the tap was (or, for the quote form, what the request was for). Never send names,
// phone numbers, emails, addresses or message text.

const KINDS: [RegExp, string][] = [
  [/^tel:/i, 'Call Click'],
  [/^sms:/i, 'Text Click'],
  [/^mailto:/i, 'Email Click'],
  [/^https?:\/\/(maps\.google\.|www\.google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.apple\.com)/i, 'Directions Click'],
];

// Where on the page the link was: a data-spot label if one is set, else the phone bar, header,
// footer, the section's id, or "page".
export function spotOf(el: Element): string {
  const tagged = el.closest('[data-spot]');
  if (tagged) return tagged.getAttribute('data-spot') || 'page';
  if (el.closest('.mbar')) return 'phone-bar';
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  return el.closest('section[id]')?.id || 'page';
}

export function trackLead(name: string, el?: Element | null) {
  track(name, { page: window.location.pathname, spot: el ? spotOf(el) : 'page' });
}

// The quote form: "Form Sent" with what the request was for (a choice from the form's own list,
// e.g. "Warehousing / storage"), or "Form Error" when it couldn't send.
export function trackForm(name: 'Form Sent' | 'Form Error', service?: string) {
  track(name, service ? { page: window.location.pathname, service } : { page: window.location.pathname });
}

// One listener for the whole site, so every call, email and directions link counts, including
// ones added later. Capture phase, so it still counts if a handler stops the click.
export function startLeadEvents() {
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const kind = KINDS.find(([re]) => re.test(href));
      if (kind) trackLead(kind[1], link);
    },
    { capture: true },
  );
}
