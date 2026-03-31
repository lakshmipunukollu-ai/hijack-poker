import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Typography, Paper } from '@mui/material';

interface Transaction {
  type: string;
  earnedPoints: number;
}

interface Props {
  transactions: Transaction[];
}

const COLORS: Record<string, string> = {
  gameplay: '#10B981',
  adjustment: '#F59E0B',
  bonus: '#A78BFA',
};

export default function PointsBreakdown({ transactions }: Props) {
  const breakdown = transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + t.earnedPoints;
    return acc;
  }, {});

  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (!data.length) return null;

  return (
    <Paper sx={{ p: 2.5, mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Points Breakdown
      </Typography>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 12,
            }}
            itemStyle={{ fontWeight: 700 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 11 }}>{String(value)}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}
