import type { ParticleData, ParticleConfig, Renderer } from '../types';

const MAX_CANVAS2D_PARTICLES = 10000;

export class Canvas2DRenderer implements Renderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;

  init(canvas: HTMLCanvasElement): void {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  render(particles: ParticleData, config: ParticleConfig): void {
    const ctx = this.ctx!;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    const { count, x, y, r, g, b, a } = particles;
    const limit = Math.min(count, MAX_CANVAS2D_PARTICLES);
    const step = count > MAX_CANVAS2D_PARTICLES ? Math.ceil(count / MAX_CANVAS2D_PARTICLES) : 1;
    const size = config.particleSize;
    const isCircle = config.particleShape === 'circle';
    const isMono = config.colorMode === 'mono';

    let monoR = 255, monoG = 255, monoB = 255;
    if (isMono) {
      const hex = config.monoColor;
      monoR = parseInt(hex.slice(1, 3), 16);
      monoG = parseInt(hex.slice(3, 5), 16);
      monoB = parseInt(hex.slice(5, 7), 16);
    }

    let drawn = 0;
    for (let i = 0; i < count && drawn < limit; i += step) {
      const cr = isMono ? monoR : Math.round(r[i] * 255);
      const cg = isMono ? monoG : Math.round(g[i] * 255);
      const cb = isMono ? monoB : Math.round(b[i] * 255);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${a[i].toFixed(2)})`;

      if (isCircle) {
        ctx.beginPath();
        ctx.arc(x[i], y[i], size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x[i] - size / 2, y[i] - size / 2, size, size);
      }
      drawn++;
    }

  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  destroy(): void {
    this.ctx = null;
  }
}
