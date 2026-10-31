/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { offlineStorageService, PendingOfflineNote } from '../services/offlineStorageService';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface OfflineSyncStatusBadgeProps {
  onSyncPendingNotes?: (notes: PendingOfflineNote[]) => Promise<void>;
  isSyncingRemote?: boolean;
}

export const OfflineSyncStatusBadge: React.FC<OfflineSyncStatusBadgeProps> = ({
  onSyncPendingNotes,
  isSyncingRemote = false
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(offlineStorageService.getIsOnline());
  const [pendingNotes, setPendingNotes] = useState<PendingOfflineNote[]>(offlineStorageService.getPendingNotes());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isFlushing, setIsFlushing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = offlineStorageService.subscribe((online) => {
      setIsOnline(online);
      setPendingNotes(offlineStorageService.getPendingNotes());
    });
    return () => unsubscribe();
  }, []);

  const handleManualFlush = async () => {
    if (!isOnline || pendingNotes.length === 0 || !onSyncPendingNotes) return;
    setIsFlushing(true);
    try {
      await onSyncPendingNotes(pendingNotes);
      offlineStorageService.clearAllPendingNotes();
      setPendingNotes([]);
    } catch (err) {
      console.warn('Error flushing offline notes queue:', err);
    } finally {
      setIsFlushing(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    offlineStorageService.removePendingNote(id);
    setPendingNotes(offlineStorageService.getPendingNotes());
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          !isOnline
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
            : pendingNotes.length > 0
            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-800/60'
        }`}
        title={
          !isOnline
            ? 'Operating in Offline Mode (Rural Dead-Zone Protection Active)'
            : pendingNotes.length > 0
            ? `${pendingNotes.length} offline observations queued for cloud sync`
            : 'Online & Connected to Territory Intelligence Database'
        }
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Offline Mode</span>
            {pendingNotes.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {pendingNotes.length}
              </span>
            )}
          </>
        ) : pendingNotes.length > 0 ? (
          <>
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isFlushing || isSyncingRemote ? 'animate-spin' : ''}`} />
            <span>{pendingNotes.length} Queued</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Online Sync</span>
          </>
        )}
        {pendingNotes.length > 0 && (
          isDrawerOpen ? <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" /> : <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
        )}
      </button>

      {/* Dropdown Drawer for Pending Notes */}
      {isDrawerOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Offline Field Queue ({pendingNotes.length})
              </span>
            </div>
            {isOnline && pendingNotes.length > 0 && (
              <button
                type="button"
                onClick={handleManualFlush}
                disabled={isFlushing || isSyncingRemote}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFlushing || isSyncingRemote ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-3">
            {!isOnline
              ? 'You are in a rural or cellular dead zone. Observations taken in fire stations or on the road are safely stored on this device and will automatically sync when connectivity is restored.'
              : pendingNotes.length > 0
              ? 'Local notes ready to sync to the central directory.'
              : 'Zero pending notes in queue. Central directory is fully synchronized.'}
          </p>

          {pendingNotes.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pendingNotes.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {item.agencyName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Discard local pending note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[11px]">
                    {item.note.notes}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{new Date(item.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">Pending Sync</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
              <div className="font-semibold text-emerald-900 dark:text-emerald-200">Storage Up to Date</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">All field records matched with database.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
