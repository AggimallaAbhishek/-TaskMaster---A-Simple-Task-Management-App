require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const { 
    ERROR_CODES, 
    formatErrorResponse, 
    validateISODate, 
    validatePriority, 
    validateCategory, 
    validatePagination 
} = require('./utils/errorHandler');
const {
    isValidFileType,
    sanitizeFilename,
    MAX_FILE_SIZE,
    ensureUploadsDir,
    deleteFile,
    getFilePath,
    UPLOADS_DIR,
} = require('./utils/fileHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== ENVIRONMENT VALIDATION ==========
// Always validate environment variables (development and production)
const validateEnvironment = () => {
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Required in both dev and production
    const alwaysRequired = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
    
    // Required only in production
    const productionOnly = ['SESSION_SECRET', 'DATABASE_URL'];
    
    // Check always-required variables
    const missingAlways = alwaysRequired.filter(varName => !process.env[varName]);
    
    if (missingAlways.length > 0) {
        console.error('❌ CRITICAL: Missing required environment variables:', missingAlways.join(', '));
        if (!isDev) {
            process.exit(1);
        }
    }
    
    // Check production-only variables
    if (!isDev) {
        const missingProduction = productionOnly.filter(varName => !process.env[varName]);
        if (missingProduction.length > 0) {
            console.error('❌ FATAL: Missing production environment variables:', missingProduction.join(', '));
            process.exit(1);
        }
    }
    
    // Validate PORT is numeric
    if (isNaN(parseInt(PORT, 10))) {
        console.error('❌ Invalid PORT. Must be a number, got:', PORT);
        process.exit(1);
    }
    
    // Validate DB_PORT is numeric
    if (process.env.DB_PORT && isNaN(parseInt(process.env.DB_PORT, 10))) {
        console.error('❌ Invalid DB_PORT. Must be a number, got:', process.env.DB_PORT);
        process.exit(1);
    }
    
    // Session secret length check (in production)
    if (!isDev && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        console.warn('⚠️  SESSION_SECRET should be at least 32 characters for security. Current length:', process.env.SESSION_SECRET.length);
    }
    
    console.log('✅ Environment variables validated successfully');
};

validateEnvironment();

// ========== DATABASE CONFIGURATION WITH POOLING ==========
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'aggimallaabhishek',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taskmaster',

    // Connection pooling configuration
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT || '5000'),
    
    // Query timeout (30 seconds)
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
});

// Database connection pool event handlers
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
});

pool.on('connect', () => {
    if (process.env.LOG_LEVEL === 'debug') {
        console.log('✓ Database pool connected');
    }
});

// ========== SECURITY MIDDLEWARE ==========
// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources
}));

// Compression for responses
app.use(compression());

// Rate limiting - general API
const isDevelopment = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // More lenient in development
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.SKIP_RATE_LIMIT === 'true',
});

// Rate limiting for auth endpoints (more lenient in dev)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 10, // More lenient in development
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.SKIP_RATE_LIMIT === 'true',
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

// ========== FILE UPLOAD CONFIGURATION ==========
// Configure multer for file uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 50 : 10, // Max 10 uploads per 15 minutes (production)
    message: { error: 'Too many upload attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.SKIP_RATE_LIMIT === 'true',
});

app.use('/api/tasks/:id/attachments', uploadLimiter);

// Initialize uploads directory
ensureUploadsDir().catch(err => {
    console.error('Failed to initialize uploads directory:', err);
});

// Configure multer storage
const upload = multer({
    dest: UPLOADS_DIR,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // One file at a time
    },
    fileFilter: (req, file, cb) => {
        // Validate MIME type
        if (!isValidFileType(file.mimetype)) {
            return cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
        cb(null, true);
    },
});

// ========== LOGGING MIDDLEWARE ==========
app.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logMessage = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            user: req.user?.id || 'anonymous',
        };

        if (process.env.LOG_FORMAT === 'json') {
            console.log(JSON.stringify(logMessage));
        } else if (process.env.LOG_LEVEL !== 'silent') {
            console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        }
    });

    next();
});

// Enhanced CORS middleware - Secure configuration
app.use((req, res, next) => {
    const allowedOrigins = [];
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Build allowed origins from environment variables
    if (process.env.CORS_ORIGIN) {
        allowedOrigins.push(process.env.CORS_ORIGIN);
    }
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.FRONTEND_URL_DEV && isDevelopment) {
        allowedOrigins.push(process.env.FRONTEND_URL_DEV);
    }
    if (process.env.FRONTEND_URL_PROD) {
        allowedOrigins.push(process.env.FRONTEND_URL_PROD);
    }

    // Default development origins (only in dev mode)
    if (isDevelopment) {
        allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173');
    }

    const origin = req.headers.origin;
    let corsOrigin = null;

    if (origin && allowedOrigins.includes(origin)) {
        // Specific origin allowed
        corsOrigin = origin;
    } else if (isDevelopment && origin) {
        // Development: allow the requesting origin (but not wildcard with credentials)
        corsOrigin = origin;
    } else if (isDevelopment && !origin) {
        // Same-origin or non-browser request in dev
        corsOrigin = allowedOrigins[0] || 'http://localhost:5173';
    } else if (!isDevelopment && allowedOrigins.length > 0) {
        // Production: only allow configured origins
        corsOrigin = origin && allowedOrigins.includes(origin) ? origin : null;
    }

    // Only set CORS headers if we have a valid origin
    if (corsOrigin) {
        res.header('Access-Control-Allow-Origin', corsOrigin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
    }

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        if (process.env.LOG_LEVEL === 'debug') {
            console.log('✓ CORS preflight request received for', origin || '*');
        }
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
        return res.status(200).end();
    }

    next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with PostgreSQL store
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
}

