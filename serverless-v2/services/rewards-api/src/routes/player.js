'use strict';

const { Router } = require('express');
const { param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  getOrCreatePlayer, getTransactions, updatePlayer,
} = require('../services/dynamo.service');
const { getEffectiveTier, getNextTier } = require('../config/constants');

const router = Router();

function sanitizePlayer(player) {
  // Never return internal fields to client
  const { tierFloor, lastTierChangeAt, ...safe } = player;
  return safe;
}

// GET /api/v1/player/rewards
router.get('/rewards', auditLog('get_rewards'), asyncHandler(async (req, res) => {
  const player = await getOrCreatePlayer(req.playerId);
  const tier = getEffectiveTier(player.monthlyPoints, player.tierFloor);
  const nextTier = getNextTier(tier.name);
  const recentTransactions = await getTransactions(req.playerId, 5);

  res.json({
    ...sanitizePlayer(player),
    tierFloor: player.tierFloor || 'Bronze',
    tier: tier.name,
    multiplier: tier.multiplier,
    nextTierAt: nextTier?.minPoints || null,
    nextTierName: nextTier?.name || null,
    recentTransactions,
  });
}));

// GET /api/v1/player/history
router.get('/history',
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ]),
  asyncHandler(async (req, res) => {
    const limit = req.query.limit || 20;
    const transactions = await getTransactions(req.playerId, limit);
    res.json({ transactions, total: transactions.length });
  })
);

// GET /api/v1/player/notifications
router.get('/notifications', asyncHandler(async (req, res) => {
  const player = await getOrCreatePlayer(req.playerId);
  let notifications = player.notifications || [];
  if (req.query.unread === 'true') {
    notifications = notifications.filter((n) => !n.dismissed);
  }
  res.json({ notifications, unreadCount: notifications.filter((n) => !n.dismissed).length });
}));

// PATCH /api/v1/player/notifications/:id/dismiss
router.patch('/notifications/:id/dismiss',
  validate([param('id').isString().trim().notEmpty().isLength({ max: 64 })]),
  asyncHandler(async (req, res) => {
    const player = await getOrCreatePlayer(req.playerId);
    const targetId = String(req.params.id);
    const notifications = (player.notifications || []).map((n) =>
      String(n.id) === targetId ? { ...n, dismissed: true } : n
    );
    await updatePlayer(req.playerId, { notifications, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  })
);

module.exports = router;
