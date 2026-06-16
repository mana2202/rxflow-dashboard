import { useRef, useEffect, type ReactNode } from 'react';
import { useOrderAging } from '@/hooks/useOrderAging';
import type { AgingInfo } from '@/utils/orderAging';
import '@/styles/aging.css';

interface AgingCardProps {
  enteredQueueAt?: string | Date;
  orderDate?: string | Date;
  className?: string;
  children: ReactNode | ((aging: AgingInfo & { isLiveTransition: boolean }) => ReactNode);
}

export function AgingCard({ enteredQueueAt, orderDate, className = '', children }: AgingCardProps) {
  const aging = useOrderAging(enteredQueueAt, orderDate);
  const cardRef = useRef<HTMLDivElement>(null);

  const animClass =
    aging.isLiveTransition && aging.state === 'critical' ? 'animate-aging-to-critical' :
    aging.isLiveTransition && aging.state === 'warning'  ? 'animate-aging-to-warning'  : '';

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !animClass) return;
    const handleEnd = () => el.classList.remove(animClass);
    el.addEventListener('animationend', handleEnd, { once: true });
    return () => el.removeEventListener('animationend', handleEnd);
  }, [animClass]);

  return (
    <div ref={cardRef}
      className={['rounded-lg border border-border overflow-hidden',
        aging.cardClass, animClass, className].filter(Boolean).join(' ')}
      data-aging-state={aging.state}
      data-aging-minutes={aging.minutesInQueue}>
      {typeof children === 'function' ? children(aging) : children}
    </div>
  );
}

export function AgingTimerLabel({ timerLabel, state }:
  { timerLabel: string; state: 'fresh' | 'warning' | 'critical' }) {
  if (!timerLabel) return null;
  const colors = { fresh:'#5C6370', warning:'#7A4510', critical:'#7A1F1A' };
  return (
    <span className="aging-timer text-[11px] font-semibold leading-none"
      style={{ color: colors[state] }} aria-live="polite" aria-label={timerLabel}>
      {timerLabel}
    </span>
  );
}