app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: sessionSecret || 'dev-only-secret-not-for-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        httpOnly: true, // Prevent XSS access to cookies
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

// User serialization and deserialization for sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT id, username, email, picture FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return done(new Error('User not found'), null);
        }
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy - only configure if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        passReqToCallback: true
    }, async (request, accessToken, refreshToken, profile, done) => {
    try {
        // Validate profile data exists
        const email = profile.emails?.[0]?.value;
        const photo = profile.photos?.[0]?.value || null;
        
        if (!email) {
            return done(new Error('No email provided by Google OAuth'), null);
        }

        // Check if user already exists in our database
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        
        if (result.rows.length > 0) {
            // User exists, return the user
            return done(null, result.rows[0]);
        } else {
            // Check if user exists with email
            result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length > 0) {
                // User exists with email, update with Google ID
                const updateResult = await pool.query(
                    'UPDATE users SET google_id = $1, picture = $2 WHERE id = $3 RETURNING *',
                    [profile.id, photo, result.rows[0].id]
                );
                return done(null, updateResult.rows[0]);
            } else {
                // Create new user
                const newUser = await pool.query(
                    'INSERT INTO users (username, email, google_id, picture) VALUES ($1, $2, $3, $4) RETURNING *',
                    [profile.displayName, email, profile.id, photo]
                );
                return done(null, newUser.rows[0]);
            }
        }
    } catch (err) {
        return done(err, null);
    }
    }));
} else if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Google OAuth credentials not configured. OAuth will be disabled.');
}

// Initialize database with tables - safe migration (no data loss)
const initializeDatabase = async () => {
    try {
        // Create users table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                google_id VARCHAR(255) UNIQUE,
                picture VARCHAR(500),
                bio TEXT,
                theme VARCHAR(20) DEFAULT 'light',
                notifications_enabled BOOLEAN DEFAULT true,
                avatar_path VARCHAR(500),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tasks table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                priority VARCHAR(20) DEFAULT 'medium',
                category VARCHAR(100) DEFAULT 'general',
                due_date TIMESTAMP WITH TIME ZONE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create task_recurrence table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_recurrence (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
                interval INTEGER DEFAULT 1 CHECK (interval > 0),
                end_date TIMESTAMP WITH TIME ZONE,
                last_recurrence_date TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create task_tags table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_tags (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                tag VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, tag)
            )
        `);

        // Create filter_presets table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS filter_presets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                filter_config JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
        `);

        // Create subtasks table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subtasks (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create task_dependencies table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_dependencies (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, depends_on_id),
                CHECK (task_id != depends_on_id)
            )
        `);

        // Create attachments table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type VARCHAR(100),
                uploaded_by INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better query performance (IF NOT EXISTS)
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_recurrence_task_id ON task_recurrence(task_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_recurrence_active ON task_recurrence(is_active)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by)`);

        console.log('✅ Database initialized successfully (tables and indexes created if needed)');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error; // Re-throw to prevent server start if DB init fails
    }
};

// Export the app for use in tests
module.exports = app;

// Start the server if this file is run directly
if (require.main === module) {
    let server;
    
    const startServer = async () => {
        try {
            // Initialize database on startup
            await initializeDatabase();

            server = app.listen(PORT, () => {
                console.log('====================================');
                console.log('🚀 TaskMaster Server');
                console.log('====================================');
                console.log(`Port: ${PORT}`);
                console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log('CORS enabled for frontend origins');
                console.log('====================================');
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    };

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        
        if (server) {
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await pool.end();
                    console.log('Database pool closed.');
                    process.exit(0);
                } catch (err) {
                    console.error('Error closing database pool:', err);
                    process.exit(1);
                }
            });
            
            // Force close after 10 seconds
            setTimeout(() => {
                console.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    startServer().catch(console.error);
}

// ========== ROUTES ==========

// Authentication routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(frontendUrl);
    }
);

// Demo authentication route for development (always available in non-production)
if (process.env.NODE_ENV !== 'production') {
    app.get('/auth/demo', async (req, res) => {
        try {
            // Create or get demo user
            let user = await pool.query('SELECT * FROM users WHERE email = $1', ['demo@taskmaster.local']);

            if (user.rows.length === 0) {
                // Create demo user
                const result = await pool.query(
                    'INSERT INTO users (username, email, picture) VALUES ($1, $2, $3) RETURNING *',
                    ['Demo User', 'demo@taskmaster.local', null]
                );
                user = result;
            }

            // Manually create session
            req.logIn(user.rows[0], (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.redirect('/?error=login_failed');
                }
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                res.redirect(frontendUrl);
            });
        } catch (error) {
            console.error('Demo auth error:', error);
            res.redirect('/?error=demo_auth_failed');
        }
    });
}

// Fallback routes when Google OAuth not configured
if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLIENT_ID) {
    app.get('/auth/google', (req, res) => {
        // Redirect to demo mode since Google OAuth not configured
        res.redirect('/auth/demo');
    });

    app.get('/auth/google/callback', (req, res) => {
        // Redirect to demo mode since Google OAuth not configured
        res.redirect('/auth/demo');
    });
}

