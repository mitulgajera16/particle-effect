import { useState } from 'react';

interface ExportPanelProps {
  onGenerateEmbed: () => string;
}

export function ExportPanel({ onGenerateEmbed }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    const code = onGenerateEmbed();
    setEmbedCode(code);
    setShowPreview(true);
  };

  const handleCopy = async () => {
    if (!embedCode) return;
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="section-divider" />

      <button
        className="w-full py-2 text-[0.75rem] font-medium rounded-lg btn-glass text-white/40 hover:text-white/70"
        onClick={handleGenerate}
      >
        <span className="flex items-center justify-center gap-2">
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          Export Embed
        </span>
      </button>

      {showPreview && (
        <div className="animate-fade-up">
          <div className="relative rounded-lg overflow-hidden border border-white/[0.05]">
            <pre className="text-[0.625rem] font-mono text-white/20 bg-white/[0.02] p-2.5 max-h-24 overflow-auto leading-relaxed">
              {embedCode.length > 400 ? embedCode.slice(0, 400) + '\u2026' : embedCode}
            </pre>
            <button
              aria-live="polite"
              className={`absolute top-1.5 right-1.5 px-2 py-0.5 text-[0.625rem] font-medium rounded-md transition-[background-color,border-color,color] duration-150 ${
                copied
                  ? 'bg-emerald-500/15 text-emerald-400/70 border border-emerald-500/20'
                  : 'btn-glass text-white/30'
              }`}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
