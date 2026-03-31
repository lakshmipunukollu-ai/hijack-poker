import { buildUnityEmbedUrl } from '../utils/unityTableEmbed';

/** Base URL without trailing slash, or '' in dev when using Vite same-origin `/api` proxy. */
export function rewardsApiOrigin(): string {
  const trimmed =
    import.meta.env.VITE_API_URL != null
      ? String(import.meta.env.VITE_API_URL).trim()
      : '';
  if (trimmed) return trimmed.replace(/\/$/, '');
  if (import.meta.env.DEV) return '';
  return 'http://localhost:5000';
}

/**
 * Full URL for the rewards health check. Must match how `rewardsApi` reaches the API
 * (same-origin in dev, or `VITE_API_URL` / prod default).
 */
export function rewardsApiHealthUrl(): string {
  const base = rewardsApiOrigin();
  const path = '/api/v1/health';
  if (base) return `${base}${path}`;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
}

/** Same as `rewardsApiOrigin()` — use for display or other fetches that need the API host. */
export const REWARDS_API_BASE = rewardsApiOrigin();

/** Holdem processor (Option B/D engine). */
export const ENGINE_BASE = import.meta.env.VITE_ENGINE_URL || 'http://localhost:3030';

/** Unity WebGL static origin (iframe src). */
export const UNITY_WEBGL_BASE = import.meta.env.VITE_UNITY_TABLE_URL || 'http://localhost:8090';

/**
 * Rewards API origin reachable by Unity WebGL in the browser (different origin from :8090).
 * The Vite dev proxy (`/api`) is only available to the dashboard page itself — WebGL cannot use it.
 * Set `VITE_UNITY_REWARDS_URL` if `REWARDS_API_PORT` is not 5000 (e.g. 5500 on macOS AirPlay conflict).
 */
export function rewardsApiOriginForUnityEmbedding(): string {
  const explicit = rewardsApiOrigin();
  if (explicit) return explicit;
  const envOverride = import.meta.env.VITE_UNITY_REWARDS_URL;
  if (envOverride != null && String(envOverride).trim() !== '') {
    return String(envOverride).trim().replace(/\/$/, '');
  }
  return 'http://localhost:5000';
}

/**
 * Builds the Unity WebGL iframe src with the logged-in player id and rewards API URL embedded
 * as query params, so Unity reads them via `WebGlLaunchParams` in its `Awake()`.
 * Dashboard origin is added as `?dashboard=` for an optional "open full dashboard" link inside Unity.
 */
export function buildUnityTableEmbedSrc(playerId: string): string {
  return buildUnityEmbedUrl({
    unityBase: UNITY_WEBGL_BASE,
    playerId,
    rewardsApiBase: rewardsApiOriginForUnityEmbedding(),
    dashboardBase: typeof window !== 'undefined' ? window.location.origin : undefined,
  });
}
