import { Box, Typography, Tooltip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface Props {
  transactions: Array<{ type: string; timestamp: number }>;
}

export default function HotStreak({ transactions }: Props) {
  const gameplay = transactions.filter((t) => t.type === 'gameplay');
  if (gameplay.length < 3) return null;

  const now = Date.now();
  const recent = gameplay.filter((t) => now - t.timestamp < 10 * 60 * 1000);
  const streak = recent.length;

  if (streak < 3) return null;

  return (
    <Tooltip title={`${streak} hands in a row — you're on fire!`}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 2,
        px: 1.5,
        py: 0.5,
        animation: 'pulse 1.5s infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      }}>
        <LocalFireDepartmentIcon sx={{ color: '#EF4444', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700 }}>
          {streak} hand streak!
        </Typography>
      </Box>
    </Tooltip>
  );
}
