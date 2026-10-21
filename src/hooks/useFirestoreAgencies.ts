/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Agency, LeadStage, FieldNote } from '../types';
import { 
  db, 
  saveAgencyToFirestore, 
  fetchAgenciesFromFirestore, 
  subscribeToFirestoreAgencies, 
  saveFieldNoteToFirestore,
  batchSyncAgenciesToFirestore,
  testFirestoreConnection 
} from '../utils/firebase';
import { saveAgencies, loadStoredAgencies } from '../utils/syncStore';
import { territoryEngine } from '../services/territoryIntelligenceEngine';

interface UseFirestoreAgenciesOptions {
  globalState?: string;
  globalCounty?: string;
  onToast?: (message: string, type?: 'success' | 'info' | 'warn' | 'error') => void;
}

export interface UseFirestoreAgenciesResult {
  agencies: Agency[];
  isCloudConnected: boolean;
  isSyncing: boolean;
  cloudSyncCount: number;
  updateAgencyInCloud: (agency: Agency) => Promise<void>;
  updateStageInCloud: (agencyId: string, newStage: LeadStage) => Promise<void>;
  toggleRouteInCloud: (agencyId: string) => Promise<void>;
  toggleBookmarkInCloud: (agencyId: string) => Promise<void>;
  addFieldNoteInCloud: (agencyId: string, note: FieldNote) => Promise<void>;
  addAgencyToCloud: (newAgency: Agency) => Promise<void>;
  seedCountyDataToCloud: (stateCode: string, countyName: string) => Promise<number>;
  setAgenciesState: React.Dispatch<React.SetStateAction<Agency[]>>;
}

function sanitizeAgencyPhones(agency: Agency): Agency {
  return {
    ...agency,
    headquartersPhone: '',
    keyContacts: (agency.keyContacts || []).map((c) => ({
      ...c,
      phone: '',
    })),
  };
}

/**
 * Data-fetching and real-time synchronization hook between Firebase Firestore
 * and local agency state across all 3,143 nationwide counties.
 */
