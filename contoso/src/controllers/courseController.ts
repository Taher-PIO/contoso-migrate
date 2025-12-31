import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { safeParseInt } from '../utils/sanitize';

const courseService = new CourseService();

export class CourseController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const courses = await courseService.findAll();
            res.json(courses);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = safeParseInt(req.params.id, 'courseId');
            const course = await courseService.findById(courseId);
            res.json(course);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const course = await courseService.create(req.body);
            res.status(201).json(course);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = safeParseInt(req.params.id, 'courseId');
            const course = await courseService.update(courseId, req.body);
            res.json(course);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = safeParseInt(req.params.id, 'courseId');
            const result = await courseService.delete(courseId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async assignInstructor(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = safeParseInt(req.params.id, 'courseId');
            const instructorId = safeParseInt(req.body.instructorId, 'instructorId');
            const course = await courseService.assignInstructor(courseId, instructorId);
            res.json(course);
        } catch (error) {
            next(error);
        }
    }

    async removeInstructor(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = safeParseInt(req.params.id, 'courseId');
            const instructorId = safeParseInt(req.body.instructorId, 'instructorId');
            const course = await courseService.removeInstructor(courseId, instructorId);
            res.json(course);
        } catch (error) {
            next(error);
        }
    }
}
