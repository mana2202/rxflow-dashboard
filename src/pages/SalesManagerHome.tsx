import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { demoOrders, demoAccounts } from '@/data/demo';
import { format } from 'date-fns';
import type { Account } from '@/types';

const tierLabel: Record<number, string> = { 1: 'VIP', 2: 'Standard', 3: 'Basic' };
const tierStyle: Record<number, string> = {
  1: 'bg-warning-tint text-warning-text',
  2: 'bg-info-tint text-info-text',
  3: 'bg-muted text-muted-foreground',
};

export default function SalesManagerHome() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(demoAccounts[0].id);

  const accountOrders = useMemo(() =>
    demoOrders.filter(o => o.accountId === selectedAccountId),
  [selectedAccountId]);

  const selectedAccount = demoAccounts.find(a => a.id === selectedAccountId);

  return (
    <AppLayout title="My Accounts">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: account list */}
        <div className="lg:col-span-1">
          <div className="card-pharma-compact overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounts</p>
            </div>
            <div className="divide-y divide-border">
              {demoAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent ${selectedAccountId === account.id ? 'bg-accent' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <span className={`text-2xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${tierStyle[account.tier]}`}>
                      {tierLabel[account.tier]}
                    </span>
                  </div>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    {demoOrders.filter(o => o.accountId === account.id).length} orders
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: order table for selected account */}
        <div className="lg:col-span-3">
          {selectedAccount && (
            <div className="mb-4">
              <h3 className="text-xl font-bold font-display">{selectedAccount.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedAccount.address} · {selectedAccount.totalOrdersYTD} orders YTD · Avg ${selectedAccount.avgOrderValue.toLocaleString()}
              </p>
            </div>
          )}

          <div className="card-pharma-compact overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider bg-muted/40">
                  <th className="px-5 py-3 text-left">Order ID</th>
                  <th className="px-5 py-3 text-left">Products</th>
                  <th className="px-5 py-3 text-left">Channel</th>
                  <th className="px-5 py-3 text-left">Stage</th>
                  <th className="px-5 py-3 text-left">SLA / ETA</th>
                  <th className="px-5 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {accountOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No orders for this account.</td>
                  </tr>
                ) : accountOrders.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-muted-foreground">
                        {order.items.map(i => i.product.name).join(', ').slice(0, 60)}
                        {order.items.map(i => i.product.name).join(', ').length > 60 ? '…' : ''}
                      </div>
                      <div className="text-2xs text-muted-foreground mt-0.5">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-5 py-4">
                      <ChannelBadge channel={order.channel} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <SlaCountdown hours={order.slaHoursRemaining} />
                      <div className="text-2xs text-muted-foreground mt-0.5">
                        {format(new Date(order.slaDeadline), 'MMM dd, HH:mm')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold">
                      ${order.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
