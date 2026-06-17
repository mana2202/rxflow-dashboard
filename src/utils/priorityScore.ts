export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MED' | 'LOW';

export interface PriorityBreakdown {
  slaUrgency: number;           // 0–40  (40% weight)
  clientTier: number;           // 0–25  (25% weight)
  complianceComplexity: number; // 0–20  (20% weight)
  stockRisk: number;            // 0–15  (15% weight)
  total: number;
  level: PriorityLevel;
}

export function computePriorityScore(params: {
  isUrgent: boolean;
  slaHoursRemaining: number;
  hasStockRisk: boolean;
  customerTier: 1 | 2 | 3;
  productType?: 'OTC' | 'Controlled' | 'Device';
}): PriorityBreakdown {
  // SLA urgency: 40% — how close is the delivery date; isUrgent maxes it out
  let slaUrgency = 0;
  if (params.isUrgent || params.slaHoursRemaining <= 0) {
    slaUrgency = 40;
  } else if (params.slaHoursRemaining < 48) {
    slaUrgency = Math.round(40 * (1 - params.slaHoursRemaining / 48));
  }

  // Client tier: 25% — VIP (Tier 1) highest
  const tierScores: Record<number, number> = { 1: 25, 2: 12, 3: 5 };
  const clientTier = tierScores[params.customerTier] ?? 5;

  // Compliance complexity: 20% — Controlled > Device > OTC
  const compMap: Record<string, number> = { Controlled: 20, Device: 10, OTC: 0 };
  const complianceComplexity = compMap[params.productType ?? 'OTC'] ?? 0;

  // Stock risk: 15% — AT RISK or OUT
  const stockRisk = params.hasStockRisk ? 15 : 0;

  const total = Math.min(100, slaUrgency + clientTier + complianceComplexity + stockRisk);
  return { slaUrgency, clientTier, complianceComplexity, stockRisk, total, level: getLevel(total) };
}

export function getLevel(score: number): PriorityLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MED';
  return 'LOW';
}

export function getLevelColor(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return 'priority-critical';
    case 'HIGH':     return 'priority-high';
    case 'MED':      return 'priority-medium';
    case 'LOW':      return 'priority-routine';
  }
}
