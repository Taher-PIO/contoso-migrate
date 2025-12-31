import { Router, Request, Response } from 'express';
import { getSqliteConnection } from '../config/database';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
    try {
        const db = getSqliteConnection();

        // Test database with a simple query - SQLite uses single quotes for string literals
        const result = db.prepare("SELECT datetime('now') as serverTime, 1 as status").get() as any;

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                type: 'SQLite',
                serverTime: result.serverTime,
            },
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: false,
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
