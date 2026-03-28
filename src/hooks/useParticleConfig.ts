import { useState, useCallback } from 'react';
import { type ParticleConfig, DEFAULT_CONFIG } from '../types';

export function useParticleConfig() {
  const [config, setConfig] = useState<ParticleConfig>({ ...DEFAULT_CONFIG });

  const updateConfig = useCallback((updates: Partial<ParticleConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
}
