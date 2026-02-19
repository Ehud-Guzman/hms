import { useEffect, useState } from 'react';
import offlineService from '../services/offlineService';

export default function SyncIndicator() {
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(null);

  const updatePendingCount = async () => {
    const count = await offlineService.getPendingCount();
    setPending(count);
  };

  const performSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    try {
      await offlineService.syncPending();
      await updatePendingCount();
    } catch (err) {
      setError('Sync failed');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    updatePendingCount();

    // Auto-sync when coming online
    const handleOnline = () => {
      performSync();
    };

    // Listen for sync completion events
    const handleSyncCompleted = () => {
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('syncCompleted', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('syncCompleted', handleSyncCompleted);
    };
  }, []);

  if (pending === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: error ? '#ef4444' : '#fbbf24',
        color: error ? '#fff' : '#000',
        padding: '8px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        zIndex: 1000,
      }}
      onClick={performSync}
    >
      {syncing
        ? 'Syncing...'
        : error
        ? 'Sync failed – click to retry'
        : `${pending} pending changes`}
    </div>
  );
}