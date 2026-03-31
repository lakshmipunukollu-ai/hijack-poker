import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#10B981' },        // emerald green
    secondary: { main: '#F59E0B' },       // amber gold
    error: { main: '#EF4444' },
    background: {
      default: '#0A0F1E',                // deep navy
      paper: '#111827',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.06)' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          cursor: 'pointer',
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          '&:focus-visible': {
            outline: '2px solid rgba(16, 185, 129, 0.55)',
            outlineOffset: 2,
          },
        },
        contained: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        outlined: {
          borderWidth: 1,
          '&:hover': { borderWidth: 1 },
        },
        text: {
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
        },
        textSecondary: {
          color: '#94A3B8',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
          borderRadius: 8,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
          '&:focus-visible': {
            outline: '2px solid rgba(16, 185, 129, 0.45)',
            outlineOffset: 1,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
          '&:focus-visible': { outline: '2px solid rgba(16, 185, 129, 0.45)', outlineOffset: -2 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
  },
});
