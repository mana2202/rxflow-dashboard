import { useState, useEffect, useRef } from 'react';
import { computeAging, type AgingInfo, type AgingState } from '@/utils/orderAging';

interface AgingResult extends AgingInfo {
  isLiveTransition: boolean;
  prevState: AgingState | null;
}

export function useOrderAging(
  enteredQueueAt: string | Date | undefined,
  orderDate?: string | Date,
): AgingResult {
  const [aging, setAging] = useState<AgingResult>(() => ({
    ...computeAging(enteredQueueAt, orderDate),
    isLiveTransition: false,
    prevState: null,
  }));
  const prevStateRef = useRef<AgingState | null>(null);

  useEffect(() => {
    const initial = computeAging(enteredQueueAt, orderDate);
    prevStateRef.current = initial.state;
    setAging({ ...initial, isLiveTransition: false, prevState: null });

    const interval = setInterval(() => {
      const next = computeAging(enteredQueueAt, orderDate);
      const prev = prevStateRef.current;
      const didChange = prev !== null && next.state !== prev;
      setAging({ ...next, isLiveTransition: didChange, prevState: didChange ? prev : null });
      prevStateRef.current = next.state;
    }, 30_000);

    return () => clearInterval(interval);
  }, [enteredQueueAt, orderDate]);

  return aging;
}
