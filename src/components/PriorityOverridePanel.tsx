import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { computePriorityScore, DEFAULT_WEIGHTS, type PriorityWeights, type PriorityBreakdown } from '@/utils/priorityScore';
import { AnimatedScoreRing } from './AnimatedScoreRing';

interface Props {
  baseParams: {
    isUrgent: boolean;
    slaHoursRemaining: number;
    hasStockRisk: boolean;
    customerTier: 1 | 2 | 3;
  };
  onApply?: (weights: PriorityWeights, result: PriorityBreakdown) => void;
  onReset?: () => void;
}

export function PriorityOverridePanel({ baseParams, onApply, onReset }: Props) {
  const [weights, setWeights] = useState<PriorityWeights>({ ...DEFAULT_WEIGHTS });

  const result = computePriorityScore(baseParams, weights);

  function setWeight(key: keyof PriorityWeights, val: number) {
    setWeights(prev => ({ ...prev, [key]: val }));
  }

  function handleReset() {
    setWeights({ ...DEFAULT_WEIGHTS });
    onReset?.();
  }

  const rows: { key: keyof PriorityWeights; label: string; max: number }[] = [
    { key: 'urgency',      label: 'Urgency',       max: 60 },
    { key: 'slaProximity', label: 'SLA Proximity',  max: 40 },
    { key: 'stockRisk',    label: 'Stock Risk',     max: 30 },
    { key: 'customerTier', label: 'Customer Tier',  max: 20 },
  ];

  return (
    <div className="card-pharma flex flex-col gap-5 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Priority Weights</h3>
        <AnimatedScoreRing score={result.total} level={result.level} size={48} />
      </div>

      <div className="flex flex-col gap-4">
        {rows.map(({ key, label, max }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span className="font-mono">{weights[key]}</span>
            </div>
            <Slider
              min={0}
              max={max}
              step={1}
              value={[weights[key]]}
              onValueChange={([v]) => setWeight(key, v)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" className="flex-1" onClick={() => onApply?.(weights, result)}>
          Apply
        </Button>
      </div>
    </div>
  );
}
