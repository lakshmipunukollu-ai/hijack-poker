'use strict';

/**
 * Rewards tier definitions.
 * Points thresholds for tier progression.
 */
const TIERS = {
  BRONZE: { name: 'Bronze', minPoints: 0, multiplier: 1.0 },
  SILVER: { name: 'Silver', minPoints: 500, multiplier: 1.25 },
  GOLD: { name: 'Gold', minPoints: 2000, multiplier: 1.5 },
  PLATINUM: { name: 'Platinum', minPoints: 10000, multiplier: 2.0 },
};

/**
 * Point award rules — how points are earned.
 */
const POINT_RULES = {
  HAND_PLAYED: { points: 1, description: 'Played a hand' },
  HAND_WON: { points: 5, description: 'Won a hand' },
  TOURNAMENT_ENTRY: { points: 10, description: 'Entered a tournament' },
  TOURNAMENT_WIN: { points: 50, description: 'Won a tournament' },
  DAILY_LOGIN: { points: 2, description: 'Daily login bonus' },
  REFERRAL: { points: 100, description: 'Referred a friend' },
};

/**
 * Base points before tier multiplier, from table big blind (same bands as /points/award).
 */
function calcBasePoints(bigBlind) {
  if (bigBlind <= 0.25) return 1;
  if (bigBlind <= 1.0) return 2;
  if (bigBlind <= 5.0) return 5;
  return 10;
}

/** Canonical order (low → high) for floor math and comparisons. */
const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum'];

/**
 * Get tier for a given point total (ignores floor).
 */
function getTierForPoints(points) {
  const tiers = Object.values(TIERS).sort((a, b) => b.minPoints - a.minPoints);
  return tiers.find((t) => points >= t.minPoints) || TIERS.BRONZE;
}

/**
 * One step down for monthly-reset tier floor (minimum Bronze).
 */
function tierOneTierBelow(tierName) {
  const i = TIER_NAMES.indexOf(tierName);
  if (i <= 0) return 'Bronze';
  return TIER_NAMES[i - 1];
}

/**
 * Effective tier after applying tierFloor: never below the floor, even when points imply a lower tier.
 */
function getEffectiveTier(monthlyPoints, tierFloorName) {
  const floorName =
    tierFloorName && TIER_NAMES.includes(tierFloorName) ? tierFloorName : 'Bronze';
  const fromPoints = getTierForPoints(monthlyPoints || 0);
  const floorTier = Object.values(TIERS).find((t) => t.name === floorName) || TIERS.BRONZE;
  return fromPoints.minPoints >= floorTier.minPoints ? fromPoints : floorTier;
}

/**
 * Get the next tier above the current one (or null if at max).
 */
function getNextTier(currentTierName) {
  const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentIndex = tierOrder.indexOf(currentTierName);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) return null;
  const nextName = tierOrder[currentIndex + 1];
  return Object.values(TIERS).find((t) => t.name === nextName);
}

module.exports = {
  TIERS,
  POINT_RULES,
  TIER_NAMES,
  calcBasePoints,
  getTierForPoints,
  tierOneTierBelow,
  getEffectiveTier,
  getNextTier,
};
