import { useState, useEffect } from 'react';
import { Alert, Button, Collapse } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, login, type RootState } from '../store';
import { useGetTokenMutation } from '../api/rewardsApi';

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const [getToken] = useGetTokenMutation();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      const expiresAt = (payload.exp ?? 0) * 1000;
      const warnAt = expiresAt - 5 * 60 * 1000; // 5 min before expiry
      const now = Date.now();

      if (now >= warnAt) {
        setShowWarning(true);
        return;
      }

      const timer = setTimeout(() => setShowWarning(true), warnAt - now);
      return () => clearTimeout(timer);
    } catch {
      // invalid token
    }
  }, []);

  const handleRenew = async () => {
    if (!playerId) return;
    try {
      const { token } = await getToken({ playerId }).unwrap();
      localStorage.setItem('jwt', token);
      dispatch(login({ playerId, token }));
      setShowWarning(false);
    } catch {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <Collapse in={showWarning}>
      <Alert
        severity="warning"
        sx={{ borderRadius: 0, bgcolor: '#451A03', color: '#FDE68A', '& .MuiAlert-icon': { color: '#F59E0B' } }}
        action={(
          <Button
            size="small"
            variant="outlined"
            onClick={handleRenew}
            sx={{
              color: '#FBBF24',
              fontWeight: 700,
              borderColor: 'rgba(251,191,36,0.55)',
              '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(251,191,36,0.12)' },
            }}
          >
            Renew Session
          </Button>
        )}
      >
        Your session expires in 5 minutes.
      </Alert>
    </Collapse>
  );
}
