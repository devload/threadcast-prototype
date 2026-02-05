import { useState, useEffect } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

interface AutonomySliderProps {
  value?: number;
  onChange?: (level: number) => void;
  showHint?: boolean;
}

const autonomyLevels: Record<number, { label: string; description: string }> = {
  1: { label: 'Level 1', description: 'Minimal' },
  2: { label: 'Level 2', description: 'Guided' },
  3: { label: 'Level 3', description: 'Balanced' },
  4: { label: 'Level 4', description: 'Autonomous' },
  5: { label: 'Level 5', description: 'Maximum' },
};

export function AutonomySlider({
  value = 3,
  onChange,
  showHint = true,
}: AutonomySliderProps) {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(value);

  useEffect(() => {
    setCurrentLevel(value);
  }, [value]);

  const handleChange = (newLevel: number) => {
    setCurrentLevel(newLevel);
    onChange?.(newLevel);
  };

  const level = autonomyLevels[currentLevel];

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-900">
          {level?.label}
        </span>
        <span className="text-[11px] text-slate-500">
          {level?.description}
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="5"
        value={currentLevel}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        aria-label="AI Autonomy Level"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={currentLevel}
        aria-valuetext={`${level?.label} - ${level?.description}`}
      />

      <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
        <span>Minimal</span>
        <span>Maximum</span>
      </div>

      {showHint && (
        <div className="mt-2.5 px-2 py-1.5 bg-indigo-50/50 rounded-md text-[10px] text-slate-500 leading-relaxed">
          💡 {t('autonomy.hint')}
        </div>
      )}
    </div>
  );
}
