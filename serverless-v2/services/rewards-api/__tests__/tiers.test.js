'use strict';

const { getTierForPoints, tierOneTierBelow, getEffectiveTier } = require('../src/config/constants');

describe('getTierForPoints', () => {
  it.each([
    [0, 'Bronze'],
    [499, 'Bronze'],
    [500, 'Silver'],
    [1999, 'Silver'],
    [2000, 'Gold'],
    [9999, 'Gold'],
    [10000, 'Platinum'],
  ])('%i monthly points maps to %s tier', (points, expectedName) => {
    expect(getTierForPoints(points).name).toBe(expectedName);
  });
});

describe('tierOneTierBelow', () => {
  it.each([
    ['Bronze', 'Bronze'],
    ['Silver', 'Bronze'],
    ['Gold', 'Silver'],
    ['Platinum', 'Gold'],
  ])('%s → %s', (from, to) => {
    expect(tierOneTierBelow(from)).toBe(to);
  });
});

describe('getEffectiveTier', () => {
  it('uses points-only tier when above floor', () => {
    expect(getEffectiveTier(5000, 'Bronze').name).toBe('Gold');
  });

  it('raises tier to floor when points imply lower tier', () => {
    expect(getEffectiveTier(0, 'Gold').name).toBe('Gold');
    expect(getEffectiveTier(100, 'Silver').name).toBe('Silver');
  });

  it('treats missing or invalid floor as Bronze', () => {
    expect(getEffectiveTier(0, undefined).name).toBe('Bronze');
    expect(getEffectiveTier(0, 'Nope').name).toBe('Bronze');
  });
});
