import { useState } from 'react';
import type { ParticleConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';

const STORAGE_KEY = 'particlefx-presets';

export interface Preset {
  name: string;
  config: ParticleConfig;
  createdAt: number;
}

const BUILT_IN_PRESETS: Preset[] = [
  {
    name: 'Default',
    config: { ...DEFAULT_CONFIG },
    createdAt: 0,
  },
  {
    name: 'Soft Float',
    config: {
      ...DEFAULT_CONFIG,
      repulsionRadius: 180,
      repulsionStrength: 3,
      springStiffness: 0.008,
      friction: 0.95,
      trailEffect: 0.8,
      easeBack: 0.9,
      mouseVelocityInfluence: 0.4,
      rippleStrength: 0.4,
      rippleSpeed: 6,
      rippleWidth: 80,
      rippleRadius: 600,
    },
    createdAt: 0,
  },
  {
    name: 'Explosive',
    config: {
      ...DEFAULT_CONFIG,
      repulsionRadius: 250,
      repulsionStrength: 15,
      springStiffness: 0.025,
      friction: 0.85,
      trailEffect: 0.9,
      easeBack: 0.3,
      mouseVelocityInfluence: 1,
      rippleStrength: 1,
      rippleSpeed: 18,
      rippleWidth: 40,
      rippleRadius: 700,
    },
    createdAt: 0,
  },
  {
    name: 'Magnetic',
    config: {
      ...DEFAULT_CONFIG,
      repulsionRadius: 120,
      repulsionStrength: 8,
      springStiffness: 0.04,
      friction: 0.88,
      trailEffect: 0.3,
      easeBack: 0.7,
      mouseVelocityInfluence: 0.9,
      rippleStrength: 0.6,
      rippleSpeed: 14,
      rippleWidth: 35,
      rippleRadius: 400,
    },
    createdAt: 0,
  },
];

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

interface PresetPanelProps {
  config: ParticleConfig;
  onLoad: (config: ParticleConfig) => void;
}

export function PresetPanel({ config, onLoad }: PresetPanelProps) {
  const [userPresets, setUserPresets] = useState<Preset[]>(loadPresets);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const allPresets = [...BUILT_IN_PRESETS, ...userPresets];

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;

    const newPreset: Preset = {
      name,
      config: { ...config },
      createdAt: Date.now(),
    };

    const updated = userPresets.filter((p) => p.name !== name);
    updated.push(newPreset);
    setUserPresets(updated);
    savePresets(updated);
    setSaveName('');
    setShowSaveInput(false);
    setActivePreset(name);
  };

  const handleLoad = (preset: Preset) => {
    setActivePreset(preset.name);
    onLoad({ ...preset.config });
  };

  const handleDelete = (name: string) => {
    const updated = userPresets.filter((p) => p.name !== name);
    setUserPresets(updated);
    savePresets(updated);
    if (activePreset === name) setActivePreset(null);
  };

  const isBuiltIn = (name: string) => BUILT_IN_PRESETS.some((p) => p.name === name);

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1">
        {allPresets.map((preset) => (
          <div key={preset.name} className="group relative">
            <button
              className={`px-2.5 py-1.5 min-h-[32px] text-[0.6875rem] font-medium rounded-md transition-[background-color,border-color,color] duration-150 ${
                activePreset === preset.name
                  ? 'btn-glass-active'
                  : 'btn-glass text-white/30 hover:text-white/50'
              }`}
              onClick={() => handleLoad(preset)}
            >
              {preset.name}
            </button>
            {!isBuiltIn(preset.name) && (
              <button
                className="absolute -top-1 -right-1 size-3.5 rounded-full bg-white/10 hover:bg-red-500/40 text-white/30 hover:text-white/70 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(preset.name);
                }}
                aria-label={`Delete preset ${preset.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Save control */}
      {showSaveInput ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setShowSaveInput(false); setSaveName(''); }
            }}
            placeholder="Name..."
            autoFocus
            className="flex-1 min-w-0 px-2.5 py-1.5 text-[0.6875rem] font-medium rounded-md bg-white/[0.04] border border-white/[0.08] text-white/60 placeholder:text-white/15 outline-none focus:border-white/15 transition-[border-color] duration-150"
          />
          <button
            className="px-2.5 py-1.5 text-[0.6875rem] font-medium rounded-md btn-glass text-white/40 hover:text-white/70 disabled:opacity-25 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!saveName.trim()}
          >
            Save
          </button>
        </div>
      ) : (
        <button
          className="w-full py-1.5 text-[0.6875rem] font-medium rounded-md btn-glass text-white/25 hover:text-white/50"
          onClick={() => setShowSaveInput(true)}
        >
          + Save preset
        </button>
      )}
    </div>
  );
}
