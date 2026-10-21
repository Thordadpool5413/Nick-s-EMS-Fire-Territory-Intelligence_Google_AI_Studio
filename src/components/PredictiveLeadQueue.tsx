/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Agency, LeadStage, ZollProductLine } from '../types';
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
  ShieldCheck
} from 'lucide-react';
import { PulseIqScoreTooltip } from './PulseIqScoreTooltip';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';
import { PulseIqScoreExplainerHub } from './PulseIqScoreExplainerHub';
import { InteractiveSparkline } from './InteractiveSparkline';

interface PredictiveLeadQueueProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
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
}

import { ALL_50_STATES_SUMMARIES, NATIONAL_COUNTIES_DIRECTORY } from '../data/nationalGeographicData';
import { NATIONAL_ZIP_CITY_REGISTRY } from '../data/nationalZipCityRegistry';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { nationalProviderDb } from '../services/nationalProviderDatabase';

export const PredictiveLeadQueue: React.FC<PredictiveLeadQueueProps> = ({
  agencies,
  onSelectAgency,
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
  activeAccount
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default to spacious executive cards
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'denial' | 'fleetAge' | 'calls'>('score');

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [expandedAgencyIds, setExpandedAgencyIds] = useState<Record<string, boolean>>({});
  const [activeClarityDrawer, setActiveClarityDrawer] = useState<Record<string, 'deal_story' | 'battlecard' | 'score_explainer' | null>>({});

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
        return !agency.agencyType.toLowerCase().includes('fire');
      } else if (selectedCategory === 'fire') {
        return agency.agencyType.toLowerCase().includes('fire');
      }
      return true;
    });

    // If territory manager selected a specific county or city but filter narrowed to 0,
    // seamlessly resolve both EMS Providers and Fire Departments from the territory engine
    if (selectedState !== 'all' && (selectedCounty !== 'all' || selectedCity !== 'all') && result.length === 0) {
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
      if (sortBy === 'score') return b.zollOpportunity.pulseIqScore - a.zollOpportunity.pulseIqScore;
      if (sortBy === 'value') return b.zollOpportunity.projectedPipelineValue - a.zollOpportunity.projectedPipelineValue;
      if (sortBy === 'denial') return b.cmsData.claimDenialRate - a.cmsData.claimDenialRate;
      if (sortBy === 'fleetAge') return b.installedFleet.defibAgeYears - a.installedFleet.defibAgeYears;
      if (sortBy === 'calls') return b.annualCallVolume - a.annualCallVolume;
      return 0;
    });
  }, [geographicScopePool, selectedCategory, selectedState, selectedCounty, selectedCity, availableCounties, agencies, sortBy]);

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
      
      {/* Unified Clinical Executive Filter & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] grid grid-cols-1 gap-3.5 min-w-0">
        
        {/* Top Row: Classification Segmented Control + Active Global Jurisdiction Context */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <span>All Organizations</span>
              <span className={`font-mono text-[11px] tabular-nums ${selectedCategory === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                {geographicScopePool.length.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => { setSelectedCategory('ems'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                selectedCategory === 'ems'
                  ? 'bg-[#1E3A8A] text-white'
                  : 'text-slate-600 hover:text-[#1E3A8A]'
              }`}
            >
              <span>EMS Providers</span>
              <span className={`font-mono text-[11px] tabular-nums ${selectedCategory === 'ems' ? 'text-slate-200' : 'text-slate-400'}`}>
                {emsCount.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => { setSelectedCategory('fire'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                selectedCategory === 'fire'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <span>Fire Departments</span>
              <span className={`font-mono text-[11px] tabular-nums ${selectedCategory === 'fire' ? 'text-slate-300' : 'text-slate-400'}`}>
                {fireCount.toLocaleString()}
              </span>
            </button>
          </div>

          {/* Synced Jurisdiction Context & Count */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Scope:</span>
              <strong className="text-[#0F172A]">
                {selectedState === 'all'
                  ? 'All 50 States & DC'
                  : `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})`}
              </strong>
              {selectedCounty !== 'all' && (
                <>
                  <span aria-hidden="true">·</span>
                  <strong className="text-[#0F172A]">{selectedCounty}</strong>
                </>
              )}
              {selectedCity !== 'all' && (
                <>
                  <span aria-hidden="true">·</span>
                  <strong className="text-[#0F172A]">{selectedCity}</strong>
                </>
              )}
            </span>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="font-mono text-slate-500">
              Showing <strong className="text-[#0F172A] tabular-nums">{paginatedAgencies.length.toLocaleString()}</strong> of <strong className="text-[#0F172A] tabular-nums">{filteredAgencies.length.toLocaleString()}</strong> accounts
            </span>
          </div>
        </div>

        {/* Second Row: Search Input + Target Product, Sales Stage, Sort & View Mode */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,1fr)_auto] gap-2.5 items-center min-w-0">
          
          {/* Search box */}
          <div className="relative w-full min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter queue by department, city, ZIP, FDID, Fire Chief, or EMS Director..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-14 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-[#0F172A]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Pipeline & Sort Selectors + View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Target Product */}
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-[#1E3A8A]"
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
              className="h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All Sales Stages</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="score">Sort: Priority Score (Highest First)</option>
              <option value="value">Sort: Est. Project Value</option>
              <option value="denial">Sort: Uncollected Medicare Claims</option>
              <option value="fleetAge">Sort: Oldest Equipment Fleet</option>
              <option value="calls">Sort: Annual 911 Call Volume</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-white text-[#0F172A] shadow-2xs' 
                    : 'text-slate-500 hover:text-[#0F172A]'
                }`}
                title="Scannable Summary Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Summary Cards</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white text-[#0F172A] shadow-2xs' 
                    : 'text-slate-500 hover:text-[#0F172A]'
                }`}
                title="Compact Comparison Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact Table</span>
              </button>
            </div>

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
                  'Priority Score'
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
                    a.zollOpportunity.pulseIqScore
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
              className="h-9 px-3 rounded-lg bg-[#1E3A8A] hover:bg-[#111827] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Export filtered accounts to CSV Call Sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Call Sheet (CSV)</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'cards' ? (
        /* 3-Zone Scannable Summary Card Layout with Progressive Disclosure */
        <div className="workspace-cards-grid">
          {paginatedAgencies.map((agency) => {
            const score = agency.zollOpportunity.pulseIqScore;
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

            return (
              <div 
                key={agency.id}
                onClick={() => onSelectAgency(agency)}
                className={`min-w-0 rounded-xl p-4 sm:p-6 transition-all cursor-pointer grid grid-cols-1 content-between gap-4 group ${
                  activeAccount?.id === agency.id
                    ? 'bg-[#F8F7F4] border-2 border-[#1E3A8A]'
                    : 'bg-white border border-[#E5E4DF] hover:border-[#1E3A8A]/60 shadow-[0_1px_3px_rgba(17,24,39,0.03)]'
                }`}
              >
                {/* Zone 1: Inline Text Kicker + Agency Title + Priority Score */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(agency.id);
                        }}
                        className="mt-1 text-slate-300 hover:text-amber-500 transition-colors shrink-0"
                        title="Save to Watchlist"
                      >
                        <Bookmark className={`w-4 h-4 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-white ${
                            isFire ? 'bg-[#B91C1C]' : 'bg-[#1E3A8A]'
                          }`}>
                            {isFire ? 'Fire Dept' : 'EMS Provider'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md font-bold border ${
                            agency.installedFleet.defibAgeYears >= 6
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {agency.installedFleet.defibAgeYears} Yr Old Monitors · {agency.installedFleet.defibWarrantyStatus}
                          </span>

                          <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            Exp: {agency.competitorContract.contractEndDate}
                          </span>

                          {agency.grantStatus.afgAwarded && (
                            <span
                              className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono tabular-nums"
                              title="Approved FEMA Assistance to Firefighters Grant funding available for equipment upgrades"
                            >
                              FEMA Grant: ${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-[#111827] group-hover:text-[#1E3A8A] transition-colors truncate">
                          {agency.name}
                        </h3>

                        <div className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                          <span className="font-semibold text-[#111827]">
                            {agency.state} ({agency.stateCode}) › {agency.county} › {agency.city} (ZIP {agency.zipCode})
                          </span>
                          {agency.npiNumber && (
                            <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md tabular-nums">
                              NPI {agency.npiNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Pulse IQ Priority Score Callout */}
                    <div
                      className="shrink-0 pl-3 border-l border-[#E5E4DF]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PulseIqScoreTooltip agency={agency} size="compact" showLabel={true} />
                    </div>
                  </div>

                  {/* Consolidated Decision Maker, Street Address & Official Links (Zero Duplicate Links) */}
                  <div
                    className="mt-3.5 p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF] space-y-2 text-xs sm:text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-500">Decision Maker: </span>
                        <strong className="text-[#111827] font-extrabold">{fireChiefContact?.name}</strong>
                        <span className="text-slate-600"> ({fireChiefContact?.title})</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        HQ: <strong className="text-[#111827]">{agency.address}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E4DF]">
                      <a
                        href={agency.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D4D2CD] hover:border-[#1E3A8A] text-xs font-bold text-[#1E3A8A] transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                        <span>Google Maps Station</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={agency.officialWebsite || `https://www.google.com/search?q=${encodeURIComponent(`${agency.name} ${agency.city} ${agency.stateCode} official website`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D4D2CD] hover:border-[#1E3A8A] text-xs font-bold text-[#1E3A8A] transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span>Official Department Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Zone 2: 4 High-Contrast Decision Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3.5 text-xs">
                    {/* Col 1: Est. Project Value & Fleet Size */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80" title="Estimated total equipment & software upgrade value for this department">
                      <div className="text-[11px] font-bold text-emerald-900">Upgrade Value</div>
                      <div className="mt-0.5 font-mono font-black text-emerald-700 tabular-nums text-base sm:text-lg">
                        ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[11px] text-emerald-900 mt-0.5 font-semibold">
                        {agency.totalFireEngines > 0 ? `${agency.totalFireEngines} Eng · ` : ''}{agency.totalAmbulances} Amb
                      </div>
                    </div>

                    {/* Col 2: Current Monitors & Age */}
                    <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80" title="Current cardiac monitors in use and their average age in years">
                      <div className="text-[11px] font-bold text-rose-900">Installed Monitors</div>
                      <div className="mt-0.5 font-extrabold text-[#111827] text-xs sm:text-sm truncate">
                        {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand}
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5 font-bold">
                        {agency.installedFleet.defibAgeYears} yrs old ({agency.installedFleet.defibWarrantyStatus})
                      </div>
                    </div>

                    {/* Col 3: Recoverable Medicare Revenue */}
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80" title="Estimated annual Medicare revenue currently lost to claim denials that can be recovered with automated charting">
                      <div className="text-[11px] font-bold text-[#1E3A8A]">Claim Recovery</div>
                      <div className="mt-0.5 font-mono font-black text-[#1E3A8A] tabular-nums text-base sm:text-lg">
                        +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr
                      </div>
                      <div className="text-[11px] text-slate-700 mt-0.5 font-semibold">
                        {agency.cmsData.claimDenialRate}% Denied
                      </div>
                    </div>

                    {/* Col 4: Clinical Survival & Transports */}
                    <div className="p-2.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]" title="Utstein cardiac survival rate and annual 911 ambulance transports">
                      <div className="text-[11px] font-bold text-slate-600">Survival &amp; Runs</div>
                      <div className="mt-0.5 font-mono font-black text-[#111827] tabular-nums text-base sm:text-lg">
                        {agency.utsteinSurvivalRate}% Survival
                      </div>
                      <div className="text-[11px] text-slate-700 mt-0.5 font-semibold">
                        {agency.annual911Transports.toLocaleString()} Transports/yr
                      </div>
                    </div>
                  </div>

                  {/* Micro Visual Telemetry Sparklines: Cardiac Velocity & TCO Savings Divergence */}
                  {(() => {
                    const cardiacCalls = agency.annualCardiacArrestCalls || Math.round((agency.annual911Transports || 3000) * 0.12);
                    const estSavings5Yr = agency.installedFleet?.defibUnitsCount
                      ? Math.round(agency.installedFleet.defibUnitsCount * 14800)
                      : Math.round((agency.zollOpportunity.projectedPipelineValue || 120000) * 0.45);

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 p-2.5 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-rose-800 flex items-center gap-1">
                              <HeartPulse className="w-3 h-3 text-rose-600" />
                              <span>Cardiac Velocity (5-Yr)</span>
                            </span>
                            <span className="font-mono font-bold text-slate-700 tabular-nums">
                              {cardiacCalls.toLocaleString()} OHCA
                            </span>
                          </div>
                          <InteractiveSparkline
                            data={[
                              Math.round(cardiacCalls * 0.88),
                              Math.round(cardiacCalls * 0.92),
                              Math.round(cardiacCalls * 0.95),
                              Math.round(cardiacCalls * 0.98),
                              cardiacCalls
                            ]}
                            color="rose"
                            height={26}
                            valueSuffix=" calls"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3 text-emerald-600" />
                              <span>5-Yr TCO Divergence</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-700 tabular-nums">
                              +${(estSavings5Yr / 1000).toFixed(0)}K Net
                            </span>
                          </div>
                          <InteractiveSparkline
                            data={[
                              Math.round(estSavings5Yr * 0.18),
                              Math.round(estSavings5Yr * 0.38),
                              Math.round(estSavings5Yr * 0.58),
                              Math.round(estSavings5Yr * 0.79),
                              estSavings5Yr
                            ]}
                            color="emerald"
                            height={26}
                            valuePrefix="+$"
                            valueSuffix=""
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Clean 1-Line Software Stack & Expand Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="truncate">
                      <span className="text-slate-500">Software Stack: </span>
                      <strong className="text-[#111827]">{agency.installedFleet.epcrCadSoftware}</strong>
                      <span className="text-slate-500"> · Billing: </span>
                      <strong className="text-[#111827]">{agency.installedFleet.billingSoftware}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleAgencyExpand(agency.id, e)}
                      className="text-xs font-semibold text-[#1E3A8A] hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {isExpanded ? 'Hide Extra Details ▲' : 'Show Extra Details ▼'}
                    </button>
                  </div>

                  {/* 3 High-Impact Clarity Action Buttons for Territory Managers */}
                  <div 
                    className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#E5E4DF]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-0.5">
                      Visual Intel:
                    </span>

                    {/* Deal Story Button */}
                    <button
                      type="button"
                      onClick={() => setActiveClarityDrawer(prev => ({
                        ...prev,
                        [agency.id]: prev[agency.id] === 'deal_story' ? null : 'deal_story'
                      }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                        activeClarityDrawer[agency.id] === 'deal_story'
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                          : 'bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Deal Story</span>
                    </button>

                    {/* Battlecard Button */}
                    <button
                      type="button"
                      onClick={() => setActiveClarityDrawer(prev => ({
                        ...prev,
                        [agency.id]: prev[agency.id] === 'battlecard' ? null : 'battlecard'
                      }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                        activeClarityDrawer[agency.id] === 'battlecard'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>Battlecard vs {agency.installedFleet.defibBrand.split(' ')[0]}</span>
                    </button>

                    {/* PulseIQ Score Explainer Button */}
                    <button
                      type="button"
                      onClick={() => setActiveClarityDrawer(prev => ({
                        ...prev,
                        [agency.id]: prev[agency.id] === 'score_explainer' ? null : 'score_explainer'
                      }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                        activeClarityDrawer[agency.id] === 'score_explainer'
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                          : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      <span>PulseIQ Breakdown</span>
                    </button>

                    {/* Data Lineage Audit Button */}
                    {onOpenDataLineage && (
                      <button
                        type="button"
                        onClick={() => onOpenDataLineage(agency)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer"
                        title="Audit verified 7-pillar data lineage for this department"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Data Lineage</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Clarity Preview Drawer (Expandable without leaving the card) */}
                  {activeClarityDrawer[agency.id] && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      {activeClarityDrawer[agency.id] === 'deal_story' && (
                        <DealStoryBriefingView 
                          agency={agency} 
                          variant="compact" 
                          onOpenFullProfile={onSelectAgency} 
                        />
                      )}
                      {activeClarityDrawer[agency.id] === 'battlecard' && (
                        <CompetitiveBattlecardView 
                          agency={agency} 
                          variant="compact" 
                          onOpenFullProfile={onSelectAgency} 
                        />
                      )}
                      {activeClarityDrawer[agency.id] === 'score_explainer' && (
                        <PulseIqScoreExplainerHub 
                          agency={agency} 
                          variant="compact" 
                          onOpenFullProfile={onSelectAgency} 
                        />
                      )}
                    </div>
                  )}

                  {/* Progressive Disclosure Drawer for Secondary Telemetry */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600 cursor-default"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                        <div>
                          <span className="font-sans text-slate-500">CAD &amp; ePCR: </span>
                          <strong className="text-[#0F172A]">{cadVendor} · {agency.installedFleet.epcrCadSoftware}</strong>
                        </div>
                        <div>
                          <span className="font-sans text-slate-500">Billing Suite: </span>
                          <strong className="text-[#0F172A]">{agency.installedFleet.billingSoftware}</strong>
                        </div>
                        <div className="truncate" title={receivingHospital}>
                          <span className="font-sans text-slate-500">Receiving Center: </span>
                          <strong className="text-[#0F172A]">{receivingHospital} ({hospitalTransports.toLocaleString()}/yr)</strong>
                        </div>
                        <div>
                          <span className="font-sans text-slate-500">Payer Mix: </span>
                          <strong className="text-[#0F172A]">{medicarePct}% MCR · {medicaidPct}% MCD · {commercialPct}% COM</strong>
                        </div>
                      </div>

                      {emsDirectorContact && emsDirectorContact.id !== fireChiefContact?.id && (
                        <div className="pt-1.5 border-t border-slate-100 text-xs text-slate-600">
                          <span className="text-slate-400">EMS Director: </span>
                          <strong className="text-[#0F172A]">{emsDirectorContact.name}</strong> ({emsDirectorContact.title})
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Zone 3: Target Product Summary + Primary Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  
                  {/* Stage Selector & Target Product */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={agency.zollOpportunity.salesStage}
                        onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                        className="h-8 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-[#1E3A8A]"
                      >
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <span className="text-slate-500 truncate hidden sm:inline">
                      Target: <strong className="text-[#0F172A]">{agency.zollOpportunity.primaryTargetProduct}</strong>
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    {onOpenRfpGenerator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRfpGenerator(agency);
                        }}
                        title="Generate Pre-Emptive Technical RFP Specifications"
                        className="h-8 px-3 rounded-lg text-xs font-semibold bg-white text-[#1E3A8A] hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span>RFP Spec</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRoute(agency.id);
                      }}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                        agency.inDayRoute 
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{agency.inDayRoute ? 'On Route' : 'Route'}</span>
                    </button>

                    <button
                      onClick={() => onSelectAgency(agency)}
                      className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-[#0F172A] hover:bg-[#1E3A8A] text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <span>Inspect Provider</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Clinical Executive Table View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-14 text-center">PulseIQ</th>
                  <th className="py-3 px-4">Agency / Jurisdiction</th>
                  <th className="py-3 px-3 hidden 2xl:table-cell">Apparatus &amp; Leadership</th>
                  <th className="py-3 px-3 hidden md:table-cell">Installed Fleet &amp; CAD</th>
                  <th className="py-3 px-3 text-right hidden xl:table-cell">CMS &amp; Payer Mix</th>
                  <th className="py-3 px-3 text-right hidden lg:table-cell">AFG Grant</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">Pipeline Est.</th>
                  <th className="py-3 px-3 hidden md:table-cell">Sales Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAgencies.map((agency) => {
                  const score = agency.zollOpportunity.pulseIqScore;
                  const fireChiefContact = agency.keyContacts.find(c => c.role === 'Fire Chief' || c.title.toLowerCase().includes('fire')) || agency.keyContacts[0];
                  const emsDirectorContact = agency.keyContacts.find(c => c.role === 'EMS Chief' || c.title.toLowerCase().includes('ems')) || agency.keyContacts[1];

                  return (
                    <tr 
                      key={agency.id}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      onClick={() => onSelectAgency(agency)}
                    >
                      {/* Score Indicator with Interactive Factor Tooltip */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <PulseIqScoreTooltip agency={agency} size="badge" showLabel={false} />
                      </td>

                      {/* Agency Name & Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(agency.id);
                            }}
                            className="mt-0.5 text-slate-300 hover:text-amber-500 transition-colors"
                            title="Bookmark Lead"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                          <div>
                            <div className="font-bold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                              {agency.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 font-mono">
                              <span>{agency.city}, {agency.stateCode} · {agency.county}</span>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span className="font-sans">{agency.agencyType}</span>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span className="text-slate-500">FDID {agency.fdid}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Apparatus & Leadership */}
                      <td className="py-3 px-3 hidden 2xl:table-cell">
                        <div className="font-mono font-semibold text-[#0F172A] tabular-nums">
                          {agency.totalFireEngines > 0 ? `${agency.totalFireEngines} Eng · ` : ''}{agency.totalAmbulances} ALS/BLS Units
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[210px]">
                          {fireChiefContact?.name} · {emsDirectorContact?.name}
                        </div>
                      </td>

                      {/* Installed Fleet, ePCR & CAD */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="text-[#0F172A] font-medium">
                          {agency.installedFleet.defibBrand} ({agency.installedFleet.defibAgeYears}y, {agency.installedFleet.defibUnitsCount}u)
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[210px]">
                          {agency.installedFleet.epcrCadSoftware} · {agency.installedFleet.dispatchCadVendor || 'Enterprise CAD'}
                        </div>
                      </td>

                      {/* CMS Denial Rate & Payer Mix */}
                      <td className="py-3 px-3 text-right hidden xl:table-cell">
                        <div className={`font-mono font-bold tabular-nums ${
                          agency.cmsData.claimDenialRate > 18 ? 'text-rose-700' : 'text-[#0F172A]'
                        }`}>
                          {agency.cmsData.claimDenialRate}% Den · +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          MCR {agency.cmsData.medicarePayerPct ?? 42}% · COM {agency.cmsData.commercialPayerMixPct}%
                        </div>
                      </td>

                      {/* AFG Grant */}
                      <td className="py-3 px-3 text-right hidden lg:table-cell">
                        {agency.grantStatus.afgAwarded ? (
                          <>
                            <div className="font-mono font-bold text-emerald-700 tabular-nums">
                              ${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              FY{agency.grantStatus.afgFiscalYear}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Target Pipeline Value */}
                      <td className="py-3 px-3 text-right hidden sm:table-cell">
                        <div className="font-mono font-bold text-[#0F172A] tabular-nums">
                          ${(agency.zollOpportunity.projectedPipelineValue / 1000).toLocaleString()}K
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                          {agency.zollOpportunity.probabilityPct}% prob
                        </div>
                      </td>

                      {/* Stage Dropdown */}
                      <td className="py-3 px-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={agency.zollOpportunity.salesStage}
                          onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-[#0F172A] focus:outline-none focus:border-[#1E3A8A] font-semibold"
                        >
                          {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenRfpGenerator && (
                            <button
                              onClick={() => onOpenRfpGenerator(agency)}
                              title="Generate Pre-Emptive RFP Specifications"
                              className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-white text-[#1E3A8A] hover:bg-slate-50 transition-colors border border-slate-200"
                            >
                              RFP
                            </button>
                          )}

                          <button
                            onClick={() => onToggleRoute(agency.id)}
                            title={agency.inDayRoute ? 'Remove from today\'s field route' : 'Add to today\'s field route'}
                            className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                              agency.inDayRoute 
                                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Navigation className="w-3 h-3" />
                            <span className="hidden sm:inline">{agency.inDayRoute ? 'In Route' : 'Route'}</span>
                          </button>

                          <button
                            onClick={() => onSelectAgency(agency)}
                            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-[#0F172A] text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-1"
                            title="Inspect Provider Dossier"
                          >
                            <span>Inspect</span>
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="font-mono">
            Page <strong className="text-[#0F172A]">{currentPage}</strong> of <strong className="text-[#0F172A]">{totalPages}</strong> · Total Matching: <strong className="text-[#0F172A] tabular-nums">{filteredAgencies.length.toLocaleString()}</strong> EMS &amp; Fire Accounts
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-[#0F172A] font-semibold"
            >
              <option value={24}>24 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-[#0F172A]"
            >
              First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-[#0F172A]"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-[#0F172A]"
            >
              Next
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-[#0F172A]"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {filteredAgencies.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <h3 className="text-[#0F172A] font-bold text-sm">No agencies match current filters</h3>
          <p className="text-slate-500 text-xs mt-1">Reset search or stage filters to expand your territory view.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedProduct('all');
              setSelectedStage('all');
              setSelectedType('all');
              setCurrentPage(1);
            }}
            className="mt-4 px-3.5 py-2 text-xs font-semibold bg-[#0F172A] text-white hover:bg-[#1E3A8A] rounded-lg transition-colors"
          >
            Reset Queue Filters
          </button>
        </div>
      )}

    </div>
  );
};
