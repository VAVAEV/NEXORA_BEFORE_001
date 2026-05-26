<div align="center">

<img src="assets/logo-white.svg" width="88" alt="Nexora" />

# NEXORA

### A single-page cinematic studio site.

[![▸ LIVE](https://img.shields.io/badge/▸_LIVE_DEMO-nexora--6b0e9.web.app-FF4466?style=for-the-badge)](https://nexora-6b0e9.web.app)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0080?style=flat-square&logo=framer)
![Tailwind](https://img.shields.io/badge/Tailwind-CDN-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Babel](https://img.shields.io/badge/Babel-Standalone-F9DC3E?style=flat-square&logo=babel&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![SVG](https://img.shields.io/badge/SVG-Pure-FF6F61?style=flat-square)
![Canvas](https://img.shields.io/badge/Canvas_2D-Native-9D4EDD?style=flat-square)

<br />

<a href="https://nexora-6b0e9.web.app">
  <img src="https://image.thum.io/get/width/1200/wait/2/https://nexora-6b0e9.web.app" alt="Nexora preview" width="100%" />
</a>

</div>

---

## What you'll see

Seven scroll-driven sections, each with its own interactive language.

| | Section | Highlight |
|---|---|---|
| **01** | **Hero** | Pulsating SVG logo with contour-anchored particle shedding on each heartbeat · pseudo-3D parallax (five stacked SVG layers) reacting to mouse position · gravitational waves rippling through the background dot grid. |
| **02** | **Mission** | Animated counters, Vision 2030 partnership card. Unified glass + sweep entrance, no scroll-tied wobble. |
| **03** | **Services** | Five-row accordion with hover reveal, sliding logo glyph, plus-rotate icon. |
| **04** | **Industries** | Bento grid of 3D-tilted glass cards with morphing dot-grid icons that resolve into the logo on hover. |
| **05** | **Portfolio ×7** | Sticky vertical-scroll → horizontal-track of seven dedicated visualization surfaces (full list below). |
| **06** | **Contact** | Magnetic submit button + glass form on the same design system. |

### Portfolio surfaces

`Datoo` — interactive geo-data map · `ABIR Holdings` — industrial digital twin · `CyberBook` — game companion + cursor sprites · `Myco.OS` — mushroom growth under hover spotlight · `Sidus Heroes` — Web3 planetary system · `City Expo` — buildings growing on hover · `Reel.AI` — AI content pipeline with director's monitor + filmstrip.

---

## Stack notes

| | |
|---|---|
| **No build step** | JSX compiled in-browser by Babel Standalone, scripts loaded directly by `index.html` in dependency order. Zero npm, zero bundler. |
| **Animation** | Framer Motion for declarative entrances · Canvas 2D for the background dot grid + bezier waves · raw `requestAnimationFrame` for the high-frequency stuff (logo heartbeat, mouse-followers, particle bursts). |
| **3D / SVG** | Pseudo-3D logo built from five stacked SVG layers, each rotated by CSS variables written from mouse position. Particles emitted via `path.getPointAtLength` for **true contour-anchored bursts** — not random offsets. |
| **Glass system** | Unified utility classes — `.glass`, `.glass-soft`, `.sweep`, `.lift`, `.nx-glass` — one visual language across every card on the site. |
| **Pixel-perfect grid** | Portfolio first-card left edge is **measured at runtime** from the real `.container` `getBoundingClientRect().left` and written to a CSS variable. Survives scrollbar width, browser zoom, and any `calc()`-with-`min()` quirks. |
| **Hosting** | Firebase Hosting. Single static deploy, no server. |

---

## File map

```
index.html ──► hooks.jsx                  shared bus · intersection · magnetic
              motion-primitives.jsx       FadeIn · RevealText · SectionHead
              glass-nav.jsx               floating nav · logo glyph
              environment.jsx             bg mesh · dots canvas · waves · vignette
              hero.jsx                    hero layout · heartbeat logo · particles
              sections-a.jsx              Marquee · Mission · Services
              sections-b.jsx              Industries bento
              portfolio-surfaces2.jsx     Myco / Sidus / CityExpo surfaces
              portfolio-surfaces3.jsx     Reel.AI surface
              portfolio.jsx               Portfolio + Datoo / ABIR / CyberBook
              app.jsx                     composition root
```

Each portfolio surface uses a smoothed three-tier mouse tracker (`useSurfaceMouse*`): CSS variables on the hot path (60 fps writes, zero React renders), epsilon-throttled React state for layout-driving children, and a `subscribeRaw` channel for direct-DOM cursor-followers.

---

## Note

This site was built with significant AI assistance, iterated against visual feedback over many passes. It's not flawless — but every section runs in production, the architecture is laid out above, and the entry point for any subsystem is one click away in the file map.

Handed over as-is.

---

<div align="center">

**Built by MAX 256.**

</div>
