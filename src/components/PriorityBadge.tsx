import type { PriorityLevel } from '@/utils/priorityScore';
import { getLevelColor } from '@/utils/priorityScore';

export function PriorityBadge({ score, level }: { score: number; level: PriorityLevel }) {
  return (
    <span className={`${getLevelColor(level)} font-mono text-xs font-semibold`}>
      {score} · {level}
    </span>
  );
}
