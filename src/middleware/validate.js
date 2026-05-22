// src/middleware/validate.js
import { validationResult } from 'express-validator';

/**
 * Express middleware to run after validation rules.
 * Returns 400 with error details if validation fails.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  };
};

export default validate;