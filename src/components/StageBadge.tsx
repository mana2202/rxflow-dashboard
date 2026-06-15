import type { PipelineStage } from '@/types';

const stageStyles: Record<PipelineStage, { cls: string; dot: string }> = {
  'Intake':           { cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',    dot: 'bg-blue-500' },
  'Compliance Check': { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  'Fulfillment':      { cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Dispatch':         { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const s = stageStyles[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {stage}
    </span>
  );
}
