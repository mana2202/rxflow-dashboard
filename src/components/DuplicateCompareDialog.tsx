import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChannelBadge } from './ChannelBadge';
import { CompletenessTag } from './CompletenessTag';
import { format } from 'date-fns';
import type { Order } from '@/types';
import { GitMerge, Split, AlertTriangle } from 'lucide-react';

export function DuplicateCompareDialog({
  a, b, open, onOpenChange, onMerge, onKeepSeparate,
}: {
  a: Order | null; b: Order | null; open: boolean;
  onOpenChange: (v: boolean) => void;
  onMerge: () => void;
  onKeepSeparate: () => void;
}) {
  if (!a || !b) return null;
  const Col = ({ o }: { o: Order }) => (
    <div className="flex-1 border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-semibold">{o.id}</span>
        <ChannelBadge channel={o.channel} />
      </div>
      <p className="font-display font-semibold mb-1">{o.account.name}</p>
      <p className="text-xs text-muted-foreground mb-3">{format(new Date(o.orderDate), 'MMM dd, HH:mm')}</p>
      <div className="text-xs grid grid-cols-2 gap-2 mb-3">
        <div><span className="text-muted-foreground">Items</span><div className="font-mono">{o.itemCount}</div></div>
        <div><span className="text-muted-foreground">Value</span><div className="font-mono">${o.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
      </div>
      <div className="border-t border-border pt-2 space-y-1">
        {o.items.map(it => (
          <div key={it.product.sku} className="flex justify-between text-xs">
            <span className="truncate"><span className="font-mono text-muted-foreground mr-1">{it.product.sku}</span>{it.product.name}</span>
            <span className="font-mono">×{it.qtyOrdered}</span>
          </div>
        ))}
      </div>
      <div className="mt-3"><CompletenessTag complete={o.completeness === 'Complete'} /></div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Possible duplicate detected
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Same customer, similar items, placed within hours via different channels. Review before routing.</p>
        </DialogHeader>
        <div className="flex gap-3">
          <Col o={a} />
          <Col o={b} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onKeepSeparate} className="btn-pharma-outline gap-1.5 text-xs">
            <Split className="h-3.5 w-3.5" /> Keep Separate
          </button>
          <button onClick={onMerge} className="btn-pharma gap-1.5 text-xs">
            <GitMerge className="h-3.5 w-3.5" /> Merge Orders
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
