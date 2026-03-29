/**
 * File handling utilities for task attachments
 * Handles validation, sanitization, and security
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Allowed file types by MIME type and extension
const ALLOWED_TYPES = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/zip': 'zip',
};

const ALLOWED_EXTENSIONS = new Set(Object.values(ALLOWED_TYPES));
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Validate file type
 */
const isValidFileType = (mimeType) => {
    return mimeType in ALLOWED_TYPES;
};

/**
 * Sanitize filename to prevent directory traversal
 * Returns secure filename with timestamp and hash
 */
const sanitizeFilename = (originalFilename) => {
    if (!originalFilename) {
        throw new Error('Filename is required');
    }

    // Get file extension
    const ext = path.extname(originalFilename).toLowerCase();
    const basename = path.basename(originalFilename, ext);

    // Check if extension is allowed
    if (!ext || !ALLOWED_EXTENSIONS.has(ext.substring(1))) {
        throw new Error('File extension not allowed');
    }

    // Remove unsafe characters from basename
    const safeName = basename
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50); // Limit length

    // Generate unique filename with timestamp and hash
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(4).toString('hex');
    const secureFilename = `${safeName}_${timestamp}_${randomHash}${ext}`;

    return secureFilename;
};

/**
 * Verify file path is within uploads directory (prevent directory traversal)
 */
const isPathSafe = (filePath) => {
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(UPLOADS_DIR);
    return resolvedPath.startsWith(resolvedDir);
};

/**
 * Ensure uploads directory exists
 */
const ensureUploadsDir = async () => {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to create uploads directory: ${error.message}`);
    }
};

/**
 * Delete file from disk
 */
const deleteFile = async (filename) => {
    try {
        const filePath = path.join(UPLOADS_DIR, filename);

        // Verify path is safe
        if (!isPathSafe(filePath)) {
            throw new Error('Invalid file path');
        }

        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
};

/**
 * Get file path for reading
 */
const getFilePath = (filename) => {
    const filePath = path.join(UPLOADS_DIR, filename);

    // Verify path is safe
    if (!isPathSafe(filePath)) {
        throw new Error('Invalid file path');
    }

    return filePath;
};

module.exports = {
    ALLOWED_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE,
    UPLOADS_DIR,
    isValidFileType,
    sanitizeFilename,
    isPathSafe,
    ensureUploadsDir,
    deleteFile,
    getFilePath,
};
