import type { PriorityLevel } from '@/utils/priorityScore';
import { getLevelColor } from '@/utils/priorityScore';

const levelLabel: Record<PriorityLevel, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  ROUTINE: 'Routine',
};

interface PriorityBadgeProps {
  score: number;
  level: PriorityLevel;
  showScore?: boolean;
}

export function PriorityBadge({ score, level, showScore = true }: PriorityBadgeProps) {
  return (
    <span className={`${getLevelColor(level)} font-mono text-xs font-semibold`}>
      {showScore ? `${score} · ` : ''}{levelLabel[level]}
    </span>
  );
}
