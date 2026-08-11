import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new ProjectsController();

router.use(requireAuth as any);

router.post('/', (req, res, next) => controller.createProject(req as any, res, next));
router.get('/', (req, res, next) => controller.listProjects(req as any, res, next));
router.get('/:id', (req, res, next) => controller.getProject(req as any, res, next));

export default router;
