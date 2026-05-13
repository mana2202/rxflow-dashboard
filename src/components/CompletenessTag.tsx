import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function CompletenessTag({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300">
      <AlertTriangle className="h-3 w-3" /> Needs Clarification
    </span>
  );
}
