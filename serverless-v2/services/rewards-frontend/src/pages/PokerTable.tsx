import { Box, IconButton, Tooltip } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import RewardsHUDOverlay from '../components/RewardsHUDOverlay';
import Navbar from '../components/Navbar';
import { useGetRewardsQuery } from '../api/rewardsApi';
import { buildUnityTableEmbedSrc, UNITY_WEBGL_BASE } from '../constants/environment';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export default function PokerTable() {
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const navigate = useNavigate();
  const { data: rewards } = useGetRewardsQuery(undefined, { skip: !playerId });
  const gameShellRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const unitySrc = useMemo(
    () => (playerId ? buildUnityTableEmbedSrc(playerId) : UNITY_WEBGL_BASE),
    [playerId],
  );

  useEffect(() => {
    if (!playerId) navigate('/login', { replace: true });
  }, [playerId, navigate]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === gameShellRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = gameShellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen not available:', e);
    }
  }, []);

  if (!playerId) return null;

  return (
    <Box
      sx={{
        height: '100dvh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#0A0F1E',
      }}
    >
      <Navbar tier={rewards?.tier} showBackButton onBack={() => navigate('/')} />
      <Box
        ref={gameShellRef}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#000',
          position: 'relative',
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Tooltip title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}>
            <IconButton
              onClick={toggleFullscreen}
              size="large"
              aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 20,
                color: '#fff',
                bgcolor: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.35)',
                '&:hover': { bgcolor: 'rgba(15,23,42,0.92)' },
              }}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          <iframe
            src={unitySrc}
            title="Poker table"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
          <RewardsHUDOverlay />
        </Box>
      </Box>
    </Box>
  );
}
