import type { ReactNode } from 'react';
import { Drawer, Box, Typography, Chip, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Transaction } from '../api/rewardsApi';

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  gameplay: '#10B981',
  adjustment: '#F59E0B',
  bonus: '#A78BFA',
};

export default function HandDetailDrawer({ open, transaction, onClose }: Props) {
  if (!transaction) return null;

  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Date & Time', value: new Date(transaction.timestamp).toLocaleString() },
    {
      label: 'Type',
      value: (
        <Chip
          label={transaction.type}
          size="small"
          sx={{
            bgcolor: `${TYPE_COLORS[transaction.type] ?? '#6B7280'}22`,
            color: TYPE_COLORS[transaction.type] ?? '#6B7280',
            fontSize: 11,
          }}
        />
      ),
    },
    { label: 'Table ID', value: transaction.tableId ? `Table #${transaction.tableId}` : '—' },
    { label: 'Stakes', value: transaction.tableStakes || '—' },
    { label: 'Base Points', value: transaction.basePoints },
    { label: 'Multiplier', value: `${transaction.multiplier}x` },
    {
      label: 'Points Earned',
      value: (
        <Typography fontWeight={800} color="primary">
          +
          {transaction.earnedPoints}
        </Typography>
      ),
    },
    {
      label: 'Hand ID',
      value: (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
          {transaction.handId || '—'}
        </Typography>
      ),
    },
    ...(transaction.reason ? [{ label: 'Reason' as const, value: transaction.reason }] : []),
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 320, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', p: 3 } }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Hand Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
      <Box display="flex" flexDirection="column" gap={2}>
        {rows.map((row) => (
          <Box key={row.label} display="flex" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">{row.label}</Typography>
            <Box sx={{ textAlign: 'right', maxWidth: '58%' }}>
              {typeof row.value === 'string' || typeof row.value === 'number' ? (
                <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
              ) : (
                row.value
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
