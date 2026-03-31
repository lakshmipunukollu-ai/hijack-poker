import { Box, Typography, Paper, Tooltip } from '@mui/material';

interface Transaction {
  timestamp: number;
  earnedPoints: number;
  type: string;
}

interface Props {
  transactions: Transaction[];
}

export default function EarningsHeatmap({ transactions }: Props) {
  const data = (() => {
    const days: Record<string, number> = {};
    const now = new Date();

    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = 0;
    }

    transactions
      .filter((t) => t.type === 'gameplay')
      .forEach((t) => {
        const key = new Date(t.timestamp).toISOString().split('T')[0];
        if (key in days) days[key] += t.earnedPoints;
      });

    return days;
  })();

  const maxPoints = Math.max(...Object.values(data), 1);

  const getColor = (points: number) => {
    if (points === 0) return 'rgba(255,255,255,0.04)';
    const intensity = points / maxPoints;
    if (intensity < 0.25) return 'rgba(16,185,129,0.25)';
    if (intensity < 0.5) return 'rgba(16,185,129,0.45)';
    if (intensity < 0.75) return 'rgba(16,185,129,0.65)';
    return 'rgba(16,185,129,0.9)';
  };

  const entries = Object.entries(data);
  const weeks: Array<Array<[string, number]>> = [];
  for (let i = 0; i < entries.length; i += 7) {
    weeks.push(entries.slice(i, i + 7));
  }

  return (
    <Paper sx={{ p: 2.5, mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Activity Heatmap
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Last 12 weeks of gameplay
      </Typography>

      <Box sx={{ display: 'flex', gap: '3px', overflowX: 'auto' }}>
        {weeks.map((week, wi) => (
          <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map(([date, points]) => (
              <Tooltip
                key={date}
                title={`${date}: ${points} pts`}
                placement="top"
              >
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  bgcolor: getColor(points),
                  cursor: 'default',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8 },
                }}
                />
              </Tooltip>
            ))}
          </Box>
        ))}
      </Box>

      <Box display="flex" alignItems="center" gap={1} mt={1.5}>
        <Typography variant="caption" color="text.secondary">Less</Typography>
        {['rgba(255,255,255,0.04)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.45)', 'rgba(16,185,129,0.65)', 'rgba(16,185,129,0.9)'].map((c, i) => (
          <Box key={i} sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: c }} />
        ))}
        <Typography variant="caption" color="text.secondary">More</Typography>
      </Box>
    </Paper>
  );
}
