import { Box, Tooltip, Typography } from '@mui/material';

interface Achievement {
  id: string;
  icon: string;
  label: string;
  description: string;
  unlocked: boolean;
}

interface Props {
  transactions: Array<{ type: string; timestamp: number; earnedPoints: number }>;
  lifetimePoints: number;
  tier: string;
}

export default function AchievementBadges({ transactions, lifetimePoints, tier }: Props) {
  const gameplay = transactions.filter((t) => t.type === 'gameplay');

  const achievements: Achievement[] = [
    {
      id: 'first_hand',
      icon: '🃏',
      label: 'First Hand',
      description: 'Played your first hand',
      unlocked: gameplay.length >= 1,
    },
    {
      id: 'ten_hands',
      icon: '🎯',
      label: 'Regular',
      description: 'Played 10 hands',
      unlocked: gameplay.length >= 10,
    },
    {
      id: 'silver_climber',
      icon: '🥈',
      label: 'Silver Climber',
      description: 'Reached Silver tier',
      unlocked: ['Silver', 'Gold', 'Platinum'].includes(tier),
    },
    {
      id: 'gold_rush',
      icon: '🥇',
      label: 'Gold Rush',
      description: 'Reached Gold tier',
      unlocked: ['Gold', 'Platinum'].includes(tier),
    },
    {
      id: 'high_earner',
      icon: '💰',
      label: 'High Earner',
      description: 'Earned 1000+ lifetime points',
      unlocked: lifetimePoints >= 1000,
    },
    {
      id: 'platinum_elite',
      icon: '💎',
      label: 'Elite',
      description: 'Reached Platinum tier',
      unlocked: tier === 'Platinum',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Achievements
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap">
        {achievements.map((a) => (
          <Tooltip key={a.id} title={`${a.label}: ${a.description}`}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              bgcolor: a.unlocked ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
              border: a.unlocked ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
              filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
              cursor: 'default',
              transition: 'all 0.2s',
            }}
            >
              {a.icon}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}
