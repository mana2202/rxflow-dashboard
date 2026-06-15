import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/hardstop.css';

interface Props {
  orderId: string;
  reason: string;
  onEscalate?: () => void;
  onDismiss?: () => void;
}

export function ComplianceHardStop({ orderId, reason, onEscalate, onDismiss }: Props) {
  return (
    <div className="hardstop-overlay" role="alertdialog" aria-modal="true" aria-labelledby="hardstop-title">
      <div className="hardstop-panel">
        <div className="hardstop-icon hardstop-icon-pulse">
          <ShieldX className="w-6 h-6" />
        </div>

        <h2 className="hardstop-title" id="hardstop-title">Compliance Hard Stop</h2>

        <div className="hardstop-badge">
          <span>Order {orderId}</span>
        </div>

        <p className="hardstop-reason">{reason}</p>

        <p className="text-xs text-muted-foreground mb-5">
          This order cannot proceed until the compliance block is resolved. Contact your pharmacist or compliance officer to review.
        </p>

        <div className="hardstop-actions">
          {onDismiss && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
          {onEscalate && (
            <Button size="sm" className="flex-1 bg-danger text-danger-foreground hover:opacity-90" onClick={onEscalate}>
              Escalate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
