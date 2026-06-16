import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StockBadge } from '@/components/StockBadge';
import { StageBadgeFromStatus } from '@/components/StageBadge';
import { demoProducts, demoOrders, getStockState } from '@/data/demo';
import type { StockState } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react';

const actionableStates: StockState[] = ['Low Stock', 'At Risk', 'Out of Stock'];

export default function InventoryDashboard() {
  const [raisedPOs, setRaisedPOs] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return demoProducts.map(p => ({
      product: p,
      state: getStockState(p),
    })).sort((a, b) => {
      const rank: Record<StockState, number> = { 'Out of Stock': 0, 'At Risk': 1, 'Low Stock': 2, 'In Stock': 3 };
      return rank[a.state] - rank[b.state];
    });
  }, []);

  const stockRiskOrders = useMemo(() => {
    return demoOrders.filter(o => o.hasStockRisk && o.status !== 'Shipped');
  }, []);

  const summary = useMemo(() => ({
    total: demoProducts.length,
    atRisk: rows.filter(r => r.state === 'At Risk').length,
    lowStock: rows.filter(r => r.state === 'Low Stock').length,
    outOfStock: rows.filter(r => r.state === 'Out of Stock').length,
    openPOs: raisedPOs.size,
  }), [rows, raisedPOs]);

  function raisePO(sku: string, name: string) {
    setRaisedPOs(prev => new Set([...prev, sku]));
    toast({ title: 'PO raised', description: `Purchase order created for ${name}.` });
  }

  return (
    <AppLayout>
      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total SKUs', value: summary.total, icon: Package, color: 'text-foreground' },
          { label: 'At Risk', value: summary.atRisk, icon: AlertTriangle, color: 'text-[#C3332B]' },
          { label: 'Low Stock', value: summary.lowStock, icon: TrendingDown, color: 'text-[#D4900A]' },
          { label: 'Out of Stock', value: summary.outOfStock, icon: Package, color: 'text-muted-foreground' },
          { label: 'Open POs', value: summary.openPOs, icon: ShoppingCart, color: 'text-[#2A5ECF]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-pharma py-4 px-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <span className={`kpi-number text-2xl ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SKU table */}
        <div className="lg:col-span-2">
          <h2 className="section-heading">Inventory</h2>
          <div className="card-pharma-compact overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-right font-mono">On Hand</th>
                  <th className="px-5 py-3 text-right font-mono">Reorder At</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, state }) => {
                  const needsAction = actionableStates.includes(state);
                  const poRaised = raisedPOs.has(product.sku);
                  return (
                    <tr key={product.sku} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium leading-tight">{product.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">{product.sku}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{product.category}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm">{product.currentStock}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm text-muted-foreground">{product.reorderPoint}</td>
                      <td className="px-5 py-3.5">
                        <StockBadge product={product} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {needsAction && (
                          poRaised ? (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ background:'#E4F5EB', color:'#0D4D2B' }}>PO Raised</span>
                          ) : (
                            <button
                              onClick={() => raisePO(product.sku, product.name)}
                              className="text-[11px] font-semibold px-3 py-1.5 rounded border transition-colors"
                              style={{ background:'#E7EDFC', color:'#1A3D7A', borderColor:'#2A5ECF' }}
                            >
                              Raise PO
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock risk orders */}
        <div>
          <h2 className="section-heading">Orders at Stock Risk</h2>
          {stockRiskOrders.length === 0 ? (
            <div className="card-pharma text-center py-8">
              <p className="text-muted-foreground text-sm">No orders with stock risk.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockRiskOrders.map(o => (
                <div key={o.id} className="card-pharma-compact p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                    <StageBadgeFromStatus status={o.status} />
                  </div>
                  <p className="text-sm font-semibold leading-tight">{o.account.name}</p>
                  <div className="mt-2 space-y-1">
                    {o.items.filter(i => i.product.currentStock < i.product.reorderPoint).map(i => (
                      <div key={i.product.sku} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{i.product.name}</span>
                        <span className="font-mono ml-2 flex-shrink-0" style={{ color:'#C3332B' }}>
                          {i.product.currentStock}/{i.qtyOrdered}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
