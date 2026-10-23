/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import brandLogoAsset from '../assets/images/nicks_ems_logo_1792367124466.jpg';
import { useClickOutside } from '../hooks/useClickOutside';
import { UserRole } from '../types';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
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
  Home,
  Menu,
  X
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
  const [openPillarId, setOpenPillarId] = useState<string | null>(null);
  const [pillarOpenMode, setPillarOpenMode] = useState<'hover' | 'click' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(brandLogoAsset || '/logo.jpg');
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  
  const pillarContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Click-away listener: closes currently active pillar dropdown when clicking anywhere outside
  useClickOutside(
    openPillarId ? pillarContainerRefs.current[openPillarId] : null,
    () => {
      clearHoverTimeout();
      setOpenPillarId(null);
      setPillarOpenMode(null);
    },
    { enabled: !!openPillarId, closeOnEscape: true }
  );

  // Click-away listener: closes system tools menu when clicking anywhere outside
  useClickOutside(
    systemMenuRef,
    () => {
      setSystemMenuOpen(false);
    },
    { enabled: systemMenuOpen, closeOnEscape: true }
  );

  // Keyboard Escape listener for mobile slide-over drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handlePillarMouseEnter = (pillarId: string) => {
    clearHoverTimeout();
    // Only engage hover preview if a menu is not already pinned open via click
    if (!openPillarId || pillarOpenMode === 'hover') {
      setOpenPillarId(pillarId);
      setPillarOpenMode('hover');
    }
  };

  const handlePillarMouseLeave = (pillarId: string) => {
    clearHoverTimeout();
    // Only auto-close if opened via hover; clicked menus remain pinned until click-away
    if (openPillarId === pillarId && pillarOpenMode === 'hover') {
      hoverTimeoutRef.current = setTimeout(() => {
        setOpenPillarId(null);
        setPillarOpenMode(null);
      }, 250);
    }
  };

  const handleTogglePillarClick = (pillarId: string) => {
    clearHoverTimeout();
    setSystemMenuOpen(false);
    if (openPillarId === pillarId && pillarOpenMode === 'click') {
      setOpenPillarId(null);
      setPillarOpenMode(null);
    } else {
      setOpenPillarId(pillarId);
      setPillarOpenMode('click');
    }
  };

  const roles: UserRole[] = [
    'Territory Manager',
    'Regional Sales Director',
    'Clinical Deployment Specialist',
    'Sales Operations Admin'
  ];

  // 3 Core Functional Navigation Pillars with rich metadata and descriptions
  const navigationPillars = [
    {
      id: 'pillar_explorer',
      label: 'Territory Explorer',
      shortLabel: 'Explorer',
      icon: Compass,
      defaultTab: 'states_directory',
      childIds: ['states_directory', 'geo', 'map', 'gis'],
      subTabs: [
        { 
          id: 'states_directory', 
          label: '50-State Directory', 
          shortLabel: 'Directory', 
          icon: Compass, 
          description: 'Comprehensive directory of all 50 states, 3,144 counties & municipal agencies' 
        },
        { 
          id: 'map', 
          label: 'GIS Territory Heatmap', 
          shortLabel: 'GIS Map', 
          icon: MapPin, 
          description: 'Interactive map with ZOLL equipment density, hospital destinations & station pins' 
        }
      ]
    },
    {
      id: 'pillar_sales',
      label: 'Opportunity & Sales Hub',
      shortLabel: 'Sales Hub',
      icon: Users,
      defaultTab: 'queue',
      childIds: ['queue', 'pulseiq', 'knowledge', 'contracts', 'grants', 'claims'],
      subTabs: [
        { 
          id: 'queue', 
          label: 'Priority Accounts Queue', 
          shortLabel: 'Priority Queue', 
          icon: Users, 
          description: 'Ranked EMS & Fire opportunities with pipeline stages and upgrade values' 
        },
        { 
          id: 'pulseiq', 
          label: 'PulseIQ Analytics', 
          shortLabel: 'PulseIQ', 
          icon: BarChart3, 
          description: 'Predictive opportunity scoring, regional benchmarks & comparative volume charts' 
        },
        { 
          id: 'knowledge', 
          label: 'Savings, Grants & TCO', 
          shortLabel: 'Savings/Grants', 
          icon: PiggyBank, 
          description: '5-year TCO calculator, FDA competitor recalls, FEMA AFG grants & billing recovery' 
        }
      ]
    },
    {
      id: 'pillar_field',
      label: 'Field & Clinical Ops',
      shortLabel: 'Field Ops',
      icon: Car,
      defaultTab: 'tm_dashboard',
      childIds: ['tm_dashboard', 'home', 'field', '3d_studio', 'mobile'],
      subTabs: [
        { 
          id: 'tm_dashboard', 
          label: 'TM Field Cockpit', 
          shortLabel: 'Cockpit', 
          icon: Home, 
          description: 'Mobile-first field home screen with priority target leads and daily briefing' 
        },
        { 
          id: 'field', 
          label: 'Multi-Stop Driving Routes', 
          shortLabel: 'Routes', 
          icon: Car, 
          description: 'Turn-by-turn station driving itineraries, offline field notes & visit planner' 
        },
        { 
          id: '3d_studio', 
          label: '3D Apparatus Fleet', 
          shortLabel: '3D Fleet', 
          icon: Siren, 
          description: 'Interactive 3D vehicle apparatus staging for X Series & AutoPulse demonstrations' 
        }
      ]
    }
  ];

  // Detect active pillar & active subtab
  const activePillar = navigationPillars.find(p => p.childIds.includes(activeTab)) || navigationPillars[0];
  const activeSubTab = activePillar.subTabs.find(s => 
    s.id === activeTab || (s.id === 'knowledge' && ['contracts', 'grants', 'claims'].includes(activeTab))
  ) || activePillar.subTabs[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-full transition-colors">
      <div className="w-full max-w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-18 min-w-0">
          
          {/* ZONE 1: CLEAN WORDMARK + SUBTLE ⌘K QUICK-JUMP SEARCH TRIGGER */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Mobile Drawer Trigger (visible on < md screens) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Open mobile workspace navigation menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button 
              onClick={() => {
                if (onGoHome) onGoHome();
                else setActiveTab('home');
              }}
              className="flex items-center gap-3 text-left font-bold tracking-tight text-slate-900 dark:text-white hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer group py-1"
              title="Return to Executive Home & TM Onboarding Hub"
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
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-slate-900/10 dark:ring-white/15 shrink-0 transition-transform"
                />
              ) : (
                <div 
                  aria-label="Nick's EMS & Fire Crest"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0F172A] dark:bg-blue-600 flex items-center justify-center text-white shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-slate-900/10 dark:ring-white/15 transition-transform"
                >
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap leading-tight group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                    Nick&apos;s EMS &amp; Fire
                  </span>
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    ENTERPRISE · v4.2
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 tracking-tight">
                  Territory Intelligence · Public Safety
                </span>
              </div>
            </button>

            {/* Subtle ⌘K Quick-Jump Search Trigger */}
            {openCommandPalette && (
              <button
                onClick={openCommandPalette}
                className="hidden sm:inline-flex items-center justify-between gap-2.5 h-8 px-2.5 rounded-md bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer w-40 lg:w-52"
                title="Universal Search across 3,144 counties, departments, cities, or ZIP codes (Press ⌘K)"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px] font-medium">Jump to agency...</span>
                </span>
                <kbd className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded shrink-0">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Mobile Module Picker (visible on < md screens) */}
            <div className="relative md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                aria-label="Switch active workspace module"
              >
                <span className="max-w-[95px] truncate text-[11px] font-bold">
                  {activeTab === 'home' ? 'Home Hub' : activeSubTab.shortLabel}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* ZONE 2: QUIET ARCHITECTURAL PILLAR TABS WITH 2PX BOTTOM ACTIVE INDICATOR */}
          <nav 
            aria-label="Core Navigation Pillars" 
            className="hidden md:flex items-center gap-6 h-full shrink-0"
          >
            {/* Dedicated Home Pillar */}
            <div className={`h-full flex items-center border-b-2 transition-colors ${
              activeTab === 'home'
                ? 'border-[#1E3A8A] dark:border-blue-400 text-slate-900 dark:text-white font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}>
              <button
                type="button"
                onClick={() => {
                  if (onGoHome) onGoHome();
                  else setActiveTab('home');
                  setOpenPillarId(null);
                }}
                className="h-full px-1 flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Executive Home & Territory Onboarding Hub"
              >
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'home' ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Home</span>
              </button>
            </div>
            {navigationPillars.map((pillar) => {
              const isPillarActive = pillar.childIds.includes(activeTab);
              const isDropdownOpen = openPillarId === pillar.id;
              const PillarIcon = pillar.icon;

              return (
                <div 
                  key={pillar.id} 
                  ref={(el) => {
                    pillarContainerRefs.current[pillar.id] = el;
                  }}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => handlePillarMouseEnter(pillar.id)}
                  onMouseLeave={() => handlePillarMouseLeave(pillar.id)}
                >
                  <div className={`h-full flex items-center border-b-2 transition-colors ${
                    isPillarActive
                      ? 'border-[#1E3A8A] dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPillarActive) {
                          setActiveTab(pillar.defaultTab);
                        }
                      }}
                      className="h-full px-1 flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer transition-colors"
                      title={`${pillar.label} — Switch to view`}
                    >
                      <PillarIcon className={`w-3.5 h-3.5 shrink-0 ${isPillarActive ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="hidden xl:inline">{pillar.label}</span>
                      <span className="inline xl:hidden">{pillar.shortLabel}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePillarClick(pillar.id);
                      }}
                      className="h-full px-1 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      title={`Select a ${pillar.label} module`}
                      aria-label={`Open ${pillar.label} dropdown picker`}
                      aria-expanded={isDropdownOpen}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180 text-[#1E3A8A] dark:text-blue-400' : ''}`} />
                    </button>
                  </div>

                  {/* Interactive Dropdown Popover */}
                  {isDropdownOpen && (
                    <div 
                      className={`absolute top-full pt-1 w-76 sm:w-80 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 before:content-[''] before:absolute before:-top-2 before:inset-x-0 before:h-3 ${
                        pillar.id === 'pillar_field' ? 'left-0 sm:left-auto sm:right-0 lg:left-0' : 'left-0'
                      }`}
                      onMouseEnter={() => handlePillarMouseEnter(pillar.id)}
                      onMouseLeave={() => handlePillarMouseLeave(pillar.id)}
                    >
                      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5">
                        <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                          <span>{pillar.label}</span>
                          <span>{pillar.subTabs.length} Views</span>
                        </div>

                        <div className="space-y-0.5">
                          {pillar.subTabs.map((subTab) => {
                            const isSubActive = activeTab === subTab.id || (subTab.id === 'knowledge' && ['contracts', 'grants', 'claims'].includes(activeTab));
                            const SubIcon = subTab.icon;
                            return (
                              <button
                                key={subTab.id}
                                type="button"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  setActiveTab(subTab.id);
                                  setOpenPillarId(null);
                                  setPillarOpenMode(null);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab(subTab.id);
                                  setOpenPillarId(null);
                                  setPillarOpenMode(null);
                                }}
                                className={`w-full text-left p-2 rounded-md flex items-start gap-2.5 transition-colors cursor-pointer ${
                                  isSubActive
                                    ? 'bg-slate-100 dark:bg-slate-800 text-[#1E3A8A] dark:text-blue-400 font-semibold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSubActive ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs">{subTab.label}</span>
                                    {isSubActive && (
                                      <span className="font-mono text-[10px] text-[#1E3A8A] dark:text-blue-400">Active</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 font-normal">
                                    {subTab.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ZONE 3: CONSOLIDATED STATUS, THEME TOGGLE & PRIMARY ACTION */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Mobile Search Icon Button */}
            {openCommandPalette && (
              <button
                onClick={openCommandPalette}
                className="sm:hidden h-8 w-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title="Search (⌘K)"
                aria-label="Universal Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Direct Data Provenance & Audit Ledger Trigger */}
            {openDataLineageModal && (
              <button
                type="button"
                onClick={openDataLineageModal}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer"
                title="Inspect Verifiable Federal Data Provenance (CMS NPI, USFA FDID, NEMSIS v3.5)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Verified Lineage</span>
              </button>
            )}

            {/* Consolidated Unboxed Telemetry Readout */}
            <button
              onClick={() => {
                if (!isOnline) {
                  toggleNetwork();
                } else if (pendingSyncCount > 0 && !isSyncing) {
                  triggerManualSync();
                } else {
                  toggleNetwork();
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={
                !isOnline 
                  ? `Offline mode (${pendingSyncCount} queued) — Click to reconnect` 
                  : isSyncing 
                    ? 'Syncing to Firestore...' 
                    : `Cloud Synced (${isCloudConnected ? cloudSyncCount : 'local'})`
              }
              aria-label="Field Network Status"
            >
              {!isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-400">Offline{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                  <span>Syncing</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="tabular-nums">{isCloudConnected ? `${cloudSyncCount} Synced` : 'Online'}</span>
                </>
              )}
            </button>

            <span className="hidden sm:inline text-slate-200 dark:text-slate-800" aria-hidden="true">|</span>

            {/* Dark / Light Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title={isDarkMode ? 'Switch to Daylight Mode' : 'Switch to Tactical Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

            {/* Notifications */}
            <button
              onClick={openNotifications}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Territory alerts and AFG grant notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#1E3A8A] text-[9px] font-mono text-white flex items-center justify-center font-bold tabular-nums">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Quiet Tools & Role Menu */}
            <div className="relative" ref={systemMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setOpenPillarId(null);
                  setPillarOpenMode(null);
                  setSystemMenuOpen(!systemMenuOpen);
                }}
                className="h-8 flex items-center gap-1 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Tools, Data Lineage & Role Perspective"
                aria-expanded={systemMenuOpen}
              >
                <span className="hidden lg:inline">{currentRole.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${systemMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {systemMenuOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-72 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1 text-[10px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500">
                    Workspace Utilities
                  </div>

                  <div className="px-1.5 space-y-0.5">
                    {openChatbot && (
                      <button
                        onClick={() => {
                          openChatbot();
                          setSystemMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                          <span>Sales Strategy Assistant</span>
                        </span>
                      </button>
                    )}

                    {onToggleGuide && (
                      <button
                        onClick={() => {
                          onToggleGuide();
                          setSystemMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                          <span>Workflow Guide</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {showGuide ? 'Shown' : 'Hidden'}
                        </span>
                      </button>
                    )}

                    {openDataLineageModal && (
                      <button
                        onClick={() => {
                          openDataLineageModal();
                          setSystemMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Verified Data Lineage</span>
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('resilience');
                        setSystemMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Cloud className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                        <span>Cloud Sync &amp; Resilience</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {isCloudConnected ? `${cloudSyncCount} records` : 'Local'}
                      </span>
                    </button>

                    <button
                      onClick={toggleNetwork}
                      className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {isOnline ? (
                          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        )}
                        <span>{isOnline ? 'Network: Online' : 'Network: Offline'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#1E3A8A] dark:text-blue-400">Toggle</span>
                    </button>
                  </div>

                  {/* Active Perspective Role Switcher */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 px-3 py-1 text-[10px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500">
                    Perspective
                  </div>
                  <div className="px-1.5">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCurrentRole(r);
                          setSystemMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          currentRole === r ? 'text-[#1E3A8A] dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{r}</span>
                        {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 1 Primary High-Contrast CTA: + Log Visit */}
            <button
              onClick={openQuickVisitModal}
              className="h-8 flex items-center gap-1.5 px-3.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Log an on-site station visit, virtual demo, or phone call"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Visit</span>
              <span className="inline sm:hidden">Visit</span>
            </button>

          </div>

        </div>
      </div>

      {/* TIER 2: ARCHITECTURAL SUB-MODULE RIBBON & GLOBAL DEPARTMENT FILTER */}
      <div className="w-full max-w-full px-3 sm:px-5 lg:px-6 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="flex items-center justify-between gap-3 h-9 min-w-0">
          
          {/* Left: Active Pillar Sub-Modules with 2px Bottom Indicator */}
          <div className="flex items-center gap-4 min-w-0 overflow-x-auto no-scrollbar h-full">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
              <span>{activePillar.shortLabel}</span>
              <span aria-hidden="true">/</span>
            </span>

            <div className="flex items-center gap-4 h-full shrink-0">
              {activePillar.subTabs.map((subTab) => {
                const isSubActive = activeTab === subTab.id || (subTab.id === 'knowledge' && ['contracts', 'grants', 'claims'].includes(activeTab));
                const SubIcon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveTab(subTab.id)}
                    className={`h-full px-0.5 text-xs flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSubActive 
                        ? 'border-[#1E3A8A] dark:border-blue-400 text-[#1E3A8A] dark:text-blue-400 font-semibold' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                    title={subTab.description}
                  >
                    <SubIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Clean Segmented Department Filter (All | EMS | Fire) */}
          <div 
            className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 shrink-0" 
            title="Filter territory accounts by EMS Providers or Fire Departments"
          >
            <button
              onClick={() => setGlobalCategory('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                globalCategory === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setGlobalCategory('ems')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                globalCategory === 'ems'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Filter for EMS Ambulance Providers"
            >
              <Siren className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>EMS</span>
            </button>
            <button
              onClick={() => setGlobalCategory('fire')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                globalCategory === 'fire'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Filter for Fire Departments"
            >
              <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Fire</span>
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE QUICK-MENU SHEET (Full touch drawer for < md viewports) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-60 md:hidden animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Drawer Slide-Over */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-60 animate-in slide-in-from-left duration-200">
            {/* Drawer Header with Prominent Brand Logo */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#0F172A] dark:bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    Nick&apos;s EMS &amp; Fire
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
                    Territory Intelligence
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              
              {/* Department Filter */}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                  Department Filter
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setGlobalCategory('all');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 text-center font-semibold rounded-md ${
                      globalCategory === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setGlobalCategory('ems');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 text-center font-semibold rounded-md flex items-center justify-center gap-1 ${
                      globalCategory === 'ems'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Siren className="w-3 h-3 text-sky-500" />
                    EMS
                  </button>
                  <button
                    onClick={() => {
                      setGlobalCategory('fire');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 text-center font-semibold rounded-md flex items-center justify-center gap-1 ${
                      globalCategory === 'fire'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-amber-500" />
                    Fire
                  </button>
                </div>
              </div>

              {/* 3 Pillars & Sub-modules */}
              <div className="space-y-4">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Navigation Pillars &amp; Modules
                </div>

                {/* Home Option */}
                <button
                  onClick={() => {
                    if (onGoHome) onGoHome();
                    else setActiveTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                    activeTab === 'home'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#1E3A8A] dark:border-blue-500 font-bold text-slate-900 dark:text-white'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${activeTab === 'home' ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-bold">Home &amp; Onboarding Hub</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Central Hub</span>
                </button>

                {navigationPillars.map((pillar) => {
                  const isPillarActive = pillar.childIds.includes(activeTab);
                  const PillarIcon = pillar.icon;
                  return (
                    <div key={pillar.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
                        <PillarIcon className={`w-4 h-4 ${isPillarActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span>{pillar.label}</span>
                      </div>

                      <div className="space-y-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                        {pillar.subTabs.map((subTab) => {
                          const isSubActive = activeTab === subTab.id || (subTab.id === 'knowledge' && ['contracts', 'grants', 'claims'].includes(activeTab));
                          const SubIcon = subTab.icon;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => {
                                setActiveTab(subTab.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                                isSubActive
                                  ? 'bg-[#1E3A8A] text-white font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{subTab.label}</span>
                              </span>
                              {isSubActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Field Visit Action */}
              <button
                onClick={() => {
                  openQuickVisitModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Station Visit / Interaction</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </header>
  );
};
