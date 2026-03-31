import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, TextField, Button, Typography, CircularProgress, Alert, Divider,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AppGuideSections from '../components/AppGuideSections';
import EnvironmentStatus from '../components/EnvironmentStatus';
import { login } from '../store';
import { useGetTokenMutation } from '../api/rewardsApi';

const DEMO_PLAYER_ID = 'demo-player-001';

export default function Login() {
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [getToken, { isLoading }] = useGetTokenMutation();

  const completeAuth = async (id: string) => {
    const { token } = await getToken({ playerId: id }).unwrap();
    dispatch(login({ playerId: id, token }));
    navigate('/');
  };

  const handleLogin = async () => {
    if (!playerId.trim()) return;
    setError('');
    try {
      await completeAuth(playerId.trim());
    } catch {
      setError('Failed to authenticate. Try again.');
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await completeAuth(DEMO_PLAYER_ID);
    } catch {
      setError('Failed to authenticate. Try again.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left panel */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #064E3B 0%, #0A0F1E 60%)',
        p: 6,
        gap: 3,
      }}>
        <Typography variant="h2" sx={{ color: '#F59E0B', fontWeight: 900, letterSpacing: '-1px' }}>
          ♠ Hijack Poker
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" maxWidth={320}>
          Track your tier. Rule the table.
        </Typography>
        {['4 Reward Tiers', 'Live Points Tracking', 'Monthly Leaderboard'].map((item) => (
          <Typography key={item} variant="body1" sx={{ color: '#10B981', fontWeight: 600 }}>
            ✓ {item}
          </Typography>
        ))}
      </Box>

      {/* Right panel */}
      <Box sx={{
        flex: { xs: 1, md: 0.6 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 3, md: 6 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 360 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Welcome Back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Enter any player ID to open your <strong>rewards</strong> dashboard (points, tiers, leaderboard).
            This is separate from the Unity poker table — use the green button after you sign in.
          </Typography>

          <Alert severity="info" icon={false} sx={{ mb: 2, py: 1, bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Local dev demo:</strong> this site is mainly the rewards “office” (points and tiers). The Unity table
              is another client with its own backends — not one shipped product. Optional stacks; see status below.
            </Typography>
          </Alert>

          <EnvironmentStatus defaultExpanded={false} />

          <Accordion
            disableGutters
            sx={{
              mb: 3,
              bgcolor: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#10B981' }} />}>
              <Typography fontWeight={700} color="primary" fontSize="0.95rem">
                What is this app? (read once)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <AppGuideSections />
            </AccordionDetails>
          </Accordion>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Player ID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. p1-uuid-0001"
            sx={{ mb: 2,
              '& .MuiOutlinedInput-root:hover fieldset': { borderColor: '#10B981' },
              '& .Mui-focused fieldset': { borderColor: '#10B981 !important' },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={!playerId.trim() || isLoading}
            sx={{ py: 1.5, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Enter Dashboard'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }}>
            <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>or</Typography>
            <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleDemoLogin}
            disabled={isLoading}
            sx={{
              py: 1.5,
              color: '#10B981',
              borderColor: 'rgba(16, 185, 129, 0.55)',
              '&:hover': {
                borderColor: '#10B981',
                bgcolor: 'rgba(16, 185, 129, 0.08)',
              },
              '&.Mui-disabled': { borderColor: 'rgba(16, 185, 129, 0.35)', color: 'rgba(16, 185, 129, 0.5)' },
            }}
          >
            {isLoading ? <CircularProgress size={22} sx={{ color: '#10B981' }} /> : 'Try Demo Account'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
