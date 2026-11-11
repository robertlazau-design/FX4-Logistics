import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/business';

export default function NotFound() {
  return (
    <section className="cream" style={{ minHeight: '50vh' }}>
      <div className="wrap center">
        <p className="eyebrow">Wrong exit</p>
        <h1 style={{ fontSize: 'clamp(36px,5vw,56px)' }}>Page not found.</h1>
        <p className="lede">That page isn't here. Head back to the home page, or call us and we'll point you the right way.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <Link className="btn btn-red" to="/">Back to the home page</Link>
          <a className="btn btn-line" href={BUSINESS.phoneHref}>Call {BUSINESS.phoneDisplay}</a>
        </div>
      </div>
    </section>
  );
}
