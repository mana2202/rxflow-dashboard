import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Order } from '@/types';
import { Info } from 'lucide-react';

export function PriorityTooltip({ order, children }: { order: Order; children: React.ReactNode }) {
  const b = order.priority;
  const reasons: string[] = [];
  if (order.isUrgent) reasons.push('Marked STAT/urgent');
  if (order.slaHoursRemaining <= 0) reasons.push('SLA breached');
  else if (order.slaHoursRemaining < 8) reasons.push(`SLA in <8h (${order.slaHoursRemaining.toFixed(1)}h)`);
  if (order.hasStockRisk) reasons.push('Stock risk on at least one line');
  if (order.account.tier === 1) reasons.push('Tier 1 customer');
  if (order.productType === 'Controlled') reasons.push('Controlled substance — compliance complexity');

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children as any}</TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-xs p-3">
        <div className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> Why prioritized — {b.total}/100
        </div>
        <div className="space-y-1 mb-2 font-mono">
          <div className="flex justify-between"><span>SLA urgency (40%)</span><span>+{b.slaUrgency}</span></div>
          <div className="flex justify-between"><span>Client tier (25%)</span><span>+{b.clientTier}</span></div>
          <div className="flex justify-between"><span>Compliance (20%)</span><span>+{b.complianceComplexity}</span></div>
          <div className="flex justify-between"><span>Stock risk (15%)</span><span>+{b.stockRisk}</span></div>
        </div>
        {reasons.length > 0 && (
          <ul className="border-t border-border pt-2 space-y-0.5 text-muted-foreground">
            {reasons.map(r => <li key={r}>• {r}</li>)}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
