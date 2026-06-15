export type AgingTier = 'fresh' | 'aging' | 'stale' | 'critical';

export interface AgingInfo {
  hoursOld: number;
  tier: AgingTier;
  label: string;
  colorClass: string;
  bgClass: string;
}

const THRESHOLDS = {
  fresh: 4,
  aging: 12,
  stale: 24,
};

export function getAgingTier(hoursOld: number): AgingTier {
  if (hoursOld < THRESHOLDS.fresh) return 'fresh';
  if (hoursOld < THRESHOLDS.aging) return 'aging';
  if (hoursOld < THRESHOLDS.stale) return 'stale';
  return 'critical';
}

export function getAgingLabel(hoursOld: number): string {
  if (hoursOld < 1) return `${Math.round(hoursOld * 60)}m old`;
  if (hoursOld < 24) return `${Math.floor(hoursOld)}h old`;
  const days = Math.floor(hoursOld / 24);
  const hrs = Math.floor(hoursOld % 24);
  return hrs > 0 ? `${days}d ${hrs}h old` : `${days}d old`;
}

export function getAgingInfo(orderDateISO: string): AgingInfo {
  const hoursOld = (Date.now() - new Date(orderDateISO).getTime()) / 3_600_000;
  const tier = getAgingTier(hoursOld);

  const colorMap: Record<AgingTier, string> = {
    fresh:    'text-emerald-700 dark:text-emerald-400',
    aging:    'text-amber-700 dark:text-amber-400',
    stale:    'text-orange-700 dark:text-orange-400',
    critical: 'text-red-700 dark:text-red-400',
  };
  const bgMap: Record<AgingTier, string> = {
    fresh:    'bg-emerald-500/10',
    aging:    'bg-amber-500/10',
    stale:    'bg-orange-500/10',
    critical: 'bg-red-500/10',
  };

  return {
    hoursOld,
    tier,
    label: getAgingLabel(hoursOld),
    colorClass: colorMap[tier],
    bgClass: bgMap[tier],
  };
}
