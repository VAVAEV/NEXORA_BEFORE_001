/* =========================================================
   ENVIRONMENT — single rAF: dots + waves + parallax + nav sway hook
   Pauses when tab hidden. Aura: CSS opacity pulse only (no transform fight).
   ========================================================= */

function Environment() {
  const dotsRef  = React.useRef(null);
  const wavesRef = React.useRef(null);
  const logoRef  = React.useRef(null);
  const auraRef  = React.useRef(null);
  const mouseRef = React.useRef({ x: -9999, y: -9999, active: false });
  const heartImpulsesRef = React.useRef([]);
  const shedParticlesRef = React.useRef([]);
  const navSwayRef = React.useRef({ current: 0, target: 0, el: null });

  React.useEffect(() => {
    /* rAF-throttle: --mxp/--myp writes to document root were happening on every raw
       mousemove (up to 200 Hz on fast mice), invalidating the spotlight repaint
       layer needlessly. Coalescing to next-frame keeps visuals identical. */
    let pending = null;
    let raf = 0;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      const { x, y } = pending;
      pending = null;
      document.documentElement.style.setProperty('--mxp', x + 'px');
      document.documentElement.style.setProperty('--myp', y + 'px');
    };
    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      navSwayRef.current.target = (e.clientX / window.innerWidth - 0.5) * 22;
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => { mouseRef.current.active = false; };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  React.useEffect(() => {
    const onBeat = (e) => {
      const { x, y, beat } = e.detail || {};
      if (x == null || y == null) return;
      heartImpulsesRef.current.push({
        x, y, t: performance.now(),
        power: beat === 1 ? 0.5 : 1.05,
      });
      /* cap at 2 concurrent ripples — ripple decays in 1.4s, beats are >5s apart,
         so 2 is plenty and halves the per-dot inner loop cost during a beat. */
      if (heartImpulsesRef.current.length > 2) {
        heartImpulsesRef.current.splice(0, heartImpulsesRef.current.length - 2);
      }
    };
    window.addEventListener('nexora:heartbeat', onBeat);
    return () => window.removeEventListener('nexora:heartbeat', onBeat);
  }, []);

  React.useEffect(() => {
    const onShed = (e) => {
      const batch = e.detail?.particles;
      if (!batch?.length) return;
      shedParticlesRef.current.push(...batch);
      if (shedParticlesRef.current.length > 100) {
        shedParticlesRef.current.splice(0, shedParticlesRef.current.length - 100);
      }
    };
    window.addEventListener('nexora:shed', onShed);
    return () => window.removeEventListener('nexora:shed', onShed);
  }, []);

  React.useEffect(() => {
    window.__nexoraNavSway = navSwayRef;
    return () => { delete window.__nexoraNavSway; };
  }, []);

  React.useEffect(() => {
    const dotsCanvas = dotsRef.current;
    const wavesCanvas = wavesRef.current;
    if (!dotsCanvas || !wavesCanvas) return;

    const dotsCtx = dotsCanvas.getContext('2d', { alpha: true });
    const wavesCtx = wavesCanvas.getContext('2d', { alpha: true });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0, dots = [];
    const lines = [];
    const NUM_LINES = 7;
    let raf = 0;

    const seed = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      [dotsCanvas, wavesCanvas].forEach((cv) => {
        cv.width = w * dpr;
        cv.height = h * dpr;
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
      });
      dotsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wavesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = 38;
      dots = [];
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const ox = i * spacing;
          const oy = j * spacing;
          dots.push({ ox, oy, x: ox, y: oy });
        }
      }

      lines.length = 0;
      for (let i = 0; i < NUM_LINES; i++) {
        lines.push({
          baseY: (i + 1) * (h / (NUM_LINES + 1)),
          amp: 40 + Math.random() * 30,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0002 + Math.random() * 0.00018,
          freq: 0.0026 + Math.random() * 0.0014,
          opacity: 0.07 + Math.random() * 0.10,
        });
      }
    };

    const tick = (t) => {
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const active = mouseRef.current.active;
      const radius = 175;
      const radius2 = radius * radius;
      const strength = 42;

      heartImpulsesRef.current = heartImpulsesRef.current.filter((imp) => now - imp.t < 1400);
      const impulses = heartImpulsesRef.current;
      const hasRipple = impulses.length > 0;

      /* Precompute ripple front geometry once per frame (was recomputed per-dot).
         Also store squared (front+band) so the inner loop can do an O(1) reject. */
      let rippleData = null;
      if (hasRipple) {
        rippleData = [];
        for (let hi = 0; hi < impulses.length; hi++) {
          const imp = impulses[hi];
          const age = (now - imp.t) / 1000;
          if (age > 1.35) continue;
          const front = age * 340;
          const fade = 1 - age / 1.35;
          rippleData.push({
            x: imp.x, y: imp.y, front, fade, power: imp.power,
            innerSq: Math.max(0, front - 52) * Math.max(0, front - 52),
            outerSq: (front + 52) * (front + 52),
          });
        }
      }

      dotsCtx.clearRect(0, 0, w, h);

      /* Bucket dots by quantized alpha to minimize fillStyle changes.
         Canvas fillStyle assignment is one of the slower ctx ops; batching
         ~2000 dots into ~8 alpha buckets cuts state changes ~250x. */
      const BUCKETS = 8;
      const buckets = new Array(BUCKETS);
      for (let b = 0; b < BUCKETS; b++) buckets[b] = [];

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        let tx = d.ox;
        let ty = d.oy;
        if (active) {
          const dx = d.ox - mx;
          const dy = d.oy - my;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < radius2) {
            const dist = Math.sqrt(dist2) || 0.0001;
            const force = (1 - dist / radius) * strength;
            tx += (dx / dist) * force;
            ty += (dy / dist) * force;
          }
        }
        d.x += (tx - d.x) * 0.18;
        d.y += (ty - d.y) * 0.18;

        if (rippleData) {
          for (let hi = 0; hi < rippleData.length; hi++) {
            const r = rippleData[hi];
            const dx = d.x - r.x;
            const dy = d.y - r.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > r.outerSq || distSq < r.innerSq) continue;
            const dist = Math.sqrt(distSq) || 0.0001;
            const delta = dist - r.front;
            const ring = 1 - Math.abs(delta) / 52;
            const wave = Math.sin(delta * 0.14) * r.power * ring * r.fade;
            d.x += (dx / dist) * wave * 16;
            d.y += (dy / dist) * wave * 16;
          }
        }

        const disp = Math.abs(d.x - d.ox) + Math.abs(d.y - d.oy);
        const alpha = 0.26 + Math.min(0.58, disp * 0.022);
        const bIdx = Math.min(BUCKETS - 1, Math.floor((alpha - 0.26) / (0.58 / (BUCKETS - 1))));
        buckets[bIdx].push(d.x, d.y);
      }

      for (let b = 0; b < BUCKETS; b++) {
        const arr = buckets[b];
        if (!arr.length) continue;
        const a = 0.26 + (b / (BUCKETS - 1)) * 0.58;
        dotsCtx.fillStyle = `rgba(255,255,255,${a})`;
        dotsCtx.beginPath();
        for (let k = 0; k < arr.length; k += 2) {
          dotsCtx.moveTo(arr[k] + 1.35, arr[k + 1]);
          dotsCtx.arc(arr[k], arr[k + 1], 1.35, 0, Math.PI * 2);
        }
        dotsCtx.fill();
      }

      const shed = shedParticlesRef.current;
      for (let si = shed.length - 1; si >= 0; si--) {
        const p = shed[si];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.life -= 0.009;
        if (p.life <= 0) {
          shed.splice(si, 1);
          continue;
        }
        const a = 0.55 + p.life * 0.45;
        const rad = p.r * (0.65 + p.life * 0.5);
        dotsCtx.fillStyle = `rgba(255,255,255,${a})`;
        dotsCtx.beginPath();
        dotsCtx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        dotsCtx.fill();
      }

      wavesCtx.clearRect(0, 0, w, h);
      const waveStep = 32;
      for (let li = 0; li < lines.length; li++) {
        const L = lines[li];
        wavesCtx.beginPath();
        wavesCtx.lineWidth = 1;
        wavesCtx.strokeStyle = `rgba(255,255,255,${L.opacity})`;
        const cols = Math.ceil(w / waveStep) + 2;
        for (let i = 0; i <= cols; i++) {
          const x = i * waveStep;
          let y = L.baseY + Math.sin(x * L.freq + t * L.speed + L.phase) * L.amp;
          if (active) {
            const dx = x - mx;
            const dy = L.baseY - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 260) y += (1 - dist / 260) * 22 * Math.sign(my - L.baseY) * -1;
          }
          if (i === 0) wavesCtx.moveTo(x, y);
          else wavesCtx.lineTo(x, y);
        }
        wavesCtx.stroke();
      }

      const scrollY = window.scrollY || 0;
      const pmx = (mx / (w || 1)) - 0.5;
      const pmy = (my / (h || 1)) - 0.5;

      if (logoRef.current) {
        const ty = -50 + (-scrollY * 0.12);
        const rot = scrollY * 0.02 + pmx * 4;
        logoRef.current.style.transform =
          `translate(-50%, calc(${ty}% + ${pmy * 14}px)) translateX(${pmx * 22}px) rotate(${rot}deg)`;
      }
      if (auraRef.current) {
        const tay = -50 + (-scrollY * 0.04);
        auraRef.current.style.transform =
          `translate(-50%, ${tay}%) scale(${1 + Math.abs(pmy) * 0.06})`;
      }

      const ns = navSwayRef.current;
      ns.current += (ns.target - ns.current) * 0.08;
      if (ns.el) {
        ns.el.style.transform = `rotate(${ns.current.toFixed(2)}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };

    seed();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', seed);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', seed);
    };
  }, []);

  return (
    <div className="bg-stack" aria-hidden="true">
      <div className="bg-mesh" />
      <div ref={auraRef} className="bg-logo-aura" />
      <div ref={logoRef} className="bg-logo-parallax" />
      <canvas ref={wavesRef} className="bg-waves" />
      <canvas ref={dotsRef} className="bg-dots" />
      <div className="bg-spotlight" />
      <div className="bg-vignette" />
      <div className="bg-grain" />
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div className="side-label left">NEXORA / 002</div>
      <div className="side-label right">EST · MMXXVI</div>
    </div>
  );
}

window.Environment = Environment;
