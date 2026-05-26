/* global React, motion, useEffect, useRef, useState */
/* Portfolio viz surface 007 — Reel.AI (AI Content Production pipeline) */

/* Magnetic-eased mouse tracker — same three-tier model as useSurfaceMouse /
   useSurfaceMouse2: smoothed CSS vars for spotlights, raw subscriber gated
   on hover for direct DOM followers, epsilon-throttled React state for
   heavy SVG/Framer-Motion children. */
function useSurfaceMouse3() {
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
    const LERP = 0.32;
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

/* ═══════════════════════════════════════════════════════════════════════════
   007 — ReelSurface · Reel.AI (AI Content Production)
   Director's monitor cross-fades 4 AI-generated aesthetics, magazine collage
   on the right cycles through render/queued/done states, scrolling filmstrip
   at the bottom, AI tool stack on the right edge. Adapted from WorkSurfaces3
   ContentSurface — particle / scan-line counts trimmed, spotlight driven by
   CSS vars from useSurfaceMouse3 (no per-frame React renders).
   ═══════════════════════════════════════════════════════════════════════════ */
function ReelSurface() {
  const [ref, m] = useSurfaceMouse3();
  // Small tilt parallax using smoothed (epsilon-throttled) React state.
  const tx = (m.x - 0.5) * 18;
  const ty = (m.y - 0.5) * 10;

  // 6 magazine tiles (down from 9) — kept variety of states + aspect ratios.
  const tiles = React.useMemo(() => ([
    { x:0,   y:0,    w:80, h:50, grad:'rImg1', state:'done',      lbl:'AD-014' },
    { x:88,  y:0,    w:52, h:50, grad:'rImg2', state:'rendering', lbl:'AD-015' },
    { x:148, y:0,    w:80, h:50, grad:'rImg3', state:'done',      lbl:'AD-016' },
    { x:0,   y:58,   w:60, h:46, grad:'rImg4', state:'rendering', lbl:'AD-017' },
    { x:68,  y:58,   w:72, h:46, grad:'rImg1', state:'done',      lbl:'AD-010' },
    { x:148, y:58,   w:80, h:46, grad:'rImg2', state:'queued',    lbl:'AD-018' },
  ]), []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background:'linear-gradient(155deg,#2a1648 0%,#3c1c5e 35%,#1a0a36 70%,#0a0420 100%)'
      }} />

      {/* Director-light spotlight — driven by CSS vars (60fps writes, zero React renders) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(280px 200px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(255,200,90,0.22), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Four morphing aesthetics — cross-faded inside the monitor + reused
              for collage tiles and the scrolling filmstrip frames. */}
          <linearGradient id="rImg1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ff9bb8"/><stop offset="0.45" stopColor="#ffba6b"/><stop offset="1" stopColor="#4a2a8a"/>
          </linearGradient>
          <linearGradient id="rImg2" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#9bd4ff"/><stop offset="0.5" stopColor="#c98aff"/><stop offset="1" stopColor="#1c1248"/>
          </linearGradient>
          <linearGradient id="rImg3" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#b8ffc8"/><stop offset="0.5" stopColor="#5acef0"/><stop offset="1" stopColor="#142848"/>
          </linearGradient>
          <linearGradient id="rImg4" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffd060"/><stop offset="0.5" stopColor="#ff5a8a"/><stop offset="1" stopColor="#2a0c50"/>
          </linearGradient>
          <clipPath id="rMonitor"><rect x="24" y="62" width="268" height="148" rx="3"/></clipPath>
        </defs>

        {/* Drifting projector flecks — 12 (was 26) */}
        <g transform={`translate(${tx*0.18} ${ty*0.18})`} opacity="0.55">
          {Array.from({length:12}).map((_,i) => {
            const x = (i*113 + 23) % 600;
            const y0 = (i*97 + 17) % 360;
            return (
              <motion.circle key={i} cx={x} cy={y0} r={i%4===0?1.3:0.6} fill="rgba(255,220,180,0.75)"
                animate={{ cy:[y0, y0-34], opacity:[0,0.85,0] }}
                transition={{ duration:5+(i%4)*1.4, repeat:Infinity, delay:i*0.3, ease:'easeOut' }}/>
            );
          })}
        </g>

        {/* Ambient scan lines — 16 (was 36) */}
        <g opacity="0.04">
          {Array.from({length:16}).map((_,i) => (
            <line key={i} x1="0" y1={i*22} x2="600" y2={i*22} stroke="#fff" strokeWidth="0.4"/>
          ))}
        </g>

        {/* Pipeline header — BRIEF → STRATEGY → ART DIR → AI GEN → EDIT → SHIP */}
        <g transform={`translate(${22+tx*0.12} ${22+ty*0.12})`}>
          {['BRIEF','STRATEGY','ART DIR','AI GEN','EDIT','SHIP'].map((s,i) => {
            const done = i < 3, active = i === 3;
            return (
              <g key={i}>
                {i<5 && (
                  <line x1={i*92+8} y1="9" x2={(i+1)*92-2} y2="9"
                    stroke={done ? '#ffba6b' : 'rgba(255,255,255,0.18)'} strokeWidth="1.2"/>
                )}
                <motion.circle cx={i*92+4} cy="9" r="4"
                  fill={done ? '#ffba6b' : active ? '#fff' : 'rgba(255,255,255,0.28)'}
                  stroke={active ? '#ffba6b' : 'none'} strokeWidth="1"
                  animate={active ? { scale:[1,1.45,1], opacity:[0.85,1,0.85] } : false}
                  transition={{ duration:1.4, repeat:Infinity }}/>
                {active && (
                  <motion.circle cx={i*92+4} cy="9" r="8" fill="none" stroke="#ffba6b" strokeWidth="0.6"
                    animate={{ r:[8,15,8], opacity:[0.7,0,0.7] }}
                    transition={{ duration:1.6, repeat:Infinity }}/>
                )}
                <text x={i*92+4} y="26" textAnchor="start" fontFamily="JetBrains Mono" fontSize="7"
                  fill={done || active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.48)'}>{s}</text>
              </g>
            );
          })}
        </g>

        {/* Director's monitor — center-left */}
        <g transform={`translate(${tx*0.4} ${ty*0.4})`}>
          <rect x="18" y="56" width="280" height="160" rx="6"
            fill="rgba(10,5,30,0.85)" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
          <rect x="24" y="62" width="268" height="148" rx="3" fill="rgba(0,0,0,0.55)"/>

          <g clipPath="url(#rMonitor)">
            {/* 4 cross-fading aesthetic frames */}
            {['rImg1','rImg2','rImg3','rImg4'].map((id, i) => (
              <motion.rect key={id} x="24" y="62" width="268" height="148" fill={`url(#${id})`}
                animate={{ opacity:[0,1,1,0,0] }}
                transition={{ duration:14, repeat:Infinity, delay:i*3.5, times:[0,0.08,0.25,0.34,1], ease:'easeInOut' }}/>
            ))}

            {/* Drifting subject silhouette */}
            <motion.g opacity="0.45"
              animate={{ x:[0, 8, 0, -6, 0] }}
              transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}>
              <ellipse cx="200" cy="160" rx="42" ry="50" fill="rgba(0,0,0,0.4)"/>
              <circle cx="200" cy="118" r="22" fill="rgba(0,0,0,0.45)"/>
            </motion.g>

            {/* Product highlight pulse */}
            <motion.circle cx="120" cy="155" r="22" fill="rgba(255,255,255,0.18)"
              animate={{ r:[22,28,22], opacity:[0.18,0.32,0.18] }}
              transition={{ duration:3.4, repeat:Infinity, ease:'easeInOut' }}/>

            {/* Render scan line */}
            <motion.rect x="24" width="268" height="1.8" fill="rgba(255,255,255,0.7)"
              animate={{ y:[62, 210] }} transition={{ duration:2.8, repeat:Infinity, ease:'linear' }}/>

            {/* AI grain — static 48 dots (was 72) */}
            <g opacity="0.16">
              {Array.from({length:48}).map((_,i) => {
                const x = (i*47 + 11) % 268 + 24;
                const y = (i*31 + 7) % 148 + 62;
                return <rect key={i} x={x} y={y} width="1.4" height="1.4" fill="#fff"/>;
              })}
            </g>

            {/* Render progress strip */}
            <rect x="24" y="200" width="268" height="6" fill="rgba(0,0,0,0.65)"/>
            <motion.rect x="24" y="200" height="6" fill="#ffba6b"
              animate={{ width:[0, 268, 268, 0] }}
              transition={{ duration:4.4, repeat:Infinity, times:[0,0.7,0.92,1], ease:'easeInOut' }}/>
          </g>

          {/* REC indicator */}
          <motion.circle cx="38" cy="74" r="3.5" fill="#ff4466"
            animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:0.9, repeat:Infinity }}/>
          <text x="46" y="77" fontFamily="JetBrains Mono" fontSize="8" fill="rgba(255,255,255,0.88)">REC</text>

          {/* Timecode */}
          <text x="280" y="77" textAnchor="end" fontFamily="JetBrains Mono" fontSize="8" fill="rgba(255,186,107,0.9)">
            00:00:14:08
          </text>

          {/* Aspect ratio HUD */}
          <g>
            <rect x="24" y="207" width="34" height="14" rx="2" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5"/>
            <text x="41" y="217" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7" fill="rgba(255,255,255,0.88)">16:9</text>
          </g>

          {/* Corner crop marks */}
          <g stroke="#ffba6b" strokeWidth="1" fill="none">
            <path d="M34 72 L34 78 L40 78"/>
            <path d="M282 72 L282 78 L276 78"/>
            <path d="M34 200 L34 194 L40 194"/>
            <path d="M282 200 L282 194 L276 194"/>
          </g>

          {/* PROMPT hint pill */}
          <g transform="translate(38 86)">
            <rect x="0" y="0" width="148" height="14" rx="3"
              fill="rgba(20,12,48,0.78)" stroke="rgba(255,186,107,0.45)" strokeWidth="0.6"/>
            <text x="4" y="10" fontFamily="JetBrains Mono" fontSize="7" fill="rgba(255,186,107,0.85)">PROMPT ·</text>
            <text x="44" y="10" fontFamily="JetBrains Mono" fontSize="7" fill="rgba(255,255,255,0.9)">cinematic · golden hour</text>
            <motion.rect x="138" y="3.5" width="1" height="7" fill="rgba(255,255,255,0.9)"
              animate={{ opacity:[1,0,1] }} transition={{ duration:0.7, repeat:Infinity }}/>
          </g>
        </g>

        {/* Magazine collage — right side */}
        <g transform={`translate(${320+tx*0.3} ${62+ty*0.3})`}>
          {tiles.map((t,i) => (
            <g key={i}>
              <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="2"
                fill={t.state==='queued' ? 'rgba(0,0,0,0.45)' : `url(#${t.grad})`}
                stroke="rgba(255,255,255,0.34)" strokeWidth="0.6"/>
              {t.state==='done' && (
                <rect x={t.x+0.6} y={t.y+0.6} width={t.w-1.2} height={t.h-1.2} rx="1.5"
                  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4"/>
              )}
              {t.state==='rendering' && (
                <motion.rect x={t.x} y={t.y} width={t.w} height="1.6" fill="rgba(255,255,255,0.88)"
                  animate={{ y:[t.y, t.y+t.h] }}
                  transition={{ duration:1.8, repeat:Infinity, delay:i*0.25, ease:'linear' }}/>
              )}
              {t.state==='queued' && (
                <g>
                  <line x1={t.x+8} y1={t.y+t.h/2} x2={t.x+t.w-8} y2={t.y+t.h/2}
                    stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" strokeDasharray="2 3"/>
                  <text x={t.x+t.w/2} y={t.y+t.h/2-3} textAnchor="middle"
                    fontFamily="JetBrains Mono" fontSize="6" fill="rgba(255,255,255,0.42)">QUEUED</text>
                </g>
              )}
              <circle cx={t.x+5} cy={t.y+5} r="1.6"
                fill={t.state==='done' ? '#a8ff9b' : t.state==='rendering' ? '#ffba6b' : 'rgba(255,255,255,0.32)'}/>
              {t.state==='rendering' && (
                <motion.circle cx={t.x+5} cy={t.y+5} r="3" fill="none" stroke="#ffba6b" strokeWidth="0.6"
                  animate={{ r:[3,7,3], opacity:[0.7,0,0.7] }}
                  transition={{ duration:1.6, repeat:Infinity }}/>
              )}
              <text x={t.x+t.w-4} y={t.y+t.h-4} textAnchor="end"
                fontFamily="JetBrains Mono" fontSize="6" fill="rgba(255,255,255,0.7)">{t.lbl}</text>
            </g>
          ))}
        </g>

        {/* Connector beams — monitor → collage */}
        <g stroke="rgba(255,186,107,0.34)" strokeWidth="0.55" strokeDasharray="2 3" fill="none">
          {[82, 120, 160].map((y,i) => (
            <motion.line key={i}
              x1={298+tx*0.4}  y1={y+ty*0.4}
              x2={320+tx*0.3} y2={y+ty*0.3}
              animate={{ strokeDashoffset:[0,-15] }}
              transition={{ duration:1+i*0.2, repeat:Infinity, ease:'linear' }}/>
          ))}
        </g>

        {/* AI tool stack — right edge */}
        <g transform={`translate(${tx*0.5} ${ty*0.4})`}>
          {[
            { y:62,  l:'IMG · v6',  c:'#ff9bb8' },
            { y:86,  l:'VID · gen', c:'#9bd4ff' },
            { y:110, l:'VO · tts',  c:'#b8ffc8' },
            { y:134, l:'EDIT · ai', c:'#ffd060' },
          ].map((t,i) => (
            <motion.g key={i}
              animate={{ y:[0,-2,0] }}
              transition={{ duration:3.4+i*0.4, repeat:Infinity, delay:i*0.3, ease:'easeInOut' }}>
              <rect x="554" y={t.y} width="40" height="14" rx="7"
                fill="rgba(20,12,48,0.85)" stroke={t.c} strokeWidth="0.7"/>
              <circle cx="560" cy={t.y+7} r="2" fill={t.c}/>
              <motion.circle cx="560" cy={t.y+7} r="3.5" fill="none" stroke={t.c} strokeWidth="0.4"
                animate={{ r:[3.5,7,3.5], opacity:[0.7,0,0.7] }}
                transition={{ duration:2, repeat:Infinity, delay:i*0.25 }}/>
              <text x="567" y={t.y+10} fontFamily="JetBrains Mono" fontSize="6" fill="rgba(255,255,255,0.88)">{t.l}</text>
            </motion.g>
          ))}
        </g>

        {/* Scrolling film strip — bottom */}
        <g transform={`translate(0 ${228+ty*0.2})`}>
          <rect x="0" y="0" width="600" height="46" fill="rgba(0,0,0,0.6)"/>
          {Array.from({length:24}).map((_,i) => (
            <g key={i}>
              <rect x={i*26+3} y="2"  width="6" height="4" rx="0.6" fill="rgba(255,255,255,0.2)"/>
              <rect x={i*26+3} y="40" width="6" height="4" rx="0.6" fill="rgba(255,255,255,0.2)"/>
            </g>
          ))}
          <motion.g
            animate={{ x:[0, -300] }}
            transition={{ duration:9, repeat:Infinity, ease:'linear' }}>
            {Array.from({length:10}).map((_,i) => {
              const grads = ['rImg1','rImg2','rImg3','rImg4'];
              return (
                <g key={i}>
                  <rect x={i*60+8} y="9" width="50" height="28" rx="1.5"
                    fill={`url(#${grads[i%4]})`} stroke="rgba(255,255,255,0.32)" strokeWidth="0.4"/>
                  <text x={i*60+33} y="44" textAnchor="middle"
                    fontFamily="JetBrains Mono" fontSize="5" fill="rgba(255,255,255,0.45)">F{(i+201).toString().padStart(3,'0')}</text>
                </g>
              );
            })}
          </motion.g>
          <motion.line x1="300" y1="0" x2="300" y2="46"
            stroke="#ffba6b" strokeWidth="1.4"
            animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:1, repeat:Infinity }}/>
          <polygon points="296,0 304,0 300,5" fill="#ffba6b"/>
        </g>
      </svg>

      {/* HUD top — pipeline status pill */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{background:'#ffba6b'}}
            animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }} />
          Pipeline · live
        </div>
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white/85">
          24h sprint
        </div>
      </div>

      {/* Output panel */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[200px]">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Output · today</div>
        {[['Frames','1,247','#ffba6b'],['Avg render','0.4s','#9bd4ff'],['Approved','94%','#b8ffc8']].map(([l,v,c]) => (
          <div key={l} className="flex justify-between text-[10px] font-mono mb-1 last:mb-0">
            <span className="text-white/65">{l}</span>
            <span style={{color:c}} className="font-bold">{v}</span>
          </div>
        ))}
      </div>

      {/* Format chips */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl px-4 py-3">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Formats</div>
        <div className="flex gap-1.5">
          {['16:9','9:16','1:1','4:5'].map((f,i) => (
            <div key={f} className="px-2 py-1 rounded text-[10px] font-mono"
              style={{
                background: i===0 ? '#ffba6b' : 'rgba(255,255,255,0.12)',
                color:      i===0 ? '#1a0a36' : 'rgba(255,255,255,0.88)'
              }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ReelSurface = ReelSurface;
