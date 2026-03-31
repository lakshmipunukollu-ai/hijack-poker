import type { ReactNode } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type Props = {
  label: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

/** Compact inline “how this works” without cluttering the main UI. */
export default function SectionExplainer({ label, children, defaultExpanded = false }: Props) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        bgcolor: 'rgba(0,0,0,0.18)',
        borderRadius: '6px !important',
        border: '1px solid rgba(148,163,184,0.12)',
        '&:before': { display: 'none' },
        mb: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#94A3B8' }} />}
        sx={{ minHeight: 36, py: 0, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}
      >
        <Typography variant="caption" color="primary" fontWeight={700}>
          {label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 1.5, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.55 }}>
          {children}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
