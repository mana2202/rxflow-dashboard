import { useState, useRef } from 'react';
import type { PriorityLevel } from '@/utils/priorityScore';
import '@/styles/override.css';

export type OverrideDirection = 'escalate' | 'deescalate';
export type OverrideReasonCode =
  | 'client_relationship' | 'stock_emergency'
  | 'compliance_exception' | 'ops_judgment';

export interface OverrideResult {
  orderId: string;
  previousScore: number;
  previousLevel: PriorityLevel;
  newScore: number;
  newLevel: PriorityLevel;
  direction: OverrideDirection;
  reasonCode: OverrideReasonCode;
  overriddenBy: string;
  overriddenAt: string;
}

const REASON_LABELS: Record<OverrideReasonCode, { title:string; sub:string }> = {
  client_relationship:  { title:'Client relationship',  sub:'VIP account or key contract'  },
  stock_emergency:      { title:'Stock emergency',      sub:'Supply constraint changed'     },
  compliance_exception: { title:'Compliance exception', sub:'Regulatory flag or hold'       },
  ops_judgment:         { title:'Operational judgment', sub:'Contextual ops decision'       },
};

const SCORE_MAP: Record<OverrideDirection, Record<OverrideReasonCode,
  { score:number; level:PriorityLevel; preview:string }>> = {
  escalate: {
    client_relationship:  { score:100, level:'CRITICAL', preview:'Moves to top of queue, above all HIGH orders.' },
    stock_emergency:      { score:98,  level:'CRITICAL', preview:'Flagged for immediate inventory review.' },
    compliance_exception: { score:96,  level:'CRITICAL', preview:'Escalated to senior compliance officer.' },
    ops_judgment:         { score:97,  level:'CRITICAL', preview:'Escalated on contextual assessment.' },
  },
  deescalate: {
    client_relationship:  { score:68, level:'HIGH',   preview:'Yields priority to SLA-critical orders.' },
    stock_emergency:      { score:55, level:'MEDIUM', preview:'Stock resolved — de-escalated to standard queue.' },
    compliance_exception: { score:48, level:'MEDIUM', preview:'Compliance hold — removed from active queue.' },
    ops_judgment:         { score:62, level:'HIGH',   preview:'Standard processing resumes.' },
  },
};

const LEVEL_STYLES: Record<PriorityLevel, { ring:string; bg:string; text:string; label:string }> = {
  CRITICAL: { ring:'#C3332B', bg:'#FDEAE9', text:'#7A1F1A', label:'CRITICAL' },
  HIGH:     { ring:'#D4900A', bg:'#FEF3E0', text:'#7A4510', label:'HIGH'     },
  MEDIUM:   { ring:'#2A5ECF', bg:'#E7EDFC', text:'#1A3D7A', label:'MED'      },
  ROUTINE:  { ring:'#E2E4E9', bg:'#F0F1F3', text:'#3D424C', label:'LOW'      },
};

interface Props {
  orderId: string;
  currentScore: number;
  currentLevel: PriorityLevel;
  operatorName: string;
  onConfirm: (result: OverrideResult) => void;
  onCancel: () => void;
}

