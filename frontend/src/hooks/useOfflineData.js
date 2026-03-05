import { useState, useEffect, useCallback } from 'react';
import { db, syncStatus } from '../lib/db';
import offlineService from '../services/offlineService';

/**
 * Custom hook for offline-first data management with automatic sync.
 * @param {string} store - Dexie table name (e.g., 'patients')
 * @param {Function} apiMethod - API method to fetch data (e.g., patientsService.getPatients)
 * @param {Object} params - Query parameters for the API call
 * @returns {Object} { data, loading, online, create, update, delete, refresh }
 */
export function useOfflineData(store, apiMethod, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial data – from API if online, otherwise from local DB
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (online) {
        try {
          const result = await apiMethod(params);
          // Handle various API response shapes
          const apiData = result?.data?.patients || result?.patients || result?.data || result;
          if (!Array.isArray(apiData)) {
            throw new Error('API did not return an array');
          }
          setData(apiData);
          // Sync fresh data to local DB
          await db[store].bulkPut(
            apiData.map(item => ({ ...item, syncStatus: syncStatus.SYNCED }))
          );
        } catch (error) {
          // API failed – fallback to local DB
          const local = await offlineService.getAll(store);
          setData(local || []);
        }
      } else {
        const local = await offlineService.getAll(store);
        setData(local || []);
      }
    } catch (error) {
      console.error(`[useOfflineData:${store}]`, error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [online, store, apiMethod, JSON.stringify(params)]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when another component modifies local data
  useEffect(() => {
    const handleLocalChange = (event) => {
      if (event.detail.store === store) {
        loadData();
      }
    };
    window.addEventListener('localDataChanged', handleLocalChange);
    return () => window.removeEventListener('localDataChanged', handleLocalChange);
  }, [store, loadData]);

  // Reload after background sync
  useEffect(() => {
    const handleSync = () => loadData();
    window.addEventListener('syncCompleted', handleSync);
    return () => window.removeEventListener('syncCompleted', handleSync);
  }, [loadData]);

  // Create a new record
  const create = useCallback(async (record) => {
    if (online) {
      try {
        const result = await apiMethod(record);
        const newRecord = result?.data?.patient || result?.patient || result?.data;
        await db[store].put({ ...newRecord, syncStatus: syncStatus.SYNCED });
        setData(prev => [...prev, newRecord]);
        window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
        return newRecord;
      } catch {
        // API failed – save offline
        const saved = await offlineService.saveOffline(store, record, 'CREATE');
        setData(prev => [...prev, saved]);
        return saved;
      }
    } else {
      const saved = await offlineService.saveOffline(store, record, 'CREATE');
      setData(prev => [...prev, saved]);
      return saved;
    }
  }, [online, store, apiMethod]);

  // Update an existing record
  const update = useCallback(async (id, changes) => {
    if (online) {
      try {
        const result = await apiMethod(id, changes);
        const updated = result?.data?.patient || result?.patient || result?.data;
        await db[store].put({ ...updated, syncStatus: syncStatus.SYNCED });
        setData(prev => prev.map(item => item.id === id ? updated : item));
        window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
        return updated;
      } catch {
        const updated = await offlineService.updateOffline(store, id, changes);
        setData(prev => prev.map(item => item.id === id ? updated : item));
        return updated;
      }
    } else {
      const updated = await offlineService.updateOffline(store, id, changes);
      setData(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    }
  }, [online, store, apiMethod]);

  // Delete a record
  const remove = useCallback(async (id) => {
    if (online) {
      try {
        await apiMethod(id);
        await db[store].delete(id);
        setData(prev => prev.filter(item => item.id !== id));
        window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
      } catch {
        await offlineService.deleteOffline(store, id);
        setData(prev => prev.filter(item => item.id !== id));
      }
    } else {
      await offlineService.deleteOffline(store, id);
      setData(prev => prev.filter(item => item.id !== id));
    }
  }, [online, store, apiMethod]);

  // Manual refresh
  const refresh = useCallback(() => loadData(), [loadData]);

  return {
    data,
    loading,
    online,
    create,
    update,
    delete: remove,
    refresh,
  };
}