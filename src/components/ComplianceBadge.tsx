import type { ComplianceStatus } from '@/types';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

/* Compliance — token-routed. Red is reserved for Blocked (a genuine
   stop). Pending = warning, Passed = success, Not Required = neutral.
   Every state carries a shield icon variant for non-color differentiation. */
const map: Record<ComplianceStatus, { cls: string; icon: any; label: string }> = {
  'Not Required': { cls: 'bg-muted text-muted-foreground',        icon: Shield,      label: 'No DEA' },
  'Pending':      { cls: 'bg-warning-tint text-warning-text',     icon: ShieldAlert, label: 'Compliance Pending' },
  'Passed':       { cls: 'bg-success-tint text-success-text',     icon: ShieldCheck, label: 'Compliance Passed' },
  'Blocked':      { cls: 'bg-danger-tint text-danger-text',       icon: ShieldX,     label: 'Blocked' },
};

export function ComplianceBadge({ status, compact = false }: { status: ComplianceStatus; compact?: boolean }) {
  const { cls, icon: Icon, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {compact ? (status === 'Not Required' ? 'No DEA' : status) : label}
    </span>
  );
}
