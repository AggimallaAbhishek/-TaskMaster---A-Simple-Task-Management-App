import { useState, useCallback, useEffect } from 'react';
import {
    getTasks,
    getPendingSyncItems,
    updateSyncItemStatus,
    clearSyncItem,
    storeUserData,
} from '../utils/indexedDB';
import { useOffline } from './useOffline';

/**
 * Hook to manage offline sync operations
 * Handles syncing pending changes when going back online
 */
export const useOfflineSync = (userId) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [syncedCount, setSyncedCount] = useState(0);
    const isOffline = useOffline();

    const syncPendingChanges = useCallback(async () => {
        if (isOffline || !userId) return;

        setIsSyncing(true);
        setSyncError(null);
        let successCount = 0;

        try {
            const pendingItems = await getPendingSyncItems();
            
            if (pendingItems.length === 0) {
                console.log('✓ No pending changes to sync');
                setIsSyncing(false);
                return;
            }

            console.log(`⏳ Syncing ${pendingItems.length} pending changes...`);

            for (const item of pendingItems) {
                try {
                    await updateSyncItemStatus(item.id, 'syncing');

                    // Retry logic with exponential backoff
                    let retries = 3;
                    let success = false;

                    while (retries > 0 && !success) {
                        try {
                            const response = await fetch('/api/sync', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    type: item.type,
                                    taskId: item.taskId,
                                    data: item.data,
                                }),
                            });

                            if (response.ok) {
                                await clearSyncItem(item.id);
                                successCount++;
                                success = true;
                            } else if (response.status === 409 || response.status === 400) {
                                // Conflict or validation error - don't retry
                                await updateSyncItemStatus(item.id, 'failed');
                                success = true;
                            } else {
                                retries--;
                                if (retries > 0) {
                                    // Exponential backoff
                                    await new Promise(resolve => 
                                        setTimeout(resolve, Math.pow(2, 3 - retries) * 1000)
                                    );
                                }
                            }
                        } catch (error) {
                            retries--;
                            if (retries > 0) {
                                await new Promise(resolve => 
                                    setTimeout(resolve, Math.pow(2, 3 - retries) * 1000)
                                );
                            }
                        }
                    }

                    if (!success) {
                        await updateSyncItemStatus(item.id, 'failed');
                    }
                } catch (error) {
                    console.error('Error syncing item:', error);
                    await updateSyncItemStatus(item.id, 'failed');
                }
            }

            setSyncedCount(successCount);
            console.log(`✓ Synced ${successCount}/${pendingItems.length} changes`);
        } catch (error) {
            console.error('Error during sync:', error);
            setSyncError(error.message);
        } finally {
            setIsSyncing(false);
        }
    }, [isOffline, userId]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (!isOffline && userId) {
            // Wait a moment to ensure network is stable
            const timer = setTimeout(() => {
                syncPendingChanges();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOffline, userId, syncPendingChanges]);

    return {
        isSyncing,
        syncError,
        syncedCount,
        syncPendingChanges,
        pendingChangesCount: 0, // Will be updated by consuming component
    };
};
