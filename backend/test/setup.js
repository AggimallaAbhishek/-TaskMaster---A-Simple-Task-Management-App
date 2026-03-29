const { Pool } = require('pg');

let testPool;

// Initialize database before running tests
beforeAll(async () => {
    testPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'aggimallaabhishek',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'taskmaster'
    });

    try {
        // Drop tables in reverse order of dependencies (CASCADE to handle foreign keys)
        await testPool.query('DROP TABLE IF EXISTS task_recurrence CASCADE');
        await testPool.query('DROP TABLE IF EXISTS task_tags CASCADE');
        await testPool.query('DROP TABLE IF EXISTS subtasks CASCADE');
        await testPool.query('DROP TABLE IF EXISTS task_dependencies CASCADE');
        await testPool.query('DROP TABLE IF EXISTS attachments CASCADE');
        await testPool.query('DROP TABLE IF EXISTS filter_presets CASCADE');
        await testPool.query('DROP TABLE IF EXISTS tasks CASCADE');
        await testPool.query('DROP TABLE IF EXISTS users CASCADE');

        // Create users table
        await testPool.query(`
            CREATE TABLE users (
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

        // Create tasks table
        await testPool.query(`
            CREATE TABLE tasks (
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

        // Create task_recurrence table
        await testPool.query(`
            CREATE TABLE task_recurrence (
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

        // Create task_tags table
        await testPool.query(`
            CREATE TABLE task_tags (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                tag VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, tag)
            )
        `);

        // Create subtasks table
        await testPool.query(`
            CREATE TABLE subtasks (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create task_dependencies table
        await testPool.query(`
            CREATE TABLE task_dependencies (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, depends_on_id),
                CHECK (task_id != depends_on_id)
            )
        `);

        // Create filter_presets table
        await testPool.query(`
            CREATE TABLE filter_presets (
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

        // Create attachments table
        await testPool.query(`
            CREATE TABLE attachments (
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

        // Insert test user
        await testPool.query(
            'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
            ['testuser', 'test@example.com', 'test-google-id']
        );

        console.log('✓ Test database initialized');
    } catch (error) {
        console.error('✗ Failed to initialize test database:', error);
        throw error;
    }
});

// Clean up after tests
afterAll(async () => {
    if (testPool) {
        await testPool.end();
    }
});

