'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { adminAuthMiddleware } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPlayer, addTransaction, updatePlayer, getAllPlayers } = require('../services/dynamo.service');
const { getTierForPoints, getEffectiveTier, tierOneTierBelow } = require('../config/constants');

/** Admin tier override levels – 1 Bronze … 4 Platinum */
const ADMIN_TIER_LEVEL_TO_NAME = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const router = Router();

// All admin routes require admin JWT claim
router.use(adminAuthMiddleware);

// GET /api/v1/admin/players/:playerId/rewards
router.get('/players/:playerId/rewards',
  auditLog('admin_get_player'),
  validate([param('playerId').isString().trim().notEmpty().isLength({ max: 64 })]),
  asyncHandler(async (req, res) => {
    const player = await getPlayer(req.params.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player); // Admin gets full profile including internal fields
  })
);

// POST /api/v1/admin/points/adjust
router.post('/points/adjust',
  auditLog('admin_adjust_points'),
  validate([
    body('playerId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('points').isInt({ min: -100000, max: 100000 }).custom((v) => Number(v) !== 0),
    body('reason').isString().trim().notEmpty().isLength({ max: 256 }),
  ]),
  asyncHandler(async (req, res) => {
    const { playerId, points, reason } = req.body; // Explicit destructure only
    const player = await getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const newMonthly = Math.max(0, (player.monthlyPoints || 0) + points);
    const newLifetime = Math.max(0, (player.lifetimePoints || 0) + points);
    const newTier = getEffectiveTier(newMonthly, player.tierFloor);

    await addTransaction(playerId, {
      type: 'adjustment',
      basePoints: points,
      multiplier: 1,
      earnedPoints: points,
      reason,
      monthKey: new Date().toISOString().substring(0, 7),
      createdAt: new Date().toISOString(),
    });

    await updatePlayer(playerId, {
      monthlyPoints: newMonthly,
      lifetimePoints: newLifetime,
      currentTier: newTier.name,
      updatedAt: new Date().toISOString(),
    });

    res.json({ playerId, newMonthly, newLifetime, tier: newTier.name });
  })
);

// POST /api/v1/admin/tier/reset — simulate monthly reset (tier floor + monthlyPoints = 0)
router.post('/tier/reset',
  auditLog('admin_tier_reset'),
  validate([
    body('playerId').isString().trim().notEmpty().isLength({ max: 64 }),
  ]),
  asyncHandler(async (req, res) => {
    const { playerId } = req.body;
    const player = await getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const priorEffective = getEffectiveTier(player.monthlyPoints, player.tierFloor);
    const newFloorName = tierOneTierBelow(priorEffective.name);
    const afterResetTier = getEffectiveTier(0, newFloorName);

    const notifications = [...(player.notifications || [])];
    if (afterResetTier.name !== priorEffective.name) {
      notifications.push({
        id: `notif-${Date.now()}`,
        type: 'tier_downgrade',
        title: `Your tier has been adjusted to ${afterResetTier.name}`,
        description: `Monthly reset — your tier floor is now ${newFloorName}.`,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }

    await updatePlayer(playerId, {
      monthlyPoints: 0,
      tierFloor: newFloorName,
      currentTier: afterResetTier.name,
      notifications,
      updatedAt: new Date().toISOString(),
    });

    const updated = await getPlayer(playerId);
    res.json(updated);
  })
);

// POST /api/v1/admin/tier/override
router.post('/tier/override',
  auditLog('admin_tier_override'),
  validate([
    body('playerId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('tier').isInt({ min: 1, max: 4 }),
    body('expiresAt')
      .optional({ checkFalsy: true })
      .isISO8601({ strict: true })
      .withMessage('expiresAt must be a valid ISO 8601 timestamp'),
  ]),
  asyncHandler(async (req, res) => {
    const { playerId, tier: tierLevel, expiresAt } = req.body;
    const player = await getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const currentTier = ADMIN_TIER_LEVEL_TO_NAME[tierLevel - 1];
    const updates = {
      currentTier,
      updatedAt: new Date().toISOString(),
    };
    if (expiresAt) {
      updates.tierOverrideExpiresAt = expiresAt;
    }

    await updatePlayer(playerId, updates);
    const updated = await getPlayer(playerId);
    res.json(updated);
  })
);

// GET /api/v1/admin/leaderboard
router.get('/leaderboard', auditLog('admin_leaderboard'), asyncHandler(async (req, res) => {
  const players = await getAllPlayers();
  const leaderboard = players
    .sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0))
    .slice(0, 100)
    .map((p, i) => ({
      rank: i + 1,
      playerId: p.playerId,
      displayName: p.displayName || p.playerId,
      points: p.monthlyPoints || 0,
      tier: getEffectiveTier(p.monthlyPoints, p.tierFloor).name,
      lifetimePoints: p.lifetimePoints || 0, // Admin-only extra field
      createdAt: p.createdAt,
    }));
  res.json({ leaderboard });
}));

module.exports = router;
