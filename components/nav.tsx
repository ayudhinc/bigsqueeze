export function Nav() {
  return (
    <nav className="nav">
      <div className="shell nav__inner">
        <div className="brand">
          <div className="brand__mark">F</div>
          FilmWrite <small>v0.4 · beta</small>
        </div>
        <div className="nav__links">
          <a href="#studio">Studio</a>
          <a href="#how">Pipeline</a>
          <a href="#films">Films</a>
          <a href="#waitlist">Waitlist</a>
        </div>
        <a href="#waitlist" className="nav__cta">
          Request access
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 5h6M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
