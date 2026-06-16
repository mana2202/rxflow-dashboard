import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StageBadgeFromStatus } from '@/components/StageBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders, demoAccounts } from '@/data/demo';
import type { Account } from '@/types';

const tierLabel: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };
const tierStyle: Record<number, string> = {
  1: 'bg-[#FDEAE9] text-[#7A1F1A] border border-[#C3332B]',
  2: 'bg-[#E7EDFC] text-[#1A3D7A] border border-[#2A5ECF]',
  3: 'bg-muted text-muted-foreground border border-border',
};

export default function SalesDashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(demoAccounts[0].id);

  const accountsWithCounts = useMemo(() => {
    return demoAccounts.map(a => ({
      ...a,
      activeOrders: demoOrders.filter(o => o.accountId === a.id && o.status !== 'Shipped').length,
      totalOrders: demoOrders.filter(o => o.accountId === a.id).length,
    }));
  }, []);

  const accountOrders = useMemo(() => {
    return demoOrders
      .filter(o => o.accountId === selectedAccountId)
      .sort((a, b) => b.priority.total - a.priority.total);
  }, [selectedAccountId]);

  const selectedAccount = demoAccounts.find(a => a.id === selectedAccountId)!;

  return (
    <AppLayout>
      <div className="flex gap-6">
        {/* Account list */}
        <div className="w-72 flex-shrink-0">
          <h2 className="section-heading">Accounts</h2>
          <div className="space-y-2">
            {accountsWithCounts.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAccountId(a.id)}
                className={[
                  'w-full text-left p-3 rounded-xl border transition-colors',
                  selectedAccountId === a.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-accent',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold leading-tight">{a.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${tierStyle[a.tier]}`}>
                    {tierLabel[a.tier]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{a.activeOrders} active</span>
                  <span>·</span>
                  <span>{a.totalOrders} total</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Orders for selected account */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-heading !mb-0">{selectedAccount.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedAccount.address} · {tierLabel[selectedAccount.tier]} · Manager: {selectedAccount.accountManager}
              </p>
            </div>
          </div>

          {accountOrders.length === 0 ? (
            <div className="card-pharma text-center py-12">
              <p className="text-muted-foreground">No orders for this account.</p>
            </div>
          ) : (
            <div className="card-pharma-compact overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Order ID</th>
                    <th className="px-5 py-3 text-left">Products</th>
                    <th className="px-5 py-3 text-left">Stage</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">ETA / SLA</th>
                    <th className="px-5 py-3 text-right font-mono">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {accountOrders.map(o => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {o.items.slice(0, 2).map(i => (
                            <span key={i.product.sku} className="text-[12px] leading-snug truncate max-w-[200px]">{i.product.name}</span>
                          ))}
                          {o.items.length > 2 && (
                            <span className="text-[11px] text-muted-foreground">+{o.items.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4"><StageBadgeFromStatus status={o.status} /></td>
                      <td className="px-5 py-4"><ProductTypePill type={o.productType} /></td>
                      <td className="px-5 py-4">
                        <SlaCountdown hours={o.slaHoursRemaining} />
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm">
                        ${o.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
