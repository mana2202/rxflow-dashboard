import '../styles/override.css';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { OverrideDirection, OverrideReason, OverrideRecord } from '@/types';

const OVERRIDE_SCORES: Record<OverrideDirection, Record<OverrideReason, { score: number; level: string }>> = {
  escalate: {
    client_relationship:  { score: 100, level: 'CRITICAL' },
    stock_emergency:      { score: 98,  level: 'CRITICAL' },
    compliance_exception: { score: 96,  level: 'CRITICAL' },
    ops_judgment:         { score: 97,  level: 'CRITICAL' },
  },
  deescalate: {
    client_relationship:  { score: 68, level: 'HIGH' },
    stock_emergency:      { score: 55, level: 'MED' },
    compliance_exception: { score: 48, level: 'MED' },
    ops_judgment:         { score: 62, level: 'HIGH' },
  },
};

const REASON_LABELS: Record<OverrideReason, string> = {
  client_relationship:  'Client relationship (VIP account or key contract)',
  stock_emergency:      'Stock emergency (supply constraint changed)',
  compliance_exception: 'Compliance exception (regulatory flag or hold)',
  ops_judgment:         'Operational judgment (contextual ops decision)',
};

const IMPACT_LINES: Record<OverrideDirection, Record<OverrideReason, string>> = {
  escalate: {
    client_relationship:  'Moves to top of queue, above all HIGH orders.',
    stock_emergency:      'Moves to top of queue; flags supply chain alert.',
    compliance_exception: 'Escalated for immediate regulatory review.',
    ops_judgment:         'Elevated by ops decision — added to CRITICAL inbox.',
  },
  deescalate: {
    client_relationship:  'Deprioritized temporarily; still visible to account manager.',
    stock_emergency:      'Moved to MED — will resume when stock resolves.',
    compliance_exception: 'Held at MED pending compliance clarification.',
    ops_judgment:         'Deprioritized by ops — will surface if SLA approaches.',
  },
};

interface Props {
  orderId: string;
  currentScore: number;
  currentLevel: string;
  overrides: OverrideRecord[];
  operatorName: string;
  onConfirm: (record: OverrideRecord) => void;
}

export function PriorityOverridePanel({ orderId, currentScore, currentLevel, overrides, operatorName, onConfirm }: Props) {
  const [dir, setDir] = useState<OverrideDirection | null>(null);
  const [reason, setReason] = useState<OverrideReason | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [displayScore, setDisplayScore] = useState(currentScore);
  const [scoreAnimClass, setScoreAnimClass] = useState('');
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Keep display score in sync if parent updates
  useEffect(() => {
    if (!confirmed) setDisplayScore(currentScore);
  }, [currentScore, confirmed]);

  const preview = dir && reason ? OVERRIDE_SCORES[dir][reason] : null;

  const handleConfirm = () => {
    if (!dir || !reason || !preview) return;

    const record: OverrideRecord = {
      id: `ov-${Date.now()}`,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      changedBy: operatorName,
      fromScore: currentScore,
      fromLevel: currentLevel,
      toScore: preview.score,
      toLevel: preview.level,
      direction: dir,
      reasonCode: reason,
      impact: IMPACT_LINES[dir][reason],
    };

    // Animate ring
    if (ringRef.current) {
      ringRef.current.classList.remove('override-ring-stamp');
      void ringRef.current.offsetWidth;
      ringRef.current.classList.add('override-ring-stamp');
    }

    // Animate score number
    setScoreAnimClass(dir === 'escalate' ? 'override-stamp-up' : 'override-stamp-down');
    setDisplayScore(preview.score);

    // Log entry enters 80ms later
    setTimeout(() => {
      onConfirm(record);
      setNewEntryId(record.id);
    }, 80);

    setConfirmed(true);
    toast({ title: 'Priority override applied', description: `Score: ${currentScore} → ${preview.score} (${preview.level})` });
  };

  return (
    <div className="mt-5 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Override Priority</p>

      {/* Score ring */}
      <div ref={ringRef} className="text-center mb-4">
        <span
          key={displayScore}
          className={`text-4xl font-mono font-bold ${scoreAnimClass}`}
          onAnimationEnd={() => setScoreAnimClass('')}
        >
          {displayScore}
        </span>
      </div>

      {/* Step 1: Direction */}
      <div className="flex gap-2 mb-3">
        {(['escalate', 'deescalate'] as OverrideDirection[]).map(d => (
          <button
            key={d}
            disabled={confirmed}
            onClick={() => { setDir(d); setReason(null); setConfirmed(false); }}
            className={`flex-1 text-xs py-2 rounded border transition-all ${dir === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-accent'} ${confirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {d === 'escalate' ? 'Escalate ↑' : 'De-escalate ↓'}
          </button>
        ))}
      </div>

      {/* Step 2: Reason */}
      {dir && (
        <div className="space-y-1.5 mb-3">
          {(Object.keys(REASON_LABELS) as OverrideReason[]).map(r => (
            <button
              key={r}
              disabled={confirmed}
              onClick={() => { setReason(r); setConfirmed(false); }}
              className={`w-full text-left text-xs p-2.5 rounded border transition-all ${reason === r ? 'bg-primary/10 border-primary text-foreground' : 'border-border text-muted-foreground hover:bg-accent'} ${confirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Impact preview */}
      {preview && !confirmed && (
        <div className="mb-3 p-2.5 rounded bg-muted text-xs">
          <p className="font-semibold mb-1">Score {currentScore} → {preview.score} · {preview.level}</p>
          <p className="text-muted-foreground">{IMPACT_LINES[dir!][reason!]}</p>
        </div>
      )}

      {/* Step 4: Confirm */}
      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={!dir || !reason}
          className={`w-full btn-pharma text-xs ${!dir || !reason ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Confirm Override
        </button>
      ) : (
        <div className="text-xs text-success-text font-semibold text-center py-2">
          ✓ Override applied — {displayScore} ({preview?.level})
        </div>
      )}

      {/* Override history */}
      {overrides.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {overrides.map(rec => (
            <div
              key={rec.id}
              className={`text-2xs text-muted-foreground ${rec.id === newEntryId ? 'override-log-enter' : ''}`}
            >
              <span className="font-medium text-foreground">{rec.changedBy}</span>
              {' '}· {rec.fromScore} → {rec.toScore} · {format(new Date(rec.timestamp), 'HH:mm')}
              <br />{rec.reasonCode.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
