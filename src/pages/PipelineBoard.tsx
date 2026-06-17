import '../styles/kanban.css';
import { useState, useMemo, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { PriorityBadge } from '@/components/PriorityBadge';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { StockBadge } from '@/components/StockBadge';
import { PriorityTooltip } from '@/components/PriorityTooltip';
import { AgingCard } from '@/components/AgingCard';
import { demoOrders, getStockState, pipelineStages, stageOfStatus } from '@/data/demo';
import { computeAging } from '@/utils/aging';
import { ArrowRight, ShieldX, AlertTriangle, Lock } from 'lucide-react';
import type { Order, PipelineStage, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const stageColors: Record<PipelineStage, string> = {
  'Intake': 'border-t-border-strong',
  'Compliance Check': 'border-t-warning',
  'Fulfillment': 'border-t-info',
  'Dispatch': 'border-t-success',
};

const stageHelp: Record<PipelineStage, string> = {
  'Intake': 'Incoming & Verified — must be complete before progressing',
  'Compliance Check': 'DEA / license verification for controlled substances',
  'Fulfillment': 'Picking in progress',
  'Dispatch': 'Ready to ship and shipped orders',
};

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
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [flashingCol, setFlashingCol] = useState<PipelineStage | null>(null);
  const colRefs = useRef<Partial<Record<PipelineStage, HTMLDivElement | null>>>({});

  const ordersByStage = useMemo(() => {
    const m: Record<PipelineStage, Order[]> = { 'Intake': [], 'Compliance Check': [], 'Fulfillment': [], 'Dispatch': [] };
    orders.forEach(o => m[stageOfStatus[o.status]].push(o));
    Object.keys(m).forEach(k => (m as any)[k].sort((a: Order, b: Order) => {
      const ar = { critical: 0, warning: 1, fresh: 2 };
      const aA = computeAging(a.enteredQueueAt).state;
      const bA = computeAging(b.enteredQueueAt).state;
      const rd = ar[aA] - ar[bA];
      return rd !== 0 ? rd : b.priority.total - a.priority.total;
    }));
    return m;
  }, [orders]);

  const draggedOrder = dragId ? orders.find(x => x.id === dragId) ?? null : null;

  const canMove = (o: Order, target: PipelineStage): { ok: boolean; reason?: string } => {
    const currentStage = stageOfStatus[o.status];
    const currentIdx = pipelineStages.indexOf(currentStage);
    const targetIdx = pipelineStages.indexOf(target);

    if (targetIdx === currentIdx) return { ok: true };
    if (targetIdx < currentIdx) return { ok: false, reason: 'Orders cannot move backwards in the pipeline.' };

    if (target === 'Fulfillment' && o.productType === 'Controlled' && o.complianceStatus !== 'Passed') {
      return {
        ok: false,
        reason: o.complianceStatus === 'Blocked'
          ? `Blocked: ${o.complianceBlockReason ?? 'compliance failure'}`
          : 'Controlled substance must complete compliance review before fulfillment.',
      };
    }

    if (target === 'Fulfillment' && o.complianceStatus === 'Blocked') {
      return { ok: false, reason: `Blocked: ${o.complianceBlockReason ?? 'compliance failure'}` };
    }

    return { ok: true };
  };

  const rejectMove = useCallback((orderId: string, targetStage: PipelineStage, reason: string) => {
    setShakingId(orderId);
    setFlashingCol(targetStage);
    toast({ title: 'Move blocked', description: reason });
    setTimeout(() => setShakingId(null), 220);
    setTimeout(() => setFlashingCol(null), 400);
  }, []);

  const moveToStage = (o: Order, target: PipelineStage) => {
    const check = canMove(o, target);
    if (!check.ok) {
      rejectMove(o.id, target, check.reason!);
      return;
    }
    const firstStatusOfStage: Record<PipelineStage, OrderStatus> = {
      'Intake': 'Incoming',
      'Compliance Check': 'Compliance Check',
      'Fulfillment': 'Picking',
      'Dispatch': 'Ready to Ship',
    };
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: firstStatusOfStage[target] } : x));
    // Landing animation fires after React commits the card to its new column
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`kanban-card-${o.id}`);
        if (el) {
          el.classList.add('card-landing');
          el.addEventListener('animationend', () => el.classList.remove('card-landing'), { once: true });
        }
      });
    });
  };

  const moveForward = (o: Order) => {
    if (o.status === 'Incoming') {
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'Verified' } : x));
      return;
    }
    if (o.status === 'Verified') {
      const target: PipelineStage = o.productType === 'Controlled' ? 'Compliance Check' : 'Fulfillment';
      moveToStage(o, target);
      return;
    }
    if (o.status === 'Ready to Ship') {
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'Shipped' } : x));
      return;
    }
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
      <div className="grid grid-cols-4 gap-3 pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {pipelineStages.map(stage => {
          const colOrders = ordersByStage[stage];
          const totalValue = colOrders.reduce((s, o) => s + o.orderValue, 0);
          const blockedCount = colOrders.filter(o => o.complianceStatus === 'Blocked').length;
          const isFlashing = flashingCol === stage;

          // Drag validity for this column
          const dragCheck = draggedOrder ? canMove(draggedOrder, stage) : null;
          const isDragTarget = Boolean(dragId && overStage === stage);
          const isDragValid = isDragTarget && dragCheck?.ok === true;
          const isDragBlocked = isDragTarget && dragCheck?.ok === false;

          return (
            <div
              key={stage}
              ref={el => { colRefs.current[stage] = el; }}
              id={`kanban-col-${stage}`}
              className={`min-w-0 flex flex-col ${isFlashing ? 'col-reject-flash' : ''} ${isDragValid ? 'k-col-drop-valid' : isDragBlocked ? 'k-col-drop-blocked' : ''}`}
              onDragOver={e => {
                e.preventDefault();
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
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
                <p className="text-2xs text-muted-foreground mt-1">{stageHelp[stage]}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  {blockedCount > 0 && (
                    <span className="text-2xs font-semibold text-danger inline-flex items-center gap-1">
                      <ShieldX className="h-3 w-3" /> {blockedCount} blocked
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {/* Drop ghost placeholder */}
                {isDragTarget && dragCheck && (
                  <div className={dragCheck.ok ? 'drop-ghost-valid' : 'drop-ghost-blocked'}>
                    {dragCheck.ok
                      ? '✓ Drop to move here'
                      : `✗ ${(dragCheck.reason ?? '').split(':')[0]}`}
                  </div>
                )}

                {colOrders.map(o => {
                  const blocked = stage === 'Compliance Check' && o.complianceStatus === 'Blocked';
                  const compliancePending = o.productType === 'Controlled' && o.complianceStatus !== 'Passed' && stage === 'Compliance Check';
                  const stock = worstStockState(o);
                  const isShaking = shakingId === o.id;

                  return (
                    <AgingCard key={o.id} enteredQueueAt={o.enteredQueueAt}>
                      {({ aging, transitionClass }) => (
                        <div
                          id={`kanban-card-${o.id}`}
                          draggable
                          onDragStart={e => { setDragId(o.id); e.dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => { setDragId(null); setOverStage(null); }}
                          onClick={() => navigate(`/orders/${o.id}`)}
                          className={`card-pharma-compact p-0 cursor-grab active:cursor-grabbing transition-all hover:shadow-elevated border-l-[3px] ${aging.cardClass} ${transitionClass} ${dragId === o.id ? 'opacity-50' : ''} ${blocked ? 'ring-1 ring-danger/40' : ''} ${isShaking ? 'card-shake' : ''}`}
                        >
                          {blocked && (
                            <div className="flex items-center gap-1.5 text-2xs font-semibold text-danger-foreground bg-danger px-3 py-1.5 rounded-tr-xl">
                              <Lock className="h-3 w-3" /> {o.complianceBlockReason ?? 'Compliance blocked'}
                            </div>
                          )}

                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                              <PriorityTooltip order={o}>
                                <span className="cursor-help">
                                  <PriorityBadge score={o.priority.total} level={o.priority.level} />
                                </span>
                              </PriorityTooltip>
                            </div>
                            <p className="text-sm font-semibold leading-tight">{o.account.name}</p>
                            <p className="text-2xs text-muted-foreground mt-0.5">{o.status}</p>

                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <ChannelBadge channel={o.channel} />
                              <ProductTypePill type={o.productType} />
                            </div>

                            <div className="flex items-center justify-between mt-2 text-xs">
                              <SlaCountdown hours={o.slaHoursRemaining} />
                              <span className={`inline-flex items-center gap-1 font-medium ${
                                stock === 'Out of Stock' ? 'text-danger' :
                                stock === 'At Risk' ? 'text-warning-text' :
                                stock === 'Low Stock' ? 'text-warning-text' :
                                'text-success-text'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  stock === 'Out of Stock' ? 'bg-danger' :
                                  stock === 'At Risk' ? 'bg-warning' :
                                  stock === 'Low Stock' ? 'bg-warning' : 'bg-success'
                                }`} />
                                {stock}
                              </span>
                            </div>

                            {aging.timerLabel && (
                              <p className={`aging-timer text-2xs mt-1.5 ${aging.state === 'critical' ? 'text-danger' : 'text-warning-text'}`}>
                                {aging.timerLabel}
                              </p>
                            )}

                            {o.complianceStatus !== 'Not Required' && (
                              <div className="mt-2"><ComplianceBadge status={o.complianceStatus} /></div>
                            )}

                            {compliancePending && o.complianceStatus === 'Pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); passCompliance(o); }}
                                className="w-full mt-2 py-1.5 text-2xs font-medium rounded bg-success text-success-foreground hover:opacity-90 transition-opacity"
                              >
                                Approve Compliance
                              </button>
                            )}

                            {stage !== 'Dispatch' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveForward(o); }}
                                disabled={blocked || (compliancePending && o.complianceStatus === 'Pending')}
                                className={`w-full mt-2 py-1.5 text-2xs font-medium rounded border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-1.5 ${
                                  (blocked || (compliancePending && o.complianceStatus === 'Pending')) ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground hover:border-border' : ''
                                }`}
                              >
                                {blocked ? <><Lock className="h-3 w-3" /> Locked</> :
                                 (compliancePending && o.complianceStatus === 'Pending') ?
                                   <><AlertTriangle className="h-3 w-3" /> Awaiting compliance</> :
                                   <>Move Forward <ArrowRight className="h-3 w-3" /></>}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </AgingCard>
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
