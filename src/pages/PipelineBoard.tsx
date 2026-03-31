import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { demoOrders } from '@/data/demo';
import { Plus, AlertTriangle } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';

const columns: OrderStatus[] = ['Incoming', 'Verified', 'Picking', 'Compliance Check', 'Ready to Ship', 'Shipped'];

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

  return (
    <AppLayout
      title="Order Pipeline"
      actions={
        <button className="btn-pharma gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Order
        </button>
      }
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 160px)' }}>
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
              <div className="card-pharma p-3 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col}</h3>
                  <span className="pill bg-muted text-muted-foreground font-mono">{colOrders.length}</span>
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
                    className={`card-pharma p-3 cursor-grab active:cursor-grabbing hover:shadow-elevated transition-shadow ${dragId === order.id ? 'opacity-50' : ''}`}
                  >
                    {col === 'Compliance Check' && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-danger mb-2 bg-red-50 px-2 py-1 rounded">
                        <AlertTriangle className="h-3 w-3" /> DEA Review Required
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <PriorityBadge score={order.priority.total} level={order.priority.level} />
                    </div>
                    <p className="text-sm font-medium mb-1">{order.account.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <ProductTypePill type={order.productType} />
                      <span className="text-xs text-muted-foreground font-mono">{order.itemCount} items</span>
                      <span className="text-xs text-muted-foreground font-mono">${order.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <SlaCountdown hours={order.slaHoursRemaining} />
                      <div className="flex items-center gap-1">
                        {order.hasStockRisk && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        {order.assignedUser && (
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                            {order.assignedUser.initials}
                          </div>
                        )}
                      </div>
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
