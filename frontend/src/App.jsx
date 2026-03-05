import React, { useState, useEffect } from 'react';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_URL}/api/tasks`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to load tasks. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (newTask.trim()) {
            try {
                setError('');
                const response = await fetch(`${API_URL}/api/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTask })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const task = await response.json();
                setTasks([...tasks, task]);
                setNewTask('');
            } catch (error) {
                console.error('Error adding task:', error);
                setError('Failed to add task. Please try again.');
            }
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h1>TaskMaster 🚀</h1>
            <p>Backend API: {API_URL}</p>

            {error && (
                <div style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter a new task"
                    style={{
                        marginRight: '10px',
                        padding: '8px',
                        width: '300px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button
                    onClick={addTask}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#007acc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Add Task
                </button>
            </div>

            <div>
                <h2>Tasks ({tasks.length})</h2>
                {loading ? (
                    <p>Loading tasks...</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {tasks.map(task => (
                            <li key={task.id} style={{
                                padding: '10px',
                                margin: '5px 0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                textDecoration: task.completed ? 'line-through' : 'none'
                            }}>
                                {task.title}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default App;
