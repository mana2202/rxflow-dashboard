import type { OrderStatus } from '@/types';

/* Workflow status pills — token-driven with proper dark-mode (light tints
   no longer break in dark). Purple dropped; Ready to Ship now uses the
   info lane. These read as NEUTRAL-forward states, not alarms. */
const statusStyles: Record<OrderStatus, string> = {
  'Incoming':         'bg-info-tint text-info-text',
  'Verified':         'bg-success-tint text-success-text',
  'Picking':          'bg-warning-tint text-warning-text',
  'Compliance Check': 'bg-muted text-muted-foreground',
  'Ready to Ship':    'bg-info-tint text-info-text',
  'Shipped':          'bg-muted text-muted-foreground',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`pill ${statusStyles[status]}`}>{status}</span>;
}