app.get('/auth/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        const { id, username, email, picture } = req.user;
        res.json({ id, username, email, picture });
    } else {
        res.status(401).json(
            formatErrorResponse(ERROR_CODES.NOT_AUTHENTICATED, 'User not authenticated')
        );
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '✅ TaskMaster API Root is working!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /health',
            'GET /api/health',
            'GET /api/tasks',
            'POST /api/tasks',
            'GET /auth/google',
            'GET /auth/google/callback',
            'GET /auth/logout',
            'GET /auth/user'
        ]
    });
});

// Health endpoint for Render - with database check
app.get('/health', async (req, res) => {
    try {
        // Check database connectivity
        await pool.query('SELECT 1');
        res.json({
            status: 'OK',
            service: 'TaskMaster Backend',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            service: 'TaskMaster Backend',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// API Health endpoint - with database check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    }
});

// Mock authentication for testing - inject before route checks
if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLIENT_ID) {
    app.use((req, res, next) => {
        // Auto-authenticate in test/dev mode without OAuth credentials
        req.user = req.user || { id: 1, username: 'testuser', email: 'test@example.com', picture: '' };
        req.isAuthenticated = () => true;
        next();
    });
}

// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json(
        formatErrorResponse(ERROR_CODES.UNAUTHORIZED, 'User is not authenticated')
    );
};

// ========== INPUT VALIDATION HELPERS ==========

// Validation helpers
const validatePriorityValue = (priority) => {
    if (!priority) return null;
    const validation = validatePriority(priority);
    return validation.valid ? null : formatErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        validation.error
    );
};

const validateCategoryValue = (category) => {
    if (!category) return null;
    const validation = validateCategory(category);
    return validation.valid ? null : formatErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        validation.error
    );
};

// Validate due date format (ISO 8601)
const validateDueDateFormat = (dueDate) => {
    if (!dueDate) return null;
    
    const dateValidation = validateISODate(dueDate);
    if (dateValidation && !dateValidation.valid) {
        return formatErrorResponse(
            ERROR_CODES.INVALID_DATE_FORMAT,
            dateValidation.error
        );
    }
    return null;
};

// Get all tasks for the current user with optional pagination and filtering
app.get('/api/tasks', ensureAuthenticated, async (req, res) => {
    try {
        const { 
            page, 
            limit, 
            priority, 
            category, 
            completed, 
            search,
            sortBy = 'id',
            sortOrder = 'ASC'
        } = req.query;

        // Build WHERE clause dynamically
        const conditions = ['user_id = $1'];
        const values = [req.user.id];
        let paramCount = 1;

        // Add filters if provided
        if (priority) {
            paramCount++;
            conditions.push(`priority = $${paramCount}`);
            values.push(priority);
        }

        if (category) {
            paramCount++;
            conditions.push(`category = $${paramCount}`);
            values.push(category);
        }

        if (completed !== undefined) {
            paramCount++;
            conditions.push(`completed = $${paramCount}`);
            values.push(completed === 'true');
        }

        if (search) {
            paramCount++;
            conditions.push(`title ILIKE $${paramCount}`);
            values.push(`%${search}%`);
        }

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['id', 'title', 'priority', 'due_date', 'created_at', 'completed'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
        const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const whereClause = conditions.join(' AND ');

        // Pagination
        if (page && limit) {
            const validation = validatePagination(page, limit);
            if (!validation.valid) {
                return res.status(400).json(
                    formatErrorResponse(ERROR_CODES.INVALID_PAGINATION, validation.error)
                );
            }

            const { page: pageNum, limit: limitNum } = validation;
            const offset = (pageNum - 1) * limitNum;
            
            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM tasks WHERE ${whereClause}`,
                values
            );
            const totalCount = parseInt(countResult.rows[0].count, 10);

            // Get paginated results
            const result = await pool.query(
                `SELECT * FROM tasks WHERE ${whereClause} ORDER BY ${sortField} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
                [...values, limitNum, offset]
            );

            return res.json({
                tasks: result.rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limitNum),
                    hasMore: offset + limitNum < totalCount
                }
            });
        }

        // No pagination - return all matching tasks
        const result = await pool.query(
            `SELECT * FROM tasks WHERE ${whereClause} ORDER BY ${sortField} ${order}`,
            values
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search tasks by title or description
app.get('/api/tasks/search', ensureAuthenticated, async (req, res) => {
    const { q, limit = 50 } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Search query (q) is required')
        );
    }

    const searchLimit = parseInt(limit, 10);
    if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
        return res.status(400).json(
            formatErrorResponse(
                ERROR_CODES.INVALID_PARAMETER, 
                'Limit must be between 1 and 100',
                { limit: searchLimit }
            )
        );
    }

    try {
        const result = await pool.query(
            `SELECT * FROM tasks 
             WHERE user_id = $1 AND title ILIKE $2 
             ORDER BY 
                CASE WHEN title ILIKE $3 THEN 0 ELSE 1 END,
                created_at DESC
             LIMIT $4`,
            [req.user.id, `%${q}%`, `${q}%`, searchLimit]
        );

        res.json({
            query: q,
            count: result.rows.length,
            tasks: result.rows
        });
    } catch (error) {
        console.error('Error searching tasks:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error searching tasks')
        );
    }
});

