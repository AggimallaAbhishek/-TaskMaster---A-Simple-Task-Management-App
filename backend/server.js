const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS for frontend communication
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Simple in-memory database
let tasks = [
    { id: 1, title: 'Learn CI/CD pipeline', completed: false },
    { id: 2, title: 'Deploy to production', completed: true }
];

// ========== ROUTES ==========

// Root endpoint - TEST THIS FIRST
app.get('/', (req, res) => {
    console.log('GET / received');
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
    console.log('GET /health received');
    res.json({
        status: 'OK',
        service: 'TaskMaster Backend',
        timestamp: new Date().toISOString()
    });
});

// API Health endpoint
app.get('/api/health', (req, res) => {
    console.log('GET /api/health received');
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    console.log('GET /api/tasks received');
    res.json(tasks);
});

// Create new task
app.post('/api/tasks', (req, res) => {
    console.log('POST /api/tasks received', req.body);
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

// Catch-all for undefined routes
app.use('*', (req, res) => {
    console.log('404 for route:', req.originalUrl);
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/health',
            'GET /api/tasks',
            'POST /api/tasks'
        ]
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log('🚀 TaskMaster Server STARTED SUCCESSFULLY');
    console.log('====================================');
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Endpoints:');
    console.log('  GET / - Root endpoint');
    console.log('  GET /health - Health check');
    console.log('  GET /api/health - API health');
    console.log('  GET /api/tasks - Get tasks');
    console.log('  POST /api/tasks - Create task');
    console.log('====================================');
});

module.exports = app;
