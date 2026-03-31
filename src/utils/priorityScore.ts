export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE';

export interface PriorityBreakdown {
  urgency: number;
  slaProximity: number;
  stockRisk: number;
  customerTier: number;
  total: number;
  level: PriorityLevel;
}

export interface PriorityWeights {
  urgency: number;
  slaProximity: number;
  stockRisk: number;
  customerTier: number;
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  urgency: 40,
  slaProximity: 30,
  stockRisk: 20,
  customerTier: 10,
};

export function computePriorityScore(
  params: {
    isUrgent: boolean;
    slaHoursRemaining: number;
    hasStockRisk: boolean;
    customerTier: 1 | 2 | 3;
  },
  weights: PriorityWeights = DEFAULT_WEIGHTS
): PriorityBreakdown {
  const urgency = params.isUrgent ? weights.urgency : 0;

  let slaProximity = 0;
  if (params.slaHoursRemaining <= 0) {
    slaProximity = weights.slaProximity;
  } else if (params.slaHoursRemaining < 48) {
    slaProximity = Math.round(weights.slaProximity * (1 - params.slaHoursRemaining / 48));
  }

  const stockRisk = params.hasStockRisk ? weights.stockRisk : 0;

  const tierMap: Record<number, number> = { 1: weights.customerTier, 2: Math.round(weights.customerTier * 0.5), 3: Math.round(weights.customerTier * 0.2) };
  const customerTier = tierMap[params.customerTier] ?? 0;

  const total = Math.min(100, urgency + slaProximity + stockRisk + customerTier);

  return { urgency, slaProximity, stockRisk, customerTier, total, level: getLevel(total) };
}

export function getLevel(score: number): PriorityLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'ROUTINE';
}

export function getLevelColor(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return 'priority-critical';
    case 'HIGH': return 'priority-high';
    case 'MEDIUM': return 'priority-medium';
    case 'ROUTINE': return 'priority-routine';
  }
}
