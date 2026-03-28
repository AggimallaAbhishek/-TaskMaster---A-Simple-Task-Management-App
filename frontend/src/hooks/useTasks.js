import { useState, useCallback } from 'react';
import apiClient from '../api/client';

/**
 * Custom hook for managing tasks
 * Handles CRUD operations for tasks with loading and error states
 */
export function useTasks(tasks, setTasks, user) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTasks = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError('');
            const taskData = await apiClient.getTasks();
            setTasks(taskData);
        } catch (err) {
            setError(`Cannot fetch tasks: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user, setTasks]);

    const addTask = useCallback(
        async (taskData) => {
            if (!taskData.title || !taskData.title.trim()) {
                setError('Please enter a task title');
                return;
            }

            try {
                setError('');
                setLoading(true);
                const newTask = await apiClient.createTask(taskData);

                setTasks((prevTasks) => [...prevTasks, newTask]);
                return newTask;
            } catch (err) {
                setError(`Error adding task: ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        [setTasks]
    );

    const updateTask = useCallback(
        async (taskId, updates) => {
            try {
                setLoading(true);
                setError('');
                const updatedTask = await apiClient.updateTask(taskId, updates);

                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.id === taskId ? updatedTask : task
                    )
                );

                return updatedTask;
            } catch (err) {
                setError(`Error updating task: ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        [setTasks]
    );

    const deleteTask = useCallback(
        async (taskId) => {
            try {
                setLoading(true);
                setError('');
                await apiClient.deleteTask(taskId);

                setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
            } catch (err) {
                setError(`Error deleting task: ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        [setTasks]
    );

    return {
        loading,
        error,
        setError,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
    };
}
