import { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Tooltip, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store';
import type { RootState } from '../store';
import NotificationBell from './NotificationBell';
import AppGuideDialog from './AppGuideDialog';

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32', Silver: '#9CA3AF', Gold: '#F59E0B', Platinum: '#A5B4FC',
};

interface NavbarProps {
  tier?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  /** Label for the main CTA that opens the embedded Unity WebGL client */
  gameClientButtonLabel?: string;
}

export default function Navbar({
  tier = 'Bronze',
  showBackButton,
  onBack,
  gameClientButtonLabel = 'Play table',
}: NavbarProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onTable = pathname.startsWith('/table');
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' }} elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" minWidth={0}>
          {showBackButton && (
            <Button
              variant="outlined"
              size="small"
              onClick={onBack}
              startIcon={<ArrowBackIcon fontSize="small" />}
              sx={{
                mr: 1,
                color: 'text.secondary',
                borderColor: 'rgba(148,163,184,0.4)',
                '&:hover': { borderColor: 'rgba(148,163,184,0.65)', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Rewards
            </Button>
          )}
          <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900 }}>
            ♠ Hijack
          </Typography>
          <Chip
            label={onTable ? 'Table' : 'Rewards'}
            size="small"
            variant="outlined"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              ml: 0.5,
              borderColor: 'rgba(148,163,184,0.35)',
              color: '#94A3B8',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Chip
            label={(playerId ? `${playerId.substring(0, 12)}...` : '—')}
            size="small"
            variant="outlined"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              color: 'text.secondary',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          />
          {!onTable && (
            <Tooltip title="Open the poker table in your browser">
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/table')}
                sx={{
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  px: { xs: 1, sm: 1.5 },
                }}
                startIcon={<span>🃏</span>}
              >
                {gameClientButtonLabel}
              </Button>
            </Tooltip>
          )}
          <Tooltip title="How this demo fits together">
            <IconButton
              size="small"
              onClick={() => setGuideOpen(true)}
              sx={{ color: '#94A3B8', border: '1px solid rgba(148,163,184,0.35)' }}
              aria-label="Open help: how this app works"
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <AppGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
          <NotificationBell />
          <Chip label={tier} size="small" sx={{ bgcolor: `${TIER_COLORS[tier] ?? '#6B7280'}22`, color: TIER_COLORS[tier] ?? '#9CA3AF', border: `1px solid ${(TIER_COLORS[tier] ?? '#6B7280')}44`, fontWeight: 700 }} />
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} size="small" sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
