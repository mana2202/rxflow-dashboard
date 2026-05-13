import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { CompletenessTag } from '@/components/CompletenessTag';
import { StockBadge } from '@/components/StockBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { DuplicateCompareDialog } from '@/components/DuplicateCompareDialog';
import { PriorityTooltip } from '@/components/PriorityTooltip';
import { demoOrders } from '@/data/demo';
import { ArrowRight, AlertTriangle, GitMerge, Inbox, ShieldCheck, MessageSquare } from 'lucide-react';
import type { Order } from '@/types';
import { toast } from '@/hooks/use-toast';

type Filter = 'all' | 'clarify' | 'duplicate' | 'ready';

export default function IncomingOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => demoOrders.filter(o => o.status === 'Incoming'));
  const [filter, setFilter] = useState<Filter>('all');
  const [dupOpen, setDupOpen] = useState(false);
  const [dupPair, setDupPair] = useState<[Order, Order] | null>(null);

  const counts = useMemo(() => ({
    all: orders.length,
    clarify: orders.filter(o => o.completeness === 'Needs Clarification').length,
    duplicate: orders.filter(o => o.duplicateOfId).length,
    ready: orders.filter(o => o.completeness === 'Complete' && !o.duplicateOfId).length,
  }), [orders]);

  const visible = useMemo(() => {
    let arr = [...orders];
    if (filter === 'clarify') arr = arr.filter(o => o.completeness === 'Needs Clarification');
    else if (filter === 'duplicate') arr = arr.filter(o => o.duplicateOfId);
    else if (filter === 'ready') arr = arr.filter(o => o.completeness === 'Complete' && !o.duplicateOfId);
    return arr.sort((a, b) => b.priority.total - a.priority.total);
  }, [orders, filter]);

  const findDuplicate = (o: Order) => orders.find(x => x.id === o.duplicateOfId) ?? demoOrders.find(x => x.id === o.duplicateOfId) ?? null;

  const openDuplicate = (o: Order) => {
    const other = findDuplicate(o);
    if (!other) return;
    setDupPair([o, other]);
    setDupOpen(true);
  };

  const routeToFulfillment = (o: Order) => {
    if (o.completeness !== 'Complete') {
      toast({ title: 'Cannot route', description: 'Resolve missing fields before sending to fulfillment.' });
      return;
    }
    if (o.duplicateOfId) {
      toast({ title: 'Possible duplicate', description: 'Resolve the duplicate first (Merge or Keep Separate).' });
      return;
    }
    setOrders(prev => prev.filter(x => x.id !== o.id));
    toast({ title: `${o.id} routed`, description: 'Moved to Compliance / Fulfillment pipeline.' });
  };

  const resolveClarification = (o: Order) => {
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, completeness: 'Complete', missingFields: undefined } : x));
    toast({ title: 'Clarification recorded', description: `${o.id} now ready to route.` });
  };

  const handleMerge = () => {
    if (!dupPair) return;
    const [a, b] = dupPair;
    setOrders(prev => prev.filter(x => x.id !== b.id).map(x => x.id === a.id ? { ...x, duplicateOfId: undefined } : x));
    setDupOpen(false);
    toast({ title: 'Orders merged', description: `${b.id} merged into ${a.id}.` });
  };
  const handleKeepSeparate = () => {
    if (!dupPair) return;
    const [a, b] = dupPair;
    setOrders(prev => prev.map(x => x.id === a.id || x.id === b.id ? { ...x, duplicateOfId: undefined } : x));
    setDupOpen(false);
    toast({ title: 'Kept separate', description: 'Both orders flagged as independent.' });
  };

  return (
    <AppLayout title="Incoming Orders">
      {/* Filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          ['all', 'All Intake', counts.all, Inbox],
          ['clarify', 'Needs Clarification', counts.clarify, MessageSquare],
          ['duplicate', 'Possible Duplicates', counts.duplicate, GitMerge],
          ['ready', 'Ready to Route', counts.ready, ShieldCheck],
        ] as const).map(([key, label, count, Icon]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`card-pharma-compact px-4 py-2 flex items-center gap-2 text-sm transition-all hover:shadow-elevated ${
              filter === key ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold">{count}</span>
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="card-pharma text-center py-12 text-muted-foreground">No orders match this filter.</div>
        )}
        {visible.map(o => {
          const blocked = o.completeness !== 'Complete' || !!o.duplicateOfId;
          return (
            <div
              key={o.id}
              className={`card-pharma-compact p-5 border-l-4 ${
                o.completeness !== 'Complete' ? 'border-l-amber-500' :
                o.duplicateOfId ? 'border-l-orange-500' :
                o.priority.level === 'CRITICAL' ? 'border-l-red-500' :
                o.priority.level === 'HIGH' ? 'border-l-orange-400' : 'border-l-emerald-500'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: identity + tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-sm font-semibold">{o.id}</span>
                    <ChannelBadge channel={o.channel} />
                    <CompletenessTag complete={o.completeness === 'Complete'} />
                    {o.duplicateOfId && (
                      <button
                        onClick={() => openDuplicate(o)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/25 transition-colors"
                      >
                        <GitMerge className="h-3 w-3" /> Possible duplicate of {o.duplicateOfId}
                      </button>
                    )}
                    <ProductTypePill type={o.productType} />
                    <ComplianceBadge status={o.complianceStatus} compact />
                  </div>
                  <p className="font-display text-lg font-semibold leading-tight">{o.account.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Tier {o.account.tier}</span>
                    <span>·</span>
                    <span>{o.itemCount} items · ${o.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span>·</span>
                    <span>SLA <SlaCountdown hours={o.slaHoursRemaining} /></span>
                  </div>

                  {/* Inline missing fields */}
                  {o.completeness === 'Needs Clarification' && o.missingFields && (
                    <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Missing required fields — cannot enter fulfillment
                      </div>
                      <ul className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 ml-5 list-disc">
                        {o.missingFields.map(f => <li key={f}>{f}</li>)}
                      </ul>
                      <button
                        onClick={() => resolveClarification(o)}
                        className="btn-pharma-outline text-[11px] py-1 px-2 mt-2"
                      >
                        Mark as clarified
                      </button>
                    </div>
                  )}

                  {/* Stock-at-a-glance for line items */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {o.items.map(it => (
                      <div key={it.product.sku} className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-muted/40">
                        <span className="font-mono text-muted-foreground">{it.product.sku}</span>
                        <StockBadge product={it.product} compact />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: priority + action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <PriorityTooltip order={o}>
                    <div className="text-right cursor-help">
                      <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Priority</div>
                      <div className="font-mono text-2xl font-bold leading-none">{o.priority.total}</div>
                      <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{o.priority.level}</div>
                    </div>
                  </PriorityTooltip>
                  <button
                    onClick={() => routeToFulfillment(o)}
                    disabled={blocked}
                    className={`btn-pharma text-xs gap-1 ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Route to Fulfillment <ArrowRight className="h-3 w-3" />
                  </button>
                  <button onClick={() => navigate(`/orders/${o.id}`)} className="text-xs text-muted-foreground hover:text-foreground">
                    Open detail →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DuplicateCompareDialog
        open={dupOpen}
        onOpenChange={setDupOpen}
        a={dupPair?.[0] ?? null}
        b={dupPair?.[1] ?? null}
        onMerge={handleMerge}
        onKeepSeparate={handleKeepSeparate}
      />
    </AppLayout>
  );
}
