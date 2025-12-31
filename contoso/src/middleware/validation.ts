import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to check validation results and throw ValidationError if any errors exist
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => {
            if ('path' in err) {
                return `${err.path}: ${err.msg}`;
            }
            return err.msg;
        });
        throw new ValidationError(errorMessages.join(', '));
    }
    next();
};

/**
 * Validates that a string parameter is a valid positive integer
 */
export const validateId = (paramName: string = 'id'): ValidationChain[] => [
    param(paramName)
        .trim()
        .notEmpty().withMessage(`${paramName} is required`)
        .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`)
        .toInt(),
];

/**
 * Student validation rules
 */
export const validateStudentCreate: ValidationChain[] = [
    body('FirstMidName')
        .trim()
        .notEmpty().withMessage('FirstMidName is required')
        .isLength({ min: 1, max: 50 }).withMessage('FirstMidName must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/).withMessage('FirstMidName contains invalid characters'),

    body('LastName')
        .trim()
        .notEmpty().withMessage('LastName is required')
        .isLength({ min: 1, max: 50 }).withMessage('LastName must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/).withMessage('LastName contains invalid characters'),

    body('EnrollmentDate')
        .notEmpty().withMessage('EnrollmentDate is required')
        .isISO8601().withMessage('EnrollmentDate must be a valid date (YYYY-MM-DD)')
        .custom((value) => {
            const date = new Date(value);
            const minDate = new Date('1900-01-01');
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 10); // Allow up to 10 years in future

            if (date < minDate || date > maxDate) {
                throw new Error('EnrollmentDate must be between 1900 and 10 years in the future');
            }
            return true;
        })
        .toDate(),
];

export const validateStudentUpdate: ValidationChain[] = [
    ...validateId('id'),
    body('FirstMidName')
        .optional()
        .trim()
        .notEmpty().withMessage('FirstMidName cannot be empty')
        .isLength({ min: 1, max: 50 }).withMessage('FirstMidName must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/).withMessage('FirstMidName contains invalid characters'),

    body('LastName')
        .optional()
        .trim()
        .notEmpty().withMessage('LastName cannot be empty')
        .isLength({ min: 1, max: 50 }).withMessage('LastName must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/).withMessage('LastName contains invalid characters'),

    body('EnrollmentDate')
        .optional()
        .isISO8601().withMessage('EnrollmentDate must be a valid date (YYYY-MM-DD)')
        .custom((value) => {
            const date = new Date(value);
            const minDate = new Date('1900-01-01');
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 10);

            if (date < minDate || date > maxDate) {
                throw new Error('EnrollmentDate must be between 1900 and 10 years in the future');
            }
            return true;
        })
        .toDate(),
];

/**
 * Course validation rules
 */
export const validateCourseCreate: ValidationChain[] = [
    body('CourseID')
        .notEmpty().withMessage('CourseID is required')
        .isInt({ min: 1, max: 99999 }).withMessage('CourseID must be between 1 and 99999')
        .toInt(),

    body('Title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-'\.,:&()]+$/).withMessage('Title contains invalid characters'),

    body('Credits')
        .notEmpty().withMessage('Credits is required')
        .isInt({ min: 0, max: 5 }).withMessage('Credits must be between 0 and 5')
        .toInt(),

    body('DepartmentID')
        .notEmpty().withMessage('DepartmentID is required')
        .isInt({ min: 1 }).withMessage('DepartmentID must be a positive integer')
        .toInt(),
];

export const validateCourseUpdate: ValidationChain[] = [
    ...validateId('id'),
    body('Title')
        .optional()
        .trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-'\.,:&()]+$/).withMessage('Title contains invalid characters'),

    body('Credits')
        .optional()
        .isInt({ min: 0, max: 5 }).withMessage('Credits must be between 0 and 5')
        .toInt(),

    body('DepartmentID')
        .optional()
        .isInt({ min: 1 }).withMessage('DepartmentID must be a positive integer')
        .toInt(),
];

/**
 * Department validation rules
 */
export const validateDepartmentCreate: ValidationChain[] = [
    body('Name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-&]+$/).withMessage('Name contains invalid characters'),

    body('Budget')
        .notEmpty().withMessage('Budget is required')
        .isFloat({ min: 0, max: 999999999 }).withMessage('Budget must be between 0 and 999,999,999')
        .toFloat(),

    body('StartDate')
        .notEmpty().withMessage('StartDate is required')
        .isISO8601().withMessage('StartDate must be a valid date (YYYY-MM-DD)')
        .custom((value) => {
            const date = new Date(value);
            const minDate = new Date('1900-01-01');
            const maxDate = new Date();

            if (date < minDate || date > maxDate) {
                throw new Error('StartDate must be between 1900 and today');
            }
            return true;
        })
        .toDate(),

    body('InstructorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('InstructorID must be a positive integer')
        .toInt(),

    body('version')
        .optional()
        .isInt({ min: 1 }).withMessage('Version must be a positive integer')
        .toInt(),
];

export const validateDepartmentUpdate: ValidationChain[] = [
    ...validateId('id'),
    body('Name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s\-&]+$/).withMessage('Name contains invalid characters'),

    body('Budget')
        .optional()
        .isFloat({ min: 0, max: 999999999 }).withMessage('Budget must be between 0 and 999,999,999')
        .toFloat(),

    body('StartDate')
        .optional()
        .isISO8601().withMessage('StartDate must be a valid date (YYYY-MM-DD)')
        .custom((value) => {
            const date = new Date(value);
            const minDate = new Date('1900-01-01');
            const maxDate = new Date();

            if (date < minDate || date > maxDate) {
                throw new Error('StartDate must be between 1900 and today');
            }
            return true;
        })
        .toDate(),

    body('InstructorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('InstructorID must be a positive integer')
        .toInt(),

    body('version')
        .notEmpty().withMessage('Version is required for optimistic concurrency')
        .isInt({ min: 1 }).withMessage('Version must be a positive integer')
        .toInt(),
];

/**
 * Query parameter validation for pagination and search
 */
export const validateListQuery: ValidationChain[] = [
    query('page')
        .optional()
        .default('1')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),

    query('pageSize')
        .optional()
        .default('10')
        .isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100')
        .toInt(),

    query('sortBy')
        .optional({ values: 'falsy' })
        .trim()
        .isIn(['name', 'date', 'title', 'credits', 'budget']).withMessage('Invalid sortBy value'),

    query('sortOrder')
        .optional()
        .default('asc')
        .trim()
        .isIn(['asc', 'desc']).withMessage('SortOrder must be asc or desc'),

    query('search')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 100 }).withMessage('Search query too long')
        .matches(/^[a-zA-Z0-9\s\-'\.]+$/).withMessage('Search contains invalid characters'),
];

/**
 * Validates instructor assignment
 */
export const validateInstructorAssignment: ValidationChain[] = [
    ...validateId('id'),
    body('instructorId')
        .notEmpty().withMessage('instructorId is required')
        .isInt({ min: 1 }).withMessage('instructorId must be a positive integer')
        .toInt(),
];
