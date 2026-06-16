import { useState, useRef, useCallback, cloneElement, isValidElement, Children, type ReactNode, type ReactElement } from 'react';
import '@/styles/hardstop.css';

export type HardStopAction = 'upload_renewal' | 'escalate' | null;
type BannerState = 'absent' | 'expanded' | 'collapsed';

interface ActionRecord {
  type: HardStopAction;
  operatorName: string;
  escalateeName?: string;
  timestamp: string;
}

interface Props {
  complianceIssue?: string | null;
  complianceCleared?: boolean;
  escalateeName?: string;
  operatorName: string;
  onUploadRenewal?: () => void;
  onEscalate?: () => void;
  children: ReactNode;
}

export function ComplianceHardStop({ complianceIssue, complianceCleared=false,
  escalateeName='senior ops', operatorName, onUploadRenewal, onEscalate, children }: Props) {
  const [bannerState, setBannerState] = useState<BannerState>('absent');
  const [animClass, setAnimClass] = useState('');
  const [actionRecord, setActionRecord] = useState<ActionRecord | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const isBlocked = Boolean(complianceIssue) && !complianceCleared;

  const handleApproveAttempt = useCallback(() => {
    if (!isBlocked) return;
    if (bannerState === 'absent') { setBannerState('expanded'); setAnimClass('hardstop-enter'); }
    else if (bannerState === 'collapsed') { setBannerState('expanded'); setAnimClass('hardstop-expand'); }
  }, [isBlocked, bannerState]);

  function collapse(action: HardStopAction) {
    if (action) setActionRecord({ type:action, operatorName,
      escalateeName: action==='escalate' ? escalateeName : undefined,
      timestamp: new Date().toISOString() });
    setAnimClass('hardstop-collapse');
    bannerRef.current?.addEventListener('animationend', () => {
      setBannerState('collapsed'); setAnimClass('');
    }, { once:true });
  }

  function handleAnimEnd() {
    if (animClass === 'hardstop-enter' || animClass === 'hardstop-expand') setAnimClass('');
  }

  return (
    <div>
      <div onClick={isBlocked ? handleApproveAttempt : undefined}>
        {isBlocked
          ? Children.map(children, c => !isValidElement(c) ? c : cloneElement(c as ReactElement<any>, {
              disabled: true,
              'aria-disabled': true,
              'aria-describedby': 'compliance-hardstop-banner',
              children: 'Blocked — compliance required',
            }))
          : children}
      </div>
      {isBlocked && bannerState !== 'absent' && (
        <div ref={bannerRef} className={animClass} onAnimationEnd={handleAnimEnd}>
          {bannerState === 'collapsed'
            ? <CollapsedStrip action={actionRecord} issueText={complianceIssue ?? ''} onExpand={handleApproveAttempt} />
            : <ExpandedBanner issueText={complianceIssue ?? ''}
                onUpload={() => { onUploadRenewal?.(); collapse('upload_renewal'); }}
                onEscalate={() => { onEscalate?.(); collapse('escalate'); }}
                onCollapseOnly={() => collapse(null)} />}
        </div>
      )}
    </div>
  );
}

function ExpandedBanner({ issueText, onUpload, onEscalate, onCollapseOnly }:
  { issueText:string; onUpload:()=>void; onEscalate:()=>void; onCollapseOnly:()=>void }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 border-y border-[#C3332B] bg-[#FDEAE9]"
      role="alert" aria-live="assertive" id="compliance-hardstop-banner">
      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
        style={{ background:'#C3332B' }} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-[12px] font-medium mb-1" style={{ color:'#7A1F1A' }}>
          Hard stop — compliance review required
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color:'#C3332B' }}>{issueText}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={onUpload}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-white border border-[#C3332B] cursor-pointer hover:bg-[#FDEAE9] transition-colors"
            style={{ color:'#7A1F1A' }}>Upload renewal</button>
          <button onClick={onEscalate}
            className="text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-[#FDEAE9] border border-border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color:'#7A1F1A' }}>Escalate to senior ops</button>
          <button onClick={onCollapseOnly}
            className="text-[11px] font-medium px-2.5 py-1.5 ml-auto text-muted-foreground hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer">
            Collapse ↑</button>
        </div>
      </div>
    </div>
  );
}

function CollapsedStrip({ action, issueText, onExpand }:
  { action:ActionRecord|null; issueText:string; onExpand:()=>void }) {
  const t = action?.timestamp
    ? new Date(action.timestamp).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : '';

  if (!action?.type) {
    return (
      <button onClick={onExpand}
        className="w-full flex items-center gap-3 px-5 py-2.5 text-left border-y border-[#C3332B] bg-[#FDEAE9] hover:opacity-90 transition-opacity hardstop-strip-enter"
        aria-label="Compliance issue unresolved — click to expand">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'#C3332B' }} aria-hidden="true" />
        <span className="flex-1 text-[11px] font-medium" style={{ color:'#7A1F1A' }}>Compliance issue — {issueText}</span>
        <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border flex-shrink-0"
          style={{ background:'#FDEAE9', borderColor:'#C3332B', color:'#7A1F1A', letterSpacing:'0.05em' }}>ACTION REQUIRED</span>
        <span className="text-[11px] flex-shrink-0" style={{ color:'#C3332B' }}>↓</span>
      </button>
    );
  }

  const copy = action.type === 'upload_renewal'
    ? { main:'Renewal document upload initiated', meta:`${action.operatorName} · ${t} · Pending verification` }
    : { main:`Escalated to senior ops${action.escalateeName ? ` — ${action.escalateeName}` : ''}`,
        meta:`${action.operatorName} · ${t} · Awaiting review` };

  return (
    <button onClick={onExpand}
      className="w-full flex items-center gap-3 px-5 py-2.5 text-left border-y border-[#D4900A] bg-[#FEF3E0] hover:opacity-90 transition-opacity hardstop-strip-enter"
      aria-label={`${copy.main} — click to expand`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'#D4900A' }} aria-hidden="true" />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[11px] font-medium truncate" style={{ color:'#7A4510' }}>{copy.main}</span>
        <span className="text-[10px]" style={{ color:'#D4900A' }}>{copy.meta}</span>
      </div>
      <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border flex-shrink-0"
        style={{ background:'#FEF3E0', borderColor:'#D4900A', color:'#7A4510', letterSpacing:'0.05em' }}>IN PROGRESS</span>
      <span className="text-[11px] flex-shrink-0" style={{ color:'#D4900A' }}>↓</span>
    </button>
  );
}
