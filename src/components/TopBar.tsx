/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import brandLogoAsset from '../assets/images/nicks_ems_logo_1792367124466.jpg';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Home,
  Building2,
  TrendingUp,
  Globe,
  Briefcase,
  Layers,
  Scale,
  DollarSign,
  Box,
  Database,
  Activity,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  RefreshCw,
  Check
} from 'lucide-react';
import { Agency, UserRole } from '../types';
import { MobileQuickProviderBar } from './MobileQuickProviderBar';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGoHome: () => void;
  globalCategory: 'all' | 'ems' | 'fire';
  setGlobalCategory: (cat: 'all' | 'ems' | 'fire') => void;
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
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  onClearGeography?: () => void;
  activeAccountName?: string | null;
  dayRouteCount?: number;
  bookmarkedCount?: number;
  agencies?: Agency[];
  onOpenProviderFinder?: () => void;
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
  isCloudConnected = false,
  cloudSyncCount = 0,
  showGuide = false,
  onToggleGuide,
  isDarkMode = false,
  onToggleDarkMode,
  globalState = 'all',
  globalCounty = 'all',
  globalCity = 'all',
  onClearGeography,
  activeAccountName = null,
  dayRouteCount = 0,
  bookmarkedCount = 0,
  agencies = [],
  onOpenProviderFinder
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(brandLogoAsset || '/logo.jpg');
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  const [isUtilityMenuOpen, setIsUtilityMenuOpen] = useState<boolean>(false);
  const [isOpportunitiesExpanded, setIsOpportunitiesExpanded] = useState<boolean>(true);
  const [isTerritoryExpanded, setIsTerritoryExpanded] = useState<boolean>(true);
  const [isMyWorkExpanded, setIsMyWorkExpanded] = useState<boolean>(true);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState<boolean>(true);
  const utilityRef = useRef<HTMLDivElement>(null);

  const roles: UserRole[] = [
    'Territory Manager',
    'Regional Sales Director',
    'Clinical Deployment Specialist',
    'Sales Operations Admin'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (utilityRef.current && !utilityRef.current.contains(event.target as Node)) {
        setIsUtilityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Workspace active detection
  const isHomeActive = activeTab === 'home' && !activeAccountName;
  const isAccountsActive = activeTab === 'queue' || Boolean(activeAccountName);
  const isOpportunitiesActive = ['contracts', 'grants', 'pulseiq'].includes(activeTab) && !activeAccountName;
  const isTerritoryActive = ['states_directory', 'geo', 'google_maps', 'map', 'gis'].includes(activeTab) && !activeAccountName;
  const isMyWorkActive = ['field', 'tm_dashboard'].includes(activeTab) && !activeAccountName;

  const advancedTools = [
    { id: 'knowledge', label: 'Clinical & TCO Hub', icon: Scale },
    { id: 'claims', label: 'Medicare & Payer Mix', icon: DollarSign },
    { id: '3d_studio', label: '3D Apparatus Studio', icon: Box },
    { id: 'gateway', label: 'Federal Data Gateway', icon: Database },
    { id: 'data_health', label: 'Data Health & Sync', icon: Activity },
    { id: 'resilience', label: 'Cloud Backup', icon: ShieldCheck }
  ];

  const isAdvancedActive = advancedTools.some(t => t.id === activeTab) && !activeAccountName;

  const getWorkspaceTitle = () => {
    if (activeAccountName) return `Accounts / ${activeAccountName}`;
    if (activeTab === 'home') return 'Home';
    if (activeTab === 'queue') return 'Accounts Discovery';
    if (activeTab === 'contracts') return 'Opportunities · Procurement & Contracts';
    if (activeTab === 'grants') return 'Opportunities · FEMA AFG & SAFER Grants';
    if (activeTab === 'pulseiq') return 'Opportunities · PulseIQ Regional Scoring';
    if (activeTab === 'states_directory' || activeTab === 'geo') return 'Territory · Geographic Directory';
    if (activeTab === 'google_maps') return 'Territory · Google Maps Live';
    if (activeTab === 'map' || activeTab === 'gis') return 'Territory · GIS Fleet Heatmap';
    if (activeTab === 'field') return 'My Work · Field Route & Activity';
    if (activeTab === 'tm_dashboard') return 'My Work · Mobile Command';
    const foundAdv = advancedTools.find(t => t.id === activeTab);
    if (foundAdv) return `Advanced Intelligence · ${foundAdv.label}`;
    return 'Workspace';
  };

  const hasActiveGeography = globalState !== 'all' || globalCounty !== 'all' || globalCity !== 'all';

  return (
    <>
      {/* ====================================================================
          PRIMARY LEFT SIDEBAR (~280px, #0B1728) — DESKTOP
         ==================================================================== */}
      <aside
        aria-label="Primary Workspace Navigation"
        className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[280px] bg-[#0B1728] text-slate-200 border-r border-[#172D49] z-50 select-none"
      >
        {/* Brand Identity Header — Prominent Full-Width Emblem */}
        <div className="py-6 px-3 flex items-center justify-center border-b border-[#172D49] shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center justify-center group focus:outline-none cursor-pointer"
            title="Return to Territory Intelligence Home"
            aria-label="Return to Territory Intelligence Home"
          >
            <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden ring-3 ring-[#285EE8]/40 shadow-2xl bg-[#070F1C] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              {!logoFailed ? (
                <img
                  src={logoSrc}
                  alt="Territory Intelligence Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={() => {
                    if (logoSrc !== '/logo.jpg') setLogoSrc('/logo.jpg');
                    else setLogoFailed(true);
                  }}
                />
              ) : (
                <span className="font-display font-bold text-3xl text-white">NF</span>
              )}
            </div>
          </button>
        </div>

        {/* Provider Discipline Filter (All / EMS / Fire) inside Sidebar */}
        <div className="px-3.5 pt-3.5 pb-2">
          <div className="text-xs font-medium text-slate-400 px-1 mb-1.5">
            Provider scope
          </div>
          <div
            className="grid grid-cols-3 bg-[#172D49]/80 p-0.5 rounded-lg border border-[#233B5E]"
            role="group"
            aria-label="Provider Discipline Filter"
          >
            {(['all', 'ems', 'fire'] as const).map((cat) => {
              const active = globalCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlobalCategory(cat)}
                  className={`py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#285EE8] text-white shadow-2xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'ems' ? 'EMS' : 'Fire'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary 5 Workspaces Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 no-scrollbar">
          <div>
            <div className="text-xs font-medium text-slate-400 px-2.5 mb-1.5">
              Workspaces
            </div>
            <div className="space-y-0.5">
              {/* 1. Home */}
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  isHomeActive
                    ? 'bg-[#285EE8] text-white font-semibold shadow-2xs'
                    : 'text-slate-300 hover:bg-[#172D49] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 shrink-0" />
                  <span>Home</span>
                </span>
              </button>

              {/* 2. Accounts */}
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  isAccountsActive
                    ? 'bg-[#285EE8] text-white font-semibold shadow-2xs'
                    : 'text-slate-300 hover:bg-[#172D49] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Accounts</span>
                </span>
                {activeAccountName && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white">
                    360
                  </span>
                )}
              </button>

              {/* 3. Opportunities */}
              <div className="space-y-0.5">
                <div
                  className={`w-full flex items-center justify-between rounded-lg text-[13px] font-medium transition-colors ${
                    isOpportunitiesActive
                      ? 'bg-[#285EE8] text-white font-semibold shadow-2xs'
                      : 'text-slate-300 hover:bg-[#172D49] hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(isOpportunitiesActive ? activeTab : 'contracts');
                      setIsOpportunitiesExpanded(true);
                    }}
                    className="flex-1 flex items-center gap-2.5 px-2.5 py-2 text-left cursor-pointer focus:outline-none min-w-0"
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span className="truncate">Opportunities</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpportunitiesExpanded(prev => !prev)}
                    className="p-2 hover:text-white text-slate-400 cursor-pointer shrink-0"
                    title="Toggle Opportunities Sub-Navigation"
                    aria-label="Toggle Opportunities Sub-Navigation"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpportunitiesExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                </div>

                {/* Sub-links for Opportunities */}
                {isOpportunitiesExpanded && (
                  <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-[#172D49] ml-4 mt-0.5">
                    {[
                      { id: 'contracts', label: 'Contracts & Expirations' },
                      { id: 'grants', label: 'FEMA AFG & SAFER Grants' },
                      { id: 'pulseiq', label: 'PulseIQ Scoring Matrix' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveTab(sub.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          activeTab === sub.id
                            ? 'text-white font-semibold bg-[#172D49]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Territory */}
              <div className="space-y-0.5">
                <div
                  className={`w-full flex items-center justify-between rounded-lg text-[13px] font-medium transition-colors ${
                    isTerritoryActive
                      ? 'bg-[#285EE8] text-white font-semibold shadow-2xs'
                      : 'text-slate-300 hover:bg-[#172D49] hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(isTerritoryActive ? activeTab : 'states_directory');
                      setIsTerritoryExpanded(true);
                    }}
                    className="flex-1 flex items-center gap-2.5 px-2.5 py-2 text-left cursor-pointer focus:outline-none min-w-0"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <span className="truncate">Territory</span>
                  </button>
                  <div className="flex items-center gap-1 pr-1.5 shrink-0">
                    {globalState !== 'all' && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#172D49] text-blue-300">
                        {globalState}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsTerritoryExpanded(prev => !prev)}
                      className="p-1.5 hover:text-white text-slate-400 cursor-pointer shrink-0"
                      title="Toggle Territory Sub-Navigation"
                      aria-label="Toggle Territory Sub-Navigation"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTerritoryExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </button>
                  </div>
                </div>

                {/* Sub-links for Territory including GIS Fleet Heatmap */}
                {isTerritoryExpanded && (
                  <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-[#172D49] ml-4 mt-0.5">
                    {[
                      { id: 'states_directory', label: 'State → County → City' },
                      { id: 'google_maps', label: 'Google Maps Live' },
                      { id: 'map', label: 'GIS Fleet & Acuity Heatmap' }
                    ].map((sub) => {
                      const subActive =
                        sub.id === 'states_directory'
                          ? activeTab === 'states_directory' || activeTab === 'geo'
                          : sub.id === 'map'
                            ? activeTab === 'map' || activeTab === 'gis'
                            : activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveTab(sub.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                            subActive
                              ? 'text-white font-semibold bg-[#172D49] border-l-2 border-[#285EE8]'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. My Work */}
              <div className="space-y-0.5">
                <div
                  className={`w-full flex items-center justify-between rounded-lg text-[13px] font-medium transition-colors ${
                    isMyWorkActive
                      ? 'bg-[#285EE8] text-white font-semibold shadow-2xs'
                      : 'text-slate-300 hover:bg-[#172D49] hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(isMyWorkActive ? activeTab : 'field');
                      setIsMyWorkExpanded(true);
                    }}
                    className="flex-1 flex items-center gap-2.5 px-2.5 py-2 text-left cursor-pointer focus:outline-none min-w-0"
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span className="truncate">My Work</span>
                  </button>
                  <div className="flex items-center gap-1 pr-1.5 shrink-0">
                    {(dayRouteCount > 0 || bookmarkedCount > 0) && (
                      <span className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded bg-[#172D49] text-slate-200">
                        {dayRouteCount || bookmarkedCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMyWorkExpanded(prev => !prev)}
                      className="p-1.5 hover:text-white text-slate-400 cursor-pointer shrink-0"
                      title="Toggle My Work Sub-Navigation"
                      aria-label="Toggle My Work Sub-Navigation"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMyWorkExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </button>
                  </div>
                </div>

                {isMyWorkExpanded && (
                  <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-[#172D49] ml-4 mt-0.5">
                    {[
                      { id: 'field', label: 'Routes, Visits & Notes' },
                      { id: 'tm_dashboard', label: 'Field Mobile Cockpit' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveTab(sub.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          activeTab === sub.id
                            ? 'text-white font-semibold bg-[#172D49]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Area: Advanced Intelligence */}
          <div>
            <button
              type="button"
              onClick={() => setIsAdvancedExpanded(prev => !prev)}
              className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 px-2.5 mb-1.5 cursor-pointer"
            >
              <span>Advanced intelligence</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isAdvancedExpanded ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>

            {isAdvancedExpanded && (
              <div className="space-y-0.5">
                {advancedTools.map((tool) => {
                  const Icon = tool.icon;
                  const active = activeTab === tool.id && !activeAccountName;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#172D49] text-white font-semibold border-l-2 border-[#285EE8]'
                          : 'text-slate-400 hover:bg-[#172D49]/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Sidebar Footer: Provenance & System State */}
        <div className="p-3 border-t border-[#172D49] bg-[#091322] space-y-2 shrink-0">
          {openChatbot && (
            <button
              type="button"
              onClick={openChatbot}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#172D49] hover:bg-[#1E3A5F] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Strategy &amp; RFP Desk</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Open</span>
            </button>
          )}

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={toggleNetwork}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              title="Verify network and cloud sync status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  !isOnline
                    ? 'bg-amber-400'
                    : isCloudConnected
                      ? 'bg-emerald-400'
                      : 'bg-blue-400'
                }`}
              />
              <span className="font-mono text-[11px]">
                {!isOnline
                  ? 'Offline Cache'
                  : isCloudConnected
                    ? `Cloud Synced (${cloudSyncCount})`
                    : 'Local Ready'}
              </span>
            </button>

            {openDataLineageModal && (
              <button
                type="button"
                onClick={openDataLineageModal}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Sources
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ====================================================================
          STABLE TOP TOOLBAR (~64px)
         ==================================================================== */}
      <header className="sticky top-0 z-40 h-16 md:pl-[280px] bg-white dark:bg-[#111C2D] border-b border-[#DFE6EF] dark:border-[#1E2D42] transition-colors">
        <div className="h-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Left: Mobile Brand + Current Workspace Context & Active Geography */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onGoHome}
              className="md:hidden flex items-center gap-2.5 text-left cursor-pointer shrink-0"
              title="Return to Territory Intelligence Home"
            >
              <div className="w-10 h-10 rounded-full ring-1.5 ring-[#285EE8]/40 overflow-hidden shrink-0 bg-[#070F1C] flex items-center justify-center">
                <img
                  src={logoSrc}
                  alt="Nick's EMS & Fire Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-[650] text-[13px] text-[#14283F] dark:text-white leading-tight truncate">
                  Nick's EMS &amp; Fire
                </span>
                <span className="font-sans text-[10px] text-[#53657B] dark:text-slate-400 truncate">
                  Territory Intelligence
                </span>
              </div>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-[#14283F] dark:text-white truncate">
                  {getWorkspaceTitle()}
                </span>
                {hasActiveGeography && (
                  <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#285EE8] dark:text-blue-400 bg-[#EEF3FE] dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60 font-medium">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>
                      {globalState !== 'all' ? globalState : 'US'}
                      {globalCounty !== 'all' ? ` · ${globalCounty}` : ''}
                      {globalCity !== 'all' ? ` · ${globalCity}` : ''}
                    </span>
                    {onClearGeography && (
                      <button
                        type="button"
                        onClick={onClearGeography}
                        className="ml-1 text-xs hover:underline cursor-pointer"
                        title="Reset geography filter to All States"
                      >
                        Reset
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center/Right: Universal Search Trigger + Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Universal Agency & Territory Search (⌘K) */}
            {openCommandPalette && (
              <button
                type="button"
                onClick={openCommandPalette}
                className="h-9 w-9 sm:w-56 md:w-64 lg:w-80 px-0 sm:px-3.5 rounded-lg bg-[#F5F7FA] dark:bg-[#16243A] hover:bg-slate-200/70 dark:hover:bg-slate-800 text-[#53657B] dark:text-slate-300 border border-[#DFE6EF] dark:border-[#1E2D42] flex items-center justify-center sm:justify-between gap-2.5 text-xs transition-colors cursor-pointer shrink-0"
                title="Search any EMS agency, Fire department, city, ZIP, or NPI (⌘K)"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Search className="w-3.5 h-3.5 text-[#53657B] dark:text-slate-400 shrink-0" />
                  <span className="hidden sm:inline truncate">Search agency, city, ZIP, NPI...</span>
                </span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-medium text-[#53657B] dark:text-slate-400 bg-white dark:bg-[#111C2D] rounded border border-[#DFE6EF] dark:border-slate-700 shrink-0">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Pending Offline Sync Button (Only when pending items exist) */}
            {pendingSyncCount > 0 && (
              <button
                type="button"
                onClick={triggerManualSync}
                disabled={!isOnline || isSyncing}
                className="h-9 px-2.5 rounded-lg text-xs tabular-nums font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount} pending</span>
              </button>
            )}

            {/* Territory Strategy & RFP Desk Trigger */}
            {openChatbot && (
              <button
                type="button"
                onClick={openChatbot}
                className="h-9 px-3 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#285EE8] dark:text-blue-300 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Open Territory Strategy & RFP AI Desk"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#285EE8] dark:text-blue-400" />
                <span className="hidden sm:inline">Strategy AI</span>
              </button>
            )}

            {/* Primary Action: Log Field Visit */}
            <button
              type="button"
              onClick={openQuickVisitModal}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#285EE8] hover:bg-[#194BC8] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Log a station visit or field note"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Visit</span>
            </button>

            {/* Notifications Drawer Trigger */}
            <button
              type="button"
              onClick={openNotifications}
              aria-label={`Notifications${unreadAlertCount > 0 ? `, ${unreadAlertCount} unread` : ''}`}
              className="relative h-9 w-9 rounded-lg border border-[#DFE6EF] dark:border-[#1E2D42] bg-white dark:bg-[#16243A] hover:bg-[#F5F7FA] dark:hover:bg-slate-800 text-[#53657B] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Territory & Procurement Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#285EE8] text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={isDarkMode ? 'Switch to Daylight Mode' : 'Switch to Dark Mode'}
                className="h-9 w-9 rounded-lg border border-[#DFE6EF] dark:border-[#1E2D42] bg-white dark:bg-[#16243A] hover:bg-[#F5F7FA] dark:hover:bg-slate-800 text-[#53657B] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title={isDarkMode ? 'Switch to Daylight Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Role & Workspace Preferences Menu */}
            <div className="relative" ref={utilityRef}>
              <button
                type="button"
                onClick={() => setIsUtilityMenuOpen(prev => !prev)}
                className="h-9 px-2.5 rounded-lg border border-[#DFE6EF] dark:border-[#1E2D42] bg-white dark:bg-[#16243A] hover:bg-[#F5F7FA] dark:hover:bg-slate-800 text-[#14283F] dark:text-slate-200 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                title="Role View & System Utilities"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#53657B] dark:text-slate-400" />
                <span className="hidden xl:inline max-w-[120px] truncate">{currentRole}</span>
                <ChevronDown className="w-3 h-3 text-[#53657B]" />
              </button>

              {isUtilityMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] shadow-lg py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-[#DFE6EF] dark:border-[#1E2D42]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#53657B] dark:text-slate-400">
                      Active View Role
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {roles.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setCurrentRole(r);
                            setIsUtilityMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                            currentRole === r
                              ? 'bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 font-semibold'
                              : 'text-[#14283F] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{r}</span>
                          {currentRole === r && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-2 pt-1.5 space-y-0.5">
                    {onToggleGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleGuide();
                          setIsUtilityMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-[#14283F] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {showGuide ? 'Hide Quick Start Strip' : 'Show Quick Start Strip'}
                      </button>
                    )}
                    {openDataLineageModal && (
                      <button
                        type="button"
                        onClick={() => {
                          openDataLineageModal();
                          setIsUtilityMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-[#14283F] dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Federal Data Lineage &amp; Sources
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Dedicated Quick Filter & Provider Finder Bar */}
      {!activeAccountName && (
        <MobileQuickProviderBar
          globalCategory={globalCategory}
          setGlobalCategory={setGlobalCategory}
          onOpenProviderFinder={onOpenProviderFinder || openCommandPalette || (() => {})}
          globalState={globalState}
          globalCounty={globalCounty}
          onClearGeography={onClearGeography}
          agencies={agencies}
        />
      )}
    </>
  );
};
