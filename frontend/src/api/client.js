// API client - centralized fetch operations with error handling
const API_URL = import.meta.env.VITE_API_URL || 'https://taskmaster-a-simple-task-management-app.onrender.com';

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', // Send cookies with requests
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Handle empty responses (like DELETE)
            if (response.status === 204 || !response.headers.get('content-length')) {
                return null;
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Auth endpoints
    async checkAuth() {
        return this.request('/auth/user');
    }

    async logout() {
        return this.request('/auth/logout');
    }

    // Task endpoints
    async getTasks() {
        return this.request('/api/tasks');
    }

    async createTask(taskData) {
        return this.request('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
    }

    async updateTask(taskId, updates) {
        return this.request(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteTask(taskId) {
        return this.request(`/api/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }
}

export default new APIClient(API_URL);
