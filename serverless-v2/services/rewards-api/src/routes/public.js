'use strict';

const { Router } = require('express');
const { query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getOrCreatePlayer } = require('../services/dynamo.service');
const { getEffectiveTier, getNextTier } = require('../config/constants');

const router = Router();

// GET /api/v1/player/rewards-hud?playerId=... (public — for Unity WebGL / HUD polling)
router.get('/player/rewards-hud',
  validate([query('playerId').isString().trim().notEmpty().isLength({ max: 128 })]),
  asyncHandler(async (req, res) => {
    const { playerId } = req.query;
    const player = await getOrCreatePlayer(playerId);
    const pts = player.monthlyPoints || 0;
    const tier = getEffectiveTier(pts, player.tierFloor);
    const nextTier = getNextTier(tier.name);
    res.json({
      playerId,
      tier: tier.name,
      multiplier: tier.multiplier,
      monthlyPoints: pts,
      lifetimePoints: player.lifetimePoints || 0,
      nextTierAt: nextTier?.minPoints ?? null,
      nextTierName: nextTier?.name ?? null,
    });
  })
);

module.exports = router;
