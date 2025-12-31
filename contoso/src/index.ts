import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/drizzle';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import departmentsRouter from './routes/departments';
import coursesRouter from './routes/courses';
import studentsRouter from './routes/students';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
// Helmet - Set security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

// CORS - Configure allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// HTTP Parameter Pollution protection
app.use(hpp());

// Compression - Reduce response size
app.use(compression());

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Routes
app.use('/api', healthRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/students', studentsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Contoso University API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            departments: '/api/departments',
            courses: '/api/courses',
            students: '/api/students',
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
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('='.repeat(60));
        console.log('🚀 Starting Contoso University API Server');
        console.log('='.repeat(60));

        // Connect to database and configure SQLite
        await connectDatabase();

        app.listen(PORT, () => {
            console.log('');
            console.log('✅ Server is running!');
            console.log(`   URL: http://localhost:${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Health Check: http://localhost:${PORT}/api/health`);
            console.log('');
            console.log('Available endpoints:');
            console.log(`   GET    /api/departments`);
            console.log(`   POST   /api/departments`);
            console.log(`   GET    /api/courses`);
            console.log(`   POST   /api/courses`);
            console.log(`   GET    /api/students`);
            console.log(`   POST   /api/students`);
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
    await disconnectDatabase();
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
