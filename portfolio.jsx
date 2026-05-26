/* global React, motion, GlassCard, Icon, useEffect, useRef, useState, useMotionInView */

// ─── Mouse tracker hook ───────────────────────────────────────────────────────
// Three-tier reactivity with built-in "magnetic" easing to kill the snap-to-cursor
// jump that happens on mouseenter/mouseleave for any surface (~150ms ease-out,
// crisp not gummy):
//   1. CSS vars (--smx, --smy, --smx-pct, --smy-pct) follow the SMOOTHED value,
//      so radial spotlights gracefully slide into place instead of teleporting.
//   2. subscribeRaw(fn) delivers the RAW target every frame — but only while the
//      cursor is actually inside the surface. Used by cursor-followers (CyberBook
//      companion/cursor, CityExpo hit-test) that want 1:1 mouse tracking.
//      Gating on hover prevents bogus "stuck on center" state after mouseleave.
//   3. setM (React state) reflects the smoothed value but is epsilon-throttled
//      so heavy SVG/Framer-Motion children don't re-render at 60Hz.
// Returns: [ref, m, subscribeRaw, hovered]
function useSurfaceMouse() {
  const ref = useRef(null);
  const [m, setM] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState(false);
  const rawSubsRef = useRef(new Set());
  const subscribeRaw = useRef((fn) => {
    rawSubsRef.current.add(fn);
    return () => { rawSubsRef.current.delete(fn); };
  }).current;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    let hoverActive = false;
    const target = { x: 0.5, y: 0.5 };
    const smooth = { x: 0.5, y: 0.5 };
    const last   = { x: 0.5, y: 0.5 };
    const SETTLE = 0.0006;
    const LERP = 0.32; // ~150ms ease to 90% — perceptible but never "jelly"
    const writeVars = (x, y) => {
      el.style.setProperty('--smx', x);
      el.style.setProperty('--smy', y);
      el.style.setProperty('--smx-pct', (x * 100) + '%');
      el.style.setProperty('--smy-pct', (y * 100) + '%');
    };
    const tick = () => {
      const dx = target.x - smooth.x;
      const dy = target.y - smooth.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < SETTLE && ady < SETTLE) {
        smooth.x = target.x; smooth.y = target.y;
        writeVars(smooth.x, smooth.y);
        if (hoverActive) rawSubsRef.current.forEach((fn) => fn(target.x, target.y));
        if (Math.abs(smooth.x - last.x) > 0.003 || Math.abs(smooth.y - last.y) > 0.003) {
          last.x = smooth.x; last.y = smooth.y;
          setM({ x: smooth.x, y: smooth.y });
        }
        raf = 0;
        return;
      }
      smooth.x += dx * LERP;
      smooth.y += dy * LERP;
      writeVars(smooth.x, smooth.y);
      if (hoverActive) rawSubsRef.current.forEach((fn) => fn(target.x, target.y));
      if (Math.abs(smooth.x - last.x) > 0.004 || Math.abs(smooth.y - last.y) > 0.004) {
        last.x = smooth.x; last.y = smooth.y;
        setM({ x: smooth.x, y: smooth.y });
      }
      raf = requestAnimationFrame(tick);
    };
    const ensureTick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const mv = (e) => {
      if (!hoverActive) { hoverActive = true; setHovered(true); }
      const r = el.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      ensureTick();
    };
    const me = () => { if (!hoverActive) { hoverActive = true; setHovered(true); } };
    const ml = () => {
      hoverActive = false;
      setHovered(false);
      target.x = 0.5; target.y = 0.5;
      ensureTick();
    };
    writeVars(0.5, 0.5);
    el.addEventListener('mousemove', mv, { passive: true });
    el.addEventListener('mouseenter', me);
    el.addEventListener('mouseleave', ml);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('mousemove', mv);
      el.removeEventListener('mouseenter', me);
      el.removeEventListener('mouseleave', ml);
    };
  }, []);
  return [ref, m, subscribeRaw, hovered];
}

