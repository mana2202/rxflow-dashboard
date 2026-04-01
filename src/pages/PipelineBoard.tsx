import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders } from '@/data/demo';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';

const columns: OrderStatus[] = ['Incoming', 'Verified', 'Picking', 'Compliance Check', 'Ready to Ship', 'Shipped'];

const columnColors: Record<OrderStatus, string> = {
  'Incoming': 'border-t-gray-400',
  'Verified': 'border-t-blue-500',
  'Picking': 'border-t-amber-500',
  'Compliance Check': 'border-t-red-500',
  'Ready to Ship': 'border-t-green-500',
  'Shipped': 'border-t-teal-500',
};

function getPriorityBorderColor(level: string) {
  switch (level) {
    case 'CRITICAL': return 'border-l-red-500';
    case 'HIGH': return 'border-l-orange-500';
    case 'MEDIUM': return 'border-l-amber-400';
    default: return 'border-l-gray-400';
  }
}

export default function PipelineBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([...demoOrders]);
  const [dragId, setDragId] = useState<string | null>(null);

  const getColumnOrders = (status: OrderStatus) =>
    orders.filter(o => o.status === status).sort((a, b) => b.priority.total - a.priority.total);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    if (!dragId) return;
    setOrders(prev => prev.map(o => o.id === dragId ? { ...o, status: targetStatus } : o));
    setDragId(null);
  };

  const moveForward = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = columns.indexOf(o.status);
      if (idx < columns.length - 1) return { ...o, status: columns[idx + 1] };
      return o;
    }));
  };

  return (
    <AppLayout title="Order Pipeline">
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {columns.map(col => {
          const colOrders = getColumnOrders(col);
          const totalValue = colOrders.reduce((s, o) => s + o.orderValue, 0);
          return (
            <div
              key={col}
              className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col)}
            >
              {/* Column header */}
              <div className={`card-pharma-compact p-4 mb-3 border-t-2 ${columnColors[col]}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{colOrders.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="flex-1 space-y-2">
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={e => handleDragStart(e, order.id)}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`card-pharma-compact p-0 cursor-grab active:cursor-grabbing transition-all hover:shadow-elevated border-l-[3px] ${getPriorityBorderColor(order.priority.level)} group ${dragId === order.id ? 'opacity-50' : ''}`}
                  >
                    {/* DEA banner */}
                    {col === 'Compliance Check' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-foreground bg-danger px-3 py-1.5 rounded-tr-xl">
                        <AlertTriangle className="h-3 w-3" /> DEA Review Required
                      </div>
                    )}

                    <div className="p-3">
                      <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                      <p className="text-sm font-semibold mt-1">{order.account.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <ProductTypePill type={order.productType} />
                        <SlaCountdown hours={order.slaHoursRemaining} />
                      </div>
                      {order.hasStockRisk && (
                        <div className="flex items-center gap-1 mt-2 text-warning text-xs">
                          <AlertTriangle className="h-3 w-3" /> Stock risk
                        </div>
                      )}

                      {/* Move forward button */}
                      {col !== 'Shipped' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveForward(order.id); }}
                          className="w-full mt-3 py-2 text-xs font-medium rounded border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-1.5 group-hover:border-primary/50"
                        >
                          Move Forward <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
