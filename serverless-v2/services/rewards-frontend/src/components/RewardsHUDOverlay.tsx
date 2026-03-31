import {
  Box,
  ButtonBase,
  Typography,
  LinearProgress,
  Chip,
  Collapse,
  Paper,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useGetRewardsHudQuery, useAwardPointsMutation } from '../api/rewardsApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import AnimatedNumber from './AnimatedNumber';
import toast from 'react-hot-toast';
import { STAKES_OPTIONS } from '../constants/tiers';

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#9CA3AF',
  Gold: '#F59E0B',
  Platinum: '#A5B4FC',
};

const HUD_POLL_MS = 2500;
const DEFAULT_STAKE_INDEX = 2;

function isAwardRateLimited(err: unknown): boolean {
  const e = err as FetchBaseQueryError | undefined;
  return e != null && typeof e === 'object' && 'status' in e && e.status === 429;
}

export default function RewardsHUDOverlay() {
  const [expanded, setExpanded] = useState(true);
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const { data: rewards } = useGetRewardsHudQuery(playerId as string, {
    skip: !playerId,
    pollingInterval: HUD_POLL_MS,
  });
  const [awardPoints, { isLoading }] = useAwardPointsMutation();

  if (!rewards || !playerId) return null;

  const tier = rewards.tier;
  const color = TIER_COLORS[tier] || '#10B981';
  const progress = rewards.nextTierAt
    ? Math.min((rewards.monthlyPoints / rewards.nextTierAt) * 100, 100)
    : 100;

  const handlePlayHand = async () => {
    const stake = STAKES_OPTIONS[DEFAULT_STAKE_INDEX];
    try {
      const result = await awardPoints({
        playerId,
        tableId: 1,
        tableStakes: stake.tableStakes,
        bigBlind: stake.bigBlind,
        handId: `hand-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }).unwrap();
      toast.success(`+${result.earnedPoints} pts earned!`);
    } catch (err) {
      const rateLimited = isAwardRateLimited(err);
      toast.error(
        rateLimited
          ? 'Rate limited — wait a moment before awarding again.'
          : 'Failed to award points.',
        { id: rateLimited ? 'rewards-award-429' : 'rewards-hud-award-error' },
      );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'absolute',
        bottom: `max(16px, env(safe-area-inset-bottom, 0px))`,
        right: `max(16px, env(safe-area-inset-right, 0px))`,
        width: expanded ? 288 : 52,
        maxWidth: 'calc(100% - 24px)',
        zIndex: 30,
        bgcolor: 'rgba(17,24,39,0.97)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color}55`,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      }}
    >
      <ButtonBase
        focusRipple
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse rewards HUD' : 'Expand rewards HUD'}
        onClick={() => setExpanded(!expanded)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: expanded ? 1.75 : 0,
          py: 1,
          borderBottom: expanded ? `1px solid ${color}33` : 'none',
          transition: 'background-color 0.15s ease',
          color: 'inherit',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        {expanded && (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontSize: 16 }} component="span">
              {tier === 'Bronze'
                ? '🥉'
                : tier === 'Silver'
                  ? '🥈'
                  : tier === 'Gold'
                    ? '🥇'
                    : '💎'}
            </Typography>
            <Typography variant="caption" fontWeight={800} sx={{ color }} component="span">
              {tier}
            </Typography>
          </Box>
        )}
        <Box
          component="span"
          sx={{
            color,
            display: 'inline-flex',
            mx: expanded ? 0 : 'auto',
            opacity: 0.95,
          }}
        >
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </Box>
      </ButtonBase>

      <Collapse in={expanded}>
        <Box px={2} pb={2} pt={1}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, mb: 1 }}>
            Same rewards as your dashboard. <strong>Award Hand</strong> adds test points (not from each poker step).
          </Typography>
          <Typography variant="h5" fontWeight={900} sx={{ color }}>
            <AnimatedNumber value={rewards.monthlyPoints} />
            <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
              pts
            </Typography>
          </Typography>

          {rewards.nextTierAt != null && (
            <>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  my: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& .MuiLinearProgress-bar': { bgcolor: color },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {(rewards.nextTierAt - rewards.monthlyPoints).toLocaleString()} to{' '}
                {rewards.nextTierName}
              </Typography>
            </>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
            <Chip
              label={`${rewards.multiplier}x`}
              size="small"
              sx={{
                bgcolor: '#F59E0B22',
                color: '#F59E0B',
                fontSize: 10,
                height: 20,
                fontWeight: 700,
              }}
            />
            <Tooltip title="Add a test hand to your point history" arrow>
              <Box
                component="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePlayHand();
                }}
                disabled={isLoading}
                sx={{
                  bgcolor: color,
                  color: '#000',
                  border: 'none',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 1px 4px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12) inset`,
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease',
                  '&:hover': {
                    opacity: isLoading ? 0.6 : 1,
                    filter: 'brightness(1.08)',
                    boxShadow: `0 3px 10px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.18) inset`,
                  },
                  '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: 2 },
                  '&:disabled': { cursor: 'not-allowed', opacity: 0.5 },
                }}
              >
                {isLoading ? '...' : '▶ Award Hand'}
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
