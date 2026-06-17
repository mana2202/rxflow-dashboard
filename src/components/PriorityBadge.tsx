import type { PriorityLevel } from '@/utils/priorityScore';
import { getLevelColor } from '@/utils/priorityScore';

/* Single, consistent priority representation used everywhere (Home,
   Pipeline, OrderDetail, Analytics). Always shows score + level as a
   filled/tinted badge — no more bare uncolored numbers on the board. */
export function PriorityBadge({
  score,
  level,
  showScore = true,
}: {
  score: number;
  level: PriorityLevel;
  showScore?: boolean;
}) {
  return (
    <span className={`${getLevelColor(level)} font-mono font-semibold`}>
      {showScore ? `${score} · ${level}` : level}
    </span>
  );
}
