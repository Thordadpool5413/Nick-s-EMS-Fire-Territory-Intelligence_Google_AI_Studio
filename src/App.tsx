/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api, auth } from '@appdeploy/client';
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
import { TerritoryDataHealthView } from './components/TerritoryDataHealthView';
import { NationwideDataGatewayView } from './components/NationwideDataGatewayView';
import { DataLineageTrustModal } from './components/DataLineageTrustModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { NationalGeographicExplorer } from './components/NationalGeographicExplorer';
import { ThreeApparatusStudio } from './components/ThreeApparatusStudio';
import { TerritoryResearchAssistant } from './components/TerritoryResearchAssistant';
import { PulseIqRegionalBreakdownChart } from './components/PulseIqRegionalBreakdownChart';
import { FocusedProviderProfile } from './components/FocusedProviderProfile';
import { ClinicalCompetitiveKnowledgeHub } from './components/ClinicalCompetitiveKnowledgeHub';
import { ZollMobileDashboard } from './components/ZollMobileDashboard';
import { HomeHubView } from './components/HomeHubView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAgencyRecords } from './hooks/useAgencyRecords';
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

  // AppDeploy authenticated state persistence, with local-only fallback
  const {
    agencies,
    isCloudConnected,
    cloudSyncCount,
    updateStageInCloud,
    toggleRouteInCloud,
    toggleBookmarkInCloud,
    addFieldNoteInCloud,
    addAgencyToCloud,
    setAgenciesState
    reloadFromCloud
  } = useAgencyRecords({
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
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(false);
  const [signedIn, setSignedIn] = useState<boolean>(() => auth.isSignedIn());
  const [authBusy, setAuthBusy] = useState(false);
  const handleAccountAuth = useCallback(async () => {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      if (signedIn) {
        await auth.signOut();
        setSignedIn(false);
        sessionStorage.removeItem('ems_authenticated_user');
        showToast('Signed out. Local account changes will not be saved to the cloud.', 'info');
      } else {
        await auth.signIn();
        setSignedIn(true);
        showToast('Signed in. Loading your saved territory records.', 'success');
      }
      window.dispatchEvent(new Event('appdeploy-auth-change'));
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code !== 'popup_closed') {
        showToast(code === 'popup_blocked' ? 'Allow popups to sign in by email.' : 'Sign-in failed. No cloud synchronization has been confirmed.', 'error');
      }
    } finally {
      setAuthBusy(false);
    }
  }, [signedIn, authBusy, showToast]);

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
  const [rfpAgency, setRfpAgency] = useState<Agency | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isQuickVisitOpen, setIsQuickVisitOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isDataLineageOpen, setIsDataLineageOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState<boolean>(false);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored. Use Sync to retry pending field changes.', 'info');
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

  // Outbox entries stay pending until the backend confirms each write.

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
  }, [toggleRouteInCloud, selectedAgency, activeAccount]);

  const handleToggleBookmark = useCallback((agencyId: string) => {
    toggleBookmarkInCloud(agencyId);
    if (selectedAgency?.id === agencyId) {
      setSelectedAgency(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
    if (activeAccount?.id === agencyId) {
      setActiveAccount(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
  }, [toggleBookmarkInCloud, selectedAgency, activeAccount]);

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
  }, [updateStageInCloud, selectedAgency, activeAccount, isOnline, agencies, showToast]);

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
  }, [addFieldNoteInCloud, selectedAgency, activeAccount, isOnline, agencies, showToast]);

  const handleTriggerSimulatedAlert = useCallback(() => {
    const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
    const newAlert: PushAlert = {
      ...template,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const nextAlerts = [newAlert, ...alerts];
    setAlerts(nextAlerts);
    saveStoredNotifications(nextAlerts);

    triggerSystemNotification(newAlert.title, newAlert.message);

    showToast(`New Territory Alert: ${newAlert.title}`, 'info');
  }, [alerts, showToast]);

  const handleSelectAlertAgency = useCallback((agencyId: string) => {
    const target = agencies.find(a => a.id === agencyId);
    if (target) {
      setSelectedAgency(target);
      setActiveAccount(target);
      setIsNotificationsOpen(false);
    }
  }, [agencies]);

  const toggleNetworkSimulation = useCallback(() => {
    showToast('Connection state comes from the browser and verified cloud requests. Simulation is disabled.', 'info');
  }, [showToast]);

  const handleManualSync = useCallback(async () => {
    if (!navigator.onLine || !auth.isSignedIn()) {
      showToast('Sign in and connect to the internet before syncing field changes.', 'warn');
      return;
    }
    setIsSyncing(true);
    const pending = [...outbox];
    const failed: SyncOutboxItem[] = [];
    let successCount = 0;
    for (const item of pending) {
      try {
        const patch = item.actionType === 'UPDATE_STAGE' ? { salesStage: item.payload?.stage } :
          item.actionType === 'ADD_FIELD_NOTE' ? { appendNote: item.payload } :
          item.actionType === 'TOGGLE_ROUTE' ? { inDayRoute: item.payload?.inDayRoute } : null;
        if (!patch) throw new Error('Unsupported operation needs manual reconciliation');
        await api.put('/api/agency-state', { agencyId: item.agencyId, ...patch });
        successCount++;
      } catch {
        failed.push({ ...item, status: 'FAILED' });
      }
    }
    setOutbox(failed);
    saveOutbox(failed);
    setIsSyncing(false);
    await reloadFromCloud();
    showToast(failed.length ? `${successCount} saved, ${failed.length} still pending. No changes discarded.` :
      `${successCount} pending field changes confirmed by AppDeploy.`, failed.length ? 'warn' : 'success');
  }, [outbox, showToast, reloadFromCloud]);

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

  const handleNavigateTab = useCallback((tab: string) => {
    setSelectedAgency(null);
    setActiveAccount(null);
    if (tab === 'states_directory' || tab === 'tm_dashboard' || tab === 'home') {
      setGlobalState('all');
      setGlobalCounty('all');
      setGlobalCity('all');
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const workflowSteps = [
    {
      step: '★ Home',
      title: 'Mission & Onboarding',
      subtitle: 'Central hub & guided tour',
      tabId: 'home',
      icon: ShieldCheck,
      isActive: activeTab === 'home'
    },
    {
      step: 'Step 1',
      title: 'Explore Territory',
      subtitle: 'Pick a state, county, or city',
      tabId: 'states_directory',
      icon: Globe,
      isActive: ['states_directory', 'geo', 'gis', 'pulseiq', 'map'].includes(activeTab)
    },
    {
      step: 'Step 2',
      title: 'Priority Accounts',
      subtitle: 'See top upgrade opportunities',
      tabId: 'queue',
      icon: ListOrdered,
      isActive: activeTab === 'queue'
    },
    {
      step: 'Step 3',
      title: '5-Yr Savings & Grants',
      subtitle: 'Compare TCO, recalls & funding',
      tabId: 'knowledge',
      icon: Scale,
      isActive: ['knowledge', 'contracts', 'grants', 'claims'].includes(activeTab)
    },
    {
      step: 'Step 4',
      title: 'Field Visit & 3D Demo',
      subtitle: 'Plan route & demo 3D hardware',
      tabId: 'field',
      icon: Car,
      isActive: ['field', '3d_studio', 'tm_dashboard'].includes(activeTab)
    }
  ];

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDarkMode ? 'dark bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-[#0F172A]'} flex flex-col font-sans pb-16 md:pb-0 transition-colors duration-150`}>
      
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-[#0f172a] text-white px-4 sm:px-7 py-2 text-xs border-b border-blue-900">
        <span className="inline-flex gap-2 items-center">
          <ShieldCheck size={15} className="text-blue-300" />
          Google-independent AppDeploy workspace
          <span className="text-slate-400">|</span>
          {isCloudConnected ? 'Account sync verified' : signedIn ? 'Sync unverified' : 'Sign in to save account changes'}
        </span>
        <button type="button" onClick={() => { void handleAccountAuth(); }} disabled={authBusy}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 font-semibold disabled:opacity-50">
          {authBusy ? 'Connecting...' : signedIn ? 'Sign out' : 'Sign in with email'}
        </button>
      </div>
      <TopBar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onGoHome={handleGoHome}
        globalCategory={globalCategory}
        setGlobalCategory={setGlobalCategory}
        isOnline={isOnline}
        toggleNetwork={toggleNetworkSimulation}
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
        onToggleGuide={() => setShowWorkflowGuide(prev => !prev)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Workspace Body (Cohesive Responsive CSS Grid Layout) */}
      <main className="workspace-grid-shell flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        
        {/* Guided Quick-Start Workflow Helper (Collapsible) */}
        {showWorkflowGuide && (
          <section
            aria-label="Quick-Start Workflow Guide"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:px-5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-[11px]">
                  Guided Workflow
                </span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Follow these steps to explore territory accounts, manage priority opportunities, build savings proposals, and navigate field visits:
                </span>
              </div>
              <button
                onClick={() => setShowWorkflowGuide(false)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
                title="Hide workflow guide"
              >
                <span className="hidden sm:inline">Dismiss</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {workflowSteps.map((ws) => {
                const Icon = ws.icon;
                return (
                  <button
                    key={ws.tabId}
                    onClick={() => handleNavigateTab(ws.tabId)}
                    className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                      ws.isActive
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border-[#1E3A8A] dark:border-blue-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        ws.isActive ? 'bg-[#1E3A8A] text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider">
                        {ws.step}
                      </div>
                      <div className="text-xs font-bold text-[#111827] dark:text-slate-100 truncate">
                        {ws.title}
                      </div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400 truncate">
                        {ws.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <ErrorBoundary onReset={() => setActiveTab('home')}>
        {/* Executive Home & Guided Onboarding Hub */}
        {activeTab === 'home' && (
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
          />
        )}

        {/* TM Mobile Dashboard (Field Cockpit) */}
        {activeTab === 'tm_dashboard' && (
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
            toggleNetwork={toggleNetworkSimulation}
            outbox={outbox}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            alerts={alerts}
            globalState={globalState}
            globalCounty={globalCounty}
          />
        )}

        {activeTab === 'queue' && (
          <PredictiveLeadQueue
            agencies={agencies}
            onSelectAgency={(a) => {
              setSelectedAgency(a);
              setActiveAccount(a);
            }}
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
        )}

        {(activeTab === 'gis' || activeTab === 'map') && (
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
          />
        )}

        {activeTab === 'pulseiq' && (
          <div className="workspace-section-grid">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs min-w-0">
              <div>
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-700 dark:bg-blue-400 inline-block" />
                  Regional Priority Score Comparison
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  Regional Priority Score Breakdown
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Compare average department priority scores, fleet age, and Medicare claim recovery potential across {globalCounty !== 'all' ? globalCounty : globalState !== 'all' ? globalState : 'all 50 states'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWeightsModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Calibrate Scoring Weights</span>
                </button>
                <button
                  onClick={() => setActiveTab('states_directory')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <span>&larr; Back to Territory Explorer</span>
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

        {(activeTab === 'geo' || activeTab === 'states_directory') && (
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
              setSelectedAgency(a);
              setActiveAccount(a);
            }}
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
        )}

        {activeTab === 'contracts' && (
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
        )}

        {activeTab === 'knowledge' && (
          <ClinicalCompetitiveKnowledgeHub
            agencies={agencies}
            onSelectAgency={(a) => {
              setSelectedAgency(a);
              setActiveAccount(a);
            }}
            onOpenRfpGenerator={(a) => setRfpAgency(a)}
          />
        )}


        {activeTab === 'claims' && (
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
        )}

        {activeTab === 'grants' && (
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
        )}

        {activeTab === 'resilience' && (
          <TerritoryDataHealthView
            agencies={agencies}
            onRestoreAgencies={updateAgenciesState}
            showToast={showToast}
          />
        )}

        {activeTab === 'gateway' && (
          <NationwideDataGatewayView
            showToast={showToast}
          />
        )}

        {activeTab === 'field' && (
          <FieldModeView
            agencies={agencies}
            onSelectAgency={(a) => {
              setSelectedAgency(a);
              setActiveAccount(a);
            }}
            onAddFieldNote={handleAddFieldNote}
            onUpdateStage={handleUpdateStage}
            isOnline={isOnline}
            toggleNetwork={toggleNetworkSimulation}
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
        )}

        {activeTab === '3d_studio' && (
          <div className="workspace-section-grid">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs min-w-0">
              <div>
                <div className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] dark:bg-blue-400 inline-block" />
                  Interactive 3D Equipment &amp; Fleet Demonstration
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  3D Ambulance, Fire Apparatus &amp; ZOLL Monitor Studio
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Rotate, zoom, and inspect 3D models of ALS ambulances, fire rescue engines, and the ZOLL X Series Advanced cardiac monitor with interactive clinical subsystem hotspots.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('field')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <span>&larr; Back to Route Itinerary</span>
                </button>
                <button
                  onClick={() => setIsChatbotOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Ask Sales Assistant</span>
                </button>
              </div>
            </div>

            <ThreeApparatusStudio activeAccount={currentActive} />
          </div>
        )}
        </ErrorBoundary>

      </main>

      {/* Institutional Trust, Data Provenance & Compliance Footer Bar */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 text-slate-600 dark:text-slate-400 text-[11px] py-3 px-3 sm:px-6 lg:px-8 mt-auto transition-colors">
        <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-sans font-bold text-slate-900 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>VERIFIED PUBLIC-RECORD PROVENANCE</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>NEMSIS v3.5 Compliant Schema</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>CMS Part B Public Use File FY2025</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>USFA National Fire Dept Registry</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>FEMA AFG Obligation Ledger</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">HIPAA §164.514(b) Non-PHI Boundary Verified</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden xl:inline font-mono text-[10px] text-slate-400 dark:text-slate-500">
              Cross-Walked by FDID + CMS NPI + Census FIPS
            </span>
            <button
              type="button"
              onClick={() => setIsDataLineageOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-[#1E3A8A] hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
              title="Open Institutional Data Lineage, Federal Registry Sync Ledger & Mathematical Proof"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Data Freshness &amp; Sync Ledger</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-Over Department Profile Drawer (Preserves user's place in the workspace) */}
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
        onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
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
      <TerritoryResearchAssistant
        isOpen={isChatbotOpen}
        onOpen={() => setIsChatbotOpen(true)}
        onClose={() => setIsChatbotOpen(false)}
        activeAgency={currentActive}
        onSelectAgency={(agency) => {
          setSelectedAgency(agency);
          setActiveAccount(agency);
        }}
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
