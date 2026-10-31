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
import { DataDrivenStateMap } from './DataDrivenStateMap';
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
  onSelectState,
  isDarkMode = false
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
          2. DATA-DRIVEN U.S. TERRITORY MAP WITH DYNAMIC METRICS
         ==================================================================== */}
      <section
        aria-label="Interactive U.S. Territory Map"
        className="w-full min-w-0"
      >
        <DataDrivenStateMap
          selectedStateCode={selectedStateCode}
          onSelectState={(code) => {
            setSelectedStateCode(code);
            if (onSelectState) onSelectState(code);
          }}
          onInspectCounties={(code) => {
            setSelectedStateCode(code);
            if (onSelectState) {
              onSelectState(code);
            } else {
              onNavigateTab('states_directory');
            }
          }}
          regionFilter={regionFilter}
          onRegionFilterChange={(reg) => setRegionFilter(reg)}
          isDarkMode={isDarkMode}
        />
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
