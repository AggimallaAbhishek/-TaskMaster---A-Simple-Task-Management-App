const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory database
let tasks = [
    { id: 1, title: 'Learn CI/CD pipeline', completed: false },
    { id: 2, title: 'Deploy to production', completed: true }
];

// ========== ROUTES ==========

// Health check for Render (CRITICAL - Render monitors this)
app.get('/health', (req, res) => {
    console.log('Health check called');
    res.status(200).json({
        status: 'OK',
        service: 'TaskMaster Backend',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
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
    console.log('GET /api/tasks called');
    res.json(tasks);
});

// Create new task
app.post('/api/tasks', (req, res) => {
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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '✅ TaskMaster API is running!',
        endpoints: {
            health: '/health',
            apiHealth: '/api/health',
            tasks: '/api/tasks',
            createTask: 'POST /api/tasks'
        },
        instructions: 'Use /health for Render health checks'
    });
});

// Handle 404 - Route not found
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        availableEndpoints: ['/', '/health', '/api/health', '/api/tasks']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log('🚀 TaskMaster Backend Server Started');
    console.log('====================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log('====================================');
});

module.exports = app;
