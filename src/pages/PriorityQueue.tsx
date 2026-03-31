import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders } from '@/data/demo';
import { Search, Filter, Plus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ProductType, OrderStatus } from '@/types';
import { getLevel } from '@/utils/priorityScore';
import { format } from 'date-fns';

export default function PriorityQueue() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [slaFilter, setSlaFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'age' | 'sla'>('score');

  const filtered = useMemo(() => {
    let result = [...demoOrders];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o => o.id.toLowerCase().includes(s) || o.account.name.toLowerCase().includes(s));
    }
    if (typeFilter !== 'All') result = result.filter(o => o.productType === typeFilter);
    if (statusFilter !== 'All') result = result.filter(o => o.status === statusFilter);
    if (slaFilter === 'Breached') result = result.filter(o => o.slaHoursRemaining <= 0);
    else if (slaFilter === 'Due Today') result = result.filter(o => o.slaHoursRemaining > 0 && o.slaHoursRemaining <= 8);
    else if (slaFilter === 'Due Tomorrow') result = result.filter(o => o.slaHoursRemaining > 8 && o.slaHoursRemaining <= 32);

    result.sort((a, b) => {
      if (sortBy === 'score') return b.priority.total - a.priority.total;
      if (sortBy === 'sla') return a.slaHoursRemaining - b.slaHoursRemaining;
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    });
    return result;
  }, [search, typeFilter, statusFilter, slaFilter, sortBy]);

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, ROUTINE: 0 };
    demoOrders.forEach(o => { c[o.priority.level]++; });
    return c;
  }, []);

  const StockIcon = ({ ok }: { ok: boolean }) => ok
    ? <CheckCircle className="h-4 w-4 text-success" />
    : <AlertTriangle className="h-4 w-4 text-warning" />;

  return (
    <AppLayout
      title="Priority Queue"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            Live · refreshes every 60s
          </div>
          <button className="btn-pharma gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> New Order
          </button>
        </div>
      }
    >
      {/* Summary chips */}
      <div className="flex gap-3 mb-4">
        {([['CRITICAL', counts.CRITICAL, '🔴'], ['HIGH', counts.HIGH, '🟠'], ['MEDIUM', counts.MEDIUM, '🟡'], ['ROUTINE', counts.ROUTINE, '⚪']] as const).map(([l, c, e]) => (
          <div key={l} className="card-pharma px-4 py-2 flex items-center gap-2 text-sm">
            <span>{e}</span> <span className="font-semibold">{c}</span> <span className="text-muted-foreground">{l.charAt(0) + l.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-pharma p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="text-sm border border-border rounded px-3 py-1.5 bg-card">
          <option value="All">All Types</option>
          <option value="OTC">OTC</option>
          <option value="Controlled">Controlled</option>
          <option value="Device">Device</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-sm border border-border rounded px-3 py-1.5 bg-card">
          <option value="All">All Status</option>
          {['Incoming','Verified','Picking','Compliance Check','Ready to Ship','Shipped'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={slaFilter} onChange={e => setSlaFilter(e.target.value)} className="text-sm border border-border rounded px-3 py-1.5 bg-card">
          <option value="All">All SLA</option>
          <option>Breached</option>
          <option>Due Today</option>
          <option>Due Tomorrow</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm border border-border rounded px-3 py-1.5 bg-card">
          <option value="score">Sort: Priority Score</option>
          <option value="age">Sort: Order Age</option>
          <option value="sla">Sort: SLA Deadline</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-pharma overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3"><PriorityBadge score={order.priority.total} level={order.priority.level} /></td>
                <td className="px-4 py-3 font-mono text-xs font-medium">{order.id}</td>
                <td className="px-4 py-3">
                  <div>{order.account.name}</div>
                  <div className="text-xs text-muted-foreground">Tier {order.account.tier}</div>
                </td>
                <td className="px-4 py-3"><ProductTypePill type={order.productType} /></td>
                <td className="px-4 py-3 font-mono text-xs">{order.itemCount}</td>
                <td className="px-4 py-3 font-mono text-xs">${order.orderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-muted-foreground">{format(new Date(order.slaDeadline), 'MMM dd, HH:mm')}</div>
                  <SlaCountdown hours={order.slaHoursRemaining} />
                </td>
                <td className="px-4 py-3"><StockIcon ok={!order.hasStockRisk} /></td>
                <td className="px-4 py-3 text-xs">{order.assignedTo}</td>
                <td className="px-4 py-3"><StatusPill status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