// ─── DATOO — Map Surface ──────────────────────────────────────────────────────
function MapSurface() {
  const [ref, m] = useSurfaceMouse();
  const px = (m.x - 0.5) * 28;
  const py = (m.y - 0.5) * 18;

  const NODES = [
    [120,270,'Riyadh'], [210,170,'Jeddah'], [320,140,'Dammam'],
    [440,182,'Makkah'], [522,232,'Madinah'], [262,252,'Tabuk'],
    [382,92,'Hail'], [160,102,'Qassim'], [478,282,'Jizan'],
  ];

  const ARCS = [
    { d:'M120 270 C 175 200 255 175 320 140', col:'rgba(255,255,255,0.75)',  sx:120,sy:270, ex:320,ey:140 },
    { d:'M320 140 C 370 130 410 155 440 182', col:'rgba(210,190,255,0.8)',   sx:320,sy:140, ex:440,ey:182 },
    { d:'M440 182 C 480 200 505 218 522 232', col:'rgba(180,210,255,0.7)',   sx:440,sy:182, ex:522,ey:232 },
    { d:'M210 170 C 238 210 252 232 262 252', col:'rgba(255,220,190,0.6)',   sx:210,sy:170, ex:262,ey:252 },
    { d:'M262 252 C 298 230 340 150 382 92',  col:'rgba(190,255,210,0.5)',   sx:262,sy:252, ex:382,ey:92  },
    { d:'M160 102 C 190 140 200 155 210 170', col:'rgba(255,200,200,0.5)',   sx:160,sy:102, ex:210,ey:170 },
  ];

  // closest node to cursor
  const closest = NODES.reduce((b, [nx,ny], i) => {
    const d = Math.hypot(nx/600 - m.x, ny/360 - m.y);
    return d < b.d ? { i, d } : b;
  }, { i: -1, d: 1 });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ cursor:'crosshair' }}>
      {/* base */}
      <div className="absolute inset-0" style={{ background:'linear-gradient(145deg,#32289a 0%,#231b7a 55%,#1b1560 100%)' }} />
      {/* mouse spotlight — CSS-var driven, updates at full mouse rate without React render */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(320px 220px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(200,180,255,0.28), transparent 70%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="mGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {/* dot grid — parallax slow */}
        <g transform={`translate(${px*0.25} ${py*0.25})`}>
          {Array.from({length:19}).map((_,row) =>
            Array.from({length:27}).map((_,col) => (
              <circle key={`${row}-${col}`} cx={col*24} cy={row*20} r="0.9" fill="rgba(255,255,255,0.14)" />
            ))
          )}
        </g>

        {/* region shapes — parallax mid */}
        <g transform={`translate(${px*0.45} ${py*0.4})`} opacity="0.6">
          <path d="M150 200 L240 130 L380 150 L420 225 L300 282 Z"
            fill="rgba(180,160,255,0.10)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
          <path d="M380 98 L480 132 L522 205 L440 225 Z"
            fill="rgba(130,190,255,0.09)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
          <path d="M60 242 L160 202 L212 272 L100 302 Z"
            fill="rgba(200,160,255,0.08)" stroke="rgba(255,255,255,0.10)" strokeWidth="1"/>
        </g>

        {/* flow arcs — parallax mid-fast */}
        <g transform={`translate(${px*0.6} ${py*0.55})`}>
          {ARCS.map((arc, i) => (
            <g key={i}>
              {/* dim road */}
              <path d={arc.d} stroke="rgba(255,255,255,0.07)" strokeWidth="7" fill="none" strokeLinecap="round"/>
              {/* animated trace */}
              <motion.path d={arc.d} stroke={arc.col} strokeWidth="1.6" fill="none" strokeLinecap="round"
                strokeDasharray="550"
                animate={{ strokeDashoffset:[550,0,0,550] }}
                transition={{ duration:5+i*0.9, repeat:Infinity, delay:i*0.85, ease:'easeInOut', times:[0,0.44,0.8,1] }}
              />
              {/* travelling dot — explicit start→end */}
              <motion.circle r="3.5" fill={arc.col}
                animate={{ cx:[arc.sx, arc.ex, arc.sx], cy:[arc.sy, arc.ey, arc.sy], opacity:[0,1,1,0,0] }}
                transition={{ duration:4+i*0.8, repeat:Infinity, delay:i*0.7, ease:'easeInOut', times:[0,0.42,0.85,0.95,1] }}
              />
            </g>
          ))}
        </g>

        {/* nodes — parallax fast */}
        <g transform={`translate(${px*0.85} ${py*0.75})`} filter="url(#mGlow)">
          {NODES.map(([nx,ny,label],i) => {
            const near = closest.i === i && closest.d < 0.17;
            return (
              <g key={i}>
                {/* outer ping ring */}
                <motion.circle cx={nx} cy={ny} r="5" fill="rgba(255,255,255,0.45)"
                  animate={{ r:[5,22,5], opacity:[0.55,0,0.55] }}
                  transition={{ duration:2.5+i*0.22, repeat:Infinity, delay:i*0.31, ease:'easeOut' }}
                />
                {/* hover halo */}
                {near && (
                  <motion.circle cx={nx} cy={ny} r="14"
                    fill="rgba(200,180,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"
                    initial={{ scale:0 }} animate={{ scale:1 }} transition={{ duration:0.2 }}
                  />
                )}
                {/* core */}
                <motion.circle cx={nx} cy={ny} r={near ? 5.5 : 3.5} fill="#fff"
                  animate={{ opacity:[0.7,1,0.7] }}
                  transition={{ duration:1.7, repeat:Infinity, delay:i*0.18 }}
                />
                {/* label tooltip on hover */}
                {near && (
                  <g>
                    <rect x={nx+10} y={ny-18} width={label.length*7+12} height="18" rx="5" fill="rgba(18,12,60,0.88)"/>
                    <text x={nx+17} y={ny-5} fontFamily="JetBrains Mono" fontSize="9" fill="rgba(255,255,255,0.92)">{label}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* horizontal scanner */}
        <motion.line x1="0" y1="0" x2="600" y2="0"
          stroke="rgba(200,180,255,0.45)" strokeWidth="1"
          animate={{ y1:[0,360], y2:[0,360] }}
          transition={{ duration:4.5, repeat:Infinity, ease:'linear' }}
          style={{ mixBlendMode:'screen' }}
        />

        {/* crosshair cursor in SVG space */}
        <g style={{ transform:`translate(${m.x*600}px,${m.y*360}px)`, transition:'transform 0.05s linear' }}>
          <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(255,255,255,0.65)" strokeWidth="1"/>
          <line x1="0" y1="-10" x2="0" y2="10" stroke="rgba(255,255,255,0.65)" strokeWidth="1"/>
          <circle r="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        </g>
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-300"
            animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }} />
          Live · Eastern Province
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {['Density','Flow','Heat'].map((l,i) => (
            <div key={l} className={`nx-glass nx-pill px-2.5 py-1 text-[9px] font-mono whitespace-nowrap ${i===0?'bg-white/20 text-white':'text-white/55'}`}>{l}</div>
          ))}
        </div>
      </div>

      {/* Signal bars — bottom left */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[168px]">
        <div className="text-[9px] font-mono text-white/65 uppercase tracking-wider mb-1.5">Signal · Live</div>
        <div className="h-10 flex items-end gap-[2px]">
          {[4,7,3,9,5,11,6,10,4,8,12,5,9,7,11,8,10,6].map((h,i) => (
            <motion.span key={i} className="flex-1 rounded-[1px]"
              style={{ background:'rgba(255,255,255,0.78)' }}
              animate={{ height:[`${h*1.7}px`,`${h*2.9}px`,`${h*1.7}px`] }}
              transition={{ duration:1.3+(i%4)*0.28, repeat:Infinity, delay:i*0.055, ease:'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* Stats — bottom right */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl px-4 py-3">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Active</div>
        <div className="flex gap-4">
          {[['14','zones'],['38M','pts'],['<120ms','rt']].map(([v,l]) => (
            <div key={l} className="text-center">
              <div className="text-[15px] font-extrabold text-white leading-none">{v}</div>
              <div className="text-[8px] font-mono text-white/50 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ABIR — Twin Surface ──────────────────────────────────────────────────────
function TwinSurface() {
  const [ref, m] = useSurfaceMouse();
  const px = (m.x - 0.5) * 22;
  const py = (m.y - 0.5) * 14;
  // gauge needle angle driven by mouse X
  const needleAngle = -115 + m.x * 230;
  const needleRad = (needleAngle - 90) * Math.PI / 180;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background:'linear-gradient(145deg,#3c2a78 0%,#2a1f5c 55%,#1e1648 100%)' }} />
      {/* warm mouse overlay — CSS-var driven */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(300px 210px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(255,185,90,0.18), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="tGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="heatG" x1="0" x2="1">
            <stop offset="0" stopColor="#4488ff"/><stop offset="0.5" stopColor="#ffaa44"/><stop offset="1" stopColor="#ff4444"/>
          </linearGradient>
        </defs>

        {/* bg grid */}
        <g opacity="0.07">
          {Array.from({length:12}).map((_,i)=><line key={'h'+i} x1="0" y1={i*32} x2="600" y2={i*32} stroke="#fff"/>)}
          {Array.from({length:20}).map((_,i)=><line key={'v'+i} x1={i*32} y1="0" x2={i*32} y2="360" stroke="#fff"/>)}
        </g>

        {/* ── UNIT A — main furnace ── */}
        <g transform={`translate(${px*0.4} ${py*0.4})`}>
          {/* front face */}
          <rect x="82" y="185" width="128" height="98" rx="2"
            fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
          {/* top face */}
          <polygon points="82,185 148,148 276,148 210,185"
            fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
          {/* right face */}
          <polygon points="210,185 276,148 276,243 210,280"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>
          {/* glowing windows */}
          {[[95,205],[95,232],[125,205],[125,232],[155,205],[155,232]].map(([x,y],i) => (
            <motion.rect key={i} x={x} y={y} width="22" height="18" rx="2"
              fill="rgba(255,160,55,0.55)" stroke="rgba(255,200,100,0.55)" strokeWidth="0.5"
              animate={{ opacity:[0.5,0.92,0.5], fill:['rgba(255,150,40,0.5)','rgba(255,210,80,0.75)','rgba(255,150,40,0.5)'] }}
              transition={{ duration:1.3+i*0.18, repeat:Infinity, delay:i*0.14 }}
            />
          ))}
          {/* chimney */}
          <rect x="172" y="125" width="14" height="25" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
          {/* smoke puffs */}
          {[0,1,2].map(i => (
            <motion.circle key={i} cx={179+i*2} cy={122} r="8"
              fill="rgba(255,255,255,0.09)"
              animate={{ cy:[122,95,72], cx:[179+i*2,179+i*4,179+i*7], r:[7,14,2], opacity:[0.65,0.2,0] }}
              transition={{ duration:2.4, repeat:Infinity, delay:i*0.72, ease:'easeOut' }}
            />
          ))}
        </g>

        {/* ── UNIT B — turbine ── */}
        <g transform={`translate(${px*0.55} ${py*0.5})`}>
          <rect x="290" y="155" width="95" height="82" rx="2"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
          <polygon points="290,155 340,122 435,122 385,155"
            fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.20)" strokeWidth="1"/>
          <polygon points="385,155 435,122 435,204 385,237"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
          {/* turbine — spinning */}
          <motion.g style={{ transformOrigin:'338px 168px' }} animate={{ rotate:[0,360] }}
            transition={{ duration:2.8, repeat:Infinity, ease:'linear' }}>
            {[0,60,120,180,240,300].map(a => (
              <line key={a} x1="338" y1="168"
                x2={338+24*Math.cos(a*Math.PI/180)} y2={168+24*Math.sin(a*Math.PI/180)}
                stroke="rgba(160,210,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
            ))}
            <circle cx="338" cy="168" r="5" fill="rgba(200,235,255,0.9)"/>
          </motion.g>
          <text x="290" y="116" fontFamily="JetBrains Mono" fontSize="8.5" fill="rgba(160,210,255,0.8)">TURBINE · 6.4MW</text>
        </g>

        {/* ── UNIT C — substation ── */}
        <g transform={`translate(${px*0.3} ${py*0.65})`}>
          <rect x="430" y="210" width="100" height="70" rx="2"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.20)" strokeWidth="1"/>
          <polygon points="430,210 470,182 570,182 530,210"
            fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
          {/* lightning bolt */}
          <motion.path d="M488 225 L478 246 L490 243 L480 268 L493 242 L481 245 Z"
            fill="rgba(255,220,80,0.88)"
            animate={{ opacity:[0.55,1,0.4,1,0.55] }} transition={{ duration:0.85, repeat:Infinity }}/>
          <text x="432" y="178" fontFamily="JetBrains Mono" fontSize="8.5" fill="rgba(120,255,160,0.75)">GRID · NORMAL</text>
        </g>

        {/* ── pipe flows ── */}
        <g filter="url(#tGlow)">
          {[
            { d:'M210 240 C 260 265 320 278 380 282', col:'#ffd29a' },
            { d:'M385 195 C 400 210 415 218 430 225',  col:'#a0c8ff' },
            { d:'M82 240 C 55 250 50 265 50 285',      col:'#78ffa0' },
          ].map((pipe,i) => (
            <g key={i}>
              <path d={pipe.d} stroke="rgba(255,255,255,0.07)" strokeWidth="7" fill="none" strokeLinecap="round"/>
              <motion.path d={pipe.d} stroke={pipe.col} strokeWidth="2" fill="none" strokeLinecap="round"
                strokeDasharray="350"
                animate={{ strokeDashoffset:[350,0] }}
                transition={{ duration:2.4+i*0.55, repeat:Infinity, ease:'linear' }}
              />
              {/* 2 particles — cx/cy interpolation */}
              {[0,0.5].map((off,j) => {
                const [sx,sy,ex,ey] = [[210,240,380,282],[385,195,430,225],[82,240,50,285]][i];
                return (
                  <motion.circle key={j} r="3" fill={pipe.col}
                    animate={{ cx:[sx,ex,sx], cy:[sy,ey,sy], opacity:[0,1,1,0,0] }}
                    transition={{ duration:2.4+i*0.55, repeat:Infinity, delay:off*(2.4+i*0.55), ease:'easeInOut', times:[0,0.42,0.85,0.95,1] }}
                  />
                );
              })}
            </g>
          ))}
        </g>

        {/* ── Gauge — mouse-reactive ── */}
        <g transform={`translate(${px*0.7} ${py*0.55})`}>
          <circle cx="68" cy="78" r="40" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
          {/* track */}
          <path d="M68 78 m -32 0 a 32 32 0 1 1 64 0" fill="none"
            stroke="rgba(255,255,255,0.10)" strokeWidth="5" strokeLinecap="round"/>
          {/* fill arc */}
          <motion.path d="M68 78 m -32 0 a 32 32 0 1 1 64 0" fill="none"
            stroke="#ffd29a" strokeWidth="5" strokeLinecap="round"
            strokeDasharray="100"
            animate={{ strokeDashoffset:[100,18,100] }}
            transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}/>
          {/* needle follows mouse x */}
          <line x1="68" y1="78"
            x2={68 + 26*Math.cos(needleRad)} y2={78 + 26*Math.sin(needleRad)}
            stroke="#ff8a5b" strokeWidth="2" strokeLinecap="round"
            style={{ transition:'x2 0.22s ease, y2 0.22s ease' }}
          />
          <circle cx="68" cy="78" r="4.5" fill="#ffd29a"/>
          <text x="68" y="104" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8.5" fill="rgba(255,255,255,0.7)">870 °C</text>
          <text x="68" y="52" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7" fill="rgba(255,210,154,0.65)">FURNACE</text>
        </g>

        {/* ── Temp bars ── */}
        <g transform={`translate(${px*0.35} ${py*0.3})`}>
          {[['F-01','0.72','#ff8a5b'],['F-02','0.58','#ffd29a'],['F-03','0.91','#ff4444']].map(([lbl,pct,col],i) => (
            <g key={i} transform={`translate(0 ${i*26})`}>
              <text x="30" y={305} fontFamily="JetBrains Mono" fontSize="8" fill="rgba(255,255,255,0.6)">{lbl}</text>
              <rect x="68" y={298} width="100" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
              <motion.rect x="68" y={298} height="6" rx="3" fill={col}
                initial={{ width:0 }}
                animate={{ width: parseFloat(pct)*100 }}
                transition={{ duration:1.6+i*0.3, delay:0.4, ease:'easeOut' }}
              />
              <text x="175" y={305} fontFamily="JetBrains Mono" fontSize="8" fill={col}>{Math.round(parseFloat(pct)*100)}%</text>
            </g>
          ))}
        </g>

        {/* pulsing connection nodes */}
        {[[210,240],[385,195],[82,240]].map(([x,y],i) => (
          <g key={i} transform={`translate(${px*(0.4+i*0.1)} ${py*(0.4+i*0.05)})`}>
            <motion.circle cx={x} cy={y} r="6" fill={['#ffd29a','#a0c8ff','#78ffa0'][i]}
              animate={{ r:[6,18,6], opacity:[0.55,0,0.55] }}
              transition={{ duration:2.2, repeat:Infinity, delay:i*0.38, ease:'easeOut' }}/>
            <motion.circle cx={x} cy={y} r="4" fill={['#ffd29a','#a0c8ff','#78ffa0'][i]}
              animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.2 }}/>
          </g>
        ))}
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-[#ffd29a]"
            animate={{ scale:[1,1.5,1], opacity:[0.7,1,0.7] }} transition={{ duration:1.4, repeat:Infinity }}/>
          Twin sync · 99.97%
        </div>
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white/85">Plant Yanbu · Bay 02</div>
      </div>

      {/* Yield panel */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl p-3 w-[195px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-mono text-white/60 uppercase tracking-wider">Live Yield</span>
          <motion.span className="text-[13px] font-bold font-mono text-[#ffd29a]"
            animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:1.5, repeat:Infinity }}>+38%</motion.span>
        </div>
        {[['Throughput','72%','#ffd29a'],['Efficiency','86%','#a0c8ff'],['Uptime','99%','#78ffa0']].map(([l,v,c]) => (
          <div key={l} className="mb-1.5">
            <div className="flex justify-between text-[9px] font-mono text-white/55 mb-0.5">
              <span>{l}</span><span style={{color:c}}>{v}</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background:c }}
                initial={{ width:0 }} animate={{ width:v }}
                transition={{ duration:1.5, delay:0.5, ease:'easeOut' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CYBERBOOK — Game Surface ─────────────────────────────────────────────────
const COIN_POSITIONS = [[120,252],[302,214],[472,174],[202,154],[352,232]];

function GameSurface() {
  const [ref, m, subscribeRaw] = useSurfaceMouse();
  const px = (m.x - 0.5) * 22;
  const py = (m.y - 0.5) * 16;

  // Cursor-followers (companion + custom cursor) bypass React render entirely:
  // their SVG transforms are written via ref every animation frame, with eased
  // tracking for the companion (smooth follow-with-lag) and direct tracking
  // for the cursor reticle (instant). This preserves the snappy "feel" of the
  // original 60fps loop while keeping the throttled React state for the rest
  // of the scene.
  const compRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let curX = 300, curY = 220;
    let tgtX = curX, tgtY = curY;
    let rawX = 0.5, rawY = 0.5;
    const unsub = subscribeRaw((x, y) => {
      rawX = x; rawY = y;
      tgtX = 40 + x * 520;
      tgtY = 220 + (y - 0.5) * 80;
    });
    const tick = () => {
      curX += (tgtX - curX) * 0.18;
      curY += (tgtY - curY) * 0.18;
      if (compRef.current)   compRef.current.setAttribute('transform', `translate(${curX.toFixed(2)} ${curY.toFixed(2)})`);
      if (cursorRef.current) cursorRef.current.setAttribute('transform', `translate(${(rawX * 600).toFixed(2)} ${(rawY * 360).toFixed(2)})`);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); unsub(); };
  }, [subscribeRaw]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ cursor:'none' }}>
      <div className="absolute inset-0" style={{ background:'linear-gradient(165deg,#1c2870 0%,#283898 45%,#3448a8 100%)' }} />
      {/* cursor glow — CSS-var driven */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(240px 180px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(170,230,255,0.22), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="gGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {/* parallax star field — 3 layers */}
        <g transform={`translate(${px*0.15} ${py*0.1})`} opacity="0.45">
          {[[44,22],[88,55],[162,16],[232,42],[312,22],[402,48],[482,30],[542,58],[72,86],[202,88],[342,78],[502,88],[140,40],[260,30],[420,70],[560,25]].map(([x,y],i) => (
            <motion.circle key={i} cx={x} cy={y} r={i%3===0?1.4:0.8} fill="#fff"
              animate={{ opacity:[0.25,0.9,0.25] }} transition={{ duration:1.8+i*0.25, repeat:Infinity, delay:i*0.18 }}/>
          ))}
        </g>
        <g transform={`translate(${px*0.4} ${py*0.3})`} opacity="0.25">
          {[[30,48],[112,28],[198,52],[282,32],[382,56],[462,36],[548,52],[92,68],[242,62],[422,70],[180,95],[340,98]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="0.8" fill="#c8d8ff"/>
          ))}
        </g>

        {/* floating code fragments — bg parallax */}
        <g opacity="0.13" fontFamily="JetBrains Mono" fontSize="10" fill="#a8d8ff"
          transform={`translate(${px*0.28} ${py*0.2})`}>
          {['for(','let','[]','=>','{i}','++','fn','0x','&&','||','map','()=>'].map((t,i) => (
            <motion.text key={i} x={28+i*50} y={110+Math.sin(i*1.1)*28}
              animate={{ y:[110+Math.sin(i*1.1)*28, 72+Math.sin(i*1.1)*28] }}
              transition={{ duration:8+i*0.5, repeat:Infinity, repeatType:'reverse', ease:'easeInOut', delay:i*0.35 }}
            >{t}</motion.text>
          ))}
        </g>

        {/* platforms */}
        <g transform={`translate(${px*0.7} ${py*0.62})`}>
          {[[40,285,180],[262,245,118],[422,205,138],[182,185,58],[312,160,80],[502,280,78]].map(([x,y,w],i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height="12" rx="3"
                fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.30)" strokeWidth="1"/>
              <rect x={x} y={y} width={w} height="4" rx="2" fill="rgba(255,255,255,0.26)"/>
              {/* grass tufts */}
              {Array.from({length:Math.floor(w/22)}).map((_,j) => (
                <rect key={j} x={x+j*22+7} y={y-4} width="3" height="5" rx="1" fill="rgba(120,255,160,0.45)"/>
              ))}
            </g>
          ))}
        </g>

        {/* coins — scatter away from cursor */}
        <g filter="url(#gGlow)" transform={`translate(${px*0.82} ${py*0.72})`}>
          {COIN_POSITIONS.map(([cx,cy],i) => {
            const dx = cx/600 - m.x, dy = cy/360 - m.y;
            const dist = Math.hypot(dx, dy);
            const push = dist < 0.18 ? (0.18-dist)/0.18 : 0;
            const ox = dx * push * -55;
            const oy = dy * push * -40;
            return (
              <g key={i} style={{ transform:`translate(${ox}px,${oy}px)`, transition:'transform 0.22s ease' }}>
                <motion.circle cx={cx} cy={cy} r="13" fill="rgba(168,245,196,0.18)"
                  animate={{ r:[13,22,13], opacity:[0.35,0,0.35] }}
                  transition={{ duration:1.9, repeat:Infinity, delay:i*0.38 }}/>
                <motion.ellipse cx={cx} cy={cy} ry="6" rx="6" fill="#a8f5c4"
                  stroke="rgba(255,255,255,0.45)" strokeWidth="0.5"
                  animate={{ rx:[6,1.3,6] }}
                  transition={{ duration:1.5, repeat:Infinity, delay:i*0.28, ease:'easeInOut' }}/>
                {/* sparkle */}
                <motion.g
                  animate={{ opacity:[0,1,0], scale:[0.5,1.3,0.5] }}
                  transition={{ duration:1.5, repeat:Infinity, delay:i*0.42 }}
                  style={{ transformOrigin:`${cx}px ${cy}px` }}>
                  <line x1={cx-9} y1={cy} x2={cx+9} y2={cy} stroke="#fff" strokeWidth="0.9" opacity="0.7"/>
                  <line x1={cx} y1={cy-9} x2={cx} y2={cy+9} stroke="#fff" strokeWidth="0.9" opacity="0.7"/>
                  <line x1={cx-6} y1={cy-6} x2={cx+6} y2={cy+6} stroke="#fff" strokeWidth="0.6" opacity="0.4"/>
                  <line x1={cx+6} y1={cy-6} x2={cx-6} y2={cy+6} stroke="#fff" strokeWidth="0.6" opacity="0.4"/>
                </motion.g>
              </g>
            );
          })}
        </g>

        {/* main sprite — hops between platforms */}
        <motion.g
          animate={{ x:[80,195,290,460,80], y:[258,158,210,170,258] }}
          transition={{ duration:7.5, repeat:Infinity, ease:'easeInOut', times:[0,0.25,0.5,0.75,1] }}
        >
          <motion.g animate={{ y:[0,-9,0] }} transition={{ duration:0.42, repeat:Infinity, ease:'easeInOut' }}>
            {/* cape */}
            <motion.path d="M-12 -22 Q -24 -13 -15 -3" stroke="#a8f5c4" strokeWidth="3.5" fill="none" strokeLinecap="round"
              animate={{ d:['M-12 -22 Q -24 -13 -15 -3','M-12 -22 Q -20 -10 -11 -2'] }}
              transition={{ duration:0.42, repeat:Infinity, ease:'easeInOut' }}/>
            <rect x="-12" y="-24" width="24" height="24" rx="4" fill="#7ce0ff"/>
            <rect x="-7" y="-18" width="5" height="5" rx="1" fill="#1a1450"/>
            <rect x="2" y="-18" width="5" height="5" rx="1" fill="#1a1450"/>
            <motion.rect x="-5" y="-11" width="10" height="2" rx="1" fill="#1a1450"
              animate={{ scaleX:[1,0.65,1] }} transition={{ duration:1.1, repeat:Infinity }}/>
            {/* motion trail */}
            {[1,2,3].map(t => (
              <motion.circle key={t} cx={-t*8} cy={-12} r={5-t} fill="rgba(124,224,255,0.35)"
                animate={{ opacity:[0.55-t*0.12,0] }}
                transition={{ duration:0.55, repeat:Infinity, delay:t*0.04 }}/>
            ))}
          </motion.g>
        </motion.g>

        {/* companion — follows cursor (transform written via ref @60fps with rAF easing) */}
        <g ref={compRef} transform="translate(300 220)">
          <motion.g animate={{ y:[0,-5,0] }} transition={{ duration:1.3, repeat:Infinity, ease:'easeInOut' }}>
            <rect x="-10" y="-20" width="20" height="20" rx="3" fill="#a8f5c4"/>
            <rect x="-5" y="-15" width="4" height="4" rx="1" fill="#1a1450"/>
            <rect x="1" y="-15" width="4" height="4" rx="1" fill="#1a1450"/>
            <rect x="-3" y="-9" width="6" height="2" rx="1" fill="#1a1450"/>
            {/* bounce shadow */}
            <motion.ellipse cx="0" cy="4" rx="8" ry="2" fill="rgba(0,0,0,0.18)"
              animate={{ rx:[8,6,8], opacity:[0.3,0.15,0.3] }} transition={{ duration:1.3, repeat:Infinity, ease:'easeInOut' }}/>
          </motion.g>
          {/* chat bubble */}
          <motion.g animate={{ opacity:[0,1,1,0], y:[-2,-6,-6,-2] }} transition={{ duration:3.5, repeat:Infinity, repeatDelay:2 }}>
            <rect x="-18" y="-44" width="36" height="16" rx="4" fill="rgba(18,12,55,0.85)" stroke="rgba(168,245,196,0.4)" strokeWidth="0.5"/>
            <text x="0" y="-33" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="rgba(168,245,196,0.9)">hi! 👋</text>
          </motion.g>
        </g>

        {/* custom cursor — transform written via ref @60fps, no React render needed */}
        <g ref={cursorRef} transform="translate(300 180)">
          <motion.circle r="6" fill="rgba(255,255,255,0.92)" stroke="rgba(168,245,196,0.65)" strokeWidth="1.5"
            animate={{ scale:[1,1.25,1] }} transition={{ duration:0.7, repeat:Infinity }}/>
          <circle r="2" fill="#1a2050"/>
        </g>
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-3 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <span>LVL 12</span>
          <span className="text-white/35">·</span>
          <motion.span style={{ color:'#a8f5c4' }} animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:1.5, repeat:Infinity }}>★ 2,480</motion.span>
          <span className="text-white/35">·</span>
          <span style={{ color:'#7ce0ff' }}>XP 2.1k/3k</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0,1,2,3].map(i => (
            <motion.span key={i} className="w-3 h-3"
              style={{ background:i<3?'#ff7da0':'rgba(255,255,255,0.2)', clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)' }}
              animate={i<3?{ scale:[1,1.18,1] }:{}} transition={{ duration:1.2, repeat:Infinity, delay:i*0.16 }}/>
          ))}
        </div>
      </div>

      {/* XP bar */}
      <div className="absolute top-12 left-4 right-4 pointer-events-none">
        <div className="h-[3px] rounded-full bg-white/15 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#a8f5c4,#7ce0ff)' }}
            initial={{ width:'0%' }} animate={{ width:'70%' }} transition={{ duration:1.8, ease:'easeOut' }}/>
        </div>
      </div>

      {/* Quest panel */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[215px]">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Active Quests</div>
        {[['Loop the array',60,'#a8f5c4'],['Recurse depth 3',35,'#7ce0ff'],['Fix the bug',90,'#ffb450']].map(([q,pct,c]) => (
          <div key={q} className="mb-1.5">
            <div className="flex justify-between text-[9px] font-mono text-white/70 mb-0.5">
              <span>{q}</span><span style={{color:c}}>{pct}%</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/12 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background:c, width:`${pct}%` }}
                animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:1.4, repeat:Infinity }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement popup */}
      <motion.div className="absolute bottom-[88px] right-4 nx-glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 pointer-events-none"
        initial={{ x:130, opacity:0 }}
        animate={{ x:[130,0,0,130], opacity:[0,1,1,0] }}
        transition={{ duration:4.5, repeat:Infinity, delay:2.5, times:[0,0.12,0.82,1] }}>
        <span className="text-lg">🏆</span>
        <div>
          <div className="text-[9px] font-mono text-[#a8f5c4] uppercase tracking-wider">Achievement</div>
          <div className="text-[11px] text-white font-medium">First Loop Complete!</div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Surface selector ─────────────────────────────────────────────────────────
function Surface({ kind }) {
  if (kind === 'map')      return <MapSurface />;
  if (kind === 'twin')     return <TwinSurface />;
  if (kind === 'game')     return <GameSurface />;
  if (kind === 'mushroom' && window.MushroomSurface) return <window.MushroomSurface />;
  if (kind === 'sidus'    && window.SidusSurface)    return <window.SidusSurface />;
  if (kind === 'cityexpo' && window.CityExpoSurface) return <window.CityExpoSurface />;
  if (kind === 'reel'     && window.ReelSurface)     return <window.ReelSurface />;
  return <GameSurface />;
}

// ─── CASES data ───────────────────────────────────────────────────────────────
const CASES = [
  {
    code:'001 / DATOO', name:'Datoo', tag:'AI Data Visualization', surface:'map',
    role:'Product · Brand · AI Systems',
    desc:'Interactive geo-data mapping for complex public datasets — turning thousands of signals into a single, navigable map of the Kingdom.',
    metrics:[{k:'38M',l:'data points'},{k:'14',l:'live regions'},{k:'<120ms',l:'render'}],
  },
  {
    code:'002 / ABIR HOLDINGS', name:'ABIR Holdings', tag:'Industrial Digital Twin', surface:'twin',
    role:'Engineering · 3D · Realtime',
    desc:'A waste-to-energy operating console — real-time twin of every furnace, pipeline and substation, fused with predictive AI.',
    metrics:[{k:'+38%',l:'throughput'},{k:'−24%',l:'downtime'},{k:'6',l:'plants live'}],
  },
  {
    code:'003 / CYBERBOOK', name:'CyberBook', tag:'EdTech · Gamified Programming', surface:'game',
    role:'Pedagogy · Product · Motion',
    desc:'Teaches code through play. Quests, in-app economies and a teacher console make programming feel like a multiplayer game.',
    metrics:[{k:'120k',l:'learners'},{k:'92%',l:'completion'},{k:'4.9★',l:'app store'}],
  },
  {
    code:'004 / MYCO.OS', name:'Myco.OS', tag:'AI · Urban Farming Framework', surface:'mushroom',
    role:'AI · IoT · Product Systems',
    desc:'An AI-driven platform for urban mushroom farming — fusing real-time environmental and production data into actionable operational intelligence across the full growing cycle.',
    metrics:[{k:'+38%',l:'yield/cycle'},{k:'−42%',l:'energy'},{k:'24/7',l:'autopilot'}],
  },
  {
    code:'005 / SIDUS HEROES', name:'Sidus Heroes', tag:'Web3 · Multi-Layer Ecosystem', surface:'sidus',
    role:'Web3 · Product · Motion',
    desc:'A world-class Web3 platform engineered as a living digital universe — a navigable metaverse with cinematic 3D environments, real-time interactions and dozens of products woven into one seamless interface.',
    metrics:[{k:'$84M',l:'TVL'},{k:'12',l:'connected dApps'},{k:'420k',l:'wallets'}],
  },
  {
    code:'006 / CITY EXPO', name:'City Expo', tag:'Browser 3D · Virtual Exhibition', surface:'cityexpo',
    role:'3D · Realtime · Platform',
    desc:'A browser-based 3D platform that replaced a major city festival during the COVID lockdown — instant access by link, no downloads, with 150+ participants, mini-games, live broadcasts and a points-based engagement system.',
    metrics:[{k:'150+',l:'pavilions'},{k:'8.4k',l:'concurrent'},{k:'0',l:'downloads'}],
  },
  {
    code:'007 / REEL.AI', name:'Reel.AI', tag:'AI Content Pipeline', surface:'reel',
    role:'AI Systems · Pipeline · Motion',
    desc:'An AI-driven content pipeline that turns a single creative brief into a swarm of cinematic ad frames — across every format and aspect ratio, in minutes, at studio quality.',
    metrics:[{k:'1.2k',l:'frames/day'},{k:'0.4s',l:'avg render'},{k:'94%',l:'approval'}],
  },
];

// ─── Case Card — copy left, visualization right ─────────────────────────────
function CaseCard({ c }) {
  return (
    <article className="glass sweep portfolio-card">
      <div className="portfolio-card__grid">
        <div className="portfolio-card__copy">
          <div className="portfolio-card__copy-top">
            <span className="portfolio-card__code eyebrow mono">{c.code}</span>
            <h3 className="portfolio-card__title">{c.name}</h3>
            <span className="portfolio-card__tag">{c.tag}</span>
            <p className="portfolio-card__desc body-m">{c.desc}</p>
          </div>
          <div>
            <div className="portfolio-card__metrics">
              {c.metrics.map(m => (
                <div key={m.l} className="portfolio-card__metric glass-soft">
                  <div className="portfolio-card__metric-k">{m.k}</div>
                  <div className="portfolio-card__metric-l">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="portfolio-card__foot">
              <p className="portfolio-card__role eyebrow">{c.role}</p>
              <a href="#contact" className="portfolio-card__cta" aria-label={`View ${c.name} case`}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M5 13 L13 5 M7 5 H13 V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="portfolio-card__viz">
          <Surface kind={c.surface} />
        </div>
      </div>
    </article>
  );
}

// ─── Portfolio — sticky viewport + vertical scroll → horizontal track ────────
function Portfolio() {
  const sectionRef = useRef(null);
  const wrapRef    = useRef(null);
  const stickRef   = useRef(null);
  const trackRef   = useRef(null);
  const inView     = useMotionInView(sectionRef, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const pctRef = useRef(0);
  const chromeRef = useRef(null);
  const panelCount = CASES.length;

  /* Measure the real left edge of any `.container` on the page and write it
     to `--pf-lane-inset` on the section. This guarantees pixel-perfect alignment
     between portfolio (heading + first card) and every other section title /
     bento card on the site — regardless of scrollbar width, browser zoom, or
     CSS calc()-with-min() quirks. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const syncLaneInset = () => {
      const ref = document.querySelector('.container');
      if (!ref) return;
      const left = ref.getBoundingClientRect().left;
      section.style.setProperty('--pf-lane-inset', `${Math.round(left)}px`);
    };

    syncLaneInset();
    const ro = new ResizeObserver(syncLaneInset);
    ro.observe(document.documentElement);
    window.addEventListener('resize', syncLaneInset);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncLaneInset);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const stick = stickRef.current;
    if (!wrap || !track || !stick) return;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let raf = 0;

    /* Cache the first panel element + last layout values once per layout cycle.
       Previously this handler queried the DOM and wrote wrap.style.height on
       every scroll tick — wasted reflow even when nothing changed. */
    let firstPanel = track.querySelector('.portfolio-panel');
    let lastVh = -1;
    let lastWrapH = -1;
    let labelEl = null;
    let dotEls = null;

    const layout = () => {
      firstPanel = track.querySelector('.portfolio-panel');
      lastVh = -1; // force height + chrome refresh on next update
      const root = chromeRef.current;
      if (root) {
        labelEl = root.querySelector('[data-pf-index]');
        dotEls = root.querySelectorAll('[data-pf-dot]');
      }
    };

    const updateChrome = (idx) => {
      if (labelEl) labelEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(panelCount).padStart(2, '0')}`;
      if (dotEls) dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
    };

    const update = () => {
      const vh = window.innerHeight;
      if (vh !== lastVh) {
        const wrapH = panelCount * vh;
        if (wrapH !== lastWrapH) {
          wrap.style.height = `${wrapH}px`;
          lastWrapH = wrapH;
        }
        lastVh = vh;
      }

      const stickH = stick.offsetHeight;
      const panelStep = firstPanel ? firstPanel.offsetWidth : stick.clientWidth;
      const scrollable = Math.max(0, wrap.offsetHeight - stickH);
      const rect = wrap.getBoundingClientRect();
      const progressed = clamp(-rect.top, 0, scrollable);
      const pct = scrollable > 0 ? progressed / scrollable : 0;
      const maxShift = (panelCount - 1) * panelStep;

      pctRef.current = pct;
      track.style.transform = `translate3d(${-(pct * maxShift).toFixed(2)}px, 0, 0)`;

      const idx = panelCount <= 1 ? 0 : Math.min(panelCount - 1, Math.round(pct * (panelCount - 1)));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
        updateChrome(idx);
      }
    };

    const onScroll = () => {
      if (raf) return; // already queued — next frame will read the latest scrollY
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };

    const onResize = () => { layout(); update(); };

    layout();
    update();
    updateChrome(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [panelCount]);

  return (
    <section id="portfolio" ref={sectionRef}>
      <div ref={wrapRef} className="portfolio-wrap">
        <div ref={stickRef} className="portfolio-stick">

          {/* Intro pinned to the top of the sticky viewport — kills the empty
              gap that used to appear between an out-of-sticky title and the
              vertically-centered first card. */}
          <div className="portfolio-intro">
            <SectionHead
              eyebrow="Featured work · 07"
              title="Selected products, shipped at production grade."
              meta="Seven recent ecosystems — each running live, each owned end-to-end by Nexora."
            />
          </div>

          <div ref={trackRef} className="portfolio-track">
            {CASES.map((c, i) => (
              <div key={c.name} className="portfolio-panel">
                <CaseCard c={c} />
              </div>
            ))}
          </div>
          <div className="portfolio-chrome" ref={chromeRef}>
            <div className="row" style={{ gap: 14, alignItems: 'center' }}>
              <span className="eyebrow mono" style={{ color: 'rgba(255,255,255,0.65)' }}>Scroll to explore</span>
              <div className="portfolio-progress" aria-hidden="true">
                {CASES.map((c, i) => (
                  <span key={c.name} data-pf-dot className={`portfolio-progress__dot${i === activeIndex ? ' is-active' : ''}`} />
                ))}
              </div>
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <span className="eyebrow mono" data-pf-index style={{ color: 'rgba(255,255,255,0.55)' }}>
                {String(activeIndex + 1).padStart(2, '0')} / {String(panelCount).padStart(2, '0')}
              </span>
              <span style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.22)' }} />
              <a href="#contact" className="eyebrow" style={{ color: '#fff', textDecoration: 'none', letterSpacing: '0.08em' }}>
                Full portfolio →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Portfolio = Portfolio;