export function PriorityOverridePanel({ orderId, currentScore, currentLevel, operatorName, onConfirm, onCancel }: Props) {
  const [direction, setDirection] = useState<OverrideDirection | null>(null);
  const [reason, setReason] = useState<OverrideReasonCode | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<OverrideResult | null>(null);
  const ringNumRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const impact = direction && reason ? SCORE_MAP[direction][reason] : null;
  const canConfirm = direction !== null && reason !== null && !confirmed;

  function handleConfirm() {
    if (!direction || !reason || !impact) return;
    setConfirmed(true);

    const ringEl = ringRef.current;
    const numEl = ringNumRef.current;

    if (ringEl) {
      ringEl.classList.add('override-ring-stamp');
      ringEl.addEventListener('animationend', () => ringEl.classList.remove('override-ring-stamp'), { once:true });
    }
    if (numEl) {
      const cls = direction === 'escalate' ? 'override-stamp-up' : 'override-stamp-down';
      numEl.classList.add(cls);
      numEl.addEventListener('animationend', () => numEl.classList.remove(cls), { once:true });
    }

    const animDuration = direction === 'escalate' ? 180 : 260;
    const overrideResult: OverrideResult = {
      orderId, previousScore: currentScore, previousLevel: currentLevel,
      newScore: impact.score, newLevel: impact.level,
      direction, reasonCode: reason,
      overriddenBy: operatorName, overriddenAt: new Date().toISOString(),
    };
    setTimeout(() => { setResult(overrideResult); onConfirm(overrideResult); }, animDuration + 80);
  }

  const displayLevel = (impact?.level ?? currentLevel) as PriorityLevel;
  const ls = LEVEL_STYLES[displayLevel];

  return (
    <div className="flex flex-col gap-4">
      {/* Direction */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Direction</span>
        <div className="flex gap-2">
          {(['escalate','deescalate'] as const).map(dir => (
            <button key={dir} onClick={() => !confirmed && setDirection(dir)} disabled={confirmed}
              aria-pressed={direction === dir}
              className={['flex-1 flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                direction === dir && dir === 'escalate' ? 'border-[#C3332B] bg-[#FDEAE9]' :
                direction === dir && dir === 'deescalate' ? 'border-[#2A5ECF] bg-[#E7EDFC]' :
                'border-border bg-card hover:bg-muted'].join(' ')}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: dir==='escalate' ? '#FDEAE9' : '#E7EDFC',
                  color: dir==='escalate' ? '#C3332B' : '#2A5ECF' }}>
                {dir === 'escalate' ? '↑' : '↓'}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {dir === 'escalate' ? 'Escalate' : 'De-escalate'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {dir === 'escalate' ? 'Moves above other orders' : 'Yields priority to others'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Reason — logged to audit trail
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(REASON_LABELS) as [OverrideReasonCode, { title:string; sub:string }][]).map(([code, { title, sub }]) => (
            <button key={code} onClick={() => !confirmed && setReason(code)} disabled={confirmed}
              aria-pressed={reason === code}
              className={['flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                reason === code ? 'border-foreground bg-muted' : 'border-border bg-card hover:bg-muted'].join(' ')}>
              <span className="text-[12px] font-medium text-foreground">{title}</span>
              <span className="text-[11px] text-muted-foreground">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Impact preview */}
      <div ref={ringRef} className="rounded-lg p-3 border transition-colors"
        style={impact ? { background:ls.bg, borderColor:ls.ring } : { background:'#F4F5F7', borderColor:'#E2E4E9' }}>
        {impact ? (
          <p className="text-[12px] leading-relaxed" style={{ color:ls.text }}>
            <span className="font-semibold">
              Score {currentScore} → <span ref={ringNumRef}>{impact.score}</span> · {LEVEL_STYLES[impact.level].label}
            </span>
            <br />{impact.preview}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground">Select a direction and reason to preview the impact</p>
        )}
      </div>

      {/* Confirm */}
      <div className="flex gap-2">
        <button onClick={onCancel} disabled={confirmed}
          className="btn-pharma-outline text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          Cancel
        </button>
        <button onClick={handleConfirm} disabled={!canConfirm}
          className="btn-pharma flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          style={direction === 'escalate' && canConfirm ? { background:'#C3332B', borderColor:'#C3332B' } : {}}>
          {confirmed ? 'Applied' : 'Confirm override'}
        </button>
      </div>

      {/* Log entry — appears after ring animation */}
      {result && (
        <div className="override-log-enter rounded-lg p-3 bg-muted border border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Override logged</p>
          <p className="text-[12px] font-medium text-foreground mb-1">Priority override — {result.orderId}</p>
          <div className="flex gap-4">
            <span className="text-[11px] text-muted-foreground">Score <span className="text-foreground font-medium">{result.previousScore} → {result.newScore}</span></span>
            <span className="text-[11px] text-muted-foreground">Reason <span className="text-foreground font-medium">{REASON_LABELS[result.reasonCode].title}</span></span>
          </div>
          <div className="flex gap-4 mt-0.5">
            <span className="text-[11px] text-muted-foreground">By <span className="text-foreground font-medium">{result.overriddenBy} · {new Date(result.overriddenAt).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
