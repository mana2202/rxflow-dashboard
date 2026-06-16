import { useEffect, useRef } from 'react';
import type { PriorityLevel } from '@/utils/priorityScore';

const LEVEL_COLORS: Record<PriorityLevel, string> = {
  CRITICAL: '#dc2626',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  ROUTINE:  '#6b7280',
};

interface Props {
  score: number;
  level: PriorityLevel;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedScoreRing({ score, level, size = 56, strokeWidth = 4 }: Props) {
  const prevScore = useRef(score);
  const circleRef = useRef<SVGCircleElement>(null);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease';
    el.style.strokeDashoffset = String(offset);
    prevScore.current = score;
  }, [score, offset]);

  const color = LEVEL_COLORS[level];
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-label={`Priority score ${score}`}>
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted opacity-20"
      />
      <circle
        ref={circleRef}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - prevScore.current / 100)}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.24}
        fontWeight="700"
        fill={color}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px`, fontFamily: 'var(--font-mono)' }}
      >
        {score}
      </text>
    </svg>
  );
}
