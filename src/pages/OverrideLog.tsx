import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { demoOrders } from '@/data/demo';
import { format, subDays } from 'date-fns';
import type { OverrideReason, OverrideDirection } from '@/types';

const REASON_LABELS: Record<OverrideReason, string> = {
  client_relationship:  'Client Relationship',
  stock_emergency:      'Stock Emergency',
  compliance_exception: 'Compliance Exception',
  ops_judgment:         'Ops Judgment',
};

const REASON_COLORS: Record<OverrideReason, string> = {
  client_relationship:  'bg-info-tint text-info-text',
  stock_emergency:      'bg-warning-tint text-warning-text',
  compliance_exception: 'bg-danger-tint text-danger-text',
  ops_judgment:         'bg-muted text-muted-foreground',
};

type FilterTab = 'all' | OverrideReason;

export default function OverrideLog() {
  const [tab, setTab] = useState<FilterTab>('all');

  // Aggregate all override records from all orders
  const allOverrides = useMemo(() => {
    const records: Array<{
      orderId: string;
      client: string;
      changedBy: string;
      fromScore: number;
      fromLevel: string;
      toScore: number;
      toLevel: string;
      direction: OverrideDirection;
      reasonCode: OverrideReason;
      timestamp: string;
      impact: string;
    }> = [];
    demoOrders.forEach(o => {
      (o.overrides ?? []).forEach(rec => {
        records.push({
          orderId: o.id,
          client: o.account.name,
          changedBy: rec.changedBy,
          fromScore: rec.fromScore,
          fromLevel: rec.fromLevel,
          toScore: rec.toScore,
          toLevel: rec.toLevel,
          direction: rec.direction,
          reasonCode: rec.reasonCode,
          timestamp: rec.timestamp,
          impact: rec.impact,
        });
      });
    });
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const filtered = tab === 'all' ? allOverrides : allOverrides.filter(r => r.reasonCode === tab);

  // Summary stats
  const weekAgo = subDays(new Date(), 7);
  const thisWeek = allOverrides.filter(r => new Date(r.timestamp) >= weekAgo);
  const mostCommonReason = (() => {
    if (!allOverrides.length) return '—';
    const counts: Partial<Record<OverrideReason, number>> = {};
    allOverrides.forEach(r => { counts[r.reasonCode] = (counts[r.reasonCode] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1]! - a[1]!)[0];
    return top ? REASON_LABELS[top[0] as OverrideReason] : '—';
  })();
  const avgScoreChange = allOverrides.length
    ? Math.round(allOverrides.reduce((s, r) => s + Math.abs(r.toScore - r.fromScore), 0) / allOverrides.length)
    : 0;
  const affectedOrders = new Set(allOverrides.map(r => r.orderId)).size;

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: 'all', label: 'All overrides' },
    { key: 'client_relationship', label: 'Client Relationship' },
    { key: 'stock_emergency', label: 'Stock Emergency' },
    { key: 'compliance_exception', label: 'Compliance Exception' },
    { key: 'ops_judgment', label: 'Ops Judgment' },
  ];

  return (
    <AppLayout title="Override Log">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-full border transition-all ${tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
          >
            {t.label}
            {t.key !== 'all' && (
              <span className="ml-2 font-mono text-2xs opacity-70">
                {allOverrides.filter(r => r.reasonCode === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-pharma-compact overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-2xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left">Order ID</th>
              <th className="px-5 py-3 text-left">Client</th>
              <th className="px-5 py-3 text-left">Changed by</th>
              <th className="px-5 py-3 text-center">From</th>
              <th className="px-5 py-3 text-center">To</th>
              <th className="px-5 py-3 text-left">Reason</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">Impact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  No override records yet. Priority overrides appear here after ops managers apply them in Order Detail.
                </td>
              </tr>
            ) : filtered.map((rec, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 font-mono text-xs">{rec.orderId}</td>
                <td className="px-5 py-3">{rec.client}</td>
                <td className="px-5 py-3 text-sm">{rec.changedBy}</td>
                <td className="px-5 py-3 text-center font-mono">
                  <span className="text-xs">{rec.fromScore}</span>
                  <span className="block text-2xs text-muted-foreground">{rec.fromLevel}</span>
                </td>
                <td className="px-5 py-3 text-center font-mono">
                  <span className={`text-xs font-semibold ${rec.direction === 'escalate' ? 'text-danger' : 'text-muted-foreground'}`}>
                    {rec.toScore}
                  </span>
                  <span className="block text-2xs text-muted-foreground">{rec.toLevel}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium ${REASON_COLORS[rec.reasonCode]}`}>
                    {REASON_LABELS[rec.reasonCode]}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                  {format(new Date(rec.timestamp), 'MMM dd, HH:mm')}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground max-w-[200px]">{rec.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overrides this week', value: thisWeek.length },
          { label: 'Most common reason', value: mostCommonReason, small: true },
          { label: 'Avg score change', value: allOverrides.length ? `±${avgScoreChange}` : '—' },
          { label: 'Orders affected', value: affectedOrders },
        ].map(s => (
          <div key={s.label} className="card-pharma text-center">
            <p className="kpi-number">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
