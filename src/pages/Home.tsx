import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { AgingCard } from '@/components/AgingCard';
import { demoOrders } from '@/data/demo';
import { computeAging } from '@/utils/aging';
import { CheckCircle, ArrowRight, Package2, Clock, Truck, Zap, ShieldX, AlertTriangle } from 'lucide-react';
import type { OrderStatus } from '@/types';

const stageActions: Record<OrderStatus, string> = {
  'Incoming': 'Review Order',
  'Verified': 'Start Picking',
  'Picking': 'Complete Picking',
  'Compliance Check': 'Begin Compliance Check',
  'Ready to Ship': 'Confirm Shipment',
  'Shipped': 'View Details',
};

function minutesSinceEntry(enteredQueueAt?: string): number {
  if (!enteredQueueAt) return 0;
  return Math.floor((Date.now() - new Date(enteredQueueAt).getTime()) / 60000);
}

export default function Home() {
  const navigate = useNavigate();

  const needsAction = useMemo(() => {
    return demoOrders
      .filter(o =>
        o.status !== 'Shipped' && (
          o.priority.level === 'CRITICAL' ||
          o.complianceStatus === 'Blocked' ||
          o.stockConflict === true ||
          minutesSinceEntry(o.enteredQueueAt) >= 60
        )
      )
      .sort((a, b) => {
        const agingRank = { critical: 0, warning: 1, fresh: 2 };
        const aAging = computeAging(a.enteredQueueAt);
        const bAging = computeAging(b.enteredQueueAt);
        const rankDiff = agingRank[aAging.state] - agingRank[bAging.state];
        if (rankDiff !== 0) return rankDiff;
        return b.priority.total - a.priority.total;
      });
  }, []);

  const conflictGroups = useMemo(() => {
    const conflicting = needsAction.filter(o => o.stockConflict);
    if (conflicting.length < 2) return [];
    const groups: Array<{ sku: string; skuName: string; orders: typeof conflicting }> = [];
    const seen = new Set<string>();
    conflicting.forEach(o => {
      o.items.forEach(it => {
        if (seen.has(it.product.sku)) return;
        const sharing = conflicting.filter(x => x.id !== o.id && x.items.some(i => i.product.sku === it.product.sku));
        if (sharing.length > 0) {
          seen.add(it.product.sku);
          groups.push({ sku: it.product.sku, skuName: it.product.name, orders: [o, ...sharing] });
        }
      });
    });
    return groups;
  }, [needsAction]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats = useMemo(() => {
    const ordersToday = demoOrders.filter(o => new Date(o.orderDate) >= today).length;
    const slaAtRisk = demoOrders.filter(o => o.status !== 'Shipped' && o.slaHoursRemaining < 48 && o.slaHoursRemaining > 0).length;
    const dispatched = demoOrders.filter(o => (o.status === 'Shipped' || o.status === 'Ready to Ship') && new Date(o.orderDate) >= today).length;
    return { ordersToday, needsActionCount: needsAction.length, slaAtRisk, dispatched };
  }, [needsAction.length]);

  const todayDeliveries = useMemo(() => {
    return demoOrders
      .filter(o => o.status === 'Ready to Ship' || o.status === 'Shipped')
      .slice(0, 6);
  }, []);

  return (
    <AppLayout>
      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders today', value: stats.ordersToday, icon: Package2, accent: '' },
          { label: 'Needs action', value: stats.needsActionCount, icon: Zap, accent: stats.needsActionCount > 0 ? 'text-danger' : '' },
          { label: 'SLA at risk', value: stats.slaAtRisk, icon: Clock, accent: stats.slaAtRisk > 0 ? 'text-warning' : '' },
          { label: 'Dispatched', value: stats.dispatched, icon: Truck, accent: 'text-success' },
        ].map(s => (
          <div key={s.label} className="card-pharma flex items-center gap-4">
            <s.icon className={`h-8 w-8 shrink-0 ${s.accent || 'text-muted-foreground'}`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`kpi-number ${s.accent}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Action */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="section-heading !mb-0">Needs Action</h2>
          {needsAction.length > 0 && (
            <span className="h-6 min-w-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center font-mono">
              {needsAction.length}
            </span>
          )}
        </div>

        {conflictGroups.map(g => (
          <div key={g.sku} className="mb-3 p-3 rounded-lg bg-warning-tint border border-warning/30 flex items-start gap-2 text-sm text-warning-text">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Stock conflict — {g.skuName}: </span>
              <span>{g.orders[0].items.find(i => i.product.sku === g.sku)?.product.currentStock ?? '?'} units available. {g.orders.length} orders competing.</span>
            </div>
          </div>
        ))}

        {needsAction.length === 0 ? (
          <div className="card-pharma flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-muted-foreground text-lg">You're all caught up.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {needsAction.map(order => (
              <AgingCard key={order.id} enteredQueueAt={order.enteredQueueAt}>
                {({ aging, transitionClass }) => (
                  <div className={`card-pharma-compact flex-shrink-0 w-[360px] border-l-4 p-5 ${aging.cardClass} ${transitionClass}`}>
                    <div className="flex items-center justify-between mb-2">
                      <PriorityBadge score={order.priority.total} level={order.priority.level} />
                      <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    </div>
                    <p className="text-lg font-semibold mb-2">{order.account.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <ProductTypePill type={order.productType} />
                      <StatusPill status={order.status} />
                    </div>
                    <div className="mb-1">
                      <span className="text-sm text-muted-foreground">Due in </span>
                      <SlaCountdown hours={order.slaHoursRemaining} />
                    </div>
                    {aging.timerLabel && (
                      <p className={`aging-timer text-2xs mb-3 ${aging.state === 'critical' ? 'text-danger' : 'text-warning-text'}`}>
                        {aging.timerLabel}
                      </p>
                    )}
                    {order.complianceStatus === 'Blocked' && (
                      <p className="text-2xs text-danger mb-3 font-semibold inline-flex items-center gap-1">
                        <ShieldX className="h-3 w-3" /> Compliance blocked
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="btn-pharma flex-1 text-xs gap-1.5"
                      >
                        {stageActions[order.status]} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="btn-pharma-outline text-xs"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                )}
              </AgingCard>
            ))}
          </div>
        )}
      </section>

      {/* Today's Deliveries */}
      <section className="mb-10">
        <h2 className="section-heading">Today's Deliveries</h2>
        <div className="card-pharma-compact overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">SLA</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayDeliveries.map(o => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold">{o.id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{o.account.name}</td>
                  <td className="px-6 py-4">
                    <ProductTypePill type={o.productType} />
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">${o.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-6 py-4 text-sm">
                    <SlaCountdown hours={o.slaHoursRemaining} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}
