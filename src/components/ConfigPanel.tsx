import { useState } from 'react';
import type { ParticleConfig } from '../types';
import type { ReactNode } from 'react';

interface ConfigPanelProps {
  config: ParticleConfig;
  onChange: (updates: Partial<ParticleConfig>) => void;
  onResample: () => void;
}

/* ─── Collapsible section ─── */

function Section({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        className="flex items-center gap-2.5 pt-5 pb-2 min-h-[36px] group cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <svg
          aria-hidden="true"
          className={`w-2.5 h-2.5 text-white/15 group-hover:text-white/30 transition-[transform,color] duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/35 group-hover:text-white/55 transition-colors duration-150">
          {label}
        </span>
        <div className="flex-1 h-px bg-white/[0.04] group-hover:bg-white/[0.07] transition-[background-color] duration-150" />
      </button>
      <div className="section-content" data-collapsed={!open}>
        <div>
          <div className="flex flex-col gap-3 pb-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Controls ─── */

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[0.75rem] text-white/45 font-medium leading-none">{label}</span>
        <span className="text-[0.625rem] font-mono text-white/20 tabular-nums leading-none">{value}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.75rem] text-white/45 font-medium leading-none">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            aria-pressed={value === opt}
            className={`flex-1 min-h-[36px] py-1.5 text-[0.6875rem] font-medium rounded-md transition-[background-color,border-color,color] duration-150 ${
              value === opt
                ? 'btn-glass-active'
                : 'btn-glass text-white/30'
            }`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.75rem] text-white/45 font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative w-9 h-[22px] rounded-full transition-colors duration-150 ${
          checked ? 'bg-white/20' : 'bg-white/[0.06]'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-[4px] left-[4px] w-3.5 h-3.5 rounded-full transition-transform duration-150 ${
            checked ? 'translate-x-[14px] bg-white/80' : 'translate-x-0 bg-white/25'
          }`}
        />
      </button>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.75rem] text-white/45 font-medium">{label}</span>
      <div className="relative">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 rounded-md border border-white/10 bg-transparent cursor-pointer opacity-0 absolute inset-0"
        />
        <div
          className="size-8 rounded-md border border-white/[0.08] pointer-events-none"
          style={{ background: value }}
        />
      </div>
    </div>
  );
}

/* ─── Main panel ─── */

export function ConfigPanel({ config, onChange, onResample }: ConfigPanelProps) {
  return (
    <div className="flex flex-col">
      {/* Sampling — always visible, core controls */}
      <Section label="Sampling" defaultOpen={true}>
        <Slider
          label="Density"
          value={config.gap}
          min={1}
          max={8}
          step={1}
          onChange={(v) => { onChange({ gap: v }); onResample(); }}
        />
        <Slider
          label="Image Scale"
          value={config.objectScale}
          min={0.2}
          max={2}
          step={0.05}
          onChange={(v) => { onChange({ objectScale: v }); onResample(); }}
        />
      </Section>

      <Section label="Appearance" defaultOpen={true}>
        <Slider
          label="Particle Size"
          value={config.particleSize}
          min={1}
          max={8}
          step={0.5}
          onChange={(v) => onChange({ particleSize: v })}
        />
        <ToggleGroup
          label="Shape"
          options={['square', 'circle'] as const}
          value={config.particleShape}
          onChange={(v) => onChange({ particleShape: v })}
        />
        {config.particleShape === 'square' && (
          <Slider
            label="Corner Radius"
            value={config.cornerRadius}
            min={0}
            max={100}
            step={1}
            onChange={(v) => { onChange({ cornerRadius: v }); onResample(); }}
          />
        )}
      </Section>

      <Section label="Physics" defaultOpen={true}>
        <Slider
          label="Repulsion Radius"
          value={config.repulsionRadius}
          min={50}
          max={400}
          step={10}
          onChange={(v) => onChange({ repulsionRadius: v })}
        />
        <Slider
          label="Repulsion Force"
          value={config.repulsionStrength}
          min={1}
          max={20}
          step={0.5}
          onChange={(v) => onChange({ repulsionStrength: v })}
        />
        <Slider
          label="Snap Back"
          value={config.springStiffness}
          min={0.005}
          max={0.15}
          step={0.005}
          onChange={(v) => onChange({ springStiffness: v })}
        />
        <Slider
          label="Friction"
          value={config.friction}
          min={0.7}
          max={0.98}
          step={0.01}
          onChange={(v) => onChange({ friction: v })}
        />
        <Slider
          label="Motion Trail"
          value={config.trailEffect}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ trailEffect: v })}
        />
        <Slider
          label="Return Speed"
          value={config.easeBack}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ easeBack: v })}
        />
        <Slider
          label="Cursor Effect"
          value={config.mouseVelocityInfluence}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ mouseVelocityInfluence: v })}
        />
      </Section>

      <Section label="Ripple" defaultOpen={false}>
        <Slider
          label="Strength"
          value={config.rippleStrength}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ rippleStrength: v })}
        />
        <Slider
          label="Speed"
          value={config.rippleSpeed}
          min={4}
          max={20}
          step={1}
          onChange={(v) => onChange({ rippleSpeed: v })}
        />
        <Slider
          label="Ring Width"
          value={config.rippleWidth}
          min={20}
          max={100}
          step={5}
          onChange={(v) => onChange({ rippleWidth: v })}
        />
        <Slider
          label="Radius"
          value={config.rippleRadius}
          min={200}
          max={800}
          step={25}
          onChange={(v) => onChange({ rippleRadius: v })}
        />
      </Section>

      <Section label="Effects" defaultOpen={false}>
        <Toggle
          label="Dither Effect"
          checked={config.ditherEffect}
          onChange={(v) => { onChange({ ditherEffect: v }); onResample(); }}
        />
        {config.ditherEffect && (
          <Slider
            label="Noise Amount"
            value={config.ditherStrength}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => { onChange({ ditherStrength: v }); onResample(); }}
          />
        )}
        <Toggle
          label="Invert Colors"
          checked={config.invertColors}
          onChange={(v) => {
            const updates: Partial<ParticleConfig> = { invertColors: v };
            if (v && config.backgroundColor === '#0a0a0a') {
              updates.backgroundColor = '#f5f5f5';
            } else if (!v && config.backgroundColor === '#f5f5f5') {
              updates.backgroundColor = '#0a0a0a';
            }
            onChange(updates);
            onResample();
          }}
        />
        <Slider
          label="Edge Softness"
          value={config.edgeScatter}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => { onChange({ edgeScatter: v }); onResample(); }}
        />
      </Section>

      <Section label="Color" defaultOpen={false}>
        <ToggleGroup
          label="Mode"
          options={['original', 'mono'] as const}
          value={config.colorMode}
          onChange={(v) => onChange({ colorMode: v })}
        />
        {config.colorMode === 'mono' && (
          <ColorPicker
            label="Particle Color"
            value={config.monoColor}
            onChange={(v) => onChange({ monoColor: v })}
          />
        )}
        <ColorPicker
          label="Background"
          value={config.backgroundColor}
          onChange={(v) => onChange({ backgroundColor: v })}
        />
      </Section>
    </div>
  );
}