// Create new task for the current user
app.post('/api/tasks', ensureAuthenticated, async (req, res) => {
    const { title, completed, priority, category, dueDate } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Task title is required')
        );
    }

    // Validate optional fields
    const priorityValidation = validatePriorityValue(priority);
    if (priorityValidation) {
        return res.status(400).json(priorityValidation);
    }

    const categoryValidation = validateCategoryValue(category);
    if (categoryValidation) {
        return res.status(400).json(categoryValidation);
    }

    const dueDateValidation = validateDueDateFormat(dueDate);
    if (dueDateValidation) {
        return res.status(400).json(dueDateValidation);
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, completed, priority, category, due_date, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title.trim(), completed || false, priority || 'medium', category || 'general', dueDate || null, req.user.id]
        );
        
        const newTask = result.rows[0];
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update task (PUT - full replacement) for the current user
app.put('/api/tasks/:id', ensureAuthenticated, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
        );
    }
    const { title, completed, priority, category, dueDate } = req.body;

    // Validate input
    if (title === undefined && completed === undefined && priority === undefined && category === undefined && dueDate === undefined) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'At least one field must be provided for update')
        );
    }

    if (title !== undefined && (!title || title.trim() === '')) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Task title is required')
        );
    }

    // Validate optional fields
    const priorityError = validatePriorityValue(priority);
    if (priorityError) {
        return res.status(400).json(priorityError);
    }

    const dueDateError = validateDueDateFormat(dueDate);
    if (dueDateError) {
        return res.status(400).json(dueDateError);
    }

    try {
        // Build dynamic query based on provided fields
        let query = 'UPDATE tasks SET ';
        const values = [];
        let paramCount = 1;

        if (title !== undefined) {
            query += `title = $${paramCount++}, `;
            values.push(title.trim());
        }

        if (completed !== undefined) {
            query += `completed = $${paramCount++}, `;
            values.push(Boolean(completed));
        }

        if (priority !== undefined) {
            query += `priority = $${paramCount++}, `;
            values.push(priority);
        }

        if (category !== undefined) {
            query += `category = $${paramCount++}, `;
            values.push(category);
        }

        if (dueDate !== undefined) {
            query += `due_date = $${paramCount++}, `;
            values.push(dueDate || null);
        }

        // Add updated_at timestamp and ensure user owns the task
        query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
        values.push(taskId);
        values.push(req.user.id);

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        const updatedTask = result.rows[0];
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error updating task')
        );
    }
});

// Delete task for the current user
app.delete('/api/tasks/:id', ensureAuthenticated, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
        );
    }
    
    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [taskId, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found or unauthorized')
            );
        }

        const deletedTask = result.rows[0];
        res.json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error deleting task')
        );
    }
});

// Bulk delete tasks
app.post('/api/tasks/bulk-delete', ensureAuthenticated, async (req, res) => {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'taskIds must be a non-empty array')
        );
    }

    // Validate all IDs are numbers
    const validIds = taskIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
    if (validIds.length === 0) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'No valid task IDs provided')
        );
    }

    try {
        const placeholders = validIds.map((_, i) => `$${i + 2}`).join(',');
        const result = await pool.query(
            `DELETE FROM tasks WHERE id IN (${placeholders}) AND user_id = $1 RETURNING *`,
            [req.user.id, ...validIds]
        );

        res.json({
            message: `${result.rows.length} task(s) deleted successfully`,
            deletedCount: result.rows.length,
            deletedTasks: result.rows
        });
    } catch (error) {
        console.error('Error bulk deleting tasks:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error bulk deleting tasks')
        );
    }
});

// Bulk update tasks
app.post('/api/tasks/bulk-update', ensureAuthenticated, async (req, res) => {
    const { taskIds, updates } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'taskIds must be a non-empty array')
        );
    }

    if (!updates || typeof updates !== 'object') {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'updates must be an object')
        );
    }

    // Validate allowed update fields
    const allowedFields = ['completed', 'priority', 'category'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'No valid update fields provided. Allowed: completed, priority, category')
        );
    }

    // Validate priority if provided
    if (updates.priority) {
        const priorityValidation = validatePriorityValue(updates.priority);
        if (priorityValidation) {
            return res.status(400).json(priorityValidation);
        }
    }

    // Validate all IDs are numbers
    const validIds = taskIds.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
    if (validIds.length === 0) {
        return res.status(400).json(
            formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'No valid task IDs provided')
        );
    }

    try {
        // Build SET clause
        const setClause = updateFields.map((field, i) => `${field} = $${i + 2}`).join(', ');
        const values = [req.user.id, ...updateFields.map(f => updates[f])];
        
        const placeholders = validIds.map((_, i) => `$${updateFields.length + i + 2}`).join(',');
        values.push(...validIds);

        const result = await pool.query(
            `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND user_id = $1 RETURNING *`,
            values
        );

        res.json({
            message: `${result.rows.length} task(s) updated successfully`,
            updatedCount: result.rows.length,
            updatedTasks: result.rows
        });
    } catch (error) {
        console.error('Error bulk updating tasks:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error bulk updating tasks')
        );
    }
});



// ========== PROFILE MANAGEMENT ENDPOINTS ==========

