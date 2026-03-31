import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ENGINE_BASE, rewardsApiHealthUrl, UNITY_WEBGL_BASE } from '../constants/environment';

type ServiceKey = 'rewards' | 'engine' | 'webgl';
type CheckState = 'idle' | 'checking' | 'ok' | 'fail';

const POLL_MS = 45_000;

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 5000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: c.signal, cache: 'no-store' });
  } finally {
    clearTimeout(t);
  }
}

async function checkRewards(): Promise<boolean> {
  try {
    const r = await fetchWithTimeout(rewardsApiHealthUrl());
    return r.ok;
  } catch {
    return false;
  }
}

async function checkEngine(): Promise<boolean> {
  try {
    const r = await fetchWithTimeout(`${ENGINE_BASE}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

/** Static dev server often omits CORS; `no-cors` only tells us the origin responded. */
async function checkWebGlOrigin(): Promise<boolean> {
  try {
    await fetchWithTimeout(`${UNITY_WEBGL_BASE.replace(/\/$/, '')}/`, { mode: 'no-cors' }, 5000);
    return true;
  } catch {
    return false;
  }
}

export interface EnvironmentStatusProps {
  /** `/table` — list engine & WebGL first. */
  tablePage?: boolean;
  defaultExpanded?: boolean;
}

export default function EnvironmentStatus({
  tablePage = false,
  defaultExpanded = true,
}: EnvironmentStatusProps) {
  const [status, setStatus] = useState<Record<ServiceKey, CheckState>>({
    rewards: 'idle',
    engine: 'idle',
    webgl: 'idle',
  });

  const runChecks = useCallback(async () => {
    setStatus({ rewards: 'checking', engine: 'checking', webgl: 'checking' });
    const [okR, okE, okW] = await Promise.all([checkRewards(), checkEngine(), checkWebGlOrigin()]);
    setStatus({
      rewards: okR ? 'ok' : 'fail',
      engine: okE ? 'ok' : 'fail',
      webgl: okW ? 'ok' : 'fail',
    });
  }, []);

  useEffect(() => {
    runChecks();
    const id = setInterval(runChecks, POLL_MS);
    return () => clearInterval(id);
  }, [runChecks]);

  const rows = useMemo(() => {
    const all: Record<ServiceKey, { label: string; purpose: string; detail: string; hint: string }> = {
      rewards: {
        label: 'Rewards API',
        purpose: 'Points balance, history rows, leaderboard, Award Hand — if red, HUD and dashboard API calls fail.',
        detail: rewardsApiHealthUrl(),
        hint: 'docker compose --profile rewards up (health uses same URL as the dashboard API)',
      },
      engine: {
        label: 'Holdem engine',
        purpose: 'Drives the poker table (cards, pot, /process). Separate from rewards points.',
        detail: `${ENGINE_BASE}/health`,
        hint: 'docker compose --profile engine up',
      },
      webgl: {
        label: 'Unity WebGL host',
        purpose: 'Serves the Unity build embedded in the iframe on the table page.',
        detail: UNITY_WEBGL_BASE.replace(/\/$/, ''),
        hint: 'unity-client: make serve (or your static server on this origin)',
      },
    };
    const order: ServiceKey[] = tablePage ? ['engine', 'webgl', 'rewards'] : ['rewards', 'engine', 'webgl'];
    return order.map((k) => ({ key: k, ...all[k] }));
  }, [tablePage]);

  const okCount = (['rewards', 'engine', 'webgl'] as const).filter((k) => status[k] === 'ok').length;
  const summary =
    status.rewards === 'idle' || status.rewards === 'checking'
      ? 'Checking services…'
      : `${okCount}/3 reachable · expand hints`;

  const dot = (s: CheckState) => {
    const color =
      s === 'ok' ? '#22C55E' : s === 'fail' ? '#EF4444' : s === 'checking' ? '#94A3B8' : 'rgba(148,163,184,0.35)';
    return (
      <Box
        component="span"
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
          mt: 0.5,
          boxShadow: s === 'ok' ? '0 0 8px rgba(34,197,94,0.45)' : 'none',
        }}
      />
    );
  };

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        mb: 2,
        bgcolor: 'rgba(15,23,42,0.55)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94A3B8' }} />}>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={1} gap={2}>
          <Typography fontWeight={700} fontSize="0.9rem" color="text.primary">
            Environment status
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {summary}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Green = this browser reached the URL. WebGL uses a lenient check (no CORS body).
        </Typography>
        {rows.map(({ key, label, purpose, detail, hint }) => (
          <Box
            key={key}
            sx={{
              display: 'flex',
              gap: 1.25,
              py: 1,
              borderTop: '1px solid rgba(148,163,184,0.08)',
              '&:first-of-type': { borderTop: 'none', pt: 0 },
            }}
          >
            {dot(status[key])}
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.45 }}>
                {purpose}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block', mt: 0.5 }}>
                {detail}
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  display: 'block',
                  mt: 0.75,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'rgba(0,0,0,0.35)',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.7rem',
                  whiteSpace: 'pre-wrap',
                  color: '#A7F3D0',
                }}
              >
                {hint}
              </Typography>
            </Box>
          </Box>
        ))}
        <Button
          size="small"
          variant="outlined"
          onClick={() => runChecks()}
          sx={{
            mt: 1.5,
            fontWeight: 700,
            color: '#CBD5E1',
            borderColor: 'rgba(148,163,184,0.45)',
            '&:hover': { borderColor: 'rgba(148,163,184,0.75)', bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          Recheck now
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
