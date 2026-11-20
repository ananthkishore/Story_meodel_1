import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  deleteStory,
  generateForProject,
  getStory,
  listProjectStories,
  regenerateStory,
  updateStory
} from '../controllers/storyController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Story generation limit reached. Please try again in a few minutes.' }
});

router.post('/generate', aiLimiter, [
  body('projectName').optional().isString().trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be between 2 and 120 characters.'),
  body('description').optional().isString().trim().isLength({ min: 10, max: 10000 }).withMessage('Description must be between 10 and 10,000 characters.'),
  body('count').optional().isInt({ min: 3, max: 20 }).withMessage('Story count must be between 3 and 20.'),
  body('targetUsers').optional().isString().isLength({ max: 2000 }),
  body('industry').optional().isString().isLength({ max: 120 }),
  body('projectId').optional().isMongoId().withMessage('Invalid project ID.'),
  body('requirements').optional().custom((value) => (typeof value === 'string' && value.length <= 10000) ||
    (Array.isArray(value) && value.length <= 40 && value.every((item) => typeof item === 'string' && item.length <= 1000)))
    .withMessage('Requirements must be text or a list of up to 40 items, each at most 1,000 characters.'),
  body('priority').optional().isIn(['Balanced', 'High', 'Medium', 'Low']).withMessage('Priority focus is invalid.'),
  body('complexity').optional().isIn(['Mixed', 'Simple', 'Moderate', 'Complex']).withMessage('Story complexity is invalid.'),
  body('format').optional().isIn(['Standard user story', 'Concise', 'Detailed']).withMessage('Story format is invalid.'),
  body('includeAcceptanceCriteria').optional().isBoolean().toBoolean(),
  body('includeEdgeCases').optional().isBoolean().toBoolean(),
  body('replaceExisting').optional().isBoolean().toBoolean(),
  body().custom((value) => Boolean(value && typeof value === 'object' && (value.projectId || (typeof value.projectName === 'string' && typeof value.description === 'string'))))
    .withMessage('Project name and description are required for a new project.')
], generateForProject);

router.get('/project/:projectId', listProjectStories);
router.route('/:id')
  .get(getStory)
  .put([
    body('title').optional().isString().trim().isLength({ min: 1, max: 180 }),
    body('role').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().trim().isLength({ min: 1, max: 2000 }),
    body('category').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('status').optional().isIn(['Backlog', 'To Do', 'In Progress', 'Review', 'Done']),
    body('storyPoints').optional().isInt().custom((value) => [1, 2, 3, 5, 8, 13].includes(Number(value))),
    body('acceptanceCriteria').optional().isArray({ max: 30 }).bail().custom((items) => items.every((item) => typeof item === 'string' && item.length <= 1000)),
    body('dependencies').optional().isArray({ max: 30 }).bail().custom((items) => items.every((item) => typeof item === 'string' && item.length <= 180)),
    body('tags').optional().isArray({ max: 30 }).bail().custom((items) => items.every((item) => typeof item === 'string' && item.length <= 60))
  ], updateStory)
  .delete(deleteStory);
router.post('/:id/regenerate', aiLimiter, regenerateStory);

export default router;
