import type { OrderStatus } from '@/types';
import { Check } from 'lucide-react';

const allSteps: OrderStatus[] = ['Incoming', 'Verified', 'Picking', 'Compliance Check', 'Ready to Ship', 'Shipped'];

export function FulfillmentStepper({ currentStatus, hasControlled }: { currentStatus: OrderStatus; hasControlled: boolean }) {
  const steps = hasControlled ? allSteps : allSteps.filter(s => s !== 'Compliance Check');
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              done ? 'bg-foreground text-card' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {done && <Check className="h-3 w-3" />}
              {step}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
