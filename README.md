<div align="center">

<img src="assets/logo-white.svg" width="88" alt="Nexora" />

# NEXORA

### Одностраничник студии. Семь миров за один скролл. Кинематика, понты, частицы.

<sub><i>A single-page cinematic studio site. Seven worlds in one scroll.</i></sub>

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

## Overview

NEXORA is a cinematic one-page studio website focused on motion, interaction, and visual storytelling.

The project is built around seven sections with distinct behavior:

- **Hero.** Pulsing logo, contour-anchored particle bursts via `path.getPointAtLength()`, and pseudo-3D depth from stacked SVG layers.
- **Mission.** Glass mission panel with animated counters and cleaner scroll behavior.
- **Services.** Five-lane accordion with hover-driven expansion and icon transitions.
- **Industries.** Bento grid with 3D tilt and dot icons morphing into the brand mark.
- **Portfolio ×7.** Sticky viewport where vertical scroll maps to a horizontal case track.
- **Contact.** Form section with magnetic CTA behavior.

The goal is simple: keep it expressive, responsive, and memorable.

> **RU:** NEXORA — это кинематографичный одностраничный сайт студии с фокусом на движение, интерактив и сильную визуальную подачу. Семь секций работают как единая история: от heartbeat-hero и morph-анимаций до горизонтального portfolio-трека и магнитной контактной зоны.

---

## Stack

| | |
|---|---|
| **Runtime JSX** | Babel Standalone compiles JSX in-browser. React 18 and Framer Motion 11 are loaded from CDN. |
| **Styling** | Tailwind CDN + `styles.css` utility layer (`.glass`, `.glass-soft`, `.sweep`, `.lift`, `.nx-glass`) for a unified visual language. |
| **Animation** | Framer Motion for declarative transitions, Canvas 2D for ambient effects, and raw `requestAnimationFrame` loops for high-frequency interactions. |
| **3D / SVG approach** | Pseudo-3D depth from multi-layer SVG stacks controlled by CSS variables (`--orb-rx`, `--orb-ry`). |
| **Precision layout** | Portfolio track alignment is measured at runtime via `getBoundingClientRect()` to avoid viewport/scrollbar drift. |
| **Hosting** | Firebase Hosting (static deploy). |

> **RU:** Без сборщика и серверной части: сайт работает как чистая статика, где React/Framer подключены через CDN, а ключевая динамика реализована через Framer Motion, Canvas 2D и `requestAnimationFrame`.

---

## Карта файлов

```
index.html ─► hooks.jsx                  общий анимационный бас, intersection, magnetic
             motion-primitives.jsx       FadeIn, RevealText, SectionHead
             glass-nav.jsx               навигация, логотип-глиф
             environment.jsx             фон, dot-grid canvas, волны, виньетка
             hero.jsx                    верхний экран, сердцебиение, частицы, 3D-стек
             sections-a.jsx              маркее, миссия, услуги
             sections-b.jsx              индастрис бенто, контактная форма
             portfolio-surfaces2.jsx     Myco / Sidus / CityExpo surfaces
             portfolio-surfaces3.jsx     Reel.AI surface
             portfolio.jsx               Portfolio + Datoo / ABIR / CyberBook
             app.jsx                     склейка всего
```

Каждая portfolio-surface обрабатывает курсор через **трёхуровневый `useSurfaceMouse*`**:

1. **CSS variables** на hot path для стабильных 60 fps без лишних React renders.
2. **React state + epsilon-throttle** для тяжёлых SVG-узлов (обновление только при заметном смещении мыши).
3. **`subscribeRaw` channel** для прямого DOM-апдейта спрайтов и cursor-followers.

Эта схема разделяет высокочастотные визуальные апдейты и более тяжёлые layout-driven состояния, что помогает сохранить плавность на сложных сценах.

> **EN:** Each portfolio surface uses a 3-tier pointer pipeline: CSS vars for hot updates, epsilon-throttled React state for heavier children, and a `subscribeRaw` channel for direct DOM transforms. This separation keeps interactions smooth under load.

---

## Notes

This repository intentionally prioritizes visual impact and iteration speed:

- fast-to-edit file structure
- explicit interaction logic
- static hosting pipeline through Firebase
- no hidden backend dependencies

Planned next steps:

- migrate to bundler-based build pipeline
- add linting and automated formatting
- split large surfaces into smaller composable modules
- improve accessibility and motion-reduction fallbacks

> **RU:** Проект уже работает в проде и удобен для быстрых визуальных итераций. Дальнейший шаг — перейти к более строгому production-контуру (сборка, линтинг, модульность, a11y).

---

<div align="center">

**Built by MAX 256**

<sub>Crafting cinematic web experiences.</sub>

</div>
