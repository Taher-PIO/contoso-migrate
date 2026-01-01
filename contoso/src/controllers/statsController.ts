import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService';

export class StatsController {
    /**
     * GET /api/stats - Get student enrollment statistics
     */
    async getStudentStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await statsService.getStudentEnrollmentStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

export const statsController = new StatsController();
