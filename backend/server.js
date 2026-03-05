const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS middleware - FIXED FOR PREFLIGHT
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://task-master-a-simple-task-management-7v04ickra.vercel.app',
        'https://task-master-a-simple-task-managemen.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    const origin = req.headers.origin;

    // Allow the requesting origin if it's in the list, otherwise allow all (for testing)
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // For development/testing, you might want to be more restrictive
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // INTERCEPT OPTIONS METHOD - THIS IS THE KEY FIX
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS preflight received');
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
        return res.status(200).end();
    }

    next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory database
let tasks = [
    { id: 1, title: 'Learn CI/CD pipeline', completed: false },
    { id: 2, title: 'Deploy to production', completed: true }
];

// ========== ROUTES ==========

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '✅ TaskMaster API Root is working!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /health',
            'GET /api/health',
            'GET /api/tasks',
            'POST /api/tasks'
        ]
    });
});

// Health endpoint for Render
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'TaskMaster Backend',
        timestamp: new Date().toISOString()
    });
});

// API Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    console.log('GET /api/tasks - Headers:', req.headers);
    res.json(tasks);
});

// Create new task
app.post('/api/tasks', (req, res) => {
    console.log('POST /api/tasks - Body:', req.body);
    const { title } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = {
        id: tasks.length + 1,
        title: title.trim(),
        completed: false,
        createdAt: new Date()
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Handle undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 TaskMaster Server with CORS Fix');
    console.log('====================================');
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('CORS enabled for frontend origins');
    console.log('====================================');
});

module.exports = app;
