import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getConnection, closeConnection } from './config/database';
import healthRouter from './routes/health';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Routes
app.use('/api', healthRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Contoso University API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
        },
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        message: 'The requested resource was not found',
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error occurred:', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('='.repeat(60));
        console.log('🚀 Starting Contoso University API Server');
        console.log('='.repeat(60));

        // Test database connection before starting server
        await getConnection();

        app.listen(PORT, () => {
            console.log('');
            console.log('✅ Server is running!');
            console.log(`   URL: http://localhost:${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Health Check: http://localhost:${PORT}/api/health`);
            console.log('');
            console.log('Press Ctrl+C to stop the server');
            console.log('='.repeat(60));
        });
    } catch (error) {
        console.error('');
        console.error('❌ Failed to start server');
        console.error('');
        if (error instanceof Error) {
            console.error('Error:', error.message);
        }
        console.error('');
        process.exit(1);
    }
};

// Graceful shutdown handlers
const shutdown = async (signal: string) => {
    console.log('');
    console.log(`⚠️  Received ${signal}, shutting down gracefully...`);
    await closeConnection();
    console.log('✅ Server stopped');
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

startServer();
