import type { Product, StockState, StockConfidence } from '@/types';
import { getStockState } from '@/data/demo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock } from 'lucide-react';

const stateConfig: Record<StockState, { cls:string; dot:string }> = {
  'In Stock':     { cls:'stock-in',      dot:'#1A7F4B' },
  'Low Stock':    { cls:'stock-low',     dot:'#D4900A' },
  'At Risk':      { cls:'stock-at-risk', dot:'#C3332B' },
  'Out of Stock': { cls:'stock-out',     dot:'#5C6370' },
};

const confColor: Record<StockConfidence, string> = {
  High:   '#1A7F4B',
  Medium: '#D4900A',
  Low:    '#C3332B',
};

export function StockBadge({ product, showConfidence = false, compact = false }:
  { product: Product; showConfidence?: boolean; compact?: boolean }) {
  const state = getStockState(product);
  const cfg = stateConfig[state];
  const conf = product.stockConfidence ?? 'High';
  const hours = product.stockLastUpdatedHours ?? 0;
  const label = compact ? state.replace(' Stock','').replace(' of','') : state;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cfg.cls} role="status"
          aria-label={`Stock: ${state}${showConfidence ? `, confidence ${conf}` : ''}`}>
          <span style={{ width:5, height:5, borderRadius:'50%',
            backgroundColor:cfg.dot, display:'inline-block', flexShrink:0 }}
            aria-hidden="true" />
          {label}
          {showConfidence && (
            <span style={{ color:confColor[conf], marginLeft:4 }}>· {conf}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <div className="font-semibold mb-1">
          Stock confidence: <span style={{ color:confColor[conf] }}>{conf}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Last synced {hours}h ago
        </div>
        <div className="mt-1 font-mono text-[11px]">
          {product.currentStock} on hand · reorder @ {product.reorderPoint}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function StockConfidenceChip({ confidence, hours }:
  { confidence: StockConfidence; hours: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]"
      style={{ color: confColor[confidence] }}>
      <Clock className="h-3 w-3" aria-hidden="true" />
      Updated {hours}h ago · {confidence} confidence
    </span>
  );
}
