import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { FulfillmentStepper } from '@/components/FulfillmentStepper';
import { demoOrders } from '@/data/demo';
import { ArrowLeft, ChevronRight, Flag, UserPlus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = demoOrders.find(o => o.id === id);

  if (!order) return (
    <AppLayout title="Order Not Found">
      <p>Order not found.</p>
    </AppLayout>
  );

  const hasControlled = order.items.some(i => i.product.category === 'Controlled');
  const breakdown = order.priority;

  return (
    <AppLayout
      title=""
      actions={
        <button onClick={() => navigate(-1)} className="btn-pharma-outline gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      }
    >
      {/* Stepper */}
      <div className="card-pharma p-4 mb-6">
        <FulfillmentStepper currentStatus={order.status} hasControlled={hasControlled} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header card */}
          <div className="card-pharma p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-mono text-2xl font-bold">{order.id}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <PriorityBadge score={breakdown.total} level={breakdown.level} />
                  <StatusPill status={order.status} />
                  <ProductTypePill type={order.productType} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-mono">${order.orderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{order.itemCount} items</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">Customer</span><p className="font-medium">{order.account.name}</p></div>
              <div><span className="text-muted-foreground text-xs">Tier</span><p className="font-medium">Tier {order.account.tier}</p></div>
              <div><span className="text-muted-foreground text-xs">Ordered</span><p className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}</p></div>
              <div><span className="text-muted-foreground text-xs">SLA Deadline</span><p className="font-medium flex items-center gap-2">{format(new Date(order.slaDeadline), 'MMM dd, HH:mm')} <SlaCountdown hours={order.slaHoursRemaining} /></p></div>
            </div>
          </div>

          {/* Line items */}
          <div className="card-pharma">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-display font-semibold text-sm">Line Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-2 text-left">SKU</th>
                  <th className="px-5 py-2 text-left">Product</th>
                  <th className="px-5 py-2 text-left">Category</th>
                  <th className="px-5 py-2 text-right">Qty</th>
                  <th className="px-5 py-2 text-right">Avail</th>
                  <th className="px-5 py-2 text-right">Unit Price</th>
                  <th className="px-5 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.product.sku} className="border-b border-border">
                    <td className="px-5 py-3 font-mono text-xs">{item.product.sku}</td>
                    <td className="px-5 py-3">
                      <span>{item.product.name}</span>
                      {item.product.schedule && (
                        <span className="pill-schedule ml-2 text-[10px]">Schedule {item.product.schedule}</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><ProductTypePill type={item.product.category} /></td>
                    <td className="px-5 py-3 text-right font-mono">{item.qtyOrdered}</td>
                    <td className="px-5 py-3 text-right font-mono">
                      <span className={item.qtyAvailable < item.qtyOrdered ? 'text-danger font-semibold' : ''}>{item.qtyAvailable}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">${item.product.unitPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">${item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit log */}
          <div className="card-pharma">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-display font-semibold text-sm">Activity Log</h3>
            </div>
            <div className="p-5 space-y-3">
              {order.auditLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm">{entry.action}</p>
                    <p className="text-xs text-muted-foreground font-mono">{format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score breakdown */}
          <div className="card-pharma p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Priority Score Breakdown</h3>
            <div className="text-center mb-4">
              <span className="text-4xl font-mono font-bold">{breakdown.total}</span>
              <PriorityBadge score={breakdown.total} level={breakdown.level} />
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

          {/* Customer info */}
          <div className="card-pharma p-5">
            <h3 className="font-display font-semibold text-sm mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{order.account.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className="font-medium">Tier {order.account.tier}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right text-xs">{order.account.address}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Manager</span><span className="font-medium">{order.account.accountManager}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Orders YTD</span><span className="font-mono">{order.account.totalOrdersYTD}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg Value</span><span className="font-mono">${order.account.avgOrderValue.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Stock status */}
          <div className="card-pharma p-5">
            <h3 className="font-display font-semibold text-sm mb-3">Stock Status</h3>
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
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.product.daysOfSupply} days supply · Reorder at {item.product.reorderPoint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="btn-pharma w-full gap-2"><ChevronRight className="h-4 w-4" /> Move to Next Stage</button>
            <button className="btn-pharma-outline w-full gap-2"><UserPlus className="h-4 w-4" /> Reassign</button>
            <button className="btn-pharma-outline w-full gap-2"><Flag className="h-4 w-4" /> Escalate</button>
            <button className="btn-pharma-outline w-full gap-2"><MessageSquare className="h-4 w-4" /> Add Note</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
