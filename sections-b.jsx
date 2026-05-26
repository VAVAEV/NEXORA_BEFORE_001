/* =========================================================
   SECTIONS B — Industries (bento + 3D tilt),
                Portfolio (sticky stacking cards),
                Contact (form + magnetic submit)
   ========================================================= */

/* ---------- 3D tilt card ----------
   Mouse-driven transform + glow position are written to DOM directly via refs.
   React re-renders only when hover toggles (true/false), not on every mousemove.
   Visual is identical to setState-driven version. */
function TiltCard({ children, style, intensity = 8, className = '' }) {
  const wrapRef = React.useRef(null);
  const glowRef = React.useRef(null);
  const pendingRef = React.useRef(null);
  const frameRef = React.useRef(0);
  const hoverRef = React.useRef(false);
  const [hover, setHover] = React.useState(false);

  const writeTilt = (x, y, isHover) => {
    const wrap = wrapRef.current;
    const glow = glowRef.current;
    if (!wrap) return;
    const rx = -(y - 0.5) * intensity * 2;
    const ry = (x - 0.5) * intensity * 2;
    const tz = isHover ? 12 : 0;
    wrap.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
    if (glow) {
      glow.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%)`;
    }
  };

  const onMove = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    pendingRef.current = { x, y };
    if (!hoverRef.current) {
      hoverRef.current = true;
      setHover(true);
    }
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        const p = pendingRef.current;
        if (p) writeTilt(p.x, p.y, true);
      });
    }
  };

  const onLeave = () => {
    pendingRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    hoverRef.current = false;
    writeTilt(0.5, 0.5, false);
    setHover(false);
  };

  React.useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        ...style,
        transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
        position: 'relative',
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%)',
          opacity: hover ? 1 : 0,
          transition: 'opacity .45s ease',
          borderRadius: 'inherit', mixBlendMode: 'screen',
        }}
      />
      {children}
    </div>
  );
}

/* ---------- 04 INDUSTRIES — bento grid ---------- */
const INDUSTRIES = [
  { id: 'gov',    name: 'Government', sub: 'Civic Infrastructure',   items: ['Portals', 'eID', 'Open Data'] },
  { id: 'edu',    name: 'Education',  sub: 'Schools & Universities',  items: ['LMS', 'Curriculum', 'Adaptive AI'] },
  { id: 'ent',    name: 'Enterprise', sub: 'Internal Platforms',      items: ['Workflows', 'BI', 'Copilots'] },
  { id: 'gaming', name: 'Gaming',     sub: 'Studios & Publishers',    items: ['Live Ops', 'Companion', 'Esports'] },
  { id: 'ecom',   name: 'E-Commerce', sub: 'D2C & Marketplaces',     items: ['Storefronts', 'PIM', 'Loyalty'] },
];

/* ---- DOT-MORPHING ICON — 60 dots, same index: idle → logo (assets/logo-small.svg) ---- */

const DOT_COUNT = 60;
const ICON_PAD = 0.11;

const LOGO_PTS = [
  [0.8734,0.9727],[0.7976,0.9659],[0.7312,0.8951],[0.6834,0.816],[0.7477,0.7433],
  [0.7223,0.6799],[0.6284,0.6795],[0.5345,0.6794],[0.4565,0.6352],[0.3901,0.5644],
  [0.3237,0.5025],[0.2573,0.5733],[0.1915,0.6446],[0.2308,0.7248],[0.2972,0.7956],
  [0.2922,0.8663],[0.2258,0.9371],[0.1534,0.9959],[0.0835,0.9308],[0.0171,0.86],
  [0.0333,0.7792],[0.0997,0.7085],[0.1089,0.6277],[0.0425,0.5569],[0.0082,0.4764],
  [0.0743,0.4053],[0.1292,0.3282],[0.0679,0.2538],[0.003,0.1817],[0.0489,0.1022],
  [0.1153,0.0315],[0.1912,0.0223],[0.2576,0.093],[0.324,0.1638],[0.2653,0.2345],
  [0.2496,0.3136],[0.3431,0.3167],[0.437,0.3167],[0.5223,0.3424],[0.5887,0.4131],
  [0.6566,0.4819],[0.7309,0.4315],[0.7972,0.3606],[0.7705,0.2799],[0.7041,0.2092],
  [0.7086,0.1284],[0.775,0.0576],[0.849,0.0052],[0.9173,0.0734],[0.9836,0.1442],
  [0.9585,0.225],[0.8921,0.2957],[0.8949,0.3765],[0.9613,0.4473],[0.9808,0.5281],
  [0.9144,0.5989],[0.8707,0.6786],[0.9359,0.7504],[0.9962,0.8253],[0.9398,0.902],
];

const LOGO_EDGES = Array.from({ length: DOT_COUNT }, (_, i) => [i, (i + 1) % DOT_COUNT]);

function mapIconPt(nx, ny) {
  const s = 1 - ICON_PAD * 2;
  return [nx * s + ICON_PAD, ny * s + ICON_PAD];
}

/* Idle silhouettes — arc-length sampled SVG contours (not scaled logo blobs) */
const IDLE_SHAPES = {
  gov: [
    [0.5,0.08],[0.5364,0.0833],[0.5718,0.0925],[0.605,0.1075],[0.6346,0.129],[0.6606,0.1547],[0.6821,0.1842],[0.6985,0.2169],[0.7148,0.2497],[0.7261,0.2843],[0.735,0.3198],[0.7438,0.3553],[0.7527,0.3909],[0.7616,0.4264],[0.7705,0.4619],[0.7793,0.4974],[0.7718,0.5329],[0.7629,0.5684],[0.754,0.6039],[0.7451,0.6394],[0.7363,0.675],[0.7274,0.7105],[0.7172,0.7455],[0.7009,0.7782],[0.6845,0.811],[0.6612,0.8388],[0.6354,0.8646],[0.6059,0.8847],[0.5712,0.8963],[0.5364,0.9079],[0.5017,0.9194],[0.467,0.909],[0.4322,0.8974],[0.3975,0.8858],[0.3672,0.8672],[0.3413,0.8413],[0.3171,0.8142],[0.3007,0.7815],[0.2844,0.7487],[0.2735,0.7139],[0.2646,0.6784],[0.2557,0.6429],[0.2469,0.6074],[0.238,0.5719],[0.2291,0.5364],[0.2202,0.5009],[0.2287,0.4654],[0.2375,0.4298],[0.2464,0.3943],[0.2553,0.3588],[0.2642,0.3233],[0.2731,0.2878],[0.2836,0.2529],[0.2999,0.2201],[0.3163,0.1874],[0.34,0.16],[0.3659,0.1341],[0.3958,0.1147],[0.4305,0.1032],[0.4653,0.0916],
  ],
  edu: [
    [0.5,0.1],[0.5512,0.1243],[0.6025,0.1485],[0.6537,0.1728],[0.705,0.1971],[0.7562,0.2214],[0.8074,0.2456],[0.8587,0.2699],[0.8501,0.2942],[0.7988,0.3184],[0.7476,0.3427],[0.6964,0.367],[0.6451,0.3913],[0.5939,0.4155],[0.5426,0.4398],[0.4914,0.4559],[0.4402,0.4317],[0.3889,0.4074],[0.3377,0.3831],[0.2864,0.3588],[0.2352,0.3346],[0.1839,0.3103],[0.1327,0.286],[0.1585,0.2617],[0.2098,0.2375],[0.261,0.2132],[0.3123,0.1889],[0.3635,0.1647],[0.4147,0.1404],[0.466,0.1161],[0.22,0.499],[0.22,0.5557],[0.22,0.6124],[0.22,0.6691],[0.22,0.7258],[0.2225,0.78],[0.2792,0.78],[0.3359,0.78],[0.3926,0.78],[0.4493,0.78],[0.506,0.78],[0.5627,0.78],[0.6194,0.78],[0.6761,0.78],[0.7328,0.78],[0.78,0.7705],[0.78,0.7138],[0.78,0.6571],[0.78,0.6004],[0.78,0.5437],[0.78,0.487],[0.7303,0.48],[0.6736,0.48],[0.6169,0.48],[0.5602,0.48],[0.5035,0.48],[0.4468,0.48],[0.3901,0.48],[0.3334,0.48],[0.2767,0.48],
  ],
  ent: [
    [0.2,0.2],[0.28,0.2],[0.36,0.2],[0.44,0.2],[0.52,0.2],[0.6,0.2],[0.68,0.2],[0.76,0.2],[0.8,0.24],[0.8,0.32],[0.8,0.4],[0.8,0.48],[0.8,0.56],[0.8,0.64],[0.8,0.72],[0.8,0.8],[0.72,0.8],[0.64,0.8],[0.56,0.8],[0.48,0.8],[0.4,0.8],[0.32,0.8],[0.24,0.8],[0.2,0.76],[0.2,0.68],[0.2,0.6],[0.2,0.52],[0.2,0.44],[0.2,0.36],[0.2,0.28],[0.2,0.2],[0.4,0.28],[0.4,0.36],[0.4,0.44],[0.4,0.52],[0.4,0.6],[0.4,0.68],[0.4,0.76],[0.6,0.24],[0.6,0.32],[0.6,0.4],[0.6,0.48],[0.6,0.56],[0.6,0.64],[0.6,0.72],[0.6,0.8],[0.28,0.4],[0.36,0.4],[0.44,0.4],[0.52,0.4],[0.6,0.4],[0.68,0.4],[0.76,0.4],[0.24,0.6],[0.32,0.6],[0.4,0.6],[0.48,0.6],[0.56,0.6],[0.64,0.6],[0.72,0.6],
  ],
  gaming: [
    [0.24,0.34],[0.2813,0.34],[0.3227,0.34],[0.364,0.34],[0.4053,0.34],[0.4467,0.34],[0.488,0.34],[0.5293,0.34],[0.5707,0.34],[0.612,0.34],[0.6533,0.34],[0.6947,0.34],[0.736,0.34],[0.76,0.3573],[0.76,0.3987],[0.76,0.44],[0.76,0.4813],[0.76,0.5227],[0.76,0.564],[0.76,0.6053],[0.76,0.6467],[0.732,0.66],[0.6907,0.66],[0.6493,0.66],[0.608,0.66],[0.5667,0.66],[0.5253,0.66],[0.484,0.66],[0.4427,0.66],[0.4013,0.66],[0.36,0.66],[0.3187,0.66],[0.2773,0.66],[0.24,0.656],[0.24,0.6147],[0.24,0.5733],[0.24,0.532],[0.24,0.4907],[0.24,0.4493],[0.24,0.408],[0.24,0.3667],[0.18,0.4347],[0.18,0.476],[0.18,0.5173],[0.18,0.5587],[0.82,0.44],[0.82,0.4813],[0.82,0.5227],[0.82,0.564],[0.4053,0.28],[0.4467,0.28],[0.488,0.28],[0.5293,0.28],[0.5707,0.28],[0.612,0.28],[0.4133,0.72],[0.4547,0.72],[0.496,0.72],[0.5373,0.72],[0.5787,0.72],
  ],
  ecom: [
    [0.34,0.28],[0.3517,0.2429],[0.3792,0.2151],[0.4136,0.1961],[0.4514,0.1853],[0.4905,0.1806],[0.5298,0.1818],[0.5682,0.1902],[0.6047,0.2049],[0.6362,0.2282],[0.6568,0.2611],[0.6781,0.2891],[0.7134,0.3067],[0.7486,0.3243],[0.7803,0.3443],[0.7834,0.3836],[0.7864,0.4229],[0.7894,0.4622],[0.7924,0.5015],[0.7954,0.5408],[0.7985,0.5801],[0.8015,0.6194],[0.8045,0.6587],[0.8075,0.698],[0.8106,0.7373],[0.8136,0.7766],[0.8166,0.8159],[0.8196,0.8552],[0.7854,0.86],[0.746,0.86],[0.7066,0.86],[0.6672,0.86],[0.6278,0.86],[0.5884,0.86],[0.549,0.86],[0.5096,0.86],[0.4702,0.86],[0.4307,0.86],[0.3913,0.86],[0.3519,0.86],[0.3125,0.86],[0.2731,0.86],[0.2337,0.86],[0.1943,0.86],[0.1819,0.8349],[0.1849,0.7957],[0.188,0.7564],[0.191,0.7171],[0.194,0.6778],[0.197,0.6385],[0.2001,0.5992],[0.2031,0.5599],[0.2061,0.5206],[0.2091,0.4813],[0.2122,0.442],[0.2152,0.4027],[0.2182,0.3634],[0.2343,0.3329],[0.2695,0.3152],[0.3048,0.2976],
  ],
};

/* Angle-sorted idle dot → logo dot for smooth morph */
const IDLE_TO_LOGO = {
  gov: [38,45,46,47,44,48,39,43,49,50,51,42,52,41,53,40,54,55,56,57,58,5,59,4,0,6,1,2,3,7,8,15,16,14,17,18,13,19,9,20,21,12,22,11,23,10,24,25,26,27,28,35,29,34,36,30,31,32,33,37],
  edu: [38,45,46,47,44,48,39,43,49,50,51,42,52,41,53,10,24,25,26,27,28,35,29,34,36,30,31,32,33,37,22,21,9,19,13,18,17,14,16,15,8,3,2,1,6,0,4,59,5,57,54,40,55,56,58,7,20,12,11,23],
  ent: [29,36,32,37,38,46,48,39,50,51,41,40,54,56,5,59,4,1,7,8,16,18,13,20,21,11,10,24,26,35,34,33,30,27,23,19,17,14,47,44,43,53,57,0,2,3,25,28,31,45,49,42,52,22,12,9,15,6,58,55],
  gaming: [29,34,36,30,31,33,38,47,48,43,49,50,51,42,52,41,40,56,58,5,59,4,0,6,1,2,8,16,17,13,19,9,20,21,12,22,23,24,26,28,35,27,25,10,11,53,54,55,57,32,37,45,46,44,39,18,14,15,7,3],
  ecom: [30,31,32,33,37,38,45,46,47,44,48,39,43,49,50,51,42,52,41,53,40,54,55,56,57,58,5,59,4,0,6,1,2,3,7,8,15,16,14,17,18,13,19,9,20,21,12,22,11,23,10,24,25,26,27,28,35,29,34,36],
};

function DotIcon({ kind, hovered, live }) {
  const SZ = 80;
  const canvasRef = React.useRef(null);
  const dotsRef   = React.useRef(null);
  const progRef   = React.useRef(0);
  const hovRef    = React.useRef(hovered);
  const ctxRef    = React.useRef(null);

  React.useEffect(() => { hovRef.current = hovered; }, [hovered]);

  const drawFrame = (p) => {
    const ctx = ctxRef.current;
    const dots = dotsRef.current;
    if (!ctx || !dots) return;
    const shape = IDLE_SHAPES[kind] || IDLE_SHAPES.gov;
    const toLogo = IDLE_TO_LOGO[kind] || IDLE_TO_LOGO.gov;

    dots.forEach((dot, i) => {
      const [ixn, iyn] = mapIconPt(shape[i][0], shape[i][1]);
      const li = toLogo[i];
      const [lxn, lyn] = mapIconPt(LOGO_PTS[li][0], LOGO_PTS[li][1]);
      const ix = ixn * SZ, iy = iyn * SZ;
      const lx = lxn * SZ, ly = lyn * SZ;
      dot.x = ix + (lx - ix) * p;
      dot.y = iy + (ly - iy) * p;
    });

    ctx.clearRect(0, 0, SZ, SZ);

    if (p > 0.35) {
      const la = Math.min(1, (p - 0.35) / 0.65) * 0.40;
      ctx.save();
      ctx.globalAlpha = la;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 0.55;
      ctx.lineCap = 'round';
      LOGO_EDGES.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(dots[a].x, dots[a].y);
        ctx.lineTo(dots[b].x, dots[b].y);
        ctx.stroke();
      });
      ctx.restore();
    }

    const rBase = 1.9 + p * 0.7;
    const showGlow = p > 0.25;
    dots.forEach((dot) => {
      const r = rBase;
      if (showGlow) {
        const gA = Math.min(1, (p - 0.25) / 0.75) * 0.20;
        ctx.fillStyle = `rgba(255,255,255,${gA * 0.35})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r + 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  React.useEffect(() => {
    const idle = IDLE_SHAPES[kind] || IDLE_SHAPES.gov;
    dotsRef.current = idle.map(([nx, ny]) => {
      const [px, py] = mapIconPt(nx, ny);
      return { x: px * SZ, y: py * SZ, vx: 0, vy: 0 };
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = SZ * dpr;
    cv.height = SZ * dpr;
    cv.style.width = SZ + 'px';
    cv.style.height = SZ + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    progRef.current = 0;
    drawFrame(0);

    if (!live) return;

    return subscribeAnimation(`dot-icon-${kind}`, () => {
      const h = hovRef.current;
      const prev = progRef.current;
      progRef.current += ((h ? 1 : 0) - progRef.current) * 0.09;
      if (!h && progRef.current < 0.004 && prev < 0.004) return;
      drawFrame(progRef.current);
    });
  }, [kind, live]);

  React.useEffect(() => {
    if (!live && ctxRef.current) drawFrame(hovRef.current ? progRef.current : 0);
  }, [hovered, live, kind]);

  return React.createElement('canvas', { ref: canvasRef, style: { display: 'block' } });
}

function IndustryCard({ ind, big = false, sectionLive }) {
  const ref    = React.useRef(null);
  const inView = useInView(ref, { threshold: 0.18 });
  const [hov, setHov] = React.useState(false);
  const iconLive = sectionLive && (inView || hov);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        gridColumn: big ? 'span 2' : 'span 1',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(36px)',
        transition: 'opacity .8s ease, transform 1s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <TiltCard
        className="glass sweep"
        style={{
          borderRadius: 28, padding: 32, height: '100%',
          minHeight: big ? 360 : 260,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <LogoGlyph variant="big" size={big ? 220 : 140} style={{
          position: 'absolute', right: big ? -40 : -30, bottom: big ? -50 : -40,
          color: 'rgba(184,169,249,0.10)', pointerEvents: 'none',
        }} />

        <div style={{
          width: 80, height: 80, borderRadius: 20, position: 'relative',
          background: hov ? 'rgba(184,169,249,0.16)' : 'rgba(255,255,255,0.08)',
          border: '1px solid ' + (hov ? 'rgba(200,194,250,0.50)' : 'rgba(255,255,255,0.20)'),
          display: 'grid', placeItems: 'center',
          transition: 'background .5s ease, border-color .5s ease, box-shadow .5s ease',
          boxShadow: hov ? '0 0 24px rgba(184,169,249,0.28), inset 0 0 14px rgba(200,194,250,0.12)' : 'none',
        }}>
          <DotIcon kind={ind.id} hovered={hov} live={iconLive} />
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{ind.sub}</div>
          <div style={{
            fontSize: big ? 'clamp(36px, 4vw, 56px)' : 'clamp(24px, 2.4vw, 34px)',
            letterSpacing: '-0.025em', lineHeight: 1, fontWeight: 500, color: '#fff', marginBottom: 18,
          }}>{ind.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ind.items.map((it) => (
              <span key={it} style={{
                fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.85)',
              }}>{it}</span>
            ))}
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

function Industries() {
  const sectionRef = React.useRef(null);
  const sectionLive = useInView(sectionRef, { threshold: 0, rootMargin: '240px 0px 240px 0px', once: false });

  return (
    <section id="industries" ref={sectionRef}>
      <div className="container">
        <SectionHead
          eyebrow="04 — Industries"
          title="Built for the rooms that matter."
          meta="From ministries to gaming studios, we ship into demanding environments where uptime, trust and craft are non-negotiable."
        />
        <div className="bento-grid">
          <IndustryCard ind={INDUSTRIES[0]} big sectionLive={sectionLive} />
          <IndustryCard ind={INDUSTRIES[1]} sectionLive={sectionLive} />
          <IndustryCard ind={INDUSTRIES[2]} sectionLive={sectionLive} />
          <IndustryCard ind={INDUSTRIES[3]} sectionLive={sectionLive} />
          <IndustryCard ind={INDUSTRIES[4]} big sectionLive={sectionLive} />
        </div>
      </div>
    </section>
  );
}

/* ---------- 05 PORTFOLIO — see portfolio.jsx (Framer Motion) ---------- */



/* ---------- 06 CONTACT ---------- */
function Contact() {
  const [submitted, setSubmitted] = React.useState(false);
  const formRef = React.useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3200);
    if (formRef.current) formRef.current.reset();
  };

  return (
    <section id="contact" style={{ paddingBottom: 80 }}>
      <div className="container">
        <SectionHead
          eyebrow="06 — Contact"
          title="Let's talk."
          meta="Tell us about your timeline, your ambition, and the rooms it needs to land in. We'll reply within two business days."
        />

        <div className="contact-grid">
          {/* side card */}
          <FadeIn y={28}>
            <div className="glass sweep" style={{
              borderRadius: 32, padding: 'clamp(28px, 3vw, 44px)',
              height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <LogoGlyph variant="big" size={260} style={{
                position: 'absolute', right: -60, top: -60,
                color: 'rgba(184,169,249,0.12)', pointerEvents: 'none',
                animation: 'spin 60s linear infinite',
              }} />
              <div className="col" style={{ gap: 28 }}>
                <div className="eyebrow">Reach Us</div>
                <div style={{
                  fontSize: 'clamp(24px, 2.2vw, 32px)',
                  lineHeight: 1.35, letterSpacing: '-0.015em', color: '#fff', fontWeight: 400,
                }}>
                  Studio in residence between Riyadh & Lisbon, partnering globally.
                </div>
              </div>
              <div className="col" style={{ gap: 22, marginTop: 40 }}>
                {[
                  { k: 'New Work', v: 'hello@nexora.studio' },
                  { k: 'Press',    v: 'press@nexora.studio' },
                  { k: 'Careers', v: "we're hiring · 6 roles" },
                ].map(r => (
                  <div key={r.k} className="row" style={{
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    <span className="eyebrow">{r.k}</span>
                    <span style={{ fontSize: 14, color: '#fff' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* form card */}
          <FadeIn y={28} delay={0.1}>
            <form ref={formRef} onSubmit={onSubmit} className="glass" style={{
              borderRadius: 32, padding: 'clamp(28px, 3vw, 44px)',
              display: 'flex', flexDirection: 'column', gap: 22, height: '100%',
            }}>
              <div className="form-row">
                <div className="field">
                  <label>Your Name</label>
                  <input required type="text" placeholder="Alex Reed" />
                </div>
                <div className="field">
                  <label>Company</label>
                  <input type="text" placeholder="Studio or Org" />
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <input required type="email" placeholder="alex@yourdomain.com" />
              </div>
              <div className="field">
                <label>What are we making?</label>
                <textarea rows={4} placeholder="A short brief — the timeline, scope, and one thing that keeps you up at night." />
              </div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 16, flexWrap: 'wrap' }}>
                <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {submitted ? "✓ Message received — we'll be in touch." : 'We respond within two business days.'}
                </div>
                <MagneticBtn strength={0.5} radius={180}>
                  {submitted ? 'Sent' : 'Send Message'}
                  <svg className="arrow" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </MagneticBtn>
              </div>
            </form>
          </FadeIn>
        </div>

        {/* Footer NEXORA_005 style */}
        <div style={{
          marginTop: 80,
          paddingTop: 40, paddingBottom: 60,
          borderTop: '1px solid rgba(255,255,255,0.14)',
          display: 'flex', flexDirection: 'row',
          alignItems: 'center', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, rgba(200,194,250,.35), rgba(184,169,249,.08) 70%)',
              border: '1px solid rgba(200,194,250,.35)',
              boxShadow: 'inset 0 0 12px rgba(200,194,250,.18), 0 0 20px rgba(184,169,249,.20)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <img
                src="assets/logo-white.svg"
                width={20} height={20}
                alt=""
                style={{ display: 'block' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>Nexora Digital</div>
              <div style={{
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em',
              }}>Ethereal · Breathable · Digital Glass</div>
            </div>
          </div>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 11, color: 'rgba(255,255,255,0.50)', letterSpacing: '0.12em',
          }}>© 2026 Nexora Digital · v6.0 · all rights reserved</div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Industries, Contact, TiltCard });
