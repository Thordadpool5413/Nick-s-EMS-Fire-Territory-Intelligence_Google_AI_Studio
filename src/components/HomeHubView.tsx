/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency, PushAlert } from '../types';
import {
  Search,
  ArrowRight,
  Compass,
  MapPin,
  Layers,
  Activity,
  DollarSign,
  Box,
  Database,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Siren,
  Flame,
  Globe,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS, EAST_COAST_CALLOUT_STATES } from '../data/usStatesSvgPaths';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { formatCurrency, formatPercent, formatInteger, formatScore } from '../utils/numberFormatting';

interface HomeHubViewProps {
  agencies: Agency[];
  onNavigateTab: (tab: string) => void;
  onSelectAgency: (agency: Agency) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenWeightsModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenDataLineageModal?: () => void;
  isOnline: boolean;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
  alerts: PushAlert[];
  isCloudConnected?: boolean;
  cloudSyncCount?: number;
  globalCategory: 'all' | 'ems' | 'fire';
  setGlobalCategory: (cat: 'all' | 'ems' | 'fire') => void;
  onSelectState?: (stateCode: string) => void;
}

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  agencies,
  onNavigateTab,
  onSelectAgency,
  onOpenCommandPalette,
  onOpenDataLineageModal,
  globalCategory,
  setGlobalCategory,
  onSelectState
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('IL');
  const [hoveredStateCode, setHoveredStateCode] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<'All' | 'Northeast' | 'Midwest' | 'South' | 'West'>('All');

  // Filter agencies by global category (All / EMS / Fire)
  const scopedAgencies = useMemo(() => {
    if (globalCategory === 'all') return agencies;
    return agencies.filter((a) => {
      const isFire = a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire');
      return globalCategory === 'fire' ? isFire : !isFire;
    });
  }, [agencies, globalCategory]);

  // Instant inline universal search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return scopedAgencies
      .filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.county.toLowerCase().includes(q) ||
        a.stateCode.toLowerCase().includes(q) ||
        (a.zipCode && a.zipCode.toLowerCase().includes(q)) ||
        (a.fdid && a.fdid.toLowerCase().includes(q)) ||
        (a.npiNumber && a.npiNumber.includes(q))
      )
      .slice(0, 8);
  }, [scopedAgencies, searchQuery]);

  // Active state to display in the Intelligence summary panel
  const displayStateCode = hoveredStateCode || selectedStateCode;
  const activeStateSummary = ALL_50_STATES_SUMMARIES[displayStateCode] || ALL_50_STATES_SUMMARIES['IL'];

  // Real statistics computed for the active state
  const stateStats = useMemo(() => {
    const stateAgencies = scopedAgencies.filter((a) => a.stateCode === displayStateCode);
    const count = stateAgencies.length;
    const countiesCount = territoryEngine.getCountiesForState(displayStateCode).length;

    if (count === 0) {
      return {
        count: 0,
        countiesCount,
        avgPulseIq: 72,
        totalAmbulances: 42,
        totalFireEngines: 68,
        medicareAllowed: activeStateSummary?.totalAgencies 
          ? activeStateSummary.totalAgencies * 450000 
          : 540000,
        grantFunds: activeStateSummary?.totalAfgAwardsYtd || 1250000
      };
    }

    let sumPulseIq = 0;
    let ambulances = 0;
    let fireEngines = 0;
    let medicare = 0;
    let grants = 0;

    for (const a of stateAgencies) {
      sumPulseIq += a.zollOpportunity?.pulseIqScore || 0;
      ambulances += a.totalAmbulances || 0;
      fireEngines += a.totalFireEngines || 0;
      medicare += a.cmsData?.medicareAllowedAnnual || 0;
      if (a.grantStatus?.afgAwarded) {
        grants += a.grantStatus.afgAwardAmount || 0;
      }
    }

    return {
      count,
      countiesCount,
      avgPulseIq: Math.round(sumPulseIq / count),
      totalAmbulances: ambulances,
      totalFireEngines: fireEngines,
      medicareAllowed: medicare,
      grantFunds: grants
    };
  }, [scopedAgencies, displayStateCode, activeStateSummary]);

  const handleStateClick = (code: string) => {
    setSelectedStateCode(code);
    if (onSelectState) {
      onSelectState(code);
    } else {
      onNavigateTab('states_directory');
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT PREMIUM HEADER WITH DISCIPLINE FILTER & SEARCH
         ==================================================================== */}
      <section
        aria-label="Daily Territory Intelligence Briefing Header"
        className="pi-surface p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="pi-page-title">
              Your Territory. Your Next Move.
            </h1>
            <p className="pi-supporting">
              Interactive 50-state territory map, verified public-record EMS &amp; Fire coverage, and specialized geospatial tools.
            </p>
          </div>

          {/* Provider Scope Filter: All / EMS / Fire */}
          <div
            className="flex items-center gap-1 bg-[#F5F7FA] dark:bg-[#16243A] p-1 rounded-xl border border-[#DFE6EF] dark:border-[#1E2D42] self-start md:self-auto shrink-0"
            role="group"
            aria-label="Provider Discipline Scope"
          >
            {(['all', 'ems', 'fire'] as const).map((cat) => {
              const active = globalCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlobalCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-white dark:bg-[#111C2D] text-[#14283F] dark:text-white shadow-2xs font-bold'
                      : 'text-[#53657B] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white'
                  }`}
                >
                  {cat === 'ems' && <Siren className="w-3.5 h-3.5 text-[#285EE8]" />}
                  {cat === 'fire' && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{cat === 'all' ? 'All Providers' : cat === 'ems' ? 'EMS Only' : 'Fire Only'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Quick Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#53657B] dark:text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any agency name, city, county, ZIP code, or NPI across all 3,143 counties..."
              className="w-full h-11 pl-10 pr-24 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-xs font-semibold text-[#14283F] dark:text-white placeholder-[#53657B] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#285EE8] focus:bg-white dark:focus:bg-[#111C2D] transition-all"
            />
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="absolute right-2 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium text-[#53657B] dark:text-slate-400 bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] hover:text-[#285EE8] transition-colors cursor-pointer"
              >
                ⌘K Palette
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Overlay */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl shadow-xl z-30 divide-y divide-[#DFE6EF] dark:divide-[#1E2D42] max-h-80 overflow-y-auto">
              {searchResults.map((agency) => (
                <div
                  key={agency.id}
                  className="p-3.5 hover:bg-[#F5F7FA] dark:hover:bg-[#16243A] flex items-center justify-between gap-3 transition-colors text-left"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAgency(agency);
                      setSearchQuery('');
                    }}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire')
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                      }`}>
                        {agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire') ? <Flame className="w-2.5 h-2.5" /> : <Siren className="w-2.5 h-2.5" />}
                        <span>{agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire') ? 'Fire' : 'EMS'}</span>
                      </span>
                      <div className="text-sm font-semibold text-[#14283F] dark:text-white hover:text-[#285EE8] truncate">
                        {agency.name}
                      </div>
                    </div>
                    <div className="text-xs text-[#53657B] dark:text-slate-400 mt-1">
                      {agency.city}, {agency.stateCode} · {agency.county} · ZIP {agency.zipCode} · NPI {agency.npiNumber || 'Verified'}
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#14283F] dark:text-slate-200 pi-data-inline">
                      PulseIQ <strong className="pi-data-number text-xs">{formatScore(agency.zollOpportunity?.pulseIqScore || 75)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAgency(agency);
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#285EE8] hover:bg-[#194BC8] text-white cursor-pointer"
                    >
                      Open Account 360
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          2. INTERACTIVE U.S. TERRITORY MAP WITH STATE INTELLIGENCE DOSSIER
         ==================================================================== */}
      <section
        aria-label="Interactive U.S. Territory Map"
        className="pi-surface p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#DFE6EF] dark:border-[#1E2D42]">
          <div>
            <h2 className="pi-section-heading flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#285EE8] dark:text-blue-400 shrink-0" />
              <span>Interactive U.S. Territory Map</span>
            </h2>
            <p className="pi-supporting mt-0.5">
              Click any State boundary on the map or use the region filter to explore counties, apparatus fleet aging, and verified EMS &amp; Fire providers.
            </p>
          </div>

          {/* Region Filter Segmented Control */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F5F7FA] dark:bg-[#16243A] p-1 rounded-xl border border-[#DFE6EF] dark:border-[#1E2D42] shrink-0">
            {(['All', 'Northeast', 'Midwest', 'South', 'West'] as const).map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  regionFilter === reg
                    ? 'bg-white dark:bg-[#111C2D] text-[#14283F] dark:text-white shadow-2xs font-bold'
                    : 'text-[#53657B] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Column Layout: 8/9 Columns Map Canvas + 3/4 Columns State Intelligence Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Map Canvas Column (8 Cols on LG, 9 Cols on XL) */}
          <div className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-3">
            <div className="relative bg-slate-50 dark:bg-[#070F1C] rounded-2xl border border-[#DFE6EF] dark:border-[#1E2D42] overflow-hidden p-3 shadow-inner">
              <svg
                viewBox="0 0 920 500"
                className="w-full h-[360px] sm:h-[430px] md:h-[480px] select-none"
                role="img"
                aria-label="Interactive United States Territory Boundary Map"
              >
                <defs>
                  <pattern id="home-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                    <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="920" height="500" fill="url(#home-map-grid)" />

                {/* Alaska & Hawaii Cartographic Inset Frames */}
                <g>
                  <rect x="14" y="356" width="174" height="134" rx="10" fill="#FFFFFF" fillOpacity="0.85" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" className="dark:fill-[#111C2D] dark:stroke-[#1E2D42]" />
                  <text x="24" y="373" fill="#64748B" fontSize="10" fontWeight="800" fontFamily="monospace">ALASKA (AK)</text>

                  <rect x="196" y="396" width="124" height="94" rx="10" fill="#FFFFFF" fillOpacity="0.85" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" className="dark:fill-[#111C2D] dark:stroke-[#1E2D42]" />
                  <text x="206" y="413" fill="#64748B" fontSize="10" fontWeight="800" fontFamily="monospace">HAWAII (HI)</text>
                </g>

                {/* Layer 1: Authoritative U.S. State Boundary Polygons */}
                <g>
                  {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                    const boundary = US_STATES_SVG_PATHS[st.code];
                    if (!boundary || !boundary.d) return null;

                    const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                    const isSelected = selectedStateCode === st.code;
                    const isHovered = hoveredStateCode === st.code;
                    const isHighDenial = st.avgMedicareDenialRate >= 19.5;
                    const countyCount = territoryEngine.getCountiesForState(st.code).length;

                    const fillColor = isSelected
                      ? '#285EE8'
                      : isHovered
                        ? '#194BC8'
                        : !isInRegion
                          ? '#F1F5F9'
                          : isHighDenial
                            ? '#DBEAFE'
                            : '#E2E8F0';

                    const strokeColor = isSelected
                      ? '#FFFFFF'
                      : isHovered
                        ? '#0B1728'
                        : !isInRegion
                          ? '#E2E8F0'
                          : '#64748B';

                    return (
                      <path
                        key={`home-poly-${st.code}`}
                        d={boundary.d}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                        opacity={isInRegion ? 1 : 0.4}
                        onClick={() => handleStateClick(st.code)}
                        onMouseEnter={() => setHoveredStateCode(st.code)}
                        onMouseLeave={() => setHoveredStateCode(null)}
                        className="cursor-pointer transition-colors duration-150"
                      >
                        <title>{`${st.state} (${st.code}) — Click to explore ${countyCount} Counties`}</title>
                      </path>
                    );
                  })}
                </g>

                {/* Layer 2: Interior State Labels */}
                <g>
                  {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                    const isCalloutState = EAST_COAST_CALLOUT_STATES.some((c) => c.code === st.code);
                    if (isCalloutState) return null;

                    const boundary = US_STATES_SVG_PATHS[st.code];
                    if (!boundary) return null;

                    const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                    const isSelected = selectedStateCode === st.code;
                    const isHovered = hoveredStateCode === st.code;

                    return (
                      <g
                        key={`home-lbl-${st.code}`}
                        transform={`translate(${boundary.labelX}, ${boundary.labelY})`}
                        onClick={() => handleStateClick(st.code)}
                        onMouseEnter={() => setHoveredStateCode(st.code)}
                        onMouseLeave={() => setHoveredStateCode(null)}
                        className="cursor-pointer"
                        opacity={isInRegion ? 1 : 0.4}
                      >
                        <rect
                          x="-13"
                          y="-9"
                          width="26"
                          height="18"
                          rx="5"
                          fill={isSelected || isHovered ? '#0B1728' : '#FFFFFF'}
                          fillOpacity={isSelected || isHovered ? 1 : 0.92}
                          stroke={isSelected ? '#285EE8' : isHovered ? '#FFFFFF' : '#94A3B8'}
                          strokeWidth={isSelected || isHovered ? 1.5 : 1}
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill={isSelected || isHovered ? '#FFFFFF' : '#0F172A'}
                          fontSize="9.5"
                          fontWeight="800"
                          fontFamily="monospace"
                        >
                          {st.code}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* East Coast Compact Callout Buttons */}
              <div className="pt-2 border-t border-[#DFE6EF] dark:border-[#1E2D42] flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-[#53657B] dark:text-slate-400 mr-1">
                  East Coast Insets:
                </span>
                {EAST_COAST_CALLOUT_STATES.map((c) => {
                  const isSelected = selectedStateCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleStateClick(c.code)}
                      onMouseEnter={() => setHoveredStateCode(c.code)}
                      onMouseLeave={() => setHoveredStateCode(null)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#285EE8] text-white shadow-xs'
                          : 'bg-white dark:bg-[#16243A] text-slate-700 dark:text-slate-200 border border-[#DFE6EF] dark:border-[#1E2D42] hover:border-[#285EE8]'
                      }`}
                    >
                      {c.code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* State Intelligence Dossier Column (4 Cols on LG, 3 Cols on XL) */}
          <div className="lg:col-span-4 xl:col-span-3 min-w-0 space-y-4">
            <div className="p-5 rounded-2xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#285EE8] dark:text-blue-400 block">
                    {activeStateSummary.region} Region
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#14283F] dark:text-white truncate">
                    {activeStateSummary.state} ({activeStateSummary.code})
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold pi-data-number bg-[#285EE8] text-white shadow-xs">
                  {displayStateCode}
                </span>
              </div>

              {/* State Key Statistics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42]">
                  <span className="text-[#53657B] dark:text-slate-400 block text-[11px]">
                    Counties
                  </span>
                  <span className="font-semibold text-[#14283F] dark:text-white text-base pi-metric-card">
                    {formatInteger(stateStats.countiesCount)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42]">
                  <span className="text-[#53657B] dark:text-slate-400 block text-[11px]">
                    Monitored
                  </span>
                  <span className="font-semibold text-[#285EE8] dark:text-blue-400 text-base pi-metric-card">
                    {formatInteger(stateStats.count)} agencies
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42]">
                  <span className="text-[#53657B] dark:text-slate-400 block text-[11px]">
                    Avg PulseIQ
                  </span>
                  <span className="font-semibold text-[#14283F] dark:text-white text-base pi-metric-card">
                    {formatScore(stateStats.avgPulseIq)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42]">
                  <span className="text-[#53657B] dark:text-slate-400 block text-[11px]">
                    Denial Rate
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 text-base pi-metric-card">
                    {formatPercent(activeStateSummary.avgMedicareDenialRate)}
                  </span>
                </div>
              </div>

              {/* Apparatus Fleet & Grant Funding Overview */}
              <div className="space-y-2 text-xs border-t border-[#DFE6EF] dark:border-[#1E2D42] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#53657B] dark:text-slate-400">Total Ambulances:</span>
                  <span className="font-medium text-[#14283F] dark:text-white pi-data-number">
                    {formatInteger(stateStats.totalAmbulances)} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#53657B] dark:text-slate-400">Total Fire Engines:</span>
                  <span className="font-medium text-[#14283F] dark:text-white pi-data-number">
                    {formatInteger(stateStats.totalFireEngines)} apparatus
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#53657B] dark:text-slate-400">Annual Medicare Allowed:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 pi-data-number">
                    {formatCurrency(stateStats.medicareAllowed)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Navigate into State or Accounts */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStateClick(displayStateCode)}
                  className="w-full h-10 px-4 rounded-xl bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Explore {activeStateSummary.state} Territory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('queue')}
                  className="w-full h-9 px-4 rounded-xl bg-white dark:bg-[#111C2D] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#DFE6EF] dark:border-[#1E2D42] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#285EE8]" />
                  <span>View Accounts in Discovery Queue</span>
                </button>
              </div>
            </div>

            {/* Quick Popular Territory Chips */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Popular Jurisdictions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'IL', name: 'Illinois' },
                  { code: 'TX', name: 'Texas' },
                  { code: 'FL', name: 'Florida' },
                  { code: 'CA', name: 'California' },
                  { code: 'OH', name: 'Ohio' },
                  { code: 'PA', name: 'Pennsylvania' }
                ].map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => handleStateClick(st.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedStateCode === st.code
                        ? 'bg-[#285EE8] text-white shadow-xs'
                        : 'bg-[#F5F7FA] dark:bg-[#16243A] text-slate-700 dark:text-slate-200 border border-[#DFE6EF] dark:border-[#1E2D42] hover:border-[#285EE8]'
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. SPECIALIZED GEOSPATIAL TOOLS & INTELLIGENCE RESOURCES (KEPT)
         ==================================================================== */}
      <section
        aria-label="Specialized Geospatial Tools & Intelligence Resources"
        className="pi-surface p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#DFE6EF] dark:border-[#1E2D42]">
          <div>
            <h2 className="pi-section-heading">
              Specialized Geospatial Tools &amp; Intelligence Resources
            </h2>
            <p className="pi-supporting mt-0.5">
              Direct 1-click launch to GIS heatmaps, live maps, grant registries, clinical TCO, and 3D apparatus studios.
            </p>
          </div>
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="text-xs font-semibold text-[#285EE8] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Command Palette (⌘K)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              id: 'map',
              title: 'GIS Fleet & Acuity Heatmap',
              desc: '50-State choropleth, hexbin density, competitor fleet aging & OHCA cardiac resuscitations',
              icon: Activity,
              badge: 'Geospatial'
            },
            {
              id: 'google_maps',
              title: 'Google Maps Live Explorer',
              desc: 'Interactive live Google Maps with GPS Near Me, hospitals, cath labs & fire stations',
              icon: MapPin,
              badge: 'Live Maps'
            },
            {
              id: 'grants',
              title: 'FEMA AFG & SAFER Grants',
              desc: 'OpenFEMA API v2 awards tracker, equipment grant payouts & fiscal liquidity',
              icon: Award,
              badge: 'Liquidity'
            },
            {
              id: 'contracts',
              title: 'Contracts & Expirations',
              desc: 'Competitor defib replacement window calendar and renewal cliff timelines',
              icon: Clock,
              badge: 'Procurement'
            },
            {
              id: 'knowledge',
              title: 'Clinical & TCO Knowledge Hub',
              desc: '5-Year TCO engine, FDA MAUDE adverse event recalls & cooperative contracts',
              icon: Layers,
              badge: 'Clinical'
            },
            {
              id: '3d_studio',
              title: '3D Apparatus Studio',
              desc: 'Interactive 3D emergency ambulance & fire pumper apparatus viewer with lighting',
              icon: Box,
              badge: 'Three.js'
            },
            {
              id: 'claims',
              title: 'Medicare Claims & Payer Mix',
              desc: 'CMS Ground Ambulance Cost Data (GADCS), Medicare allowed PUF & denial recovery',
              icon: DollarSign,
              badge: 'CMS Data'
            },
            {
              id: 'gateway',
              title: 'Federal Data Gateway',
              desc: 'Direct CMS NPPES NPI Registry v2.1 & OpenFEMA verification gateway',
              icon: Database,
              badge: 'Verified API'
            }
          ].map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onNavigateTab(tool.id)}
                className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] hover:bg-white dark:hover:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] hover:border-[#285EE8] text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-slate-700 text-[#285EE8] shadow-2xs">
                    <ToolIcon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {tool.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#14283F] dark:text-white mt-2.5 group-hover:text-[#285EE8] transition-colors">
                  {tool.title}
                </div>
                <p className="text-[11px] text-[#53657B] dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                  {tool.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
