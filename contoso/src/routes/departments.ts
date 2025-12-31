import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import {
    validate,
    validateId,
    validateDepartmentCreate,
    validateDepartmentUpdate,
} from '../middleware/validation';

const router = Router();
const controller = new DepartmentController();

router.get('/', controller.getAll);
router.get('/:id', validateId('id'), validate, controller.getById);
router.post('/', validateDepartmentCreate, validate, controller.create);
router.put('/:id', validateDepartmentUpdate, validate, controller.update);
router.delete('/:id', validateId('id'), validate, controller.delete);

export default router;
