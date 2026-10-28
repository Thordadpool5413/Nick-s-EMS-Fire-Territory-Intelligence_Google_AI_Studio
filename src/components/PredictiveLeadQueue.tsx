/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Agency, LeadStage, ZollProductLine, PredictiveWeights } from '../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Award, 
  Activity, 
  ChevronRight, 
  Bookmark, 
  Navigation, 
  Flame, 
  Siren,
  FileText, 
  Calendar,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  ShieldAlert,
  Sparkles,
  HeartPulse,
  TrendingDown,
  Phone,
  Globe,
  ExternalLink,
  Download,
  Scale,
  ShieldCheck,
  Sliders,
  Columns3,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';
import { PulseIqScoreExplainerHub } from './PulseIqScoreExplainerHub';
import { InteractiveSparkline } from './InteractiveSparkline';
import { UnderstandingPulseIqModal } from './UnderstandingPulseIqModal';
import { formatCurrency, formatEquipmentDisplay, formatInteger, formatPercent } from '../utils/formatters';

interface PredictiveLeadQueueProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onPreviewAgency?: (agency: Agency) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onUpdateStage: (agencyId: string, stage: LeadStage) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenDataLineage?: (agency: Agency) => void;
  onAddAgency?: (agency: Agency) => void;
  initialFilter?: { state?: string; county?: string; city?: string; zip?: string } | null;
  onClearInitialFilter?: () => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
  weights?: PredictiveWeights;
  onOpenWeightsModal?: () => void;
}

import { ALL_50_STATES_SUMMARIES, NATIONAL_COUNTIES_DIRECTORY } from '../data/nationalGeographicData';
import { NATIONAL_ZIP_CITY_REGISTRY } from '../data/nationalZipCityRegistry';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { nationalProviderDb } from '../services/nationalProviderDatabase';

