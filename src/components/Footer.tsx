import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="word" aria-hidden="true" />
        <div className="cols">
          <div>
            <h2>{BUSINESS.name}</h2>
            <p style={{ margin: 0 }}>Locally owned trucking and warehousing in {BUSINESS.city}, Oregon.</p>
          </div>
          <div>
            <h2>Contact</h2>
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
            <h2>Services</h2>
            <ul>
              <li><Link to="/trucking">Flatbed, step deck &amp; dry van</Link></li>
              <li><Link to="/warehousing">Warehousing &amp; storage</Link></li>
              <li><Link to="/service-area">Service area</Link></li>
              <li><Link to="/driver-jobs">Driver jobs</Link></li>
            </ul>
          </div>
          <div>
            <h2>Company</h2>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/contact">Request a quote</Link></li>
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
