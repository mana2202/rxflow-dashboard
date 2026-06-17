import '../styles/aging.css';
import { useOrderAging } from '@/utils/aging';
import type { AgingResult } from '@/utils/aging';
import type { ReactNode } from 'react';

interface AgingCardProps {
  enteredQueueAt?: string;
  children: (props: { aging: AgingResult; transitionClass: string }) => ReactNode;
}

export function AgingCard({ enteredQueueAt, children }: AgingCardProps) {
  const { aging, isLiveTransition } = useOrderAging(enteredQueueAt);

  const transitionClass = isLiveTransition
    ? aging.state === 'critical'
      ? 'animate-aging-to-critical'
      : aging.state === 'warning'
      ? 'animate-aging-to-warning'
      : ''
    : '';

  return <>{children({ aging, transitionClass })}</>;
}
