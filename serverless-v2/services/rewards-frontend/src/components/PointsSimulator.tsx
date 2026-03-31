import { useState } from 'react';
import { Paper, Typography, Select, MenuItem, Slider, Box, Chip, FormControl, Stack, Divider } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { STAKES_OPTIONS, calcTierForPoints } from '../constants/tiers';

interface Props { currentPoints: number }

export default function PointsSimulator({ currentPoints }: Props) {
  const [stakeIdx, setStakeIdx] = useState(0);
  const [hands, setHands] = useState(10);

  const stake = STAKES_OPTIONS[stakeIdx];
  const currentTier = calcTierForPoints(currentPoints);
  const earned = Math.round(stake.basePoints * currentTier.multiplier * hands);
  const projectedPoints = currentPoints + earned;
  const projectedTier = calcTierForPoints(projectedPoints);

  const fieldLabelSx = { fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75, fontSize: '0.75rem' };

  return (
    <Paper sx={{ p: 2.5, border: '1px solid rgba(16,185,129,0.22)' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <CalculateIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <Typography variant="subtitle1" fontWeight={800}>
          Points simulator
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, lineHeight: 1.55 }}>
        Offline calculator — same tier math as the API. <strong>Does not save</strong> or call the server. Use{' '}
        <strong>Award Hand</strong> (table page) or developer tools to create real history rows.
      </Typography>

      <Typography component="label" htmlFor="sim-stakes" sx={fieldLabelSx}>
        Table stakes
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
        <Select
          id="sim-stakes"
          value={stakeIdx}
          onChange={(e) => setStakeIdx(Number(e.target.value))}
          sx={{
            fontSize: 14,
            bgcolor: 'rgba(15,23,42,0.55)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(16,185,129,0.35)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(16,185,129,0.55)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
          }}
        >
          {STAKES_OPTIONS.map((s, i) => (
            <MenuItem key={s.label} value={i}>{s.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography id="sim-hands-label" sx={fieldLabelSx}>
        Hands to play: <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{hands}</Box>
      </Typography>
      <Slider
        value={hands}
        onChange={(_, v) => setHands(v as number)}
        min={1} max={100} step={1}
        aria-labelledby="sim-hands-label"
        sx={{
          color: '#10B981',
          mb: 2,
          height: 8,
          '& .MuiSlider-thumb': { width: 20, height: 20, border: '2px solid #0A0F1E' },
        }}
      />

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)', my: 1 }} />

      <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ display: 'block', mb: 1, letterSpacing: '0.04em' }}>
        PREVIEW RESULT — NOT A BUTTON
      </Typography>
      <Box
        sx={{
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          border: '2px solid rgba(16,185,129,0.35)',
          bgcolor: 'rgba(16,185,129,0.06)',
        }}
      >
        <Typography variant="h5" color="primary" fontWeight={900}>
          +{earned} pts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          → <strong>{projectedPoints.toLocaleString()}</strong> monthly total if these were real awards
        </Typography>
        {projectedTier.name !== currentTier.name && (
          <Chip
            label={`Would reach ${projectedTier.name}`}
            size="small"
            sx={{
              mt: 1.5,
              bgcolor: `${projectedTier.color}22`,
              color: projectedTier.color,
              fontWeight: 800,
              border: `1px solid ${projectedTier.color}44`,
            }}
          />
        )}
      </Box>
    </Paper>
  );
}
