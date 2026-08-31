// src/validations/index.js
import { body } from 'express-validator';

export const registerSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').notEmpty().isLength({ max: 30 }).trim().withMessage('Display name required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

export const loginSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

export const changePasswordSchema = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
];

export const updateProfileSchema = [
  body('displayName').optional().isLength({ max: 30 }).trim(),
  body('bio').optional().isLength({ max: 200 }).trim(),
  body('age').optional().isInt({ min: 18, max: 120 }),
  body('gender').optional().isIn(['male', 'female', 'non-binary', 'other', 'undisclosed']),
  body('interests').optional().isArray(),
];

export const createReportSchema = [
  body('reportedUserId').isMongoId(),
  body('reason').isIn(['harassment', 'nudity', 'spam', 'hate_speech', 'underage', 'illegal_content', 'other']),
  body('description').optional().isLength({ max: 500 }),
  body('matchId').optional().isMongoId(),
];

export const blockUserSchema = [
  body('blockedUserId').isMongoId(),
  body('reason').optional().isIn(['personal', 'harassment', 'spam']),
];

export const sendMessageSchema = [
  body('matchId').isMongoId(),
  body('message').optional().isLength({ max: 1000 }),
  body('type').default('text').isIn(['text', 'gift', 'system']),
];

export const rateMatchSchema = [
  body('matchId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
];

export const purchaseTokensSchema = [
  body('amount').isInt({ min: 100 }), // amount in cents
  body('paymentMethodId').optional().isString(),
];

export const createScheduledEventSchema = [
  body('title').notEmpty().isLength({ max: 100 }),
  body('scheduledAt').isISO8601(),
  body('durationMinutes').isInt({ min: 5, max: 120 }),
  body('interestTags').optional().isArray(),
];

export const submitVerificationSchema = [
  body('idDocumentFrontUrl').isURL(),
  body('idDocumentBackUrl').optional().isURL(),
  body('selfieWithIdUrl').isURL(),
  body('documentType').isIn(['passport', 'national_id', 'drivers_license']),
];

export const reviewVerificationSchema = [
  body('status').isIn(['approved', 'rejected']),
  body('rejectionReason').if(body('status').equals('rejected')).notEmpty(),
];

export const createInterestRoomSchema = [
  body('name').isLowercase().trim().notEmpty(),
  body('displayName').optional(),
  body('isActive').optional().isBoolean(),
];

export const createPlanSchema = [
  body('name').notEmpty(),
  body('price').isInt({ min: 0 }),
  body('interval').isIn(['month', 'year']),
];

export const addCredentialSchema = [
  body('key').notEmpty(),
  body('value').notEmpty(),
  body('platform').isIn(['razorpay', 'stripe', 'aws']),
];