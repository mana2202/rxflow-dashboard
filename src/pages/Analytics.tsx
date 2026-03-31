import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { demoOrders, demoDailyVolume, demoSLABreaches } from '@/data/demo';
import { PriorityBadge } from '@/components/PriorityBadge';
import { ProductTypePill } from '@/components/ProductTypePill';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { getLevel } from '@/utils/priorityScore';

const COLORS = { critical: '#E02020', high: '#D97706', medium: '#EAB308', routine: '#9CA3AF' };
const TYPE_COLORS = { otc: '#9CA3AF', controlled: '#E02020', device: '#3B82F6' };

export default function Analytics() {
  const [period, setPeriod] = useState('30d');

  const priorityDist = [
    { name: 'Critical', value: demoOrders.filter(o => o.priority.level === 'CRITICAL').length, color: COLORS.critical },
    { name: 'High', value: demoOrders.filter(o => o.priority.level === 'HIGH').length, color: COLORS.high },
    { name: 'Medium', value: demoOrders.filter(o => o.priority.level === 'MEDIUM').length, color: COLORS.medium },
    { name: 'Routine', value: demoOrders.filter(o => o.priority.level === 'ROUTINE').length, color: COLORS.routine },
  ];

  const slaByType = [
    { name: 'OTC', rate: 96.2, fill: TYPE_COLORS.otc },
    { name: 'Medical Devices', rate: 91.4, fill: TYPE_COLORS.device },
    { name: 'Controlled', rate: 88.9, fill: TYPE_COLORS.controlled },
  ];

  const fulfillmentByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    time: h >= 14 && h <= 16 ? 5.2 + Math.random() * 1.5 : h >= 6 && h <= 10 ? 2.8 + Math.random() * 0.8 : 3.5 + Math.random() * 1.2,
  }));

  const funnelData = [
    { name: 'Received', value: 1284, fill: '#0A0A0A' },
    { name: 'Verified', value: 1261, fill: '#374151' },
    { name: 'Picking', value: 1238, fill: '#6B7280' },
    { name: 'Compliance', value: 312, fill: '#E02020' },
    { name: 'Ready to Ship', value: 1219, fill: '#9CA3AF' },
    { name: 'Fulfilled', value: 1201, fill: '#16A34A' },
  ];

  return (
    <AppLayout
      title="Order Analytics"
      actions={
        <select value={period} onChange={e => setPeriod(e.target.value)} className="text-sm border border-border rounded px-3 py-1.5 bg-card">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="ytd">YTD</option>
        </select>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Orders Received', value: '1,284', sub: '+12% vs last period' },
          { label: 'Orders Fulfilled', value: '1,201', sub: '93.5% fulfillment' },
          { label: 'SLA Compliance', value: '93.7%', sub: 'Target: 95%' },
          { label: 'Avg. Fulfillment', value: '4.2 hrs', sub: '-0.8 hrs vs last period' },
          { label: 'Critical Escalated', value: '23', sub: '1.8% of total' },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold font-mono">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3 card-pharma p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Order Volume by Day</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={demoDailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="otc" name="OTC" fill={TYPE_COLORS.otc} stackId="a" />
              <Bar dataKey="controlled" name="Controlled" fill={TYPE_COLORS.controlled} stackId="a" />
              <Bar dataKey="device" name="Device" fill={TYPE_COLORS.device} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 card-pharma p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card-pharma p-5">
          <h3 className="font-display font-semibold text-sm mb-4">SLA Performance by Product Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={slaByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="rate" name="SLA %" radius={[0, 4, 4, 0]}>
                {slaByType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="border-t border-border mt-3 pt-2">
            <p className="text-[11px] text-muted-foreground">Target: 95% — Controlled substances below target (88.9%)</p>
          </div>
        </div>
        <div className="card-pharma p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Fulfillment Time by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={fulfillmentByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} unit="h" />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} hrs`} />
              <Line type="monotone" dataKey="time" stroke="#E02020" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="border-t border-border mt-3 pt-2">
            <p className="text-[11px] text-muted-foreground">Spike 2pm–4pm suggests shift-change bottleneck</p>
          </div>
        </div>
      </div>

      {/* Row 4 - Funnel */}
      <div className="card-pharma p-5 mb-6">
        <h3 className="font-display font-semibold text-sm mb-4">Order Pipeline Funnel</h3>
        <div className="flex items-end gap-2 justify-center h-48">
          {funnelData.map((stage, i) => {
            const maxVal = funnelData[0].value;
            const widthPct = (stage.value / maxVal) * 100;
            const prevVal = i > 0 ? funnelData[i - 1].value : stage.value;
            const pct = ((stage.value / prevVal) * 100).toFixed(1);
            return (
              <div key={stage.name} className="flex flex-col items-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">{stage.name}</p>
                <div className="w-full flex justify-center">
                  <div
                    className="rounded-t"
                    style={{
                      width: `${widthPct}%`,
                      minWidth: 40,
                      height: `${(stage.value / maxVal) * 140}px`,
                      backgroundColor: stage.fill,
                    }}
                  />
                </div>
                <p className="font-mono text-sm font-bold mt-1">{stage.value.toLocaleString()}</p>
                {i > 0 && <p className="text-[10px] text-muted-foreground">{pct}%</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 5 - SLA Breach Log */}
      <div className="card-pharma">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display font-semibold text-sm">SLA Breach Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-2 text-left">Order ID</th>
                <th className="px-5 py-2 text-left">Customer</th>
                <th className="px-5 py-2 text-left">Type</th>
                <th className="px-5 py-2 text-left">Priority</th>
                <th className="px-5 py-2 text-left">SLA Deadline</th>
                <th className="px-5 py-2 text-right">Delay (hrs)</th>
                <th className="px-5 py-2 text-left">Root Cause</th>
              </tr>
            </thead>
            <tbody>
              {demoSLABreaches.map(b => (
                <tr key={b.orderId} className="border-b border-border">
                  <td className="px-5 py-3 font-mono text-xs">{b.orderId}</td>
                  <td className="px-5 py-3">{b.customer}</td>
                  <td className="px-5 py-3"><ProductTypePill type={b.productType} /></td>
                  <td className="px-5 py-3"><PriorityBadge score={b.priorityAtBreach} level={getLevel(b.priorityAtBreach)} /></td>
                  <td className="px-5 py-3 text-xs font-mono">{format(new Date(b.slaDeadline), 'MMM dd, HH:mm')}</td>
                  <td className="px-5 py-3 text-right font-mono text-danger font-semibold">{b.delayHours.toFixed(1)}</td>
                  <td className="px-5 py-3 text-xs">{b.rootCause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
