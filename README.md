# ParticleFX

Interactive particle effect editor — upload any image and watch it dissolve into thousands of particles that react to your cursor with real-time physics.

**[Try it live](https://particle-effect-tool.vercel.app)**

## Inspiration

This project is inspired by [Emil Kowalski's particle effect](https://x.com/emilkowalski/status/2036778116748542220). I loved the original implementation and wanted to recreate it from scratch as an open-source tool that anyone can use, learn from, or build on top of.

## Features

- **WebGL2 instanced rendering** with Canvas2D fallback — no external graphics libraries, pure vanilla shaders
- **Real-time mouse physics** — particles flee from your cursor and spring back with configurable force, friction, and trail effects
- **Click ripple shockwave** — expanding wavefront ring with asymmetric wave profile that pushes particles outward
- **Preset system** — 4 built-in presets (Default, Soft Float, Explosive, Magnetic) + save/load your own via localStorage
- **Full control panel** — 20+ parameters across Sampling, Appearance, Physics, Ripple, Effects, and Color sections
- **Embed code export** — generate a self-contained HTML snippet to embed the effect anywhere
- **100% client-side** — nothing leaves your device, all image processing happens in the browser

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Rendering | Vanilla WebGL2 (instanced) + Canvas2D fallback |
| Physics | Custom spring-mass system with smoothstep falloff |

Zero external graphics dependencies — the entire particle engine, physics simulation, and WebGL renderer are written from scratch.

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/mitulgajera16/particle-effect.git
cd particle-effect

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser, upload an image, and start interacting.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder — deploy it anywhere (Vercel, Netlify, GitHub Pages, etc.).

## Project Structure

```
src/
├── engine/
│   ├── particle-engine.ts    # Core engine — lifecycle, events, animation loop
│   ├── physics.ts            # Spring-mass physics + ripple shockwave system
│   ├── sampler.ts            # Image → particle color/position sampling
│   ├── renderer-webgl.ts     # WebGL2 instanced rendering (GLSL shaders)
│   └── renderer-canvas2d.ts  # Canvas2D fallback renderer
├── components/
│   ├── App.tsx               # Main layout — canvas + sidebar
│   ├── Canvas.tsx            # Canvas container with ResizeObserver
│   ├── ConfigPanel.tsx       # All effect controls (sliders, toggles, pickers)
│   ├── PresetPanel.tsx       # Preset save/load with localStorage
│   ├── ExportPanel.tsx       # Embed code generation
│   ├── FileUpload.tsx        # Drag-and-drop image upload
│   └── StatusBar.tsx         # FPS + particle count display
├── hooks/
│   └── useParticleConfig.ts  # Config state management
└── types.ts                  # TypeScript interfaces + default config
```

## Configuration

Every parameter is exposed in the sidebar. Here are the key ones:

| Parameter | Range | What it does |
|-----------|-------|-------------|
| Density (Gap) | 2–20 | Spacing between particles — lower = more particles |
| Particle Size | 1–8 | Size of each particle |
| Repulsion Radius | 50–400 | How far your cursor pushes particles |
| Repulsion Force | 1–20 | How strongly particles are pushed |
| Snap Back | 0.005–0.15 | Spring stiffness — how fast particles return home |
| Friction | 0.7–0.98 | Velocity damping — higher = more floaty |
| Ripple Strength | 0–1 | Click shockwave intensity |
| Motion Trail | 0–1 | Persistence of particle trails |

## Contributing

Contributions are welcome! Some ideas:

- Additional particle shapes (triangle, star, custom SVG)
- Audio-reactive mode
- Mobile touch gestures (pinch to zoom, multi-finger repulsion)
- More built-in presets
- Performance optimizations for very large images

```bash
# Fork the repo, create a branch, make your changes, then:
npm run build    # Make sure it compiles clean
npm run lint     # Check for lint errors
```

## License

MIT

## Credits

- Original concept by [Emil Kowalski](https://x.com/emilkowalski_)
- Built by [Mitul Gajera](https://github.com/mitulgajera16)
