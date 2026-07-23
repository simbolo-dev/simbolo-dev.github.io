# Alan Alarcón — Portfolio

Personal portfolio of **Alan Alarcón**, creative technologist — working at the
intersection of generative AI, interactive 3D web, and automation.

Built with vanilla [Three.js](https://threejs.org/): no frameworks, no build step,
zero dependencies to install.

<!-- Live: https://<your-username>.github.io/  (fill in once GitHub Pages is enabled) -->

## What's inside

- **`/` — Hero**: a cinematic, scroll-driven experience in three acts, each with its
  own rigged 3D avatar (a listening character, a climber, and an iron sentinel), a
  custom WebGL shader background that reveals a carved-relief texture around the
  cursor, and an AI-clone chat.
- **`/projects/` — Gallery**: an index of projects. More are on the way — the first
  entry (an explorable low-poly 3D world) is a work in progress and not published yet.

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
