/**
 * Pure URL builder for embedding Unity WebGL in the React /table page.
 *
 * All functions are side-effect-free so they can be tested without a DOM / import.meta.env.
 * The env-aware wrapper `buildUnityTableEmbedSrc` in constants/environment.ts is the runtime entry point.
 */

export interface EmbedParams {
  /** Unity WebGL base URL, e.g. "http://localhost:8090" */
  unityBase: string;
  /** Player id from the dashboard login, forwarded as ?player= */
  playerId: string;
  /** Rewards API base URL, forwarded as ?rewardsApi= (cross-origin from Unity's :8090) */
  rewardsApiBase: string;
  /** Optional React dashboard origin, forwarded as ?dashboard= for a "back" link inside Unity */
  dashboardBase?: string;
}

/**
 * Builds the iframe src so Unity WebGL receives the same player id + rewards API URL
 * as the logged-in React session. Trailing slashes are normalised.
 *
 * Example output:
 *   http://localhost:8090?player=player-001&rewardsApi=http%3A%2F%2Flocalhost%3A5000&dashboard=http%3A%2F%2Flocalhost%3A4000
 */
export function buildUnityEmbedUrl({
  unityBase,
  playerId,
  rewardsApiBase,
  dashboardBase,
}: EmbedParams): string {
  const base = unityBase.replace(/\/$/, '');
  const params = new URLSearchParams({
    player: playerId,
    rewardsApi: rewardsApiBase.replace(/\/$/, ''),
  });
  if (dashboardBase && dashboardBase.trim() !== '') {
    params.set('dashboard', dashboardBase.replace(/\/$/, ''));
  }
  return `${base}?${params.toString()}`;
}
