import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService';
import { sanitizePaginationParams, safeParseInt } from '../utils/sanitize';
import { ValidationError } from '../utils/errors';

const studentService = new StudentService();

export class StudentController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            // Sanitize and validate query params
            const params = sanitizePaginationParams(req.query);
            const result = await studentService.findAll(params);
            // Map 'items' to 'data' to match frontend expectation
            res.json({
                data: result.items,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const student = await studentService.findById(id);
            res.json(student);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const student = await studentService.create(req.body);
            res.status(201).json(student);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const student = await studentService.update(id, req.body);
            res.json(student);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const result = await studentService.delete(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
