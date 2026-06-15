import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders } from '@/data/demo';
import { useAuth } from '@/context/AuthContext';
import type { OrderStatus } from '@/types';

const stageActions: Record<OrderStatus, string> = {
  { hauler: 'FedEx Express', zone: 'NE-01', time: '10:30 AM', orderCount: 8, confirmed: true },
  { hauler: 'UPS Medical', zone: 'NE-02', time: '12:00 PM', orderCount: 5, confirmed: true },
  { hauler: 'FedEx Ground', zone: 'NE-03', time: '2:30 PM', orderCount: 12, confirmed: false },
  { hauler: 'UPS Standard', zone: 'NE-01', time: '4:00 PM', orderCount: 6, confirmed: false },
  { hauler: 'USPS Priority', zone: 'NE-04', time: '5:00 PM', orderCount: 3, confirmed: false },
];

function getPriorityBorderColor(level: string) {
  switch (level) {
    case 'CRITICAL': return 'border-l-red-500';
    case 'HIGH': return 'border-l-orange-500';
    case 'MEDIUM': return 'border-l-amber-400';
    default: return 'border-l-gray-400';
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const needsAction = useMemo(() => {
    return demoOrders
      .filter(o => o.status !== 'Shipped' && o.assignedTo === currentUser.name)
      .sort((a, b) => b.priority.total - a.priority.total)
      .slice(0, 8);
  }, [currentUser.name]);

  const stageCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {} as any;
    pipelineStages.forEach(s => { counts[s] = 0; });
    demoOrders.forEach(o => { counts[o.status]++; });
    return counts;
  }, []);

  // Find bottleneck stage (highest count relative to neighbors)
  const bottleneckStage = useMemo(() => {
    let maxRatio = 0;
    let bottleneck = '';
    pipelineStages.forEach((stage, i) => {
      const count = stageCounts[stage];
      const prev = i > 0 ? stageCounts[pipelineStages[i - 1]] : count;
      const next = i < pipelineStages.length - 1 ? stageCounts[pipelineStages[i + 1]] : count;
      const avg = (prev + next) / 2;
      const ratio = avg > 0 ? count / avg : count;
      if (ratio > maxRatio && stage !== 'Shipped') {
        maxRatio = ratio;
        bottleneck = stage;
      }
    });
    return bottleneck;
  }, [stageCounts]);

  return (
    <AppLayout>
      {/* Section 1 — Needs Action */}
      <section className="mb-10">
        <h2 className="section-heading">Needs Action</h2>
        {needsAction.length === 0 ? (
          <div className="card-pharma flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-muted-foreground text-lg">You're all caught up.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {needsAction.map(order => (
              <div
                key={order.id}
                className={`card-pharma-compact flex-shrink-0 w-[360px] border-l-4 ${getPriorityBorderColor(order.priority.level)} p-5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <PriorityBadge score={order.priority.total} level={order.priority.level} />
                  <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                </div>
                <p className="text-lg font-semibold mb-2">{order.account.name}</p>
                <div className="flex items-center gap-2 mb-2">
                  <ProductTypePill type={order.productType} />
                  <StatusPill status={order.status} />
                </div>
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">Due in </span>
                  <SlaCountdown hours={order.slaHoursRemaining} />
                </div>
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
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Today's Pickups */}
      <section className="mb-10">
        <h2 className="section-heading">Today's Pickups</h2>
        <div className="card-pharma-compact overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Hauler / Carrier</th>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Scheduled Time</th>
                <th className="px-6 py-4">Order Count</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium">{p.hauler}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{p.zone}</td>
                  <td className="px-6 py-4 font-mono text-sm">{p.time}</td>
                  <td className="px-6 py-4 font-mono text-sm">{p.orderCount}</td>
                  <td className="px-6 py-4 text-right">
                    {p.confirmed ? (
                      <span className="pill bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
                      </span>
                    ) : (
                      <button className="btn-pharma text-xs py-1.5 px-3">Confirm</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 — Pipeline Snapshot */}
      <section>
        <h2 className="section-heading">Pipeline Snapshot</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {pipelineStages.map((stage, i) => {
            const count = stageCounts[stage];
            const isBottleneck = stage === bottleneckStage;
            return (
              <div key={stage} className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/pipeline')}
                  className={`card-pharma-compact px-4 py-3 flex items-center gap-2 text-sm font-medium transition-all hover:shadow-elevated cursor-pointer ${
                    isBottleneck ? 'ring-2 ring-warning bg-warning/5' : ''
                  }`}
                >
                  {stage}
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                    isBottleneck ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
                {i < pipelineStages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}
