import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import {
    validate,
    validateId,
    validateCourseCreate,
    validateCourseUpdate,
    validateInstructorAssignment,
} from '../middleware/validation';

const router = Router();
const controller = new CourseController();

router.get('/', controller.getAll);
router.get('/:id', validateId('id'), validate, controller.getById);
router.post('/', validateCourseCreate, validate, controller.create);
router.put('/:id', validateCourseUpdate, validate, controller.update);
router.delete('/:id', validateId('id'), validate, controller.delete);
router.post('/:id/instructors', validateInstructorAssignment, validate, controller.assignInstructor);
router.delete('/:id/instructors', validateInstructorAssignment, validate, controller.removeInstructor);

export default router;
