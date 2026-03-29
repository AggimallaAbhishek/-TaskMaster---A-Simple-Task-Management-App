import React from 'react';
import { useOffline } from '../hooks/useOffline';

/**
 * Offline indicator component
 * Shows when the app is in offline mode
 */
const OfflineIndicator = () => {
    const isOffline = useOffline();

    if (!isOffline) {
        return null;
    }

    return (
        <div className="offline-indicator">
            <div className="offline-banner">
                <span className="offline-icon">📡</span>
                <span className="offline-text">You are currently offline - working with cached data</span>
            </div>
        </div>
    );
};

export default OfflineIndicator;