export function useFirestoreAgencies({
  globalState = 'all',
  globalCounty = 'all',
  onToast
}: UseFirestoreAgenciesOptions = {}): UseFirestoreAgenciesResult {
  const [agencies, setAgencies] = useState<Agency[]>(() => loadStoredAgencies().map(sanitizeAgencyPhones));
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudSyncCount, setCloudSyncCount] = useState<number>(0);

  const initialSeededRef = useRef<boolean>(false);

  // 1. Check cloud connectivity on mount
  useEffect(() => {
    let isMounted = true;
    testFirestoreConnection().then(connected => {
      if (isMounted) {
        setIsCloudConnected(connected);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // 2. Real-time subscription to Firestore changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToFirestoreAgencies((cloudAgencies) => {
        if (cloudAgencies.length > 0) {
          setCloudSyncCount(cloudAgencies.length);
          setAgencies((currentLocal) => {
            const agencyMap = new Map<string, Agency>();
            // Add local existing first
            for (const a of currentLocal) {
              agencyMap.set(a.id, sanitizeAgencyPhones(a));
            }
            // Merge cloud updates (cloud overrides local matches, with unverified phones stripped)
            for (const ca of cloudAgencies) {
              agencyMap.set(ca.id, sanitizeAgencyPhones({
                ...agencyMap.get(ca.id),
                ...ca
              } as Agency));
            }
            const merged = Array.from(agencyMap.values());
            saveAgencies(merged);
            return merged;
          });
        }
      }, globalState !== 'all' ? globalState : undefined);
    } catch (err) {
      console.warn('Real-time Firestore listener offline fallback:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [globalState]);

  // 3. Ensure selected state/county has rich EMS and Fire agencies synthesized if not yet in state
  useEffect(() => {
    if (globalState !== 'all' && globalCounty !== 'all') {
      const normGlobalCounty = globalCounty.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
      const existingInCounty = agencies.filter(a => {
        if (a.stateCode !== globalState.toUpperCase()) return false;
        const normAgencyCounty = a.county.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
        return normAgencyCounty === normGlobalCounty || normAgencyCounty.includes(normGlobalCounty) || normGlobalCounty.includes(normAgencyCounty);
      });

      // If county has fewer than 2 agencies in local overrides, hydrate from territory engine
      if (existingInCounty.length < 2) {
        const enriched = territoryEngine.getAgenciesForCountyAndCities(
          globalState,
          globalCounty,
          undefined,
          agencies,
          'all'
        );

        if (enriched.length > 0) {
          setAgencies((prev) => {
            const seen = new Set(prev.map(p => p.id));
            const toAdd = enriched.filter(e => !seen.has(e.id));
            if (toAdd.length === 0) return prev;
            const updated = [...toAdd, ...prev];
            saveAgencies(updated);

            // Asynchronously sync new county agencies to Firestore cloud
            batchSyncAgenciesToFirestore(toAdd.slice(0, 8)).catch(() => {});
            return updated;
          });
        }
      }
    }
  }, [globalState, globalCounty]);

  // 4. Update single agency in Firestore + local optimistic update
  const updateAgencyInCloud = useCallback(async (agency: Agency) => {
    setAgencies(prev => {
      const next = prev.map(a => a.id === agency.id ? agency : a);
      saveAgencies(next);
      return next;
    });

    try {
      setIsSyncing(true);
      await saveAgencyToFirestore(agency);
    } catch (err) {
      console.warn('Cloud write buffered offline:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 5. Update sales stage in cloud
  const updateStageInCloud = useCallback(async (agencyId: string, newStage: LeadStage) => {
    let targetAgency: Agency | undefined;
    setAgencies(prev => {
      const next = prev.map(a => {
        if (a.id === agencyId) {
          targetAgency = {
            ...a,
            zollOpportunity: {
              ...a.zollOpportunity,
              salesStage: newStage
            }
          };
          return targetAgency;
        }
        return a;
      });
      saveAgencies(next);
      return next;
    });

    if (targetAgency) {
      try {
        setIsSyncing(true);
        await saveAgencyToFirestore(targetAgency);
        if (onToast) onToast(`Updated stage for ${targetAgency.name} to "${newStage}" in Cloud CRM`, 'success');
      } catch (err) {
        console.warn('Could not sync stage change to Firestore immediately:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [onToast]);

  // 6. Toggle day route status in cloud
  const toggleRouteInCloud = useCallback(async (agencyId: string) => {
    let targetAgency: Agency | undefined;
    let nextState = false;

    setAgencies(prev => {
      const next = prev.map(a => {
        if (a.id === agencyId) {
          nextState = !a.inDayRoute;
          targetAgency = { ...a, inDayRoute: nextState };
          return targetAgency;
        }
        return a;
      });
      saveAgencies(next);
      return next;
    });

    if (targetAgency) {
      try {
        setIsSyncing(true);
        await saveAgencyToFirestore(targetAgency);
        if (onToast) {
          onToast(
            nextState 
              ? `Added "${targetAgency.name}" to today's field route (Synced with Cloud).` 
              : `Removed "${targetAgency.name}" from today's route.`,
            nextState ? 'success' : 'info'
          );
        }
      } catch (err) {
        console.warn('Route change queued locally:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [onToast]);

  // 7. Toggle bookmark in cloud
  const toggleBookmarkInCloud = useCallback(async (agencyId: string) => {
    let targetAgency: Agency | undefined;
    let nextState = false;

    setAgencies(prev => {
      const next = prev.map(a => {
        if (a.id === agencyId) {
          nextState = !a.isBookmarked;
          targetAgency = { ...a, isBookmarked: nextState };
          return targetAgency;
        }
        return a;
      });
      saveAgencies(next);
      return next;
    });

    if (targetAgency) {
      try {
        setIsSyncing(true);
        await saveAgencyToFirestore(targetAgency);
        if (onToast) {
          onToast(
            nextState 
              ? `Bookmarked "${targetAgency.name}" in Cloud CRM.` 
              : `Removed bookmark for "${targetAgency.name}".`,
            nextState ? 'success' : 'info'
          );
        }
      } catch (err) {
        console.warn('Bookmark queued locally:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [onToast]);

  // 8. Add field note in cloud
  const addFieldNoteInCloud = useCallback(async (agencyId: string, note: FieldNote) => {
    let updatedAgency: Agency | undefined;

    setAgencies(prev => {
      const next = prev.map(a => {
        if (a.id === agencyId) {
          const updatedNotes = [note, ...(a.fieldNotes || [])];
          updatedAgency = {
            ...a,
            fieldNotes: updatedNotes,
            lastContactDate: note.date
          };
          return updatedAgency;
        }
        return a;
      });
      saveAgencies(next);
      return next;
    });

    if (updatedAgency) {
      try {
        setIsSyncing(true);
        await Promise.all([
          saveAgencyToFirestore(updatedAgency),
          saveFieldNoteToFirestore(agencyId, note)
        ]);
        if (onToast) onToast(`Field note for "${updatedAgency.name}" recorded in Cloud CRM!`, 'success');
      } catch (err) {
        console.warn('Field note recorded locally; cloud sync pending:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [onToast]);

  // 9. Add newly created agency to cloud
  const addAgencyToCloud = useCallback(async (newAgency: Agency) => {
    setAgencies(prev => {
      const exists = prev.some(a => a.id === newAgency.id);
      if (exists) return prev;
      const next = [newAgency, ...prev];
      saveAgencies(next);
      return next;
    });

    try {
      setIsSyncing(true);
      await saveAgencyToFirestore(newAgency);
      if (onToast) onToast(`Added "${newAgency.name}" to Active Territory Pipeline (Cloud Synced)!`, 'success');
    } catch (err) {
      console.warn('Agency created locally; will sync upon cloud connect:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [onToast]);

  // 10. Explicitly seed a county's EMS & Fire departments into Firestore
  const seedCountyDataToCloud = useCallback(async (stateCode: string, countyName: string): Promise<number> => {
    const records = territoryEngine.getAgenciesForCountyAndCities(
      stateCode,
      countyName,
      undefined,
      agencies,
      'all'
    );

    if (records.length === 0) return 0;

    setIsSyncing(true);
    try {
      const count = await batchSyncAgenciesToFirestore(records);
      if (onToast) onToast(`Synchronized ${count} EMS & Fire agencies in ${countyName} to Cloud Firestore!`, 'success');
      return count;
    } catch (err) {
      console.error('Batch sync to Firestore failed:', err);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  }, [agencies, onToast]);

  return {
    agencies,
    isCloudConnected,
    isSyncing,
    cloudSyncCount,
    updateAgencyInCloud,
    updateStageInCloud,
    toggleRouteInCloud,
    toggleBookmarkInCloud,
    addFieldNoteInCloud,
    addAgencyToCloud,
    seedCountyDataToCloud,
    setAgenciesState: setAgencies
  };
}
