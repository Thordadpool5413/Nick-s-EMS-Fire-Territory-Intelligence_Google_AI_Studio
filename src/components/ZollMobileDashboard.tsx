/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Agency, 
  LeadStage, 
  FieldNote, 
  SyncOutboxItem, 
  PushAlert 
} from '../types';
import { 
  Phone, 
  Navigation, 
  Car, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  Search, 
  Sparkles, 
  MapPin, 
  ChevronRight, 
  ChevronDown,
  Building2, 
  Radio, 
  Wifi, 
  WifiOff, 
  Send, 
  ExternalLink, 
  SlidersHorizontal,
  Flame,
  Siren,
  Moon,
  Sun,
  Layers,
  ArrowUpRight,
  RotateCcw,
  Plus,
  Scale,
  Activity
} from 'lucide-react';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';
import { PulseIqScoreExplainerHub } from './PulseIqScoreExplainerHub';

interface ZollMobileDashboardProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onUpdateStage: (agencyId: string, stage: LeadStage) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onNavigateTab: (tab: string) => void;
  isOnline: boolean;
  toggleNetwork: () => void;
  outbox: SyncOutboxItem[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  alerts?: PushAlert[];
  globalState: string;
  globalCounty: string;
}

export const ZollMobileDashboard: React.FC<ZollMobileDashboardProps> = ({
  agencies,
  onSelectAgency,
  onUpdateStage,
  onToggleRoute,
  onAddFieldNote,
  onNavigateTab,
  isOnline,
  toggleNetwork,
  outbox,
  isDarkMode,
  onToggleDarkMode,
  alerts = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'high_priority' | 'day_route' | 'ems' | 'fire'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteMeetingType, setQuickNoteMeetingType] = useState<FieldNote['meetingType']>('On-Site Station Visit');
  const [quickNextAction, setQuickNextAction] = useState('Schedule clinical demo with Medical Director');
  const [activeGeoTab, setActiveGeoTab] = useState<'cluster' | 'market_share' | 'transit'>('cluster');
  const [criticalAlertDismissed, setCriticalAlertDismissed] = useState<boolean>(false);
  const [mobileClarityDrawer, setMobileClarityDrawer] = useState<Record<string, 'deal_story' | 'battlecard' | 'score_explainer' | null>>({});
  const [visibleCardCount, setVisibleCardCount] = useState<number>(24);

  // Active Territory Stats & Metrics
  const territoryStats = useMemo(() => {
    const total = agencies.length;
    const dayRoute = agencies.filter(a => a?.inDayRoute);
    const critical = agencies.filter(a => {
      const days = a?.competitorContract?.renewalWindowDays ?? 180;
      const status = a?.competitorContract?.status || '';
      const score = a?.zollOpportunity?.pulseIqScore ?? 50;
      return days <= 90 || status.includes('Expiring') || score >= 90;
    });
    const highPriority = agencies.filter(a => (a?.zollOpportunity?.pulseIqScore ?? 50) >= 80);
    const totalPipelineValue = agencies.reduce((acc, a) => acc + (a?.zollOpportunity?.projectedPipelineValue || 120000), 0);
    const competitorUnits = agencies.reduce((acc, a) => acc + (a?.installedFleet?.defibUnitsCount || 0), 0);

    // Competitor Brand Breakdown
    let strykerUnits = 0;
    let philipsUnits = 0;
    let zollUnits = 0;
    let otherUnits = 0;

    agencies.forEach(a => {
      const b = (a?.installedFleet?.defibBrand || '').toLowerCase();
      const count = a?.installedFleet?.defibUnitsCount || 0;
      if (b.includes('stryker') || b.includes('lifepak')) strykerUnits += count;
      else if (b.includes('philips') || b.includes('mrx') || b.includes('heartstart')) philipsUnits += count;
      else if (b.includes('zoll')) zollUnits += count;
      else otherUnits += count;
    });

    const totalTracked = strykerUnits + philipsUnits + zollUnits + otherUnits || 1;
    const strykerPct = Math.round((strykerUnits / totalTracked) * 100);
    const philipsPct = Math.round((philipsUnits / totalTracked) * 100);
    const zollPct = Math.round((zollUnits / totalTracked) * 100);

    return {
      total,
      dayRouteCount: dayRoute.length,
      criticalCount: critical.length,
      highPriorityCount: highPriority.length,
      totalPipelineValue,
      competitorUnits,
      strykerPct,
      philipsPct,
      zollPct
    };
  }, [agencies]);

  // Filtered & Ranked Leads
  const filteredAgencies = useMemo(() => {
    return agencies
      .filter(agency => {
        if (!agency) return false;
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (agency.name || '').toLowerCase().includes(q);
          const matchCity = (agency.city || '').toLowerCase().includes(q);
          const matchCounty = (agency.county || '').toLowerCase().includes(q);
          const matchState = (agency.stateCode || '').toLowerCase().includes(q);
          const matchChief = (agency.keyContacts || []).some(c => (c?.name || '').toLowerCase().includes(q));
          if (!matchName && !matchCity && !matchCounty && !matchState && !matchChief) return false;
        }

        // Category / Filter Mode
        if (filterMode === 'critical') {
          const days = agency.competitorContract?.renewalWindowDays ?? 180;
          const score = agency.zollOpportunity?.pulseIqScore ?? 50;
          return days <= 90 || score >= 90;
        }
        if (filterMode === 'high_priority') {
          return (agency.zollOpportunity?.pulseIqScore ?? 50) >= 80;
        }
        if (filterMode === 'day_route') {
          return !!agency.inDayRoute;
        }
        if (filterMode === 'ems') {
          return agency.providerCategory === 'EMS' || !(agency.agencyType || '').toLowerCase().includes('fire');
        }
        if (filterMode === 'fire') {
          return agency.providerCategory === 'FIRE' || (agency.agencyType || '').toLowerCase().includes('fire');
        }
        return true;
      })
      .sort((a, b) => (b?.zollOpportunity?.pulseIqScore ?? 50) - (a?.zollOpportunity?.pulseIqScore ?? 50));
  }, [agencies, searchQuery, filterMode]);

  // Today's Day Route Multi-Stop Google Maps Launcher
  const dayRouteAgencies = useMemo(() => agencies.filter(a => a?.inDayRoute), [agencies]);
  const googleMapsRouteUrl = useMemo(() => {
    if (dayRouteAgencies.length === 0) return '';
    return `https://www.google.com/maps/dir/${dayRouteAgencies.map(a => encodeURIComponent(`${a.name || ''}, ${a.address || ''}, ${a.city || ''}, ${a.stateCode || ''}`)).join('/')}`;
  }, [dayRouteAgencies]);

  // Urgent Critical Updates
  const urgentLead = useMemo(() => {
    return agencies.find(a => (a?.competitorContract?.renewalWindowDays ?? 180) <= 60 && (a?.zollOpportunity?.pulseIqScore ?? 50) >= 85) || agencies[0] || null;
  }, [agencies]);

  // Quick Inline Note Submission
  const handleSaveQuickNote = (agencyId: string) => {
    if (!quickNoteText.trim()) return;
    onAddFieldNote(agencyId, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Sarah Jenkins (TM)',
      meetingType: quickNoteMeetingType,
      notes: quickNoteText.trim(),
      nextAction: quickNextAction,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setQuickNoteText('');
    setExpandedLogId(null);
  };

  // Stage Progression Options
  const stages: LeadStage[] = [
    'Target Lead',
    'Contacted / Intro',
    'Demo Scheduled',
    'Clinical Evaluation Trial',
    'Executive Presentation',
    'RFP / Quoting',
    'Contract Won'
  ];

  return (
    <div className="w-full max-w-full space-y-4 pb-12 transition-colors duration-200">
      
      {/* 1. MINIMALIST EXECUTIVE FIELD COCKPIT HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border bg-white dark:bg-slate-900/90 border-[#E5E4DF] dark:border-slate-800 p-4 sm:p-5 shadow-xs backdrop-blur-md"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#0F172A] dark:bg-slate-800 flex items-center justify-center text-white font-bold text-sm tracking-tight border border-slate-700 shadow-xs">
                ZOLL
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Field Territory Manager</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium">{isOnline ? 'Cloud Synced' : 'Offline Field'}</span>
              </div>
              <h1 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 tracking-tight">
                Sarah Jenkins <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Southwest Territory)</span>
              </h1>
            </div>
          </div>

          {/* Quick Actions & Dark Mode Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Network Simulator Button */}
            <button
              onClick={toggleNetwork}
              className={`h-9 px-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOnline 
                  ? 'bg-[#F8F7F4] dark:bg-slate-800 text-[#374151] dark:text-slate-300 border-[#E5E4DF] dark:border-slate-700 hover:bg-[#F1EFEA]' 
                  : 'bg-amber-50 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-700'
              }`}
              title={isOnline ? 'Online with cloud live sync' : 'Field offline mode'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </button>

            {/* Dark Mode Switcher with Motion */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onToggleDarkMode}
              className="h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer bg-[#F8F7F4] dark:bg-slate-800 text-[#111827] dark:text-slate-200 border-[#E5E4DF] dark:border-slate-700 hover:bg-[#F1EFEA] dark:hover:bg-slate-700"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDarkMode ? (
                  <motion.div 
                    key="sun" 
                    initial={{ rotate: -90, opacity: 0 }} 
                    animate={{ rotate: 0, opacity: 1 }} 
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-amber-400"
                  >
                    <Sun className="w-4 h-4" />
                    <span className="hidden xs:inline text-slate-200">Light</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="moon" 
                    initial={{ rotate: 90, opacity: 0 }} 
                    animate={{ rotate: 0, opacity: 1 }} 
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-[#1E3A8A]"
                  >
                    <Moon className="w-4 h-4" />
                    <span className="hidden xs:inline text-[#111827]">Dark</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Google Maps Multi-Stop Day Route Direct Launcher */}
            {dayRouteAgencies.length > 0 && (
              <motion.a
                whileTap={{ scale: 0.95 }}
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-xl bg-[#047857] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Launch Google Maps Multi-Stop Navigation for Today's Route"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-200" />
                <span>Navigate Route ({dayRouteAgencies.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </motion.a>
            )}
          </div>
        </div>

        {/* Executive KPI Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400 block">
              Active Accounts
            </span>
            <span className="text-xl font-bold text-[#0F172A] dark:text-slate-100 font-mono tabular-nums block mt-0.5">
              {territoryStats.total}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
              100% Verified CRM
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400 block">
              Critical (&le;90d Expiry)
            </span>
            <span className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums block mt-0.5">
              {territoryStats.criticalCount} Leads
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Contract cliff urgent
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400 block">
              Conversion Pipeline
            </span>
            <span className="text-xl font-bold text-[#1D4ED8] dark:text-blue-400 font-mono tabular-nums block mt-0.5">
              ${(territoryStats.totalPipelineValue / 1000000).toFixed(1)}M
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {territoryStats.competitorUnits} defib units
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400 block">
              Today's Field Stops
            </span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums block mt-0.5">
              {territoryStats.dayRouteCount} Stops
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {territoryStats.dayRouteCount > 0 ? 'Ready for navigation' : 'Tap to add station'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. REAL-TIME CRITICAL STATUS ALERT TICKER */}
      {!criticalAlertDismissed && urgentLead && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 border-rose-300 dark:border-rose-900/80 p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                    Urgent Status Alert: {urgentLead.competitorContract?.renewalWindowDays ?? 60} Days Left
                  </span>
                  <span className="text-xs text-[#6B7280] dark:text-slate-400 font-mono">
                    Priority Score {urgentLead.zollOpportunity?.pulseIqScore ?? 85}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-[#111827] dark:text-slate-100 mt-1">
                  {urgentLead.name} ({urgentLead.city}, {urgentLead.stateCode})
                </h2>
                <p className="text-xs text-[#374151] dark:text-slate-300 mt-0.5 line-clamp-2">
                  Competitor contract with <span className="font-semibold text-rose-700 dark:text-rose-300">{urgentLead.competitorContract?.vendor || 'Stryker'}</span> expires on <span className="font-semibold">{urgentLead.competitorContract?.contractEndDate || '2026-12-31'}</span>. {urgentLead.installedFleet?.defibUnitsCount || 10}x aging monitors eligible for ${((urgentLead.installedFleet?.defibUnitsCount || 10) * 3500).toLocaleString()} trade-in credit toward X Series Advanced.
                </p>
                
                {/* 1-Tap Quick Response Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    onClick={() => onSelectAgency(urgentLead)}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] dark:bg-slate-800 text-white text-xs font-semibold hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Open Full Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleRoute(urgentLead.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      urgentLead.inDayRoute
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 border-[#E5E4DF] dark:border-slate-700 hover:bg-[#F8F7F4]'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>{urgentLead.inDayRoute ? 'In Today’s Route' : '+ Add to Route'}</span>
                  </button>

                  {urgentLead.keyContacts?.[0]?.phone && (
                    <a
                      href={`tel:${urgentLead.keyContacts[0].phone}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {(urgentLead.keyContacts[0].name || '').split(' ')[0]}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCriticalAlertDismissed(true)}
              className="text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 p-1 shrink-0 cursor-pointer"
              title="Dismiss alert"
            >
              &times;
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. REAL-TIME GEOGRAPHIC DATA INSIGHTS WIDGET */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border bg-white dark:bg-slate-900 border-[#E5E4DF] dark:border-slate-800 p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                Real-Time Geographic Intelligence
              </span>
            </div>
            <h2 className="text-base font-bold text-[#111827] dark:text-slate-100 mt-0.5">
              Territorial Market Insights &amp; Fleet Acuity
            </h2>
          </div>

          {/* Sub-tabs for Geo Insights */}
          <div className="flex items-center gap-1 bg-[#F1EFEA] dark:bg-slate-800 p-1 rounded-xl border border-[#E5E4DF] dark:border-slate-700 self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setActiveGeoTab('cluster')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeGeoTab === 'cluster'
                  ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-2xs font-bold'
                  : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827]'
              }`}
            >
              Clusters &amp; Densities
            </button>
            <button
              onClick={() => setActiveGeoTab('market_share')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeGeoTab === 'market_share'
                  ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-2xs font-bold'
                  : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827]'
              }`}
            >
              Vendor Share
            </button>
            <button
              onClick={() => setActiveGeoTab('transit')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeGeoTab === 'transit'
                  ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-2xs font-bold'
                  : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827]'
              }`}
            >
              Cath Lab Transit
            </button>
          </div>
        </div>

        {/* Tab Content with Motion */}
        <AnimatePresence mode="wait">
          {activeGeoTab === 'cluster' && (
            <motion.div
              key="cluster"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#111827] dark:text-slate-200">Metro High-Volume Cluster</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    HIGH TARGET
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                  18 Agencies
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-1">
                  Avg 6.2 miles between stations. Optimal for clustered on-site clinical demonstrations and trade-in presentations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#111827] dark:text-slate-200">Suburban / County Districts</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                    EXPIRING 2026/27
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-[#111827] dark:text-slate-200 tabular-nums">
                  24 Agencies
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-1">
                  Higher Medicare transport volumes. 14 agencies currently navigating CMS GADCS cost collection audits.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#111827] dark:text-slate-200">Rural / Critical Access</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                    AFG FUNDING
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  $480,000 Awarded
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-1">
                  Federal AFG grant funding secured by 4 volunteer &amp; combination fire districts for monitor upgrades.
                </p>
              </div>
            </motion.div>
          )}

          {activeGeoTab === 'market_share' && (
            <motion.div
              key="market_share"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111827] dark:text-slate-200">Territory Defibrillator Fleet Installed Base</span>
                <span className="font-mono text-[11px] text-[#6B7280] dark:text-slate-400">Total: {territoryStats.competitorUnits} Monitor Units</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${territoryStats.strykerPct}%` }} 
                  className="bg-amber-500 transition-all duration-500 relative group cursor-pointer"
                  title={`Stryker: ${territoryStats.strykerPct}%`}
                />
                <div 
                  style={{ width: `${territoryStats.philipsPct}%` }} 
                  className="bg-rose-500 transition-all duration-500 relative group cursor-pointer"
                  title={`Philips (Legacy/EoL): ${territoryStats.philipsPct}%`}
                />
                <div 
                  style={{ width: `${territoryStats.zollPct}%` }} 
                  className="bg-emerald-600 transition-all duration-500 relative group cursor-pointer"
                  title={`ZOLL Installed: ${territoryStats.zollPct}%`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[#374151] dark:text-slate-300 font-medium">Stryker LIFEPAK 15 ({territoryStats.strykerPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-[#374151] dark:text-slate-300 font-medium">Philips MRx EoL ({territoryStats.philipsPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-[#374151] dark:text-slate-300 font-medium">ZOLL X Series ({territoryStats.zollPct}%)</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeGeoTab === 'transit' && (
            <motion.div
              key="transit"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800">
                <div className="text-[11px] font-mono text-[#6B7280] dark:text-slate-400 uppercase">Avg Transport Latency</div>
                <div className="text-xl font-bold font-mono text-[#111827] dark:text-slate-100 mt-0.5">
                  14.8 Minutes
                </div>
                <p className="text-[11px] text-[#374151] dark:text-slate-400 mt-1">
                  Long transit times make ZOLL Real BVM Help &amp; CPR dashboard continuous telemetry mission-critical.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800/60 border border-[#E5E4DF] dark:border-slate-800">
                <div className="text-[11px] font-mono text-[#6B7280] dark:text-slate-400 uppercase">STEMI PCI Cath Lab Distance</div>
                <div className="text-xl font-bold font-mono text-[#047857] dark:text-emerald-400 mt-0.5">
                  18.2 Miles Avg
                </div>
                <p className="text-[11px] text-[#374151] dark:text-slate-400 mt-1">
                  Pre-hospital 12-lead transmission directly to hospital STEMI team saves an average of 22 minutes door-to-balloon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Link to Full Heatmap View */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E4DF] dark:border-slate-800 text-xs">
          <span className="text-[#6B7280] dark:text-slate-400">
            View full county boundaries &amp; real-time GIS spatial demand map
          </span>
          <button
            onClick={() => onNavigateTab('gis')}
            className="text-[#1E3A8A] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open GIS Heatmap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* 4. PRIORITIZED LEADS FEED (MINIMALIST, INTUITIVE CARD STACK) */}
      <div className="space-y-3">
        
        {/* Search & Rapid Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search department, city, county, or Chief..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 text-xs text-[#111827] dark:text-slate-100 placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#1E3A8A] dark:focus:border-blue-500 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[#6B7280] dark:text-slate-400 shrink-0 self-end sm:self-auto">
            Showing <span className="font-bold text-[#111827] dark:text-slate-100">{filteredAgencies.length}</span> of {agencies.length} Accounts
          </div>
        </div>

        {/* Minimalist Filter Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All Ranked', count: agencies.length },
            { id: 'critical', label: '🚨 Critical (90d Expiry)', count: territoryStats.criticalCount },
            { id: 'high_priority', label: '⭐ PulseIQ 80+', count: territoryStats.highPriorityCount },
            { id: 'day_route', label: `🚗 Today's Route (${territoryStats.dayRouteCount})`, count: territoryStats.dayRouteCount },
            { id: 'ems', label: 'EMS Providers', count: agencies.filter(a => a.providerCategory === 'EMS' || !a.agencyType.toLowerCase().includes('fire')).length },
            { id: 'fire', label: 'Fire Departments', count: agencies.filter(a => a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire')).length }
          ].map((pill) => {
            const isActive = filterMode === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFilterMode(pill.id as any)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#111827] dark:bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-300 border border-[#E5E4DF] dark:border-slate-800 hover:bg-[#F8F7F4] dark:hover:bg-slate-800'
                }`}
              >
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lead Cards List with Staggered Motion */}
        <div className="space-y-3">
          {filteredAgencies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E4DF] dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <Search className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
              <div className="text-sm font-bold text-[#111827] dark:text-slate-200">No accounts match this filter</div>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try switching filter pills or resetting your search term to see all territory accounts.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#111827] dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredAgencies.slice(0, visibleCardCount).map((agency, index) => {
              const chiefContact = agency.keyContacts.find(c => c.role.toLowerCase().includes('chief')) || agency.keyContacts[0];
              const isUrgent = agency.competitorContract.renewalWindowDays <= 90;
              const isExpandedLog = expandedLogId === agency.id;
              const pulseScore = agency.zollOpportunity.pulseIqScore;

              return (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    agency.inDayRoute
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : isUrgent
                        ? 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-[#E5E4DF] dark:border-slate-800'
                  }`}
                >
                  {/* Top Card Identity Bar */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Left: Score Badge & Identity */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Polished Executive Score Badge */}
                        <div className="w-11 h-11 rounded-xl bg-[#0F172A] dark:bg-slate-800 text-white flex flex-col items-center justify-center font-mono font-bold shrink-0 border border-slate-700/80 shadow-xs">
                          <span className="text-sm font-bold tabular-nums leading-none">{pulseScore}</span>
                          <span className="text-[7.5px] uppercase tracking-wider font-sans font-semibold text-slate-400 mt-0.5">PulseIQ</span>
                        </div>

                        <div className="min-w-0">
                          {/* Clean unboxed metadata with typographic dot separators */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {agency.providerCategory === 'FIRE' || (agency.agencyType || '').toLowerCase().includes('fire') ? 'Fire Department' : 'EMS Agency'}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>{agency.city || ''}, {agency.stateCode || ''}</span>
                            {isUrgent && (
                              <>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="font-semibold text-amber-700 dark:text-amber-400">
                                  Contract ends in {agency.competitorContract?.renewalWindowDays ?? 90}d
                                </span>
                              </>
                            )}
                            {agency.inDayRoute && (
                              <>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                  Today's Stop
                                </span>
                              </>
                            )}
                          </div>

                          <h3 
                            onClick={() => onSelectAgency(agency)}
                            className="text-base font-bold text-[#0F172A] dark:text-slate-100 hover:text-[#1D4ED8] dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug"
                          >
                            {agency.name || 'Unnamed Agency'}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{agency.address ? `${agency.address} · ` : ''}{agency.county || ''} County</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Stage Pill Selector */}
                      <div className="shrink-0">
                        <select
                          value={agency.zollOpportunity?.salesStage || 'Target Lead'}
                          onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#F8F7F4] dark:bg-slate-800 border border-[#E5E4DF] dark:border-slate-700 text-[#111827] dark:text-slate-200 focus:outline-hidden cursor-pointer"
                        >
                          {stages.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Operational & Installed Base Quick Telemetry */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#E5E4DF] dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#6B7280] dark:text-slate-400 block">Current Defib Fleet</span>
                        <span className="font-bold text-[#111827] dark:text-slate-200 truncate block">
                          {agency.installedFleet?.defibUnitsCount || 0}x {agency.installedFleet?.defibBrand || 'LIFEPAK 15'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#6B7280] dark:text-slate-400 block">Contract Vendor</span>
                        <span className="font-bold text-[#111827] dark:text-slate-200 truncate block">
                          {agency.competitorContract?.vendor || 'Stryker'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#6B7280] dark:text-slate-400 block">Est. ZOLL Deal Size</span>
                        <span className="font-bold text-[#047857] dark:text-emerald-400 font-mono tabular-nums block">
                          ${(agency.zollOpportunity?.projectedPipelineValue || 120000).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#6B7280] dark:text-slate-400 block">Key Official</span>
                        <span className="font-bold text-[#111827] dark:text-slate-200 truncate block">
                          {chiefContact ? `${chiefContact.title || 'Chief'}: ${chiefContact.name || 'Official'}` : 'Fire / EMS Chief'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Visual Intelligence Action Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#E5E4DF] dark:border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-0.5">
                        Intel:
                      </span>

                      <button
                        type="button"
                        onClick={() => setMobileClarityDrawer(prev => ({
                          ...prev,
                          [agency.id]: prev[agency.id] === 'deal_story' ? null : 'deal_story'
                        }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                          mobileClarityDrawer[agency.id] === 'deal_story'
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#1E3A8A] dark:text-blue-300 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Deal Story</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileClarityDrawer(prev => ({
                          ...prev,
                          [agency.id]: prev[agency.id] === 'battlecard' ? null : 'battlecard'
                        }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                          mobileClarityDrawer[agency.id] === 'battlecard'
                            ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Scale className="w-3 h-3" />
                        <span>Battlecard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileClarityDrawer(prev => ({
                          ...prev,
                          [agency.id]: prev[agency.id] === 'score_explainer' ? null : 'score_explainer'
                        }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                          mobileClarityDrawer[agency.id] === 'score_explainer'
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>PulseIQ Breakdown</span>
                      </button>
                    </div>

                    {/* Expandable Mobile Intelligence Drawer */}
                    {mobileClarityDrawer[agency.id] && (
                      <div className="mt-3">
                        {mobileClarityDrawer[agency.id] === 'deal_story' && (
                          <DealStoryBriefingView agency={agency} variant="compact" onOpenFullProfile={onSelectAgency} />
                        )}
                        {mobileClarityDrawer[agency.id] === 'battlecard' && (
                          <CompetitiveBattlecardView agency={agency} variant="compact" onOpenFullProfile={onSelectAgency} />
                        )}
                        {mobileClarityDrawer[agency.id] === 'score_explainer' && (
                          <PulseIqScoreExplainerHub agency={agency} variant="compact" onOpenFullProfile={onSelectAgency} />
                        )}
                      </div>
                    )}

                    {/* Field Quick Action Row (Ergonomic Thumb Targets >= 44px) */}
                    <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-[#E5E4DF] dark:border-slate-800">
                      
                      {/* 1-Tap Navigate Button */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${agency.name}, ${agency.address}, ${agency.city}, ${agency.stateCode}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Open driving navigation in Google Maps"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Navigate</span>
                      </a>

                      {/* 1-Tap Direct Call */}
                      {chiefContact?.phone ? (
                        <a
                          href={`tel:${chiefContact.phone}`}
                          className="h-10 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                          title={`Direct call to ${chiefContact.name}`}
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Chief</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="h-10 px-3.5 rounded-xl bg-[#F8F7F4] dark:bg-slate-800 text-[#9CA3AF] border border-[#E5E4DF] dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 opacity-60 cursor-not-allowed"
                        >
                          <Phone className="w-4 h-4" />
                          <span>No Phone</span>
                        </button>
                      )}

                      {/* 1-Tap Day Route Toggle with Motion Feedback */}
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onToggleRoute(agency.id)}
                        className={`h-10 px-3.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          agency.inDayRoute
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 border-[#E5E4DF] dark:border-slate-700 hover:bg-[#F8F7F4] dark:hover:bg-slate-700'
                        }`}
                        title={agency.inDayRoute ? 'Remove from today’s driving schedule' : 'Add to today’s driving route'}
                      >
                        <Car className="w-4 h-4" />
                        <span>{agency.inDayRoute ? 'Scheduled' : 'Day Route'}</span>
                      </motion.button>

                      {/* 1-Tap Inline Quick Note Toggle */}
                      <button
                        onClick={() => setExpandedLogId(isExpandedLog ? null : agency.id)}
                        className={`h-10 px-3.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isExpandedLog
                            ? 'bg-[#111827] dark:bg-blue-600 text-white border-[#111827] dark:border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 border-[#E5E4DF] dark:border-slate-700 hover:bg-[#F8F7F4] dark:hover:bg-slate-700'
                        }`}
                        title="Log an on-site visit or meeting note in seconds"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Quick Note</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpandedLog ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Full Profile CTA */}
                      <button
                        onClick={() => onSelectAgency(agency)}
                        className="h-10 px-3.5 rounded-xl ml-auto bg-[#F8F7F4] dark:bg-slate-800 hover:bg-[#E5E4DF] dark:hover:bg-slate-700 text-[#111827] dark:text-slate-100 text-xs font-bold border border-[#E5E4DF] dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Open complete clinical, financial & TCO dossier"
                      >
                        <span>Full Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </div>

                  {/* Inline Quick Field Note Drawer (Animated with AnimatePresence) */}
                  <AnimatePresence>
                    {isExpandedLog && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#F8F7F4] dark:bg-slate-800/80 border-t border-[#E5E4DF] dark:border-slate-800 p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                              Log Rapid Field Visit Note ({agency.name})
                            </span>
                            <span className="text-[11px] font-mono text-[#6B7280] dark:text-slate-400">
                              Auto-syncs to central CRM
                            </span>
                          </div>

                          {/* Meeting Type & Quick Presets */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {(['On-Site Station Visit', 'Phone Call', 'Virtual Demo', 'Ride-Along'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setQuickNoteMeetingType(type)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                  quickNoteMeetingType === type
                                    ? 'bg-[#1E3A8A] dark:bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-700 text-[#374151] dark:text-slate-300 border border-[#E5E4DF] dark:border-slate-600'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>

                          {/* Quick Textarea */}
                          <textarea
                            rows={2}
                            value={quickNoteText}
                            onChange={(e) => setQuickNoteText(e.target.value)}
                            placeholder="e.g., Met with Battalion Chief and EMS Captain. Demonstrated X Series Advanced Real BVM Help. Chief interested in scheduling clinical trial next month..."
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-700 text-xs text-[#111827] dark:text-slate-100 placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#1E3A8A] dark:focus:border-blue-500"
                          />

                          {/* Action & Submit Row */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="text-[11px] font-semibold text-[#6B7280] dark:text-slate-400 whitespace-nowrap">
                                Next Step:
                              </span>
                              <input
                                type="text"
                                value={quickNextAction}
                                onChange={(e) => setQuickNextAction(e.target.value)}
                                className="flex-1 sm:w-64 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-700 text-xs text-[#111827] dark:text-slate-100"
                              />
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => setExpandedLogId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveQuickNote(agency.id)}
                                disabled={!quickNoteText.trim()}
                                className="px-4 py-1.5 rounded-xl bg-[#047857] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Save Field Log</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })
          )}
        </div>

        {/* Load More Pagination Button when accounts exceed visibleCardCount */}
        {filteredAgencies.length > visibleCardCount && (
          <div className="pt-2 pb-4 text-center">
            <button
              onClick={() => setVisibleCardCount(prev => prev + 24)}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F1EFEA] dark:hover:bg-slate-700 border border-[#E5E4DF] dark:border-slate-700 text-xs font-bold text-[#111827] dark:text-slate-100 shadow-2xs transition-all cursor-pointer"
            >
              Show More Accounts ({filteredAgencies.length - visibleCardCount} remaining) &darr;
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
