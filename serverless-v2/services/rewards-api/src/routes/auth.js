'use strict';

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

/** Local/staging: longer-lived tokens so dashboards left open don’t 401 every hour; prod stays 1h. */
const LOCAL_JWT_TTL = process.env.JWT_EXPIRES_IN || '7d';
const isShortLivedJwt =
  process.env.STAGE === 'production' || process.env.NODE_ENV === 'production';

router.post('/token',
  auditLog('auth'),
  validate([
    body('playerId').isString().trim().notEmpty().isLength({ max: 64 }),
  ]),
  (req, res) => {
    const { playerId } = req.body;
    const expiresIn = isShortLivedJwt ? '1h' : LOCAL_JWT_TTL;
    const token = jwt.sign(
      { sub: playerId, iss: 'hijack-poker', isAdmin: false },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn }
    );
    const decoded = jwt.decode(token);
    const expSec = decoded && typeof decoded.exp === 'number' ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
    res.json({ token, expiresIn: expSec });
  }
);

module.exports = router;
