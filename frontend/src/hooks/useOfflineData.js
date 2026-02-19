import { useState, useEffect, useCallback } from 'react';
import { db, syncStatus } from '../lib/db';
import offlineService from '../services/offlineService';

export function useOfflineData(store, apiMethod, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Listen to online/offline events
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

  // Load data – from API if online and available, otherwise from local DB
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (online) {
        try {
          // Attempt to fetch from API
          const result = await apiMethod(params);
          const apiData = result.data || result.patients || result; // adjust based on your API
          setData(apiData);
          // Update local DB with fresh data (mark as SYNCED)
          await db[store].bulkPut(apiData.map(item => ({ ...item, syncStatus: syncStatus.SYNCED })));
        } catch (error) {
          console.warn('API fetch failed, falling back to local DB', error);
          // Fallback to local
          const local = await db[store].toArray();
          setData(local);
        }
      } else {
        // Offline: load from local DB
        const local = await db[store].toArray();
        setData(local);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [online, store, apiMethod, JSON.stringify(params)]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create (offline‑first)
  const create = useCallback(async (record) => {
    if (online) {
      try {
        const result = await apiMethod(record); // assuming apiMethod can POST
        const newRecord = result.data?.patient || result.data;
        await db[store].put({ ...newRecord, syncStatus: syncStatus.SYNCED });
        setData(prev => [...prev, newRecord]);
        return newRecord;
      } catch (error) {
        // API failed, store offline
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

  // Update
  const update = useCallback(async (id, changes) => {
    if (online) {
      try {
        const result = await apiMethod(id, changes); // assuming apiMethod can PATCH
        const updated = result.data?.patient || result.data;
        await db[store].put({ ...updated, syncStatus: syncStatus.SYNCED });
        setData(prev => prev.map(item => item.id === id ? updated : item));
        return updated;
      } catch (error) {
        // Offline update
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

  // Delete
  const remove = useCallback(async (id) => {
    if (online) {
      try {
        await apiMethod(id); // assuming apiMethod can DELETE
        await db[store].delete(id);
        setData(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        // Offline delete
        await offlineService.deleteOffline(store, id);
        setData(prev => prev.filter(item => item.id !== id));
      }
    } else {
      await offlineService.deleteOffline(store, id);
      setData(prev => prev.filter(item => item.id !== id));
    }
  }, [online, store, apiMethod]);

  // Refresh (force reload)
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    online,
    create,
    update,
    delete: remove,
    refresh
  };
}