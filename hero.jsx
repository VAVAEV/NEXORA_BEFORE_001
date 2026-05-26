/* global React */
const { useEffect, useRef, useState, useCallback } = window.React;

/* Outer path from assets/logo-big.svg — spawn via getPointAtLength for exact contour */
const LOGO_PATH_D =
  'M517.613 64.0413C524.447 70.8755 527.864 74.2926 529.144 78.2329C530.27 81.6989 530.27 85.4325 529.144 88.8985C527.864 92.8389 524.447 96.256 517.613 103.09L467.096 153.607C460.262 160.441 456.845 163.858 455.565 167.798C454.438 171.264 454.438 174.998 455.565 178.464C456.845 182.404 460.262 185.821 467.096 192.656L517.613 243.172C524.447 250.006 527.864 253.423 529.144 257.364C530.27 260.83 530.27 264.563 529.144 268.029C527.864 271.97 524.447 275.387 517.613 282.221L467.095 332.739C460.261 339.573 456.844 342.99 455.564 346.93C454.437 350.396 454.437 354.13 455.564 357.596C456.844 361.536 460.261 364.953 467.095 371.787L517.612 422.304C524.446 429.138 527.863 432.555 529.143 436.496C530.269 439.962 530.27 443.695 529.143 447.161C527.863 451.102 524.446 454.519 517.612 461.353L465.947 513.019C459.113 519.853 455.695 523.27 451.755 524.55C448.289 525.676 444.555 525.676 441.089 524.55C437.149 523.27 433.732 519.853 426.898 513.019L375.233 461.353C368.398 454.519 364.981 451.102 363.701 447.161C362.575 443.695 362.575 439.962 363.701 436.496C364.981 432.555 368.399 429.138 375.233 422.304L396.989 400.548C411.774 385.762 419.167 378.37 419.667 372.023C420.1 366.516 417.871 361.134 413.67 357.546C408.829 353.411 398.374 353.411 377.465 353.411H276.432C272.211 353.411 270.1 353.411 268.114 352.935C266.353 352.512 264.67 351.815 263.126 350.868C261.384 349.801 259.892 348.309 256.907 345.324L193.805 282.221C186.971 275.387 183.554 271.97 179.613 270.69C176.147 269.563 172.414 269.563 168.948 270.689C165.007 271.97 161.59 275.387 154.756 282.221L104.239 332.739C97.4045 339.573 93.9874 342.99 92.7071 346.93C91.5809 350.396 91.5809 354.13 92.7071 357.596C93.9874 361.536 97.4045 364.953 104.239 371.787L154.755 422.304C161.589 429.138 165.007 432.555 166.287 436.496C167.413 439.962 167.413 443.695 166.287 447.161C165.007 451.102 161.59 454.519 154.755 461.353L103.09 513.019C96.2561 519.853 92.839 523.27 88.8986 524.55C85.4326 525.676 81.699 525.676 78.2329 524.55C74.2926 523.27 70.8755 519.853 64.0412 513.019L12.376 461.353C5.54194 454.519 2.1249 451.101 0.844622 447.161C-0.281541 443.695 -0.281541 439.962 0.844622 436.496C2.1249 432.555 5.54194 429.138 12.376 422.304L62.8931 371.786C69.7272 364.952 73.1443 361.535 74.4246 357.595C75.5507 354.129 75.5507 350.395 74.4245 346.929C73.1443 342.989 69.7272 339.572 62.893 332.738L12.3763 282.221C5.54209 275.387 2.125 271.97 0.844708 268.029C-0.281472 264.563 -0.281482 260.83 0.844679 257.364C2.12495 253.423 5.54201 250.006 12.3761 243.172L62.8931 192.655C69.7272 185.82 73.1443 182.403 74.4246 178.463C75.5507 174.997 75.5507 171.263 74.4245 167.797C73.1443 163.857 69.7272 160.44 62.893 153.606L12.3773 103.09C5.54313 96.256 2.12604 92.8389 0.845742 88.8985C-0.280436 85.4325 -0.280436 81.6989 0.845742 78.2329C2.12604 74.2926 5.54313 70.8755 12.3773 64.0413L64.0424 12.3762C70.8766 5.54202 74.2937 2.12494 78.234 0.844642C81.7 -0.281538 85.4336 -0.281548 88.8996 0.844613C92.8399 2.12489 96.257 5.54195 103.091 12.3761L154.757 64.0413C161.591 70.8755 165.008 74.2926 166.289 78.2329C167.415 81.6989 167.415 85.4325 166.289 88.8986C165.008 92.8389 161.591 96.256 154.757 103.09L133.001 124.847C118.215 139.632 110.823 147.024 110.323 153.371C109.89 158.879 112.119 164.26 116.32 167.848C121.161 171.983 131.616 171.983 152.525 171.983H253.557C257.778 171.983 259.889 171.983 261.875 172.46C263.636 172.882 265.319 173.58 266.863 174.526C268.605 175.593 270.097 177.085 273.082 180.07L336.184 243.172C343.018 250.006 346.435 253.423 350.376 254.704C353.842 255.83 357.575 255.83 361.041 254.704C364.982 253.423 368.399 250.006 375.233 243.172L425.749 192.655C432.584 185.821 436.001 182.404 437.281 178.464C438.407 174.998 438.407 171.264 437.281 167.798C436.001 163.858 432.584 160.441 425.75 153.607L375.234 103.09C368.399 96.2559 364.982 92.8389 363.702 88.8985C362.576 85.4325 362.576 81.699 363.702 78.2329C364.982 74.2926 368.4 70.8755 375.234 64.0414L426.899 12.3763C433.733 5.54209 437.15 2.12499 441.09 0.844699C444.556 -0.281479 448.29 -0.281479 451.756 0.844699C455.696 2.12499 459.113 5.54209 465.948 12.3763L517.613 64.0413Z';

