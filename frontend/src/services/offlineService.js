import { db, syncStatus } from '../lib/db';
import api from './api';

class OfflineService {
  isOnline() {
    return navigator.onLine;
  }

  generateTempId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save a new record offline (dispatches event)
  async saveOffline(store, data, action = 'CREATE') {
    const id = data.id || this.generateTempId();
    const record = {
      ...data,
      id,
      offlineId: id,
      syncStatus: syncStatus.PENDING,
    };
    await db[store].put(record);
    await db.syncQueue.add({
      entity: store,
      action,
      data: record,
      timestamp: Date.now(),
      retries: 0,
    });
    window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
    return record;
  }

  // Update an existing record offline (dispatches event)
  async updateOffline(store, id, changes) {
    const existing = await db[store].get(id);
    if (!existing) throw new Error('Record not found');
    const updated = { ...existing, ...changes, syncStatus: syncStatus.PENDING };
    await db[store].put(updated);
    await db.syncQueue.add({
      entity: store,
      action: 'UPDATE',
      data: { id, ...changes },
      timestamp: Date.now(),
      retries: 0,
    });
    window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
    return updated;
  }

  // Delete a record offline (dispatches event)
  async deleteOffline(store, id) {
    await db[store].delete(id);
    await db.syncQueue.add({
      entity: store,
      action: 'DELETE',
      data: { id },
      timestamp: Date.now(),
      retries: 0,
    });
    window.dispatchEvent(new CustomEvent('localDataChanged', { detail: { store } }));
  }

  // NEW: Update local DB without dispatching event (for synced data)
  async updateLocal(store, data) {
    await db[store].put({ ...data, syncStatus: syncStatus.SYNCED });
    // No event dispatch – prevents infinite loops
  }

  // Sync pending operations with the server
  async syncPending() {
    if (!this.isOnline()) return { success: false, reason: 'offline' };

    const queue = await db.syncQueue.toArray();
    const results = [];
    const MAX_RETRIES = 5;

    for (const item of queue) {
      try {
        const { entity, action, data } = item;
        let response;

        switch (entity) {
          case 'patients':
            if (action === 'CREATE') {
              response = await api.post('/patients', data);
            } else if (action === 'UPDATE') {
              response = await api.patch(`/patients/${data.id}`, data);
            } else if (action === 'DELETE') {
              response = await api.delete(`/patients/${data.id}`);
            }
            break;
          default:
            console.warn('Unknown entity in sync queue', entity);
        }

        if (response && response.status < 300) {
          await db.syncQueue.delete(item.id);
          if (action !== 'DELETE') {
            const serverData = response.data?.patient || response.data;
            if (action === 'CREATE' && serverData.id && serverData.id !== data.id) {
              await db[entity].delete(data.id);
              await db[entity].put({ ...serverData, syncStatus: syncStatus.SYNCED });
            } else {
              await db[entity].update(data.id, { ...serverData, syncStatus: syncStatus.SYNCED });
            }
          }
          results.push({ item, status: 'success' });
        } else {
          const newRetries = (item.retries || 0) + 1;
          if (newRetries >= MAX_RETRIES) {
            await db.syncQueue.delete(item.id);
            results.push({ item, status: 'dropped', error: 'Max retries exceeded' });
          } else {
            await db.syncQueue.update(item.id, { retries: newRetries });
            results.push({ item, status: 'failed', error: response?.data });
          }
        }
      } catch (error) {
        console.error('Sync error for', item, error);
        const newRetries = (item.retries || 0) + 1;
        if (newRetries >= MAX_RETRIES) {
          await db.syncQueue.delete(item.id);
          results.push({ item, status: 'dropped', error: error.message });
        } else {
          await db.syncQueue.update(item.id, { retries: newRetries });
          results.push({ item, status: 'error', error: error.message });
        }
      }
    }

    window.dispatchEvent(new CustomEvent('syncCompleted'));
    return { success: true, results };
  }

  async getPendingCount() {
    return await db.syncQueue.count();
  }

  // Get all records from a store
  async getAll(store) {
    return await db[store].toArray();
  }

  // Get a single record by ID
  async getOne(store, id) {
    return await db[store].get(id);
  }
}

export default new OfflineService();