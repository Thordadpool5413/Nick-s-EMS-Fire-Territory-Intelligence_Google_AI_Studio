/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Rural Dead-Zone Offline Storage & Progressive Field Caching Service
 * Enables territory managers to inspect agency dossiers, run GPS radar calculations,
 * and draft field observations in concrete firehouse bays or rural districts with zero cell signal.
 */

import { Agency, FieldNote } from '../types';

export interface PendingOfflineNote {
  id: string;
  agencyId: string;
  agencyName: string;
  note: FieldNote;
  queuedAt: string;
  retryCount: number;
}

export interface CachedAgencyRecord {
  agency: Agency;
  cachedAt: string;
}

const STORAGE_KEY_OFFLINE_NOTES = 'zoll_pulseiq_offline_notes_queue_v1';
const STORAGE_KEY_CACHED_AGENCIES = 'zoll_pulseiq_cached_agencies_v1';
const STORAGE_KEY_RECENT_SEARCHES = 'zoll_pulseiq_recent_radar_v1';

class OfflineStorageService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(isOnline: boolean, pendingCount: number) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notifyListeners();
  }

  public subscribe(listener: (isOnline: boolean, pendingCount: number) => void): () => void {
    this.listeners.add(listener);
    listener(this.isOnline, this.getPendingNotes().length);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const count = this.getPendingNotes().length;
    this.listeners.forEach((l) => l(this.isOnline, count));
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  // --- Offline Notes Queue Management ---

  public getPendingNotes(): PendingOfflineNote[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_NOTES);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public queueOfflineNote(agencyId: string, agencyName: string, note: FieldNote): PendingOfflineNote {
    const queue = this.getPendingNotes();
    const pendingItem: PendingOfflineNote = {
      id: `offline-note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agencyId,
      agencyName,
      note,
      queuedAt: new Date().toISOString(),
      retryCount: 0
    };

    queue.push(pendingItem);
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_NOTES, JSON.stringify(queue));
    } catch (err) {
      console.warn('Failed to save offline note to localStorage:', err);
    }

    this.notifyListeners();
    return pendingItem;
  }

  public removePendingNote(noteId: string): void {
    const queue = this.getPendingNotes().filter((n) => n.id !== noteId);
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_NOTES, JSON.stringify(queue));
    } catch {
      // Ignore storage write failure
    }
    this.notifyListeners();
  }

  public clearAllPendingNotes(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_OFFLINE_NOTES);
    } catch {
      // Ignore
    }
    this.notifyListeners();
  }

  // --- Progressive Agency Caching for Dead-Zone Access ---

  public cacheAgencyForOffline(agency: Agency): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHED_AGENCIES);
      const cache: Record<string, CachedAgencyRecord> = raw ? JSON.parse(raw) : {};
      
      cache[agency.id] = {
        agency,
        cachedAt: new Date().toISOString()
      };

      // Keep up to 50 most recently viewed agencies to respect localStorage bounds
      const entries = Object.entries(cache);
      if (entries.length > 50) {
        entries.sort((a, b) => new Date(b[1].cachedAt).getTime() - new Date(a[1].cachedAt).getTime());
        const pruned = Object.fromEntries(entries.slice(0, 50));
        localStorage.setItem(STORAGE_KEY_CACHED_AGENCIES, JSON.stringify(pruned));
      } else {
        localStorage.setItem(STORAGE_KEY_CACHED_AGENCIES, JSON.stringify(cache));
      }
    } catch (err) {
      console.warn('Failed to cache agency for offline viewing:', err);
    }
  }

  public getCachedAgency(agencyId: string): Agency | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHED_AGENCIES);
      if (!raw) return null;
      const cache: Record<string, CachedAgencyRecord> = JSON.parse(raw);
      return cache[agencyId]?.agency || null;
    } catch {
      return null;
    }
  }

  public getAllCachedAgencies(): Agency[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHED_AGENCIES);
      if (!raw) return [];
      const cache: Record<string, CachedAgencyRecord> = JSON.parse(raw);
      return Object.values(cache).map((c) => c.agency);
    } catch {
      return [];
    }
  }

  // --- Radar Coordinates History ---

  public saveRecentRadarSearch(query: string, coords: { lat: number; lng: number }): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      const history: Array<{ query: string; lat: number; lng: number; timestamp: string }> = raw ? JSON.parse(raw) : [];
      const filtered = history.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
      filtered.unshift({ ...coords, query, timestamp: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // Ignore
    }
  }

  public getRecentRadarSearches(): Array<{ query: string; lat: number; lng: number; timestamp: string }> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const offlineStorageService = new OfflineStorageService();
