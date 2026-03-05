const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock database
let tasks = [
    { id: 1, title: 'Learn CI/CD', completed: false },
    { id: 2, title: 'Build automation', completed: true }
];

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'TaskMaster Backend',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    const newTask = {
        id: tasks.length + 1,
        title: req.body.title,
        completed: false
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TaskMaster API is running!',
        endpoints: {
            health: '/api/health',
            tasks: '/api/tasks',
            rootHealth: '/health'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
