import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { rewardsApiOrigin } from '../constants/environment';
import { TIERS } from '../constants/tiers';

/** Align HUD / dashboard tier fields with award response without refetching Rewards (avoids brief 0 flash). */
function snapshotFromAwardedTier(tierName: string, monthlyPoints: number) {
  const idx = TIERS.findIndex((t) => t.name === tierName);
  const meta = idx >= 0 ? TIERS[idx] : TIERS[0];
  const next = idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  return {
    monthlyPoints,
    tier: tierName,
    multiplier: meta.multiplier,
    nextTierAt: next ? next.minPoints : null,
    nextTierName: next ? next.name : null,
  };
}

const BASE = rewardsApiOrigin();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE ? `${BASE}/api/v1` : '/api/v1',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('jwt');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Dedup parallel 401 recoveries (JWT default ~1h — see SessionWarning vs silent expiry). */
let refreshJwtPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshJwtPromise) {
    refreshJwtPromise = (async () => {
      try {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) return false;
        const origin = (BASE || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
        const url = `${origin}/api/v1/auth/token`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { token?: string };
        if (!data?.token) return false;
        localStorage.setItem('jwt', data.token);
        const { login, store } = await import('../store');
        store.dispatch(login({ playerId, token: data.token }));
        return true;
      } catch {
        return false;
      } finally {
        refreshJwtPromise = null;
      }
    })();
  }
  return refreshJwtPromise;
}

/** 401 → POST /auth/token once, retry request; else logout (polling outlives SessionWarning; local API uses longer JWT — see rewards-api auth route). */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const path = typeof args === 'string' ? args : args.url;
  let result = await rawBaseQuery(args, api, extraOptions);

  if (
    result.error &&
    typeof result.error === 'object' &&
    'status' in result.error &&
    result.error.status === 401 &&
    !String(path).includes('/auth/token')
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      const { logout, store } = await import('../store');
      store.dispatch(logout());
    }
  }

  return result;
};

export interface Transaction {
  timestamp: number;
  type: string;
  basePoints: number;
  multiplier: number;
  earnedPoints: number;
  tableId?: number;
  tableStakes?: string;
  monthKey: string;
  handId?: string;
  reason?: string;
  createdAt: string;
}
interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  dismissed: boolean;
  createdAt: string;
}
export interface RewardsData {
  playerId: string;
  /** Monthly reset floor — use with reconciled monthly points for display tier. */
  tierFloor: string;
  tier: string;
  multiplier: number;
  monthlyPoints: number;
  lifetimePoints: number;
  nextTierAt: number | null;
  nextTierName: string | null;
  recentTransactions: Transaction[];
}
export interface HistoryData { transactions: Transaction[]; total: number }
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  points: number;
  tier: string;
}
export interface LeaderboardYourRank {
  rank: number;
  playerId: string;
  displayName: string;
  tier: string;
  monthlyPoints: number;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  /** Present when the viewer is outside the top 100; null if in top 100 or unknown. */
  yourRank: LeaderboardYourRank | null;
  updatedAt: string;
}
export interface NotificationsData { notifications: Notification[]; unreadCount: number }
export interface AwardPointsBody {
  playerId: string;
  tableId: number;
  tableStakes: string;
  bigBlind: number;
  handId: string;
}
export interface AwardResponse {
  playerId: string;
  newBalance: number;
  tier: string;
  earnedPoints: number;
  duplicate?: boolean;
}

/** Public HUD payload (no auth) — matches GET /player/rewards-hud */
export interface RewardsHudData {
  playerId: string;
  tier: string;
  multiplier: number;
  monthlyPoints: number;
  lifetimePoints: number;
  nextTierAt: number | null;
  nextTierName: string | null;
}

export const rewardsApi = createApi({
  reducerPath: 'rewardsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Rewards', 'History', 'Leaderboard', 'Notifications'],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    getRewards: builder.query<RewardsData, void>({
      query: () => '/player/rewards',
      providesTags: ['Rewards'],
      keepUnusedDataFor: 60,
    }),
    getRewardsHud: builder.query<RewardsHudData, string>({
      query: (playerId) => ({
        url: '/player/rewards-hud',
        params: { playerId },
      }),
      providesTags: (_r, _e, playerId) => [{ type: 'Rewards', id: `hud-${playerId}` }],
      keepUnusedDataFor: 30,
    }),
    getHistory: builder.query<HistoryData, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) =>
        `/player/history?limit=${limit}&offset=${offset}`,
      providesTags: ['History'],
      keepUnusedDataFor: 60,
    }),
    getLeaderboard: builder.query<LeaderboardData, void>({
      query: () => '/points/leaderboard',
      providesTags: ['Leaderboard'],
      keepUnusedDataFor: 120,
    }),
    getNotifications: builder.query<NotificationsData, void>({
      query: () => '/player/notifications?unread=true',
      providesTags: ['Notifications'],
      keepUnusedDataFor: 30,
    }),
    dismissNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/player/notifications/${encodeURIComponent(id)}/dismiss`,
        method: 'PATCH',
        body: {},
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          rewardsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
            if (!draft.notifications?.length) return;
            const before = draft.notifications.length;
            draft.notifications = draft.notifications.filter((n) => n.id !== id);
            if (draft.notifications.length < before) {
              draft.unreadCount = Math.max(0, (draft.unreadCount ?? 0) - 1);
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ['Notifications'],
    }),
    awardPoints: builder.mutation<AwardResponse, AwardPointsBody>({
      query: (body) => ({ url: '/points/award', method: 'POST', body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const snap = snapshotFromAwardedTier(data.tier, data.newBalance);
          dispatch(
            rewardsApi.util.updateQueryData('getRewardsHud', arg.playerId, (draft) => {
              draft.monthlyPoints = snap.monthlyPoints;
              draft.tier = snap.tier;
              draft.multiplier = snap.multiplier;
              draft.nextTierAt = snap.nextTierAt;
              draft.nextTierName = snap.nextTierName;
              draft.lifetimePoints = (draft.lifetimePoints ?? 0) + data.earnedPoints;
            }),
          );
          dispatch(
            rewardsApi.util.updateQueryData('getRewards', undefined, (draft) => {
              draft.monthlyPoints = snap.monthlyPoints;
              draft.tier = snap.tier;
              draft.multiplier = snap.multiplier;
              draft.nextTierAt = snap.nextTierAt;
              draft.nextTierName = snap.nextTierName;
              draft.lifetimePoints = (draft.lifetimePoints ?? 0) + data.earnedPoints;
            }),
          );
        } catch {
          /* surfaced by unwrap() in components */
        }
      },
      invalidatesTags: ['History', 'Leaderboard'],
    }),
    getToken: builder.mutation<{ token: string; expiresIn: number }, { playerId: string }>({
      query: (body) => ({ url: '/auth/token', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetRewardsQuery,
  useGetRewardsHudQuery,
  useGetHistoryQuery,
  useGetLeaderboardQuery,
  useGetNotificationsQuery,
  useDismissNotificationMutation,
  useAwardPointsMutation,
  useGetTokenMutation,
} = rewardsApi;
