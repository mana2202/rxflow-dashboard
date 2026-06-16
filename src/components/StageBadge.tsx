import type { PipelineStage, OrderStatus } from '@/types';

export const stageOfStatus: Record<OrderStatus, PipelineStage> = {
  'Incoming':         'Intake',
  'Verified':         'Intake',
  'Picking':          'Fulfillment',
  'Compliance Check': 'Compliance Check',
  'Ready to Ship':    'Dispatch',
  'Shipped':          'Dispatch',
};

const stageConfig: Record<PipelineStage, { cls:string; label:string }> = {
  'Intake':           { cls:'stage-intake',      label:'INTAKE'      },
  'Compliance Check': { cls:'stage-compliance',  label:'COMPLIANCE'  },
  'Fulfillment':      { cls:'stage-fulfillment', label:'FULFILLMENT' },
  'Dispatch':         { cls:'stage-dispatch',    label:'DISPATCH'    },
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const cfg = stageConfig[stage] ?? stageConfig['Intake'];
  return (
    <span className={cfg.cls} role="status" aria-label={`Stage: ${cfg.label}`}>
      {cfg.label}
    </span>
  );
}

export function StageBadgeFromStatus({ status }: { status: OrderStatus }) {
  const stage = stageOfStatus[status] ?? 'Intake';
  return <StageBadge stage={stage} />;
}
