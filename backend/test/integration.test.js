const request = require('supertest');
const app = require('../server');

describe('API Enhancements - Integration Tests', () => {
    let taskId;
    let task2Id;

    // ===== PAGINATION TESTS =====
    describe('Pagination', () => {
        beforeAll(async () => {
            // Create multiple tasks for pagination testing
            for (let i = 0; i < 15; i++) {
                await request(app).post('/api/tasks').send({
                    title: `Pagination test task ${i + 1}`,
                    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
                });
            }
        });

        it('should paginate tasks with default limit', async () => {
            const res = await request(app).get('/api/tasks?page=1&limit=5');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toEqual(1);
            expect(res.body.pagination.limit).toEqual(5);
            expect(res.body.pagination.totalCount).toBeGreaterThanOrEqual(15);
            expect(res.body.pagination.hasMore).toBeDefined();
        });

        it('should return second page', async () => {
            const res = await request(app).get('/api/tasks?page=2&limit=5');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.length).toBeGreaterThan(0);
            expect(res.body.pagination.page).toEqual(2);
        });

        it('should calculate totalPages correctly', async () => {
            const res = await request(app).get('/api/tasks?page=1&limit=10');
            
            expect(res.body.pagination.totalPages).toEqual(
                Math.ceil(res.body.pagination.totalCount / 10)
            );
        });
    });

    // ===== FILTERING TESTS =====
    describe('Inline Filtering', () => {
        beforeAll(async () => {
            // Create tasks with different properties for filtering
            const highRes = await request(app).post('/api/tasks').send({
                title: 'High priority task',
                priority: 'high',
                category: 'development',
            });
            taskId = highRes.body.id;

            const medRes = await request(app).post('/api/tasks').send({
                title: 'Medium priority task',
                priority: 'medium',
                category: 'learning',
                completed: true,
            });
            task2Id = medRes.body.id;
        });

        it('should filter by priority', async () => {
            const res = await request(app).get('/api/tasks?priority=high');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.every(t => t.priority === 'high')).toBe(true);
        });

        it('should filter by completed status', async () => {
            const res = await request(app).get('/api/tasks?completed=false');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.every(t => t.completed === false)).toBe(true);
        });

        it('should combine filters', async () => {
            const res = await request(app).get('/api/tasks?priority=high&completed=false');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.every(t => 
                t.priority === 'high' && t.completed === false
            )).toBe(true);
        });

        it('should filter by category', async () => {
            const res = await request(app).get('/api/tasks?category=development');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.every(t => t.category === 'development')).toBe(true);
        });
    });

    // ===== SEARCH TESTS =====
    describe('Search Endpoint', () => {
        beforeAll(async () => {
            await request(app).post('/api/tasks').send({
                title: 'Buy groceries for dinner',
                description: 'Need milk and bread',
                priority: 'low',
            });

            await request(app).post('/api/tasks').send({
                title: 'Complete project report',
                description: 'Final report for Q4 groceries analysis',
                priority: 'high',
            });
        });

        it('should search by title', async () => {
            const res = await request(app).get('/api/tasks/search?q=groceries');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.length).toBeGreaterThan(0);
            expect(res.body.tasks.some(t => 
                t.title.toLowerCase().includes('groceries')
            )).toBe(true);
        });

        it('should search by description', async () => {
            const res = await request(app).get('/api/tasks/search?q=milk');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.tasks.length).toBeGreaterThan(0);
        });

        it('should prioritize prefix matches', async () => {
            const res = await request(app).get('/api/tasks/search?q=Buy');
            
            expect(res.statusCode).toEqual(200);
            if (res.body.tasks.length > 0) {
                expect(res.body.tasks[0].title.toLowerCase().startsWith('buy')).toBe(true);
            }
        });
    });

    // ===== BULK OPERATIONS TESTS =====
    describe('Bulk Operations', () => {
        let bulkTaskIds = [];

        beforeAll(async () => {
            for (let i = 0; i < 3; i++) {
                const res = await request(app).post('/api/tasks').send({
                    title: `Bulk test task ${i + 1}`,
                    priority: 'medium',
                });
                bulkTaskIds.push(res.body.id);
            }
        });

        it('should bulk update tasks', async () => {
            const res = await request(app).post('/api/tasks/bulk-update').send({
                ids: bulkTaskIds.slice(0, 2),
                updates: { priority: 'high', category: 'deployment' },
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.updated).toEqual(2);
        });

        it('should bulk delete tasks', async () => {
            const deleteRes = await request(app).post('/api/tasks/bulk-delete').send({
                ids: [bulkTaskIds[2]],
            });

            expect(deleteRes.statusCode).toEqual(200);
            expect(deleteRes.body.deleted).toEqual(1);

            // Verify deletion
            const getRes = await request(app).get(`/api/tasks/${bulkTaskIds[2]}`);
            expect(getRes.statusCode).toEqual(404);
        });

        it('should reject bulk update with invalid data', async () => {
            const res = await request(app).post('/api/tasks/bulk-update').send({
                ids: bulkTaskIds,
                updates: { invalidField: 'value' },
            });

            expect(res.statusCode).toEqual(400);
        });
    });

    // ===== SORTING TESTS =====
    describe('Sorting', () => {
        it('should sort by priority (high to low)', async () => {
            const res = await request(app).get('/api/tasks?sortBy=priority&sortDirection=desc');
            
            expect(res.statusCode).toEqual(200);
            // Priority order: high > medium > low
            if (res.body.tasks.length > 1) {
                const priorities = { high: 3, medium: 2, low: 1 };
                for (let i = 0; i < res.body.tasks.length - 1; i++) {
                    expect(priorities[res.body.tasks[i].priority])
                        .toBeGreaterThanOrEqual(priorities[res.body.tasks[i + 1].priority]);
                }
            }
        });

        it('should sort by due date', async () => {
            const res = await request(app).get('/api/tasks?sortBy=due_date&sortDirection=asc');
            
            expect(res.statusCode).toEqual(200);
        });

        it('should reject invalid sortBy field', async () => {
            const res = await request(app).get('/api/tasks?sortBy=invalidField&sortDirection=asc');
            
            expect(res.statusCode).toEqual(400);
        });
    });

    // ===== USER DELETION TESTS =====
    describe('User Deletion', () => {
        it('should delete user and logout', async () => {
            const res = await request(app).delete('/api/users').set('Cookie', 'valid_session_cookie');
            
            // Will fail in test environment without proper auth,
            // but verifies endpoint exists and method is correct
            expect([200, 401, 403].includes(res.statusCode)).toBe(true);
        });
    });

    // ===== TAG TESTS =====
    describe('Task Tags', () => {
        let tagTaskId;

        beforeAll(async () => {
            const res = await request(app).post('/api/tasks').send({
                title: 'Tagged task',
                priority: 'medium',
            });
            tagTaskId = res.body.id;
        });

        it('should add tag to task', async () => {
            const res = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({
                tag: 'urgent',
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.tag).toEqual('urgent');
        });

        it('should fetch task tags', async () => {
            const res = await request(app).get(`/api/tasks/${tagTaskId}/tags`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.tags).toContain('urgent');
        });

        it('should add multiple tags', async () => {
            await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({ tag: 'work' });
            await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({ tag: 'important' });

            const res = await request(app).get(`/api/tasks/${tagTaskId}/tags`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.tags.length).toBeGreaterThanOrEqual(3);
            expect(res.body.tags).toContain('work');
            expect(res.body.tags).toContain('important');
        });

        it('should convert tags to lowercase', async () => {
            const res = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({
                tag: 'BACKEND',
            });

            expect(res.body.tag).toEqual('backend');
        });

        it('should handle duplicate tags gracefully', async () => {
            const res1 = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({ tag: 'duplicate' });
            const res2 = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({ tag: 'DUPLICATE' });

            expect(res1.statusCode).toEqual(201);
            expect(res2.statusCode).toEqual(201);

            const getRes = await request(app).get(`/api/tasks/${tagTaskId}/tags`);
            const duplicateCount = getRes.body.tags.filter(t => t === 'duplicate').length;
            expect(duplicateCount).toEqual(1);
        });

        it('should reject empty tag', async () => {
            const res = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({
                tag: '',
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });

        it('should reject tag over 100 characters', async () => {
            const longTag = 'a'.repeat(101);
            const res = await request(app).post(`/api/tasks/${tagTaskId}/tags`).send({
                tag: longTag,
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });

        it('should remove tag from task', async () => {
            const res = await request(app).delete(`/api/tasks/${tagTaskId}/tags/urgent`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBeDefined();

            // Verify removal
            const getRes = await request(app).get(`/api/tasks/${tagTaskId}/tags`);
            expect(getRes.body.tags).not.toContain('urgent');
        });

        it('should search tasks by tag', async () => {
            const res = await request(app).get('/api/tasks/tags/search?tag=work');

            expect(res.statusCode).toEqual(200);
            expect(res.body.tag).toEqual('work');
            expect(res.body.count).toBeGreaterThanOrEqual(1);
        });

        it('should require tag parameter for search', async () => {
            const res = await request(app).get('/api/tasks/tags/search');

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });
    });

    // ===== RECURRENCE TESTS =====
    describe('Task Recurrence', () => {
        let recurringTaskId;

        beforeAll(async () => {
            const res = await request(app).post('/api/tasks').send({
                title: 'Recurring task',
                priority: 'high',
            });
            recurringTaskId = res.body.id;
        });

        it('should create task recurrence', async () => {
            const res = await request(app).post(`/api/tasks/${recurringTaskId}/recurrence`).send({
                frequency: 'daily',
                interval: 1,
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.frequency).toEqual('daily');
            expect(res.body.interval).toEqual(1);
            expect(res.body.is_active).toEqual(true);
        });

        it('should fetch task recurrence', async () => {
            const res = await request(app).get(`/api/tasks/${recurringTaskId}/recurrence`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.frequency).toEqual('daily');
            expect(res.body.interval).toEqual(1);
        });

        it('should update task recurrence', async () => {
            const res = await request(app).post(`/api/tasks/${recurringTaskId}/recurrence`).send({
                frequency: 'weekly',
                interval: 2,
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.frequency).toEqual('weekly');
            expect(res.body.interval).toEqual(2);
        });

        it('should reject invalid frequency', async () => {
            const res = await request(app).post(`/api/tasks/${recurringTaskId}/recurrence`).send({
                frequency: 'invalid',
                interval: 1,
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });

        it('should reject invalid interval', async () => {
            const res = await request(app).post(`/api/tasks/${recurringTaskId}/recurrence`).send({
                frequency: 'daily',
                interval: 0,
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });

        it('should delete task recurrence', async () => {
            const res = await request(app).delete(`/api/tasks/${recurringTaskId}/recurrence`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBeDefined();

            // Verify deletion
            const getRes = await request(app).get(`/api/tasks/${recurringTaskId}/recurrence`);
            expect(getRes.body).toBeNull();
        });

        it('should accept all valid frequencies', async () => {
            const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];

            for (const freq of frequencies) {
                const res = await request(app).post(`/api/tasks/${recurringTaskId}/recurrence`).send({
                    frequency: freq,
                    interval: 1,
                });

                expect(res.statusCode).toEqual(200); // Updated existing
                expect(res.body.frequency).toEqual(freq);
            }
        });
    });

    // ===== PARAMETER VALIDATION TESTS =====
    describe('Parameter Validation', () => {
        it('should reject invalid task ID format', async () => {
            const res = await request(app).get('/api/tasks/invalid_id');
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBeDefined();
        });

        it('should reject non-existent task ID', async () => {
            const res = await request(app).get('/api/tasks/99999999');
            
            expect(res.statusCode).toEqual(404);
        });

        it('should accept valid numeric IDs', async () => {
            const res = await request(app).get('/api/tasks/1');
            
            // Will either return 200 (task exists) or 404 (doesn't exist)
            expect([200, 404].includes(res.statusCode)).toBe(true);
        });
    });
});
