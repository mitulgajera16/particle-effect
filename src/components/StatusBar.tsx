interface StatusBarProps {
  fps: number;
  particleCount: number;
}

export function StatusBar({ fps, particleCount }: StatusBarProps) {
  const fpsLevel = fps >= 50 ? 'good' : fps >= 30 ? 'fair' : 'low';
  const fpsColor = fpsLevel === 'good'
    ? 'rgba(52,211,153,0.6)'
    : fpsLevel === 'fair'
    ? 'rgba(251,191,36,0.6)'
    : 'rgba(248,113,113,0.6)';
  const fpsDotClass = fpsLevel === 'good'
    ? 'bg-emerald-400/60'
    : fpsLevel === 'fair'
    ? 'bg-amber-400/60'
    : 'bg-red-400/60';

  return (
    <div className="flex items-center gap-3 font-mono" aria-label="Performance stats">
      <div className="flex items-center gap-1.5">
        <div className="size-1 rounded-full bg-white/15" />
        <span className="text-[10px] text-white/25 tracking-wider uppercase">Particles</span>
        <span className="text-[11px] text-white/50 tabular-nums">{particleCount.toLocaleString()}</span>
      </div>
      <div className="w-px h-3 bg-white/[0.06]" />
      <div className="flex items-center gap-1.5">
        <div className={`size-1.5 rounded-full ${fpsDotClass}`} />
        <span className="text-[11px] tabular-nums" style={{ color: fpsColor }}>
          {fps}
        </span>
        <span className="text-[10px] text-white/25">fps</span>
      </div>
    </div>
  );
}
