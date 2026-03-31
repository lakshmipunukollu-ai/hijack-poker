'use strict';

const { validationResult } = require('express-validator');

function validate(rules) {
  return async (req, res, next) => {
    await Promise.all(rules.map((rule) => rule.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
  };
}

module.exports = { validate };
