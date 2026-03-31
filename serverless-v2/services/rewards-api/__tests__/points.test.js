'use strict';

const { calcBasePoints, TIERS } = require('../src/config/constants');

/** Matches POST /points/award: Math.round(basePoints * multiplier). */
function earnGameplayPoints(bigBlind, tierMultiplier) {
  const base = calcBasePoints(bigBlind);
  return Math.round(base * tierMultiplier);
}

describe('calcBasePoints', () => {
  describe('big-blind bands', () => {
    it('returns 1 base point for $0.25 class (BB <= 0.25)', () => {
      expect(calcBasePoints(0.25)).toBe(1);
      expect(calcBasePoints(0.1)).toBe(1);
    });

    it('returns 2 base points for $1 class (BB > 0.25 and <= 1)', () => {
      expect(calcBasePoints(1)).toBe(2);
      expect(calcBasePoints(0.26)).toBe(2);
    });

    it('returns 5 base points for $5 class (BB > 1 and <= 5)', () => {
      expect(calcBasePoints(5)).toBe(5);
      expect(calcBasePoints(1.01)).toBe(5);
    });

    it('returns 10 base points for $10+ class (BB > 5)', () => {
      expect(calcBasePoints(10)).toBe(10);
      expect(calcBasePoints(5.01)).toBe(10);
      expect(calcBasePoints(100)).toBe(10);
    });
  });
});

describe('earned points formula (base × tier multiplier, rounded like /points/award)', () => {
  const bronzeBase = calcBasePoints(10);

  it('Bronze 1x multiplier', () => {
    expect(earnGameplayPoints(10, TIERS.BRONZE.multiplier)).toBe(
      Math.round(bronzeBase * 1.0),
    );
    expect(earnGameplayPoints(10, TIERS.BRONZE.multiplier)).toBe(10);
  });

  it('Silver 1.25x multiplier', () => {
    expect(earnGameplayPoints(10, TIERS.SILVER.multiplier)).toBe(
      Math.round(bronzeBase * 1.25),
    );
    expect(earnGameplayPoints(10, TIERS.SILVER.multiplier)).toBe(13);
  });

  it('Gold 1.5x multiplier', () => {
    expect(earnGameplayPoints(10, TIERS.GOLD.multiplier)).toBe(
      Math.round(bronzeBase * 1.5),
    );
    expect(earnGameplayPoints(10, TIERS.GOLD.multiplier)).toBe(15);
  });

  it('Platinum 2x multiplier', () => {
    expect(earnGameplayPoints(10, TIERS.PLATINUM.multiplier)).toBe(
      Math.round(bronzeBase * 2.0),
    );
    expect(earnGameplayPoints(10, TIERS.PLATINUM.multiplier)).toBe(20);
  });
});
