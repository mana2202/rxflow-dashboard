import { CheckCircle2, AlertTriangle } from 'lucide-react';

/* Token-routed; consistent 4px pill radius with siblings. */
export function CompletenessTag({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-success-tint text-success-text">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-warning-tint text-warning-text">
      <AlertTriangle className="h-3 w-3" /> Needs Clarification
    </span>
  );
}
