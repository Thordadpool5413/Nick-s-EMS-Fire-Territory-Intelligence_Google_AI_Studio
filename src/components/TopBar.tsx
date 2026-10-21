/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import brandLogoAsset from '../assets/images/nicks_ems_logo_1792367124466.jpg';
import { UserRole } from '../types';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sliders, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  ChevronDown, 
  Search, 
  ShieldCheck, 
  Cloud, 
  Bot, 
  HelpCircle, 
  Moon, 
  Sun,
  LayoutDashboard,
  Compass,
  MapPin,
  BarChart3,
  Users,
  PiggyBank,
  Car,
  Siren,
  Flame,
  Home
} from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGoHome?: () => void;
  globalCategory: 'all' | 'ems' | 'fire';
  setGlobalCategory: (category: 'all' | 'ems' | 'fire') => void;
  isOnline: boolean;
  toggleNetwork: () => void;
  pendingSyncCount: number;
  isSyncing: boolean;
  triggerManualSync: () => void;
  unreadAlertCount: number;
  openNotifications: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  openWeightTuner: () => void;
  openQuickVisitModal: () => void;
  openCommandPalette?: () => void;
  openDataLineageModal?: () => void;
  openChatbot?: () => void;
  isCloudConnected?: boolean;
  cloudSyncCount?: number;
  showGuide?: boolean;
  onToggleGuide?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onGoHome,
  globalCategory,
  setGlobalCategory,
  isOnline,
  toggleNetwork,
  pendingSyncCount,
  isSyncing,
  triggerManualSync,
  unreadAlertCount,
  openNotifications,
  currentRole,
  setCurrentRole,
  openWeightTuner,
  openQuickVisitModal,
  openCommandPalette,
  openDataLineageModal,
  openChatbot,
  isCloudConnected,
  cloudSyncCount = 0,
  showGuide,
  onToggleGuide,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(brandLogoAsset || '/logo.jpg');
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  // Close system menu on Escape key
  useEffect(() => {
    if (!systemMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSystemMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [systemMenuOpen]);

  const roles: UserRole[] = [
    'Territory Manager',
    'Regional Sales Director',
    'Clinical Deployment Specialist',
    'Sales Operations Admin'
  ];

  // Unified Single-Tier Workspace Navigation without duplication
  const navItems = [
    {
      id: 'tm_dashboard',
      label: 'Home Cockpit',
      shortLabel: 'Home',
      icon: Home,
      description: 'Primary Home Screen: Mobile-first field cockpit with priority territory leads and live telemetry',
      childIds: ['tm_dashboard', 'home']
    },
    {
      id: 'states_directory',
      label: 'Territory Explorer',
      shortLabel: 'Explorer',
      icon: Compass,
      description: 'Interactive map and directory of all 50 states, 3,144 counties & cities',
      childIds: ['states_directory', 'geo']
    },
    {
      id: 'gis',
      label: 'GIS Heatmap',
      shortLabel: 'Heatmap',
      icon: MapPin,
      description: 'Cardiac arrest clusters, Utstein survival deficits & transport latency',
      childIds: ['gis', 'map']
    },
    {
      id: 'pulseiq',
      label: 'PulseIQ Charts',
      shortLabel: 'Charts',
      icon: BarChart3,
      description: 'Multi-region comparative analytics & predictive opportunity scoring',
      childIds: ['pulseiq']
    },
    {
      id: 'queue',
      label: 'Priority Accounts',
      shortLabel: 'Accounts',
      icon: Users,
      description: 'Ranked EMS & Fire opportunities with pipeline stage tracking',
      childIds: ['queue']
    },
    {
      id: 'knowledge',
      label: 'Savings & Grants',
      shortLabel: 'Savings',
      icon: PiggyBank,
      description: '5-year TCO calculator, FDA recalls, FEMA AFG grants & Medicare claims',
      childIds: ['knowledge', 'contracts', 'grants', 'claims']
    },
    {
      id: 'field',
      label: 'Field Routes & 3D',
      shortLabel: 'Routes & 3D',
      icon: Car,
      description: 'Multi-stop station driving routes, field notes & 3D apparatus demonstration',
      childIds: ['field', '3d_studio']
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E5E4DF] dark:border-slate-800 text-[#111827] dark:text-slate-100 w-full max-w-full shadow-[0_1px_3px_rgba(17,24,39,0.04)] transition-colors">
      <div className="w-full max-w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2.5 h-14 min-w-0">
          
          {/* ZONE 1: BRAND IDENTITY & LOGO (HOME BUTTON) */}
          <button 
            onClick={() => {
              if (onGoHome) onGoHome();
              else setActiveTab('tm_dashboard');
            }}
            className="flex items-center gap-2 text-left font-bold tracking-tight text-[#111827] dark:text-slate-100 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer group"
            title="Return to Home Screen (TM Field Cockpit)"
          >
            {!logoFailed ? (
              <img
                src={logoSrc}
                alt="Nick's EMS & Fire Crest"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (logoSrc !== '/logo.jpg') {
                    setLogoSrc('/logo.jpg');
                  } else {
                    setLogoFailed(true);
                  }
                }}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E4DF] dark:border-slate-700 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div 
                aria-label="Nick's EMS & Fire Crest"
                className="w-8 h-8 rounded-full bg-linear-to-br from-[#1E3A8A] to-[#B91C1C] flex items-center justify-center text-white border border-[#E5E4DF] dark:border-slate-700 shadow-2xs shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="leading-tight text-xs sm:text-sm font-bold tracking-tight">Nick's EMS &amp; Fire</span>
                <span className="text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded bg-blue-100 text-[#1E3A8A] dark:bg-blue-900/60 dark:text-blue-300">
                  Home
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#6B7280] dark:text-slate-400 leading-tight hidden 2xl:inline">
                Territory Intelligence Guide
              </span>
            </div>
          </button>

          {/* ZONE 2: UNIFIED PRIMARY WORKSPACE NAVIGATION & INLINE DEPARTMENT FILTER */}
          <div className="flex-1 min-w-0 flex items-center justify-center gap-2 lg:gap-3 overflow-x-auto no-scrollbar py-0.5">
            {/* Primary Modules Tab Strip */}
            <nav 
              aria-label="Primary Workspace Navigation" 
              className="flex items-center gap-0.5 sm:gap-1 text-xs font-semibold h-full shrink-0"
            >
              {navItems.map((item) => {
                const isActive = item.childIds.includes(activeTab);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.description}
                    className={`h-9 px-2 sm:px-2.5 xl:px-3 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#1E3A8A] text-white font-bold shadow-2xs dark:bg-blue-600'
                        : 'text-[#374151] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-[#F8F7F4] dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280] dark:text-slate-400'}`} />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="inline xl:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Subtle Divider between Navigation and Global Department Filter */}
            <div className="hidden lg:block w-[1px] h-6 bg-[#E5E4DF] dark:bg-slate-700 shrink-0" aria-hidden="true" />

            {/* Global Department Segmented Filter: All Depts | EMS | Fire */}
            <div 
              className="hidden md:flex items-center gap-0.5 bg-[#F1EFEA] dark:bg-slate-800 p-0.5 rounded-lg border border-[#E5E4DF] dark:border-slate-700 shrink-0" 
              title="Filter territory accounts by EMS Providers or Fire Departments"
            >
              <button
                onClick={() => setGlobalCategory('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  globalCategory === 'all'
                    ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-2xs'
                    : 'text-[#4B5563] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                All Depts
              </button>
              <button
                onClick={() => setGlobalCategory('ems')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  globalCategory === 'ems'
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'text-[#4B5563] dark:text-slate-400 hover:text-[#1E3A8A] dark:hover:text-blue-400'
                }`}
              >
                <Siren className="w-3 h-3 text-sky-400" />
                <span>EMS</span>
              </button>
              <button
                onClick={() => setGlobalCategory('fire')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  globalCategory === 'fire'
                    ? 'bg-[#B91C1C] text-white shadow-2xs'
                    : 'text-[#4B5563] dark:text-slate-400 hover:text-[#B91C1C] dark:hover:text-rose-400'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Fire</span>
              </button>
            </div>
          </div>

          {/* ZONE 3: UNIVERSAL SEARCH BAR & CONSOLIDATED UTILITY CLUSTER */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Prominent Universal Command Palette Search Trigger */}
            {openCommandPalette && (
              <button
                onClick={openCommandPalette}
                className="flex items-center justify-between gap-2 h-9 px-2.5 sm:px-3 rounded-lg bg-[#F8F7F4] dark:bg-slate-800 hover:bg-[#F1EFEA] dark:hover:bg-slate-700/80 border border-[#E5E4DF] dark:border-slate-700 text-xs text-[#374151] dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer w-32 sm:w-44 lg:w-56 xl:w-64"
                title="Universal Search across 3,144 counties, departments, cities, or ZIP codes (Press ⌘K)"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-400 shrink-0" />
                  <span className="truncate text-slate-500 dark:text-slate-400 text-xs font-normal">
                    Quick Find...
                  </span>
                </span>
                <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-700 px-1.5 py-0.5 rounded text-[#6B7280] dark:text-slate-400 shrink-0">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Data Lineage & Trust Audit Modal Trigger */}
            {openDataLineageModal && (
              <button
                onClick={openDataLineageModal}
                className="hidden lg:flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800 shrink-0 cursor-pointer text-xs font-semibold"
                title="Institutional Data Lineage & Federal Repositories Audit"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Data Lineage</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-200 hover:text-[#111827] dark:hover:text-white hover:bg-[#F8F7F4] dark:hover:bg-slate-700 transition-colors border border-[#E5E4DF] dark:border-slate-700 shrink-0 cursor-pointer"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#1E3A8A]" />
                )}
              </button>
            )}

            {/* Push Notifications Bell */}
            <button
              onClick={openNotifications}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-[#374151] dark:text-slate-200 hover:text-[#111827] dark:hover:text-white hover:bg-[#F8F7F4] dark:hover:bg-slate-700 transition-colors border border-[#E5E4DF] dark:border-slate-700 shrink-0 cursor-pointer"
              title="View territory alerts and AFG grant award notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1E3A8A] dark:bg-blue-600 text-[10px] font-mono text-white flex items-center justify-center font-bold tabular-nums">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Grouped Tools, Settings & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 text-xs font-semibold text-[#374151] dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-[#F8F7F4] dark:hover:bg-slate-700 rounded-lg border border-[#E5E4DF] dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Tools, AI Strategy Assistant, Workflow Guide, Scoring Formula & Role Switcher"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                <span className="hidden sm:inline">Tools &amp; Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-400" />
              </button>

              {systemMenuOpen && (
                <>
                  {/* Backdrop Click-Dismisser */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setSystemMenuOpen(false)} 
                  />
                  
                  <div 
                    className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-800 border border-[#E5E4DF] dark:border-slate-700 shadow-xl py-2 z-50 text-xs text-[#111827] dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#6B7280] dark:text-slate-400">
                      Workspace Tools &amp; Strategy
                    </div>

                    <div className="px-2 space-y-1">
                      {openChatbot && (
                        <button
                          onClick={() => {
                            openChatbot();
                            setSystemMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#111827] dark:text-slate-100 font-semibold transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                            <span>Sales Assistant &amp; Talking Points</span>
                          </span>
                        </button>
                      )}

                      {onToggleGuide && (
                        <button
                          onClick={() => {
                            onToggleGuide();
                            setSystemMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#374151] dark:text-slate-300 font-medium transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                            <span>Step-by-Step Workflow Guide</span>
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F8F7F4] dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-700">
                            {showGuide ? 'Shown' : 'Hidden'}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          openWeightTuner();
                          setSystemMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#374151] dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                          <span>PulseIQ Score Adjustment &amp; Weights</span>
                        </span>
                      </button>

                      {openDataLineageModal && (
                        <button
                          onClick={() => {
                            openDataLineageModal();
                            setSystemMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#374151] dark:text-slate-300 font-medium transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Verified Data Sources &amp; Methodology</span>
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveTab('resilience');
                          setSystemMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#374151] dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Cloud className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                          <span>Cloud Sync &amp; Data Backup</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#6B7280] dark:text-slate-400 tabular-nums">
                          {isCloudConnected ? `Synced (${cloudSyncCount})` : 'Local'}
                        </span>
                      </button>

                      <button
                        onClick={toggleNetwork}
                        className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 text-[#374151] dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {isOnline ? (
                            <Wifi className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          )}
                          <span>{isOnline ? 'Connection: Online' : 'Offline Mode Active'}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-[#1E3A8A] dark:text-blue-400">Switch</span>
                      </button>

                      {pendingSyncCount > 0 && (
                        <button
                          onClick={() => {
                            triggerManualSync();
                            setSystemMenuOpen(false);
                          }}
                          disabled={isSyncing}
                          className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>Sync {pendingSyncCount} Saved Offline Notes</span>
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Active Perspective Role Switcher */}
                    <div className="mt-2 pt-2 border-t border-[#E5E4DF] dark:border-slate-700 px-3.5 py-1.5 text-[11px] font-semibold text-[#6B7280] dark:text-slate-400">
                      Switch User Perspective
                    </div>
                    <div className="px-2">
                      {roles.map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setCurrentRole(r);
                            setSystemMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#F8F7F4] dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                            currentRole === r ? 'text-[#1E3A8A] dark:text-blue-400 font-semibold bg-[#F8F7F4] dark:bg-slate-700' : 'text-[#374151] dark:text-slate-300'
                          }`}
                        >
                          <span>{r}</span>
                          {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Button: + Log Visit */}
            <button
              onClick={openQuickVisitModal}
              className="h-9 flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#111827] dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              title="Log an on-site station visit, virtual demo, or phone call"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Visit</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
