import '../styles/hardstop.css';
import { useState, Children, isValidElement, cloneElement } from 'react';
import { ShieldX, AlertTriangle, Upload, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';

type BannerState = 'absent' | 'entered' | 'strip-upload' | 'strip-escalate' | 'collapsed';

interface Props {
  complianceIssue: string | null;
  complianceCleared: boolean;
  operatorName: string;
  children: ReactNode;
}

export function ComplianceHardStop({ complianceIssue, complianceCleared, operatorName, children }: Props) {
  const [banner, setBanner] = useState<BannerState>('absent');
  const [actionTime, setActionTime] = useState('');
  const [animClass, setAnimClass] = useState('');

  const isBlocked = Boolean(complianceIssue) && !complianceCleared;

  const handleApproveAttempt = () => {
    if (!isBlocked || banner !== 'absent') return;
    setBanner('entered');
    setAnimClass('hardstop-enter');
  };

  const handleAction = (action: 'upload' | 'escalate' | 'collapse') => {
    const time = format(new Date(), 'HH:mm');
    if (action === 'upload') {
      setBanner('strip-upload');
      setActionTime(time);
      setAnimClass('hardstop-strip-enter');
      toast({ title: 'Renewal upload initiated', description: 'Document upload process started.' });
    } else if (action === 'escalate') {
      setBanner('strip-escalate');
      setActionTime(time);
      setAnimClass('hardstop-strip-enter');
      toast({ title: 'Escalated to senior ops', description: `${operatorName} escalated this order.` });
    } else {
      setBanner('collapsed');
      setAnimClass('hardstop-collapse');
    }
  };

  const handleExpandStrip = () => {
    setBanner('entered');
    setAnimClass('hardstop-expand');
  };

  if (!isBlocked) return <>{children}</>;

  const wrappedChildren = Children.map(children, child => {
    if (!isValidElement(child)) return child;
    return cloneElement(child as React.ReactElement<any>, {
      disabled: true,
      'aria-disabled': true,
      children: 'Blocked — compliance required',
    });
  });

  return (
    <div>
      <div onClick={banner === 'absent' ? handleApproveAttempt : undefined} className={banner === 'absent' ? 'cursor-pointer' : ''}>
        {wrappedChildren}
      </div>

      {/* Full banner — enters on first click */}
      {banner === 'entered' && (
        <div
          className={`mt-3 flex items-start gap-2 p-3 rounded-md bg-danger-tint border border-danger/30 text-sm ${animClass}`}
          onAnimationEnd={() => setAnimClass('')}
        >
          <ShieldX className="h-4 w-4 mt-0.5 shrink-0 text-danger" />
          <div className="flex-1">
            <div className="font-semibold text-danger-text">Compliance blocked — order cannot proceed to fulfillment</div>
            <div className="text-xs text-danger-text opacity-75 mt-1">{complianceIssue}</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleAction('upload')} className="btn-pharma-outline text-xs gap-1">
                <Upload className="h-3 w-3" /> Upload Renewal
              </button>
              <button onClick={() => handleAction('escalate')} className="btn-pharma-outline text-xs">
                Escalate to Senior Ops
              </button>
              <button onClick={() => handleAction('collapse')} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
                Collapse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed strip — click to re-expand */}
      {(banner === 'collapsed' || banner === 'strip-upload' || banner === 'strip-escalate') && (
        <button
          onClick={handleExpandStrip}
          className={`mt-3 w-full text-left p-2.5 rounded-md border text-xs font-medium flex items-center gap-2 ${animClass} ${
            banner === 'strip-escalate' || banner === 'strip-upload'
              ? 'bg-warning-tint border-warning/30 text-warning-text'
              : 'bg-danger-tint border-danger/30 text-danger-text'
          }`}
          onAnimationEnd={() => setAnimClass('')}
        >
          {banner === 'collapsed'
            ? <><ShieldX className="h-3.5 w-3.5 shrink-0" /> Compliance blocked — click to review</>
            : banner === 'strip-upload'
            ? <><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Renewal upload initiated · {actionTime}</>
            : <><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Escalated to senior ops — {operatorName} · {actionTime}</>
          }
          <ChevronDown className="h-3.5 w-3.5 ml-auto" />
        </button>
      )}
    </div>
  );
}
