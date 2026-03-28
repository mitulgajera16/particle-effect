import { useEffect, useRef, useCallback, useState } from 'react';
import { ParticleEngine } from '../engine/particle-engine';

interface CanvasProps {
  image: HTMLImageElement | null;
  onEngineReady: (engine: ParticleEngine) => void;
  onStatsUpdate: (fps: number, count: number) => void;
}

export function Canvas({ image, onEngineReady, onStatsUpdate }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Key forces fresh canvas DOM element on StrictMode remount
  const [canvasKey, setCanvasKey] = useState(0);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      engineRef.current?.resize(canvas.width, canvas.height);
    };

    resize();

    let engine: ParticleEngine;
    try {
      engine = new ParticleEngine(canvas);
    } catch {
      // WebGL context lost (StrictMode double-mount) — force new canvas
      setCanvasKey((k) => k + 1);
      return;
    }

    engine.setStatsCallback(onStatsUpdate);
    engineRef.current = engine;
    onEngineReady(engine);

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasKey]);

  // Load image when it changes
  useEffect(() => {
    if (image && engineRef.current) {
      engineRef.current.loadImage(image);
    }
  }, [image, canvasKey]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 relative w-full h-full">
      <canvas
        key={canvasKey}
        ref={canvasRef}
        role="img"
        aria-label="Particle effect visualization — move your cursor to interact"
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />
    </div>
  );
}

export function useResample(engine: ParticleEngine | null, image: HTMLImageElement | null) {
  return useCallback(() => {
    if (engine && image) {
      engine.resample(image);
    }
  }, [engine, image]);
}
