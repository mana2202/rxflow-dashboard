import type { OrderStatus } from '@/types';
import { pipelineStages, stageOfStatus } from '@/data/demo';
import { Check } from 'lucide-react';

export function FulfillmentStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentStage = stageOfStatus[currentStatus];
  const currentIdx = pipelineStages.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto">
      {pipelineStages.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={stage} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              done ? 'bg-foreground text-card' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {done && <Check className="h-3 w-3" />}
              {stage}
              {active && currentStatus !== stage && (
                <span className="ml-1 opacity-70">· {currentStatus}</span>
              )}
            </div>
            {i < pipelineStages.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