// Get user profile with all details
app.get('/api/users/profile', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, picture, bio, theme, notifications_enabled, avatar_path, created_at, updated_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.put('/api/users/profile', ensureAuthenticated, async (req, res) => {
    const { bio, theme, notifications_enabled } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users
             SET bio = COALESCE($1, bio),
                 theme = COALESCE($2, theme),
                 notifications_enabled = COALESCE($3, notifications_enabled),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [bio, theme, notifications_enabled, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user avatar
app.delete('/api/users/avatar', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET avatar_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Avatar deleted successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user account (GDPR compliance)
app.delete('/api/users', ensureAuthenticated, async (req, res) => {
    try {
        // Delete user (cascade will delete tasks, filter presets, and sessions)
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Destroy session
        req.logout((err) => {
            if (err) {
                console.error('Error logging out after account deletion:', err);
            }
        });

        res.json({ 
            message: 'Account deleted successfully', 
            deletedUser: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== FILTER PRESETS ENDPOINTS =====

// GET /api/filter-presets - Get all presets for authenticated user
app.get('/api/filter-presets', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM filter_presets WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching filter presets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/filter-presets - Create new filter preset
app.post('/api/filter-presets', ensureAuthenticated, async (req, res) => {
    try {
        const { name, description, filter_config } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Preset name is required' });
        }

        const result = await pool.query(
            'INSERT INTO filter_presets (user_id, name, description, filter_config) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, name.trim(), description || null, filter_config || {}]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Preset with this name already exists' });
        }
        console.error('Error creating filter preset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/filter-presets/:id - Update filter preset
app.put('/api/filter-presets/:id', ensureAuthenticated, async (req, res) => {
    try {
        const presetId = parseInt(req.params.id, 10);
        if (isNaN(presetId)) {
            return res.status(400).json({ error: 'Invalid preset ID' });
        }
        const { name, description, filter_config } = req.body;

        // Verify preset belongs to user
        const presetCheck = await pool.query(
            'SELECT * FROM filter_presets WHERE id = $1 AND user_id = $2',
            [presetId, req.user.id]
        );

        if (presetCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Preset not found' });
        }

        const result = await pool.query(
            'UPDATE filter_presets SET name = COALESCE($1, name), description = COALESCE($2, description), filter_config = COALESCE($3, filter_config), updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
            [name || null, description || null, filter_config || null, presetId, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Preset name already exists' });
        }
        console.error('Error updating filter preset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/filter-presets/:id - Delete filter preset
app.delete('/api/filter-presets/:id', ensureAuthenticated, async (req, res) => {
    try {
        const presetId = parseInt(req.params.id, 10);
        if (isNaN(presetId)) {
            return res.status(400).json({ error: 'Invalid preset ID' });
        }

        const result = await pool.query(
            'DELETE FROM filter_presets WHERE id = $1 AND user_id = $2 RETURNING *',
            [presetId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Preset not found' });
        }

        res.json({ message: 'Preset deleted successfully', preset: result.rows[0] });
    } catch (error) {
        console.error('Error deleting filter preset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/filter-presets/:id/apply - Apply filter preset and return filtered tasks
app.post('/api/filter-presets/:id/apply', ensureAuthenticated, async (req, res) => {
    try {
        const presetId = parseInt(req.params.id, 10);
        if (isNaN(presetId)) {
            return res.status(400).json({ error: 'Invalid preset ID' });
        }

        // Get the preset
        const presetResult = await pool.query(
            'SELECT * FROM filter_presets WHERE id = $1 AND user_id = $2',
            [presetId, req.user.id]
        );

        if (presetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Preset not found' });
        }

        const preset = presetResult.rows[0];
        const filterConfig = preset.filter_config || {};

        // Build dynamic query based on filter config
        let query = 'SELECT * FROM tasks WHERE user_id = $1';
        const params = [req.user.id];
        let paramCount = 2;

        // Apply filters
        if (filterConfig.completed !== undefined) {
            query += ` AND completed = $${paramCount}`;
            params.push(filterConfig.completed);
            paramCount++;
        }

        if (filterConfig.priority) {
            query += ` AND priority = $${paramCount}`;
            params.push(filterConfig.priority);
            paramCount++;
        }

        if (filterConfig.category) {
            query += ` AND category = $${paramCount}`;
            params.push(filterConfig.category);
            paramCount++;
        }

        if (filterConfig.dueDateFrom) {
            query += ` AND due_date >= $${paramCount}`;
            params.push(filterConfig.dueDateFrom);
            paramCount++;
        }

        if (filterConfig.dueDateTo) {
            query += ` AND due_date <= $${paramCount}`;
            params.push(filterConfig.dueDateTo);
            paramCount++;
        }

        // Apply sort - WHITELIST allowed columns to prevent SQL injection
        const allowedSortColumns = ['created_at', 'updated_at', 'due_date', 'title', 'priority', 'completed'];
        if (filterConfig.sortBy && allowedSortColumns.includes(filterConfig.sortBy)) {
            const sortDir = filterConfig.sortDirection === 'desc' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${filterConfig.sortBy} ${sortDir}`;
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const tasksResult = await pool.query(query, params);
        res.json({ preset: preset, tasks: tasksResult.rows });
    } catch (error) {
        console.error('Error applying filter preset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== TAG ENDPOINTS ==========

// GET /api/tasks/:id/tags - Get all tags for a task
app.get('/api/tasks/:id/tags', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Get tags
        const result = await pool.query(
            'SELECT tag FROM task_tags WHERE task_id = $1 ORDER BY tag ASC',
            [taskId]
        );

        res.json({ tags: result.rows.map(r => r.tag) });
    } catch (error) {
        console.error('Error fetching task tags:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error fetching tags')
        );
    }
});

// POST /api/tasks/:id/tags - Add a tag to a task
app.post('/api/tasks/:id/tags', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        const { tag } = req.body;

        if (!tag || typeof tag !== 'string' || tag.trim() === '') {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Tag is required and must be a non-empty string')
            );
        }

        const trimmedTag = tag.trim().toLowerCase();

        if (trimmedTag.length > 100) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'Tag must be 100 characters or less')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Add tag (ignore duplicate)
        const result = await pool.query(
            `INSERT INTO task_tags (task_id, tag)
             VALUES ($1, $2)
             ON CONFLICT (task_id, tag) DO UPDATE
             SET tag = EXCLUDED.tag
             RETURNING tag`,
            [taskId, trimmedTag]
        );

        res.status(201).json({ tag: result.rows[0].tag });
    } catch (error) {
        console.error('Error adding task tag:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error adding tag')
        );
    }
});

// DELETE /api/tasks/:id/tags/:tag - Remove a tag from a task
app.delete('/api/tasks/:id/tags/:tag', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        const tag = decodeURIComponent(req.params.tag).trim().toLowerCase();

        if (!tag) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Tag is required')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Delete tag
        const result = await pool.query(
            'DELETE FROM task_tags WHERE task_id = $1 AND tag = $2 RETURNING tag',
            [taskId, tag]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.NOT_FOUND, 'Tag not found on this task')
            );
        }

        res.json({ message: 'Tag removed', tag: result.rows[0].tag });
    } catch (error) {
        console.error('Error removing task tag:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error removing tag')
        );
    }
});

// GET /api/tasks/tags/search - Search tasks by tag
app.get('/api/tasks/tags/search', ensureAuthenticated, async (req, res) => {
    try {
        const { tag } = req.query;

        if (!tag || tag.trim() === '') {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Tag parameter is required')
            );
        }

        const searchTag = tag.trim().toLowerCase();

        // Find tasks with this tag
        const result = await pool.query(
            `SELECT DISTINCT t.* FROM tasks t
             INNER JOIN task_tags tt ON t.id = tt.task_id
             WHERE t.user_id = $1 AND tt.tag = $2
             ORDER BY t.created_at DESC`,
            [req.user.id, searchTag]
        );

        res.json({ tag: searchTag, count: result.rows.length, tasks: result.rows });
    } catch (error) {
        console.error('Error searching by tag:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error searching by tag')
        );
    }
});

// ========== RECURRENCE ENDPOINTS ==========

// GET /api/tasks/:id/recurrence - Get recurrence settings for a task
app.get('/api/tasks/:id/recurrence', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Get recurrence settings
        const result = await pool.query(
            'SELECT * FROM task_recurrence WHERE task_id = $1',
            [taskId]
        );

        res.json(result.rows.length > 0 ? result.rows[0] : null);
    } catch (error) {
        console.error('Error fetching task recurrence:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error fetching recurrence')
        );
    }
});

// POST /api/tasks/:id/recurrence - Set or update recurrence for a task
app.post('/api/tasks/:id/recurrence', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        const { frequency, interval = 1, endDate } = req.body;

        // Validate frequency
        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!frequency || !validFrequencies.includes(frequency)) {
            return res.status(400).json(
                formatErrorResponse(
                    ERROR_CODES.INVALID_INPUT,
                    `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`
                )
            );
        }

        // Validate interval
        if (!Number.isInteger(interval) || interval < 1) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'Interval must be a positive integer')
            );
        }

        // Validate endDate if provided
        if (endDate) {
            const dateValidation = validateISODate(endDate);
            if (dateValidation && !dateValidation.valid) {
                return res.status(400).json(
                    formatErrorResponse(ERROR_CODES.INVALID_DATE_FORMAT, dateValidation.error)
                );
            }
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Check if recurrence already exists
        const existingResult = await pool.query(
            'SELECT id FROM task_recurrence WHERE task_id = $1',
            [taskId]
        );

        let result;
        if (existingResult.rows.length > 0) {
            // Update existing recurrence
            result = await pool.query(
                `UPDATE task_recurrence 
                 SET frequency = $1, interval = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE task_id = $4 
                 RETURNING *`,
                [frequency, interval, endDate || null, taskId]
            );
        } else {
            // Create new recurrence
            result = await pool.query(
                `INSERT INTO task_recurrence (task_id, frequency, interval, end_date)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [taskId, frequency, interval, endDate || null]
            );
        }

        res.status(existingResult.rows.length > 0 ? 200 : 201).json(result.rows[0]);
    } catch (error) {
        console.error('Error setting task recurrence:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error setting recurrence')
        );
    }
});

// DELETE /api/tasks/:id/recurrence - Remove recurrence from a task
app.delete('/api/tasks/:id/recurrence', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Delete recurrence
        const result = await pool.query(
            'DELETE FROM task_recurrence WHERE task_id = $1 RETURNING *',
            [taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.NOT_FOUND, 'Recurrence settings not found')
            );
        }

        res.json({ message: 'Recurrence removed', recurrence: result.rows[0] });
    } catch (error) {
        console.error('Error deleting task recurrence:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error removing recurrence')
        );
    }
});

// ==================== SUBTASKS ENDPOINTS ====================

// GET /api/tasks/:id/subtasks - List all subtasks for a task
app.get('/api/tasks/:id/subtasks', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(
            'SELECT id, title, completed, created_at, updated_at FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
            [taskId]
        );

        res.json({
            task_id: taskId,
            subtasks: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error fetching subtasks')
        );
    }
});

// POST /api/tasks/:id/subtasks - Create a new subtask
app.post('/api/tasks/:id/subtasks', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        const { title } = req.body;
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'Title is required')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(
            'INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *',
            [taskId, title.trim()]
        );

        res.status(201).json({
            message: 'Subtask created',
            subtask: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error creating subtask')
        );
    }
});

// PUT /api/tasks/:id/subtasks/:subtask_id - Update a subtask
app.put('/api/tasks/:id/subtasks/:subtask_id', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const subtaskId = parseInt(req.params.subtask_id, 10);

        if (isNaN(taskId) || isNaN(subtaskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task or subtask ID')
            );
        }

        const { title, completed } = req.body;

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Verify subtask belongs to task
        const subtaskResult = await pool.query(
            'SELECT * FROM subtasks WHERE id = $1 AND task_id = $2',
            [subtaskId, taskId]
        );

        if (subtaskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.NOT_FOUND, 'Subtask not found')
            );
        }

        const updates = [];
        const values = [subtaskId];
        let paramCount = 2;

        if (title !== undefined && typeof title === 'string' && title.trim() !== '') {
            updates.push(`title = $${paramCount}`);
            values.push(title.trim());
            paramCount++;
        }

        if (completed !== undefined && typeof completed === 'boolean') {
            updates.push(`completed = $${paramCount}`);
            values.push(completed);
            paramCount++;
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 1) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'No valid fields to update')
            );
        }

        const result = await pool.query(
            `UPDATE subtasks SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
            values
        );

        res.json({
            message: 'Subtask updated',
            subtask: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error updating subtask')
        );
    }
});

// DELETE /api/tasks/:id/subtasks/:subtask_id - Delete a subtask
app.delete('/api/tasks/:id/subtasks/:subtask_id', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const subtaskId = parseInt(req.params.subtask_id, 10);

        if (isNaN(taskId) || isNaN(subtaskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task or subtask ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(
            'DELETE FROM subtasks WHERE id = $1 AND task_id = $2 RETURNING *',
            [subtaskId, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.NOT_FOUND, 'Subtask not found')
            );
        }

        res.json({
            message: 'Subtask deleted',
            subtask: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error deleting subtask')
        );
    }
});

// ==================== TASK DEPENDENCIES ENDPOINTS ====================

// Helper function to detect circular dependencies
const hasCircularDependency = async (taskId, dependsOnId, pool) => {
    const visited = new Set();
    const queue = [dependsOnId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        if (currentId === taskId) {
            return true;
        }

        const result = await pool.query(
            'SELECT depends_on_id FROM task_dependencies WHERE task_id = $1',
            [currentId]
        );

        for (const row of result.rows) {
            queue.push(row.depends_on_id);
        }
    }

    return false;
};

// GET /api/tasks/:id/dependencies - List all dependencies for a task
app.get('/api/tasks/:id/dependencies', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(`
            SELECT 
                td.id,
                td.task_id,
                td.depends_on_id,
                t.title as depends_on_title,
                t.completed as depends_on_completed,
                t.priority as depends_on_priority,
                td.created_at
            FROM task_dependencies td
            JOIN tasks t ON td.depends_on_id = t.id
            WHERE td.task_id = $1
            ORDER BY td.created_at ASC
        `, [taskId]);

        res.json({
            task_id: taskId,
            dependencies: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching dependencies:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error fetching dependencies')
        );
    }
});

// POST /api/tasks/:id/dependencies - Add a dependency
app.post('/api/tasks/:id/dependencies', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const { depends_on_id } = req.body;
        const dependsOnId = parseInt(depends_on_id, 10);

        if (isNaN(taskId) || isNaN(dependsOnId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        if (taskId === dependsOnId) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_INPUT, 'A task cannot depend on itself')
            );
        }

        // Verify both tasks belong to user
        const tasksResult = await pool.query(
            'SELECT id FROM tasks WHERE id IN ($1, $2) AND user_id = $3',
            [taskId, dependsOnId, req.user.id]
        );

        if (tasksResult.rows.length !== 2) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'One or both tasks not found')
            );
        }

        // Check for circular dependency
        const isCircular = await hasCircularDependency(taskId, dependsOnId, pool);
        if (isCircular) {
            return res.status(409).json(
                formatErrorResponse(ERROR_CODES.CIRCULAR_DEPENDENCY, 'Adding this dependency would create a circular reference')
            );
        }

        // Check if dependency already exists
        const existingResult = await pool.query(
            'SELECT id FROM task_dependencies WHERE task_id = $1 AND depends_on_id = $2',
            [taskId, dependsOnId]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json(
                formatErrorResponse(ERROR_CODES.DUPLICATE_ENTRY, 'This dependency already exists')
            );
        }

        const result = await pool.query(
            'INSERT INTO task_dependencies (task_id, depends_on_id) VALUES ($1, $2) RETURNING *',
            [taskId, dependsOnId]
        );

        res.status(201).json({
            message: 'Dependency added',
            dependency: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json(
                formatErrorResponse(ERROR_CODES.DUPLICATE_ENTRY, 'This dependency already exists')
            );
        }
        console.error('Error adding dependency:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error adding dependency')
        );
    }
});

// DELETE /api/tasks/:id/dependencies/:dep_id - Remove a dependency
app.delete('/api/tasks/:id/dependencies/:dep_id', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const depId = parseInt(req.params.dep_id, 10);

        if (isNaN(taskId) || isNaN(depId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task or dependency ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(
            'DELETE FROM task_dependencies WHERE id = $1 AND task_id = $2 RETURNING *',
            [depId, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.NOT_FOUND, 'Dependency not found')
            );
        }

        res.json({
            message: 'Dependency removed',
            dependency: result.rows[0]
        });
    } catch (error) {
        console.error('Error removing dependency:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error removing dependency')
        );
    }
});

// ==================== ATTACHMENTS ENDPOINTS ====================

// GET /api/tasks/:id/attachments - List all attachments for a task
app.get('/api/tasks/:id/attachments', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        const result = await pool.query(`
            SELECT 
                id,
                task_id,
                filename,
                original_filename,
                file_size,
                mime_type,
                uploaded_by,
                created_at
            FROM attachments
            WHERE task_id = $1
            ORDER BY created_at DESC
        `, [taskId]);

        res.json({
            task_id: taskId,
            attachments: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error fetching attachments')
        );
    }
});

// POST /api/tasks/:id/attachments - Upload an attachment
app.post('/api/tasks/:id/attachments', ensureAuthenticated, upload.single('file'), async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (isNaN(taskId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task ID')
            );
        }

        if (!req.file) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.MISSING_FIELD, 'No file provided')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            // Clean up uploaded file
            await deleteFile(req.file.filename);
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Validate file size again (defense in depth)
        if (req.file.size > MAX_FILE_SIZE) {
            await deleteFile(req.file.filename);
            return res.status(413).json(
                formatErrorResponse(ERROR_CODES.FILE_TOO_LARGE, `File size exceeds maximum of 10MB`)
            );
        }

        // Sanitize the original filename for storage
        let secureFilename;
        try {
            secureFilename = sanitizeFilename(req.file.originalname);
        } catch (error) {
            await deleteFile(req.file.filename);
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_FILE_TYPE, error.message)
            );
        }

        // Rename the uploaded file to secure name
        const fs = require('fs').promises;
        const oldPath = path.join(UPLOADS_DIR, req.file.filename);
        const newPath = path.join(UPLOADS_DIR, secureFilename);

        try {
            await fs.rename(oldPath, newPath);
        } catch (error) {
            console.error('Error renaming file:', error);
            return res.status(500).json(
                formatErrorResponse(ERROR_CODES.UPLOAD_FAILED, 'Failed to save file')
            );
        }

        // Store attachment metadata in database
        const result = await pool.query(`
            INSERT INTO attachments 
            (task_id, filename, original_filename, file_path, file_size, mime_type, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, task_id, filename, original_filename, file_size, mime_type, created_at
        `, [
            taskId,
            secureFilename,
            req.file.originalname,
            secureFilename, // file_path is the relative path
            req.file.size,
            req.file.mimetype,
            req.user.id,
        ]);

        res.status(201).json({
            message: 'File uploaded successfully',
            attachment: result.rows[0]
        });
    } catch (error) {
        // Clean up uploaded file if there was an error
        if (req.file) {
            await deleteFile(req.file.filename).catch(err => console.error('Cleanup error:', err));
        }
        console.error('Error uploading file:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.UPLOAD_FAILED, 'Error uploading file')
        );
    }
});

// GET /api/tasks/:id/attachments/:attachment_id/download - Download an attachment
app.get('/api/tasks/:id/attachments/:attachment_id/download', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const attachmentId = parseInt(req.params.attachment_id, 10);

        if (isNaN(taskId) || isNaN(attachmentId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task or attachment ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Get attachment
        const attachmentResult = await pool.query(
            'SELECT filename, original_filename, mime_type FROM attachments WHERE id = $1 AND task_id = $2',
            [attachmentId, taskId]
        );

        if (attachmentResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.ATTACHMENT_NOT_FOUND, 'Attachment not found')
            );
        }

        const attachment = attachmentResult.rows[0];

        try {
            const filePath = getFilePath(attachment.filename);
            
            // Set download headers
            res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
            res.setHeader('Content-Type', attachment.mime_type);

            // Send file
            res.download(filePath, attachment.original_filename, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    if (!res.headersSent) {
                        res.status(500).json(
                            formatErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Error downloading file')
                        );
                    }
                }
            });
        } catch (error) {
            console.error('Error accessing file:', error);
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.FILE_NOT_FOUND, 'File not accessible')
            );
        }
    } catch (error) {
        console.error('Error downloading attachment:', error);
        if (!res.headersSent) {
            res.status(500).json(
                formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error downloading attachment')
            );
        }
    }
});

// DELETE /api/tasks/:id/attachments/:attachment_id - Delete an attachment
app.delete('/api/tasks/:id/attachments/:attachment_id', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const attachmentId = parseInt(req.params.attachment_id, 10);

        if (isNaN(taskId) || isNaN(attachmentId)) {
            return res.status(400).json(
                formatErrorResponse(ERROR_CODES.INVALID_ID, 'Invalid task or attachment ID')
            );
        }

        // Verify task belongs to user
        const taskResult = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, req.user.id]
        );

        if (taskResult.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.TASK_NOT_FOUND, 'Task not found')
            );
        }

        // Get and delete attachment
        const result = await pool.query(
            'DELETE FROM attachments WHERE id = $1 AND task_id = $2 RETURNING filename',
            [attachmentId, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorResponse(ERROR_CODES.ATTACHMENT_NOT_FOUND, 'Attachment not found')
            );
        }

        // Delete file from disk
        try {
            await deleteFile(result.rows[0].filename);
        } catch (error) {
            console.error('Warning: Failed to delete file from disk:', error);
            // Don't fail the response if file deletion fails
        }

        res.json({
            message: 'Attachment deleted successfully',
            attachment_id: attachmentId
        });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json(
            formatErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Error deleting attachment')
        );
    }
});

// Handle undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

module.exports = app;
