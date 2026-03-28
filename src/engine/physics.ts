import type { ParticleData, ParticleConfig } from '../types';

// Ripple: click-triggered expanding shockwave
export interface Ripple {
  x: number;
  y: number;
  startTime: number;
  speed: number;      // px per frame the wavefront expands
  strength: number;   // initial impulse force
  width: number;      // thickness of the wavefront ring
  maxRadius: number;  // how far the ripple travels before dying
}

const MAX_RIPPLES = 5;
const activeRipples: Ripple[] = [];

export interface RippleConfig {
  strength: number;   // 0-1 intensity multiplier
  speed: number;      // px per frame expansion
  width: number;      // ring thickness px
  radius: number;     // max travel distance px
}

export function addRipple(x: number, y: number, cfg?: Partial<RippleConfig>): void {
  const strength = cfg?.strength ?? 0.8;
  if (strength <= 0) return; // ripple disabled
  const speed = cfg?.speed ?? 12;
  const width = cfg?.width ?? 55;
  const radius = cfg?.radius ?? 500;

  activeRipples.push({
    x, y,
    startTime: 0, // frame counter, advanced each physics tick
    speed,
    strength: 4 + strength * 16,  // 4–20 force (much stronger range)
    width,
    maxRadius: radius,
  });
  // cap active ripples
  if (activeRipples.length > MAX_RIPPLES) {
    activeRipples.shift();
  }
}

// Mouse state with velocity tracking
export interface MouseState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  speed: number;
  active: boolean;
}

export function createMouseState(): MouseState {
  return { x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, speed: 0, active: false };
}

export function updateMouseState(state: MouseState, x: number, y: number, active: boolean): void {
  state.prevX = state.x;
  state.prevY = state.y;
  state.x = x;
  state.y = y;
  state.active = active;

  if (active) {
    const rawVx = x - state.prevX;
    const rawVy = y - state.prevY;
    // Heavier smoothing for premium, fluid feel (ease-out style)
    state.vx = state.vx * 0.75 + rawVx * 0.25;
    state.vy = state.vy * 0.75 + rawVy * 0.25;
    state.speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
  } else {
    // Gradual decay when mouse leaves — particles settle smoothly
    state.vx *= 0.92;
    state.vy *= 0.92;
    state.speed *= 0.92;
  }
}

// Smooth per-particle spatial noise (slow-varying, not per-frame jitter)
// Uses particle index as seed for a stable offset direction
function particleNoise(i: number): [number, number] {
  // Deterministic angle per particle — never changes, creates natural variation
  const a = ((i * 2654435761) >>> 0) / 4294967296; // 0..1
  const angle = a * Math.PI * 2;
  return [Math.cos(angle), Math.sin(angle)];
}

