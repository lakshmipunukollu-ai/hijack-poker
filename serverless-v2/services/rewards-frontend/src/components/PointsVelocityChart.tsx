import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface Transaction {
  timestamp: number;
  earnedPoints: number;
  type: string;
}

interface Props {
  transactions: Transaction[];
}

export default function PointsVelocityChart({ transactions }: Props) {
  const data = (() => {
    const days: Record<string, number> = {};
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = 0;
    }

    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    transactions
      .filter((t) => t.type === 'gameplay' && t.timestamp >= cutoff)
      .forEach((t) => {
        const key = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (key in days) days[key] += t.earnedPoints;
      });

    return Object.entries(days).map(([date, points]) => ({ date, points }));
  })();

  const hasData = data.some((d) => d.points > 0);

  return (
    <Paper sx={{ p: 2.5, mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Points This Month
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Daily earnings over the last 14 days
      </Typography>

      {!hasData ? (
        <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">Play hands to see your trend</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#10B981', fontWeight: 700 }}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#pointsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
