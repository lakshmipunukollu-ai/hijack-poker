'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  getPlayer,
  getOrCreatePlayer,
  updatePlayer,
  addTransaction,
  getAllPlayers,
  getTransactions,
} = require('../services/dynamo.service');
const { getTierForPoints, getEffectiveTier, calcBasePoints } = require('../config/constants');

const router = Router();

function getMonthKey() {
  return new Date().toISOString().substring(0, 7); // YYYY-MM
}

// POST /api/v1/points/award
router.post('/award',
  auditLog('points_award'),
  validate([
    body('playerId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('tableId').isInt({ min: 1 }),
    body('tableStakes').isString().trim().matches(/^\d+(\.\d+)?\/\d+(\.\d+)?$/),
    body('bigBlind').isFloat({ min: 0.01, max: 10000 }),
    body('handId').isString().trim().notEmpty().isLength({ max: 128 }),
  ]),
  asyncHandler(async (req, res) => {
    // Destructure only expected fields — never spread req.body into DynamoDB
    const { playerId, tableId, tableStakes, bigBlind, handId } = req.body;

    if (playerId !== req.playerId) {
      return res.status(403).json({ error: 'Player ID must match authenticated session' });
    }

    // Idempotency check — prevent replaying the same hand to farm points
    const existing = await getTransactions(playerId, 100);
    const duplicate = existing.find((t) => t.handId === handId);
    if (duplicate) {
      const player = await getPlayer(playerId);
      const eff = getEffectiveTier(player.monthlyPoints, player.tierFloor);
      return res.status(200).json({
        playerId,
        newBalance: player.monthlyPoints,
        tier: eff.name,
        duplicate: true,
        message: 'Hand already processed',
      });
    }

    const player = await getOrCreatePlayer(playerId);
    const oldEffective = getEffectiveTier(player.monthlyPoints, player.tierFloor);
    const basePoints = calcBasePoints(bigBlind);
    const multiplier = oldEffective.multiplier;
    const earnedPoints = Math.round(basePoints * multiplier);

    const newMonthly = (player.monthlyPoints || 0) + earnedPoints;
    const newLifetime = (player.lifetimePoints || 0) + earnedPoints;
    const newEffective = getEffectiveTier(newMonthly, player.tierFloor);

    const transaction = {
      type: 'gameplay',
      basePoints,
      multiplier,
      earnedPoints,
      tableId,
      tableStakes,
      monthKey: getMonthKey(),
      handId,
      createdAt: new Date().toISOString(),
    };

    await addTransaction(playerId, transaction);

    // Build notifications on effective tier change (respects tierFloor)
    const notifications = [...(player.notifications || [])];
    if (newEffective.name !== oldEffective.name) {
      const isUpgrade = newEffective.minPoints > oldEffective.minPoints;
      notifications.push({
        id: `notif-${Date.now()}`,
        type: isUpgrade ? 'tier_upgrade' : 'tier_downgrade',
        title: isUpgrade
          ? `You've reached ${newEffective.name} tier!`
          : `Your tier has been adjusted to ${newEffective.name}`,
        description: isUpgrade
          ? `Congratulations! Your multiplier is now ${newEffective.multiplier}x`
          : `Keep playing to climb back up`,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }

    await updatePlayer(playerId, {
      monthlyPoints: newMonthly,
      lifetimePoints: newLifetime,
      currentTier: newEffective.name,
      notifications,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      playerId,
      newBalance: newMonthly,
      tier: newEffective.name,
      earnedPoints,
      transaction,
    });
  })
);

// GET /api/v1/points/leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const players = await getAllPlayers();
  const sorted = [...players].sort(
    (a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0),
  );

  const leaderboard = sorted.slice(0, 100).map((p, i) => ({
    // Only return safe fields — never expose tierFloor or internal attrs
    rank: i + 1,
    playerId: p.playerId,
    displayName: p.displayName || p.playerId,
    points: p.monthlyPoints || 0,
    tier: getEffectiveTier(p.monthlyPoints, p.tierFloor).name,
  }));

  const myIndex = sorted.findIndex((p) => p.playerId === req.playerId);
  let yourRank = null;
  if (myIndex !== -1) {
    const rank = myIndex + 1;
    if (rank > 100) {
      const p = sorted[myIndex];
      yourRank = {
        rank,
        playerId: p.playerId,
        displayName: p.displayName || p.playerId,
        tier: getEffectiveTier(p.monthlyPoints, p.tierFloor).name,
        monthlyPoints: p.monthlyPoints || 0,
      };
    }
  }

  res.json({ leaderboard, yourRank, updatedAt: new Date().toISOString() });
}));

module.exports = router;
