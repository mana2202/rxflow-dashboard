import { useState, useEffect, useRef } from 'react';

export type AgingState = 'fresh' | 'warning' | 'critical';

export interface AgingResult {
  state: AgingState;
  mins: number;
  cardClass: string;
  timerLabel: string;
}

export function computeAging(enteredQueueAt: string | undefined): AgingResult {
  if (!enteredQueueAt) {
    return { state: 'fresh', mins: 0, cardClass: 'age-fresh', timerLabel: '' };
  }
  const mins = Math.floor((Date.now() - new Date(enteredQueueAt).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (mins >= 180) {
    return {
      state: 'critical', mins, cardClass: 'age-critical',
      timerLabel: `${h}h ${m}m in queue — senior ops notified`,
    };
  }
  if (mins >= 60) {
    return {
      state: 'warning', mins, cardClass: 'age-warning',
      timerLabel: `${h}h ${m}m in queue — escalating soon`,
    };
  }
  return { state: 'fresh', mins, cardClass: 'age-fresh', timerLabel: '' };
}

export function useOrderAging(enteredQueueAt: string | undefined) {
  const [aging, setAging] = useState<AgingResult>(() => computeAging(enteredQueueAt));
  const prevState = useRef<AgingState>(aging.state);
  const [isLiveTransition, setIsLiveTransition] = useState(false);

  useEffect(() => {
    const tick = () => {
      const next = computeAging(enteredQueueAt);
      if (next.state !== prevState.current) {
        setIsLiveTransition(true);
        prevState.current = next.state;
        // Reset after longest animation (400ms) so class doesn't persist indefinitely
        setTimeout(() => setIsLiveTransition(false), 500);
      }
      setAging(next);
    };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [enteredQueueAt]);

  return { aging, isLiveTransition };
}
