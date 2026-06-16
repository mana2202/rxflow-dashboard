import type { PriorityLevel } from '@/utils/priorityScore';

interface PriorityBadgeProps {
  score?: number;
  level: PriorityLevel;
  showScore?: boolean;
}

const levelConfig: Record<PriorityLevel, { cls: string; dot: string; label: string }> = {
  CRITICAL: { cls: 'priority-critical', dot: '#C3332B', label: 'CRITICAL' },
  HIGH:     { cls: 'priority-high',     dot: '#D4900A', label: 'HIGH'     },
  MEDIUM:   { cls: 'priority-med',      dot: '#2A5ECF', label: 'MED'      },
  ROUTINE:  { cls: 'priority-low',      dot: '#5C6370', label: 'LOW'      },
};

export function PriorityBadge({ score, level, showScore = false }: PriorityBadgeProps) {
  const cfg = levelConfig[level] ?? levelConfig.ROUTINE;
  return (
    <span className={cfg.cls} role="status"
      aria-label={`Priority: ${cfg.label}${score !== undefined ? `, score ${score}` : ''}`}>
      <span style={{ width:5, height:5, borderRadius:'50%', backgroundColor:cfg.dot,
        display:'inline-block', flexShrink:0 }} aria-hidden="true" />
      {cfg.label}
      {showScore && score !== undefined && (
        <span className="font-mono ml-1 opacity-70">{score}</span>
      )}
    </span>
  );
}

export function PriorityScore({ score, level }: { score: number; level: PriorityLevel }) {
  const colors: Record<PriorityLevel, { ring:string; bg:string; text:string }> = {
    CRITICAL: { ring:'#C3332B', bg:'#FDEAE9', text:'#7A1F1A' },
    HIGH:     { ring:'#D4900A', bg:'#FEF3E0', text:'#7A4510' },
    MEDIUM:   { ring:'#2A5ECF', bg:'#E7EDFC', text:'#1A3D7A' },
    ROUTINE:  { ring:'#E2E4E9', bg:'#F0F1F3', text:'#3D424C' },
  };
  const c = colors[level] ?? colors.ROUTINE;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:36, height:36, borderRadius:'50%', background:c.bg,
      border:`2px solid ${c.ring}`, fontFamily:'var(--font-mono)',
      fontSize:13, fontWeight:700, color:c.text, flexShrink:0 }}
      aria-label={`Priority score: ${score}`}>
      {score}
    </span>
  );
}
