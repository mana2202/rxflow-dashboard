import '../styles/inbox.css';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProductTypePill } from '@/components/ProductTypePill';
import { SlaCountdown } from '@/components/SlaCountdown';
import { ChannelBadge } from '@/components/ChannelBadge';
import { CompletenessTag } from '@/components/CompletenessTag';
import { StockBadge } from '@/components/StockBadge';
import { ComplianceBadge } from '@/components/ComplianceBadge';
import { DuplicateCompareDialog } from '@/components/DuplicateCompareDialog';
import { PriorityTooltip } from '@/components/PriorityTooltip';
import { demoOrders, demoAccounts, demoProducts } from '@/data/demo';
import { computePriorityScore } from '@/utils/priorityScore';
import { ArrowRight, AlertTriangle, GitMerge, Inbox, ShieldCheck, MessageSquare, Plus, X } from 'lucide-react';
import type { Order, OrderChannel, OrderLineItem, Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addHours } from 'date-fns';

type Filter = 'all' | 'clarify' | 'duplicate' | 'ready';

export default function IncomingOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => demoOrders.filter(o => o.status === 'Incoming'));
  const [filter, setFilter] = useState<Filter>('all');
  const [dupOpen, setDupOpen] = useState(false);
  const [dupPair, setDupPair] = useState<[Order, Order] | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [expiringBadgeIds, setExpiringBadgeIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    accountId: demoAccounts[0].id,
    channel: 'Phone' as OrderChannel,
    sku: demoProducts[0].sku,
    qty: 10,
    slaHours: 24,
    isUrgent: false,
  });

  // Pre-submission checks (computed from current form state)
  const preChecks = useMemo(() => {
    const account = demoAccounts.find(a => a.id === form.accountId);
    const product = demoProducts.find(p => p.sku === form.sku);
    if (!account || !product) return null;

    const dupMatch = demoOrders.find(o =>
      o.accountId === form.accountId &&
      o.items.some(i => i.product.sku === form.sku) &&
      Date.now() - new Date(o.orderDate).getTime() < 7 * 24 * 3600000
    );

    const isControlled = product.category === 'Controlled';
    const stockState = product.currentStock < product.reorderPoint * 0.5 ? 'At Risk' :
                       product.currentStock < product.reorderPoint ? 'Low Stock' : 'In Stock';
    const licenseExpiringSoon = account.tier === 1; // simulate: Tier 1 accounts have active licenses

    return {
      duplicate: dupMatch ? { warn: true, msg: `Possible duplicate of ${dupMatch.id} (same account + SKU, within 7 days)` } : { warn: false, msg: 'No duplicate detected' },
      controlled: { warn: isControlled, msg: isControlled ? 'Controlled substance — will auto-route to Compliance on submit' : 'No controlled substances' },
      stock: stockState !== 'In Stock' ? { warn: true, msg: `Stock ${stockState}: ${product.currentStock} units (reorder point: ${product.reorderPoint})` } : { warn: false, msg: `In stock: ${product.currentStock} units` },
      license: !licenseExpiringSoon ? { warn: true, msg: 'License status unknown — verify before dispatch' } : { warn: false, msg: 'License on file' },
      dupOrder: dupMatch ?? null,
    };
  }, [form.accountId, form.sku]);

  const counts = useMemo(() => ({
    all: orders.length,
    clarify: orders.filter(o => o.completeness === 'Needs Clarification').length,
    duplicate: orders.filter(o => o.duplicateOfId).length,
    ready: orders.filter(o => o.completeness === 'Complete' && !o.duplicateOfId).length,
  }), [orders]);

  const visible = useMemo(() => {
    let arr = [...orders];
    if (filter === 'clarify') arr = arr.filter(o => o.completeness === 'Needs Clarification');
    else if (filter === 'duplicate') arr = arr.filter(o => o.duplicateOfId);
    else if (filter === 'ready') arr = arr.filter(o => o.completeness === 'Complete' && !o.duplicateOfId);
    return arr.sort((a, b) => b.priority.total - a.priority.total);
  }, [orders, filter]);

  const findDuplicate = (o: Order) => orders.find(x => x.id === o.duplicateOfId) ?? demoOrders.find(x => x.id === o.duplicateOfId) ?? null;

  const openDuplicate = (o: Order) => {
    const other = findDuplicate(o);
    if (!other) return;
    setDupPair([o, other]);
    setDupOpen(true);
  };

  const routeToFulfillment = (o: Order) => {
    if (o.completeness !== 'Complete') {
      toast({ title: 'Cannot route', description: 'Resolve missing fields before sending to fulfillment.' });
      return;
    }
    if (o.duplicateOfId) {
      toast({ title: 'Possible duplicate', description: 'Resolve the duplicate first (Merge or Keep Separate).' });
      return;
    }
    setOrders(prev => prev.filter(x => x.id !== o.id));
    toast({ title: `${o.id} routed`, description: 'Moved to Compliance / Fulfillment pipeline.' });
  };

  const resolveClarification = (o: Order) => {
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, completeness: 'Complete', missingFields: undefined } : x));
    toast({ title: 'Clarification recorded', description: `${o.id} now ready to route.` });
  };

  const handleMerge = () => {
    if (!dupPair) return;
    const [a, b] = dupPair;
    setOrders(prev => prev.filter(x => x.id !== b.id).map(x => x.id === a.id ? { ...x, duplicateOfId: undefined } : x));
    setDupOpen(false);
    toast({ title: 'Orders merged', description: `${b.id} merged into ${a.id}.` });
  };
  const handleKeepSeparate = () => {
    if (!dupPair) return;
    const [a, b] = dupPair;
    setOrders(prev => prev.map(x => x.id === a.id || x.id === b.id ? { ...x, duplicateOfId: undefined } : x));
    setDupOpen(false);
    toast({ title: 'Kept separate', description: 'Both orders flagged as independent.' });
  };

  const handleCreateOrder = () => {
    const account = demoAccounts.find(a => a.id === form.accountId)!;
    const product = demoProducts.find(p => p.sku === form.sku)!;
    const qty = Math.max(1, Number(form.qty) || 1);
    const item: OrderLineItem = {
      product,
      qtyOrdered: qty,
      qtyAvailable: Math.min(qty, product.currentStock),
      lineTotal: product.unitPrice * qty,
    };
    const pType = product.category === 'Controlled' ? 'Controlled' : product.category === 'Device' ? 'Device' : 'OTC';
    const hasStockRisk = product.currentStock < product.reorderPoint || product.expiringWithin30Days;
    const priority = computePriorityScore({
      isUrgent: form.isUrgent,
      slaHoursRemaining: form.slaHours,
      hasStockRisk,
      customerTier: account.tier,
    });
    const newId = `RX-2024-${String(Math.floor(90000 + Math.random() * 9999))}`;
    const nowD = new Date();
    // Controlled substances auto-route to Compliance Check, skipping Incoming
    const initialStatus = product.category === 'Controlled' ? 'Compliance Check' : 'Incoming';
    const newOrder: Order = {
      id: newId,
      accountId: account.id,
      account,
      productType: pType,
      items: [item],
      itemCount: 1,
      orderValue: item.lineTotal,
      status: initialStatus,
      assignedTo: 'Sarah Chen',
      orderDate: format(nowD, "yyyy-MM-dd'T'HH:mm:ss"),
      slaDeadline: format(addHours(nowD, form.slaHours), "yyyy-MM-dd'T'HH:mm:ss"),
      slaHoursRemaining: form.slaHours,
      isUrgent: form.isUrgent,
      hasStockRisk,
      priority,
      auditLog: [{ timestamp: format(nowD, "yyyy-MM-dd'T'HH:mm:ss"), action: `Order ${newId} created via ${form.channel}` }],
      overrides: [],
      channel: form.channel,
      completeness: 'Complete',
      complianceStatus: product.category === 'Controlled' ? 'Pending' : 'Not Required',
      enteredQueueAt: format(nowD, "yyyy-MM-dd'T'HH:mm:ss"),
    };
    setOrders(prev => [newOrder, ...prev]);
    setNewOrderIds(prev => new Set([...prev, newId]));
    // Start badge fade at 4s, remove entering class at 4.6s
    setTimeout(() => setExpiringBadgeIds(prev => new Set([...prev, newId])), 4000);
    setTimeout(() => {
      setNewOrderIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
      setExpiringBadgeIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
    }, 4600);
    setNewOpen(false);
    toast({ title: 'Order created', description: `${newId} added to intake.` });
  };

  return (
    <AppLayout title="Incoming Orders">
      {/* Top bar: filters + add button */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {([
            ['all', 'All Intake', counts.all, Inbox],
            ['clarify', 'Needs Clarification', counts.clarify, MessageSquare],
            ['duplicate', 'Possible Duplicates', counts.duplicate, GitMerge],
            ['ready', 'Ready to Route', counts.ready, ShieldCheck],
          ] as const).map(([key, label, count, Icon]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`card-pharma-compact px-4 py-2 flex items-center gap-2 text-sm transition-all hover:shadow-elevated ${
                filter === key ? 'ring-2 ring-primary' : ''
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-semibold">{count}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setNewOpen(true)} className="btn-pharma text-sm gap-1.5">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Order cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="card-pharma text-center py-12 text-muted-foreground">No orders match this filter.</div>
        )}
        {visible.map(o => {
          const blocked = o.completeness !== 'Complete' || !!o.duplicateOfId;
          return (
            <div
              key={o.id}
              className={`card-pharma-compact p-5 border-l-4 ${
                o.completeness !== 'Complete' ? 'border-l-amber-500' :
                o.duplicateOfId ? 'border-l-orange-500' :
                o.priority.level === 'CRITICAL' ? 'border-l-red-500' :
                o.priority.level === 'HIGH' ? 'border-l-orange-400' : 'border-l-emerald-500'
              } ${newOrderIds.has(o.id) ? 'inbox-card-entering' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: identity + tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-sm font-semibold">{o.id}</span>
                    {newOrderIds.has(o.id) && (
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold bg-primary text-primary-foreground ${expiringBadgeIds.has(o.id) ? 'new-badge-expiring' : ''}`}>
                        NEW
                      </span>
                    )}
                    <ChannelBadge channel={o.channel} />
                    <CompletenessTag complete={o.completeness === 'Complete'} />
                    {o.duplicateOfId && (
                      <button
                        onClick={() => openDuplicate(o)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-tint text-warning-text hover:bg-warning-tint transition-colors"
                      >
                        <GitMerge className="h-3 w-3" /> Possible duplicate of {o.duplicateOfId}
                      </button>
                    )}
                    <ProductTypePill type={o.productType} />
                    <ComplianceBadge status={o.complianceStatus} compact />
                  </div>
                  <p className="font-display text-lg font-semibold leading-tight">{o.account.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Tier {o.account.tier}</span>
                    <span>·</span>
                    <span>{o.itemCount} items · ${o.orderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span>·</span>
                    <span>SLA <SlaCountdown hours={o.slaHoursRemaining} /></span>
                  </div>

                  {/* Inline missing fields */}
                  {o.completeness === 'Needs Clarification' && o.missingFields && (
                    <div className="mt-3 p-3 rounded-md bg-warning-tint border border-warning/30">
                      <div className="flex items-center gap-2 text-xs font-semibold text-warning-text mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Missing required fields — cannot enter fulfillment
                      </div>
                      <ul className="text-xs text-warning-text space-y-0.5 ml-5 list-disc">
                        {o.missingFields.map(f => <li key={f}>{f}</li>)}
                      </ul>
                      <button
                        onClick={() => resolveClarification(o)}
                        className="btn-pharma-outline text-2xs py-1 px-2 mt-2"
                      >
                        Mark as clarified
                      </button>
                    </div>
                  )}

                  {/* Stock-at-a-glance for line items */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {o.items.map(it => (
                      <div key={it.product.sku} className="flex items-center gap-1.5 text-2xs px-2 py-0.5 rounded bg-muted/40">
                        <span className="font-mono text-muted-foreground">{it.product.sku}</span>
                        <StockBadge product={it.product} compact />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: priority + action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <PriorityTooltip order={o}>
                    <div className="text-right cursor-help">
                      <div className="text-2xs uppercase text-muted-foreground tracking-wider">Priority</div>
                      <div className="font-mono text-2xl font-bold leading-none">{o.priority.total}</div>
                      <div className="text-2xs font-semibold text-muted-foreground mt-0.5">{o.priority.level}</div>
                    </div>
                  </PriorityTooltip>
                  <button
                    onClick={() => routeToFulfillment(o)}
                    disabled={blocked}
                    className={`btn-pharma text-xs gap-1 ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Route to Fulfillment <ArrowRight className="h-3 w-3" />
                  </button>
                  <button onClick={() => navigate(`/orders/${o.id}`)} className="text-xs text-muted-foreground hover:text-foreground">
                    Open detail →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DuplicateCompareDialog
        open={dupOpen}
        onOpenChange={setDupOpen}
        a={dupPair?.[0] ?? null}
        b={dupPair?.[1] ?? null}
        onMerge={handleMerge}
        onKeepSeparate={handleKeepSeparate}
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Incoming Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Channel toggles */}
            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <div className="flex gap-2">
                {(['WhatsApp', 'Phone', 'Email', 'Walk-in'] as OrderChannel[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, channel: c }))}
                    className={`flex-1 text-xs py-2 px-3 rounded border transition-all ${form.channel === c ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-border text-muted-foreground hover:bg-accent'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account</Label>
              <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {demoAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} (T{a.tier})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product</Label>
              <Select value={form.sku} onValueChange={v => setForm(f => ({ ...f, sku: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {demoProducts.map(p => <SelectItem key={p.sku} value={p.sku}>{p.sku} — {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min={1} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SLA (hours)</Label>
                <Input type="number" min={1} value={form.slaHours} onChange={e => setForm(f => ({ ...f, slaHours: Number(e.target.value) }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))} />
              Mark as urgent (STAT)
            </label>

            {/* Pre-submission checks */}
            {preChecks && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pre-submission checks</p>
                {[
                  { label: 'Duplicate detection', ...preChecks.duplicate },
                  { label: 'Controlled substance', ...preChecks.controlled },
                  { label: 'Stock availability', ...preChecks.stock },
                  { label: 'Compliance license', ...preChecks.license },
                ].map(check => (
                  <div key={check.label} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-2xs font-bold ${check.warn ? 'bg-warning-tint text-warning-text' : 'bg-success-tint text-success-text'}`}>
                      {check.warn ? '!' : '✓'}
                    </span>
                    <div>
                      <span className="font-medium">{check.label}</span>
                      <span className="text-muted-foreground ml-1">— {check.msg}</span>
                    </div>
                  </div>
                ))}
                {preChecks.dupOrder && (
                  <div className="mt-2 p-2 rounded bg-warning-tint border border-warning/20 text-xs text-warning-text flex items-center justify-between">
                    <span>Possible duplicate detected</span>
                    <button
                      type="button"
                      onClick={() => { setDupPair([preChecks.dupOrder!, preChecks.dupOrder!]); setDupOpen(true); }}
                      className="underline text-warning-text ml-2"
                    >
                      Compare orders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setNewOpen(false)} className="btn-pharma-outline text-sm">Cancel</button>
            <button onClick={handleCreateOrder} className="btn-pharma text-sm">Create Order</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
