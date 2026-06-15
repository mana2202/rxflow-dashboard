import { useOrderAging } from '@/hooks/useOrderAging';
import '@/styles/aging.css';

interface Props {
  orderId: string;
  orderDateISO: string;
  title?: string;
  compact?: boolean;
}

export function AgingCard({ orderId, orderDateISO, title, compact = false }: Props) {
  const { tier, label } = useOrderAging(orderDateISO);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="aging-dot" data-tier={tier} />
        <span className="aging-label" data-tier={tier}>{label}</span>
      </span>
    );
  }

  return (
    <div className="aging-card" data-tier={tier}>
      <span className="aging-dot" data-tier={tier} />
      <div className="flex flex-col gap-0.5 min-w-0">
        {title && (
          <span className="text-xs font-medium text-foreground truncate">{title}</span>
        )}
        <span className="text-[11px] text-muted-foreground font-mono">{orderId}</span>
      </div>
      <span className="aging-label ml-auto" data-tier={tier}>{label}</span>
    </div>
  );
}
