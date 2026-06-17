import type { Product, StockState, StockConfidence } from '@/types';
import { getStockState } from '@/data/demo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle2, ArrowDownCircle, AlertTriangle, XCircle } from 'lucide-react';

/* Stock states are differentiated by ICON + weight, not just hue — so
   "Low Stock" and "At Risk" are no longer an amber-vs-orange coin-flip.
   All color is token-routed (single source of truth, dark-mode safe). */
const stateStyles: Record<StockState, { cls: string; Icon: typeof Clock }> = {
  'In Stock':     { cls: 'bg-success-tint text-success-text', Icon: CheckCircle2 },
  'Low Stock':    { cls: 'bg-warning-tint text-warning-text', Icon: ArrowDownCircle },
  'At Risk':      { cls: 'bg-warning-tint text-warning-text ring-1 ring-warning', Icon: AlertTriangle },
  'Out of Stock': { cls: 'bg-danger-tint text-danger-text', Icon: XCircle },
};

const confColor: Record<StockConfidence, string> = {
  High: 'text-success-text',
  Medium: 'text-warning-text',
  Low: 'text-danger-text',
};

export function StockBadge({ product, showConfidence = false, compact = false }: { product: Product; showConfidence?: boolean; compact?: boolean }) {
  const state = getStockState(product);
  const { cls, Icon } = stateStyles[state];
  const conf = product.stockConfidence ?? 'High';
  const hours = product.stockLastUpdatedHours ?? 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-medium ${cls}`}>
          <Icon className="h-3 w-3" />
          {compact ? state.replace(' Stock', '') : state}
          {showConfidence && (
            <span className="ml-1 inline-flex items-center gap-0.5 opacity-80">· {conf}</span>
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
    <span className={`inline-flex items-center gap-1 text-2xs ${confColor[confidence]}`}>
      <Clock className="h-3 w-3" /> Updated {hours}h ago · {confidence} confidence
    </span>
  );
}
