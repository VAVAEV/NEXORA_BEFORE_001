/* Framer Motion + portfolio UI primitives (GlassCard, Icon) */
const { useEffect, useRef, useState } = React;
const FM = window.Motion || window.framerMotion || window._framerMotion;
if (!FM) console.error('Framer Motion did not load — check the CDN script.');

const {
  motion,
  MotionConfig,
  useInView: useMotionInView,
  useMotionValue,
  useTransform,
  useSpring,
} = FM || {};

const ICON_PATHS = {
  ArrowUpRight: 'M7 17 17 7M7 7h10v10',
  MoveHorizontal: 'M8 18H4M4 6h4M12 18V6M20 18h-4M20 6h-4',
};

function Icon({ name, size = 18, stroke = 1.5, className = '', style = {} }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlassCard({ children, className = '', tilt = true, padding = 'p-6', as = 'div', ...rest }) {
  const ref = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useTransform(my, [0, 1], [4, -4]);
  const ry = useTransform(mx, [0, 1], [-6, 6]);
  const srx = useSpring(rx, { stiffness: 120, damping: 14 });
  const sry = useSpring(ry, { stiffness: 120, damping: 14 });

  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mx.set(x);
    my.set(y);
    ref.current.style.setProperty('--gx', `${x * 100}%`);
    ref.current.style.setProperty('--gy', `${y * 100}%`);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      ref={ref}
      onMouseMove={tilt ? onMove : undefined}
      onMouseLeave={onLeave}
      style={tilt ? { rotateX: srx, rotateY: sry, transformPerspective: 1000 } : undefined}
      className={`nx-card nx-glass rounded-3xl relative overflow-hidden ${padding} ${className}`}
      {...rest}
    >
      <div className="nx-glare" />
      <div className="relative z-10">{children}</div>
    </MotionTag>
  );
}

Object.assign(window, {
  motion,
  MotionConfig,
  GlassCard,
  Icon,
  useMotionInView,
  useMotionValue,
  useTransform,
  useSpring,
});
