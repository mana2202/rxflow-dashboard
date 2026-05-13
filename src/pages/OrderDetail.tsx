import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { FulfillmentStepper } from '@/components/FulfillmentStepper';
import { ChannelBadge } from '@/components/ChannelBadge';
import { CompletenessTag } from '@/components/CompletenessTag';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { StockBadge, StockConfidenceChip } from '@/components/StockBadge';
import { demoOrders, getStockState } from '@/data/demo';
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal, Split, Clock, ShieldX, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const nextStageLabel: Record<string, string> = {
  'Incoming': 'Move to Verified',
  'Verified': 'Move to Picking',
  'Picking': 'Move to Compliance',
  'Compliance Check': 'Move to Ready',
  'Ready to Ship': 'Mark as Shipped',
  'Shipped': 'Fulfilled',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = demoOrders.find(o => o.id === id);
  const [activityOpen, setActivityOpen] = useState(false);

  if (!order) return (
    <AppLayout>
      <p className="text-muted-foreground">Order not found.</p>
    </AppLayout>
  );

  const hasControlled = order.items.some(i => i.product.category === 'Controlled');
  const breakdown = order.priority;
  const partial = order.items.some(i => i.qtyAvailable < i.qtyOrdered);
  const oldestStockHours = Math.max(...order.items.map(i => i.product.stockLastUpdatedHours ?? 0));
  const minConfidence: any = order.items.reduce((acc, i) => {
    const rank = { High: 3, Medium: 2, Low: 1 } as const;
    const c = i.product.stockConfidence ?? 'High';
    return rank[c] < rank[acc] ? c : acc;
  }, 'High' as 'High' | 'Medium' | 'Low');
  const fulfillmentBlocked = hasControlled && order.complianceStatus !== 'Passed';

  return (
    <AppLayout>
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn-pharma-outline gap-1.5 text-xs mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Order header bar */}
      <div className="card-pharma mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[22px] font-bold">{order.id}</span>
              <PriorityBadge score={breakdown.total} level={breakdown.level} />
              <StatusPill status={order.status} />
              <ChannelBadge channel={order.channel} />
              <CompletenessTag complete={order.completeness === 'Complete'} />
              <ComplianceBadge status={order.complianceStatus} />
            </div>
            <h2 className="text-[28px] font-bold font-display leading-tight">{order.account.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">SLA:</span>
              <span className={order.slaHoursRemaining <= 2 ? 'sla-pulse' : ''}>
                <SlaCountdown hours={order.slaHoursRemaining} />
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {format(new Date(order.slaDeadline), 'MMM dd, HH:mm')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {order.status !== 'Shipped' && (
              <button
                disabled={fulfillmentBlocked && order.status !== 'Compliance Check' && order.status !== 'Verified'}
                className={`btn-pharma gap-1.5 ${fulfillmentBlocked && order.status !== 'Compliance Check' && order.status !== 'Verified' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {nextStageLabel[order.status]}
              </button>
            )}
            <button className="w-9 h-9 rounded flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compliance block banner */}
        {order.complianceStatus === 'Blocked' && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm">
            <ShieldX className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Compliance blocked — order cannot proceed to fulfillment</div>
              <div className="text-xs opacity-80">{order.complianceBlockReason}</div>
            </div>
          </div>
        )}
        {fulfillmentBlocked && order.complianceStatus === 'Pending' && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="font-semibold">DEA review pending — must pass compliance before fulfillment.</div>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="card-pharma mb-6">
        <FulfillmentStepper currentStatus={order.status} hasControlled={hasControlled} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Line items */}
          <div className="card-pharma-compact">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="section-heading !mb-0 !text-base">Line Items</h3>
              <StockConfidenceChip confidence={minConfidence} hours={oldestStockHours} />
            </div>

            {partial && (
              <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Partial availability — some lines cannot be fully fulfilled.
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toast({ title: 'Order split', description: 'Available qty shipped now, backorder created for remainder.' })}
                    className="btn-pharma-outline text-xs gap-1.5"
                  >
                    <Split className="h-3.5 w-3.5" /> Split Order
                  </button>
                  <button
                    onClick={() => toast({ title: 'Holding for restock', description: 'Order paused until full availability.' })}
                    className="btn-pharma-outline text-xs gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" /> Wait for Restock
                  </button>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Avail</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-left">Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const state = getStockState(item.product);
                  const short = item.qtyAvailable < item.qtyOrdered;
                  return (
                    <tr key={item.product.sku} className="border-b border-border last:border-0">
                      <td className="px-6 py-4 font-mono text-xs">{item.product.sku}</td>
                      <td className="px-6 py-4">
                        <span>{item.product.name}</span>
                        {item.product.schedule && (
                          <span className="pill-schedule ml-2 text-[10px]">Sch. {item.product.schedule}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{item.qtyOrdered}</td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={short ? 'text-danger font-semibold' : ''}>{item.qtyAvailable}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">${item.product.unitPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <StockBadge product={item.product} showConfidence />
                          {short && state !== 'Out of Stock' && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400">Short by {item.qtyOrdered - item.qtyAvailable}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Collapsible Activity log */}
          <div className="card-pharma-compact">
            <button
              onClick={() => setActivityOpen(!activityOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <h3 className="section-heading !mb-0 !text-base">Activity Log</h3>
              {activityOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {activityOpen && (
              <div className="px-6 pb-5 space-y-3">
                {order.auditLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground font-mono">{format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — 2 cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority breakdown */}
          <div className="card-pharma">
            <h3 className="section-heading !text-base mb-4">Priority Score Breakdown</h3>
            <div className="text-center mb-5">
              <span className="text-4xl font-mono font-bold">{breakdown.total}</span>
              <div className="mt-1">
                <PriorityBadge score={breakdown.total} level={breakdown.level} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Urgency', value: breakdown.urgency, max: 40 },
                { label: 'SLA Proximity', value: breakdown.slaProximity, max: 30 },
                { label: 'Stock Risk', value: breakdown.stockRisk, max: 20 },
                { label: 'Customer Tier', value: breakdown.customerTier, max: 10 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-semibold">+{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order context — merged customer + stock */}
          <div className="card-pharma">
            <h3 className="section-heading !text-base mb-4">Order Context</h3>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{order.account.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className="font-medium">Tier {order.account.tier}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Manager</span><span className="font-medium">{order.account.accountManager}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Orders YTD</span><span className="font-mono">{order.account.totalOrdersYTD}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg Value</span><span className="font-mono">${order.account.avgOrderValue.toLocaleString()}</span></div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stock per Item</h4>
              <div className="space-y-3">
                {order.items.map(item => {
                  const pct = Math.min(100, (item.product.currentStock / (item.product.reorderPoint * 3)) * 100);
                  const low = item.product.currentStock < item.product.reorderPoint;
                  return (
                    <div key={item.product.sku}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{item.product.name}</span>
                        <span className={`font-mono ${low ? 'text-danger font-semibold' : 'text-muted-foreground'}`}>{item.product.currentStock} units</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${low ? 'bg-danger' : 'bg-success'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.product.daysOfSupply}d supply · Reorder at {item.product.reorderPoint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