const LOGO_VB_CX = 265;
const LOGO_VB_CY = 263;

function pathPointToScreen(path, length) {
  const svg = path.ownerSVGElement;
  const ctm = path.getScreenCTM();
  if (!svg || !ctm) return null;
  const pt = path.getPointAtLength(length);
  const sp = svg.createSVGPoint();
  sp.x = pt.x;
  sp.y = pt.y;
  const scr = sp.matrixTransform(ctm);
  return { x: scr.x, y: scr.y, px: pt.x, py: pt.y, ctm };
}

function dispatchHeartbeat(beat) {
  const el = document.querySelector('.orb-logo');
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('nexora:heartbeat', {
    detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, beat },
  }));
}

/* ---------------------------------------------------------------------------
   HeartbeatOrbLogo
   - Stacks several SVG copies of the logo at different translateZ values
     so the parent .orb-3d-tilt produces a real volumetric tilt in 3D space.
   - On each "second beat" the contour is sampled with getPointAtLength,
     a tangent → perpendicular gives the true surface normal, and the
     resulting screen-space direction is dispatched as a particle burst.
--------------------------------------------------------------------------- */
function HeartbeatOrbLogo() {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const timerRef = useRef(null);

  const spawnBurst = useCallback(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    if (!total) return;
    const ctm = path.getScreenCTM();
    if (!ctm) return;

    const shed = [];
    const n = 84;
    const step = total / n;
    const ds = 1.6;

    for (let i = 0; i < n; i++) {
      // Tiny jitter on path-position (~±7% of step) — keeps natural feel,
      // not so much that the eye loses the "shedding from edges" intent.
      const at = (i * step + (Math.random() - 0.5) * step * 0.15 + total) % total;
      const p = pathPointToScreen(path, at);
      if (!p) continue;

      // True surface normal: tangent perpendicular at this contour point.
      const pPrev = path.getPointAtLength((at - ds + total) % total);
      const pNext = path.getPointAtLength((at + ds) % total);
      const tanX = pNext.x - pPrev.x;
      const tanY = pNext.y - pPrev.y;
      const tl = Math.hypot(tanX, tanY) || 1;
      let nx = -tanY / tl;
      let ny = tanX / tl;
      if ((p.px - LOGO_VB_CX) * nx + (p.py - LOGO_VB_CY) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }

      // Project SVG-space normal to screen-space via current CTM.
      let snx = nx * ctm.a + ny * ctm.c;
      let sny = nx * ctm.b + ny * ctm.d;
      const sl = Math.hypot(snx, sny) || 1;
      snx /= sl;
      sny /= sl;

      // ±5° angular jitter (down from ±31°) — particles clearly fire
      // perpendicular to the local edge they came from.
      const angle = Math.atan2(sny, snx) + (Math.random() - 0.5) * 0.18;
      const speed = 3.6 + Math.random() * 3.6;
      shed.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        r: 2.0 + Math.random() * 2.0,
      });
    }
    window.dispatchEvent(new CustomEvent('nexora:shed', { detail: { particles: shed } }));
  }, []);

  const pulse = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.classList.remove('heartbeat-pulse');
    void wrap.offsetWidth;
    wrap.classList.add('heartbeat-pulse');
    dispatchHeartbeat(1);
    setTimeout(() => {
      dispatchHeartbeat(2);
      spawnBurst();
      // Brief contour flash: the outline glows white at the exact moment
      // particles detach — visually anchors them to the edges.
      wrap.classList.add('heartbeat-flash');
      setTimeout(() => {
        if (wrapRef.current) wrapRef.current.classList.remove('heartbeat-flash');
      }, 380);
    }, 300);
  }, [spawnBurst]);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        pulse();
        schedule();
      }, 5200 + Math.random() * 4800);
    };
    timerRef.current = setTimeout(() => {
      if (cancelled) return;
      pulse();
      schedule();
    }, 2400);
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [pulse]);

  // Multilayer pseudo-3D: 5 identical silhouettes, each rotates at its own
  // speed (depth multiplier) relative to mouse-driven --orb-rx / --orb-ry.
  // The parallax between layers reads as honest 3D depth — no filters,
  // no blurs, no compositing tricks → glitch-free on every frame.
  const layers = [
    { id: 'a', op: 0.06, depth: 0.55, primary: false }, // back
    { id: 'b', op: 0.10, depth: 0.85, primary: false },
    { id: 'c', op: 0.16, depth: 1.00, primary: true  }, // particle source
    { id: 'd', op: 0.20, depth: 1.20, primary: false },
    { id: 'e', op: 0.10, depth: 1.55, primary: false }, // front sheen
  ];

  return (
    <div ref={wrapRef} className="orb-logo">
      <div className="orb-halo" aria-hidden="true" />
      {layers.map((L) => (
        <svg
          key={L.id}
          className={`orb-logo__svg${L.primary ? ' is-primary' : ''}`}
          viewBox="0 0 530 526"
          style={{
            transform:
              `rotateX(calc(var(--orb-rx, 0) * 1deg * ${L.depth}))` +
              ` rotateY(calc(var(--orb-ry, 0) * 1deg * ${L.depth}))`,
          }}
          aria-hidden="true"
        >
          <path
            ref={L.primary ? pathRef : null}
            fillRule="evenodd"
            clipRule="evenodd"
            d={LOGO_PATH_D}
            fill="white"
            fillOpacity={L.op}
          />
        </svg>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Tilt3DStage
   - Wraps children inside a perspective box.
   - Listens to mousemove on a `tracker` element (defaults to its own bounds),
     maps normalized cursor position into ±deg, and writes them as plain-number
     CSS variables (--orb-rx, --orb-ry) on the stage element. Each silhouette
     layer inside then applies its own depth-scaled rotation, producing
     multilayer pseudo-3D parallax.
   - A subtle ambient drift keeps the logo alive when the cursor is idle.
--------------------------------------------------------------------------- */
function Tilt3DStage({ children, tracker }) {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const trackEl = (tracker && tracker.current) || stage;

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    const t0 = performance.now();

    const apply = (rx, ry) => {
      // Layers read these as plain numbers and apply their own depth factor.
      stage.style.setProperty('--orb-rx', rx.toFixed(2));
      stage.style.setProperty('--orb-ry', ry.toFixed(2));
    };

    const tick = () => {
      const t = (performance.now() - t0) * 0.001;
      // Gentle ambient drift so the logo feels alive when the mouse is far.
      const ambX = Math.sin(t * 0.45) * 1.0;
      const ambY = Math.cos(t * 0.37) * 1.4;
      const fx = tgt.x + ambX;
      const fy = tgt.y + ambY;
      cur.x += (fx - cur.x) * 0.085;
      cur.y += (fy - cur.y) * 0.085;
      apply(cur.x, cur.y);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.5)));
      tgt.y = nx * 18;
      tgt.x = -ny * 12;
    };
    const onLeave = () => {
      tgt.x = 0;
      tgt.y = 0;
    };

    trackEl.addEventListener('mousemove', onMove, { passive: true });
    trackEl.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      trackEl.removeEventListener('mousemove', onMove);
      trackEl.removeEventListener('mouseleave', onLeave);
    };
  }, [tracker]);

  return (
    <div ref={stageRef} className="orb-3d-stage">
      <div className="orb-3d-tilt">
        {children}
      </div>
    </div>
  );
}

