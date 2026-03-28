export interface ParticleConfig {
  gap: number;
  particleSize: number;
  particleShape: 'square' | 'circle';
  repulsionRadius: number;
  repulsionStrength: number;
  springStiffness: number;
  friction: number;
  colorMode: 'original' | 'mono';
  monoColor: string;
  backgroundColor: string;
  cornerRadius: number;
  trailEffect: number;
  easeBack: number;
  mouseVelocityInfluence: number;
  objectScale: number;
  ditherEffect: boolean;         // brightness-weighted sampling (stipple/halftone)
  ditherStrength: number;        // 0-1, how aggressively brightness thins particles
  invertColors: boolean;         // invert the colors of the object
  edgeScatter: number;           // 0-1, randomness at shape edges for organic feel
  rippleStrength: number;        // 0-1, intensity of click ripple shockwave
  rippleSpeed: number;           // px per frame wavefront expansion (4–20)
  rippleWidth: number;           // wavefront ring thickness in px (20–100)
  rippleRadius: number;          // max travel distance in px (200–800)
}

export const DEFAULT_CONFIG: ParticleConfig = {
  gap: 8,
  particleSize: 3.5,
  particleShape: 'square',
  repulsionRadius: 50,
  repulsionStrength: 17.5,
  springStiffness: 0.065,
  friction: 0.7,
  colorMode: 'original',
  monoColor: '#ffffff',
  backgroundColor: '#0a0a0a',
  cornerRadius: 56,
  trailEffect: 0.95,
  easeBack: 0.95,
  mouseVelocityInfluence: 1,
  objectScale: 0.5,
  ditherEffect: false,
  ditherStrength: 0.7,
  invertColors: false,
  edgeScatter: 0.25,
  rippleStrength: 0.5,
  rippleSpeed: 6,
  rippleWidth: 100,
  rippleRadius: 475,
};

export interface ParticleData {
  count: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  homeX: Float32Array;
  homeY: Float32Array;
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  a: Float32Array;
}

export interface Renderer {
  init(canvas: HTMLCanvasElement): void;
  render(particles: ParticleData, config: ParticleConfig): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
