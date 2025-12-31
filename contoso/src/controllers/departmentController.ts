import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/departmentService';
import { safeParseInt } from '../utils/sanitize';

const departmentService = new DepartmentService();

export class DepartmentController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const departments = await departmentService.findAll();
            res.json(departments);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const department = await departmentService.findById(id);
            res.json(department);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const department = await departmentService.create(req.body);
            res.status(201).json(department);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const department = await departmentService.update(id, req.body);
            res.json(department);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = safeParseInt(req.params.id, 'id');
            const result = await departmentService.delete(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
