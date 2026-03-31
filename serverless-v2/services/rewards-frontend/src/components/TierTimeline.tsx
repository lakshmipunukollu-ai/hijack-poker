import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface Props {
  monthlyPoints: number;
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#9CA3AF',
  Gold: '#F59E0B',
  Platinum: '#A5B4FC',
};

const TIER_VALUES: Record<string, number> = {
  Bronze: 1, Silver: 2, Gold: 3, Platinum: 4,
};

const TIER_BY_VALUE: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

export default function TierTimeline({ monthlyPoints, tier }: Props) {
  const data = (() => {
    const months: Array<{
      month: string;
      tier: string;
      value: number;
      isCurrent: boolean;
    }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const isCurrentMonth = i === 0;

      const tierIndex = TIER_VALUES[tier] || 1;
      const simulatedTierIndex = isCurrentMonth
        ? tierIndex
        : Math.max(1, tierIndex - Math.floor((i * 0.6)));

      const tierName = TIER_BY_VALUE[simulatedTierIndex] || 'Bronze';

      months.push({
        month: label,
        tier: tierName,
        value: simulatedTierIndex,
        isCurrent: isCurrentMonth,
      });
    }
    return months;
  })();

  return (
    <Paper sx={{ p: 2.5, mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Tier History
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Last 6 months · {monthlyPoints.toLocaleString()} pts this month
      </Typography>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} barSize={28}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide domain={[0, 4]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(_value, _name, item) => {
              const payload = item?.payload as { tier?: string } | undefined;
              return [payload?.tier ?? '', 'Tier'];
            }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={TIER_COLORS[entry.tier] || '#CD7F32'}
                opacity={entry.isCurrent ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Box display="flex" gap={1.5} mt={1} flexWrap="wrap">
        {Object.entries(TIER_COLORS).map(([name, color]) => (
          <Box key={name} display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">{name}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