/* Each row is rendered as a block, so the visual line-breaks are explicit
   and the eye gets clean left-aligned typography instead of word-wrap salad. */
const HEADLINE_ROWS = [
  [{ t: 'NEXORA.', brand: true }],
  [{ t: 'We' }, { t: 'design' }, { t: 'and' }, { t: 'build' }],
  [{ t: 'scalable', em: true }, { t: 'digital' }],
  [{ t: 'ecosystems.' }],
];

function Hero() {
  const rootRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="hero" id="mission" ref={rootRef}>
      <div className="hero-grid">
        <div className="hero-text">
          <div className="eyebrow glass">
            <span className="dot" />
            <span>(&nbsp;&nbsp;Mission&nbsp;&nbsp;)</span>
            <span className="dot" />
          </div>

          <h1 className="headline">
            {(() => {
              let wordIdx = 0;
              return HEADLINE_ROWS.map((row, ri) => (
                <span key={ri} className="headline-row">
                  {row.map((w, wi) => {
                    const i = wordIdx++;
                    const delay = 220 + i * 90;
                    const style = { transitionDelay: revealed ? `${delay}ms` : '0ms' };
                    const Wrap = w.em ? 'em' : 'span';
                    const cls = `word${w.brand ? ' brand' : ''}${revealed ? ' in' : ''}`;
                    return (
                      <Wrap key={wi} className={cls} style={style}>
                        {w.t}
                      </Wrap>
                    );
                  })}
                </span>
              ));
            })()}
          </h1>

          <div className="hero-foot">
            <div className="col">
              <span className="num">N°002</span>
              <span className="line" />
              <span>Digital Studio</span>
            </div>
            <div className="col">
              <span>Scroll to explore</span>
              <span className="line" />
              <ScrollGlyph />
            </div>
            <div className="col">
              <span>Based · Everywhere</span>
              <span className="line" />
              <span className="num">— 2026</span>
            </div>
          </div>
        </div>

        <div className="hero-orb-col" aria-hidden="true">
          <Tilt3DStage tracker={rootRef}>
            <HeartbeatOrbLogo />
          </Tilt3DStage>
        </div>
      </div>
    </section>
  );
}

function ScrollGlyph() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="13" height="21" rx="6.5" stroke="rgba(255,255,255,.7)" />
      <circle cx="7" cy="6" r="1.6" fill="#fff">
        <animate attributeName="cy" values="6;14;6" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;.2;1" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

window.Hero = Hero;
