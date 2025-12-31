import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log error for debugging
    console.error('❌ Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    // Handle known operational errors
    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json({
            error: err.message,
            path: req.path,
        });
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database operation failed',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }

    // Handle validation errors (Zod)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: process.env.NODE_ENV === 'development' ? err : undefined,
        });
    }

    // Handle unknown errors
    return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
}
