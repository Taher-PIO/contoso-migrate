import { Router } from 'express';
import { StudentController } from '../controllers/studentController';
import {
    validate,
    validateId,
    validateStudentCreate,
    validateStudentUpdate,
    validateListQuery,
} from '../middleware/validation';

const router = Router();
const controller = new StudentController();

router.get('/', validateListQuery, validate, controller.getAll);
router.get('/:id', validateId('id'), validate, controller.getById);
router.post('/', validateStudentCreate, validate, controller.create);
router.put('/:id', validateStudentUpdate, validate, controller.update);
router.delete('/:id', validateId('id'), validate, controller.delete);

export default router;
