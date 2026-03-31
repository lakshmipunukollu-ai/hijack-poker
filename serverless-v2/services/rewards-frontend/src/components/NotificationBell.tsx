import { useState, type MouseEvent } from 'react';
import { IconButton, Badge, Popover, Box, Typography, IconButton as MuiIconButton, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useGetNotificationsQuery, useDismissNotificationMutation } from '../api/rewardsApi';
import type { RootState } from '../store';

export default function NotificationBell() {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const playerId = useSelector((s: RootState) => s.auth.playerId);
  const { data } = useGetNotificationsQuery(undefined, {
    skip: !playerId,
    pollingInterval: 60000,
    refetchOnFocus: false,
  });
  const [dismissNotification] = useDismissNotificationMutation();

  const handleDismiss = async (
    id: string,
    e: MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dismissNotification(id).unwrap();
      toast.success('Dismissed', { id: 'notification-dismissed', duration: 2000 });
    } catch {
      toast.error('Could not dismiss — check the Rewards API is running and refresh.', {
        id: 'notification-dismiss-error',
      });
    }
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
        <Badge badgeContent={data?.unreadCount || 0} color="error" max={9}>
          <NotificationsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableRestoreFocus
        sx={{ zIndex: 20000 }}
        PaperProps={{
          sx: {
            width: 320,
            bgcolor: '#1F2937',
            border: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'auto',
          },
        }}
      >
        <Box p={2}>
          <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        {!data?.notifications?.length ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary" variant="body2">No new notifications</Typography>
          </Box>
        ) : data.notifications.map((n) => (
          <Box key={n.id} px={2} py={1.5} sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600}>{n.title}</Typography>
              <Typography variant="caption" color="text.secondary">{n.description}</Typography>
            </Box>
            <MuiIconButton
              type="button"
              size="small"
              aria-label="Dismiss notification"
              sx={{ flexShrink: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleDismiss(n.id, e)}
            >
              <CloseIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            </MuiIconButton>
          </Box>
        ))}
      </Popover>
    </>
  );
}
