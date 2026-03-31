import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders, demoAccounts } from '@/data/demo';
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

export default function IncomingOrders() {
  const incoming = useMemo(() =>
    demoOrders.filter(o => o.status === 'Incoming').sort((a, b) => b.priority.total - a.priority.total),
  []);

  const byAccount = useMemo(() => {
    const map = new Map<string, typeof incoming>();
    incoming.forEach(o => {
      const arr = map.get(o.accountId) || [];
      arr.push(o);
      map.set(o.accountId, arr);
    });
    return Array.from(map.entries()).map(([accId, orders]) => ({
      account: demoAccounts.find(a => a.id === accId)!,
      orders,
      totalValue: orders.reduce((s, o) => s + o.orderValue, 0),
      highestPriority: Math.max(...orders.map(o => o.priority.total)),
    }));
  }, [incoming]);

  const [expanded, setExpanded] = useState<string | null>(byAccount[0]?.account.id ?? null);
  const [selectedOrder, setSelectedOrder] = useState(incoming[0] ?? null);

  const totalPending = incoming.length;
  const totalValue = incoming.reduce((s, o) => s + o.orderValue, 0);

  return (
    <AppLayout title="Incoming Orders">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">New Orders Today</p>
          <p className="text-2xl font-bold font-mono">47</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Pending Confirmation</p>
          <p className="text-2xl font-bold font-mono">{totalPending}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-muted-foreground">Total Value Pending</p>
          <p className="text-2xl font-bold font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - accounts list */}
        <div className="card-pharma">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-display font-semibold text-sm">Orders by Account</h3>
          </div>
          <div>
            {byAccount.map(({ account, orders, totalValue, highestPriority }) => (
              <div key={account.id} className="border-b border-border">
                <button
                  onClick={() => setExpanded(expanded === account.id ? null : account.id)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {expanded === account.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{orders.length} orders · ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                  <PriorityBadge score={highestPriority} level={orders[0].priority.level} />
                </button>
                {expanded === account.id && (
                  <div className="bg-accent/30">
                    {orders.map(order => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full flex items-center justify-between px-8 py-2.5 text-left hover:bg-accent transition-colors ${selectedOrder?.id === order.id ? 'bg-accent' : ''}`}
                      >
                        <div>
                          <span className="font-mono text-xs">{order.id}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ProductTypePill type={order.productType} />
                            <span className="text-xs text-muted-foreground font-mono">${order.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                        <SlaCountdown hours={order.slaHoursRemaining} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right - preview */}
        <div className="card-pharma p-5">
          {selectedOrder ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-mono text-lg font-bold">{selectedOrder.id}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.account.name}</p>
                </div>
                <PriorityBadge score={selectedOrder.priority.total} level={selectedOrder.priority.level} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-muted-foreground text-xs">Tier</span><p className="font-medium">Tier {selectedOrder.account.tier}</p></div>
                <div><span className="text-muted-foreground text-xs">Channel</span><p className="font-medium">{selectedOrder.channel}</p></div>
                <div><span className="text-muted-foreground text-xs">Items</span><p className="font-mono">{selectedOrder.itemCount}</p></div>
                <div><span className="text-muted-foreground text-xs">Value</span><p className="font-mono">${selectedOrder.orderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Line Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.product.sku} className="flex justify-between text-sm">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{item.product.sku}</span>
                        {item.product.name}
                      </div>
                      <span className="font-mono">{item.qtyOrdered} × ${item.product.unitPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-pharma w-full gap-2 mt-4">
                <CheckCircle className="h-4 w-4" /> Confirm & Route to Fulfillment
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an order to preview</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
