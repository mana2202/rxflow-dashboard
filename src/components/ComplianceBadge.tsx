import type { ComplianceStatus } from '@/types';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

const map: Record<ComplianceStatus, { cls: string; icon: any; label: string }> = {
  'Not Required': { cls: 'bg-muted text-muted-foreground', icon: Shield, label: 'No DEA' },
  'Pending':      { cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300', icon: ShieldAlert, label: 'Compliance Pending' },
  'Passed':       { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: ShieldCheck, label: 'Compliance Passed' },
  'Blocked':      { cls: 'bg-red-500/15 text-red-700 dark:text-red-400', icon: ShieldX, label: 'Blocked' },
};

export function ComplianceBadge({ status, compact = false }: { status: ComplianceStatus; compact?: boolean }) {
  const { cls, icon: Icon, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {compact ? (status === 'Not Required' ? 'No DEA' : status) : label}
    </span>
  );
}
