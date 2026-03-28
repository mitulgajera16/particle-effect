# ParticleFX

Interactive particle effect editor — upload images and watch them become interactive particle systems with mouse-driven physics.

## Tech Stack
- React 19 + TypeScript
- Vite 8 (dev + build)
- Tailwind CSS v4
- WebGL2 instanced rendering (Canvas2D fallback)

## Architecture
- `src/engine/` — particle engine, physics, sampler, WebGL/Canvas2D renderers
- `src/components/` — React UI: App, Canvas, ConfigPanel, FileUpload, ExportPanel, StatusBar
- `src/hooks/` — useParticleConfig state hook
- `src/types.ts` — ParticleConfig, ParticleData, Renderer interfaces

## Commands
- `npm run dev` — start dev server (port 5173)
- `npm run build` — type-check + production build

## Recent Changes (UI/UX Audit — 2026-03-28)

### Accessibility
- FileUpload: added `role="button"`, `tabIndex`, `aria-label`, keyboard handler (`Enter`/`Space`)
- FileUpload: error messages now use `aria-live="assertive"`
- Canvas: added `role="img"` and `aria-label`
- ConfigPanel: all range inputs have `aria-label`, toggles use `role="switch"` + `aria-checked`, toggle groups use `aria-pressed`, color pickers have `aria-label`
- ExportPanel: decorative SVGs have `aria-hidden`, copy button uses `aria-live="polite"`
- StatusBar: extracted FPS color logic to single variable (removes color-only indicator duplication)

### Performance
- Google Fonts: moved from CSS `@import` to HTML `<link>` with `preconnect` (eliminates render-blocking chain)
- Glass panel: `backdrop-filter: blur(40px)` reduced to `blur(16px)`, added `isolation: isolate`
- Canvas: removed duplicate config sync `useEffect` (was calling `updateConfig` twice per change)
- Removed `config` prop from Canvas component (no longer needed)

### Baseline UI Compliance
- `100vh` / `h-screen` replaced with `100dvh` / `h-dvh` everywhere
- All gradients removed (section dividers, range sliders, ambient glows)
- `transition: all` replaced with explicit property lists
- `fadeUp` animation: `500ms` reduced to `220ms`
- `text-balance` added to headings, `text-pretty` to body paragraphs
- `viewport-fit=cover` added to HTML meta for safe-area-inset support
- Safe-area-inset padding applied to top bar via `env()`
- `size-*` used for square elements (color picker swatches, status dots)

### Code Cleanup
- Removed dead `resetConfig` from `useParticleConfig` hook
- Removed `hasImage` prop from ConfigPanel and ExportPanel (always true inside guard)
- Removed dead `!hasImage` empty state block from ConfigPanel
- Removed stale `// New` comment from types.ts
- Removed dead CSS keyframes: `borderRotate`, `@property --angle`, `subtlePulse`, `shimmer`
- Fixed embed code truncation (always showed `...` even for short code)
- Added `<meta name="description">` to index.html
