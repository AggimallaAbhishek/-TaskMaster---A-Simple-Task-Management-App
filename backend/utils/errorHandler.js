/**
 * Error codes and handling for TaskMaster API
 * Provides consistent error responses with error codes for client-side handling
 */

const ERROR_CODES = {
    // Authentication (401)
    UNAUTHORIZED: 'UNAUTHORIZED',
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',

    // Validation (400)
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    INVALID_ID: 'INVALID_ID',
    INVALID_PAGINATION: 'INVALID_PAGINATION',
    INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',

    // Not Found (404)
    NOT_FOUND: 'NOT_FOUND',
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',

    // Conflict (409)
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    INCOMPLETE_SUBTASKS: 'INCOMPLETE_SUBTASKS',
    BLOCKED_DEPENDENCY: 'BLOCKED_DEPENDENCY',

    // File Upload (400/413)
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    ATTACHMENT_NOT_FOUND: 'ATTACHMENT_NOT_FOUND',

    // Server (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
};

/**
 * Format error response with code and message
 */
const formatErrorResponse = (code, message, details = null) => {
    const response = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
    };

    if (details) {
        response.details = details;
    }

    return response;
};

/**
 * Validate ISO 8601 date format (YYYY-MM-DD or full ISO string)
 */
const validateISODate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return {
            valid: false,
            error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD or full ISO string)',
        };
    }

    // Check if date string is in valid ISO format
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return {
            valid: false,
            error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD or full ISO string)',
        };
    }

    return { valid: true, date };
};

/**
 * Validate task priority
 */
const validatePriority = (priority) => {
    const valid = ['high', 'medium', 'low'];
    if (!priority || !valid.includes(priority.toLowerCase())) {
        return {
            valid: false,
            error: `Invalid priority. Must be one of: ${valid.join(', ')}`,
        };
    }
    return { valid: true };
};

/**
 * Validate task category
 */
const validateCategory = (category) => {
    const valid = ['general', 'learning', 'development', 'deployment', 'personal', 'work'];
    if (!category || !valid.includes(category.toLowerCase())) {
        return {
            valid: false,
            error: `Invalid category. Must be one of: ${valid.join(', ')}`,
        };
    }
    return { valid: true };
};

/**
 * Parse and validate pagination parameters
 */
const validatePagination = (page, limit) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
        return {
            valid: false,
            error: 'Page must be a positive integer',
        };
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return {
            valid: false,
            error: 'Limit must be between 1 and 100',
        };
    }

    return { valid: true, page: pageNum, limit: limitNum };
};

module.exports = {
    ERROR_CODES,
    formatErrorResponse,
    validateISODate,
    validatePriority,
    validateCategory,
    validatePagination,
};
