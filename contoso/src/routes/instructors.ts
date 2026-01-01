import { Router } from 'express';
import { InstructorController } from '../controllers/instructorController';
import {
    validate,
    validateId,
    validateInstructorCreate,
    validateInstructorUpdate,
} from '../middleware/validation';

const router = Router();
const controller = new InstructorController();

// Special endpoint for Index view (3-panel data)
router.get('/view', controller.getIndexView);

// Standard CRUD endpoints
router.get('/', controller.getAll);
router.get('/:id', validateId('id'), validate, controller.getById);
router.post('/', validateInstructorCreate, validate, controller.create);
router.put('/:id', validateInstructorUpdate, validate, controller.update);
router.delete('/:id', validateId('id'), validate, controller.delete);

export default router;