export function updatePhysics(
  particles: ParticleData,
  mouse: MouseState,
  config: ParticleConfig
): void {
  const { count, x, y, vx, vy, homeX, homeY } = particles;
  const {
    repulsionRadius,
    repulsionStrength,
    springStiffness,
    friction,
    trailEffect,
    easeBack,
    mouseVelocityInfluence,
  } = config;

  // Mouse velocity dynamically scales radius and strength
  const speedFactor = 1 + mouse.speed * mouseVelocityInfluence * 0.06;
  const effectiveRadius = repulsionRadius * speedFactor;
  const effectiveStrength = repulsionStrength * (1 + mouse.speed * mouseVelocityInfluence * 0.03);
  const radiusSq = effectiveRadius * effectiveRadius;

  // Vortex: perpendicular force direction from mouse velocity
  const mouseSpd = mouse.speed + 0.001;
  const mvNx = mouse.vx / mouseSpd;
  const mvNy = mouse.vy / mouseSpd;
  const perpX = -mvNy;
  const perpY = mvNx;

  // Trail offset for secondary repulsion
  const trailOffsetX = -mouse.vx * trailEffect * 3.5;
  const trailOffsetY = -mouse.vy * trailEffect * 3.5;

  // Easing spring — ease-out curve for smooth deceleration near home
  const springBase = springStiffness * (1 - easeBack * 0.6);

  for (let i = 0; i < count; i++) {
    // --- Mouse Repulsion with vortex + organic variation ---
    if (mouse.active || mouse.speed > 0.3) {
      const dx = x[i] - mouse.x;
      const dy = y[i] - mouse.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < radiusSq && distSq > 0.5) {
        const dist = Math.sqrt(distSq);
        const normalDist = dist / effectiveRadius;

        // Smooth quintic ease-out falloff — premium, buttery feel
        // f(t) = 1 - t^3 * (6t^2 - 15t + 10) simplified to smooth cubic
        const t = normalDist;
        const falloff = 1 - t * t * (3 - 2 * t); // smoothstep

        const force = falloff * effectiveStrength;

        const nx = dx / dist;
        const ny = dy / dist;

        // Radial push
        vx[i] += nx * force;
        vy[i] += ny * force;

        // Vortex swirl — smooth rotation based on mouse velocity
        const vortexStrength = mouse.speed * mouseVelocityInfluence * falloff * 0.3;
        const cross = dx * mvNy - dy * mvNx;
        const swirlSign = cross > 0 ? 1 : -1;
        vx[i] += perpX * vortexStrength * swirlSign;
        vy[i] += perpY * vortexStrength * swirlSign;

        // Per-particle organic variation — stable direction, NOT jittery per-frame noise
        // Each particle has a fixed bias angle, creating natural edge irregularity
        const [noiseNx, noiseNy] = particleNoise(i);
        const organicAmount = falloff * effectiveStrength * 0.12;
        vx[i] += noiseNx * organicAmount;
        vy[i] += noiseNy * organicAmount;

        // Mouse velocity drag (push particles in cursor direction)
        vx[i] += mouse.vx * trailEffect * falloff * 0.4;
        vy[i] += mouse.vy * trailEffect * falloff * 0.4;
      }

      // Secondary trail repulsion (creates wake behind cursor)
      if (trailEffect > 0.1) {
        const tdx = x[i] - (mouse.x + trailOffsetX);
        const tdy = y[i] - (mouse.y + trailOffsetY);
        const tdistSq = tdx * tdx + tdy * tdy;
        const trailRadius = effectiveRadius * 0.65;
        const trailRadiusSq = trailRadius * trailRadius;

        if (tdistSq < trailRadiusSq && tdistSq > 0.5) {
          const tdist = Math.sqrt(tdistSq);
          const tnorm = tdist / trailRadius;
          const t2 = tnorm;
          const tfalloff = (1 - t2 * t2 * (3 - 2 * t2)) * trailEffect * 0.5;
          const tforce = tfalloff * effectiveStrength * 0.4;

          vx[i] += (tdx / tdist) * tforce;
          vy[i] += (tdy / tdist) * tforce;

          // Trail vortex
          const tvortex = mouse.speed * mouseVelocityInfluence * tfalloff * 0.15;
          const tcross = tdx * mvNy - tdy * mvNx;
          const tsign = tcross > 0 ? 1 : -1;
          vx[i] += perpX * tvortex * tsign;
          vy[i] += perpY * tvortex * tsign;
        }
      }
    }

    // --- Ripple / Shockwave forces ---
    for (let r = activeRipples.length - 1; r >= 0; r--) {
      const ripple = activeRipples[r];
      const currentRadius = ripple.speed * ripple.startTime;
      if (currentRadius < 1) continue; // skip first frame

      const rdx = x[i] - ripple.x;
      const rdy = y[i] - ripple.y;
      const rDistSq = rdx * rdx + rdy * rdy;
      const rDist = Math.sqrt(rDistSq);
      if (rDist < 0.5) continue;

      // Wavefront ring boundaries
      const halfW = ripple.width * 0.5;
      const innerEdge = currentRadius - halfW;
      const outerEdge = currentRadius + halfW;

      if (rDist > Math.max(0, innerEdge) && rDist < outerEdge) {
        // Position within ring: -1 (trailing/inner) → 0 (center) → +1 (leading/outer)
        const ringPos = (rDist - currentRadius) / halfW;

        // Asymmetric wave profile — mimics natural water ripple:
        //   Leading edge (ringPos > 0): strong outward push
        //   Trailing edge (ringPos < 0): gentle inward pull
        // Uses shifted sine wave for smooth asymmetric shape
        const waveProfile = Math.cos(ringPos * Math.PI * 0.8) * (ringPos > 0 ? 1.0 : -0.25);

        // Smooth age decay — cubic ease-out for graceful fade
        const ageRatio = currentRadius / ripple.maxRadius;
        const t = 1 - ageRatio;
        const ageFalloff = t * t * t; // cubic decay — strong start, gentle fade

        const force = ripple.strength * waveProfile * ageFalloff;

        const rnx = rdx / rDist;
        const rny = rdy / rDist;
        vx[i] += rnx * force;
        vy[i] += rny * force;
      }
    }

    // --- Spring Return with ease-out curve ---
    const hx = homeX[i] - x[i];
    const hy = homeY[i] - y[i];
    const homeDistSq = hx * hx + hy * hy;

    if (homeDistSq > 0.0001) {
      const homeDist = Math.sqrt(homeDistSq);
      // Ease-out spring: stronger pull when far, gentle near home
      // This creates the smooth deceleration feel (like ease-out-quint)
      const distRatio = Math.min(homeDist / 60, 1);
      const easeFactor = easeBack > 0
        ? springBase + (springStiffness - springBase) * distRatio
        : springStiffness;

      vx[i] += hx * easeFactor;
      vy[i] += hy * easeFactor;
    }

    // --- Friction damping ---
    vx[i] *= friction;
    vy[i] *= friction;

    // --- Integrate position ---
    x[i] += vx[i];
    y[i] += vy[i];
  }

  // --- Advance and cull ripples ---
  for (let r = activeRipples.length - 1; r >= 0; r--) {
    activeRipples[r].startTime++;
    if (activeRipples[r].speed * activeRipples[r].startTime > activeRipples[r].maxRadius) {
      activeRipples.splice(r, 1);
    }
  }
}
