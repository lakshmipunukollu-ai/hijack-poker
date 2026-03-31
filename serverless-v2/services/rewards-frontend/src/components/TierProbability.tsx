import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { TIERS } from '../constants/tiers';

interface Transaction {
  timestamp: number;
  earnedPoints: number;
  type: string;
}

interface Props {
  transactions: Transaction[];
  monthlyPoints: number;
}

export default function TierProbability({ transactions, monthlyPoints }: Props) {
  const nextTier = TIERS.find((t) => t.minPoints > monthlyPoints);

  if (!nextTier) {
    return (
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Tier Forecast</Typography>
        <Typography variant="body2" color="primary" fontWeight={700}>
          💎 Maximum tier reached!
        </Typography>
      </Paper>
    );
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentGameplay = transactions.filter(
    (t) => t.type === 'gameplay' && t.timestamp > sevenDaysAgo
  );
  const avgPerDay = recentGameplay.length > 0
    ? recentGameplay.reduce((s, t) => s + t.earnedPoints, 0) / 7
    : 0;

  const ptsNeeded = nextTier.minPoints - monthlyPoints;
  const daysNeeded = avgPerDay > 0 ? Math.ceil(ptsNeeded / avgPerDay) : null;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  const willReach = daysNeeded !== null && daysNeeded <= daysLeft;
  const probability = daysNeeded !== null
    ? Math.min(100, Math.round((daysLeft / daysNeeded) * 100))
    : 0;

  return (
    <Paper sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <TrendingUpIcon sx={{ color: '#10B981', fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight={700}>Tier Forecast</Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Chance of reaching <strong style={{ color: '#F59E0B' }}>{nextTier.name}</strong> this month, based on recent{' '}
        <strong>gameplay</strong> reward events (not Unity table steps alone).
      </Typography>

      <Box sx={{
        bgcolor: willReach ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        borderRadius: 2,
        p: 1.5,
        mb: 1.5,
        textAlign: 'center',
      }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: willReach ? '#10B981' : '#EF4444' }}>
          {avgPerDay === 0 ? '—' : `${probability}%`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {avgPerDay === 0
            ? 'Award points (HUD or dashboard dev tools) to get a forecast'
            : daysNeeded !== null && willReach
              ? `On track — ~${daysNeeded} days needed, ${daysLeft} left`
              : `Need ${ptsNeeded.toLocaleString()} pts in ${daysLeft} days`}
        </Typography>
      </Box>

      {avgPerDay > 0 && (
        <>
          <LinearProgress
            variant="determinate"
            value={Math.min(probability, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': {
                bgcolor: willReach ? '#10B981' : '#EF4444',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Avg {avgPerDay.toFixed(1)} pts/day over last 7 days
          </Typography>
        </>
      )}
    </Paper>
  );
}
