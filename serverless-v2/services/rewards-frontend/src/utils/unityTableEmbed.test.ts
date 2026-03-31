import { describe, it, expect } from 'vitest';
import { buildUnityEmbedUrl } from './unityTableEmbed';

const BASE = 'http://localhost:8090';
const REWARDS = 'http://localhost:5000';
const DASHBOARD = 'http://localhost:4000';

describe('buildUnityEmbedUrl', () => {
  it('includes player, rewardsApi, and dashboard params', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'player-001',
      rewardsApiBase: REWARDS,
      dashboardBase: DASHBOARD,
    });
    const parsed = new URL(url);
    // WHATWG URL normalises host-only URLs to pathname "/"
    expect(parsed.origin + parsed.pathname.replace(/\/$/, '')).toBe(BASE);
    expect(parsed.searchParams.get('player')).toBe('player-001');
    expect(parsed.searchParams.get('rewardsApi')).toBe(REWARDS);
    expect(parsed.searchParams.get('dashboard')).toBe(DASHBOARD);
  });

  it('omits dashboard param when not provided', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'player-001',
      rewardsApiBase: REWARDS,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('dashboard')).toBe(false);
  });

  it('omits dashboard param when empty string', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'player-001',
      rewardsApiBase: REWARDS,
      dashboardBase: '',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('dashboard')).toBe(false);
  });

  it('strips trailing slash from unityBase', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE + '/',
      playerId: 'p1',
      rewardsApiBase: REWARDS,
    });
    expect(url.startsWith(BASE + '?')).toBe(true);
  });

  it('strips trailing slash from rewardsApiBase', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'p1',
      rewardsApiBase: REWARDS + '/',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('rewardsApi')).toBe(REWARDS);
  });

  it('strips trailing slash from dashboardBase', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'p1',
      rewardsApiBase: REWARDS,
      dashboardBase: DASHBOARD + '/',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('dashboard')).toBe(DASHBOARD);
  });

  it('supports non-default rewards port (macOS AirPlay workaround)', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'p1',
      rewardsApiBase: 'http://localhost:5500',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('rewardsApi')).toBe('http://localhost:5500');
  });

  it('handles player ids with special characters correctly', () => {
    const url = buildUnityEmbedUrl({
      unityBase: BASE,
      playerId: 'user@example.com',
      rewardsApiBase: REWARDS,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('player')).toBe('user@example.com');
  });

  it('different players produce different urls', () => {
    const url1 = buildUnityEmbedUrl({ unityBase: BASE, playerId: 'alice', rewardsApiBase: REWARDS });
    const url2 = buildUnityEmbedUrl({ unityBase: BASE, playerId: 'bob', rewardsApiBase: REWARDS });
    expect(url1).not.toBe(url2);
  });
});
