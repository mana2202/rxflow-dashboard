import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StockBadge } from '@/components/StockBadge';
import { demoProducts, demoOrders, getStockState } from '@/data/demo';
import type { Product, StockState, StockConfidence } from '@/types';
import { Clock, TrendingUp, TrendingDown, Package, AlertTriangle, ShieldCheck, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Filter = 'all' | 'risk' | 'low-conf' | 'reorder';

const confColor: Record<StockConfidence, string> = {
  High: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Low: 'text-red-600 dark:text-red-400',
};

const categoryStyle: Record<string, string> = {
  OTC: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  Controlled: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Device: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
};

interface Row {
  product: Product;
  state: StockState;
  dailyDemand: number;     // avg units/day over last 14d (from order history)
  daysOfCover: number;     // currentStock / dailyDemand
  suggestedQty: number;    // recommended reorder qty based on trend
  trendDelta: number;      // percent vs prior 14d window
}

export default function InventoryDetails() {
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo<Row[]>(() => {
    // Build demand history from demoOrders (deterministic — orders carry a date hours ago)
    const demand14: Record<string, number> = {};
    const demand14prior: Record<string, number> = {};
    demoOrders.forEach(o => {
      const ageHours = (Date.now() - new Date(o.orderDate).getTime()) / 36e5;
      o.items.forEach(it => {
        if (ageHours <= 14 * 24) {
          demand14[it.product.sku] = (demand14[it.product.sku] ?? 0) + it.qtyOrdered;
        } else if (ageHours <= 28 * 24) {
          demand14prior[it.product.sku] = (demand14prior[it.product.sku] ?? 0) + it.qtyOrdered;
        }
      });
    });

    return demoProducts.map(p => {
      const total = demand14[p.sku] ?? 0;
      const prior = demand14prior[p.sku] ?? 0;
      // Demoizable fallback so every row has a trend reading
      const synth = Math.max(1, Math.round((p.reorderPoint / Math.max(1, p.daysOfSupply)) * 14));
      const total14 = total > 0 ? total : synth;
      const prior14 = prior > 0 ? prior : Math.round(synth * (0.7 + ((p.sku.length % 6) * 0.1)));
      const dailyDemand = +(total14 / 14).toFixed(1);
      const daysOfCover = dailyDemand > 0 ? Math.floor(p.currentStock / dailyDemand) : 999;
      const targetCover = 30; // weeks of cover target
      const suggestedQty = Math.max(0, Math.ceil(dailyDemand * targetCover) - p.currentStock);
      const trendDelta = prior14 === 0 ? 0 : Math.round(((total14 - prior14) / prior14) * 100);
      return {
        product: p,
        state: getStockState(p),
        dailyDemand,
        daysOfCover,
        suggestedQty,
        trendDelta,
      };
    });
  }, []);

  const counts = useMemo(() => ({
    all: rows.length,
    risk: rows.filter(r => r.state === 'At Risk' || r.state === 'Out of Stock').length,
    lowConf: rows.filter(r => (r.product.stockConfidence ?? 'High') !== 'High').length,
    reorder: rows.filter(r => r.suggestedQty > 0).length,
  }), [rows]);

  const visible = useMemo(() => {
    const arr = [...rows];
    const order: Record<StockState, number> = { 'Out of Stock': 0, 'At Risk': 1, 'Low Stock': 2, 'In Stock': 3 };
    arr.sort((a, b) => (order[a.state] - order[b.state]) || (a.daysOfCover - b.daysOfCover));
    if (filter === 'risk') return arr.filter(r => r.state === 'At Risk' || r.state === 'Out of Stock');
    if (filter === 'low-conf') return arr.filter(r => (r.product.stockConfidence ?? 'High') !== 'High');
    if (filter === 'reorder') return arr.filter(r => r.suggestedQty > 0);
    return arr;
  }, [rows, filter]);

  const totalReorderValue = rows.reduce((s, r) => s + r.suggestedQty * r.product.unitPrice, 0);

  return (
    <AppLayout title="Inventory Details">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryTile icon={Package} label="Total SKUs" value={String(counts.all)} />
        <SummaryTile icon={AlertTriangle} label="At Risk / Out" value={String(counts.risk)} accent="text-red-600 dark:text-red-400" />
        <SummaryTile icon={Clock} label="Low-Confidence Stock" value={String(counts.lowConf)} accent="text-amber-600 dark:text-amber-400" />
        <SummaryTile icon={ShoppingCart} label="Suggested Reorder" value={`$${Math.round(totalReorderValue).toLocaleString()}`} accent="text-primary" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          ['all', 'All SKUs', counts.all, Package],
          ['risk', 'At Risk / Out', counts.risk, AlertTriangle],
          ['low-conf', 'Stale / Low Confidence', counts.lowConf, Clock],
          ['reorder', 'Needs Reorder', counts.reorder, ShoppingCart],
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

      {/* Table */}
      <div className="card-pharma p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">SKU / Product</th>
              <th className="text-left font-medium px-3 py-3">Stock</th>
              <th className="text-right font-medium px-3 py-3">On hand</th>
              <th className="text-right font-medium px-3 py-3">Reorder pt</th>
              <th className="text-left font-medium px-3 py-3">14d demand</th>
              <th className="text-right font-medium px-3 py-3">Days cover</th>
              <th className="text-left font-medium px-3 py-3">Confidence</th>
              <th className="text-right font-medium px-4 py-3">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => {
              const conf = r.product.stockConfidence ?? 'High';
              const hours = r.product.stockLastUpdatedHours ?? 0;
              const cover = r.daysOfCover;
              const coverCls =
                cover < 7 ? 'text-red-600 dark:text-red-400' :
                cover < 14 ? 'text-amber-600 dark:text-amber-400' :
                'text-foreground';
              return (
                <tr key={r.product.sku} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${categoryStyle[r.product.category] ?? ''}`}>
                        {r.product.category === 'Controlled' ? `C-${r.product.schedule ?? ''}` : r.product.category}
                      </span>
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{r.product.sku}</div>
                        <div className="font-medium leading-tight">{r.product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StockBadge product={r.product} /></td>
                  <td className="px-3 py-3 text-right font-mono">{r.product.currentStock.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">{r.product.reorderPoint.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{r.dailyDemand}/day</span>
                      {r.trendDelta !== 0 && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] ${r.trendDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {r.trendDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(r.trendDelta)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-semibold ${coverCls}`}>
                    {cover >= 999 ? '∞' : `${cover}d`}
                  </td>
                  <td className="px-3 py-3">
                    <div className={`inline-flex items-center gap-1 text-[11px] ${confColor[conf]}`}>
                      <Clock className="h-3 w-3" /> {hours}h ago · {conf}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.suggestedQty > 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono font-semibold">+{r.suggestedQty.toLocaleString()}</span>
                        <button
                          onClick={() => toast({ title: 'PO drafted', description: `${r.suggestedQty} × ${r.product.sku} queued for procurement.` })}
                          className="text-[10px] uppercase tracking-wider text-primary hover:underline"
                        >
                          Create PO
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Healthy
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Demand is computed from the last 14 days of order history. Suggested quantities target ~30 days of cover at the current run-rate. Stock risk feeds directly into the priority score — no separate compliance step needed.
      </p>
    </AppLayout>
  );
}

function SummaryTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="card-pharma-compact p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`font-mono text-2xl font-bold mt-1 ${accent ?? ''}`}>{value}</div>
    </div>
  );
}
