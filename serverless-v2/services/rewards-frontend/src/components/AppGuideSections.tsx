import { Typography, Box, List, ListItem, ListItemText } from '@mui/material';

/**
 * Shared copy: what this demo app is and how the pieces fit together.
 * Used by the help dialog (navbar) and the login page accordion.
 */
export default function AppGuideSections() {
  return (
    <Box sx={{ '& strong': { color: 'text.primary' } }}>
      <Typography variant="body2" color="text.secondary" paragraph>
        <strong>Hijack Poker</strong> in this repo is a <strong>technical assignment demo</strong>. It is not one
        monolithic game — it is <strong>several services</strong> you can run locally. Here is what each part does.
      </Typography>

      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>
        1. This website (port 4000) — Rewards dashboard
      </Typography>
      <List dense disablePadding sx={{ pl: 0 }}>
        <ListItem disableGutters>
          <ListItemText
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            primary="Shows your tier, monthly points, hand history, leaderboard, and notifications."
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            primary="You sign in with a player ID — that ID is only used by the rewards API to store points. It is not a casino account."
          />
        </ListItem>
      </List>

      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>
        2. “Play table” — embedded poker client
      </Typography>
      <List dense disablePadding>
        <ListItem disableGutters>
          <ListItemText
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            primary="Full-screen table view (Unity WebGL). Needs the engine running (Docker compose engine profile) and WebGL served (unity-client: make serve)."
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            primary="Uses the same player id as this dashboard for the small rewards card on that page."
          />
        </ListItem>
      </List>

      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>
        3. “Play hand” / “Seed demo data” (development only)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        On the dashboard, these only appear when you run the frontend in dev mode. They <strong>simulate</strong>{' '}
        awarding points so you can test tiers and history — they do not play a real hand against the poker engine.
      </Typography>

      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1, mb: 0.5 }}>
        Quick checks
      </Typography>
      <Typography variant="body2" color="text.secondary" component="div">
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          <li>Rewards API: <code style={{ fontSize: '0.85em' }}>curl http://localhost:5000/api/v1/health</code></li>
          <li>Poker engine: <code style={{ fontSize: '0.85em' }}>curl http://localhost:3030/health</code></li>
        </Box>
      </Typography>
    </Box>
  );
}
