/**
 * AppDeploy-native territory persistence.
 * No Firestore connection or synthetic county seeding.
 * Remote writes require an authenticated AppDeploy session, and unsaved writes never
 * generate a success message.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api, auth } from '@appdeploy/client';
import type { Agency, LeadStage, FieldNote } from '../types';
import { loadStoredAgencies, saveAgencies } from '../utils/syncStore';

type Toast = (message: string, type?: 'success' | 'info' | 'warn' | 'error') => void;
type Overlay = {
  agencyId: string;
  isBookmarked?: boolean;
  inDayRoute?: boolean;
  salesStage?: LeadStage;
  fieldNotes?: FieldNote[];
  lastContactDate?: string;
};

interface Options {
  globalState?: string;
  globalCounty?: string;
  onToast?: Toast;
}
export interface UseAgencyRecordsResult {
  agencies: Agency[];
  isCloudConnected: boolean;
  isSyncing: boolean;
  cloudSyncCount: number;
  updateAgencyInCloud: (agency: Agency) => Promise<void>;
  updateStageInCloud: (agencyId: string, stage: LeadStage) => Promise<void>;
  toggleRouteInCloud: (agencyId: string) => Promise<void>;
  toggleBookmarkInCloud: (agencyId: string) => Promise<void>;
  addFieldNoteInCloud: (agencyId: string, note: FieldNote) => Promise<void>;
  addAgencyToCloud: (agency: Agency) => Promise<void>;
  seedCountyDataToCloud: (stateCode: string, countyName: string) => Promise<number>;
  setAgenciesState: Dispatch<SetStateAction<Agency[]>>;
  reloadFromCloud: () => Promise<void>;
}

function mergeOverlay(a: Agency, patch: Partial<Overlay>): Agency {
  return {
    ...a,
    isBookmarked: patch.isBookmarked ?? a.isBookmarked,
    inDayRoute: patch.inDayRoute ?? a.inDayRoute,
    lastContactDate: patch.lastContactDate ?? a.lastContactDate,
    fieldNotes: patch.fieldNotes ?? a.fieldNotes,
    zollOpportunity: {
      ...a.zollOpportunity,
      salesStage: patch.salesStage ?? a.zollOpportunity.salesStage
    }
  };
}

function sanitizeAgency(a: Agency): Agency {
  return {
    ...a,
    headquartersPhone: a.isVerifiedRecord ? a.headquartersPhone : '',
    keyContacts: (a.keyContacts || []).map(c => ({
      ...c,
      phone: c.isVerifiedOfficial ? c.phone : '',
      email: c.isVerifiedOfficial ? c.email : '',
    }))
  };
}

export function useAgencyRecords({ onToast }: Options = {}): UseAgencyRecordsResult {
  const [agencies, setAgencies] = useState<Agency[]>(() =>
    loadStoredAgencies().map(sanitizeAgency)
  );
  const agenciesRef = useRef(agencies);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSyncCount, setCloudSyncCount] = useState(0);
  useEffect(() => { agenciesRef.current = agencies; }, [agencies]);

  const apply = useCallback((fn: (prev: Agency[]) => Agency[]) => {
    setAgencies(prev => {
      const next = fn(prev);
      agenciesRef.current = next;
      saveAgencies(next);
      return next;
    });
  }, []);

  const reloadFromCloud = useCallback(async () => {
    const user = await auth.getUser();
    if (!user) {
      sessionStorage.removeItem('ems_authenticated_user');
      setIsCloudConnected(false);
      setCloudSyncCount(0);
      setAgencies(loadStoredAgencies().map(sanitizeAgency));
      return;
    }
    // Device cache is scoped to the authenticated user, never to the prior visitor.
    sessionStorage.setItem('ems_authenticated_user', user.userId);
    setIsSyncing(true);
    try {
      const overlays: Overlay[] = [];
      let nextToken: string | null = null;
      for (let page = 0; page < 10; page++) {
        const suffix = nextToken ? '?nextToken=' + encodeURIComponent(nextToken) : '';
        const result = await api.get('/api/agency-state' + suffix);
        const records = result.data.records;
        if (!Array.isArray(records)) throw new Error('Invalid AppDeploy territory response');
        overlays.push(...records);
        nextToken = result.data.nextToken || null;
        if (!nextToken) break;
      }
      if (nextToken) {
        throw new Error('Territory data exceeds the bounded sync window. Additional pagination required.');
      }
      const custom: Agency[] = [];
      nextToken = null;
      for (let page = 0; page < 10; page++) {
        const suffix = nextToken ? '?nextToken=' + encodeURIComponent(nextToken) : '';
        const result = await api.get('/api/custom-agencies' + suffix);
        if (!Array.isArray(result.data.records)) throw new Error('Invalid custom agency response');
        custom.push(...result.data.records.map(sanitizeAgency));
        nextToken = result.data.nextToken || null;
        if (!nextToken) break;
      }
      if (nextToken) throw new Error('Custom account data exceeds the bounded sync window.');
      const baseline = loadStoredAgencies().map(sanitizeAgency);
      const existingIds = new Set(baseline.map(a => a.id));
      const base = [...baseline, ...custom.filter(a => !existingIds.has(a.id))];
      const byId = new Map(overlays.map(r => [r.agencyId, r] as const));
      const merged = base.map(a => mergeOverlay(a, byId.get(a.id) || {}));
      setAgencies(merged);
      agenciesRef.current = merged;
      saveAgencies(merged);
      setCloudSyncCount(overlays.length);
      setIsCloudConnected(true);
    } catch (err) {
      setIsCloudConnected(false);
      onToast?.('Cloud sync unavailable. Your local changes have not been verified as saved.', 'error');
      console.error('AppDeploy agency sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  }, [onToast]);

  useEffect(() => {
    void reloadFromCloud();
    const handler = () => { void reloadFromCloud(); };
    window.addEventListener('appdeploy-auth-change', handler);
    return () => window.removeEventListener('appdeploy-auth-change', handler);
  }, [reloadFromCloud]);

  const commit = useCallback(async (agencyId: string, patch: Record<string, unknown>) => {
    if (!auth.isSignedIn()) {
      onToast?.('Sign in with your email to save this change. This session has not been cloud-synced.', 'warn');
      return;
    }
    setIsSyncing(true);
    try {
      await api.put('/api/agency-state', { agencyId, ...patch });
      setIsCloudConnected(true);
    } catch (err) {
      setIsCloudConnected(false);
      onToast?.('Unable to save this change. It is not confirmed in cloud storage.', 'error');
      console.error('AppDeploy field change failed', err);
    } finally {
      setIsSyncing(false);
    }
  }, [onToast]);

  const updateAgencyInCloud = useCallback(async (agency: Agency) => {
    apply(prev => prev.map(a => a.id === agency.id ? sanitizeAgency(agency) : a));
    await commit(agency.id, {
      isBookmarked: agency.isBookmarked,
      inDayRoute: agency.inDayRoute,
      salesStage: agency.zollOpportunity.salesStage,
      lastContactDate: agency.lastContactDate
    });
  }, [apply, commit]);

  const updateStageInCloud = useCallback(async (agencyId: string, stage: LeadStage) => {
    apply(prev => prev.map(a => a.id === agencyId
      ? mergeOverlay(a, { salesStage: stage }) : a));
    await commit(agencyId, { salesStage: stage });
  }, [apply, commit]);

  const toggleRouteInCloud = useCallback(async (agencyId: string) => {
    const next = !agenciesRef.current.find(a => a.id === agencyId)?.inDayRoute;
    apply(prev => prev.map(a => a.id === agencyId
      ? mergeOverlay(a, { inDayRoute: next }) : a));
    await commit(agencyId, { inDayRoute: next });
  }, [apply, commit]);

  const toggleBookmarkInCloud = useCallback(async (agencyId: string) => {
    const next = !agenciesRef.current.find(a => a.id === agencyId)?.isBookmarked;
    apply(prev => prev.map(a => a.id === agencyId
      ? mergeOverlay(a, { isBookmarked: next }) : a));
    await commit(agencyId, { isBookmarked: next });
  }, [apply, commit]);

  const addFieldNoteInCloud = useCallback(async (agencyId: string, note: FieldNote) => {
    apply(prev => prev.map(a => a.id === agencyId ? mergeOverlay(a, {
      fieldNotes: [note, ...(a.fieldNotes || []).filter(n => n.id !== note.id)],
      lastContactDate: note.date
    }) : a));
    await commit(agencyId, { appendNote: note });
  }, [apply, commit]);

  const addAgencyToCloud = useCallback(async (agency: Agency) => {
    apply(prev => prev.some(a => a.id === agency.id) ? prev : [sanitizeAgency(agency), ...prev]);
    if (!auth.isSignedIn()) {
      onToast?.('Sign in before saving a new agency to your territory.', 'warn');
      return;
    }
    setIsSyncing(true);
    try {
      await api.post('/api/custom-agencies', { agency: sanitizeAgency(agency) });
      setIsCloudConnected(true);
    } catch (err) {
      setIsCloudConnected(false);
      onToast?.('New agency is not confirmed saved. Check connection and try again.', 'error');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }, [apply, onToast]);

  const seedCountyDataToCloud = useCallback(async (_stateCode: string, _countyName: string) => {
    onToast?.('No synthetic agencies were uploaded. Import source-backed provider records instead.', 'info');
    return 0;
  }, [onToast]);

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
    setAgenciesState: setAgencies,
    reloadFromCloud
  };
}
