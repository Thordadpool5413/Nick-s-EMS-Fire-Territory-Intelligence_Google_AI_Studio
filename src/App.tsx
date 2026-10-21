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
import { TerritoryMapView } from './components/TerritoryMapView';
import { PublicHealthcareExplorer } from './components/PublicHealthcareExplorer';
import { AfgGrantsTracker } from './components/AfgGrantsTracker';
import { FieldModeView } from './components/FieldModeView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PredictiveWeightsModal } from './components/PredictiveWeightsModal';
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
import { ClinicalCompetitiveKnowledgeHub } from './components/ClinicalCompetitiveKnowledgeHub';
import { ZollMobileDashboard } from './components/ZollMobileDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFirestoreAgencies } from './hooks/useFirestoreAgencies';
import { CheckCircle2, AlertCircle, Globe, ListOrdered, Scale, Car, X, Siren, Flame, LayoutDashboard } from 'lucide-react';

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
    updateStageInCloud,
    toggleRouteInCloud,
    toggleBookmarkInCloud,
    addFieldNoteInCloud,
    addAgencyToCloud,
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
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(false);

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
  
  // Navigation & Modals - Open with Step 1: 50-State Territory Explorer by default
  const [activeTab, setActiveTab] = useState<string>('states_directory');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [rfpAgency, setRfpAgency] = useState<Agency | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isWeightTunerOpen, setIsWeightTunerOpen] = useState<boolean>(false);
  const [isQuickVisitOpen, setIsQuickVisitOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isDataLineageOpen, setIsDataLineageOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

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

  const handleSaveWeights = useCallback((newWeights: PredictiveWeights) => {
    setWeights(newWeights);
    saveStoredWeights(newWeights);

    setAgenciesState(prev => {
      const updated = prev.map(a => {
        const newScore = calculateScore(a, newWeights);
        return {
          ...a,
          zollOpportunity: {
            ...a.zollOpportunity,
            pulseIqScore: newScore
          }
        };
      });
      saveAgencies(updated);
      return updated;
    });

    setSelectedAgency(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        zollOpportunity: {
          ...prev.zollOpportunity,
          pulseIqScore: calculateScore(prev, newWeights)
        }
      };
    });

    setActiveAccount(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        zollOpportunity: {
          ...prev.zollOpportunity,
          pulseIqScore: calculateScore(prev, newWeights)
        }
      };
    });

    showToast('PulseIQ formula updated & recalculated across all accounts.', 'success');
  }, [showToast, setAgenciesState, setSelectedAgency, setActiveAccount]);

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
    setIsOnline(prev => {
      const next = !prev;
      showToast(next ? 'Online Mode restored. Reconnecting to cloud...' : 'Simulating field offline mode (No internet).', next ? 'success' : 'warn');
      return next;
    });
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
  const currentActive = activeAccount || selectedAgency;

  const handleGoHome = useCallback(() => {
    setSelectedAgency(null);
    setActiveAccount(null);
    setRfpAgency(null);
    setIsWeightTunerOpen(false);
    setIsQuickVisitOpen(false);
    setIsCommandPaletteOpen(false);
    setIsDataLineageOpen(false);
    setIsChatbotOpen(false);
    setIsNotificationsOpen(false);
    setActiveTab('tm_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateTab = useCallback((tab: string) => {
    setSelectedAgency(null);
    setActiveAccount(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const workflowSteps = [
    {
      step: '★ Field',
      title: 'TM Field Cockpit',
      subtitle: 'Mobile dashboard & telemetry',
      tabId: 'tm_dashboard',
      icon: LayoutDashboard,
      isActive: activeTab === 'tm_dashboard'
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
      isActive: ['field', '3d_studio'].includes(activeTab)
    }
  ];

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDarkMode ? 'dark bg-[#090D16] text-slate-100' : 'bg-[#F8F7F4] text-[#111827]'} flex flex-col font-sans pb-16 md:pb-0 transition-colors duration-150`}>
      
      {/* Top Navigation Bar */}
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
        openWeightTuner={() => setIsWeightTunerOpen(true)}
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
            className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-3.5 sm:px-5 shadow-[0_1px_2px_rgba(17,24,39,0.03)]"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider text-[11px]">
                  Guided Workflow
                </span>
                <span className="text-[#D4D2CD] dark:text-slate-700" aria-hidden="true">·</span>
                <span className="text-[#374151] dark:text-slate-300">
                  Follow these steps to explore territory accounts, manage priority opportunities, build savings proposals, and navigate field visits:
                </span>
              </div>
              <button
                onClick={() => setShowWorkflowGuide(false)}
                className="text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:white flex items-center gap-1 shrink-0 cursor-pointer"
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
                        ? 'bg-[#1E3A8A]/[0.06] dark:bg-blue-950/40 border-[#1E3A8A] dark:border-blue-500 shadow-2xs'
                        : 'bg-[#F8F7F4]/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-[#E5E4DF] dark:border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        ws.isActive ? 'bg-[#1E3A8A] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-[#374151] dark:text-slate-300 border border-[#E5E4DF] dark:border-slate-600'
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

        <ErrorBoundary onReset={() => setActiveTab('states_directory')}>
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
          />
        )}

        {activeTab === 'gis' && (
          <GisTerritoryHeatmap
            agencies={agencies}
            onSelectAgency={(a) => {
              setSelectedAgency(a);
              setActiveAccount(a);
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
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-3 bg-white border border-[#E5E4DF] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.03)] min-w-0">
              <div>
                <div className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] inline-block" />
                  Regional Priority Score Comparison
                </div>
                <h1 className="text-xl font-bold text-[#111827] mt-0.5 tracking-tight">
                  Regional Priority Score Breakdown
                </h1>
                <p className="text-xs text-[#374151] mt-1 max-w-2xl leading-relaxed">
                  Compare average department priority scores, fleet age, and Medicare claim recovery potential across {globalCounty !== 'all' ? globalCounty : globalState !== 'all' ? globalState : 'all 50 states'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('states_directory')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#111827] bg-[#F1EFEA] hover:bg-[#E5E4DF] transition-colors flex items-center gap-1.5 border border-[#E5E4DF] cursor-pointer"
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
              onOpenWeightTuner={() => setIsWeightTunerOpen(true)}
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

        {activeTab === 'map' && (
          <TerritoryMapView
            agencies={agencies}
            onSelectAgency={(a) => {
              setSelectedAgency(a);
              setActiveAccount(a);
            }}
            onToggleRoute={handleToggleRoute}
            globalState={globalState}
            globalCounty={globalCounty}
            globalCity={globalCity}
            globalCategory={globalCategory}
            activeAccount={currentActive}
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
          <CloudBackupResilienceView
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
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-3 bg-white border border-[#E5E4DF] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.03)] min-w-0">
              <div>
                <div className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] inline-block" />
                  Interactive 3D Equipment &amp; Fleet Demonstration
                </div>
                <h1 className="text-xl font-bold text-[#111827] mt-0.5 tracking-tight">
                  3D Ambulance, Fire Apparatus &amp; ZOLL Monitor Studio
                </h1>
                <p className="text-xs text-[#374151] mt-1 max-w-2xl leading-relaxed">
                  Rotate, zoom, and inspect 3D models of ALS ambulances, fire rescue engines, and the ZOLL X Series Advanced cardiac monitor during on-site department demonstrations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('field')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#111827] bg-[#F1EFEA] hover:bg-[#E5E4DF] transition-colors flex items-center gap-1.5 border border-[#E5E4DF] cursor-pointer"
                >
                  <span>&larr; Back to Route Itinerary</span>
                </button>
                <button
                  onClick={() => setIsChatbotOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#111827] hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
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

      {/* Slide-Over Department Profile Drawer (Preserves user's place in the workspace) */}
      {currentActive && (
        <FocusedProviderProfile
          agency={currentActive}
          onBack={() => {
            setSelectedAgency(null);
            setActiveAccount(null);
          }}
          onGoHome={handleGoHome}
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

      {/* Predictive Weights Tuner Modal */}
      <PredictiveWeightsModal
        isOpen={isWeightTunerOpen}
        onClose={() => setIsWeightTunerOpen(false)}
        weights={weights}
        onSaveWeights={handleSaveWeights}
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
        onOpenWeightTuner={() => setIsWeightTunerOpen(true)}
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

      {/* Toast Notification Pill */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
          <div className={`px-4 py-3 rounded-xl border shadow-sm flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-white text-[#111827] border-[#E5E4DF]' :
            toast.type === 'warn' ? 'bg-white text-amber-950 border-amber-200' :
            toast.type === 'error' ? 'bg-white text-rose-950 border-rose-200' :
            'bg-white text-[#111827] border-[#E5E4DF]'
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
