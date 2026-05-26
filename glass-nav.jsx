/* =========================================================
   NAV + shared UI atoms
   ========================================================= */

function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState('mission');
  const logoRef = React.useRef(null);

  /* scroll state */
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* active section via IntersectionObserver */
  React.useEffect(() => {
    const ids = ['mission','about','services','industries','portfolio','contact'];
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  /* logo sway — driven by environment.jsx unified rAF (no extra loop) */
  React.useEffect(() => {
    const hook = () => {
      const bus = window.__nexoraNavSway;
      if (bus) bus.el = logoRef.current;
    };
    hook();
    const t = setTimeout(hook, 0);
    return () => {
      clearTimeout(t);
      const bus = window.__nexoraNavSway;
      if (bus && bus.el === logoRef.current) bus.el = null;
    };
  }, []);

  const goto = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
  };

  const NavLink = ({ id, label }) => {
    const isAct = active === id;
    return (
      <a className="nav-link" href={`#${id}`} onClick={goto(id)}
        style={{ color: isAct ? '#fff' : undefined, position: 'relative' }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
        {isAct && (
          <span aria-hidden="true" style={{
            position: 'absolute', inset: 2, borderRadius: 999,
            background: 'rgba(184,169,249,0.16)', border: '1px solid rgba(184,169,249,0.28)',
          }} />
        )}
      </a>
    );
  };

  return (
    <div className="nav-wrap">
      <nav className={`nav-pill glass ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-links">
          <NavLink id="mission"  label="Mission"  />
          <NavLink id="services" label="Services" />
        </div>

        <a className="nav-logo" href="#mission" onClick={goto('mission')} aria-label="Nexora"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(200,194,250,.35), rgba(184,169,249,.08) 70%)',
            border: '1px solid rgba(200,194,250,.38)',
            boxShadow: 'inset 0 0 12px rgba(200,194,250,.20), 0 0 24px rgba(184,169,249,.22)',
          }}
        >
          <div ref={logoRef} style={{ display: 'grid', placeItems: 'center', willChange: 'transform' }}>
            <img
              src="assets/logo-white.svg"
              width={22} height={22}
              alt=""
              style={{ display: 'block' }}
            />
          </div>
          <span className="logo-pulse" aria-hidden="true" />
        </a>

        <div className="nav-links">
          <NavLink id="portfolio" label="Work"    />
          <NavLink id="contact"   label="Contact" />
        </div>
      </nav>
    </div>
  );
}

/* ---------- Reveal helper: word-by-word stagger with descender-safe mask ---------- */
function RevealText({ text, as = 'span', delay = 0, perChar = false, className = '' }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { threshold: 0.2 });
  const Tag = as;

  if (perChar) {
    return (
      <Tag ref={ref} className={className} style={{ display: 'inline-block' }}>
        {text.split('').map((c, i) => (
          <span key={i} style={{
            display: 'inline-block',
            transform: inView ? 'translateY(0)' : 'translateY(0.7em)',
            opacity: inView ? 1 : 0,
            transition: `transform .9s cubic-bezier(.22,1,.36,1) ${delay + i * 0.015}s, opacity .9s ease ${delay + i * 0.015}s`,
            whiteSpace: c === ' ' ? 'pre' : 'normal',
          }}>{c}</span>
        ))}
      </Tag>
    );
  }

  const words = text.split(' ');
  return (
    <Tag ref={ref} className={className} style={{ display: 'inline-block' }}>
      {words.map((w, i) => (
        <span key={i} className="reveal-mask">
          <span style={{
            display: 'inline-block',
            transform: inView ? 'translateY(0)' : 'translateY(110%)',
            transition: `transform 1.05s cubic-bezier(.22,1,.36,1) ${delay + i * 0.07}s`,
          }}>
            {w}{i < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* ---------- Fade in helper ---------- */
function FadeIn({ children, delay = 0, y = 30, className = '' }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { threshold: 0.15 });
  return (
    <div ref={ref} className={className} style={{
      transform: inView ? 'translateY(0)' : `translateY(${y}px)`,
      opacity: inView ? 1 : 0,
      transition: `transform 1.05s cubic-bezier(.22,1,.36,1) ${delay}s, opacity .9s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ---------- Magnetic Button ---------- */
function MagneticBtn({ children, onClick, className = '', strength = 0.4, radius = 160, primary = false }) {
  const { ref, x, y } = useMagnetic({ strength, radius });
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`btn ${primary ? 'btn-primary' : ''} ${className}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      {children}
    </button>
  );
}

/* ---------- Section header ---------- */
function SectionHead({ eyebrow, title, meta }) {
  return (
    <div className="section-head">
      <div className="col" style={{ gap: 14, maxWidth: 880 }}>
        <FadeIn y={20} delay={0.05}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <span className="badge">
              <span className="badge-glyph" aria-hidden="true" />
              {eyebrow}
            </span>
          </div>
        </FadeIn>
        <h2><RevealText text={title} delay={0.1} /></h2>
      </div>
      {meta && (
        <FadeIn delay={0.25} y={20}>
          <div className="meta body-m">{meta}</div>
        </FadeIn>
      )}
    </div>
  );
}

/* ---------- Logo glyph (mask, currentColor) ---------- */
function LogoGlyph({ size = 24, variant = 'small', className = '', style }) {
  const cls = variant === 'big' ? 'logo-mask-big' : 'logo-mask-small';
  return (
    <span
      aria-hidden="true"
      className={`${cls} ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}

Object.assign(window, { Nav, RevealText, FadeIn, MagneticBtn, SectionHead, LogoGlyph });
