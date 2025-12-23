import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
    try {
        const pool = await getConnection();

        // Test database with a simple query
        const result = await pool.request().query(`
            SELECT 
                DB_NAME() AS database,
                GETDATE() AS serverTime,
                1 AS status
        `);

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                name: result.recordset[0].database,
                serverTime: result.recordset[0].serverTime,
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
