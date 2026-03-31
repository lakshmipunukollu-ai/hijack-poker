'use strict';

function auditLog(action) {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(JSON.stringify({
        action,
        playerId: req.playerId ? req.playerId.substring(0, 8) + '...' : 'anon',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      }));
    });
    next();
  };
}

module.exports = { auditLog };
