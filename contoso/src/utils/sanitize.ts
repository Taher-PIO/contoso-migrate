/**
 * Utility functions for sanitizing user input and preventing security vulnerabilities
 */

/**
 * Sanitizes a string to prevent XSS attacks by removing/escaping dangerous characters
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
    if (!input) return input;
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // HTML entity encoding for dangerous characters
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    return sanitized;
}

/**
 * Validates that a string contains only safe characters for names
 * @param input - The string to validate
 * @returns True if valid, false otherwise
 */
export function isValidName(input: string): boolean {
    // Allow letters, spaces, hyphens, apostrophes, and periods
    const namePattern = /^[a-zA-Z\s\-'\.]+$/;
    return namePattern.test(input);
}

/**
 * Validates that a string contains only alphanumeric characters and common punctuation
 * @param input - The string to validate
 * @returns True if valid, false otherwise
 */
export function isValidText(input: string): boolean {
    // Allow letters, numbers, spaces, and common punctuation
    const textPattern = /^[a-zA-Z0-9\s\-'\.,:;!?()&]+$/;
    return textPattern.test(input);
}

/**
 * Ensures a query parameter is a single value, not an array (prevents parameter pollution)
 * @param param - The query parameter value
 * @returns The first value if array, otherwise the original value
 */
export function ensureSingleValue(param: string | string[] | undefined): string | undefined {
    if (Array.isArray(param)) {
        return param[0];
    }
    return param;
}

/**
 * Safely parses an integer with validation
 * @param value - The value to parse
 * @param paramName - The name of the parameter (for error messages)
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The parsed integer
 * @throws ValidationError if invalid
 */
export function safeParseInt(
    value: string | number | undefined,
    paramName: string,
    min: number = 1,
    max: number = Number.MAX_SAFE_INTEGER
): number {
    if (value === undefined || value === null || value === '') {
        throw new Error(`${paramName} is required`);
    }

    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;

    if (isNaN(parsed)) {
        throw new Error(`${paramName} must be a valid number`);
    }

    if (parsed < min || parsed > max) {
        throw new Error(`${paramName} must be between ${min} and ${max}`);
    }

    if (!Number.isInteger(parsed)) {
        throw new Error(`${paramName} must be an integer`);
    }

    return parsed;
}

/**
 * Sanitizes query parameters to prevent injection attacks
 * @param search - The search query string
 * @returns The sanitized search string
 */
export function sanitizeSearchQuery(search: string | undefined): string | undefined {
    if (!search) return undefined;

    // Remove SQL-like syntax
    let sanitized = search
        .replace(/[;'"`\\]/g, '') // Remove SQL special chars
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove /* */
        .replace(/\*\//g, '')
        .replace(/<script>/gi, '') // Remove script tags
        .replace(/<\/script>/gi, '');

    // Limit length
    sanitized = sanitized.substring(0, 100);

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized || undefined;
}

/**
 * Validates and sanitizes pagination parameters for students
 */
export function sanitizePaginationParams(params: {
    page?: string | string[];
    pageSize?: string | string[];
    sortBy?: string | string[];
    sortOrder?: string | string[];
    search?: string | string[];
}): {
    page: number;
    pageSize: number;
    sortBy?: 'LastName' | 'EnrollmentDate';
    sortOrder?: 'asc' | 'desc';
    search?: string;
} {
    const page = ensureSingleValue(params.page);
    const pageSize = ensureSingleValue(params.pageSize);
    const sortBy = ensureSingleValue(params.sortBy);
    const sortOrder = ensureSingleValue(params.sortOrder);
    const search = ensureSingleValue(params.search);

    // Map frontend sort values to backend field names
    let validatedSortBy: 'LastName' | 'EnrollmentDate' | undefined = undefined;
    if (sortBy === 'LastName' || sortBy === 'name') {
        validatedSortBy = 'LastName';
    } else if (sortBy === 'EnrollmentDate' || sortBy === 'date') {
        validatedSortBy = 'EnrollmentDate';
    }

    return {
        page: page ? safeParseInt(page, 'page', 1, 10000) : 1,
        pageSize: pageSize ? safeParseInt(pageSize, 'pageSize', 1, 100) : 10,
        sortBy: validatedSortBy,
        sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
        search: sanitizeSearchQuery(search),
    };
}
