/* =========================================================
   SECTIONS A — Marquee Ticker, About, Services
   ========================================================= */

/* ---------- Infinite marquee ticker ---------- */
const TICKER_ITEMS = [
  { name: 'Government',  n: 'I/01' },
  { name: 'Education',   n: 'I/02' },
  { name: 'Enterprise',  n: 'I/03' },
  { name: 'Gaming',      n: 'I/04' },
  { name: 'E-Commerce',  n: 'I/05' },
];

function Marquee() {
  const track = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      overflow: 'hidden', width: '100%',
      maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      padding: '36px 0',
    }}>
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 56, paddingRight: 56, flexShrink: 0 }}>
            {track.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                <img
                  src="assets/logo-white.svg"
                  width={22} height={22}
                  alt=""
                  style={{ display: 'block', opacity: 0.85 }}
                />
                <span style={{
                  fontSize: 'clamp(28px, 3.8vw, 56px)',
                  letterSpacing: '-0.03em', fontWeight: 500,
                  color: 'rgba(255,255,255,0.50)',
                  whiteSpace: 'nowrap',
                }}>{it.name}</span>
                <span style={{
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontSize: 12, letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.38)',
                }}>{it.n}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- About: animated counter ---------- */
function Counter({ end, suffix = '', duration = 1400 }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { threshold: 0.4 });
  const [val, setVal] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t) => {
      const e = Math.min(1, (t - start) / duration);
      setVal(Math.round(ease.outCubic(e) * end));
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ---------- 02 ABOUT — mission card + counters
   No scroll-driven scale/rotate transform. The card now uses the same
   entrance pattern (FadeIn) and chrome (glass + sweep, border-radius 28)
   as every other card on the site — Industries bento, Portfolio cases,
   Contact form. Content + counters are unchanged. */
function About() {
  const ref = React.useRef(null);

  return (
    <section id="about" ref={ref} style={{ paddingBottom: 100 }}>
      <div className="container">
        <SectionHead
          eyebrow="02 — Mission"
          title="A studio for the next era of digital."
          meta={<>Nexora is a multidisciplinary digital studio founded on rigorous craft, calm aesthetics, and an obsession with how products feel under the thumb.</>}
        />

        <FadeIn y={36}>
        <div
          className="card glass sweep"
          style={{
            padding: 'clamp(32px, 4vw, 56px)',
            borderRadius: 28,
            position: 'relative',
          }}
        >
          <LogoGlyph
            variant="big"
            size={320}
            style={{
              position: 'absolute', right: -60, bottom: -70,
              color: 'rgba(184,169,249,0.10)', pointerEvents: 'none',
            }}
          />

          <div className="about-grid">
            <div className="col" style={{ gap: 28 }}>
              <FadeIn y={18}>
                <span className="badge">
                  <span className="badge-glyph" />
                  Vision 2030
                </span>
              </FadeIn>
              <FadeIn y={26} delay={0.05}>
                <p style={{
                  margin: 0,
                  fontSize: 'clamp(22px, 2.2vw, 32px)',
                  lineHeight: 1.35, letterSpacing: '-0.015em',
                  color: 'rgba(255,255,255,0.94)', fontWeight: 400,
                }}>
                  Aligned with <strong style={{ fontWeight: 600 }}>Vision 2030</strong>, we partner
                  with <strong style={{ fontWeight: 600 }}>RAM'N'D</strong> to deliver platforms that
                  governments, schools, and enterprises trust at scale —
                  research-led, engineered for resilience.
                </p>
              </FadeIn>
              <FadeIn y={18} delay={0.15}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
                  width: 'fit-content',
                }}>
                  <span className="tick-dot" />
                  <span className="eyebrow" style={{ color: '#fff' }}>Research Lab × RAM'N'D</span>
                </div>
              </FadeIn>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[
                { v: 15, suf: '+', label: 'Years in Practice' },
                { v: 10, suf: '+', label: 'Industry Awards' },
                { v: 47, suf: '',  label: 'Engineers · Designers' },
                { v: 6,  suf: '',  label: 'Continents Shipped' },
              ].map((s, i) => (
                <FadeIn key={s.label} delay={0.1 + i * 0.06} y={18}>
                  <div className="glass-soft lift" style={{
                    borderRadius: 22, padding: '26px 22px', height: '100%',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    minHeight: 140, position: 'relative', overflow: 'hidden',
                  }}>
                    <LogoGlyph size={28} style={{
                      position: 'absolute', top: 16, right: 16,
                      color: 'rgba(255,255,255,0.22)',
                    }} />
                    <div style={{
                      fontSize: 'clamp(40px, 4vw, 60px)',
                      letterSpacing: '-0.04em', lineHeight: 1, fontWeight: 500, color: '#fff',
                    }}>
                      <Counter end={s.v} suffix={s.suf} />
                    </div>
                    <div style={{
                      fontSize: 12, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)',
                    }}>
                      {s.label}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ---------- 03 SERVICES — expanding accordion rows ---------- */
const SERVICES = [
  { id: '01', title: 'Government Platforms', tag: 'Civic',       blurb: 'Mission-critical digital infrastructure for ministries, agencies, and public services.', meta: 'Scale · Compliance · Trust' },
  { id: '02', title: 'EdTech Suites',        tag: 'Learning',    blurb: 'Adaptive learning systems for schools, universities, and lifelong-learning networks.',   meta: 'Pedagogy · AI · Analytics' },
  { id: '03', title: 'Web & Mobile',          tag: 'Product',     blurb: 'Premium consumer apps and brand sites engineered with native performance in mind.',      meta: 'iOS · Android · Web' },
  { id: '04', title: 'AI Systems',            tag: 'Intelligence',blurb: 'Production-grade models, agents and copilots that augment real teams and workflows.',    meta: 'RAG · Agents · Eval' },
  { id: '05', title: 'UI/UX Direction',       tag: 'Craft',       blurb: 'End-to-end art direction, design systems and interaction craft for ambitious brands.',   meta: 'Systems · Motion · Brand' },
];

function ServiceRow({ s, isOpen, onEnter }) {
  const contentRef = React.useRef(null);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, []);

  return (
    <div
      onMouseEnter={onEnter}
      style={{
        position: 'relative', padding: '36px 28px',
        borderTop: '1px solid rgba(255,255,255,0.14)',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'padding .4s ease',
      }}
    >
      {/* hover reveal layer — blur 18→12: layer slides up over an already-glassy
          accordion, the additional backdrop blur is barely perceptible but
          the per-row composited blur layer is expensive on every open row. */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(122,105,211,0.18), rgba(90,75,190,0.04))',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        transform: isOpen ? 'translateY(0)' : 'translateY(101%)',
        transition: 'transform .9s cubic-bezier(.22,1,.36,1)',
        pointerEvents: 'none',
      }} />

      {/* logo glyph slides in */}
      <LogoGlyph size={130} style={{
        position: 'absolute', right: 28, top: '50%',
        transform: `translateY(-50%) translateX(${isOpen ? 0 : 30}px) rotate(${isOpen ? -8 : 0}deg)`,
        color: 'rgba(255,255,255,0.10)',
        transition: 'transform .8s cubic-bezier(.22,1,.36,1), opacity .5s ease',
        opacity: isOpen ? 1 : 0, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', display: 'grid',
        gridTemplateColumns: '90px 1fr auto 80px', gap: 28, alignItems: 'center',
      }}>
        <div className="eyebrow mono" style={{ color: 'rgba(255,255,255,0.62)' }}>{s.id}</div>
        <div style={{
          fontSize: 'clamp(28px, 3.6vw, 52px)',
          letterSpacing: '-0.03em', lineHeight: 1, fontWeight: 500, color: '#fff',
          transform: isOpen ? 'translateX(8px)' : 'translateX(0)',
          transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
        }}>{s.title}</div>
        <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.tag}</div>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.32)',
          display: 'grid', placeItems: 'center',
          transform: isOpen ? 'rotate(45deg) scale(1.08)' : 'rotate(0) scale(1)',
          background: isOpen ? 'rgba(255,255,255,0.14)' : 'transparent',
          transition: 'transform .6s cubic-bezier(.22,1,.36,1), background .5s ease',
          justifySelf: 'end',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M2 9h14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* expandable detail — height measured once, no layout shift */}
      <div style={{
        position: 'relative',
        height: isOpen ? height : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'height .7s cubic-bezier(.22,1,.36,1), opacity .45s ease',
        willChange: 'height',
      }}>
        <div ref={contentRef} style={{
          display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 28,
          paddingTop: 24, alignItems: 'start',
        }}>
          <div />
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, maxWidth: 640, color: 'rgba(255,255,255,0.84)' }}>
            {s.blurb}
          </p>
          <div className="eyebrow mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.meta}</div>
        </div>
      </div>
    </div>
  );
}

function Services() {
  const [open, setOpen] = React.useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { threshold: 0.15 });

  return (
    <section id="services" ref={ref} style={{ minHeight: 820 }}>
      <div className="container">
        <SectionHead
          eyebrow="03 — Services"
          title="Five disciplines, one studio."
          meta="Each engagement is staffed by senior practitioners and shipped under a single creative direction."
        />
        <div className="glass" style={{
          borderRadius: 32, overflow: 'hidden',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity .9s ease, transform 1s cubic-bezier(.22,1,.36,1)',
        }}>
          {SERVICES.map((s, i) => (
            <ServiceRow key={s.id} s={s} isOpen={open === i} onEnter={() => setOpen(i)} />
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.14)' }} />
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { About, Services, Counter, Marquee });
