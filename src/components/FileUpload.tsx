import { useCallback, useRef, useState } from 'react';

interface FileUploadProps {
  onImageLoaded: (image: HTMLImageElement) => void;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export function FileUpload({ onImageLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Unsupported format. Use PNG, JPG, SVG, or WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => onImageLoaded(img);
      img.onerror = () => setError('Failed to load image.');
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-up">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image file — click or drag and drop"
        className={`relative group flex flex-col items-center justify-center w-full max-w-md rounded-2xl p-14 cursor-pointer transition-[transform,background-color,border-color] duration-200 ${
          isDragging ? 'scale-[0.98]' : ''
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        style={{
          background: isDragging
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.02)',
          border: '1.5px solid',
          borderColor: isDragging
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(255,255,255,0.06)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={handleChange}
        />

        {/* Icon */}
        <div className={`mb-8 p-5 rounded-2xl transition-[transform,background-color] duration-200 ${
          isDragging ? 'bg-white/10 scale-105' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
        }`}>
          <svg aria-hidden="true" className={`w-8 h-8 transition-colors duration-200 ${isDragging ? 'text-white/80' : 'text-white/25 group-hover:text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>

        {/* Text */}
        <p className="text-[1rem] text-white/60 font-medium tracking-tight text-pretty">
          Drop your image here
        </p>
        <p className="text-[0.8125rem] text-white/25 mt-2 text-pretty">
          or <span className="text-white/45 underline underline-offset-2 decoration-white/15 group-hover:text-white/70 transition-colors duration-150">browse files</span>
        </p>

        {/* Format tags */}
        <div className="flex gap-2 mt-6">
          {['PNG', 'JPG', 'SVG', 'WebP'].map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 text-[0.625rem] font-mono font-medium tracking-wider text-white/25 bg-white/[0.02] rounded-md border border-white/[0.06]">
              {fmt}
            </span>
          ))}
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="text-[0.75rem] text-red-400/80 mt-5 animate-fade-up">{error}</p>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-[0.6875rem] text-white/15 mt-5 tracking-wide animate-fade-up-delay-1 text-pretty">
        Max 10MB &middot; Processed locally &middot; Nothing leaves your device
      </p>
    </div>
  );
}
