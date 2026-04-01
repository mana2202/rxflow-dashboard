import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { FulfillmentStepper } from '@/components/FulfillmentStepper';
import { demoOrders } from '@/data/demo';
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

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
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[22px] font-bold">{order.id}</span>
              <PriorityBadge score={breakdown.total} level={breakdown.level} />
              <StatusPill status={order.status} />
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
              <button className="btn-pharma gap-1.5">
                {nextStageLabel[order.status]}
              </button>
            )}
            <button className="w-9 h-9 rounded flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
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
            <div className="px-6 py-4 border-b border-border">
              <h3 className="section-heading !mb-0 !text-base">Line Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Avail</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
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
                      <span className={item.qtyAvailable < item.qtyOrdered ? 'text-danger font-semibold' : ''}>{item.qtyAvailable}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">${item.product.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      {item.product.currentStock < item.product.reorderPoint ? (
                        <span className="pill text-danger bg-danger/10 text-xs">Low</span>
                      ) : (
                        <span className="pill text-success bg-success/10 text-xs">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
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
