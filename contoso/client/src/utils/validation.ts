/**
 * Utility functions for sanitizing and validating user input on the frontend
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove inline event handlers
}

/**
 * Validates that a string contains only safe name characters
 * @param input - The string to validate
 * @returns True if valid, false otherwise
 */
export function isValidName(input: string): boolean {
  const namePattern = /^[a-zA-Z\s\-'\.]+$/;
  return namePattern.test(input);
}

/**
 * Validates that a date is within acceptable range
 * @param date - The date to validate
 * @param minYear - Minimum year (default: 1900)
 * @param maxYearsInFuture - Maximum years in future (default: 10)
 * @returns True if valid, false otherwise
 */
export function isValidDateRange(
  date: Date | string,
  minYear: number = 1900,
  maxYearsInFuture: number = 10
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  const minDate = new Date(`${minYear}-01-01`);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYearsInFuture);
  
  return dateObj >= minDate && dateObj <= maxDate;
}

/**
 * Formats a date for form input (YYYY-MM-DD)
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Validates required fields are not empty
 * @param fields - Object with field names and values
 * @returns Array of error messages, empty if valid
 */
export function validateRequired(fields: Record<string, any>): string[] {
  const errors: string[] = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      errors.push(`${key} is required`);
    }
  });
  
  return errors;
}

/**
 * Validates string length
 * @param value - The string to validate
 * @param fieldName - Name of the field
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns Error message or null if valid
 */
export function validateLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): string | null {
  if (!value) {
    return null; // Use validateRequired separately
  }
  
  const length = value.trim().length;
  
  if (length < min || length > max) {
    return `${fieldName} must be between ${min} and ${max} characters`;
  }
  
  return null;
}

/**
 * Escapes HTML to prevent XSS
 * @param text - The text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validates and sanitizes search query
 * @param query - The search query
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[<>'"`;\\]/g, ''); // Remove dangerous characters
}
