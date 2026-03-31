import { useMemo, useState, useRef, useEffect, Fragment } from 'react';
import {
  Box, Container, Grid, Paper, Typography, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Skeleton, LinearProgress,
  Collapse,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { RootState } from '../store';
import Navbar from '../components/Navbar';
import SessionWarning from '../components/SessionWarning';
import TierRing from '../components/TierRing';
import AnimatedNumber from '../components/AnimatedNumber';
import HandDetailDrawer from '../components/HandDetailDrawer';
import TierTimeline from '../components/TierTimeline';
import {
  useGetRewardsQuery,
  useGetHistoryQuery,
  useGetLeaderboardQuery,
  type Transaction,
} from '../api/rewardsApi';
import { getEffectiveTier, getNextTierThreshold } from '../constants/tiers';

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32', Silver: '#9CA3AF', Gold: '#F59E0B', Platinum: '#A5B4FC',
};
const TYPE_COLORS: Record<string, string> = {
  gameplay: '#10B981', adjustment: '#F59E0B', bonus: '#A78BFA',
};

function TierBadge({ tier }: { tier: string }) {
  const emojis: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
  return (
    <Box sx={{
      width: 80, height: 80, borderRadius: '50%',
      background: `radial-gradient(circle, ${TIER_COLORS[tier] ?? '#6B7280'}44, ${TIER_COLORS[tier] ?? '#6B7280'}11)`,
      border: `3px solid ${TIER_COLORS[tier] ?? '#6B7280'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 36,
    }}>
      {emojis[tier] ?? '🎮'}
    </Box>
  );
}

function PlayerCardSkeleton() {
  return (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Skeleton variant="circular" width={120} height={120} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton variant="text" width={80} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton variant="text" width={60} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton variant="text" width={200} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton variant="rectangular" width={100} height={28} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
    </Paper>
  );
}

function HistoryTableRowSkeleton() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function LeaderboardTableRowSkeleton() {
  return (
    <TableRow>
      {[1, 2, 3, 4].map((i) => (
        <TableCell key={i}>
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function Dashboard() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [expandedLeaderboardId, setExpandedLeaderboardId] = useState<string | null>(null);
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const prevTierRef = useRef<string | null>(null);

  const { data: rewards, isLoading: rewardsLoading, isError: rewardsError } = useGetRewardsQuery(undefined, {
    skip: !playerId,
    pollingInterval: 60000,
    refetchOnFocus: false,
  });
  const { data: history, isLoading: historyLoading, isError: historyError } = useGetHistoryQuery(
    { limit: 100 },
    {
      skip: !playerId,
      pollingInterval: 60000,
      refetchOnFocus: false,
    },
  );
  const { data: leaderboard, isLoading: leaderboardLoading, isError: leaderboardError } = useGetLeaderboardQuery(undefined, {
    skip: !playerId,
    pollingInterval: 120000,
    refetchOnFocus: false,
  });

  const displayLeaderboard = useMemo(
    () => (leaderboard?.leaderboard ?? []).slice(0, 10),
    [leaderboard?.leaderboard],
  );

  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthlyFromHistory = useMemo(() => {
    return (history?.transactions ?? []).reduce((sum, t) => {
      const mk = t.monthKey ?? new Date(t.timestamp).toISOString().slice(0, 7);
      if (mk !== currentMonthKey) return sum;
      return sum + (t.earnedPoints ?? 0);
    }, 0);
  }, [history?.transactions, currentMonthKey]);
  /** Reconcile profile total with the ledger: same monthKey + earnedPoints sum fixes stale or mismatched GET /player/rewards. */
  const monthly = Math.max(rewards?.monthlyPoints ?? 0, monthlyFromHistory);

  const tierFloor = rewards?.tierFloor ?? 'Bronze';
  const displayTierMeta = useMemo(
    () => getEffectiveTier(monthly, tierFloor),
    [monthly, tierFloor],
  );
  const tier = displayTierMeta.name;

  const nextTierMeta = useMemo(() => getNextTierThreshold(tier), [tier]);
  const nextTierAt = nextTierMeta?.minPoints ?? null;
  const nextTierName = nextTierMeta?.name ?? null;
  const progress = nextTierAt != null ? Math.min((monthly / nextTierAt) * 100, 100) : 100;
  const ptsToNext = nextTierAt != null ? Math.max(0, nextTierAt - monthly) : 0;

  const handsThisMonth = history?.transactions?.filter((t) => t.type === 'gameplay').length ?? 0;

  useEffect(() => {
    if (!tier || !rewards) return;
    if (prevTierRef.current && prevTierRef.current !== tier) {
      const prevIdx = TIER_ORDER.indexOf(prevTierRef.current as typeof TIER_ORDER[number]);
      const nextIdx = TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number]);
      const isUpgrade = nextIdx > prevIdx && prevIdx !== -1;
      if (isUpgrade) {
        toast.success(`🎉 Tier upgrade! Welcome to ${tier}!`, { duration: 5000 });
      }
    }
    prevTierRef.current = tier;
  }, [tier, rewards]);

  useEffect(() => {
    if (rewardsError) toast.error('Something went wrong. Try again.');
  }, [rewardsError]);

  useEffect(() => {
    if (historyError) toast.error('Something went wrong. Try again.');
  }, [historyError]);

  useEffect(() => {
    if (leaderboardError) toast.error('Something went wrong. Try again.');
  }, [leaderboardError]);

  if (!playerId) {
    return <Navigate to="/login" replace />;
  }

  const myLeaderboardRow = leaderboard?.leaderboard?.find((e) => e.playerId === playerId);
  const footerRank =
    leaderboard?.yourRank?.rank ??
    (myLeaderboardRow && myLeaderboardRow.rank > 10 ? myLeaderboardRow.rank : null);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Navbar tier={tier} />
      <SessionWarning />
      <Container
        maxWidth={false}
        sx={{
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: { md: 1480, lg: 1680 },
          mx: 'auto',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography component="h1" variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
            Rewards
          </Typography>
        </Box>

        <Grid container spacing={3}>

          <Grid item xs={12} md={4} lg={3}>
            {rewardsLoading ? (
              <PlayerCardSkeleton />
            ) : (
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ alignSelf: 'stretch' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
                    Your status
                  </Typography>
                </Box>
                <TierRing tier={tier} progress={progress}>
                  <TierBadge tier={tier} />
                </TierRing>
                <Typography variant="h5" fontWeight={800} sx={{ color: TIER_COLORS[tier] ?? '#9CA3AF' }}>{tier}</Typography>
                <Typography variant="caption" color="text.secondary">Monthly Points</Typography>
                <Typography variant="h4" fontWeight={900}>
                  <AnimatedNumber value={monthly} />
                </Typography>
                {nextTierMeta != null && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      alignSelf: 'stretch',
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                        bgcolor: TIER_COLORS[tier] ?? '#10B981',
                      },
                    }}
                  />
                )}
                {nextTierMeta != null ? (
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    {ptsToNext > 0 ? (
                      <>
                        <AnimatedNumber value={ptsToNext} /> pts to {nextTierName}
                      </>
                    ) : (
                      <>{nextTierName} reached.</>
                    )}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    Platinum reached.
                  </Typography>
                )}
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={8} lg={6}>
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Points history
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 480 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Date', 'Stakes', 'Base', 'Mult', 'Earned', 'Type'].map((h) => (
                        <TableCell key={h} sx={{ bgcolor: '#111827', color: 'text.secondary', fontSize: 11, fontWeight: 700 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyLoading ? (
                      Array.from({ length: 5 }, (_, i) => <HistoryTableRowSkeleton key={i} />)
                    ) : history?.transactions?.length ? history.transactions.map((t, i) => (
                      <TableRow
                        key={`${t.timestamp}-${i}`}
                        onClick={() => setSelectedTx(t)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                        }}
                      >
                        <TableCell sx={{ fontSize: 12 }}>{new Date(t.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{t.tableStakes ?? '—'}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{t.basePoints}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{t.multiplier}x</TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                          +<AnimatedNumber value={t.earnedPoints} duration={0.6} />
                        </TableCell>
                        <TableCell>
                          <Chip label={t.type} size="small" sx={{
                            bgcolor: `${TYPE_COLORS[t.type] ?? '#6B7280'}22`,
                            color: TYPE_COLORS[t.type] ?? '#6B7280',
                            fontSize: 10, height: 20,
                          }} />
                        </TableCell>
                      </TableRow>
                    )) : historyError ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'error.light', px: 3 }}>
                          Could not load history. Ensure the Rewards API is running and the frontend proxy URL matches your setup.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', px: 3, lineHeight: 1.6 }}>
                          No points earned yet this month.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {!rewardsLoading && (
              <Box sx={{ mt: 2 }}>
                <TierTimeline monthlyPoints={monthly} tier={tier} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={12} lg={3}>
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Leaderboard
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                  Top players by <strong>this calendar month’s</strong> points. Click a row for details (yours vs others).
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 480 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Rank', 'Player', 'Tier', 'Monthly Pts'].map((h) => (
                        <TableCell key={h} sx={{ bgcolor: '#111827', color: 'text.secondary', fontSize: 11, fontWeight: 700 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboardLoading ? (
                      Array.from({ length: 5 }, (_, i) => <LeaderboardTableRowSkeleton key={i} />)
                    ) : (displayLeaderboard.length ? displayLeaderboard.map((entry) => {
                      const isMe = entry.playerId === playerId;
                      /** Match status card: reconciled monthly + getEffectiveTier (API row can lag profile/history). */
                      const rowPoints = isMe ? monthly : entry.points;
                      const rowTier = isMe ? tier : entry.tier;
                      const medals = ['🥇', '🥈', '🥉'];
                      const expanded = expandedLeaderboardId === entry.playerId;
                      return (
                        <Fragment key={entry.playerId}>
                          <TableRow
                            onClick={() => setExpandedLeaderboardId(expanded ? null : entry.playerId)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isMe ? 'rgba(16,185,129,0.06)' : 'transparent',
                              borderLeft: isMe ? '3px solid #10B981' : '3px solid transparent',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                            }}
                          >
                            <TableCell sx={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                {medals[entry.rank - 1] ?? entry.rank}
                                <KeyboardArrowDownIcon
                                  sx={{
                                    fontSize: 18,
                                    color: 'text.secondary',
                                    transform: expanded ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s',
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: 12 }}>
                              {entry.displayName.substring(0, 16)}{isMe ? ' (you)' : ''}
                            </TableCell>
                            <TableCell>
                              <Chip label={rowTier} size="small" sx={{
                                bgcolor: `${TIER_COLORS[rowTier] ?? '#6B7280'}22`,
                                color: TIER_COLORS[rowTier] ?? '#6B7280',
                                fontSize: 10, height: 20,
                              }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>
                              <AnimatedNumber value={rowPoints} duration={0.8} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={4} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                              <Collapse in={expanded}>
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 1.5,
                                    bgcolor: 'rgba(0,0,0,0.22)',
                                    borderTop: '1px solid rgba(255,255,255,0.04)',
                                  }}
                                >
                                  {isMe ? (
                                    <Box component="ul" sx={{ m: 0, pl: 2, typography: 'caption', color: 'text.secondary', lineHeight: 1.6 }}>
                                      <li>
                                        <strong>Monthly points</strong> (ledger) —{' '}
                                        <AnimatedNumber value={monthly} /> · same basis as your row above when highlighted.
                                      </li>
                                      <li>
                                        <strong>Tier</strong> — {tier} · <strong>Multiplier</strong> —{' '}
                                        {displayTierMeta.multiplier}x
                                        {nextTierName ? (
                                          <>
                                            {' '}
                                            · <strong>Next</strong> — {nextTierName} at{' '}
                                            <AnimatedNumber value={nextTierAt ?? 0} /> pts
                                          </>
                                        ) : null}
                                      </li>
                                      <li>
                                        <strong>Lifetime</strong> — <AnimatedNumber value={rewards?.lifetimePoints ?? 0} /> pts
                                      </li>
                                      <li>
                                        <strong>Gameplay rows this month</strong> — {handsThisMonth} (from points history, type gameplay).
                                      </li>
                                      <li>Open <strong>Points history</strong> for every award line and hand-level fields.</li>
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
                                      This API does not expose other players&apos; hands, lifetime totals, or history. You only
                                      see the same four columns as the table: rank, name, tier, monthly points.
                                    </Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No players yet</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!leaderboardLoading && footerRank != null && (
                  <Box px={2} py={1.5} sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(16,185,129,0.04)' }}>
                    <Typography variant="caption" color="primary">Your rank: #{footerRank}</Typography>
                  </Box>
                )}
              </TableContainer>
            </Paper>
          </Grid>

        </Grid>
      </Container>
      <HandDetailDrawer
        open={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </Box>
  );
}
