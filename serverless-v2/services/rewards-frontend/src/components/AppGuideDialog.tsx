import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppGuideSections from './AppGuideSections';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AppGuideDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
        How this app works
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <AppGuideSections />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
