'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SettingsSectionProps {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order?: number;
  onDifficultyChange: (difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => void;
  onXpRewardChange: (value: number) => void;
  onEstimatedMinutesChange: (value: number) => void;
  onOrderChange?: (value: number) => void;
}

export function SettingsSection({
  difficulty,
  xpReward,
  estimatedMinutes,
  order,
  onDifficultyChange,
  onXpRewardChange,
  onEstimatedMinutesChange,
  onOrderChange
}: SettingsSectionProps) {
  const hasOrder = order !== undefined && onOrderChange;

  return (
    <div className={`grid gap-6 ${hasOrder ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
      <div>
        <Label htmlFor="difficulty">Difficulty Level</Label>
        <div className="flex gap-1 mt-2">
          {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => onDifficultyChange(level)}
              className={`
                flex items-center justify-center px-3 py-2 rounded-md border transition-all text-sm
                ${difficulty === level
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="xpReward">XP Reward</Label>
        <Input
          id="xpReward"
          type="number"
          min="1"
          value={xpReward}
          onChange={(e) => onXpRewardChange(parseInt(e.target.value) || 0)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
        <Input
          id="estimatedMinutes"
          type="number"
          min="0.5"
          step="0.5"
          value={estimatedMinutes}
          onChange={(e) => onEstimatedMinutesChange(parseFloat(e.target.value) || 0)}
          className="mt-2"
        />
      </div>

      {hasOrder && (
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            min="1"
            value={order}
            onChange={(e) => onOrderChange!(parseInt(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}