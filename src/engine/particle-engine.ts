import { type ParticleConfig, type ParticleData, type Renderer, DEFAULT_CONFIG } from '../types';
import { sampleImage } from './sampler';
import { updatePhysics, createMouseState, updateMouseState, addRipple, type MouseState } from './physics';
import { WebGLRenderer } from './renderer-webgl';
import { Canvas2DRenderer } from './renderer-canvas2d';

export class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private particles: ParticleData | null = null;
  private config: ParticleConfig = { ...DEFAULT_CONFIG };
  private animationId = 0;
  private mouse: MouseState;
  private running = false;
  private abortController = new AbortController();
  private fps = 0;
  private frameCount = 0;
  private lastFpsTime = 0;
  private onStatsUpdate: ((fps: number, count: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.mouse = createMouseState();

    // Try WebGL2, fall back to Canvas2D
    let renderer: Renderer;
    try {
      renderer = new WebGLRenderer();
      renderer.init(canvas);
    } catch {
      renderer = new Canvas2DRenderer();
      renderer.init(canvas);
    }
    this.renderer = renderer;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = this.canvas;
    const signal = this.abortController.signal;

    const getPos = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      addRipple(pos.x, pos.y, {
        strength: this.config.rippleStrength,
        speed: this.config.rippleSpeed,
        width: this.config.rippleWidth,
        radius: this.config.rippleRadius,
      });
    }, { signal });

    canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      updateMouseState(this.mouse, pos.x, pos.y, true);
    }, { signal });

    canvas.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    }, { signal });

    canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const pos = getPos(touch);
      addRipple(pos.x, pos.y, {
        strength: this.config.rippleStrength,
        speed: this.config.rippleSpeed,
        width: this.config.rippleWidth,
        radius: this.config.rippleRadius,
      });
    }, { passive: true, signal } as AddEventListenerOptions);

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getPos(touch);
      updateMouseState(this.mouse, pos.x, pos.y, true);
    }, { passive: false, signal } as AddEventListenerOptions);

    canvas.addEventListener('touchend', () => {
      this.mouse.active = false;
    }, { signal });
  }

  loadImage(image: HTMLImageElement): void {
    this.particles = sampleImage(image, this.config.gap, this.canvas.width, this.canvas.height, this.config.objectScale, this.config);
    if (!this.running) {
      this.start();
    }
  }

  resample(image: HTMLImageElement): void {
    this.particles = sampleImage(image, this.config.gap, this.canvas.width, this.canvas.height, this.config.objectScale, this.config);
  }

  updateConfig(config: Partial<ParticleConfig>): void {
    Object.assign(this.config, config);
  }

  getConfig(): ParticleConfig {
    return { ...this.config };
  }

  setStatsCallback(cb: (fps: number, count: number) => void): void {
    this.onStatsUpdate = cb;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.resize(width, height);
  }

  private start(): void {
    this.running = true;
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    this.loop();
  }

  private loop = (): void => {
    if (!this.running) return;

    if (this.particles) {
      updatePhysics(this.particles, this.mouse, this.config);
      this.renderer.render(this.particles, this.config);
    }

    // FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.onStatsUpdate?.(this.fps, this.particles?.count ?? 0);
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.abortController.abort();
    this.renderer.destroy();
  }

  getParticleCount(): number {
    return this.particles?.count ?? 0;
  }

  getFps(): number {
    return this.fps;
  }

  generateEmbed(): string {
    if (!this.particles) return '';

    const { count, homeX, homeY, r, g, b, a } = this.particles;
    const config = this.config;

    const particleArray: number[][] = [];
    for (let i = 0; i < count; i++) {
      particleArray.push([
        Math.round(homeX[i]),
        Math.round(homeY[i]),
        Math.round(r[i] * 255),
        Math.round(g[i] * 255),
        Math.round(b[i] * 255),
        Math.round(a[i] * 255),
      ]);
    }

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body{background:${config.backgroundColor};overflow:hidden}canvas{display:block}</style>
</head><body><canvas id="c"></canvas>
<script>
(function(){
var P=${JSON.stringify(particleArray)};
var cfg=${JSON.stringify({
      particleSize: config.particleSize,
      particleShape: config.particleShape,
      repulsionRadius: config.repulsionRadius,
      repulsionStrength: config.repulsionStrength,
      springStiffness: config.springStiffness,
      friction: config.friction,
      colorMode: config.colorMode,
      monoColor: config.monoColor,
      backgroundColor: config.backgroundColor,
    })};
var c=document.getElementById('c'),ctx=c.getContext('2d');
c.width=window.innerWidth;c.height=window.innerHeight;
var n=P.length,x=new Float32Array(n),y=new Float32Array(n),vx=new Float32Array(n),vy=new Float32Array(n),
hx=new Float32Array(n),hy=new Float32Array(n),cr=new Float32Array(n),cg=new Float32Array(n),cb=new Float32Array(n),ca=new Float32Array(n);
var ox=(c.width-Math.max.apply(null,P.map(function(p){return p[0];})))/2;
var oy=(c.height-Math.max.apply(null,P.map(function(p){return p[1];})))/2;
for(var i=0;i<n;i++){x[i]=hx[i]=P[i][0]+ox;y[i]=hy[i]=P[i][1]+oy;cr[i]=P[i][2]/255;cg[i]=P[i][3]/255;cb[i]=P[i][4]/255;ca[i]=P[i][5]/255;}
var mx=0,my=0,pmx=0,pmy=0,mvx=0,mvy=0,ma=false;
c.addEventListener('mousemove',function(e){pmx=mx;pmy=my;mx=e.clientX;my=e.clientY;mvx=mvx*0.7+(mx-pmx)*0.3;mvy=mvy*0.7+(my-pmy)*0.3;ma=true;});
c.addEventListener('mouseleave',function(){ma=false;});
c.addEventListener('touchmove',function(e){e.preventDefault();pmx=mx;pmy=my;mx=e.touches[0].clientX;my=e.touches[0].clientY;mvx=mvx*0.7+(mx-pmx)*0.3;mvy=mvy*0.7+(my-pmy)*0.3;ma=true;},{passive:false});
c.addEventListener('touchend',function(){ma=false;});
function loop(){
var rr=cfg.repulsionRadius,rs=cfg.repulsionStrength,ss=cfg.springStiffness,fr=cfg.friction,rr2=rr*rr;
for(var i=0;i<n;i++){
if(ma){var dx=x[i]-mx,dy=y[i]-my,d2=dx*dx+dy*dy;
if(d2<rr2&&d2>0.5){var d=Math.sqrt(d2),nd=d/rr,fo=1-nd*nd*nd,f=fo*rs;vx[i]+=dx/d*f+mvx*fo*0.15;vy[i]+=dy/d*f+mvy*fo*0.15;}}
vx[i]+=(hx[i]-x[i])*ss;vy[i]+=(hy[i]-y[i])*ss;vx[i]*=fr;vy[i]*=fr;x[i]+=vx[i];y[i]+=vy[i];}
ctx.fillStyle=cfg.backgroundColor;ctx.fillRect(0,0,c.width,c.height);
var sz=cfg.particleSize,circ=cfg.particleShape==='circle';
for(var i=0;i<n;i++){
ctx.fillStyle='rgba('+Math.round(cr[i]*255)+','+Math.round(cg[i]*255)+','+Math.round(cb[i]*255)+','+ca[i]+')';
if(circ){ctx.beginPath();ctx.arc(x[i],y[i],sz/2,0,6.28);ctx.fill();}
else{ctx.fillRect(x[i]-sz/2,y[i]-sz/2,sz,sz);}}
requestAnimationFrame(loop);}
loop();
})();
<\/script></body></html>`;
  }
}
