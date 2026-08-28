import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div className="ambient" />
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}>404</span>
        <h1 className="display serif" style={{ marginBottom: 16 }}>This dream dissolved</h1>
        <p className="lede" style={{ margin: '0 auto 32px' }}>
          The page you were looking for isn't here. Let's get you back to interpreting.
        </p>
        <Link to="/" className="btn btn-primary">Return Home</Link>
      </div>
    </div>
  );
}
