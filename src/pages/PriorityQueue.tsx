import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders } from '@/data/demo';
import { Search, MoreHorizontal } from 'lucide-react';
import type { ProductType, OrderStatus } from '@/types';
import { getLevel } from '@/utils/priorityScore';

const stageActions: Record<OrderStatus, string> = {
  'Incoming': 'Review',
  'Verified': 'Pick Now',
  'Picking': 'Complete',
  'Compliance Check': 'Review',
  'Ready to Ship': 'Confirm',
  'Shipped': 'View',
};

export default function PriorityQueue() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'All'>('All');
  const [slaFilter, setSlaFilter] = useState<string>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    let result = [...demoOrders];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o => o.id.toLowerCase().includes(s) || o.account.name.toLowerCase().includes(s));
    }
    if (typeFilter !== 'All') result = result.filter(o => o.productType === typeFilter);
    if (slaFilter === 'Breached') result = result.filter(o => o.slaHoursRemaining <= 0);
    else if (slaFilter === 'Due Today') result = result.filter(o => o.slaHoursRemaining > 0 && o.slaHoursRemaining <= 8);
    else if (slaFilter === 'Due Tomorrow') result = result.filter(o => o.slaHoursRemaining > 8 && o.slaHoursRemaining <= 32);
    if (levelFilter !== 'All') result = result.filter(o => o.priority.level === levelFilter);

    result.sort((a, b) => b.priority.total - a.priority.total);
    return result;
  }, [search, typeFilter, slaFilter, levelFilter]);

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MED: 0, LOW: 0 };
    demoOrders.forEach(o => { if (o.priority.level in c) (c as any)[o.priority.level]++; });
    return c;
  }, []);

  return (
    <AppLayout title="Priority Queue">
      {/* Summary chips — clickable filters */}
      <div className="flex gap-3 mb-5">
        {([['CRITICAL', counts.CRITICAL, '🔴'], ['HIGH', counts.HIGH, '🟠'], ['MED', counts.MED, '🟡'], ['LOW', counts.LOW, '⚪']] as const).map(([l, c, e]) => (
          <button
            key={l}
            onClick={() => setLevelFilter(levelFilter === l ? 'All' : l)}
            className={`card-pharma-compact px-4 py-2.5 flex items-center gap-2 text-sm transition-all cursor-pointer hover:shadow-elevated ${
              levelFilter === l ? 'ring-2 ring-primary' : ''
            }`}
          >
            <span>{e}</span>
            <span className="font-semibold font-mono">{c}</span>
            <span className="text-muted-foreground">{l.charAt(0) + l.slice(1).toLowerCase()}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card-pharma-compact p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card transition-colors">
          <option value="All">All Types</option>
          <option value="OTC">OTC</option>
          <option value="Controlled">Controlled</option>
          <option value="Device">Device</option>
        </select>
        <select value={slaFilter} onChange={e => setSlaFilter(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card transition-colors">
          <option value="All">All SLA</option>
          <option>Breached</option>
          <option>Due Today</option>
          <option>Due Tomorrow</option>
        </select>
      </div>

      {/* Table — 5 columns */}
      <div className="card-pharma-compact overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Assigned</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr
                key={order.id}
                className="border-b border-border hover:bg-accent/50 transition-colors"
                style={{ height: 72 }}
              >
                <td className="px-5 py-4">
                  <PriorityBadge score={order.priority.total} level={order.priority.level} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{order.id}</span>
                    <ProductTypePill type={order.productType} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{order.account.name}</div>
                </td>
                <td className="px-5 py-4">
                  <StatusPill status={order.status} />
                  <div className="mt-1">
                    <SlaCountdown hours={order.slaHoursRemaining} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {order.assignedUser && (
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xs font-bold flex-shrink-0">
                        {order.assignedUser.initials}
                      </div>
                    )}
                    <span className="text-sm">{order.assignedTo}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                      className="btn-pharma text-xs py-1.5 px-3"
                    >
                      {stageActions[order.status]}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
