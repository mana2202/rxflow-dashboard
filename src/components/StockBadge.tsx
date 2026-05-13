import type { Product, StockState, StockConfidence } from '@/types';
import { getStockState } from '@/data/demo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock } from 'lucide-react';

const stateStyles: Record<StockState, { dot: string; cls: string }> = {
  'In Stock':     { dot: 'bg-emerald-500',  cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  'Low Stock':    { dot: 'bg-amber-500',    cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  'At Risk':      { dot: 'bg-orange-500',   cls: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  'Out of Stock': { dot: 'bg-red-500',      cls: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

const confColor: Record<StockConfidence, string> = {
  High: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Low: 'text-red-600 dark:text-red-400',
};

export function StockBadge({ product, showConfidence = false, compact = false }: { product: Product; showConfidence?: boolean; compact?: boolean }) {
  const state = getStockState(product);
  const s = stateStyles[state];
  const conf = product.stockConfidence ?? 'High';
  const hours = product.stockLastUpdatedHours ?? 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {compact ? state.replace(' Stock', '') : state}
          {showConfidence && (
            <span className={`ml-1 inline-flex items-center gap-0.5 ${confColor[conf]}`}>
              · {conf}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <div className="font-semibold mb-1">Stock confidence: <span className={confColor[conf]}>{conf}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> Last synced {hours}h ago</div>
        <div className="mt-1 font-mono">{product.currentStock} on hand · reorder @ {product.reorderPoint}</div>
      </TooltipContent>
    </Tooltip>
  );
}

export function StockConfidenceChip({ confidence, hours }: { confidence: StockConfidence; hours: number }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${confColor[confidence]}`}>
      <Clock className="h-3 w-3" /> Updated {hours}h ago · {confidence} confidence
    </span>
  );
}
