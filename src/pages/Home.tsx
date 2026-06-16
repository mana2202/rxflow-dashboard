import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { StatusPill } from '@/components/StatusPill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { AgingCard, AgingTimerLabel } from '@/components/AgingCard';
import { demoOrders } from '@/data/demo';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { OrderStatus } from '@/types';

const stageActions: Record<OrderStatus, string> = {
  'Incoming': 'Review Order',
  'Verified': 'Start Picking',
  'Picking': 'Complete Picking',
  'Compliance Check': 'Begin Compliance Check',
  'Ready to Ship': 'Confirm Shipment',
  'Shipped': 'View Details',
};

const pickups = [
  { hauler: 'FedEx Express', zone: 'NE-01', time: '10:30 AM', orderCount: 8, confirmed: true },
  { hauler: 'UPS Medical', zone: 'NE-02', time: '12:00 PM', orderCount: 5, confirmed: true },
  { hauler: 'FedEx Ground', zone: 'NE-03', time: '2:30 PM', orderCount: 12, confirmed: false },
  { hauler: 'UPS Standard', zone: 'NE-01', time: '4:00 PM', orderCount: 6, confirmed: false },
  { hauler: 'USPS Priority', zone: 'NE-04', time: '5:00 PM', orderCount: 3, confirmed: false },
];

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const needsAction = useMemo(() => {
    return demoOrders
      .filter(o => o.status !== 'Shipped' && o.assignedTo === currentUser.name)
      .sort((a, b) => b.priority.total - a.priority.total)
      .slice(0, 8);
  }, [currentUser.name]);

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
              <AgingCard
                key={order.id}
                enteredQueueAt={order.enteredQueueAt}
                orderDate={order.orderDate}
                className="flex-shrink-0 w-[360px] p-5"
              >
                {(aging) => (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <PriorityBadge score={order.priority.total} level={order.priority.level} showScore />
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
                    <div className="mb-4">
                      <AgingTimerLabel timerLabel={aging.timerLabel} state={aging.state} />
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
                  </>
                )}
              </AgingCard>
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
    </AppLayout>
  );
}
