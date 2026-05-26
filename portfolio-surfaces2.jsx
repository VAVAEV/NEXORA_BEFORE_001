/* global React, motion, useEffect, useRef, useState */
/* Portfolio viz surfaces 004–006 (Myco.OS, Sidus Heroes, City Expo) */

// Magnetic-eased mouse tracker. See portfolio.jsx::useSurfaceMouse for the
// three-tier reactivity model (smoothed CSS vars + raw hover-gated subscribeRaw
// + epsilon-throttled React state). The lerp easing eliminates the visible
// "snap to cursor" jump on mouseenter/leave across every Myco/Sidus/City surface.
function useSurfaceMouse2() {
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
   04 — MushroomSurface · AI Urban Farming
   - 3 vertical grow racks, 3 shelves each
   - Mouse focuses one rack: grow lights flare, mushrooms grow taller
   - Misting droplets, sensor pings, AI data spine
   ═══════════════════════════════════════════════════════════════════════════ */
function MushroomSurface() {
  const [ref, m, , hovered] = useSurfaceMouse2();
  const px = (m.x - 0.5) * 22;
  const py = (m.y - 0.5) * 14;
  // focusRack only "lights up" while the cursor is over the surface. When the
  // mouse leaves, hovered=false → focusRack=-1 and every rack smoothly settles
  // to base. This kills the previous "twitch through middle rack" on mouseleave
  // that came from m snapping to (0.5, 0.5).
  const focusRack = hovered ? Math.min(2, Math.max(0, Math.floor(m.x * 3))) : -1;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background:'linear-gradient(165deg,#0d2e2a 0%,#143632 55%,#091f1c 100%)' }} />
      {/* warm grow-light spotlight under cursor */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(280px 200px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(255,180,90,0.20), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="mshGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="mshCap"><stop offset="0" stopColor="#f7d8b4"/><stop offset="0.55" stopColor="#d8a070"/><stop offset="1" stopColor="#7a4a28"/></radialGradient>
          <linearGradient id="mshStrip" x1="0" x2="1"><stop offset="0" stopColor="rgba(255,180,90,0)"/><stop offset="0.5" stopColor="rgba(255,180,90,0.95)"/><stop offset="1" stopColor="rgba(255,180,90,0)"/></linearGradient>
        </defs>

        {/* faint atmospheric grid */}
        <g opacity="0.06">
          {Array.from({length:10}).map((_,i) => <line key={'h'+i} x1="0" y1={i*36} x2="600" y2={i*36} stroke="#fff"/>)}
        </g>

        {/* drifting spores in the background */}
        <g opacity="0.55" transform={`translate(${px*0.2} ${py*0.2})`}>
          {Array.from({length:18}).map((_,i) => {
            const x = (i*73 + 23) % 600;
            const y0 = (i*97 + 13) % 280 + 30;
            return (
              <motion.circle key={i} cx={x} cy={y0} r="0.9" fill="rgba(180,230,200,0.65)"
                animate={{ cy:[y0, y0-40, y0], cx:[x, x+Math.sin(i)*14, x], opacity:[0.2,0.7,0.2] }}
                transition={{ duration:6+(i%5)*1.2, repeat:Infinity, delay:i*0.4, ease:'easeInOut' }}/>
            );
          })}
        </g>

        {/* 3 racks */}
        {[80, 240, 400].map((rx, ri) => {
          const focused = focusRack === ri;
          const racklog = ['RACK-A · Oyster','RACK-B · Lion\'s Mane','RACK-C · Shiitake'][ri];
          return (
            <g key={ri} transform={`translate(${rx + px*0.4} ${py*0.4})`}>
              {/* uprights */}
              <line x1="0"   y1="50" x2="0"   y2="320" stroke="rgba(255,255,255,0.32)" strokeWidth="2"/>
              <line x1="120" y1="50" x2="120" y2="320" stroke="rgba(255,255,255,0.32)" strokeWidth="2"/>
              {/* rack focus halo */}
              {focused && (
                <motion.rect x="-6" y="44" width="132" height="282" rx="6" fill="rgba(255,180,90,0.06)"
                  stroke="rgba(255,180,90,0.45)" strokeWidth="0.6"
                  initial={{ opacity:0 }} animate={{ opacity:[0.4,0.85,0.4] }}
                  transition={{ duration:1.6, repeat:Infinity }}/>
              )}

              {/* rack label */}
              <text x="60" y="42" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8"
                fill={focused?'#ffc78a':'rgba(255,255,255,0.55)'}>{racklog}</text>

              {/* sensor node at top */}
              <motion.circle cx="60" cy="58" r="3.2" fill={focused?'#ffb866':'#88d8b8'}
                animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:1.5, repeat:Infinity, delay:ri*0.3 }}/>
              <motion.circle cx="60" cy="58" r="6" fill="none"
                stroke={focused?'#ffb866':'#88d8b8'} strokeWidth="0.6"
                animate={{ r:[6,18,6], opacity:[0.55,0,0.55] }}
                transition={{ duration:2, repeat:Infinity, delay:ri*0.3 }}/>

              {/* 3 shelves */}
              {[100, 180, 260].map((sy, si) => (
                <g key={si}>
                  {/* shelf platform */}
                  <rect x="-4" y={sy} width="128" height="6" rx="1.2" fill="rgba(255,255,255,0.20)"/>
                  {/* grow-light strip under shelf */}
                  <motion.rect x="6" y={sy-3.5} width="108" height="2" rx="1"
                    fill={focused ? 'url(#mshStrip)' : 'rgba(255,180,90,0.18)'}
                    animate={focused ? { opacity:[0.65,1,0.65] } : { opacity:0.35 }}
                    transition={{ duration:1.4, repeat:Infinity }}/>
                  {/* substrate block */}
                  <rect x="14" y={sy+6} width="92" height="14" rx="2"
                    fill="rgba(120,75,52,0.55)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5"/>
                  {/* fine substrate flecks */}
                  {Array.from({length:7}).map((_,k) => (
                    <circle key={k} cx={20+k*13} cy={sy+10+(k%3)*2} r="0.6" fill="rgba(255,230,200,0.35)"/>
                  ))}

                  {/* mushrooms — persistent grow on hover, no idle oscillation
                       (previous behavior shrunk them back mid-pulse which felt wrong).
                       Stems get ~2.3× taller, caps ~1.7× bigger when the rack is focused. */}
                  {[22, 40, 58, 76, 96].map((mx, mi) => {
                    const phase = (ri + si + mi) * 0.07;
                    const baseScale = 0.7 + ((mi*73 + si*23)%40)/100;
                    const stemH = focused ? 14 : 6;
                    const capY  = focused ? -16 : -7;
                    const capRx = (focused ? 6.8 : 4) * baseScale;
                    const capRy = (focused ? 5.0 : 3) * baseScale;
                    return (
                      <g key={mi} transform={`translate(${mx} ${sy+6})`}>
                        {/* stem */}
                        <motion.rect x="-1.4" width="2.8" rx="0.8" fill="#f4e6d4"
                          animate={{ y: -stemH, height: stemH }}
                          transition={{ duration: 0.7, delay: phase, ease: [0.22, 1, 0.36, 1] }}/>
                        {/* cap */}
                        <motion.ellipse
                          fill="url(#mshCap)" stroke="rgba(255,255,255,0.20)" strokeWidth="0.4"
                          animate={{ cy: capY, rx: capRx, ry: capRy }}
                          transition={{ duration: 0.7, delay: phase, ease: [0.22, 1, 0.36, 1] }}/>
                        {/* gill hint */}
                        <motion.ellipse cy="-5.5" rx={3*baseScale} ry={baseScale} fill="rgba(120,70,40,0.32)"
                          animate={{ cy: focused ? -14 : -5.5, rx: (focused ? 5.0 : 3) * baseScale, ry: (focused ? 1.6 : 1) * baseScale }}
                          transition={{ duration: 0.7, delay: phase, ease: [0.22, 1, 0.36, 1] }}/>
                      </g>
                    );
                  })}

                  {/* misting drops */}
                  {[18, 44, 76, 100].map((dx, di) => (
                    <motion.circle key={di} cx={dx} cy={sy-1} r="1" fill="rgba(180,230,240,0.7)"
                      animate={{ cy:[sy-1, sy+8], opacity:[0,0.85,0] }}
                      transition={{ duration:1.5+di*0.18, repeat:Infinity, delay:(si*0.4 + di*0.32 + ri*0.22), ease:'easeIn' }}/>
                  ))}

                  {/* shelf readout */}
                  <text x="125" y={sy+13} fontFamily="JetBrains Mono" fontSize="6.5" fill={focused?'#ffd8a8':'rgba(255,255,255,0.5)'}>
                    {[['85%','22°','940'],['82%','21°','910'],['88%','23°','970']][si][0]} · {[['85%','22°','940'],['82%','21°','910'],['88%','23°','970']][si][1]}
                  </text>
                </g>
              ))}

              {/* root mycelium glow at base */}
              <motion.ellipse cx="60" cy="320" rx="56" ry="6"
                fill={focused?'rgba(255,180,90,0.28)':'rgba(120,200,170,0.18)'}
                animate={{ opacity:[0.4,0.85,0.4], rx:[56, 64, 56] }}
                transition={{ duration:2.6, repeat:Infinity, delay:ri*0.4 }}/>
            </g>
          );
        })}

        {/* data spine connecting rack sensors */}
        <g transform={`translate(${px*0.25} ${py*0.25})`}>
          <line x1="140" y1="58" x2="300" y2="58" stroke="rgba(136,216,184,0.32)" strokeWidth="0.6"/>
          <line x1="300" y1="58" x2="460" y2="58" stroke="rgba(136,216,184,0.32)" strokeWidth="0.6"/>
          {[0, 0.33, 0.66].map((off, i) => (
            <motion.circle key={i} r="2" fill="#88d8b8"
              animate={{ cx:[140, 460], cy:58, opacity:[0,1,1,0] }}
              transition={{ duration:3.2, repeat:Infinity, delay:off*3.2, ease:'linear' }}/>
          ))}
        </g>

        {/* CO2 / RH sparkline (bottom band) */}
        <g transform={`translate(${20 + px*0.18} ${320 + py*0.18})`}>
          <path d={`M0 18 ${Array.from({length:36}).map((_,i) => `L${i*16} ${18-Math.sin(i*0.45 + 0.5)*7 + Math.cos(i*0.7)*2}`).join(' ')}`}
            fill="none" stroke="rgba(136,216,184,0.6)" strokeWidth="1"/>
          <path d={`M0 26 ${Array.from({length:36}).map((_,i) => `L${i*16} ${26-Math.sin(i*0.38 + 1.4)*5}`).join(' ')}`}
            fill="none" stroke="rgba(255,180,90,0.55)" strokeWidth="0.8" strokeDasharray="2 2"/>
        </g>
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-300"
            animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }} />
          Cycle 14 · Day 09
        </div>
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white/85">
          AI · auto-tuning
        </div>
      </div>

      {/* AI prediction panel */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[210px]">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">AI predictions</div>
        {[['Next yield','+12%','#88d8b8'],['Harvest in','3.2 d','#ffb866'],['Quality','A+ · 0.94','#a8d8ff']].map(([l,v,c]) => (
          <div key={l} className="flex justify-between text-[10px] font-mono mb-1 last:mb-0">
            <span className="text-white/65">{l}</span>
            <span style={{color:c}} className="font-bold">{v}</span>
          </div>
        ))}
      </div>

      {/* Climate stats */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl px-4 py-3">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Climate</div>
        <div className="flex gap-4">
          {[['85%','RH'],['22°','C'],['940','ppm']].map(([v,l]) => (
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

/* ═══════════════════════════════════════════════════════════════════════════
   05 — SidusSurface · Web3 Metaverse Universe
   - Central token-planet with ring, 3 orbiting product moons
   - Cinematic starfield (3 parallax layers), nebulae, shooting star
   - Mouse tilts the entire cosmic plane in pseudo-3D
   - Wireframe avatar in foreground, live TX feed + TVL panel
   ═══════════════════════════════════════════════════════════════════════════ */
function SidusSurface() {
  const [ref, m] = useSurfaceMouse2();
  const tx = (m.x - 0.5) * 22;
  const ty = (m.y - 0.5) * 14;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background:'radial-gradient(circle at 50% 58%, #2a1858 0%, #14082e 50%, #08021a 100%)' }} />
      {/* mouse aurora */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(280px 200px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(190,110,255,0.22), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="sGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="sPlanet" cx="0.4" cy="0.4">
            <stop offset="0" stopColor="#ff9bdf"/><stop offset="0.5" stopColor="#9b5fff"/><stop offset="1" stopColor="#3a1882"/>
          </radialGradient>
          <radialGradient id="sMoonA"><stop offset="0" stopColor="#a8f0ff"/><stop offset="1" stopColor="#2060c8"/></radialGradient>
          <radialGradient id="sMoonB"><stop offset="0" stopColor="#ffe2a0"/><stop offset="1" stopColor="#c87830"/></radialGradient>
          <radialGradient id="sMoonC"><stop offset="0" stopColor="#bdffb0"/><stop offset="1" stopColor="#308a48"/></radialGradient>
        </defs>

        {/* 3-layer parallax starfield */}
        <g transform={`translate(${tx*0.15} ${ty*0.15})`} opacity="0.6">
          {Array.from({length:55}).map((_,i) => {
            const x = (i*97 + 13) % 600;
            const y = (i*131 + 23) % 360;
            const r = (i%5===0) ? 1.4 : 0.7;
            return <motion.circle key={i} cx={x} cy={y} r={r} fill="#fff"
              animate={{ opacity:[0.2,0.95,0.2] }}
              transition={{ duration:1.5+(i%4)*0.6, repeat:Infinity, delay:i*0.08 }}/>;
          })}
        </g>
        <g transform={`translate(${tx*0.4} ${ty*0.4})`} opacity="0.35">
          {Array.from({length:28}).map((_,i) => {
            const x = (i*157 + 41) % 600;
            const y = (i*89 + 17) % 360;
            return <circle key={i} cx={x} cy={y} r="0.7" fill="#c8b8ff"/>;
          })}
        </g>
        <g transform={`translate(${tx*0.65} ${ty*0.65})`} opacity="0.5">
          {Array.from({length:12}).map((_,i) => {
            const x = (i*211 + 67) % 600;
            const y = (i*47 + 31) % 360;
            return <motion.circle key={i} cx={x} cy={y} r="1.6" fill="#ffd0ff"
              animate={{ opacity:[0.4,1,0.4] }}
              transition={{ duration:1.2, repeat:Infinity, delay:i*0.21 }}/>;
          })}
        </g>

        {/* nebulae */}
        <g transform={`translate(${tx*0.3} ${ty*0.3})`} opacity="0.45">
          <ellipse cx="110" cy="290" rx="92" ry="36" fill="rgba(180,90,255,0.28)" filter="url(#sGlow)"/>
          <ellipse cx="495" cy="78"  rx="108" ry="40" fill="rgba(80,180,255,0.22)" filter="url(#sGlow)"/>
        </g>

        {/* central token-planet — shifted West (x=300→210) so the orbital
            system stops being clipped/covered by the top-right TVL panel. */}
        <g transform={`translate(${210+tx*0.5} ${180+ty*0.5})`}>
          {/* outer dashed orbit (decorative) */}
          <ellipse cx="0" cy="0" rx="118" ry="26" fill="none"
            stroke="rgba(255,180,255,0.22)" strokeWidth="0.6" strokeDasharray="3 4"
            transform={`rotate(${-15 + ty*0.4})`}/>
          {/* ring */}
          <ellipse cx="0" cy="0" rx="105" ry="22" fill="none"
            stroke="rgba(255,180,255,0.5)" strokeWidth="1.5"
            transform={`rotate(${-15 + ty*0.4})`}/>
          <ellipse cx="0" cy="0" rx="92"  ry="18" fill="none"
            stroke="rgba(255,210,140,0.35)" strokeWidth="0.8"
            transform={`rotate(${-15 + ty*0.4})`}/>

          {/* planet */}
          <circle r="48" fill="url(#sPlanet)" filter="url(#sGlow)"/>
          <circle r="48" fill="none" stroke="rgba(255,180,255,0.65)" strokeWidth="1"/>
          {/* surface latitudes */}
          <ellipse cy="-7" rx="44" ry="6" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.6"/>
          <ellipse cy="10"  rx="46" ry="9" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5"/>
          {/* highlight */}
          <ellipse cx="-16" cy="-18" rx="13" ry="6" fill="rgba(255,255,255,0.28)"/>
          {/* central $ glyph */}
          <motion.text textAnchor="middle" y="8" fontFamily="JetBrains Mono" fontWeight="bold" fontSize="22"
            fill="rgba(255,255,255,0.92)"
            animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:2, repeat:Infinity }}>$</motion.text>
        </g>

        {/* 3 orbiting moons */}
        {[
          { rx:108, ry:22, dur:14, off:0.0,  grad:'sMoonA', label:'Game',     col:'#a8f0ff' },
          { rx:148, ry:34, dur:22, off:0.33, grad:'sMoonB', label:'Market',   col:'#ffe2a0' },
          { rx:185, ry:46, dur:34, off:0.66, grad:'sMoonC', label:'DAO Hub',  col:'#bdffb0' },
        ].map((orb, oi) => (
          <g key={oi} transform={`translate(${210+tx*0.3} ${180+ty*0.3})`}>
            <ellipse cx="0" cy="0" rx={orb.rx} ry={orb.ry} fill="none"
              stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" strokeDasharray="2 4"
              transform={`rotate(${-15 + ty*0.4})`}/>
            <motion.g
              animate={{ rotate:[0, 360] }}
              transition={{ duration:orb.dur, repeat:Infinity, ease:'linear', delay:-orb.dur*orb.off }}
              transform-origin="0 0">
              <g transform={`rotate(${-15 + ty*0.4}) translate(${orb.rx} 0) rotate(${15 - ty*0.4})`}>
                <circle r="8.5" fill={`url(#${orb.grad})`}/>
                <circle r="8.5" fill="none" stroke={orb.col} strokeWidth="0.6" opacity="0.7"/>
                <motion.circle r="13" fill="none" stroke={orb.col} strokeWidth="0.6"
                  animate={{ r:[13,22,13], opacity:[0.6,0,0.6] }}
                  transition={{ duration:2, repeat:Infinity, delay:oi*0.4 }}/>
                <text y="-14" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7.5" fill={orb.col}>{orb.label}</text>
              </g>
            </motion.g>
          </g>
        ))}

        {/* token squares orbiting fast in inner ring */}
        <g filter="url(#sGlow)">
          {[0, 0.25, 0.5, 0.75].map((off, i) => (
            <motion.g key={i} transform={`translate(${210+tx*0.3} ${180+ty*0.3})`}
              animate={{ rotate:[0, 360] }}
              transition={{ duration:7, repeat:Infinity, ease:'linear', delay:-7*off }}>
              <g transform={`rotate(${-15 + ty*0.4}) translate(76 0)`}>
                <rect x="-2.6" y="-2.6" width="5.2" height="5.2" fill="#ffd060" transform="rotate(45)"/>
              </g>
            </motion.g>
          ))}
        </g>

        {/* foreground wireframe avatar */}
        <g transform={`translate(${82+tx*0.7} ${262+ty*0.55})`}>
          <ellipse cx="0" cy="62" rx="24" ry="4" fill="rgba(180,90,255,0.45)" filter="url(#sGlow)"/>
          {/* head */}
          <circle cx="0" cy="0" r="9" fill="rgba(20,8,50,0.85)" stroke="#c89bff" strokeWidth="1"/>
          {/* visor */}
          <rect x="-7" y="-3" width="14" height="3.2" fill="#c89bff"/>
          <motion.rect x="-7" y="-3" width="14" height="3.2" fill="rgba(255,255,255,0.45)"
            animate={{ opacity:[0,0.8,0] }} transition={{ duration:2.4, repeat:Infinity }}/>
          {/* body wireframe */}
          <path d="M-10 12 L0 8 L10 12 L8 40 L-8 40 Z" fill="rgba(40,20,80,0.5)" stroke="#c89bff" strokeWidth="1"/>
          <line x1="-10" y1="12" x2="-18" y2="32" stroke="#c89bff" strokeWidth="1"/>
          <line x1="10"  y1="12" x2="18"  y2="32" stroke="#c89bff" strokeWidth="1"/>
          <line x1="-8"  y1="40" x2="-12" y2="60" stroke="#c89bff" strokeWidth="1"/>
          <line x1="8"   y1="40" x2="12"  y2="60" stroke="#c89bff" strokeWidth="1"/>
          {/* floating drone */}
          <motion.g animate={{ y:[-18,-24,-18] }} transition={{ duration:2.4, repeat:Infinity, ease:'easeInOut' }}>
            <circle cy="-18" r="4" fill="#ffd060" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
            <motion.circle cy="-18" r="7" fill="none" stroke="#ffd060" strokeWidth="0.5"
              animate={{ r:[7,12,7], opacity:[0.7,0,0.7] }} transition={{ duration:1.6, repeat:Infinity }}/>
          </motion.g>
        </g>

        {/* HUD scan lines from planet to corners */}
        <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" strokeDasharray="2 3">
          <line x1={210+tx*0.3} y1={180+ty*0.3} x2="540" y2="62"/>
          <line x1={210+tx*0.3} y1={180+ty*0.3} x2="540" y2="320"/>
          <line x1={210+tx*0.3} y1={180+ty*0.3} x2="60"  y2="84"/>
        </g>

        {/* periodic shooting star */}
        <motion.line x1="-50" y1="40" x2="-10" y2="60"
          stroke="rgba(255,255,255,0.85)" strokeWidth="1" strokeLinecap="round"
          animate={{ x1:[-50,650], x2:[-10,690], opacity:[0,1,0] }}
          transition={{ duration:1.6, repeat:Infinity, repeatDelay:5, ease:'easeIn' }}/>
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background:'#ff9bdf' }}
            animate={{ scale:[1,1.5,1], opacity:[0.7,1,0.7] }} transition={{ duration:1.4, repeat:Infinity }}/>
          On-chain · live
        </div>
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white/85">
          $SIDUS · 0.418 <span style={{color:'#bdffb0'}}>▲</span>
        </div>
      </div>

      {/* TVL panel */}
      <div className="absolute top-14 right-4 nx-glass rounded-2xl px-3 py-2 w-[152px] pointer-events-none">
        <div className="text-[9px] font-mono text-white/55 uppercase tracking-wider">TVL · 24h</div>
        <motion.div className="text-[16px] font-extrabold text-white font-mono"
          animate={{ opacity:[0.85,1,0.85] }} transition={{ duration:1.8, repeat:Infinity }}>$84.2M</motion.div>
        <div className="text-[9px] font-mono text-[#bdffb0]">+6.2%</div>
      </div>

      {/* Worlds panel */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[220px]">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Worlds · online</div>
        {[['Hero Arena','42 PvP','#a8f0ff'],['Marketplace','3.4k items','#ffe2a0'],['DAO Hub','12 votes','#bdffb0']].map(([w,v,c]) => (
          <div key={w} className="flex justify-between items-center text-[10px] font-mono mb-1 last:mb-0">
            <span className="text-white/75 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{background:c}}/>{w}
            </span>
            <span style={{color:c}}>{v}</span>
          </div>
        ))}
      </div>

      {/* TX feed */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl px-3 py-2.5 w-[185px]">
        <div className="text-[9px] font-mono text-white/55 uppercase tracking-wider mb-1.5">Tx · live</div>
        <div className="text-[10px] font-mono text-white/75 space-y-0.5">
          {['0xa4f8 · mint  +500','0xb9c1 · swap  ⇄ 1.2k','0xc18e · stake +250'].map((t,i) => (
            <motion.div key={t}
              initial={{opacity:0, x:-8}}
              animate={{opacity:[0,1,1,0], x:[-8,0,0,8]}}
              transition={{ duration:3.6, repeat:Infinity, delay:i*1.2 }}>{t}</motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   06 — CityExpoSurface · Browser 3D Expo
   - Isometric expo plaza, 8 pavilion buildings with lit windows
   - Central stage with concentric broadcast pulses + speaker silhouette
   - Visitor dots walking 3 lanes, airship drifting overhead
   - Mouse tilts iso ground & rooftops in pseudo-3D
   ═══════════════════════════════════════════════════════════════════════════ */
function CityExpoSurface() {
  const [ref, m, subscribeRaw, hovered] = useSurfaceMouse2();
  const tx = (m.x - 0.5) * 28;
  const ty = (m.y - 0.5) * 16;

  const buildings = React.useMemo(() => [
    {x:122, y:184, w:50, h:72, c:'#8aa8ff', name:'TECH'},
    {x:198, y:206, w:44, h:54, c:'#ffb866', name:'ARTS'},
    {x:265, y:172, w:56, h:88, c:'#a8ff9b', name:'BIO'},
    {x:348, y:198, w:50, h:62, c:'#ff8acf', name:'GAME'},
    {x:420, y:218, w:48, h:48, c:'#80e0ff', name:'EDU'},
    {x:78,  y:222, w:46, h:46, c:'#d8a0ff', name:'FOOD'},
    {x:162, y:264, w:42, h:34, c:'#ffdc6a', name:'MUSIC'},
    {x:336, y:268, w:46, h:40, c:'#9bffd8', name:'KIDS'},
  ], []);

  // Cursor-hovered building detection runs at full 60fps via subscribeRaw while
  // the cursor is over the surface, and is force-cleared the moment the cursor
  // leaves (otherwise the last-hovered building would stay grown after exit).
  const hoveredRef = useRef(-1);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  useEffect(() => {
    if (!hovered && hoveredRef.current !== -1) {
      hoveredRef.current = -1;
      setHoveredIdx(-1);
    }
  }, [hovered]);
  useEffect(() => subscribeRaw((x, y) => {
    const cx = x * 600 - (x - 0.5) * 28 * 0.4;
    const cy = y * 360 - (y - 0.5) * 16 * 0.4;
    let idx = -1;
    for (let i = buildings.length - 1; i >= 0; i--) {
      const b = buildings[i];
      if (cx >= b.x - 4 && cx <= b.x + b.w + 22 &&
          cy >= b.y - 22 && cy <= b.y + b.h + 4) { idx = i; break; }
    }
    if (idx !== hoveredRef.current) {
      hoveredRef.current = idx;
      setHoveredIdx(idx);
    }
  }), [subscribeRaw, buildings]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background:'linear-gradient(165deg,#1c3878 0%,#0f2056 50%,#080f30 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(280px 200px at var(--smx-pct, 50%) var(--smy-pct, 50%), rgba(255,200,90,0.18), transparent 65%)',
      }} />

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="cGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="bldgFace" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.28)"/>
            <stop offset="1" stopColor="rgba(255,255,255,0.08)"/>
          </linearGradient>
        </defs>

        {/* Sky stars (twinkly) */}
        <g opacity="0.55" transform={`translate(${tx*0.18} ${ty*0.18})`}>
          {Array.from({length:30}).map((_,i) => {
            const x = (i*73 + 19) % 600;
            const y = (i*53 + 11) % 110;
            return <motion.circle key={i} cx={x} cy={y} r={i%5===0?1.2:0.7} fill="#fff"
              animate={{ opacity:[0.2,0.95,0.2] }}
              transition={{ duration:2+(i%3)*0.7, repeat:Infinity, delay:i*0.13 }}/>;
          })}
        </g>

        {/* moon */}
        <g transform={`translate(${500+tx*0.2} ${70+ty*0.2})`}>
          <circle r="20" fill="rgba(255,240,210,0.85)" filter="url(#cGlow)"/>
          <circle r="20" fill="none" stroke="rgba(255,240,210,0.45)" strokeWidth="0.5"/>
          <circle cx="-6" cy="-3" r="3" fill="rgba(220,210,180,0.55)"/>
          <circle cx="5"  cy="6"  r="2" fill="rgba(220,210,180,0.45)"/>
        </g>

        {/* isometric ground grid */}
        <g transform={`translate(300 250) skewX(-30) scale(1 0.55) translate(-180 -100)`}>
          <g transform={`translate(${tx*0.25} ${ty*0.25})`}>
            {Array.from({length:11}).map((_,i) => (
              <line key={'gh'+i} x1="0" y1={i*36} x2="360" y2={i*36} stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>
            ))}
            {Array.from({length:11}).map((_,i) => (
              <line key={'gv'+i} x1={i*36} y1="0" x2={i*36} y2="360" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>
            ))}
            {/* glowing plaza tile */}
            <motion.rect x="144" y="144" width="72" height="72"
              fill="rgba(255,200,90,0.18)" stroke="rgba(255,200,90,0.55)" strokeWidth="0.8"
              animate={{ opacity:[0.5,0.95,0.5] }} transition={{ duration:2.5, repeat:Infinity }}/>
          </g>
        </g>

        {/* connection paths between pavilions and stage (dashed, animated) */}
        <g stroke="rgba(255,200,90,0.45)" strokeWidth="0.7" strokeDasharray="3 4" fill="none">
          {buildings.slice(0,5).map((b,i) => (
            <motion.line key={i}
              x1={300+tx*0.4} y1={250+ty*0.4}
              x2={b.x + b.w/2 + tx*0.4} y2={b.y + b.h*0.3 + ty*0.4}
              animate={{ strokeDashoffset:[0,-21] }}
              transition={{ duration:1+i*0.18, repeat:Infinity, ease:'linear' }}/>
          ))}
        </g>

        {/* Buildings — iso-projected boxes. Each one is wrapped in a motion.g
            anchored at its ground line (transformOrigin = base center) and
            scales Y up to ~1.55× when the cursor is over it — visually "growing
            several floors" with the windows stretching with it. */}
        <g transform={`translate(${tx*0.4} ${ty*0.4})`}>
          {buildings.map((b, bi) => {
            const { x, y, w, h, c, name } = b;
            const d = 18;
            const isHover = hoveredIdx === bi;
            const grow = isHover ? 1.55 : 1;
            return (
              <motion.g
                key={bi}
                style={{ transformOrigin: `${x + w/2}px ${y + h}px`, transformBox: 'view-box' }}
                animate={{ scaleY: grow }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* right shadowed side */}
                <polygon points={`${x+w},${y} ${x+w+d},${y-d*0.5} ${x+w+d},${y+h-d*0.5} ${x+w},${y+h}`}
                  fill="rgba(0,0,0,0.34)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/>
                {/* roof */}
                <polygon points={`${x},${y} ${x+w},${y} ${x+w+d},${y-d*0.5} ${x+d},${y-d*0.5}`}
                  fill={c} fillOpacity={isHover ? 0.9 : 0.58} stroke={isHover ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.32)'} strokeWidth="0.5"/>
                {/* front face */}
                <rect x={x} y={y} width={w} height={h} fill="url(#bldgFace)"
                  stroke={isHover ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.30)'} strokeWidth={isHover ? 0.9 : 0.5}/>
                {/* windows grid */}
                {Array.from({length:Math.floor(h/12)}).map((_,r) =>
                  Array.from({length:Math.floor(w/12)}).map((_,col) => {
                    const lit = ((r*7 + col*3 + bi*5) % 4) !== 0;
                    return <motion.rect key={`${r}-${col}`}
                      x={x+4+col*12} y={y+6+r*12} width="6" height="6"
                      fill={lit ? c : 'rgba(18,12,46,0.7)'}
                      animate={lit ? { opacity: isHover ? [0.7,1,0.7] : [0.45,1,0.45] } : { opacity: isHover ? 0.5 : 0.25 }}
                      transition={{ duration:1.6+(r+col)*0.18, repeat:Infinity, delay:(r+col+bi)*0.13 }}/>;
                  })
                )}
                {/* roof antenna for first 3 */}
                {bi < 3 && (
                  <g>
                    <line x1={x+w/2+d/2} y1={y-d*0.5} x2={x+w/2+d/2} y2={y-d*0.5-12} stroke={c} strokeWidth="0.8"/>
                    <motion.circle cx={x+w/2+d/2} cy={y-d*0.5-13} r="1.6" fill={c}
                      animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.2, repeat:Infinity, delay:bi*0.4 }}/>
                  </g>
                )}
                {/* label */}
                <text x={x + w/2} y={y - d*0.5 - 4} textAnchor="middle"
                  fontFamily="JetBrains Mono" fontSize="6.8" fill={isHover ? '#fff' : 'rgba(255,255,255,0.75)'}>{name}</text>
              </motion.g>
            );
          })}

          {/* Central stage */}
          <g transform="translate(300 250)">
            {/* broadcast ripples */}
            {[0,1,2].map(i => (
              <motion.ellipse key={i} cx="0" cy="0" rx="36" ry="14" fill="none"
                stroke="rgba(255,200,90,0.7)" strokeWidth="1"
                animate={{ rx:[36, 110], ry:[14, 42], opacity:[0.75,0] }}
                transition={{ duration:3, repeat:Infinity, delay:i*1, ease:'easeOut' }}/>
            ))}
            {/* stage disc */}
            <ellipse cx="0" cy="0" rx="36" ry="14" fill="rgba(255,200,90,0.28)" stroke="rgba(255,200,90,0.75)" strokeWidth="1"/>
            <ellipse cx="0" cy="-3" rx="32" ry="10" fill="rgba(255,200,90,0.18)"/>
            {/* speaker silhouette */}
            <rect x="-3.2" y="-22" width="6.4" height="20" rx="1.2" fill="rgba(255,255,255,0.78)"/>
            <circle cx="0" cy="-28" r="5" fill="rgba(255,200,90,0.92)"/>
            <line x1="5" y1="-22" x2="10" y2="-26" stroke="rgba(255,255,255,0.78)" strokeWidth="1"/>
            <circle cx="11" cy="-27" r="1.5" fill="rgba(255,255,255,0.85)"/>
            {/* spotlight beam */}
            <motion.polygon points="0,-32 -36,-58 36,-58"
              fill="rgba(255,200,90,0.18)"
              animate={{ opacity:[0.25,0.6,0.25] }} transition={{ duration:2, repeat:Infinity }}/>
            {/* tiny audience dots ring */}
            {[-50,-30,-10,10,30,50].map((dx,i) => (
              <motion.circle key={i} cx={dx} cy="6" r="1.6" fill="rgba(255,255,255,0.7)"
                animate={{ cy:[6,3,6] }} transition={{ duration:1.4+i*0.15, repeat:Infinity, delay:i*0.12 }}/>
            ))}
          </g>
        </g>

        {/* walking visitors — 3 lanes */}
        <g>
          {Array.from({length:22}).map((_,i) => {
            const lane = i % 3;
            const phase = (i / 22);
            const lanes = [
              { y: 305, c:'#80e0ff', x1: 30,  x2: 570, dur: 14 },
              { y: 245, c:'#ffd28a', x1: 570, x2: 30,  dur: 18 },
              { y: 330, c:'#a8ff9b', x1: 30,  x2: 570, dur: 22 },
            ];
            const ln = lanes[lane];
            return (
              <motion.g key={i}
                animate={{ x:[ln.x1, ln.x2] }}
                transition={{ duration:ln.dur, repeat:Infinity, delay:-ln.dur*phase, ease:'linear' }}>
                <circle cx="0" cy={ln.y} r="1.8" fill={ln.c}/>
                <motion.circle cx="0" cy={ln.y+4} r="2" fill={ln.c} opacity="0.18"
                  animate={{ opacity:[0.3,0.1,0.3] }} transition={{ duration:0.4, repeat:Infinity }}/>
              </motion.g>
            );
          })}
        </g>

        {/* airship drifting across sky */}
        <motion.g animate={{ x:[-60, 640] }} transition={{ duration:32, repeat:Infinity, ease:'linear' }}>
          <g transform="translate(0 80)">
            <ellipse cx="0" cy="0" rx="20" ry="7" fill="rgba(255,140,180,0.6)" stroke="rgba(255,200,255,0.7)" strokeWidth="0.5"/>
            <ellipse cx="0" cy="-1" rx="14" ry="3" fill="rgba(255,255,255,0.4)"/>
            <line x1="-5" y1="7" x2="-5" y2="13" stroke="rgba(255,200,255,0.7)" strokeWidth="0.5"/>
            <line x1="5"  y1="7" x2="5"  y2="13" stroke="rgba(255,200,255,0.7)" strokeWidth="0.5"/>
            <rect x="-8" y="13" width="16" height="5" rx="1" fill="rgba(255,200,255,0.55)"/>
            <motion.circle cx="-4" cy="16" r="0.8" fill="#ffd060"
              animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:0.8, repeat:Infinity }}/>
            <motion.circle cx="4"  cy="16" r="0.8" fill="#ffd060"
              animate={{ opacity:[1,0.4,1] }} transition={{ duration:0.8, repeat:Infinity }}/>
          </g>
        </motion.g>

        {/* floating reward coins above pavilions */}
        {[[150,150],[290,140],[400,150],[200,120]].map(([cx,cy],i) => (
          <motion.g key={i} transform={`translate(${cx+tx*0.3} ${cy+ty*0.3})`}
            animate={{ y:[0,-6,0] }} transition={{ duration:1.8+i*0.3, repeat:Infinity, ease:'easeInOut' }}>
            <motion.ellipse cy="0" ry="4" rx="4" fill="#ffd060" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4"
              animate={{ rx:[4,1,4] }} transition={{ duration:1.4, repeat:Infinity, delay:i*0.25 }}/>
            <motion.circle cy="0" r="9" fill="none" stroke="rgba(255,208,96,0.4)" strokeWidth="0.5"
              animate={{ r:[9,16,9], opacity:[0.5,0,0.5] }} transition={{ duration:1.8, repeat:Infinity, delay:i*0.25 }}/>
          </motion.g>
        ))}
      </svg>

      {/* HUD top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-red-400"
            animate={{ opacity:[1,0.25,1] }} transition={{ duration:0.9, repeat:Infinity }} />
          ● LIVE · Main Stage
        </div>
        <div className="inline-flex items-center gap-2 nx-glass nx-pill px-3 py-1.5 text-[11px] font-mono text-white/85">
          ◉ 8,492 online
        </div>
      </div>

      {/* Leaderboard panel */}
      <div className="absolute bottom-4 left-4 nx-glass rounded-2xl p-3 w-[200px]">
        <div className="text-[9px] font-mono text-white/60 uppercase tracking-wider mb-2">Top players · pts</div>
        {[['Nina_94', '4,820', '#ffd28a', false],['Akira', '4,612', '#80e0ff', false],['You', '4,218', '#a8ff9b', true]].map(([n,v,c,me],i) => (
          <div key={n} className="flex justify-between items-center text-[10px] font-mono mb-1 last:mb-0">
            <span className="text-white/75">{i+1}. {n}</span>
            <motion.span style={{color:c, fontWeight: me?700:500}}
              animate={me?{ opacity:[0.7,1,0.7] }:{}}
              transition={{ duration:1.4, repeat:Infinity }}>{v}</motion.span>
          </div>
        ))}
      </div>

      {/* Next-on-stage panel */}
      <div className="absolute bottom-4 right-4 nx-glass rounded-2xl px-4 py-3 w-[185px]">
        <div className="text-[9px] font-mono text-white/55 uppercase tracking-wider mb-1.5">Next on stage</div>
        <div className="text-[12.5px] text-white font-medium leading-tight">Keynote · Smart City</div>
        <motion.div className="text-[10px] font-mono text-[#ffd28a] mt-1"
          animate={{ opacity:[0.65,1,0.65] }} transition={{ duration:1.2, repeat:Infinity }}>in 04:21</motion.div>
      </div>
    </div>
  );
}

Object.assign(window, { MushroomSurface, SidusSurface, CityExpoSurface });
