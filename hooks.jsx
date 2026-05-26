/* =========================================================
   HOOKS — physics-driven motion primitives (no framer-motion).
   Pure RAF + React, stable & glitch-free.
   ========================================================= */

const { useState, useEffect, useRef } = React;

/* ---------- Spring (critically damped lerp w/ velocity) ---------- */
function useSpring(target, { stiffness = 170, damping = 24, mass = 1 } = {}) {
  const [value, setValue] = useState(target);
  const stateRef = useRef({ value: target, velocity: 0, target });
  const rafRef = useRef(0);

  useEffect(() => {
    stateRef.current.target = target;
    if (rafRef.current) return;

    const step = () => {
      const s = stateRef.current;
      const force = -stiffness * (s.value - s.target);
      const dampingF = -damping * s.velocity;
      const acceleration = (force + dampingF) / mass;
      s.velocity += acceleration * (1 / 60);
      s.value += s.velocity * (1 / 60);

      if (Math.abs(s.velocity) < 0.0008 && Math.abs(s.value - s.target) < 0.0008) {
        s.value = s.target;
        s.velocity = 0;
        setValue(s.value);
        rafRef.current = 0;
        return;
      }
      setValue(s.value);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [target, stiffness, damping, mass]);

  return value;
}

/* ---------- Scroll progress (window) ---------- */
function useWindowScroll() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY || window.pageYOffset || 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return y;
}

/* ---------- Per-section scroll progress (0..1) — scroll-driven, not always-on rAF ---------- */
function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const passed = vh - rect.top;
      setProgress(Math.max(0, Math.min(1, passed / total)));
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref]);
  return progress;
}

/* ---------- Shared animation bus (one rAF for many subscribers) ---------- */
const __animSubs = new Map();
let __animRaf = 0;

function __animLoop(t) {
  if (!document.hidden) {
    __animSubs.forEach((fn) => fn(t));
  }
  __animRaf = requestAnimationFrame(__animLoop);
}

function subscribeAnimation(key, fn) {
  __animSubs.set(key, fn);
  if (!__animRaf) __animRaf = requestAnimationFrame(__animLoop);
  return () => {
    __animSubs.delete(key);
    if (!__animSubs.size && __animRaf) {
      cancelAnimationFrame(__animRaf);
      __animRaf = 0;
    }
  };
}

/* ---------- In-view trigger (IntersectionObserver) ---------- */
function useInView(ref, { threshold = 0.18, once = true, rootMargin = '0px 0px -10% 0px' } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) obs.disconnect();
        } else if (!once) setInView(false);
      },
      { threshold, rootMargin }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold, once, rootMargin]);
  return inView;
}

/* ---------- map / clamp / lerp / ease utilities ---------- */
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const map   = (v, inMin, inMax, outMin, outMax) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);
const ease  = {
  outCubic:   (t) => 1 - Math.pow(1 - t, 3),
  outQuart:   (t) => 1 - Math.pow(1 - t, 4),
  outExpo:    (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

/* ---------- Magnetic hover (pull element toward cursor) ----------
   useMagnetic listens to window mousemove. Before, every mousemove triggered
   setTarget — re-rendering the button (and re-running the spring) even when the
   cursor was far away. Now we keep last target in a ref and only setState when
   it meaningfully changes. */
function useMagnetic({ strength = 0.35, radius = 140 } = {}) {
  const ref = useRef(null);
  const lastRef = useRef({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const radius2 = radius * radius;
    const commit = (x, y) => {
      const l = lastRef.current;
      if (Math.abs(l.x - x) < 0.5 && Math.abs(l.y - y) < 0.5) return;
      lastRef.current = { x, y };
      setTarget({ x, y });
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < radius2) commit(dx * strength, dy * strength);
      else commit(0, 0);
    };
    const onLeave = () => commit(0, 0);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseout', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [strength, radius]);
  const sx = useSpring(target.x, { stiffness: 220, damping: 18 });
  const sy = useSpring(target.y, { stiffness: 220, damping: 18 });
  return { ref, x: sx, y: sy };
}

/* expose to other Babel scripts */
Object.assign(window, {
  useSpring, useWindowScroll, useSectionProgress, useInView,
  useMagnetic, subscribeAnimation, clamp, lerp, map, ease,
});
