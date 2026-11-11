// The quote form's fields, shared by the pages that send visitors to /contact with some of
// them filled in (React Router location state, so nothing typed ends up in the address bar).
import type { SERVICE_OPTIONS, TRAILERS } from './business';

export type Service = (typeof SERVICE_OPTIONS)[number];
export type Trailer = (typeof TRAILERS)[number];
export type QuoteState = { service: Service; equip: Trailer; from: string; to: string };

export const QUOTE_DEFAULT: QuoteState = { service: 'Trucking (one load)', equip: 'Flatbed', from: '', to: '' };

// focus: put the cursor in "Your name" (used by the home page quick quote, where the visitor
// is already typing). Without it the form just scrolls into view.
export type QuoteNav = { quote: Partial<QuoteState>; focus?: boolean };

export const quoteFor = (service: Service, equip?: Trailer): QuoteNav => ({ quote: equip ? { service, equip } : { service } });
