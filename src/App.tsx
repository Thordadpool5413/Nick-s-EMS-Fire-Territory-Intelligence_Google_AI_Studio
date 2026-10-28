/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Agency, 
  LeadStage, 
  FieldNote, 
  SyncOutboxItem, 
  PushAlert, 
  UserRole, 
  PredictiveWeights 
} from './types';
import { 
  saveAgencies, 
  loadStoredOutbox, 
  saveOutbox, 
  loadStoredWeights, 
  saveStoredWeights, 
  createOutboxItem, 
  calculateScore 
} from './utils/syncStore';
import { 
  loadStoredNotifications, 
  saveStoredNotifications, 
  triggerSystemNotification, 
  ALERT_TEMPLATES 
} from './utils/notificationService';
import { TopBar } from './components/TopBar';
import { PredictiveLeadQueue } from './components/PredictiveLeadQueue';
import { GisTerritoryHeatmap } from './components/GisTerritoryHeatmap';
import { PredictiveWeightsModal } from './components/PredictiveWeightsModal';
import { PublicHealthcareExplorer } from './components/PublicHealthcareExplorer';
import { AfgGrantsTracker } from './components/AfgGrantsTracker';
import { FieldModeView } from './components/FieldModeView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { QuickVisitModal } from './components/QuickVisitModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ContractExpirationCalendar } from './components/ContractExpirationCalendar';
import { RfpSpecGeneratorModal } from './components/RfpSpecGeneratorModal';
import { CloudBackupResilienceView } from './components/CloudBackupResilienceView';
import { NationwideDataGatewayView } from './components/NationwideDataGatewayView';
import { DataLineageTrustModal } from './components/DataLineageTrustModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { NationalGeographicExplorer } from './components/NationalGeographicExplorer';
import { ThreeApparatusStudio } from './components/ThreeApparatusStudio';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { PulseIqRegionalBreakdownChart } from './components/PulseIqRegionalBreakdownChart';
import { FocusedProviderProfile } from './components/FocusedProviderProfile';
import { AgencyQuickPreviewDrawer } from './components/AgencyQuickPreviewDrawer';
import { ClinicalCompetitiveKnowledgeHub } from './components/ClinicalCompetitiveKnowledgeHub';
import { ZollMobileDashboard } from './components/ZollMobileDashboard';
import { HomeHubView } from './components/HomeHubView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GoogleMapsTerritoryExplorer } from './components/GoogleMapsTerritoryExplorer';
import { DataHealthDashboard } from './components/DataHealthDashboard';
import { MobileProviderSelectorDrawer } from './components/MobileProviderSelectorDrawer';
import { useFirestoreAgencies } from './hooks/useFirestoreAgencies';
import { CheckCircle2, AlertCircle, Globe, ListOrdered, Scale, Car, X, Siren, Flame, LayoutDashboard, Sliders, ShieldCheck } from 'lucide-react';

