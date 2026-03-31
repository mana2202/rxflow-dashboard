import type { OrderStatus } from '@/types';

const statusStyles: Record<OrderStatus, string> = {
  'Incoming': 'bg-blue-50 text-blue-700',
  'Verified': 'bg-emerald-50 text-emerald-700',
  'Picking': 'bg-amber-50 text-amber-700',
  'Compliance Check': 'bg-red-50 text-red-700',
  'Ready to Ship': 'bg-purple-50 text-purple-700',
  'Shipped': 'bg-muted text-muted-foreground',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`pill ${statusStyles[status]}`}>{status}</span>;
}
