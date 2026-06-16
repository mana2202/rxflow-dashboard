import { useState, useMemo, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { AgingCard, AgingTimerLabel } from '@/components/AgingCard';
import { PriorityBadge } from '@/components/PriorityBadge';
import { PriorityTooltip } from '@/components/PriorityTooltip';
import { demoOrders, getStockState, pipelineStages, stageOfStatus } from '@/data/demo';
import { ShieldX, Lock } from 'lucide-react';
import type { Order, PipelineStage, OrderStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import '@/styles/kanban.css';

const stageHelp: Record<PipelineStage, string> = {
  'Intake': 'Newly received — must be complete before progressing',
  'Compliance Check': 'DEA / license verification for controlled substances',
  'Fulfillment': 'Picking, packing, and ready-to-ship',
  'Dispatch': 'Handed to carrier',
};

const stageLabel: Record<PipelineStage, string> = {
  'Intake': 'INTAKE',
  'Compliance Check': 'COMPLIANCE',
  'Fulfillment': 'FULFILLMENT',
  'Dispatch': 'DISPATCH',
};

function isDropBlocked(order: Order, target: PipelineStage): boolean {
  if (target === 'Fulfillment' && order.productType === 'Controlled'
      && order.complianceStatus !== 'Passed') return true;
  return false;
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
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [landingId, setLandingId] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const colRefs = useRef<Partial<Record<PipelineStage, HTMLDivElement | null>>>({});

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

  const moveToStage = useCallback((o: Order, target: PipelineStage) => {
    const check = canEnterStage(o, target);
    if (!check.ok) {
      toast({ title: 'Move blocked', description: check.reason });
      return;
    }
    const firstStatusOfStage: Record<PipelineStage, OrderStatus> = {
      'Intake': 'Incoming',
      'Compliance Check': o.productType === 'Controlled' ? 'Compliance Check' : 'Verified',
      'Fulfillment': 'Picking',
      'Dispatch': 'Shipped',
    };
    const newStatus = firstStatusOfStage[target];
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: newStatus } : x));
    setLandingId(o.id);
    setTimeout(() => setLandingId(null), 250);
  }, []);

  const moveForward = useCallback((o: Order) => {
    const currentStage = stageOfStatus[o.status];
    const idx = pipelineStages.indexOf(currentStage);
    if (idx >= pipelineStages.length - 1) return;
    moveToStage(o, pipelineStages[idx + 1]);
  }, [moveToStage]);

  const passCompliance = useCallback((o: Order) => {
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, complianceStatus: 'Passed', complianceBlockReason: undefined } : x));
    toast({ title: 'Compliance passed', description: `${o.id} cleared for fulfillment.` });
  }, []);

  function handleDragOver(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  }

  function handleDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    if (!dragId) return;
    const o = orders.find(x => x.id === dragId);
    if (!o) { setDragId(null); setDragOverStage(null); return; }

    const blocked = isDropBlocked(o, stage);
    if (blocked) {
      const colEl = colRefs.current[stage];
      if (colEl) {
        colEl.classList.add('col-reject-flash');
        colEl.addEventListener('animationend', () => colEl.classList.remove('col-reject-flash'), { once: true });
      }
      setRejectedId(dragId);
      setTimeout(() => setRejectedId(null), 250);
      toast({ title: 'Move blocked', description: 'Controlled substance requires cleared compliance before Fulfillment.' });
    } else {
      moveToStage(o, stage);
    }
    setDragId(null);
    setDragOverStage(null);
  }

  return (
    <AppLayout title="Order Pipeline">
      <div className="grid grid-cols-4 gap-3 pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {pipelineStages.map(stage => {
          const colOrders = ordersByStage[stage];
          const totalValue = colOrders.reduce((s, o) => s + o.orderValue, 0);
          const blockedCount = colOrders.filter(o => o.complianceStatus === 'Blocked').length;

          const draggingOrder = dragId ? orders.find(x => x.id === dragId) : null;
          const ghostBlocked = draggingOrder ? isDropBlocked(draggingOrder, stage) : false;
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              ref={el => { colRefs.current[stage] = el; }}
              className={['min-w-0 flex flex-col rounded-xl border border-border p-2 transition-colors',
                isOver && !ghostBlocked ? 'k-col-drop-valid' :
                isOver && ghostBlocked  ? 'k-col-drop-blocked' : ''
              ].join(' ')}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className="card-pharma-compact p-4 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{colOrders.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{stageHelp[stage]}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  {blockedCount > 0 && (
                    <span className="text-[10px] font-semibold inline-flex items-center gap-1" style={{ color:'#C3332B' }}>
                      <ShieldX className="h-3 w-3" /> {blockedCount} blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Drop ghost */}
              {isOver && draggingOrder && (
                ghostBlocked
                  ? <div className="drop-ghost-blocked">🔒 Compliance not cleared</div>
                  : <div className="drop-ghost-valid">Drop to move here</div>
              )}

              {/* Cards */}
              <div className="flex-1 space-y-2">
                {colOrders.map(o => {
                  const blocked = stage === 'Compliance Check' && o.complianceStatus === 'Blocked';
                  const fulfillBlocked = o.productType === 'Controlled' && o.complianceStatus !== 'Passed' && stage === 'Compliance Check';

                  return (
                    <AgingCard
                      key={o.id}
                      enteredQueueAt={o.enteredQueueAt}
                      orderDate={o.orderDate}
                      className={[
                        'cursor-grab active:cursor-grabbing transition-all',
                        dragId === o.id ? 'opacity-50' : '',
                        blocked ? 'ring-1 ring-[#C3332B]/40' : '',
                        landingId === o.id ? 'card-landing' : '',
                        rejectedId === o.id ? 'card-rejected' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {(aging) => (
                        <div
                          draggable
                          onDragStart={e => { setDragId(o.id); e.dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => { setDragId(null); setDragOverStage(null); }}
                          onClick={() => navigate(`/orders/${o.id}`)}
                        >
                          {blocked && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white px-3 py-1.5" style={{ background:'#C3332B', borderRadius:'8px 8px 0 0' }}>
                              <Lock className="h-3 w-3" /> {o.complianceBlockReason ?? 'Compliance blocked'}
                            </div>
                          )}

                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                              <PriorityTooltip order={o}>
                                <PriorityBadge score={o.priority.total} level={o.priority.level} showScore />
                              </PriorityTooltip>
                            </div>
                            <p className="text-sm font-semibold leading-tight">{o.account.name}</p>

                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <ChannelBadge channel={o.channel} />
                              <ProductTypePill type={o.productType} />
                            </div>

                            <div className="flex items-center justify-between mt-2 text-xs">
                              <SlaCountdown hours={o.slaHoursRemaining} />
                              <AgingTimerLabel timerLabel={aging.timerLabel} state={aging.state} />
                            </div>

                            {o.complianceStatus !== 'Not Required' && (
                              <div className="mt-2"><ComplianceBadge status={o.complianceStatus} /></div>
                            )}

                            {fulfillBlocked && o.complianceStatus === 'Pending' && (
                              <button
                                onClick={e => { e.stopPropagation(); passCompliance(o); }}
                                className="w-full mt-2 py-1.5 text-[11px] font-medium rounded text-white transition-colors"
                                style={{ background:'#1A7F4B' }}
                              >
                                Approve Compliance
                              </button>
                            )}

                            {stage !== 'Dispatch' && (
                              <button
                                onClick={e => { e.stopPropagation(); moveForward(o); }}
                                disabled={blocked || (stage === 'Compliance Check' && o.complianceStatus === 'Pending' && o.productType === 'Controlled')}
                                className="w-full mt-2 py-1.5 text-[11px] font-medium rounded border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:border-border"
                              >
                                {blocked ? <><Lock className="h-3 w-3" /> Locked</> :
                                 (stage === 'Compliance Check' && o.complianceStatus === 'Pending' && o.productType === 'Controlled')
                                   ? 'Awaiting compliance'
                                   : 'Move Forward →'}
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