export const PredictiveLeadQueue: React.FC<PredictiveLeadQueueProps> = ({
  agencies,
  onSelectAgency,
  onPreviewAgency,
  onToggleRoute,
  onToggleBookmark,
  onUpdateStage,
  onOpenRfpGenerator,
  onOpenDataLineage,
  onAddAgency,
  initialFilter,
  onClearInitialFilter,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount,
  weights,
  onOpenWeightsModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 120);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [selectedState, setSelectedState] = useState<string>(globalState || 'all');
  const [selectedCounty, setSelectedCounty] = useState<string>(globalCounty || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(globalCity || 'all');
  const [zipFilter, setZipFilter] = useState<string>('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [quickSegment, setQuickSegment] = useState<'all' | 'high_priority' | 'afg' | 'bookmarked'>('all');

  const [viewMode, setViewModeState] = useState<'cards' | 'table' | 'kanban'>(() => {
    try {
      const saved = localStorage.getItem('nicks_agency_view_mode');
      if (saved === 'cards' || saved === 'table' || saved === 'kanban') return saved;
    } catch {
      // ignore
    }
    return 'cards';
  });

  const setViewMode = (mode: 'cards' | 'table' | 'kanban') => {
    setViewModeState(mode);
    try {
      localStorage.setItem('nicks_agency_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const [sortBy, setSortBy] = useState<'pulseIq' | 'fleetAge' | 'calls' | 'value' | 'denial'>('pulseIq');

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [expandedAgencyIds, setExpandedAgencyIds] = useState<Record<string, boolean>>({});
  const [activeClarityDrawer, setActiveClarityDrawer] = useState<Record<string, 'deal_story' | 'battlecard' | 'score_explainer' | null>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showUnderstandingModal, setShowUnderstandingModal] = useState<boolean>(false);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedProduct !== 'all' ? 1 : 0) +
    (selectedStage !== 'all' ? 1 : 0) +
    (selectedState !== 'all' ? 1 : 0) +
    (quickSegment !== 'all' ? 1 : 0);

  const toggleAgencyExpand = (agencyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAgencyIds(prev => ({ ...prev, [agencyId]: !prev[agencyId] }));
  };

  // Sync with Global Persistent Selector Bar
  useEffect(() => {
    if (globalState !== undefined && globalState !== selectedState) {
      setSelectedState(globalState);
      setCurrentPage(1);
    }
  }, [globalState]);

  useEffect(() => {
    if (globalCounty !== undefined && globalCounty !== selectedCounty) {
      setSelectedCounty(globalCounty);
      setCurrentPage(1);
    }
  }, [globalCounty]);

  useEffect(() => {
    if (globalCity !== undefined && globalCity !== selectedCity) {
      setSelectedCity(globalCity);
      setCurrentPage(1);
    }
  }, [globalCity]);

  useEffect(() => {
    if (globalCategory !== undefined && globalCategory !== selectedCategory) {
      setSelectedCategory(globalCategory);
      setCurrentPage(1);
    }
  }, [globalCategory]);

  // Sync filter passed from National Explorer
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.state) setSelectedState(initialFilter.state);
      if (initialFilter.county) setSelectedCounty(initialFilter.county);
      if (initialFilter.city) setSelectedCity(initialFilter.city);
      if (initialFilter.zip) setZipFilter(initialFilter.zip);
      setCurrentPage(1);
      if (onClearInitialFilter) onClearInitialFilter();
    }
  }, [initialFilter, onClearInitialFilter]);

  // Available counties based on selected state from nationwide territory engine (100% full coverage)
  const availableCounties = useMemo(() => {
    if (selectedState === 'all') return [];
    const counties = territoryEngine.getCountiesForState(selectedState);
    const list = new Set<string>();
    for (let i = 0; i < counties.length; i++) {
      list.add(counties[i].countyName);
    }
    return Array.from(list).sort();
  }, [selectedState]);

  // Available cities based on selected state & county from nationwide territory engine (100% full coverage)
  const availableCities = useMemo(() => {
    if (selectedState === 'all') return [];
    return territoryEngine.getCitiesForState(selectedState, selectedCounty !== 'all' ? selectedCounty : undefined);
  }, [selectedState, selectedCounty]);

  const all50StatesList = useMemo(() => {
    return Object.values(ALL_50_STATES_SUMMARIES).sort((a, b) => a.state.localeCompare(b.state));
  }, []);

  // Base geographic pool before EMS vs Fire category toggle so counts on segmented buttons are accurate
  const geographicScopePool = useMemo(() => {
    let basePool: Agency[];
    if (selectedState !== 'all') {
      if (selectedCity !== 'all') {
        const countyToTarget = selectedCounty !== 'all' ? selectedCounty : (availableCounties[0] || `${selectedState} County`);
        basePool = territoryEngine.getAgenciesForJurisdiction(
          selectedState,
          countyToTarget,
          selectedCity,
          agencies,
          'all'
        );
      } else if (selectedCounty !== 'all') {
        basePool = territoryEngine.getAgenciesForCountyAndCities(
          selectedState,
          selectedCounty,
          availableCities,
          agencies,
          'all'
        );
      } else {
        basePool = territoryEngine.getAgenciesForState(selectedState, agencies, 'all');
      }
    } else {
      basePool = agencies;
    }

    const search = debouncedSearchTerm.toLowerCase().trim();
    const zipClean = zipFilter.trim();

    return basePool.filter(agency => {
      if (search) {
        const matchSearch = 
          agency.name.toLowerCase().includes(search) ||
          agency.city.toLowerCase().includes(search) ||
          agency.county.toLowerCase().includes(search) ||
          agency.state.toLowerCase().includes(search) ||
          agency.stateCode.toLowerCase().includes(search) ||
          agency.zipCode.includes(search) ||
          agency.fdid.toLowerCase().includes(search) ||
          agency.keyContacts.some(c => c.name.toLowerCase().includes(search));
        if (!matchSearch) return false;
      }

      if (selectedState !== 'all' && agency.stateCode !== selectedState) return false;
      if (selectedCounty !== 'all') {
        const cA = agency.county.toLowerCase().replace(/\s+(county|parish|borough)$/i, '').trim();
        const cB = selectedCounty.toLowerCase().replace(/\s+(county|parish|borough)$/i, '').trim();
        if (cA !== cB) return false;
      }
      if (selectedCity !== 'all' && agency.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (zipClean && !agency.zipCode.startsWith(zipClean)) return false;
      if (selectedJurisdiction !== 'all' && agency.jurisdictionLevel !== selectedJurisdiction) return false;
      if (selectedProduct !== 'all' && agency.zollOpportunity.primaryTargetProduct !== selectedProduct) return false;
      if (selectedStage !== 'all' && agency.zollOpportunity.salesStage !== selectedStage) return false;
      if (selectedType !== 'all' && agency.agencyType !== selectedType) return false;

      return true;
    });
  }, [agencies, debouncedSearchTerm, selectedState, selectedCounty, selectedCity, zipFilter, selectedJurisdiction, selectedProduct, selectedStage, selectedType, availableCounties, availableCities]);

  const emsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < geographicScopePool.length; i++) {
      if (!geographicScopePool[i].agencyType.toLowerCase().includes('fire')) count++;
    }
    return count;
  }, [geographicScopePool]);

  const fireCount = useMemo(() => {
    return geographicScopePool.length - emsCount;
  }, [geographicScopePool.length, emsCount]);

  const filteredAgencies = useMemo(() => {
    let result = geographicScopePool.filter(agency => {
      if (selectedCategory === 'ems') {
        if (agency.agencyType.toLowerCase().includes('fire')) return false;
      } else if (selectedCategory === 'fire') {
        if (!agency.agencyType.toLowerCase().includes('fire')) return false;
      }

      if (quickSegment === 'high_priority' && (agency.zollOpportunity.pulseIqScore || 0) < 80) return false;
      if (quickSegment === 'afg' && !agency.grantStatus.afgAwarded) return false;
      if (quickSegment === 'bookmarked' && !agency.isBookmarked) return false;

      return true;
    });

    // If territory manager selected a specific county or city but filter narrowed to 0,
    // seamlessly resolve both EMS Providers and Fire Departments from the territory engine
    if (selectedState !== 'all' && (selectedCounty !== 'all' || selectedCity !== 'all') && result.length === 0 && quickSegment === 'all') {
      const countyToResolve = selectedCounty !== 'all' 
        ? selectedCounty 
        : (availableCounties[0] || `${selectedState} County`);
      const cityToResolve = selectedCity !== 'all' ? selectedCity : undefined;
      const synthAgencies = territoryEngine.getAgenciesForJurisdiction(
        selectedState,
        countyToResolve,
        cityToResolve,
        agencies,
        selectedCategory
      );
      if (synthAgencies.length > 0) {
        result = synthAgencies;
      }
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'pulseIq') return (b.zollOpportunity.pulseIqScore || 0) - (a.zollOpportunity.pulseIqScore || 0);
      if (sortBy === 'fleetAge') return b.installedFleet.defibAgeYears - a.installedFleet.defibAgeYears;
      if (sortBy === 'calls') return (b.annualCallVolume || b.annual911Transports) - (a.annualCallVolume || a.annual911Transports);
      if (sortBy === 'value') return b.zollOpportunity.projectedPipelineValue - a.zollOpportunity.projectedPipelineValue;
      if (sortBy === 'denial') return b.cmsData.claimDenialRate - a.cmsData.claimDenialRate;
      return 0;
    });
  }, [geographicScopePool, selectedCategory, quickSegment, selectedState, selectedCounty, selectedCity, availableCounties, agencies, sortBy]);

  const [liveVerifiedVersion, setLiveVerifiedVersion] = useState<number>(0);

  const paginatedAgencies = useMemo(() => {
    const baseSlice = pageSize === -1
      ? filteredAgencies
      : filteredAgencies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    if (activeAccount && currentPage === 1) {
      const withoutActive = baseSlice.filter(a => a.id !== activeAccount.id);
      return [activeAccount, ...withoutActive];
    }
    return baseSlice;
  }, [filteredAgencies, currentPage, pageSize, activeAccount, liveVerifiedVersion]);

  const totalPages = useMemo(() => {
    if (pageSize === -1) return 1;
    return Math.max(1, Math.ceil(filteredAgencies.length / pageSize));
  }, [filteredAgencies.length, pageSize]);

  const stages: LeadStage[] = [
    'Target Lead',
    'Contacted / Intro',
    'Demo Scheduled',
    'Clinical Evaluation Trial',
    'RFP / Quoting',
    'Contract Won'
  ];

  return (
    <div className="workspace-section-grid">
      
      {/* Streamlined Single-Row Filter Bar + Progressive "More Filters" Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3 min-w-0">
        
        {/* Primary Row: Search + State Selector + Quick Segment Tabs + More Filters + Hybrid View Switcher */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 min-w-0">
          
          {/* Left: Search Box + State Dropdown + Quick Segments */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search agency, city, ZIP, NPI, or Chief..."
                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-12 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Provider Discipline Switcher (All / EMS / Fire) - Always Visible on Mobile & Desktop */}
            <div 
              className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto shrink-0"
              role="group"
              aria-label="Provider Discipline Filter"
            >
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                className={`flex-1 sm:flex-initial h-8 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>All</span>
                <span className="font-mono text-[10px] opacity-75">({geographicScopePool.length.toLocaleString()})</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedCategory('ems'); setCurrentPage(1); }}
                className={`flex-1 sm:flex-initial h-8 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedCategory === 'ems'
                    ? 'bg-[#285EE8] text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Siren className="w-3.5 h-3.5 shrink-0" />
                <span>EMS</span>
                <span className="font-mono text-[10px] opacity-80">({emsCount.toLocaleString()})</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedCategory('fire'); setCurrentPage(1); }}
                className={`flex-1 sm:flex-initial h-8 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedCategory === 'fire'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>Fire</span>
                <span className="font-mono text-[10px] opacity-80">({fireCount.toLocaleString()})</span>
              </button>
            </div>

            {/* State Quick Selector */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCounty('all');
                setSelectedCity('all');
                setCurrentPage(1);
              }}
              aria-label="Filter by State"
              className="h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
            >
              <option value="all">All 50 States ({agencies.length.toLocaleString()})</option>
              {all50StatesList.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.state} ({st.code})
                </option>
              ))}
            </select>

            {/* Quick Segment Tabs */}
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {([
                { id: 'all', label: 'All' },
                { id: 'high_priority', label: 'Priority ≥80' },
                { id: 'afg', label: 'AFG Grant' },
                { id: 'bookmarked', label: 'Saved' }
              ] as const).map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    setQuickSegment(seg.id);
                    setCurrentPage(1);
                  }}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    quickSegment === seg.id
                      ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 pl-1">
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {filteredAgencies.length.toLocaleString()}
              </span>
              <span>results</span>
            </div>
          </div>

          {/* Right: Sort + More Filters Toggle + Hybrid Cards/Table View Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              aria-label="Sort Agencies"
              className="h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
            >
              <option value="pulseIq">Sort: PulseIQ Score</option>
              <option value="fleetAge">Sort: Oldest Fleet</option>
              <option value="calls">Sort: 911 Call Volume</option>
              <option value="value">Sort: Est. Project Value</option>
              <option value="denial">Sort: Medicare Denials</option>
            </select>

            {/* Collapsible More Filters Trigger */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className={`h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters || activeFilterCount > 0
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {activeFilterCount > 0 && (
                <span className="font-mono text-[10px] bg-[#1E3A8A] text-white px-1.5 py-0.2 rounded-full tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState('all');
                  setSelectedCounty('all');
                  setSelectedCity('all');
                  setSelectedCategory('all');
                  setSelectedProduct('all');
                  setSelectedStage('all');
                  setQuickSegment('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Reset
              </button>
            )}

            {/* Hybrid View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Clean Executive Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Compact Comparison Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'kanban' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Kanban Deal Pipeline Board View"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Secondary Filters & Export Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              {/* Organization Category */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({geographicScopePool.length.toLocaleString()})
                </button>
                <button
                  onClick={() => { setSelectedCategory('ems'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === 'ems'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  EMS ({emsCount.toLocaleString()})
                </button>
                <button
                  onClick={() => { setSelectedCategory('fire'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === 'fire'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Fire ({fireCount.toLocaleString()})
                </button>
              </div>

              {/* Target Product */}
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="all">All Target Products</option>
                <option value="X Series Advanced">X Series Advanced</option>
                <option value="AutoPulse Resuscitation System">AutoPulse Mechanical CPR</option>
                <option value="ZOLL AED 3 & Public Access Defibrillators">ZOLL AED 3 (PAD)</option>
                <option value="Z Vent Transport Ventilator">Z Vent Transport Ventilator</option>
                <option value="ZOLL Billing / AR Boost">ZOLL Billing &amp; AR Boost</option>
                <option value="ZOLL RescueNet ePCR">RescueNet ePCR Suite</option>
              </select>

              {/* Stage filter */}
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="all">All Sales Stages</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnderstandingModal(true)}
                className="h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Understanding PulseIQ Methodology, Calculation & Prioritization"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Understanding PulseIQ</span>
              </button>

              {/* Calibrate Scoring Weights Trigger */}
              {onOpenWeightsModal && (
                <button
                  type="button"
                  onClick={onOpenWeightsModal}
                  className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                  <span>Calibrate Weights</span>
                </button>
              )}

              {/* 1-Click Territory Call Sheet CSV Export */}
              <button
                type="button"
                onClick={() => {
                  const exportRows = filteredAgencies.slice(0, 500);
                  const headers = [
                    'Department Name',
                    'Category',
                    'Street Address',
                    'City',
                    'County',
                    'State',
                    'ZIP Code',
                    'Command Official',
                    'Official Website',
                    'Google Maps Link',
                    'Installed Defib Brand',
                    'Defib Units',
                    'Fleet Age (Years)',
                    'Annual 911 Calls'
                  ];
                  const rows = exportRows.map((a) => {
                    const chief = a.keyContacts[0];
                    const mapsLink = a.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.name}, ${a.address}`)}`;
                    return [
                      `"${(a.name || '').replace(/"/g, '""')}"`,
                      a.providerCategory || (a.agencyType.toLowerCase().includes('fire') ? 'FIRE' : 'EMS'),
                      `"${(a.address || '').replace(/"/g, '""')}"`,
                      `"${(a.city || '').replace(/"/g, '""')}"`,
                      `"${(a.county || '').replace(/"/g, '""')}"`,
                      a.stateCode,
                      a.zipCode,
                      `"${(chief?.name || '').replace(/"/g, '""')}"`,
                      `"${(a.officialWebsite || '').replace(/"/g, '""')}"`,
                      `"${mapsLink.replace(/"/g, '""')}"`,
                      `"${(a.installedFleet.defibBrand || '').replace(/"/g, '""')}"`,
                      a.installedFleet.defibUnitsCount,
                      a.installedFleet.defibAgeYears,
                      a.annualCallVolume || a.annual911Transports
                    ].join(',');
                  });
                  const csv = [headers.join(','), ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `territory-call-sheet-${selectedState !== 'all' ? selectedState : 'national'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="h-8 px-3 rounded-lg bg-[#1E3A8A] hover:bg-[#111827] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Export filtered accounts to CSV Call Sheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content View */}
      {viewMode === 'cards' ? (
        /* 3-Zone Scannable Summary Card Layout with Progressive Disclosure */
        <div className="workspace-cards-grid">
          {paginatedAgencies.map((agency) => {
            const isFire = agency.agencyType.toLowerCase().includes('fire');
            const isExpanded = Boolean(expandedAgencyIds[agency.id]);

            const fireChiefContact = agency.keyContacts.find(c => c.role === 'Fire Chief' || c.title.toLowerCase().includes('fire')) || agency.keyContacts[0];
            const emsDirectorContact = agency.keyContacts.find(c => c.role === 'EMS Chief' || c.title.toLowerCase().includes('ems')) || agency.keyContacts[1] || agency.keyContacts[0];
            const medicarePct = agency.cmsData.medicarePayerPct ?? 42.0;
            const medicaidPct = agency.cmsData.medicaidPayerPct ?? 24.0;
            const commercialPct = agency.cmsData.commercialPayerMixPct ?? 26.0;
            const cadVendor = agency.installedFleet.dispatchCadVendor || 'CentralSquare Enterprise CAD';
            const receivingHospital = agency.gisData.primaryReceivingHospital || `${agency.city} Regional Medical Center`;
            const hospitalTransports = agency.gisData.annualHospitalDestinationTransports ?? Math.round(agency.annual911Transports * 0.88);

            // Compute 5-pillar sub-scores for micro-bar visualization
            const p1Clinical = Math.min(100, Math.round((agency.annualCardiacArrestCalls || 120) / 3.5 + (35 - Math.min(35, agency.utsteinSurvivalRate || 22)) * 1.8));
            const p2Fleet = Math.min(100, Math.round((agency.installedFleet.defibAgeYears / 10) * 100));
            const p3Cms = Math.min(100, Math.round((agency.cmsData.claimDenialRate / 26) * 100));
            const p4Demo = Math.min(100, Math.round(Math.log10(Math.max(1000, agency.populationServed || 25000)) * 18));
            const p5Grant = agency.grantStatus.afgAwarded ? 95 : 62;
            const pillarBars = [
              { label: 'Clinical Acuity (NEMSIS v3.5)', val: p1Clinical, color: 'bg-[#1E3A8A] dark:bg-blue-500' },
              { label: 'Fleet Age (Modeled Cycle)', val: p2Fleet, color: 'bg-amber-500' },
              { label: 'CMS Recovery (Part B PUF)', val: p3Cms, color: 'bg-blue-500 dark:bg-blue-400' },
              { label: 'Demographics (Census FIPS)', val: p4Demo, color: 'bg-slate-500 dark:bg-slate-400' },
              { label: 'AFG Grant (FEMA Ledger)', val: p5Grant, color: 'bg-emerald-600 dark:bg-emerald-500' }
            ];

            return (
              <div 
                key={agency.id}
                onClick={() => onSelectAgency(agency)}
                className={`min-w-0 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4 group ${
                  activeAccount?.id === agency.id
                    ? 'bg-blue-50/30 dark:bg-slate-800/80 border-2 border-[#1E3A8A] dark:border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs'
                }`}
              >
                {/* TIER 1: TOP ZONE — AGENCY TITLE + UNBOXED MONOSPACE METADATA + PULSEIQ COMPOSITE */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(agency.id);
                        }}
                        className="mt-1 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors shrink-0"
                        title="Save to Watchlist"
                      >
                        <Bookmark className={`w-4 h-4 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>

                      <div className="min-w-0">
                        {/* Clean Metadata Strip */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums text-slate-500 dark:text-slate-400 leading-relaxed mb-0.5">
                          <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${
                            isFire 
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                          }`}>
                            {isFire ? <Flame className="w-3 h-3" /> : <Siren className="w-3 h-3" />}
                            <span>{isFire ? 'Fire Department' : 'EMS Provider'}</span>
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span>FDID <span className="font-mono text-[11px]">{agency.fdid || '04102'}</span></span>
                          {agency.npiNumber && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                              <span>NPI <span className="font-mono text-[11px]">{agency.npiNumber}</span></span>
                            </>
                          )}
                          {agency.grantStatus.afgAwarded && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                                AFG {formatCurrency(agency.grantStatus.afgAwardAmount)}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors leading-snug tracking-[-0.015em] truncate">
                          {agency.name}
                        </h3>

                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{agency.city}, {agency.stateCode}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span>{agency.county} County</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span>ZIP {agency.zipCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Tabular Score Readout + 2px Progress Bar */}
                    <div
                      className="shrink-0 pl-4 border-l border-slate-200 dark:border-slate-800 flex flex-col items-end text-right w-24"
                      onClick={(e) => e.stopPropagation()}
                      title="PulseIQ Composite Score"
                    >
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums leading-none">
                          {agency.zollOpportunity.pulseIqScore}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums">/100</span>
                      </div>

                      <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800 mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#1E3A8A] dark:bg-blue-400"
                          style={{ width: `${Math.min(100, agency.zollOpportunity.pulseIqScore)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">
                        PulseIQ
                      </span>
                    </div>
                  </div>

                  {/* TIER 2: CLEAN 2-COLUMN METRIC LEDGER */}
                  <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden my-2">
                    <div
                      className="p-3 bg-slate-50/70 dark:bg-slate-900/90 space-y-0.5"
                      title="USFA Apparatus Baseline & Fleet Age"
                    >
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Frontline fleet
                      </div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white tabular-nums truncate">
                        {agency.installedFleet.defibUnitsCount} {agency.installedFleet.defibBrand.split(' ')[0]} devices
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        Reported age: {agency.installedFleet.defibAgeYears} yrs · Ends {agency.competitorContract.contractEndDate}
                      </div>
                    </div>

                    <div
                      className="p-3 bg-slate-50/70 dark:bg-slate-900/90 space-y-0.5"
                      title={`CMS Part B PUF & Actuarial Recovery Forecast`}
                    >
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Est. Medicare recovery
                      </div>
                      <div className="font-semibold text-sm text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                        {formatCurrency(agency.cmsData.estimatedRecoverableRevenue, { perYear: true, showSign: true })}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {formatCurrency(agency.zollOpportunity.projectedPipelineValue)} CapEx · {formatPercent(agency.cmsData.claimDenialRate)} denial
                      </div>
                    </div>
                  </div>

                  {/* Progressive Deep Dive Drawer (Collapsible) */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed animate-in fade-in duration-100"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-200 dark:bg-slate-800 gap-px border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Frontline apparatus</span>
                          <div className="font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {agency.totalAmbulances} Amb · {agency.totalFireEngines} Eng
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Claims denial rate</span>
                          <div className="font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                            {agency.cmsData.claimDenialRate}% denied
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Utstein survival</span>
                          <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {agency.utsteinSurvivalRate}% survival
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Annual 911 runs</span>
                          <div className="font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {agency.annual911Transports.toLocaleString()} transports
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div>
                          <span>ePCR/CAD: </span>
                          <strong className="text-slate-900 dark:text-white">{agency.installedFleet.epcrCadSoftware}</strong>
                          <span className="mx-1.5">·</span>
                          <span>Command: </span>
                          <strong className="text-slate-900 dark:text-white">{fireChiefContact?.name}</strong>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <a
                            href={agency.nppesRegistryUrl || (agency.npiNumber ? `https://npiregistry.cms.hhs.gov/provider-view/${agency.npiNumber}` : 'https://npiregistry.cms.hhs.gov/')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E3A8A] dark:text-blue-400 hover:underline"
                          >
                            CMS NPPES &nearr;
                          </a>
                          <span>·</span>
                          <a
                            href={agency.usfaRegistryUrl || 'https://apps.usfa.fema.gov/registry/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E3A8A] dark:text-blue-400 hover:underline"
                          >
                            USFA &nearr;
                          </a>
                          <span>·</span>
                          <a
                            href={agency.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E3A8A] dark:text-blue-400 hover:underline"
                          >
                            Maps &nearr;
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quiet Single-Line Details & Verification Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => toggleAgencyExpand(agency.id, e)}
                      className="font-medium text-slate-600 dark:text-slate-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 cursor-pointer"
                    >
                      {isExpanded ? 'Hide operational details' : 'Show operational details & federal links'}
                    </button>

                    {onOpenDataLineage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDataLineage(agency);
                        }}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                        title="Audit Federal Source Citations"
                      >
                        Source Lineage
                      </button>
                    )}
                  </div>
                </div>

                {/* TIER 3: BOTTOM ACTION SHELF — STAGE SELECT + CLEAN TEXT ACTIONS */}
                <div 
                  className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sales Stage Select */}
                  <select
                    value={agency.zollOpportunity.salesStage}
                    onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                    className="h-8 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Action Group */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                      title="Open Slide-Over Quick Preview Drawer"
                      className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Quick Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleRoute(agency.id)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                        agency.inDayRoute 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={agency.inDayRoute ? 'Remove from today\'s driving itinerary' : 'Add to today\'s driving itinerary'}
                    >
                      {agency.inDayRoute ? 'On Route' : '+ Route'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAgency(agency)}
                      className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Full Dossier &rarr;
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : viewMode === 'kanban' ? (
        /* Interactive 6-Stage Kanban Deal Pipeline Board */
        <div className="space-y-3">
          <div className="flex overflow-x-auto gap-3.5 items-start pb-4 max-w-full">
            {stages.map((stage, stageIdx) => {
              const stageAgencies = filteredAgencies.filter(a => a.zollOpportunity.salesStage === stage);
              const totalStagePipeline = stageAgencies.reduce((sum, a) => sum + (a.zollOpportunity.projectedPipelineValue || 0), 0);
              const weightedStagePipeline = stageAgencies.reduce(
                (sum, a) => sum + ((a.zollOpportunity.projectedPipelineValue || 0) * (a.zollOpportunity.probabilityPct || 25)) / 100,
                0
              );
              const nextStage = stageIdx < stages.length - 1 ? stages[stageIdx + 1] : null;
              const visibleDeals = stageAgencies.slice(0, 18);

              return (
                <div
                  key={stage}
                  className="w-[280px] shrink-0 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5"
                >
                  {/* Column Header */}
                  <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{stage}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {stageAgencies.length}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span className="text-slate-600 dark:text-slate-300">
                        Total: <strong className="text-slate-900 dark:text-white tabular-nums">${(totalStagePipeline / 1000000).toFixed(2)}M</strong>
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                        Wtd: ${(weightedStagePipeline / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>

                  {/* Column Deal Cards */}
                  <div className="space-y-2 max-h-[680px] overflow-y-auto pr-0.5">
                    {visibleDeals.map((agency) => {
                      const isFire = agency.agencyType.toLowerCase().includes('fire');
                      return (
                        <div
                          key={agency.id}
                          onClick={() => onSelectAgency(agency)}
                          className={`p-3 rounded-lg bg-white dark:bg-slate-800 border transition-all cursor-pointer space-y-2 shadow-2xs ${
                            activeAccount?.id === agency.id
                              ? 'border-2 border-[#1E3A8A]'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {agency.city}, {agency.stateCode} · {isFire ? 'Fire' : 'EMS'}
                              </div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug tracking-[-0.01em] line-clamp-2 mt-0.5">
                                {agency.name}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                                {agency.zollOpportunity.pulseIqScore}<span className="text-[10px] text-slate-400 font-normal">/100</span>
                              </div>
                              <div className="w-10 h-[2px] bg-slate-200 dark:bg-slate-700 overflow-hidden mt-0.5 ml-auto rounded-full">
                                <div
                                  className="h-full bg-[#1E3A8A] dark:bg-blue-400"
                                  style={{ width: `${agency.zollOpportunity.pulseIqScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] tabular-nums rounded-md overflow-hidden">
                            <div className="bg-white dark:bg-slate-800 p-1.5">
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Pipeline</span>
                              <strong className="text-slate-900 dark:text-white tabular-nums">
                                ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                              </strong>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-1.5 text-right">
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Rival fleet</span>
                              <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">
                                {agency.installedFleet.defibAgeYears} yrs · {agency.installedFleet.defibUnitsCount} units
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            Target: <strong className="text-slate-700 dark:text-slate-200">{agency.zollOpportunity.primaryTargetProduct}</strong>
                          </div>

                          {/* Instant Stage Progression Controls */}
                          <div
                            className="pt-1.5 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={agency.zollOpportunity.salesStage}
                              onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                              className="h-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 text-[10px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none max-w-[125px] truncate"
                            >
                              {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => onUpdateStage(agency.id, nextStage)}
                                className="h-7 px-2 rounded bg-[#1E3A8A] hover:bg-[#172554] text-white text-[10px] font-semibold inline-flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                                title={`Advance deal to ${nextStage}`}
                              >
                                <span>Advance</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {stageAgencies.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        No accounts in {stage}
                      </div>
                    )}

                    {stageAgencies.length > visibleDeals.length && (
                      <div className="text-center py-1.5 text-[11px] font-mono tabular-nums text-slate-500">
                        +{(stageAgencies.length - visibleDeals.length).toLocaleString()} more in stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* High-Density Clinical Executive Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse tabular-nums">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                  <th
                    onClick={() => setSortBy('pulseIq')}
                    className="py-2.5 px-3 w-28 text-left cursor-pointer hover:text-[#1E3A8A]"
                    title="Sort by PulseIQ Composite Score"
                  >
                    Score {sortBy === 'pulseIq' ? '↓' : ''}
                  </th>
                  <th className="py-2.5 px-4">Agency &amp; jurisdiction</th>
                  <th className="py-2.5 px-3 hidden 2xl:table-cell">Apparatus &amp; command</th>
                  <th
                    onClick={() => setSortBy('fleetAge')}
                    className="py-2.5 px-3 hidden md:table-cell cursor-pointer hover:text-[#1E3A8A]"
                    title="Sort by Fleet Age"
                  >
                    Frontline fleet {sortBy === 'fleetAge' ? '↓' : ''}
                  </th>
                  <th
                    onClick={() => setSortBy('denial')}
                    className="py-2.5 px-3 text-right hidden xl:table-cell cursor-pointer hover:text-[#1E3A8A]"
                    title="Sort by Medicare Denial Rate"
                  >
                    CMS recovery {sortBy === 'denial' ? '↓' : ''}
                  </th>
                  <th className="py-2.5 px-3 text-right hidden lg:table-cell">AFG grant</th>
                  <th
                    onClick={() => setSortBy('value')}
                    className="py-2.5 px-3 text-right hidden sm:table-cell cursor-pointer hover:text-[#1E3A8A]"
                    title="Sort by Projected Pipeline Value"
                  >
                    CapEx value {sortBy === 'value' ? '↓' : ''}
                  </th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Pipeline stage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {paginatedAgencies.map((agency) => {
                  const fireChiefContact = agency.keyContacts.find(c => c.role === 'Fire Chief' || c.title.toLowerCase().includes('fire')) || agency.keyContacts[0];
                  const emsDirectorContact = agency.keyContacts.find(c => c.role === 'EMS Chief' || c.title.toLowerCase().includes('ems')) || agency.keyContacts[1];

                  const pClinical = Math.min(100, Math.round((agency.annualCardiacArrestCalls || 200) / 8));
                  const pFleet = Math.min(100, Math.round((agency.installedFleet.defibAgeYears / 10) * 100));
                  const pCms = Math.min(100, Math.round((agency.cmsData.claimDenialRate / 25) * 100));
                  const pDemo = Math.min(100, Math.round(((agency.gisData?.seniorPopulationPct || 16) / 28) * 100));
                  const pGrant = agency.grantStatus.afgAwarded ? 100 : 45;

                  return (
                    <tr 
                      key={agency.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                    >
                      {/* Unboxed Tabular Score + 2px Progress Bar */}
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1 w-20">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                              {agency.zollOpportunity.pulseIqScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              {agency.installedFleet.defibAgeYears}y
                            </span>
                          </div>
                          <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-[#1E3A8A] dark:bg-blue-400"
                              style={{ width: `${agency.zollOpportunity.pulseIqScore}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-5 gap-0.5 pt-0.5">
                            {[
                              { val: pClinical, color: 'bg-rose-500' },
                              { val: pFleet, color: 'bg-amber-500' },
                              { val: pCms, color: 'bg-emerald-500' },
                              { val: pDemo, color: 'bg-sky-500' },
                              { val: pGrant, color: 'bg-indigo-500' },
                            ].map((seg, idx) => (
                              <div key={idx} className="h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className={`h-full ${seg.color}`} style={{ width: `${seg.val}%` }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Agency Name & Location */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(agency.id);
                            }}
                            className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors"
                            title="Bookmark Lead"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                              {agency.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                              <span>{agency.city}, {agency.stateCode} · {agency.county}</span>
                              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                              <span>{agency.agencyType}</span>
                              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                              <span>FDID <span className="font-mono text-[11px]">{agency.fdid}</span></span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Apparatus & Leadership */}
                      <td className="py-2.5 px-3 hidden 2xl:table-cell">
                        <div className="font-medium text-slate-900 dark:text-white tabular-nums">
                          {agency.totalFireEngines > 0 ? `${agency.totalFireEngines} Eng · ` : ''}{agency.totalAmbulances} ALS/BLS Units
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
                          {fireChiefContact?.name} · {emsDirectorContact?.name}
                        </div>
                      </td>

                      {/* Installed Fleet, ePCR & CAD */}
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-semibold tabular-nums">
                          {agency.installedFleet.defibUnitsCount} {agency.installedFleet.defibBrand.split(' ')[0]} devices ({agency.installedFleet.defibAgeYears}y)
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
                          {agency.installedFleet.epcrCadSoftware}
                        </div>
                      </td>

                      {/* CMS Denial Rate & Payer Mix */}
                      <td className="py-2.5 px-3 text-right hidden xl:table-cell">
                        <div className={`font-semibold tabular-nums ${
                          agency.cmsData.claimDenialRate > 18 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {formatCurrency(agency.cmsData.estimatedRecoverableRevenue, { perYear: true, showSign: true })}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatPercent(agency.cmsData.claimDenialRate)} denial · MCR {agency.cmsData.medicarePayerPct ?? 42}%
                        </div>
                      </td>

                      {/* AFG Grant */}
                      <td className="py-2.5 px-3 text-right hidden lg:table-cell">
                        {agency.grantStatus.afgAwarded ? (
                          <>
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(agency.grantStatus.afgAwardAmount)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              FY{agency.grantStatus.afgFiscalYear}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Target Pipeline Value */}
                      <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                        <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(agency.zollOpportunity.projectedPipelineValue)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {agency.zollOpportunity.probabilityPct}% probability
                        </div>
                      </td>

                      {/* Stage Dropdown */}
                      <td className="py-2.5 px-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={agency.zollOpportunity.salesStage}
                          onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] font-medium cursor-pointer"
                        >
                          {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Open Quick Preview Drawer"
                          >
                            Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectAgency(agency)}
                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#1E3A8A] text-white hover:bg-[#172554] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Open Full Actuarial Dossier"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="font-mono tabular-nums">
            Page <strong className="text-slate-900 dark:text-white tabular-nums">{currentPage}</strong> of <strong className="text-slate-900 dark:text-white tabular-nums">{totalPages}</strong> · Total Matching: <strong className="text-slate-900 dark:text-white tabular-nums">{filteredAgencies.length.toLocaleString()}</strong> EMS &amp; Fire Accounts
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs text-slate-900 dark:text-white font-semibold"
            >
              <option value={24}>24 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 font-semibold text-slate-900 dark:text-white"
            >
              First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 font-semibold text-slate-900 dark:text-white"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 font-semibold text-slate-900 dark:text-white"
            >
              Next
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 font-semibold text-slate-900 dark:text-white"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {filteredAgencies.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <h3 className="text-slate-900 dark:text-white font-bold text-sm">No agencies match current filters</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Reset search or stage filters to expand your territory view.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedProduct('all');
              setSelectedStage('all');
              setSelectedType('all');
              setCurrentPage(1);
            }}
            className="mt-4 px-3.5 py-2 text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-[#172554] rounded-lg transition-colors"
          >
            Reset Queue Filters
          </button>
        </div>
      )}

      {/* Understanding PulseIQ Modal */}
      <UnderstandingPulseIqModal
        isOpen={showUnderstandingModal}
        onClose={() => setShowUnderstandingModal(false)}
        onOpenWeightsModal={onOpenWeightsModal}
      />
    </div>
  );
};
