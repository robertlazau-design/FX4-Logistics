import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App, { isPortal } from './App';
import { startLeadEvents } from './leadEvents';
import './fonts';
import './index.css';

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
      {/* The team portal is never counted: drivers aren't tracked (see src/portal). */}
      <Analytics beforeSend={(e) => (isPortal(new URL(e.url).pathname) ? null : e)} />
    </BrowserRouter>
  </StrictMode>
);

// Production pages are prerendered (scripts/prerender.mjs); dev serves an empty root.
const root = document.getElementById('root')!;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

// Count call, email and directions taps from any page (see leadEvents.ts).
startLeadEvents();
