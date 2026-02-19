// services/offlineService.js
import { db, syncStatus } from '../lib/db';
import api from './api';

class OfflineService {
  isOnline() {
    return navigator.onLine;
  }

  // Generate a temporary ID for offline records
  generateTempId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveOffline(store, data, action = 'CREATE') {
    // Ensure the record has an 'id' field (primary key for Dexie)
    const id = data.id || this.generateTempId();
    const record = {
      ...data,
      id,                    // primary key
      offlineId: id,         // for tracking (can be same)
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
    return record;
  }

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
    return updated;
  }

  async deleteOffline(store, id) {
    await db[store].delete(id);
    await db.syncQueue.add({
      entity: store,
      action: 'DELETE',
      data: { id },
      timestamp: Date.now(),
      retries: 0,
    });
  }

  async syncPending() {
    if (!this.isOnline()) return { success: false, reason: 'offline' };

    const queue = await db.syncQueue.toArray();
    const results = [];
    const MAX_RETRIES = 5; // drop after 5 failures

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
          // Add other entities here (appointments, etc.)
          default:
            console.warn('Unknown entity in sync queue', entity);
        }

        if (response && response.status < 300) {
          // Success – remove from queue
          await db.syncQueue.delete(item.id);
          if (action !== 'DELETE') {
            const serverData = response.data?.patient || response.data;
            // For CREATE, the server generated a new ID – replace the local record
            if (action === 'CREATE' && serverData.id && serverData.id !== data.id) {
              // Delete the old record with temporary ID
              await db[entity].delete(data.id);
              // Insert the new record with the server ID
              await db[entity].put({ ...serverData, syncStatus: syncStatus.SYNCED });
            } else {
              // For UPDATE, just update the existing record
              await db[entity].update(data.id, { ...serverData, syncStatus: syncStatus.SYNCED });
            }
          }
          results.push({ item, status: 'success' });
        } else {
          // Server error – keep but increment retries
          const newRetries = (item.retries || 0) + 1;
          if (newRetries >= MAX_RETRIES) {
            // Give up: delete the item to avoid infinite retries
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

    // Dispatch event so UI can refresh pending count
    window.dispatchEvent(new CustomEvent('syncCompleted'));

    return { success: true, results };
  }

  async getPendingCount() {
    return await db.syncQueue.count();
  }
}

export default new OfflineService();