import type { ReactNode } from 'react';
import { Box } from '@mui/material';

interface Props {
  tier: string;
  progress: number; // 0-100
  children: ReactNode;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#9CA3AF',
  Gold: '#F59E0B',
  Platinum: '#A5B4FC',
};

export default function TierRing({ tier, progress, children }: Props) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = TIER_COLORS[tier] || '#10B981';

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <Box sx={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          key={tier}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'tierPulse 0.6s ease-out',
            '@keyframes tierPulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.15)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
