export const TIERS = [
  { name: 'Bronze', minPoints: 0, multiplier: 1.0, color: '#CD7F32' },
  { name: 'Silver', minPoints: 500, multiplier: 1.25, color: '#9CA3AF' },
  { name: 'Gold', minPoints: 2000, multiplier: 1.5, color: '#F59E0B' },
  { name: 'Platinum', minPoints: 10000, multiplier: 2.0, color: '#A5B4FC' },
] as const;

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;

export const STAKES_OPTIONS = [
  { label: '$0.10/$0.25', tableStakes: '0.1/0.25', bigBlind: 0.25, basePoints: 1 },
  { label: '$0.50/$1.00', tableStakes: '0.5/1', bigBlind: 1.0, basePoints: 2 },
  { label: '$2.00/$5.00', tableStakes: '2/5', bigBlind: 5.0, basePoints: 5 },
  { label: '$10.00+', tableStakes: '5/10', bigBlind: 10.0, basePoints: 10 },
];

type TierRow = (typeof TIERS)[number];

export function calcTierForPoints(points: number): TierRow {
  return [...TIERS].reverse().find((t) => points >= t.minPoints) ?? TIERS[0];
}

/** Same rules as rewards-api getEffectiveTier — floor keeps you from displaying below that tier. */
export function getEffectiveTier(monthlyPoints: number, tierFloorName: string | undefined): TierRow {
  const floorRaw = tierFloorName?.trim() || 'Bronze';
  const floorName = (TIER_ORDER as readonly string[]).includes(floorRaw) ? floorRaw : 'Bronze';
  const fromPoints = calcTierForPoints(monthlyPoints);
  const floorTier = TIERS.find((t) => t.name === floorName) ?? TIERS[0];
  return fromPoints.minPoints >= floorTier.minPoints ? fromPoints : floorTier;
}

/** Next tier in the ladder, or null at Platinum. */
export function getNextTierThreshold(currentTierName: string): TierRow | null {
  const idx = TIERS.findIndex((t) => t.name === currentTierName);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}
