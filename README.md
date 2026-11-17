# Alan Alarcón — Portfolio

Personal portfolio of **Alan Alarcón**, AI Solutions Engineer and creative
technologist — connecting AI agents to real business data, with a background in IT
operations and design.

Built with vanilla [Three.js](https://threejs.org/): no frameworks, no build step,
zero dependencies to install.

Live: https://simbolo-dev.github.io/

## What's inside

- **`/` — Hero**: a cinematic, scroll-driven experience in three acts, each with its
  own rigged 3D avatar (a listening character, a climber, and an iron sentinel), a
  custom WebGL shader background that reveals a carved-relief texture around the
  cursor, and an AI-clone chat.
- **`/projects/` — Gallery**: a voice agent for a company ERP (client work), the AI
  voice clone, WhatsApp sales agents (client work), and an explorable low-poly 3D world
  that is still a work in progress and not published yet.

## Tech highlights

- Three.js via ES modules over CDN — no bundler
- Custom GLSL shader background (WebGL1)
- Scroll-driven animation using `position: sticky` + per-frame progress — no scroll libraries
- Rigged GLTF characters with `AnimationMixer`, faded and swapped per act
- Responsive, with a static fallback for mobile and `prefers-reduced-motion`

## Run locally

The project loads ES modules and `.glb` models, so it must be served over `http://`
(opening `index.html` directly as `file://` won't work). Any static server works:

```bash
npx http-server . -p 8080
```

Then open `http://localhost:8080`.
