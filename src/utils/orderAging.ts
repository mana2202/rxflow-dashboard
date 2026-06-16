export type AgingState = 'fresh' | 'warning' | 'critical';

export interface AgingInfo {
  state: AgingState;
  minutesInQueue: number;
  cardClass: string;
  timerLabel: string;
  requiresEscalation: boolean;
}

const THRESHOLDS = { WARNING_MIN: 60, CRITICAL_MIN: 180 } as const;

export function computeAging(
  enteredQueueAt: string | Date | undefined,
  orderDate?: string | Date,
): AgingInfo {
  const anchor = enteredQueueAt ?? orderDate;
  if (!anchor) return { state:'fresh', minutesInQueue:0, cardClass:'age-fresh', timerLabel:'', requiresEscalation:false };

  const minutesInQueue = Math.floor((Date.now() - new Date(anchor).getTime()) / 60_000);

  if (minutesInQueue >= THRESHOLDS.CRITICAL_MIN) {
    const hrs = Math.floor(minutesInQueue / 60);
    const min = minutesInQueue % 60;
    return { state:'critical', minutesInQueue, cardClass:'age-critical',
      timerLabel:`⚠ ${hrs}h ${min}m — Senior ops notified`, requiresEscalation:true };
  }
  if (minutesInQueue >= THRESHOLDS.WARNING_MIN) {
    const hrs = Math.floor(minutesInQueue / 60);
    const min = minutesInQueue % 60;
    return { state:'warning', minutesInQueue, cardClass:'age-warning',
      timerLabel:`⏱ ${hrs}h ${min}m — escalating soon`, requiresEscalation:false };
  }
  const remaining = THRESHOLDS.WARNING_MIN - minutesInQueue;
  return { state:'fresh', minutesInQueue, cardClass:'age-fresh',
    timerLabel:minutesInQueue > 0 ? `⏱ Review within ${remaining} min` : '', requiresEscalation:false };
}
