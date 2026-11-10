import { BUSINESS } from '../data/business';

export default function Footer({ base }: { base: string }) {
  return (
    <footer>
      <div className="wrap">
        <div className="word" aria-hidden="true" />
        <div className="cols">
          <div>
            <h4>{BUSINESS.name}</h4>
            <p style={{ margin: 0 }}>Locally owned trucking and warehousing in {BUSINESS.city}, Oregon.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>
                <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
              </li>
              <li>{BUSINESS.street}</li>
              <li>
                {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}
              </li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><a href={`${base}#services`}>Flatbed &amp; step deck</a></li>
              <li><a href={`${base}#services`}>Dry van</a></li>
              <li><a href={`${base}#warehouse`}>Warehousing</a></li>
              <li><a href={`${base}#drivers`}>Driver jobs</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li className="mono" style={{ fontSize: 14 }}>USDOT {BUSINESS.usdot}</li>
              <li className="mono" style={{ fontSize: 14 }}>MC {BUSINESS.mc}</li>
              <li>Sister company: {BUSINESS.sister}, heavy truck &amp; trailer repair</li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 {BUSINESS.name} All rights reserved.</span>
          <span>Website by Golden Boy Productions</span>
        </div>
      </div>
    </footer>
  );
}
