import { Box, Typography, LinearProgress } from '@mui/material';

const MILESTONES = [
  { points: 500, label: 'Rising Star', icon: '⭐' },
  { points: 1000, label: 'High Roller', icon: '💰' },
  { points: 2000, label: 'Silver Climber', icon: '🥈' },
  { points: 5000, label: 'Gold Chaser', icon: '🥇' },
  { points: 10000, label: 'Platinum Elite', icon: '💎' },
];

interface Props {
  lifetimePoints: number;
}

export default function MilestoneProgress({ lifetimePoints }: Props) {
  const nextMilestone = MILESTONES.find((m) => m.points > lifetimePoints);
  const prevMilestone = [...MILESTONES].reverse().find((m) => m.points <= lifetimePoints);

  if (!nextMilestone) {
    return (
      <Box sx={{ bgcolor: 'rgba(165,180,252,0.08)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#A5B4FC', fontWeight: 700 }}>
          💎 Maximum milestone reached!
        </Typography>
      </Box>
    );
  }

  const base = prevMilestone?.points ?? 0;
  const span = nextMilestone.points - base;
  const progress = span > 0 ? ((lifetimePoints - base) / span) * 100 : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" color="text.secondary">
          Next milestone
        </Typography>
        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
          {nextMilestone.icon} {nextMilestone.label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(Math.max(progress, 0), 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': { bgcolor: '#F59E0B' },
        }}
      />
      <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
        {Math.max(0, nextMilestone.points - lifetimePoints).toLocaleString()} pts to go
      </Typography>
    </Box>
  );
}