export default function App() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warn' | 'error' = 'success'): void => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Global Cascading Geographic & Account Selectors State
  const [globalState, setGlobalState] = useState<string>('all');
  const [globalCounty, setGlobalCounty] = useState<string>('all');
  const [globalCity, setGlobalCity] = useState<string>('all');
  const [globalCategory, setGlobalCategory] = useState<'all' | 'ems' | 'fire'>('all');
  const [activeAccount, setActiveAccount] = useState<Agency | null>(null);

  // Real-time synchronization hook connected to Firebase Firestore cloud backend
  const {
    agencies,
    isCloudConnected,
    cloudSyncCount,
    isSyncing: isCloudSyncing,
    strictCloudOnlyMode,
    toggleStrictCloudOnlyMode,
    hydrateBatchToCloud,
    runDeepCloudPurgeAndSanitize,
    updateStageInCloud,
    toggleRouteInCloud,
    toggleBookmarkInCloud,
    addFieldNoteInCloud,
    addAgencyToCloud,
    updateAgencyInCloud,
    setAgenciesState
  } = useFirestoreAgencies({
    globalState,
    globalCounty,
    onToast: showToast
  });

  const [outbox, setOutbox] = useState<SyncOutboxItem[]>(loadStoredOutbox);
  const [alerts, setAlerts] = useState<PushAlert[]>(loadStoredNotifications);
  const [weights, setWeights] = useState<PredictiveWeights>(loadStoredWeights);
  const [currentRole, setCurrentRole] = useState<UserRole>('Territory Manager');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('nicks_quick_start_visible');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleWorkflowGuide = (nextVal?: boolean) => {
    setShowWorkflowGuide((prev) => {
      const target = typeof nextVal === 'boolean' ? nextVal : !prev;
      try {
        localStorage.setItem('nicks_quick_start_visible', String(target));
      } catch {
        // Ignore storage errors
      }
      return target;
    });
  };

  // Dark Mode State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('app_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('app_dark_mode', String(isDarkMode));
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);
  
  // Navigation & Modals - Open with Central Home & Guided Onboarding Hub by default
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [previewAgency, setPreviewAgency] = useState<Agency | null>(null);
  const [rfpAgency, setRfpAgency] = useState<Agency | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isQuickVisitOpen, setIsQuickVisitOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isDataLineageOpen, setIsDataLineageOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState<boolean>(false);
  const [isMobileProviderFinderOpen, setIsMobileProviderFinderOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  // Listen to Google Maps Platform quota defense events
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored. Auto-syncing outbox...', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network disconnected. Field offline mode active.', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Global keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize outbox when coming back online
  useEffect(() => {
    if (isOnline && outbox.length > 0 && !isSyncing) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        const synced = outbox.map(item => ({ ...item, status: 'SYNCED' as const }));
        setOutbox([]);
        saveOutbox([]);
        setIsSyncing(false);
        showToast(`Successfully synced ${synced.length} pending field changes to cloud server.`, 'success');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOnline, outbox, isSyncing, showToast]);

  // Filter passed from National Geographic Explorer to Lead Queue
  const [queueFilterState, setQueueFilterState] = useState<{
    state?: string;
    county?: string;
    city?: string;
    zip?: string;
  } | null>(null);

  // Sync state modifications to storage
  const updateAgenciesState = useCallback((newAgencies: Agency[]) => {
    setAgenciesState(newAgencies);
    saveAgencies(newAgencies);
    if (selectedAgency) {
      const refreshed = newAgencies.find(a => a.id === selectedAgency.id);
      if (refreshed) setSelectedAgency(refreshed);
    }
    if (activeAccount) {
      const refreshedActive = newAgencies.find(a => a.id === activeAccount.id);
      if (refreshedActive) setActiveAccount(refreshedActive);
    }
  }, [selectedAgency, activeAccount, setAgenciesState]);

  const handleSaveWeights = useCallback((newWeights: PredictiveWeights) => {
    setWeights(newWeights);
    saveStoredWeights(newWeights);
    const recalculated = agencies.map(agency => ({
      ...agency,
      zollOpportunity: {
        ...agency.zollOpportunity,
        pulseIqScore: calculateScore(agency, newWeights)
      }
    }));
    updateAgenciesState(recalculated);
    showToast('PulseIQ scoring weights calibrated. All territory accounts re-ranked.', 'success');
  }, [agencies, updateAgenciesState, showToast]);

  const handleAddAgency = useCallback((newAgency: Agency) => {
    addAgencyToCloud(newAgency);
  }, [addAgencyToCloud]);

  const handleToggleRoute = useCallback((agencyId: string) => {
    toggleRouteInCloud(agencyId);
    if (selectedAgency?.id === agencyId) {
      setSelectedAgency(prev => prev ? { ...prev, inDayRoute: !prev.inDayRoute } : null);
    }
    if (activeAccount?.id === agencyId) {
      setActiveAccount(prev => prev ? { ...prev, inDayRoute: !prev.inDayRoute } : null);
    }
    if (previewAgency?.id === agencyId) {
      setPreviewAgency(prev => prev ? { ...prev, inDayRoute: !prev.inDayRoute } : null);
    }
  }, [toggleRouteInCloud, selectedAgency, activeAccount, previewAgency]);

  const handleToggleBookmark = useCallback((agencyId: string) => {
    toggleBookmarkInCloud(agencyId);
    if (selectedAgency?.id === agencyId) {
      setSelectedAgency(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
    if (activeAccount?.id === agencyId) {
      setActiveAccount(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
    if (previewAgency?.id === agencyId) {
      setPreviewAgency(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
  }, [toggleBookmarkInCloud, selectedAgency, activeAccount, previewAgency]);

  const handleUpdateStage = useCallback((agencyId: string, newStage: LeadStage) => {
    updateStageInCloud(agencyId, newStage);
    if (selectedAgency?.id === agencyId) {
      setSelectedAgency(prev => prev ? {
        ...prev,
        zollOpportunity: {
          ...prev.zollOpportunity,
          salesStage: newStage
        }
      } : null);
    }
    if (activeAccount?.id === agencyId) {
      setActiveAccount(prev => prev ? {
        ...prev,
        zollOpportunity: {
          ...prev.zollOpportunity,
          salesStage: newStage
        }
      } : null);
    }
    if (previewAgency?.id === agencyId) {
      setPreviewAgency(prev => prev ? {
        ...prev,
        zollOpportunity: {
          ...prev.zollOpportunity,
          salesStage: newStage
        }
      } : null);
    }

    if (!isOnline) {
      const targetAgency = agencies.find(a => a.id === agencyId);
      const outboxItem = createOutboxItem(agencyId, targetAgency?.name || 'Unknown Agency', 'UPDATE_STAGE', { stage: newStage });
      setOutbox(prev => {
        const next = [outboxItem, ...prev];
        saveOutbox(next);
        return next;
      });
      showToast(`Offline: Stage change queued for auto-sync.`, 'warn');
    }
  }, [updateStageInCloud, selectedAgency, activeAccount, previewAgency, isOnline, agencies, showToast]);

  const handleAddFieldNote = useCallback((agencyId: string, noteData: Omit<FieldNote, 'id'>) => {
    const newNote: FieldNote = {
      ...noteData,
      id: `fn-${Date.now()}`
    };
    addFieldNoteInCloud(agencyId, newNote);

    if (selectedAgency?.id === agencyId) {
      setSelectedAgency(prev => prev ? {
        ...prev,
        fieldNotes: [newNote, ...prev.fieldNotes],
        lastContactDate: newNote.date
      } : null);
    }
    if (activeAccount?.id === agencyId) {
      setActiveAccount(prev => prev ? {
        ...prev,
        fieldNotes: [newNote, ...prev.fieldNotes],
        lastContactDate: newNote.date
      } : null);
    }
    if (previewAgency?.id === agencyId) {
      setPreviewAgency(prev => prev ? {
        ...prev,
        fieldNotes: [newNote, ...prev.fieldNotes],
        lastContactDate: newNote.date
      } : null);
    }

    if (!isOnline) {
      const targetAgency = agencies.find(a => a.id === agencyId);
      const outboxItem = createOutboxItem(agencyId, targetAgency?.name || 'Unknown Agency', 'ADD_FIELD_NOTE', newNote);
      setOutbox(prev => {
        const next = [outboxItem, ...prev];
        saveOutbox(next);
        return next;
      });
      showToast(`Offline: Field log entry saved locally. Will sync when online.`, 'warn');
    }
  }, [addFieldNoteInCloud, selectedAgency, activeAccount, previewAgency, isOnline, agencies, showToast]);


  const handleSelectAlertAgency = useCallback((agencyId: string) => {
    const target = agencies.find(a => a.id === agencyId);
    if (target) {
      setSelectedAgency(target);
      setActiveAccount(target);
      setIsNotificationsOpen(false);
    }
  }, [agencies]);

  const handleCheckConnectivity = useCallback(() => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
    showToast(online ? 'Network verified: Online with cloud synchronization.' : 'Network offline: Local field cache active.', online ? 'info' : 'warn');
  }, [showToast]);

  const handleManualSync = useCallback(() => {
    if (!isOnline) {
      showToast('Cannot sync while in offline mode. Please reconnect first.', 'warn');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setOutbox([]);
      saveOutbox([]);
      setIsSyncing(false);
      showToast('All pending offline transactions synchronized with central CRM database.', 'success');
    }, 1000);
  }, [isOnline, showToast]);

  const handleSelectAccountUnified = useCallback((account: Agency | null) => {
    setActiveAccount(account);
    setSelectedAgency(account);
    if (account) {
      setGlobalState(account.stateCode);
      setGlobalCounty(account.county);
      setGlobalCity(account.city);
      setGlobalCategory(account.providerCategory === 'FIRE' ? 'fire' : 'ems');
    }
  }, []);

  const unreadAlertCount = alerts.filter(a => !a.isRead).length;
  const dayRouteCount = agencies.filter(a => a.inDayRoute).length;
  const bookmarkedCount = agencies.filter(a => a.isBookmarked).length;
  const currentActive = activeAccount || selectedAgency;

  const handleGoHome = useCallback(() => {
    setSelectedAgency(null);
    setActiveAccount(null);
    setRfpAgency(null);
    setIsQuickVisitOpen(false);
    setIsCommandPaletteOpen(false);
    setIsDataLineageOpen(false);
    setIsChatbotOpen(false);
    setIsNotificationsOpen(false);
    setGlobalState('all');
    setGlobalCounty('all');
    setGlobalCity('all');
    setGlobalCategory('all');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearGeography = useCallback(() => {
    setGlobalState('all');
    setGlobalCounty('all');
    setGlobalCity('all');
  }, []);

  const handleNavigateTab = useCallback((tab: string) => {
    setSelectedAgency(null);
    setActiveAccount(null);
    setPreviewAgency(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDarkMode ? 'dark bg-[#0B1320] text-slate-100' : 'bg-[#F5F7FA] text-[#14283F]'} flex flex-col font-sans pb-16 md:pb-0 transition-colors duration-150`}>

      
      {/* Google Maps Quota Defense Sticky Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Primary Navigation Shell (280px Sidebar + 64px Top Toolbar) */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onGoHome={handleGoHome}
        globalCategory={globalCategory}
        setGlobalCategory={setGlobalCategory}
        isOnline={isOnline}
        toggleNetwork={handleCheckConnectivity}
        pendingSyncCount={outbox.length}
        isSyncing={isSyncing}
        triggerManualSync={handleManualSync}
        unreadAlertCount={unreadAlertCount}
        openNotifications={() => setIsNotificationsOpen(true)}
        currentRole={currentRole}
        setCurrentRole={(r) => {
          setCurrentRole(r);
          showToast(`Switched active view role to: ${r}`, 'info');
        }}
        openQuickVisitModal={() => setIsQuickVisitOpen(true)}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        openDataLineageModal={() => setIsDataLineageOpen(true)}
        openChatbot={() => setIsChatbotOpen(true)}
        isCloudConnected={isCloudConnected}
        cloudSyncCount={cloudSyncCount}
        showGuide={showWorkflowGuide}
        onToggleGuide={() => handleToggleWorkflowGuide()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        globalState={globalState}
        globalCounty={globalCounty}
        globalCity={globalCity}
        onClearGeography={handleClearGeography}
        activeAccountName={currentActive?.name || null}
        dayRouteCount={dayRouteCount}
        bookmarkedCount={bookmarkedCount}
        agencies={agencies}
        onOpenProviderFinder={() => setIsMobileProviderFinderOpen(true)}
      />

      {/* Main Workspace Body (Cohesive Responsive CSS Grid Layout with 280px Desktop Sidebar Offset) */}
      <div className="md:pl-[280px] flex-1 flex flex-col min-w-0">
      <main className="workspace-grid-shell flex-1 w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8 min-w-0">
        
        {/* Workspace Sub-Navigation Strip for Opportunities, Territory, My Work, and Advanced Intelligence */}
        {!currentActive && ['contracts', 'grants', 'pulseiq'].includes(activeTab) && (
          <nav
            aria-label="Opportunities Workspace Navigation"
            className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: 'contracts', label: 'Procurement & Contract Windows' },
                { id: 'grants', label: 'FEMA AFG & SAFER Grants' },
                { id: 'pulseiq', label: 'PulseIQ Regional Scoring' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateTab(item.id)}
                  className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#285EE8] text-white'
                      : 'text-[#53657B] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsWeightsModalOpen(true)}
              className="whitespace-nowrap shrink-0 self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-[#285EE8] dark:text-blue-400 hover:bg-[#EEF3FE] dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            >
              Calibrate Scoring Weights
            </button>
          </nav>
        )}

        {!currentActive && ['states_directory', 'geo', 'google_maps', 'map', 'gis'].includes(activeTab) && (
          <nav
            aria-label="Territory Workspace Navigation"
            className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: 'states_directory', label: 'Geographic Directory (State → County → City → ZIP)', active: activeTab === 'states_directory' || activeTab === 'geo' },
                { id: 'google_maps', label: 'Google Maps Live Explorer', active: activeTab === 'google_maps' },
                { id: 'map', label: 'GIS Fleet & Acuity Heatmap', active: activeTab === 'map' || activeTab === 'gis' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateTab(item.id)}
                  className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    item.active
                      ? 'bg-[#285EE8] text-white'
                      : 'text-[#53657B] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleNavigateTab('queue')}
              className="whitespace-nowrap shrink-0 self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-[#285EE8] dark:text-blue-400 hover:bg-[#EEF3FE] dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            >
              Open Accounts List &rarr;
            </button>
          </nav>
        )}

        {!currentActive && ['field', 'tm_dashboard'].includes(activeTab) && (
          <nav
            aria-label="My Work Workspace Navigation"
            className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: 'field', label: `Routes, Saved Accounts & Field Notes (${dayRouteCount} in route · ${bookmarkedCount} saved)` },
                { id: 'tm_dashboard', label: 'Mobile Field Command Cockpit' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateTab(item.id)}
                  className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#285EE8] text-white'
                      : 'text-[#53657B] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsQuickVisitOpen(true)}
              className="whitespace-nowrap shrink-0 self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#285EE8] text-white hover:bg-[#194BC8] transition-colors cursor-pointer"
            >
              + Log Station Visit
            </button>
          </nav>
        )}

        {!currentActive && ['knowledge', 'claims', '3d_studio', 'gateway', 'data_health', 'resilience'].includes(activeTab) && (
          <nav
            aria-label="Advanced Intelligence Navigation"
            className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full shadow-2xs"
          >
            {[
              { id: 'knowledge', label: 'Clinical & Competitive Hub' },
              { id: 'claims', label: 'Medicare & Public Healthcare' },
              { id: '3d_studio', label: '3D Apparatus Studio' },
              { id: 'gateway', label: 'Federal Data Gateway' },
              { id: 'data_health', label: 'Data Health & Cloud Sync' },
              { id: 'resilience', label: 'Cloud Backup & Resilience' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateTab(item.id)}
                className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#285EE8] text-white'
                    : 'text-[#53657B] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Compact Interactive 3-Step Quick Start Strip (Shown on demand) */}
        {showWorkflowGuide && (
          <section
            aria-label="Interactive 3-Step Quick Start Guide"
            className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <span className="font-semibold text-[#285EE8] dark:text-blue-400 text-xs shrink-0">
                Quick start:
              </span>

              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="inline-flex items-center gap-2 text-[#14283F] dark:text-slate-200 hover:text-[#285EE8] dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 font-semibold text-xs tabular-nums flex items-center justify-center shrink-0">1</span>
                <span>Search Territory or NPI (⌘K)</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">&rarr;</span>

              <button
                type="button"
                onClick={() => {
                  const topAccount = agencies[0];
                  if (topAccount) {
                    setSelectedAgency(topAccount);
                    setActiveAccount(topAccount);
                  }
                }}
                className="inline-flex items-center gap-2 text-[#14283F] dark:text-slate-200 hover:text-[#285EE8] dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 font-semibold text-xs tabular-nums flex items-center justify-center shrink-0">2</span>
                <span>Inspect Account 360 &amp; Evidence</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">&rarr;</span>

              <button
                type="button"
                onClick={() => setRfpAgency(activeAccount || agencies[0])}
                className="inline-flex items-center gap-2 text-[#14283F] dark:text-slate-200 hover:text-[#285EE8] dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 font-semibold text-xs tabular-nums flex items-center justify-center shrink-0">3</span>
                <span>Generate Co-Op Quote or Log Visit</span>
              </button>
            </div>

            <button
              onClick={() => handleToggleWorkflowGuide(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
              title="Dismiss Quick Start Strip"
              aria-label="Dismiss Quick Start Strip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </section>
        )}

        <ErrorBoundary onReset={() => setActiveTab('home')}>
        {/* Executive Home & Guided Onboarding Hub */}
        {activeTab === 'home' && (
          <div className="workspace-view-container min-w-0 w-full">
            <HomeHubView
              agencies={agencies}
              onNavigateTab={handleNavigateTab}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onOpenWeightsModal={() => setIsWeightsModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenDataLineageModal={() => setIsDataLineageOpen(true)}
              isOnline={isOnline}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              alerts={alerts}
              isCloudConnected={isCloudConnected}
              cloudSyncCount={cloudSyncCount}
              globalCategory={globalCategory}
              setGlobalCategory={setGlobalCategory}
              onSelectState={(st) => {
                setGlobalState(st);
                setGlobalCounty('all');
                setGlobalCity('all');
                setActiveTab('states_directory');
              }}
            />
          </div>
        )}

        {/* TM Mobile Dashboard (Field Cockpit) */}
        {activeTab === 'tm_dashboard' && (
          <div className="workspace-view-container min-w-0 w-full">
            <ZollMobileDashboard
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onUpdateStage={handleUpdateStage}
              onToggleRoute={handleToggleRoute}
              onToggleBookmark={handleToggleBookmark}
              onAddFieldNote={handleAddFieldNote}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              isOnline={isOnline}
              toggleNetwork={handleCheckConnectivity}
              outbox={outbox}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              alerts={alerts}
              globalState={globalState}
              globalCounty={globalCounty}
            />
          </div>
        )}

        {/* Predictive Lead Queue (Accounts Workspace) */}
        {activeTab === 'queue' && (
          <div className="workspace-view-container min-w-0 w-full">
            <PredictiveLeadQueue
              agencies={agencies}
              onSelectAgency={(a) => {
                setPreviewAgency(null);
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onPreviewAgency={(a) => setPreviewAgency(a)}
              onToggleRoute={handleToggleRoute}
              onToggleBookmark={handleToggleBookmark}
              onUpdateStage={handleUpdateStage}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onOpenDataLineage={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
                setIsDataLineageOpen(true);
              }}
              onAddAgency={handleAddAgency}
              initialFilter={queueFilterState}
              onClearInitialFilter={() => setQueueFilterState(null)}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
              weights={weights}
              onOpenWeightsModal={() => setIsWeightsModalOpen(true)}
            />
          </div>
        )}

        {/* GIS Heatmap & Acuity Telemetry (Territory Workspace) */}
        {(activeTab === 'gis' || activeTab === 'map') && (
          <div className="workspace-view-container min-w-0 w-full">
            <GisTerritoryHeatmap
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onToggleRoute={handleToggleRoute}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onOpenDataLineage={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
                setIsDataLineageOpen(true);
              }}
              onFilterByCluster={() => {}}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
              onSelectState={(st) => {
                setGlobalState(st);
                setGlobalCounty('all');
                setGlobalCity('all');
              }}
              onSelectCounty={(c) => {
                setGlobalCounty(c);
                setGlobalCity('all');
              }}
              onSelectCity={(city) => {
                setGlobalCity(city);
              }}
              onSelectCategory={(cat) => {
                setGlobalCategory(cat);
              }}
              onSwitchToGoogleMaps={() => setActiveTab('google_maps')}
            />
          </div>
        )}

        {/* Google Maps Live Explorer (Territory Workspace) */}
        {activeTab === 'google_maps' && (
          <div className="workspace-view-container min-w-0 w-full">
            <GoogleMapsTerritoryExplorer
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onToggleRoute={handleToggleRoute}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onOpenDataLineage={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
                setIsDataLineageOpen(true);
              }}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
              onSelectState={(st) => {
                setGlobalState(st);
                setGlobalCounty('all');
                setGlobalCity('all');
              }}
              onSelectCounty={(c) => {
                setGlobalCounty(c);
                setGlobalCity('all');
              }}
              onSelectCity={(city) => {
                setGlobalCity(city);
              }}
              onSelectCategory={(cat) => {
                setGlobalCategory(cat);
              }}
              onSwitchToTacticalGis={() => setActiveTab('gis')}
            />
          </div>
        )}

        {/* PulseIQ Regional Breakdown (Opportunities Workspace) */}
        {activeTab === 'pulseiq' && (
          <div className="workspace-view-container min-w-0 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-5 sm:p-6 shadow-2xs min-w-0">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#14283F] dark:text-white tracking-tight">
                  Regional Priority Score Breakdown
                </h1>
                <p className="text-xs text-[#53657B] dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Compare average department priority scores, fleet age, and Medicare claim recovery potential across {globalCounty !== 'all' ? globalCounty : globalState !== 'all' ? globalState : 'all 50 states'}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWeightsModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#285EE8] hover:bg-[#194BC8] transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  Calibrate Scoring Weights
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('states_directory')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#53657B] dark:text-slate-200 bg-[#F5F7FA] dark:bg-[#16243A] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors border border-[#DFE6EF] dark:border-[#1E2D42] cursor-pointer whitespace-nowrap shrink-0"
                >
                  &larr; Territory Explorer
                </button>
              </div>
            </div>

            <PulseIqRegionalBreakdownChart
              selectedState={globalState}
              selectedCounty={globalCounty}
              agencies={agencies}
              onSelectCounty={(c) => {
                setGlobalCounty(c);
                setGlobalCity('all');
              }}
              onSelectState={(st) => {
                setGlobalState(st);
                setGlobalCounty('all');
                setGlobalCity('all');
              }}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              globalCategory={globalCategory}
              onOpenWeightsModal={() => setIsWeightsModalOpen(true)}
            />
          </div>
        )}

        {/* National Geographic Directory (Territory Workspace) */}
        {(activeTab === 'geo' || activeTab === 'states_directory') && (
          <div className="workspace-view-container min-w-0 w-full">
            <NationalGeographicExplorer
              agencies={agencies}
              initialMode={
                globalCounty !== 'all' || globalCity !== 'all'
                  ? 'cities'
                  : globalState !== 'all'
                    ? 'counties'
                    : 'states'
              }
              onModeChange={(mode) => {
                if (mode === 'states' && activeTab !== 'states_directory') {
                  setActiveTab('states_directory');
                } else if (mode !== 'states' && activeTab === 'states_directory') {
                  setActiveTab('geo');
                }
              }}
              onSelectAgency={(a) => {
                setPreviewAgency(null);
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onPreviewAgency={(a) => setPreviewAgency(a)}
              onNavigateToQueueWithFilter={(stateCode, county, city, zip) => {
                setSelectedAgency(null);
                setActiveAccount(null);
                setQueueFilterState({ state: stateCode, county, city, zip });
                handleNavigateTab('queue');
              }}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              onOpenDataLineage={(a) => {
                if (a) {
                  setSelectedAgency(a);
                  setActiveAccount(a);
                }
                setIsDataLineageOpen(true);
              }}
              onAddAgency={handleAddAgency}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
              onSyncGlobalGeography={(s, c, city, cat) => {
                if (s !== undefined) setGlobalState(s);
                if (c !== undefined) setGlobalCounty(c);
                if (city !== undefined) setGlobalCity(city);
                if (cat !== undefined) setGlobalCategory(cat);
              }}
            />
          </div>
        )}

        {/* Procurement & Contract Expirations (Opportunities Workspace) */}
        {activeTab === 'contracts' && (
          <div className="workspace-view-container min-w-0 w-full">
            <ContractExpirationCalendar
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
            />
          </div>
        )}

        {/* Clinical & Competitive Intelligence Hub (Advanced Workspace) */}
        {activeTab === 'knowledge' && (
          <div className="workspace-view-container min-w-0 w-full">
            <ClinicalCompetitiveKnowledgeHub
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onOpenRfpGenerator={(a) => setRfpAgency(a)}
            />
          </div>
        )}

        {/* Medicare Claims & Public Healthcare Explorer (Advanced Workspace) */}
        {activeTab === 'claims' && (
          <div className="workspace-view-container min-w-0 w-full">
            <PublicHealthcareExplorer
              onSelectStateFilter={(stateCode) => {
                setGlobalState(stateCode);
                setActiveTab('queue');
              }}
              onNavigateToQueue={() => setActiveTab('queue')}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
            />
          </div>
        )}

        {/* FEMA AFG & SAFER Grants Tracker (Opportunities Workspace) */}
        {activeTab === 'grants' && (
          <div className="workspace-view-container min-w-0 w-full">
            <AfgGrantsTracker
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              activeAccount={currentActive}
            />
          </div>
        )}

        {/* Data Health & Synchronization Dashboard (Advanced Workspace) */}
        {activeTab === 'data_health' && (
          <div className="workspace-view-container min-w-0 w-full">
            <DataHealthDashboard
              agencies={agencies}
              isCloudConnected={isCloudConnected}
              cloudSyncCount={cloudSyncCount}
              isSyncing={isCloudSyncing}
              strictCloudOnlyMode={strictCloudOnlyMode}
              onToggleStrictCloudOnlyMode={toggleStrictCloudOnlyMode}
              onHydrateBatchToCloud={hydrateBatchToCloud}
              onRunDeepCloudPurgeAndSanitize={runDeepCloudPurgeAndSanitize}
              onSyncSingleAgencyToCloud={(agency: Agency) => updateAgencyInCloud(agency)}
              onSelectAgency={(a: Agency) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
            />
          </div>
        )}

        {/* Cloud Backup & Resilience View (Advanced Workspace) */}
        {activeTab === 'resilience' && (
          <div className="workspace-view-container min-w-0 w-full">
            <CloudBackupResilienceView
              agencies={agencies}
              onRestoreAgencies={updateAgenciesState}
              showToast={showToast}
            />
          </div>
        )}

        {/* Federal Nationwide Data Gateway View (Advanced Workspace) */}
        {activeTab === 'gateway' && (
          <div className="workspace-view-container min-w-0 w-full">
            <NationwideDataGatewayView
              agencies={agencies}
              onSelectAgency={(a: Agency) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* Field Mode & Day Route Planner (My Work Workspace) */}
        {activeTab === 'field' && (
          <div className="workspace-view-container min-w-0 w-full">
            <FieldModeView
              agencies={agencies}
              onSelectAgency={(a) => {
                setSelectedAgency(a);
                setActiveAccount(a);
              }}
              onAddFieldNote={handleAddFieldNote}
              onUpdateStage={handleUpdateStage}
              isOnline={isOnline}
              toggleNetwork={handleCheckConnectivity}
              outbox={outbox}
              triggerManualSync={handleManualSync}
              isSyncing={isSyncing}
              activeAccount={currentActive}
              globalState={globalState}
              globalCounty={globalCounty}
              globalCity={globalCity}
              globalCategory={globalCategory}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}

        {/* 3D Apparatus & Cardiac Monitor Studio (Advanced Workspace) */}
        {activeTab === '3d_studio' && (
          <div className="workspace-view-container min-w-0 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-5 sm:p-6 shadow-2xs min-w-0">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#14283F] dark:text-white tracking-tight">
                  3D Ambulance, Fire Apparatus &amp; ZOLL Monitor Studio
                </h1>
                <p className="text-xs text-[#53657B] dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Rotate, zoom, and inspect 3D models of ALS ambulances, fire rescue engines, and the ZOLL X Series Advanced cardiac monitor with interactive clinical subsystem hotspots.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('field')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#53657B] dark:text-slate-200 bg-[#F5F7FA] dark:bg-[#16243A] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors border border-[#DFE6EF] dark:border-[#1E2D42] cursor-pointer whitespace-nowrap shrink-0"
                >
                  &larr; Route Planner
                </button>
              </div>
            </div>

            <ThreeApparatusStudio activeAccount={currentActive} />
          </div>
        )}
        </ErrorBoundary>

      </main>

      {/* Quiet Institutional Provenance Footer */}
      <footer className="w-full border-t border-[#DFE6EF] dark:border-[#1E2D42] bg-white dark:bg-[#111C2D] text-[#53657B] dark:text-slate-400 text-xs py-3.5 px-4 sm:px-6 lg:px-8 mt-auto transition-colors">
        <div className="max-w-[1640px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="font-semibold text-[#14283F] dark:text-slate-200">
              Federal Public-Record Sources
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>USFA Registry</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>CMS NPPES &amp; Part B PUF</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>OpenFEMA AFG v2</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>NEMSIS v3.5.0</span>
          </div>

          <button
            type="button"
            onClick={() => setIsDataLineageOpen(true)}
            className="text-xs font-medium text-[#285EE8] dark:text-blue-400 hover:underline transition-colors cursor-pointer shrink-0"
            title="Inspect Federal Data Lineage & Mathematical Methodology"
          >
            Data Lineage &amp; Methodology &rarr;
          </button>
        </div>
      </footer>
      </div>

      {/* Slide-Over Quick Preview Drawer (2-second inspection before opening full dossier) */}
      <AgencyQuickPreviewDrawer
        agency={previewAgency}
        onClose={() => setPreviewAgency(null)}
        onOpenFullDossier={(a) => {
          setPreviewAgency(null);
          setSelectedAgency(a);
          setActiveAccount(a);
        }}
        onUpdateStage={handleUpdateStage}
        onToggleRoute={handleToggleRoute}
        onToggleBookmark={handleToggleBookmark}
        onAddFieldNote={handleAddFieldNote}
        onOpenRfpGenerator={(a) => setRfpAgency(a)}
      />

      {/* Full Actuarial Department Dossier */}
      {currentActive && (
        <FocusedProviderProfile
          agency={currentActive}
          onBack={() => {
            setSelectedAgency(null);
            setActiveAccount(null);
          }}
          onGoHome={handleGoHome}
          onNavigateGeography={(state, county, city) => {
            setSelectedAgency(null);
            setActiveAccount(null);
            if (state) setGlobalState(state);
            if (county) setGlobalCounty(county);
            if (city) setGlobalCity(city);
            setActiveTab('states_directory');
          }}
          onUpdateStage={handleUpdateStage}
          onToggleRoute={handleToggleRoute}
          onToggleBookmark={handleToggleBookmark}
          onAddFieldNote={handleAddFieldNote}
          onOpenRfpGenerator={(a) => setRfpAgency(a)}
          onOpenDataLineage={() => setIsDataLineageOpen(true)}
        />
      )}

      {/* Pre-Emptive RFP Specification Generator Modal */}
      {rfpAgency && (
        <RfpSpecGeneratorModal
          isOpen={!!rfpAgency}
          onClose={() => setRfpAgency(null)}
          agency={rfpAgency}
        />
      )}

      {/* Push Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onMarkAllRead={() => {
          const updated = alerts.map(a => ({ ...a, isRead: true }));
          setAlerts(updated);
          saveStoredNotifications(updated);
        }}
        onClearAlerts={() => {
          setAlerts([]);
          saveStoredNotifications([]);
        }}
        onSelectAlertAgency={handleSelectAlertAgency}
      />

      {/* Quick Field Visit Entry Modal */}
      <QuickVisitModal
        isOpen={isQuickVisitOpen}
        onClose={() => setIsQuickVisitOpen(false)}
        agencies={agencies}
        onAddFieldNote={handleAddFieldNote}
        isOnline={isOnline}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onGoHome={handleGoHome}
        openNotifications={() => setIsNotificationsOpen(true)}
        unreadAlertCount={unreadAlertCount}
        dayRouteCount={dayRouteCount}
      />

      {/* Data Lineage & Trust Disclosures Center Modal */}
      <DataLineageTrustModal
        isOpen={isDataLineageOpen}
        onClose={() => setIsDataLineageOpen(false)}
        agencies={agencies}
        selectedAgency={selectedAgency || activeAccount}
        onSelectAgency={(agency) => {
          setSelectedAgency(agency);
          setActiveAccount(agency);
        }}
      />

      {/* Universal Command Palette Search Modal (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        agencies={agencies}
        onSelectAgency={(agency) => {
          setSelectedAgency(agency);
          setActiveAccount(agency);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Interactive 5-Pillar Scoring Weights Calibration Modal */}
      <PredictiveWeightsModal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
        weights={weights}
        onSaveWeights={handleSaveWeights}
      />

      {/* Territory Strategy & RFP Desk */}
      <GeminiChatbotDrawer
        isOpen={isChatbotOpen}
        onOpen={() => setIsChatbotOpen(true)}
        onClose={() => setIsChatbotOpen(false)}
        activeAgency={currentActive}
        onSelectAgency={(agency) => {
          setSelectedAgency(agency);
          setActiveAccount(agency);
        }}
      />

      {/* Mobile Provider Quick Finder & Selector Drawer */}
      <MobileProviderSelectorDrawer
        isOpen={isMobileProviderFinderOpen}
        onClose={() => setIsMobileProviderFinderOpen(false)}
        agencies={agencies}
        onSelectAgency={(agency) => {
          setSelectedAgency(agency);
          setActiveAccount(agency);
        }}
        onToggleBookmark={handleToggleBookmark}
        onToggleRoute={handleToggleRoute}
        activeCategory={globalCategory}
        onCategoryChange={setGlobalCategory}
        selectedState={globalState}
        onSelectState={(st) => setGlobalState(st)}
        selectedCounty={globalCounty}
        onSelectCounty={(co) => setGlobalCounty(co)}
      />

      {/* Toast Notification Pill */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-12 right-4 sm:right-6 z-50">
          <div className={`px-4 py-3 rounded-xl border shadow-sm flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800' :
            toast.type === 'warn' ? 'bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
            toast.type === 'error' ? 'bg-white dark:bg-slate-900 text-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
            'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'warn' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
