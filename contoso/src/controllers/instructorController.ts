import { Request, Response, NextFunction } from 'express';
import { InstructorService } from '../services/instructorService';
import { safeParseInt } from '../utils/sanitize';

const instructorService = new InstructorService();

export class InstructorController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const instructors = await instructorService.findAll();
            res.json(instructors);
        } catch (error) {
            next(error);
        }
    }

    async getIndexView(req: Request, res: Response, next: NextFunction) {
        try {
            const instructorID = req.query.id ? safeParseInt(req.query.id as string, 'id') : undefined;
            const courseID = req.query.courseID ? safeParseInt(req.query.courseID as string, 'courseID') : undefined;

            const data = await instructorService.findForIndexView(instructorID, courseID);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const instructor = await instructorService.findById(id);
            res.json(instructor);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const instructor = await instructorService.create(req.body);
            res.status(201).json(instructor);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const instructor = await instructorService.update(id, req.body);
            res.json(instructor);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            await instructorService.delete(id);
            res.json({ message: 'Instructor deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}
