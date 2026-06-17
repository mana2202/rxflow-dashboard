import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { demoOrders } from '@/data/demo';
import { computePriorityScore, getLevel } from '@/utils/priorityScore';
import type { PriorityWeights } from '@/utils/priorityScore';
import { CheckCircle, AlertTriangle, Wifi } from 'lucide-react';

const tabs = ['Team', 'SLA Rules', 'Priority Weights', 'Integrations', 'Audit Log'] as const;

const slaRules = [
  { productType: 'OTC', tier: 1, sla: '4 hrs' },
  { productType: 'OTC', tier: 2, sla: '12 hrs' },
  { productType: 'OTC', tier: 3, sla: '48 hrs' },
  { productType: 'Controlled', tier: 1, sla: '2 hrs' },
  { productType: 'Controlled', tier: 2, sla: '6 hrs' },
  { productType: 'Controlled', tier: 3, sla: '24 hrs' },
  { productType: 'Device', tier: 1, sla: '4 hrs' },
  { productType: 'Device', tier: 2, sla: '12 hrs' },
  { productType: 'Device', tier: 3, sla: '36 hrs' },
];

const integrations = [
  { name: 'ERP System (SAP)', status: 'connected', statusText: 'Connected · Last sync 2m ago' },
  { name: 'DEA CSOS', status: 'connected', statusText: 'Connected · Verified' },
  { name: 'Carrier API — FedEx', status: 'connected', statusText: 'Connected · Active' },
  { name: 'Carrier API — UPS', status: 'connected', statusText: 'Connected · Active' },
  { name: 'EHR Bridge', status: 'warning', statusText: 'Warning — Last sync 6hrs ago' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Priority Weights');
  const [weights, setWeights] = useState<PriorityWeights>({ urgency: 40, slaProximity: 30, stockRisk: 20, customerTier: 10 });

  const totalWeights = weights.urgency + weights.slaProximity + weights.stockRisk + weights.customerTier;

  const top5Reranked = useMemo(() => {
    return [...demoOrders]
      .map(o => {
        const newPriority = computePriorityScore({
          isUrgent: o.isUrgent,
          slaHoursRemaining: o.slaHoursRemaining,
          hasStockRisk: o.hasStockRisk,
          customerTier: o.account.tier,
        }, weights);
        return { ...o, newPriority: newPriority };
      })
      .sort((a, b) => b.newPriority.total - a.newPriority.total)
      .slice(0, 5);
  }, [weights]);

  const handleSlider = (key: keyof PriorityWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppLayout title="Settings">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Team' && (
        <div className="card-pharma p-5">
          <p className="text-sm text-muted-foreground">Team management coming soon.</p>
        </div>
      )}

      {activeTab === 'SLA Rules' && (
        <div className="card-pharma overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Product Type</th>
                <th className="px-5 py-3 text-left">Customer Tier</th>
                <th className="px-5 py-3 text-left">SLA Target</th>
              </tr>
            </thead>
            <tbody>
              {slaRules.map((r, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-5 py-3">{r.productType}</td>
                  <td className="px-5 py-3">Tier {r.tier}</td>
                  <td className="px-5 py-3 font-mono">{r.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Priority Weights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-pharma p-5">
            <h3 className="font-display font-semibold text-sm mb-1">Weight Configuration</h3>
            <p className="text-xs text-muted-foreground mb-6">Adjust weights to change priority scoring. Total should equal 100.</p>

            <div className="space-y-5">
              {([
                { key: 'urgency' as const, label: 'Urgency', max: 60 },
                { key: 'slaProximity' as const, label: 'SLA Proximity', max: 50 },
                { key: 'stockRisk' as const, label: 'Stock Risk', max: 40 },
                { key: 'customerTier' as const, label: 'Customer Tier', max: 30 },
              ]).map(item => (
                <div key={item.key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono font-semibold">{weights[item.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={item.max}
                    value={weights[item.key]}
                    onChange={e => handleSlider(item.key, parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>

            <div className={`mt-6 p-3 rounded text-sm font-mono font-semibold text-center ${
              totalWeights === 100 ? 'bg-success-tint text-success' : 'bg-danger-tint text-danger'
            }`}>
              Total: {totalWeights} / 100
            </div>
          </div>

          <div className="card-pharma p-5">
            <h3 className="font-display font-semibold text-sm mb-1">Live Reranking Preview</h3>
            <p className="text-xs text-muted-foreground mb-4">Top 5 orders with new weights applied</p>
            <div className="space-y-3">
              {top5Reranked.map((order, i) => (
                <div key={order.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <PriorityBadge score={order.newPriority.total} level={order.newPriority.level} />
                    </div>
                    <p className="text-sm truncate">{order.account.name}</p>
                    <div className="flex gap-4 text-2xs text-muted-foreground font-mono mt-1">
                      <span>U:{order.newPriority.urgency}</span>
                      <span>S:{order.newPriority.slaProximity}</span>
                      <span>K:{order.newPriority.stockRisk}</span>
                      <span>T:{order.newPriority.customerTier}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-mono font-bold">{order.newPriority.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map(int => (
            <div key={int.name} className="card-pharma p-5">
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-sm">{int.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                {int.status === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <span className={`text-xs ${int.status === 'connected' ? 'text-success' : 'text-warning'}`}>
                  {int.statusText}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Audit Log' && (
        <div className="card-pharma p-5">
          <p className="text-sm text-muted-foreground">System audit log coming soon.</p>
        </div>
      )}
    </AppLayout>
  );
}
