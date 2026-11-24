// Privacy and text messages: what the website and the team portal keep, and the sign-in texts.
// Written from what the code does (the quote form, Vercel Web Analytics, api/portal.ts). Any
// change to what's collected changes this page too. Daniel (and ideally FX4's lawyer) OKs the
// wording; it's also the page an alert-text registration (A2P 10DLC) will point to.
import { BUSINESS } from '../data/business';
import { PageHero } from '../components/PageParts';

export default function Privacy() {
  return (
    <>
      <PageHero crumb="Privacy" title="Privacy and text messages." lede="What this website and FX4’s team portal keep, who sees it, and the texts the portal sends." />
      <section className="prose-sec">
        <div className="wrap prose">
          <h2>The website</h2>
          <p>
            When you send a request for a quote, what you type in the form (your name, company, phone, email, the freight and any message) is emailed to FX4 dispatch at{' '}
            <a href={BUSINESS.emailHref}>{BUSINESS.email}</a> through a form service, Web3Forms. FX4 uses it to answer your request.
          </p>
          <p>
            The site counts visits with Vercel Web Analytics, which uses no cookies. It also counts taps on the phone number, email address and directions links, and whether a quote request
            went through. Those counts never include your name, number, email or message.
          </p>

          <h2>The team portal</h2>
          <p>The FX4 team portal is for FX4’s own drivers and office. It isn’t open to the public. It keeps:</p>
          <ul>
            <li>Each team member’s name, job title and cell number. A cell number shows to the rest of the team only if that person agreed.</li>
            <li>Which phones are signed in, and when, so the office can switch a phone off.</li>
            <li>Sign-offs on FX4’s rules: who signed which version, and when.</li>
            <li>Problem, crash and roadside inspection reports, with their photos. Photos are private: only the office and the driver who sent them can open them.</li>
            <li>Announcements, and a log of every change, so the records can be checked.</li>
          </ul>
          <p>
            Nothing in the portal is deleted. Federal rules say how long FX4 must keep some of it: crash records 3 years and roadside inspection reports 12 months. Lock codes are never put in
            the portal.
          </p>

          <h2>Sign-in texts</h2>
          <p>
            A driver signs in to the portal once per phone with a 6-digit code texted to the cell number the office has for them. A code is sent only when the driver asks for one on the
            sign-in screen, and it’s the only text the portal sends. Message and data rates may apply. To stop the texts, or to change the number, call the office.
          </p>

          <h2>Questions</h2>
          <p>
            Call FX4 at <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> or email <a href={BUSINESS.emailHref}>{BUSINESS.email}</a>. {BUSINESS.name}, {BUSINESS.street},{' '}
            {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}.
          </p>
        </div>
      </section>
    </>
  );
}
