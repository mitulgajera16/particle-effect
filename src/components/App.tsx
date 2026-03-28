import { useState, useCallback } from 'react';
import { useParticleConfig } from '../hooks/useParticleConfig';
import type { ParticleConfig } from '../types';
import { ParticleEngine } from '../engine/particle-engine';
import { Canvas, useResample } from './Canvas';
import { FileUpload } from './FileUpload';
import { ConfigPanel } from './ConfigPanel';
import { PresetPanel } from './PresetPanel';
import { ExportPanel } from './ExportPanel';
import { StatusBar } from './StatusBar';

export default function App() {
  const { config, updateConfig } = useParticleConfig();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [engine, setEngine] = useState<ParticleEngine | null>(null);
  const [fps, setFps] = useState(0);
  const [particleCount, setParticleCount] = useState(0);

  const handleStatsUpdate = useCallback((newFps: number, count: number) => {
    setFps(newFps);
    setParticleCount(count);
  }, []);

  const handleEngineReady = useCallback((eng: ParticleEngine) => {
    setEngine(eng);
  }, []);

  const resample = useResample(engine, image);

  const handleConfigChange = useCallback(
    (updates: Parameters<typeof updateConfig>[0]) => {
      updateConfig(updates);
      engine?.updateConfig(updates);
    },
    [updateConfig, engine]
  );

  const handlePresetLoad = useCallback(
    (presetConfig: ParticleConfig) => {
      updateConfig(presetConfig);
      engine?.updateConfig(presetConfig);
      if (image && engine) {
        engine.resample(image);
      }
    },
    [updateConfig, engine, image]
  );

  const handleGenerateEmbed = useCallback(() => {
    return engine?.generateEmbed() ?? '';
  }, [engine]);

  return (
    <div className="h-dvh flex flex-col lg:flex-row" style={{ background: config.backgroundColor === '#f5f5f5' ? '#e8e8e8' : '#060608' }}>
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col min-h-0 relative" style={{ minHeight: image ? '250px' : undefined }}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingLeft: 'max(1.25rem, env(safe-area-inset-left))', paddingRight: 'max(1.25rem, env(safe-area-inset-right))' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-[0.8125rem] font-bold text-white/70 tracking-tight text-balance">
              Particle<span className="text-white/25 font-medium">FX</span>
            </h1>
            {image && (
              <div className="w-px h-3.5 bg-white/[0.06]" />
            )}
            {image && <StatusBar fps={fps} particleCount={particleCount} />}
          </div>

          {image && (
            <button
              className="text-[0.6875rem] font-medium text-white/20 hover:text-white/50 btn-glass px-3 py-1.5 rounded-md"
              onClick={() => setImage(null)}
            >
              Change Image
            </button>
          )}
        </div>

        {/* Main content */}
        {!image ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            <div className="text-center mb-12 animate-fade-up">
              <h1 className="text-[2.25rem] font-bold tracking-[-0.03em] text-white/90 leading-[1.1] text-balance">
                Image to Particles
              </h1>
              <p className="text-[0.9375rem] text-white/25 mt-3 max-w-[22rem] mx-auto leading-relaxed text-pretty">
                Upload any image. Watch it become thousands of living dots that react to your cursor.
              </p>
            </div>

            <div className="w-full max-w-lg">
              <FileUpload onImageLoaded={setImage} />
            </div>
          </div>
        ) : (
          <Canvas
            image={image}
            onEngineReady={handleEngineReady}
            onStatsUpdate={handleStatsUpdate}
          />
        )}
      </div>

      {/* Sidebar */}
      {image && (
      <div className="w-full max-h-[45vh] lg:max-h-none lg:w-[260px] glass-panel overflow-y-auto flex-shrink-0">
        <div className="px-4 py-3 flex flex-col">
          {/* Presets — top of sidebar, always visible */}
          <PresetPanel
            config={config}
            onLoad={handlePresetLoad}
          />

          {/* Config — collapsible sections */}
          <ConfigPanel
            config={config}
            onChange={handleConfigChange}
            onResample={resample}
          />

          {/* Export */}
          <ExportPanel
            onGenerateEmbed={handleGenerateEmbed}
          />

        </div>
      </div>
      )}
    </div>
  );
}
