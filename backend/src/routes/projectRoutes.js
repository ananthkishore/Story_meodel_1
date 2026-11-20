import { Router } from 'express';
import { body } from 'express-validator';
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const projectValidation = [
  body('projectName').optional().isString().trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be between 2 and 120 characters.'),
  body('description').optional().isString().trim().isLength({ min: 10, max: 10000 }).withMessage('Description must be between 10 and 10,000 characters.'),
  body('targetUsers').optional().isString().isLength({ max: 2000 }).withMessage('Target users must be 2,000 characters or fewer.'),
  body('industry').optional().isString().isLength({ max: 120 }).withMessage('Industry must be 120 characters or fewer.'),
  body('requirements').optional().custom((value) => (typeof value === 'string' && value.length <= 10000) ||
    (Array.isArray(value) && value.length <= 40 && value.every((item) => typeof item === 'string' && item.length <= 1000)))
    .withMessage('Requirements must be text or a list of up to 40 items, each at most 1,000 characters.')
];

router.route('/')
  .get(listProjects)
  .post([
    ...projectValidation,
    body('projectName').exists().withMessage('Project name is required.'),
    body('description').exists().withMessage('Project description is required.')
  ], createProject);
router.route('/:id')
  .get(getProject)
  .put(projectValidation, updateProject)
  .delete(deleteProject);

export default router;
