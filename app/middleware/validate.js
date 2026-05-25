const { validationResult } = require('express-validator');
const { errorResponse } = require('../../utils/response');

/**
 * Runs after express-validator chains. Returns 422 if there are validation errors.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(422).json(errorResponse('Validation failed', formatted));
  }
  next();
}

module.exports = validate;
