import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getMe, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many sign-in attempts. Please try again later.' }
});

router.post('/register', authLimiter, [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters.')
], register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isString().notEmpty().withMessage('Password is required.')
], login);

router.get('/me', requireAuth, getMe);

export default router;
