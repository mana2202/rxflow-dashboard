import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { StockBadge } from '@/components/StockBadge';
import { PriorityTooltip } from '@/components/PriorityTooltip';
import { demoOrders, getStockState, pipelineStages, stageOfStatus, nextStatusInStage } from '@/data/demo';
import { ArrowRight, ShieldX, AlertTriangle, Lock } from 'lucide-react';
import type { Order, PipelineStage, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const stageColors: Record<PipelineStage, string> = {
  'Intake': 'border-t-slate-400',
  'Compliance Check': 'border-t-amber-500',
  'Fulfillment': 'border-t-blue-500',
  'Dispatch': 'border-t-emerald-500',
};

const stageHelp: Record<PipelineStage, string> = {
  'Intake': 'Newly received — must be complete before progressing',
  'Compliance Check': 'DEA / license verification for controlled substances',
  'Fulfillment': 'Picking, packing, and ready-to-ship',
  'Dispatch': 'Handed to carrier',
};

function priorityBorder(level: string) {
  switch (level) {
    case 'CRITICAL': return 'border-l-red-500';
    case 'HIGH': return 'border-l-orange-500';
    case 'MEDIUM': return 'border-l-amber-400';
    default: return 'border-l-slate-400';
  }
}

function worstStockState(o: Order) {
  const order = ['In Stock', 'Low Stock', 'At Risk', 'Out of Stock'] as const;
  let worstIdx = 0;
  o.items.forEach(it => { worstIdx = Math.max(worstIdx, order.indexOf(getStockState(it.product))); });
  return order[worstIdx];
}

export default function PipelineBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([...demoOrders]);
  const [dragId, setDragId] = useState<string | null>(null);

  const ordersByStage = useMemo(() => {
    const m: Record<PipelineStage, Order[]> = { 'Intake': [], 'Compliance Check': [], 'Fulfillment': [], 'Dispatch': [] };
    orders.forEach(o => m[stageOfStatus[o.status]].push(o));
    Object.keys(m).forEach(k => (m as any)[k].sort((a: Order, b: Order) => b.priority.total - a.priority.total));
    return m;
  }, [orders]);

  const canEnterStage = (o: Order, target: PipelineStage): { ok: boolean; reason?: string } => {
    if (target === 'Fulfillment' && o.productType === 'Controlled' && o.complianceStatus !== 'Passed') {
      return { ok: false, reason: o.complianceStatus === 'Blocked'
        ? `Blocked: ${o.complianceBlockReason ?? 'compliance failure'}`
        : 'Compliance check must pass before fulfillment' };
    }
    return { ok: true };
  };

  const moveToStage = (o: Order, target: PipelineStage) => {
    const check = canEnterStage(o, target);
    if (!check.ok) {
      toast({ title: 'Move blocked', description: check.reason });
      return;
    }
    const newStatus: OrderStatus = nextStatusInStage(target === 'Intake' ? 'Intake' : target);
    // Move to first status of the target stage
    const firstStatusOfStage: Record<PipelineStage, OrderStatus> = {
      'Intake': 'Incoming',
      'Compliance Check': o.productType === 'Controlled' ? 'Compliance Check' : 'Verified',
      'Fulfillment': 'Picking',
      'Dispatch': 'Shipped',
    };
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: firstStatusOfStage[target] } : x));
    void newStatus;
  };

  const moveForward = (o: Order) => {
    const currentStage = stageOfStatus[o.status];
    const idx = pipelineStages.indexOf(currentStage);
    if (idx >= pipelineStages.length - 1) return;
    moveToStage(o, pipelineStages[idx + 1]);
  };

  const passCompliance = (o: Order) => {
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, complianceStatus: 'Passed', complianceBlockReason: undefined } : x));
    toast({ title: 'Compliance passed', description: `${o.id} cleared for fulfillment.` });
  };

  return (
    <AppLayout title="Order Pipeline">
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {pipelineStages.map(stage => {
          const colOrders = ordersByStage[stage];
          const totalValue = colOrders.reduce((s, o) => s + o.orderValue, 0);
          const blockedCount = colOrders.filter(o => o.complianceStatus === 'Blocked').length;
          return (
            <div
              key={stage}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragId) return;
                const o = orders.find(x => x.id === dragId);
                if (o) moveToStage(o, stage);
                setDragId(null);
              }}
            >
              <div className={`card-pharma-compact p-4 mb-3 border-t-2 ${stageColors[stage]}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-display">{stage}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{colOrders.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{stageHelp[stage]}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  {blockedCount > 0 && (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                      <ShieldX className="h-3 w-3" /> {blockedCount} blocked
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {colOrders.map(o => {
                  const blocked = stage === 'Compliance Check' && o.complianceStatus === 'Blocked';
                  const fulfillBlocked = o.productType === 'Controlled' && o.complianceStatus !== 'Passed' && stage === 'Compliance Check';
                  const stock = worstStockState(o);
                  return (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={e => { setDragId(o.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className={`card-pharma-compact p-0 cursor-grab active:cursor-grabbing transition-all hover:shadow-elevated border-l-[3px] ${priorityBorder(o.priority.level)} ${dragId === o.id ? 'opacity-50' : ''} ${blocked ? 'ring-1 ring-red-500/40' : ''}`}
                    >
                      {blocked && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-red-600 px-3 py-1.5 rounded-tr-xl">
                          <Lock className="h-3 w-3" /> {o.complianceBlockReason ?? 'Compliance blocked'}
                        </div>
                      )}

                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                          <PriorityTooltip order={o}>
                            <span className="font-mono text-sm font-bold cursor-help">{o.priority.total}</span>
                          </PriorityTooltip>
                        </div>
                        <p className="text-sm font-semibold leading-tight">{o.account.name}</p>

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <ChannelBadge channel={o.channel} />
                          <ProductTypePill type={o.productType} />
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs">
                          <SlaCountdown hours={o.slaHoursRemaining} />
                          <span className={`inline-flex items-center gap-1 font-medium ${
                            stock === 'Out of Stock' ? 'text-red-600 dark:text-red-400' :
                            stock === 'At Risk' ? 'text-orange-600 dark:text-orange-400' :
                            stock === 'Low Stock' ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              stock === 'Out of Stock' ? 'bg-red-500' :
                              stock === 'At Risk' ? 'bg-orange-500' :
                              stock === 'Low Stock' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {stock}
                          </span>
                        </div>

                        {o.complianceStatus !== 'Not Required' && (
                          <div className="mt-2"><ComplianceBadge status={o.complianceStatus} /></div>
                        )}

                        {fulfillBlocked && o.complianceStatus === 'Pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); passCompliance(o); }}
                            className="w-full mt-2 py-1.5 text-[11px] font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            Approve Compliance
                          </button>
                        )}

                        {stage !== 'Dispatch' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveForward(o); }}
                            disabled={blocked || (stage === 'Compliance Check' && o.complianceStatus === 'Pending' && o.productType === 'Controlled')}
                            className={`w-full mt-2 py-1.5 text-[11px] font-medium rounded border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-1.5 ${
                              (blocked || (stage === 'Compliance Check' && o.complianceStatus === 'Pending' && o.productType === 'Controlled')) ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground hover:border-border' : ''
                            }`}
                          >
                            {blocked ? <><Lock className="h-3 w-3" /> Locked</> :
                             (stage === 'Compliance Check' && o.complianceStatus === 'Pending' && o.productType === 'Controlled') ?
                               <><AlertTriangle className="h-3 w-3" /> Awaiting compliance</> :
                               <>Move Forward <ArrowRight className="h-3 w-3" /></>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
