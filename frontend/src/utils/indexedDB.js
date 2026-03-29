/**
 * IndexedDB helper for offline data storage
 * Provides methods to store and retrieve tasks, user data, and sync queue
 */

const DB_NAME = 'taskmaster_db';
const DB_VERSION = 1;

// Store names
const STORES = {
    TASKS: 'tasks',
    SYNC_QUEUE: 'sync_queue',
    USER: 'user_data',
};

let db = null;

/**
 * Open or create IndexedDB database
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✓ IndexedDB opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create tasks store
            if (!database.objectStoreNames.contains(STORES.TASKS)) {
                const tasksStore = database.createObjectStore(STORES.TASKS, { keyPath: 'id' });
                tasksStore.createIndex('userId', 'userId', { unique: false });
                tasksStore.createIndex('completed', 'completed', { unique: false });
                tasksStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                console.log('✓ Created tasks store');
            }

            // Create sync queue store
            if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('status', 'status', { unique: false });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
                console.log('✓ Created sync queue store');
            }

            // Create user data store
            if (!database.objectStoreNames.contains(STORES.USER)) {
                database.createObjectStore(STORES.USER, { keyPath: 'id' });
                console.log('✓ Created user store');
            }
        };
    });
};

/**
 * Store tasks in IndexedDB
 */
export const storeTasks = async (tasks) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readwrite');
        const store = transaction.objectStore(STORES.TASKS);

        // Clear existing tasks
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
            // Add all tasks
            tasks.forEach((task) => {
                store.add({
                    ...task,
                    syncStatus: 'synced',
                    lastSyncTime: new Date().toISOString(),
                });
            });
        };

        transaction.oncomplete = () => {
            console.log(`✓ Stored ${tasks.length} tasks in IndexedDB`);
            resolve();
        };

        transaction.onerror = () => {
            console.error('Error storing tasks:', transaction.error);
            reject(transaction.error);
        };
    });
};

/**
 * Get all tasks from IndexedDB
 */
export const getTasks = async (userId = null) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readonly');
        const store = transaction.objectStore(STORES.TASKS);
        let request;

        if (userId) {
            const index = store.index('userId');
            request = index.getAll(userId);
        } else {
            request = store.getAll();
        }

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            console.error('Error retrieving tasks:', request.error);
            reject(request.error);
        };
    });
};

/**
 * Get a specific task by ID
 */
export const getTask = async (taskId) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readonly');
        const store = transaction.objectStore(STORES.TASKS);
        const request = store.get(taskId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Error retrieving task:', request.error);
            reject(request.error);
        };
    });
};

/**
 * Update a task in IndexedDB
 */
export const updateTaskOffline = async (taskId, updates) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readwrite');
        const store = transaction.objectStore(STORES.TASKS);
        const getRequest = store.get(taskId);

        getRequest.onsuccess = () => {
            const task = getRequest.result;
            if (!task) {
                reject(new Error('Task not found'));
                return;
            }

            const updatedTask = {
                ...task,
                ...updates,
                syncStatus: 'pending',
                lastModifiedOffline: new Date().toISOString(),
            };

            const putRequest = store.put(updatedTask);
            putRequest.onsuccess = () => resolve(updatedTask);
            putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Add a task to IndexedDB (offline creation)
 */
export const addTaskOffline = async (task, userId) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readwrite');
        const store = transaction.objectStore(STORES.TASKS);

        const offlineTask = {
            ...task,
            userId,
            syncStatus: 'pending',
            createdOffline: true,
            createdAt: new Date().toISOString(),
        };

        const request = store.add(offlineTask);

        request.onsuccess = () => {
            resolve({
                ...offlineTask,
                id: request.result,
            });
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete a task from IndexedDB (offline deletion)
 */
export const deleteTaskOffline = async (taskId) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS], 'readwrite');
        const store = transaction.objectStore(STORES.TASKS);

        // Mark as pending deletion instead of immediate delete
        const getRequest = store.get(taskId);

        getRequest.onsuccess = () => {
            const task = getRequest.result;
            if (task) {
                const updatedTask = {
                    ...task,
                    syncStatus: 'pendingDelete',
                    lastModifiedOffline: new Date().toISOString(),
                };
                const putRequest = store.put(updatedTask);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                resolve();
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Add to sync queue
 */
export const addToSyncQueue = async (type, taskId, data) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);

        const queueItem = {
            type, // 'create', 'update', 'delete'
            taskId,
            data,
            status: 'pending', // 'pending', 'syncing', 'synced', 'failed'
            timestamp: new Date().toISOString(),
            retryCount: 0,
        };

        const request = store.add(queueItem);

        request.onsuccess = () => {
            resolve({
                ...queueItem,
                id: request.result,
            });
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Get pending sync items
 */
export const getPendingSyncItems = async () => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const index = store.index('status');
        const request = index.getAll('pending');

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Update sync item status
 */
export const updateSyncItemStatus = async (itemId, status) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const getRequest = store.get(itemId);

        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.status = status;
                if (status === 'failed') {
                    item.retryCount = (item.retryCount || 0) + 1;
                }
                const putRequest = store.put(item);
                putRequest.onsuccess = () => resolve(item);
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error('Sync item not found'));
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Clear sync item
 */
export const clearSyncItem = async (itemId) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const request = store.delete(itemId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Store user data
 */
export const storeUserData = async (userData) => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.USER], 'readwrite');
        const store = transaction.objectStore(STORES.USER);

        const request = store.put({
            ...userData,
            id: 'current_user',
            lastSyncTime: new Date().toISOString(),
        });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get user data
 */
export const getUserData = async () => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.USER], 'readonly');
        const store = transaction.objectStore(STORES.USER);
        const request = store.get('current_user');

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Clear all data (logout)
 */
export const clearAllData = async () => {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.TASKS, STORES.SYNC_QUEUE, STORES.USER], 'readwrite');

        transaction.objectStore(STORES.TASKS).clear();
        transaction.objectStore(STORES.SYNC_QUEUE).clear();
        transaction.objectStore(STORES.USER).clear();

        transaction.oncomplete = () => {
            console.log('✓ Cleared all IndexedDB data');
            resolve();
        };

        transaction.onerror = () => {
            console.error('Error clearing data:', transaction.error);
            reject(transaction.error);
        };
    });
};

/**
 * Get IndexedDB stats for debugging
 */
export const getDBStats = async () => {
    const tasks = await getTasks();
    const pendingSync = await getPendingSyncItems();
    const userData = await getUserData();

    return {
        tasksCount: tasks.length,
        pendingSyncCount: pendingSync.length,
        hasUserData: !!userData,
        totalSize: tasks.length + pendingSync.length,
    };
};
