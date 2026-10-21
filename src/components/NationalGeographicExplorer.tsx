/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { ALL_50_STATES_SUMMARIES, NATIONAL_COUNTIES_DIRECTORY, CountyHealthRecord } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS, EAST_COAST_CALLOUT_STATES } from '../data/usStatesSvgPaths';
import { NATIONAL_ZIP_CITY_REGISTRY, lookupZipCode, searchLocations, getZipCodesForState, ZipCityRecord } from '../data/nationalZipCityRegistry';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { nationalProviderDb } from '../services/nationalProviderDatabase';
import { 
  Globe, 
  MapPin, 
  Building2, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  TrendingDown, 
  Award, 
  DollarSign, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  Navigation,
  Compass,
  FileText,
  Plus,
  Flame,
  Siren,
  BarChart3,
  ListOrdered,
  Scale,
  Car,
  Zap
} from 'lucide-react';
import { PulseIqRegionalBreakdownChart } from './PulseIqRegionalBreakdownChart';
import { RealWorldCountyBoundaryMap } from './RealWorldCountyBoundaryMap';
import { countyBoundaryHierarchy } from '../services/countyBoundaryHierarchyService';
import { PulseIqScoreTooltip } from './PulseIqScoreTooltip';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';
import { PulseIqScoreExplainerHub } from './PulseIqScoreExplainerHub';

interface NationalGeographicExplorerProps {
  agencies: Agency[];
  initialMode?: 'states' | 'counties' | 'cities' | 'pulseiq_chart';
  onModeChange?: (mode: 'states' | 'counties' | 'cities' | 'pulseiq_chart') => void;
  onSelectAgency: (agency: Agency) => void;
  onNavigateToQueueWithFilter?: (stateCode?: string, county?: string, city?: string, zip?: string) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onAddAgency?: (agency: Agency) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
  onSyncGlobalGeography?: (state: string, county: string, city: string, category?: 'all' | 'ems' | 'fire') => void;
}

export const NationalGeographicExplorer: React.FC<NationalGeographicExplorerProps> = ({
  agencies,
  initialMode,
  onModeChange,
  onSelectAgency,
  onNavigateToQueueWithFilter,
  onOpenRfpGenerator,
  onAddAgency,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount,
  onSyncGlobalGeography
}) => {
  // Navigation / Drill-down state
  const [selectedStateCode, setSelectedStateCode] = useState<string>(globalState || 'all');
  const [selectedCountyName, setSelectedCountyName] = useState<string>(globalCounty || 'all');
  const [selectedCityName, setSelectedCityName] = useState<string>(globalCity || 'all');
  const [agencyCategoryFilter, setAgencyCategoryFilter] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');
  const [middleTab, setMiddleTabState] = useState<'states' | 'counties' | 'cities' | 'pulseiq_chart'>(initialMode || 'states');
  const [zipSearchQuery, setZipSearchQuery] = useState<string>('');
  const [debouncedZipQuery, setDebouncedZipQuery] = useState<string>('');
  const [stateFilterInput, setStateFilterInput] = useState<string>('');
  const [cityFilterInput, setCityFilterInput] = useState<string>('');
  const [debouncedCityFilter, setDebouncedCityFilter] = useState<string>('');
  const [countyFilterInput, setCountyFilterInput] = useState<string>('');
  const [debouncedCountyFilter, setDebouncedCountyFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<'All' | 'Northeast' | 'Midwest' | 'South' | 'West'>('All');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedZipQuery(zipSearchQuery), 120);
    return () => clearTimeout(timer);
  }, [zipSearchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedCityFilter(cityFilterInput), 120);
    return () => clearTimeout(timer);
  }, [cityFilterInput]);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedCountyFilter(countyFilterInput), 120);
    return () => clearTimeout(timer);
  }, [countyFilterInput]);

  const setMiddleTab = (nextMode: 'states' | 'counties' | 'cities' | 'pulseiq_chart') => {
    setMiddleTabState(nextMode);
    if (onModeChange) {
      onModeChange(nextMode);
    }
  };

  React.useEffect(() => {
    if (initialMode && initialMode !== middleTab) {
      setMiddleTabState(initialMode);
    }
  }, [initialMode]);

  // Synchronize when Global Selector Bar changes State, County, City, or Category
  React.useEffect(() => {
    if (globalState !== undefined && globalState !== selectedStateCode) {
      setSelectedStateCode(globalState);
      if (globalState === 'all') {
        setMiddleTabState('states');
      } else if (!globalCounty || globalCounty === 'all') {
        setMiddleTabState('counties');
      }
      setCountyPage(1);
      setCityPage(1);
      setAgencyPage(1);
    }
  }, [globalState]);

  React.useEffect(() => {
    if (globalCounty !== undefined && globalCounty !== selectedCountyName) {
      setSelectedCountyName(globalCounty);
      if (globalCounty !== 'all') {
        setMiddleTabState('cities');
      } else if (selectedStateCode !== 'all') {
        setMiddleTabState('counties');
      }
      setCityPage(1);
      setAgencyPage(1);
    }
  }, [globalCounty, selectedStateCode]);

  React.useEffect(() => {
    if (globalCity !== undefined && globalCity !== selectedCityName) {
      setSelectedCityName(globalCity);
      if (globalCity !== 'all') {
        setMiddleTab('cities');
      }
      setAgencyPage(1);
    }
  }, [globalCity]);

  React.useEffect(() => {
    if (globalCategory !== undefined && globalCategory !== agencyCategoryFilter) {
      setAgencyCategoryFilter(globalCategory);
      setAgencyPage(1);
    }
  }, [globalCategory]);

  // Hierarchical data structure mapping all 50 States + DC -> 3,144 County Boundaries -> Incorporated US Census/USPS Cities -> Providers
  const nationalHierarchy = useMemo(() => {
    return countyBoundaryHierarchy.getHierarchy(agencies);
  }, [agencies]);

  // Search locations query matching across cities, counties, and zips
  const matchingLocations = useMemo(() => {
    if (!zipSearchQuery.trim()) return [];
    return searchLocations(zipSearchQuery).slice(0, 8);
  }, [zipSearchQuery]);

  // Direct Zip search result or primary matched record
  const searchedZipRecord = useMemo(() => {
    if (!zipSearchQuery.trim()) return null;
    const clean = zipSearchQuery.trim();
    if (/^\d{5}$/.test(clean)) {
      return lookupZipCode(clean) || null;
    }
    if (matchingLocations.length > 0) {
      return matchingLocations[0];
    }
    return null;
  }, [zipSearchQuery, matchingLocations]);

  // States list sorted alphabetically and filtered by region / stateFilterInput
  const statesList = useMemo(() => {
    const q = stateFilterInput.toLowerCase().trim();
    return Object.values(ALL_50_STATES_SUMMARIES)
      .filter(s => regionFilter === 'All' || s.region === regionFilter)
      .filter(s => {
        if (!q) return true;
        return (
          s.state.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          s.majorCounties.some(mc => mc.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.state.localeCompare(b.state));
  }, [regionFilter, stateFilterInput]);

  // Selected state summary
  const activeStateSummary = useMemo(() => {
    if (selectedStateCode === 'all') return null;
    return ALL_50_STATES_SUMMARIES[selectedStateCode] || null;
  }, [selectedStateCode]);

  // Available counties for selected state
  const availableCounties = useMemo(() => {
    let list: CountyHealthRecord[] = [];
    if (selectedStateCode !== 'all') {
      list = territoryEngine.getCountiesForState(selectedStateCode);
    } else {
      list = NATIONAL_COUNTIES_DIRECTORY;
    }

    if (debouncedCountyFilter.trim()) {
      const q = debouncedCountyFilter.toLowerCase().trim();
      list = list.filter(c => 
        c.countyName.toLowerCase().includes(q) || 
        c.countySeat.toLowerCase().includes(q) ||
        (c.cities && c.cities.some((city: string) => city.toLowerCase().includes(q)))
      );
    }

    if (debouncedZipQuery.trim()) {
      const q = debouncedZipQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.countyName.toLowerCase().includes(q) || 
        c.stateName.toLowerCase().includes(q) ||
        c.stateCode.toLowerCase() === q ||
        c.countySeat.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedStateCode, debouncedCountyFilter, debouncedZipQuery]);

  const [countyPage, setCountyPage] = useState<number>(1);
  const [cityPage, setCityPage] = useState<number>(1);
  const [agencyPage, setAgencyPage] = useState<number>(1);
  const GEO_LIST_PAGE_SIZE = 60;
  const AGENCY_PAGE_SIZE = 30;

  // Precompute state agency counts for O(1) display in the 50-state directory
  const stateAgencyCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < agencies.length; i++) {
      const sc = agencies[i].stateCode;
      map.set(sc, (map.get(sc) || 0) + 1);
    }
    return map;
  }, [agencies]);

  // Available cities for selected state & county with rich metadata across all 50 states
  const availableCities = useMemo(() => {
    // Optimization: Skip computing all 20,973 cities if in states mode with no search
    if (
      selectedStateCode === 'all' &&
      selectedCountyName === 'all' &&
      middleTab !== 'cities' &&
      !debouncedCityFilter.trim() &&
      !debouncedZipQuery.trim()
    ) {
      return [];
    }

    let cities = territoryEngine.getAllCitiesWithMetadata(
      selectedStateCode, 
      selectedCountyName !== 'all' ? selectedCountyName : undefined
    );

    if (debouncedCityFilter.trim()) {
      const q = debouncedCityFilter.toLowerCase().trim();
      cities = cities.filter(c => 
        c.city.toLowerCase().includes(q) || 
        c.county.toLowerCase().includes(q) ||
        c.stateCode.toLowerCase().includes(q) ||
        (c.primaryZip && c.primaryZip.includes(q))
      );
    }

    if (debouncedZipQuery.trim()) {
      const q = debouncedZipQuery.toLowerCase().trim();
      cities = cities.filter(c =>
        c.city.toLowerCase().includes(q) ||
        c.county.toLowerCase().includes(q) ||
        c.stateCode.toLowerCase() === q ||
        (c.primaryZip && c.primaryZip.includes(q))
      );
    }

    return cities;
  }, [selectedStateCode, selectedCountyName, middleTab, debouncedCityFilter, debouncedZipQuery]);

  // Active county record (normalizing County / Parish / Borough suffixes)
  const activeCountyRecord = useMemo(() => {
    if (selectedCountyName === 'all') return null;
    const normTarget = selectedCountyName.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
    return availableCounties.find(c => {
      const normCandidate = c.countyName.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
      return c.countyName.toLowerCase() === selectedCountyName.toLowerCase() || normCandidate === normTarget;
    }) || null;
  }, [selectedCountyName, availableCounties]);

  // Available postal zip codes in this jurisdiction
  const availableZipRecords = useMemo(() => {
    if (selectedStateCode === 'all') {
      return NATIONAL_ZIP_CITY_REGISTRY.slice(0, 36);
    }

    if (selectedCountyName !== 'all' && activeCountyRecord && activeCountyRecord.primaryZipCodes) {
      return activeCountyRecord.primaryZipCodes.map(z => {
        const found = lookupZipCode(z);
        if (found) return found;
        return {
          zipCode: z,
          city: activeCountyRecord.countySeat,
          county: activeCountyRecord.countyName,
          stateCode: activeCountyRecord.stateCode,
          stateName: activeCountyRecord.stateName,
          fipsCounty: activeCountyRecord.countyFips,
          population: Math.round(activeCountyRecord.population * 0.45),
          seniorPopPct: activeCountyRecord.seniorPopPct,
          medianIncome: activeCountyRecord.medianIncome,
          latitude: 38.0,
          longitude: -95.0,
          primaryAgencyName: `${activeCountyRecord.countySeat} Fire & EMS`,
          annualEmergencyTransports: Math.round(activeCountyRecord.annualEmergencyTransports * 0.4),
          annualCardiacCalls: Math.round(activeCountyRecord.annualCardiacArrestIncidents * 0.4),
          cathLabDistanceMiles: activeCountyRecord.primaryCathLabDistanceMiles,
          avgTransportMinutes: activeCountyRecord.averageTransportMinutes,
          medicareDenialRate: activeStateSummary?.avgMedicareDenialRate || 18.5
        } as ZipCityRecord;
      });
    }

    return getZipCodesForState(selectedStateCode).slice(0, 48);
  }, [selectedStateCode, selectedCountyName, activeCountyRecord, activeStateSummary]);

  // Base agency pool for the active geographic jurisdiction (before EMS/Fire category filter)
  const jurisdictionBaseAgencies = useMemo(() => {
    const q = debouncedZipQuery.toLowerCase().trim();
    let list: Agency[] = [];

    if (selectedStateCode !== 'all') {
      if (selectedCityName !== 'all') {
        const countyToTarget = selectedCountyName !== 'all' ? selectedCountyName : (availableCounties[0]?.countyName || `${selectedStateCode} County`);
        list = territoryEngine.getAgenciesForJurisdiction(
          selectedStateCode,
          countyToTarget,
          selectedCityName,
          agencies,
          'all'
        );
      } else if (selectedCountyName !== 'all') {
        list = territoryEngine.getAgenciesForCountyAndCities(
          selectedStateCode,
          selectedCountyName,
          availableCities.map(c => c.city),
          agencies,
          'all'
        );
      } else {
        list = territoryEngine.getAgenciesForState(selectedStateCode, agencies, 'all');
      }
    } else {
      // National view (or if county/city was selected directly from national list)
      if (selectedCountyName !== 'all' && activeCountyRecord?.stateCode) {
        list = territoryEngine.getAgenciesForCountyAndCities(
          activeCountyRecord.stateCode,
          selectedCountyName,
          selectedCityName !== 'all' ? [selectedCityName] : undefined,
          agencies,
          'all'
        );
      } else {
        list = agencies;
      }
      if (selectedCityName !== 'all' && selectedCountyName === 'all') {
        const ctClean = selectedCityName.toLowerCase().trim();
        list = list.filter(a => a.city.toLowerCase().trim() === ctClean);
      }
    }

    if (q) {
      const filtered: Agency[] = [];
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (
          a.name.toLowerCase().includes(q) ||
          a.county.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.stateCode.toLowerCase() === q ||
          a.state.toLowerCase().includes(q) ||
          a.zipCode.includes(q) ||
          a.agencyType.toLowerCase().includes(q)
        ) {
          filtered.push(a);
          if (filtered.length >= 300) break;
        }
      }
      list = filtered;
    }

    return list;
  }, [agencies, selectedStateCode, selectedCountyName, selectedCityName, debouncedZipQuery, availableCounties, availableCities]);

  const emsJurisdictionCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < jurisdictionBaseAgencies.length; i++) {
      if (!jurisdictionBaseAgencies[i].agencyType.toLowerCase().includes('fire')) count++;
    }
    return count;
  }, [jurisdictionBaseAgencies]);

  const fireJurisdictionCount = useMemo(() => {
    return jurisdictionBaseAgencies.length - emsJurisdictionCount;
  }, [jurisdictionBaseAgencies.length, emsJurisdictionCount]);

  // Matching agencies after EMS/Fire category filter
  const matchingAgencies = useMemo(() => {
    return territoryEngine.filterByCategory(jurisdictionBaseAgencies, agencyCategoryFilter);
  }, [jurisdictionBaseAgencies, agencyCategoryFilter]);

  // Aggregated metrics for 'County Summary' mode across the active state or county
  const aggregatedMetrics = useMemo(() => {
    const count = matchingAgencies.length;
    if (count === 0) {
      return {
        totalPipelineValue: 0,
        totalMedicareBilled: 0,
        totalRecoverableRevenue: 0,
        avgClaimDenialRate: 0,
        avgUtsteinSurvival: 0,
        totalAmbulances: 0,
        totalFireEngines: 0,
        total911Transports: 0,
        totalCardiacCalls: 0,
        competitorFleetCount: 0,
        competitorFleetPct: 0,
        afgAwardedCount: 0,
        totalAfgGrantDollars: 0,
        avgPulseIqScore: 0
      };
    }

    let totalPipelineValue = 0;
    let totalMedicareBilled = 0;
    let totalRecoverableRevenue = 0;
    let sumDenialRate = 0;
    let sumSurvival = 0;
    let totalAmbulances = 0;
    let totalFireEngines = 0;
    let total911Transports = 0;
    let totalCardiacCalls = 0;
    let competitorFleetCount = 0;
    let afgAwardedCount = 0;
    let totalAfgGrantDollars = 0;
    let sumPulseIq = 0;

    for (let i = 0; i < count; i++) {
      const a = matchingAgencies[i];
      totalPipelineValue += a.zollOpportunity.projectedPipelineValue;
      totalMedicareBilled += a.cmsData.medicareBilledAnnual;
      totalRecoverableRevenue += a.cmsData.estimatedRecoverableRevenue;
      sumDenialRate += a.cmsData.claimDenialRate;
      sumSurvival += a.utsteinSurvivalRate;
      totalAmbulances += a.totalAmbulances;
      totalFireEngines += a.totalFireEngines;
      total911Transports += a.annual911Transports;
      totalCardiacCalls += a.annualCardiacArrestCalls;
      sumPulseIq += a.zollOpportunity.pulseIqScore;
      if (!a.installedFleet.defibBrand.toLowerCase().includes('zoll')) {
        competitorFleetCount++;
      }
      if (a.grantStatus.afgAwarded) {
        afgAwardedCount++;
        totalAfgGrantDollars += a.grantStatus.afgAwardAmount;
      }
    }

    return {
      totalPipelineValue,
      totalMedicareBilled,
      totalRecoverableRevenue,
      avgClaimDenialRate: +(sumDenialRate / count).toFixed(1),
      avgUtsteinSurvival: +(sumSurvival / count).toFixed(1),
      totalAmbulances,
      totalFireEngines,
      total911Transports,
      totalCardiacCalls,
      competitorFleetCount,
      competitorFleetPct: Math.round((competitorFleetCount / count) * 100),
      afgAwardedCount,
      totalAfgGrantDollars,
      avgPulseIqScore: Math.round(sumPulseIq / count)
    };
  }, [matchingAgencies]);

  const paginatedCounties = useMemo(() => {
    const start = (countyPage - 1) * GEO_LIST_PAGE_SIZE;
    return availableCounties.slice(start, start + GEO_LIST_PAGE_SIZE);
  }, [availableCounties, countyPage]);

  const totalCountyPages = Math.max(1, Math.ceil(availableCounties.length / GEO_LIST_PAGE_SIZE));

  const paginatedCities = useMemo(() => {
    const start = (cityPage - 1) * GEO_LIST_PAGE_SIZE;
    return availableCities.slice(start, start + GEO_LIST_PAGE_SIZE);
  }, [availableCities, cityPage]);

  const totalCityPages = Math.max(1, Math.ceil(availableCities.length / GEO_LIST_PAGE_SIZE));

  const [liveVerifiedVersion, setLiveVerifiedVersion] = useState<number>(0);

  const paginatedAgencies = useMemo(() => {
    const start = (agencyPage - 1) * AGENCY_PAGE_SIZE;
    const slice = matchingAgencies.slice(start, start + AGENCY_PAGE_SIZE);
    if (activeAccount && agencyPage === 1) {
      const withoutActive = slice.filter(a => a.id !== activeAccount.id);
      return [activeAccount, ...withoutActive];
    }
    return slice;
  }, [matchingAgencies, agencyPage, activeAccount, liveVerifiedVersion]);

  const totalAgencyPages = Math.max(1, Math.ceil(matchingAgencies.length / AGENCY_PAGE_SIZE));
  const [hoveredMapStateCode, setHoveredMapStateCode] = useState<string | null>(null);

  // Handle drill down to a state
  const handleSelectState = (stateCode: string) => {
    setSelectedStateCode(stateCode);
    setSelectedCountyName('all');
    setSelectedCityName('all');
    setMiddleTab(stateCode === 'all' ? 'states' : 'counties');
    setZipSearchQuery('');
    setCityFilterInput('');
    setCountyFilterInput('');
    setCountyPage(1);
    setCityPage(1);
    setAgencyPage(1);
    if (onSyncGlobalGeography) {
      onSyncGlobalGeography(stateCode, 'all', 'all', agencyCategoryFilter);
    }
  };

  // Handle select county (synchronizing stateCode when clicked from National view)
  const handleSelectCounty = (countyName: string, stateCode?: string) => {
    const nextState = stateCode && selectedStateCode === 'all' ? stateCode : selectedStateCode;
    const normCurrent = selectedCountyName.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
    const normNext = countyName.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
    if (selectedCountyName !== 'all' && normCurrent === normNext) {
      setSelectedCountyName('all');
      setSelectedCityName('all');
      setMiddleTab('counties');
      if (onSyncGlobalGeography) {
        onSyncGlobalGeography(nextState, 'all', 'all', agencyCategoryFilter);
      }
    } else {
      if (stateCode && selectedStateCode === 'all') {
        setSelectedStateCode(stateCode);
      }
      setSelectedCountyName(countyName);
      setSelectedCityName('all');
      setMiddleTab('cities');
      if (onSyncGlobalGeography) {
        onSyncGlobalGeography(nextState, countyName, 'all', agencyCategoryFilter);
      }
    }
    setCityPage(1);
    setAgencyPage(1);
  };

  // Handle select city (synchronizing stateCode and countyName)
  const handleSelectCity = (cityName: string, countyName: string, stateCode?: string) => {
    const nextState = stateCode && selectedStateCode === 'all' ? stateCode : selectedStateCode;
    if (selectedCityName === cityName) {
      setSelectedCityName('all');
      setMiddleTab('cities');
      if (onSyncGlobalGeography) {
        onSyncGlobalGeography(nextState, countyName, 'all', agencyCategoryFilter);
      }
    } else {
      if (stateCode && selectedStateCode === 'all') {
        setSelectedStateCode(stateCode);
      }
      setSelectedCityName(cityName);
      setSelectedCountyName(countyName);
      setMiddleTab('cities');
      if (onSyncGlobalGeography) {
        onSyncGlobalGeography(nextState, countyName, cityName, agencyCategoryFilter);
      }
    }
    setAgencyPage(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedStateCode('all');
    setSelectedCountyName('all');
    setSelectedCityName('all');
    setAgencyCategoryFilter('all');
    setMiddleTab('states');
    setZipSearchQuery('');
    setCityFilterInput('');
    setCountyFilterInput('');
    setRegionFilter('All');
    setCountyPage(1);
    setCityPage(1);
    setAgencyPage(1);
    if (onSyncGlobalGeography) {
      onSyncGlobalGeography('all', 'all', 'all', 'all');
    }
  };

  // Progressive disclosure state for state cards
  const [expandedStateCodes, setExpandedStateCodes] = useState<Record<string, boolean>>({});
  const toggleStateExpand = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStateCodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  // Determine which single focused view level to display:
  // - 'pulseiq_chart': Recharts breakdown if explicitly selected
  // - 'states': When viewing all 50 states (selectedStateCode === 'all')
  // - 'counties': When a state is selected and no specific county/city is selected yet
  // - 'providers': When a county or city is selected (or user clicked to view providers)
  const activeFocusLevel: 'pulseiq_chart' | 'states' | 'counties' | 'providers' =
    middleTab === 'pulseiq_chart'
      ? 'pulseiq_chart'
      : selectedStateCode === 'all'
        ? 'states'
        : selectedCountyName === 'all' && selectedCityName === 'all' && middleTab !== 'cities'
          ? 'counties'
          : 'providers';

  return (
    <div className="workspace-section-grid">
      
      {/* Contextual Drill-Down Breadcrumb Bar (Only shown when drilled into a State, County, or City) */}
      {activeFocusLevel !== 'states' && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center justify-between gap-3 min-w-0">
          <nav aria-label="Geographic Drill-Down Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All 50 States &amp; DC</span>
            </button>

            {selectedStateCode !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountyName('all');
                    setSelectedCityName('all');
                    setMiddleTab('counties');
                    setCountyPage(1);
                    setAgencyPage(1);
                    if (onSyncGlobalGeography) {
                      onSyncGlobalGeography(selectedStateCode, 'all', 'all', agencyCategoryFilter);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFocusLevel === 'counties'
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{activeStateSummary?.state || selectedStateCode} ({availableCounties.length} Counties)</span>
                </button>
              </>
            )}

            {selectedCountyName !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityName('all');
                    setMiddleTab('cities');
                    setAgencyPage(1);
                    if (onSyncGlobalGeography) {
                      onSyncGlobalGeography(selectedStateCode, selectedCountyName, 'all', agencyCategoryFilter);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCityName === 'all'
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedCountyName}</span>
                </button>
              </>
            )}

            {selectedCityName !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="px-3 py-1.5 rounded-lg font-semibold bg-[#1E3A8A] text-white flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{selectedCityName}</span>
                </span>
              </>
            )}
          </nav>

          {/* Right: Contextual Step Back Action */}
          <div className="flex items-center gap-2">
            {activeFocusLevel === 'providers' && selectedStateCode !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCountyName('all');
                  setSelectedCityName('all');
                  setMiddleTab('counties');
                  if (onSyncGlobalGeography) {
                    onSyncGlobalGeography(selectedStateCode, 'all', 'all', agencyCategoryFilter);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                &larr; Back to {selectedStateCode} Counties
              </button>
            )}

            {activeFocusLevel === 'counties' && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                &larr; All 50 States
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL 1: CLEAN TERRITORY SELECTOR & INTERACTIVE U.S. MAP (NO 50-STATE CARD WALL)
         ===================================================================== */}
      {activeFocusLevel === 'states' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start w-full min-w-0">
          
          {/* Left 7/8 Cols: Interactive U.S. Territory Map */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0 bg-white border border-[#E5E4DF] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(17,24,39,0.03)] grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#E5E4DF]">
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                  <span>Interactive U.S. Territory Map</span>
                </h1>
                <p className="text-xs text-[#4B5563] mt-0.5">
                  Click any State boundary on the map or use the selector on the right to inspect counties and verified EMS &amp; Fire providers.
                </p>
              </div>

              {/* Region Filter Segmented Control (Zero horizontal scrollbar, all 5 regions always visible) */}
              <div className="flex flex-wrap items-center gap-1 bg-[#F8F7F4] p-1 rounded-xl border border-[#E5E4DF] shrink-0">
                {(['All', 'Northeast', 'Midwest', 'South', 'West'] as const).map(reg => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setRegionFilter(reg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      regionFilter === reg
                        ? 'bg-[#111827] text-white shadow-2xs'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG U.S. State Boundary Choropleth Map Canvas */}
            <div className="relative bg-[#F8FAFC] rounded-xl border border-[#E5E4DF] overflow-hidden p-3">
              <svg
                viewBox="0 0 920 500"
                className="w-full h-[380px] sm:h-[440px] select-none"
                role="img"
                aria-label="Interactive United States Territory Boundary Map"
              >
                <defs>
                  <pattern id="us-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                    <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.16)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="920" height="500" fill="url(#us-map-grid)" />

                {/* Alaska & Hawaii Cartographic Inset Frames */}
                <g>
                  <rect x="14" y="356" width="174" height="134" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
                  <text x="24" y="373" fill="#475569" fontSize="10" fontWeight="800" fontFamily="monospace">ALASKA (AK)</text>

                  <rect x="196" y="396" width="124" height="94" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
                  <text x="206" y="413" fill="#475569" fontSize="10" fontWeight="800" fontFamily="monospace">HAWAII (HI)</text>
                </g>

                {/* Layer 1: Authoritative U.S. State Boundary Polygons */}
                <g>
                  {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                    const boundary = US_STATES_SVG_PATHS[st.code];
                    if (!boundary || !boundary.d) return null;

                    const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                    const isHovered = hoveredMapStateCode === st.code;
                    const isHighDenial = st.avgMedicareDenialRate >= 19.5;
                    const countyCount = territoryEngine.getCountiesForState(st.code).length;

                    const fillColor = isHovered
                      ? '#1E3A8A'
                      : !isInRegion
                        ? '#F1F5F9'
                        : isHighDenial
                          ? '#DBEAFE'
                          : '#E2E8F0';

                    const strokeColor = isHovered
                      ? '#0F172A'
                      : !isInRegion
                        ? '#CBD5E1'
                        : '#64748B';

                    return (
                      <path
                        key={`poly-${st.code}`}
                        d={boundary.d}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isHovered ? 2 : 1}
                        opacity={isInRegion ? 1 : 0.45}
                        onClick={() => {
                          handleSelectState(st.code);
                          setMiddleTab('counties');
                        }}
                        onMouseEnter={() => setHoveredMapStateCode(st.code)}
                        onMouseLeave={() => setHoveredMapStateCode(null)}
                        className="cursor-pointer transition-colors duration-150"
                      >
                        <title>{`${st.state} (${st.code}) — Click to inspect ${countyCount} Counties`}</title>
                      </path>
                    );
                  })}
                </g>

                {/* Layer 2: Interior State Labels (42 States + AK + HI, Zero Overlap) */}
                <g>
                  {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                    const isCalloutState = EAST_COAST_CALLOUT_STATES.some((c) => c.code === st.code);
                    if (isCalloutState) return null;

                    const boundary = US_STATES_SVG_PATHS[st.code];
                    if (!boundary) return null;

                    const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                    const isHovered = hoveredMapStateCode === st.code;

                    return (
                      <g
                        key={`lbl-${st.code}`}
                        transform={`translate(${boundary.labelX}, ${boundary.labelY})`}
                        onClick={() => {
                          handleSelectState(st.code);
                          setMiddleTab('counties');
                        }}
                        onMouseEnter={() => setHoveredMapStateCode(st.code)}
                        onMouseLeave={() => setHoveredMapStateCode(null)}
                        className="cursor-pointer"
                        opacity={isInRegion ? 1 : 0.4}
                      >
                        <rect
                          x="-13"
                          y="-9"
                          width="26"
                          height="18"
                          rx="5"
                          fill={isHovered ? '#111827' : '#FFFFFF'}
                          fillOpacity={isHovered ? 1 : 0.92}
                          stroke={isHovered ? '#FFFFFF' : '#94A3B8'}
                          strokeWidth={isHovered ? 1.5 : 1}
                        />
                        <text
                          textAnchor="middle"
                          dy="3.5"
                          fill={isHovered ? '#FFFFFF' : '#0F172A'}
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

                {/* Layer 3: Compact East Coast State Callout Column (VT, NH, MA, RI, CT, NJ, DE, MD, DC) */}
                <g>
                  {EAST_COAST_CALLOUT_STATES.map((item) => {
                    const st = ALL_50_STATES_SUMMARIES[item.code];
                    const boundary = US_STATES_SVG_PATHS[item.code];
                    if (!st || !boundary) return null;

                    const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                    const isHovered = hoveredMapStateCode === st.code;
                    const countyCount = territoryEngine.getCountiesForState(st.code).length;

                    return (
                      <g
                        key={`callout-${st.code}`}
                        onClick={() => {
                          handleSelectState(st.code);
                          setMiddleTab('counties');
                        }}
                        onMouseEnter={() => setHoveredMapStateCode(st.code)}
                        onMouseLeave={() => setHoveredMapStateCode(null)}
                        className="cursor-pointer"
                        opacity={isInRegion ? 1 : 0.4}
                      >
                        <line
                          x1={boundary.labelX}
                          y1={boundary.labelY}
                          x2={item.calloutX}
                          y2={item.calloutY}
                          stroke={isHovered ? '#1E3A8A' : '#94A3B8'}
                          strokeWidth={isHovered ? 1.75 : 1}
                          strokeDasharray={isHovered ? undefined : '2 2'}
                        />
                        <circle
                          cx={boundary.labelX}
                          cy={boundary.labelY}
                          r={isHovered ? 4 : 2.5}
                          fill={isHovered ? '#1E3A8A' : '#475569'}
                        />
                        <rect
                          x={item.calloutX}
                          y={item.calloutY - 10}
                          width="64"
                          height="20"
                          rx="5"
                          fill={isHovered ? '#1E3A8A' : '#FFFFFF'}
                          stroke={isHovered ? '#0F172A' : '#CBD5E1'}
                          strokeWidth={isHovered ? 1.5 : 1}
                        />
                        <text
                          x={item.calloutX + 32}
                          y={item.calloutY + 3.5}
                          textAnchor="middle"
                          fill={isHovered ? '#FFFFFF' : '#0F172A'}
                          fontSize="9.5"
                          fontWeight="800"
                          fontFamily="monospace"
                        >
                          {st.code} · {countyCount}c
                        </text>
                        <title>{`${st.state} (${st.code}) — Click to inspect ${countyCount} Counties`}</title>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Map Legend & Hovered State Live Callout Strip */}
              <div className="mt-2 bg-white border border-[#E5E4DF] rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#111827]">
                {hoveredMapStateCode && ALL_50_STATES_SUMMARIES[hoveredMapStateCode] ? (
                  (() => {
                    const hSt = ALL_50_STATES_SUMMARIES[hoveredMapStateCode];
                    const cCount = territoryEngine.getCountiesForState(hSt.code).length;
                    return (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#1E3A8A] text-white font-mono font-bold">
                          {hSt.code}
                        </span>
                        <strong className="text-[#111827] text-sm">{hSt.state}</strong>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-bold text-[#1E3A8A]">{cCount} Counties</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600">Medicare Denials: <strong className="text-rose-700 font-mono">{hSt.avgMedicareDenialRate}%</strong></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600">FEMA Grants: <strong className="text-emerald-700 font-mono">${(hSt.totalAfgAwardsYtd / 1000000).toFixed(1)}M</strong></span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4B5563]">
                    <span className="flex items-center gap-1.5 font-medium text-[#111827]">
                      <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                      <span>Click any State boundary or East Coast callout badge to inspect its Counties</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#DBEAFE] border border-[#60A5FA] inline-block" />
                      <span>Elevated Claim Denial (&ge;19.5%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#E2E8F0] border border-[#64748B] inline-block" />
                      <span>Standard Territory</span>
                    </span>
                  </div>
                )}
                <span className="font-mono text-[11px] text-[#4B5563] font-semibold">
                  50 States &amp; DC · 3,144 Counties
                </span>
              </div>
            </div>
          </div>

          {/* Right 5/4 Cols: Clean Territory & Jurisdiction Picker */}
          <div className="lg:col-span-5 xl:col-span-4 min-w-0 bg-white border border-[#E5E4DF] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(17,24,39,0.03)] grid grid-cols-1 gap-4">
            <div className="border-b border-[#E5E4DF] pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Step 1 · Select Territory Scope
              </div>
              <h2 className="text-base font-extrabold text-[#111827] mt-0.5">
                Quick State, County &amp; ZIP Selector
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Choose a State or search by County, City, or 5-digit ZIP code to view EMS &amp; Fire providers.
              </p>
            </div>

            {/* Direct State Dropdown Selector */}
            <div className="space-y-1.5">
              <label htmlFor="home-state-picker" className="block text-xs font-bold text-[#111827]">
                1. Choose a State or Jurisdiction
              </label>
              <select
                id="home-state-picker"
                value={selectedStateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  if (code !== 'all') {
                    handleSelectState(code);
                    setMiddleTab('counties');
                  }
                }}
                className="w-full h-10 bg-[#F8F7F4] hover:bg-white border border-[#D4D2CD] rounded-lg px-3 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
              >
                <option value="all">Select a State to inspect counties...</option>
                {Object.values(ALL_50_STATES_SUMMARIES)
                  .sort((a, b) => a.state.localeCompare(b.state))
                  .map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.state} ({st.code}) — {territoryEngine.getCountiesForState(st.code).length} Counties
                    </option>
                  ))}
              </select>
            </div>

            {/* Direct City / County / ZIP Instant Jump */}
            <div className="space-y-1.5">
              <label htmlFor="home-zip-county-search" className="block text-xs font-bold text-[#111827]">
                2. Or Jump Directly by County, City, or ZIP Code
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="home-zip-county-search"
                  type="text"
                  value={zipSearchQuery}
                  onChange={(e) => setZipSearchQuery(e.target.value)}
                  placeholder="Enter County, City, or 5-digit ZIP (e.g., 78701, Cuyahoga)..."
                  className="w-full h-10 bg-[#F8F7F4] hover:bg-white focus:bg-white border border-[#D4D2CD] rounded-lg pl-8 pr-7 text-xs text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#1E3A8A]"
                />
                {zipSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setZipSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Matching Location Instant Results */}
              {zipSearchQuery.trim() && (
                <div className="mt-2 border border-[#E5E4DF] rounded-lg bg-[#F8F7F4] divide-y divide-[#E5E4DF] max-h-52 overflow-y-auto">
                  {matchingLocations.length > 0 ? (
                    matchingLocations.map((loc) => (
                      <button
                        key={`${loc.zipCode}-${loc.city}`}
                        type="button"
                        onClick={() => {
                          handleSelectCity(loc.city, loc.county, loc.stateCode);
                          setZipSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-white transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-[#111827]">
                            {loc.city}, {loc.stateCode} <span className="font-mono text-[#1E3A8A]">({loc.zipCode})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{loc.county}</div>
                        </div>
                        <span className="text-xs font-bold text-[#1E3A8A] shrink-0">Open &rarr;</span>
                      </button>
                    ))
                  ) : availableCounties.length > 0 ? (
                    availableCounties.slice(0, 6).map((c) => (
                      <button
                        key={`${c.stateCode}-${c.countyFips}`}
                        type="button"
                        onClick={() => {
                          handleSelectCounty(c.countyName, c.stateCode);
                          setZipSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-white transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-[#111827]">
                            {c.countyName}, {c.stateCode}
                          </div>
                          <div className="text-[11px] text-slate-500">County Seat: {c.countySeat}</div>
                        </div>
                        <span className="text-xs font-bold text-[#1E3A8A] shrink-0">Inspect &rarr;</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      No matching County, City, or ZIP found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Quick Region State Pills (Filtered by active Region tab) */}
            <div className="space-y-2 pt-2 border-t border-[#E5E4DF]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111827]">
                  3. Quick Jump ({regionFilter === 'All' ? 'All Regions' : `${regionFilter} Region`})
                </span>
                <span className="text-[11px] font-mono text-[#4B5563]">
                  {statesList.length} Jurisdictions
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {statesList.map((st) => (
                  <button
                    key={`quick-${st.code}`}
                    type="button"
                    onClick={() => {
                      handleSelectState(st.code);
                      setMiddleTab('counties');
                    }}
                    onMouseEnter={() => setHoveredMapStateCode(st.code)}
                    onMouseLeave={() => setHoveredMapStateCode(null)}
                    className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      hoveredMapStateCode === st.code
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-[#F8F7F4] hover:bg-white text-[#111827] border-[#E5E4DF]'
                    }`}
                    title={`${st.state} (${st.code})`}
                  >
                    <span className="font-mono font-bold text-xs">{st.code}</span>
                    <span className={`text-[10px] font-mono ${hoveredMapStateCode === st.code ? 'text-blue-200' : 'text-slate-500'}`}>
                      {territoryEngine.getCountiesForState(st.code).length}c
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Priority Accounts & Regional Summary */}
            <div className="pt-3 border-t border-[#E5E4DF] space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                  <span className="text-[11px] text-slate-500 block">Mapped Jurisdictions</span>
                  <span className="text-sm font-mono font-bold text-[#111827] mt-0.5 block">3,144 Counties</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                  <span className="text-[11px] text-slate-500 block">Verified Contact Policy</span>
                  <span className="text-xs font-bold text-emerald-800 mt-0.5 block">Official Web &amp; Maps</span>
                </div>
              </div>

              {onNavigateToQueueWithFilter && (
                <button
                  type="button"
                  onClick={() => onNavigateToQueueWithFilter()}
                  className="w-full h-10 px-4 rounded-lg font-bold text-xs bg-[#1E3A8A] text-white hover:bg-[#111827] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ListOrdered className="w-4 h-4 text-white" />
                  <span>Browse Priority Lead Accounts Queue &rarr;</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          LEVEL 2: COUNTIES IN SELECTED STATE (SINGLE FOCUSED VIEW)
         ===================================================================== */}
      {activeFocusLevel === 'counties' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs grid grid-cols-1 gap-5 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 min-w-0">
            <div>
              <div className="text-xs font-semibold text-[#1E3A8A]">
                {activeStateSummary?.state || selectedStateCode} Territory Drill-Down
              </div>
              <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                Select a County in {activeStateSummary?.state || selectedStateCode} ({availableCounties.length.toLocaleString()})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Click any county card below to view the EMS &amp; Fire providers serving that county.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countyFilterInput}
                  onChange={(e) => {
                    setCountyFilterInput(e.target.value);
                    setCountyPage(1);
                  }}
                  placeholder={`Search ${availableCounties.length} counties or county seats...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:bg-white"
                />
                {countyFilterInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCountyFilterInput('');
                      setCountyPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMiddleTab('cities')}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                View All {matchingAgencies.length} State Providers &rarr;
              </button>
            </div>
          </div>

          {/* Real-World US Census County Boundary Choropleth & Hierarchy Node Inspector */}
          {selectedStateCode !== 'all' && (
            <RealWorldCountyBoundaryMap
              stateCode={selectedStateCode}
              selectedCountyName="all"
              selectedCityName="all"
              agencies={agencies}
              onSelectCounty={(countyName, stCode) => {
                setSelectedStateCode(stCode);
                setSelectedCountyName(countyName);
                setSelectedCityName('all');
                setMiddleTab('cities');
                setAgencyPage(1);
                if (onSyncGlobalGeography) {
                  onSyncGlobalGeography(stCode, countyName, 'all', agencyCategoryFilter);
                }
              }}
              onSelectCity={(cityName, countyName, stCode) => {
                setSelectedStateCode(stCode);
                setSelectedCountyName(countyName);
                setSelectedCityName(cityName);
                setMiddleTab('cities');
                setAgencyPage(1);
                if (onSyncGlobalGeography) {
                  onSyncGlobalGeography(stCode, countyName, cityName, agencyCategoryFilter);
                }
              }}
            />
          )}

          {paginatedCounties.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No counties matched "{countyFilterInput}". Try clearing the search filter.
            </div>
          ) : (
            <div className="workspace-county-grid">
              {paginatedCounties.map(c => {
                const countyCities = c.cities && c.cities.length > 0 ? c.cities : [c.countySeat];
                const cityCountInCounty = countyCities.length;
                return (
                  <div
                    key={`${c.stateCode}-${c.countyFips}`}
                    onClick={() => {
                      setSelectedCountyName(c.countyName);
                      setSelectedCityName('all');
                      setMiddleTab('cities');
                      setAgencyPage(1);
                      if (onSyncGlobalGeography) {
                        onSyncGlobalGeography(c.stateCode, c.countyName, 'all', agencyCategoryFilter);
                      }
                    }}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-[#1E3A8A] hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                            {c.countyName}
                          </h3>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span>Seat: <strong className="text-slate-700 font-medium">{c.countySeat}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">FIPS {c.countyFips}</span>
                            {c.landAreaSqMiles && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{c.landAreaSqMiles} sq mi</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold shrink-0 tabular-nums">
                          {cityCountInCounty} {cityCountInCounty === 1 ? 'City' : 'Cities'} · {cityCountInCounty * 2} Providers
                        </span>
                      </div>

                      {/* Real-World Boundary Coordinates & Verified USPS ZIPs */}
                      <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 tabular-nums">
                        <span>
                          Centroid: {c.centroidLat ? `${c.centroidLat.toFixed(3)}°N, ${c.centroidLng?.toFixed(3)}°W` : 'NAD83 Verified'}
                        </span>
                        {c.primaryZipCodes && c.primaryZipCodes.length > 0 && (
                          <span>ZIPs: {c.primaryZipCodes.slice(0, 3).join(', ')}</span>
                        )}
                      </div>

                      {/* Connected Real US Census / USPS Cities in this County */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                          Incorporated US Census / USPS Cities (Click city to inspect providers):
                        </div>
                        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {countyCities.map(cityName => (
                            <button
                              key={`${c.stateCode}-${c.countyName}-${cityName}`}
                              type="button"
                              onClick={() => {
                                setSelectedStateCode(c.stateCode);
                                setSelectedCountyName(c.countyName);
                                setSelectedCityName(cityName);
                                setMiddleTab('cities');
                                setAgencyPage(1);
                                if (onSyncGlobalGeography) {
                                  onSyncGlobalGeography(c.stateCode, c.countyName, cityName, agencyCategoryFilter);
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-[#1E3A8A] hover:text-white border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              {cityName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs font-mono tabular-nums">
                        <div>
                          <span className="text-[11px] font-sans text-slate-500 block">Population</span>
                          <span className="font-bold text-[#0F172A] mt-0.5 block">{c.population.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-sans text-slate-500 block">MCR Denial</span>
                          <span className="font-bold text-rose-700 mt-0.5 block">{c.medicareDenialRatePct}%</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-sans text-slate-500 block">Avg Transport</span>
                          <span className="font-bold text-[#1E3A8A] mt-0.5 block">{c.averageTransportMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {c.annualCardiacArrestIncidents} OHCA/yr
                      </span>
                      <span className="font-semibold text-[#1E3A8A] group-hover:translate-x-0.5 transition-transform">
                        Inspect All {cityCountInCounty} Cities &amp; Providers &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalCountyPages > 1 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Page {countyPage} of {totalCountyPages} ({availableCounties.length.toLocaleString()} Counties)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={countyPage <= 1}
                  onClick={() => setCountyPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-sans font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={countyPage >= totalCountyPages}
                  onClick={() => setCountyPage(p => Math.min(totalCountyPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-sans font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          LEVEL 3: PROVIDERS IN SELECTED COUNTY / CITY (SINGLE FOCUSED VIEW)
         ===================================================================== */}
      {activeFocusLevel === 'providers' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs grid grid-cols-1 gap-5 min-w-0">
          
          {/* Clean Header with EMS/Fire Filter & Optional City Pills */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 min-w-0">
            <div>
              <div className="text-xs font-semibold text-[#1E3A8A]">
                {selectedCityName !== 'all'
                  ? `${selectedCityName} · ${selectedCountyName !== 'all' ? selectedCountyName : ''} ${selectedStateCode}`
                  : selectedCountyName !== 'all'
                    ? `${selectedCountyName}, ${activeStateSummary?.state || selectedStateCode}`
                    : `${activeStateSummary?.state || selectedStateCode} Statewide Providers`}
              </div>
              <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                EMS &amp; Fire Providers ({matchingAgencies.length.toLocaleString()})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Click any provider card to open its full-screen executive profile.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* All / EMS / Fire Category Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('all'); setAgencyPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    agencyCategoryFilter === 'all'
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({jurisdictionBaseAgencies.length.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('ems'); setAgencyPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                    agencyCategoryFilter === 'ems'
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Siren className="w-3.5 h-3.5" />
                  <span>EMS ({emsJurisdictionCount.toLocaleString()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('fire'); setAgencyPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                    agencyCategoryFilter === 'fire'
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Fire ({fireJurisdictionCount.toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-World County Boundary Polygon & Plotted City Jurisdiction Inspector */}
          {selectedStateCode !== 'all' && selectedCountyName !== 'all' && (
            <RealWorldCountyBoundaryMap
              stateCode={selectedStateCode}
              selectedCountyName={selectedCountyName}
              selectedCityName={selectedCityName}
              agencies={agencies}
              onSelectCounty={(countyName, stCode) => handleSelectCounty(countyName, stCode)}
              onSelectCity={(cityName, countyName, stCode) => handleSelectCity(cityName, countyName, stCode)}
            />
          )}

          {/* Complete Connected City Filter Bar */}
          {availableCities.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>
                    {selectedCountyName !== 'all'
                      ? `Incorporated US Census / USPS Cities in ${selectedCountyName} (${availableCities.length})`
                      : `Incorporated US Census / USPS Cities in ${activeStateSummary?.state || selectedStateCode} (${availableCities.length})`}
                  </span>
                </div>
                {availableCities.length > 12 && (
                  <div className="relative w-56">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cityFilterInput}
                      onChange={(e) => setCityFilterInput(e.target.value)}
                      placeholder="Filter cities or ZIP..."
                      className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityName('all');
                    setAgencyPage(1);
                    if (onSyncGlobalGeography) {
                      onSyncGlobalGeography(selectedStateCode, selectedCountyName, 'all', agencyCategoryFilter);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    selectedCityName === 'all'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Cities ({availableCities.length})
                </button>
                {availableCities.map((c) => {
                  const active = selectedCityName.toLowerCase() === c.city.toLowerCase();
                  return (
                    <button
                      key={`${c.stateCode}-${c.county}-${c.city}`}
                      type="button"
                      onClick={() => handleSelectCity(c.city, c.county, c.stateCode)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{c.city}</span>
                      {selectedCountyName === 'all' && (
                        <span className="ml-1 text-[10px] opacity-70">({c.county.replace(' County', '')})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spacious 2-Column Provider Cards Grid */}
          {paginatedAgencies.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No providers matched the current filter. Click Reset or return to Counties.
            </div>
          ) : (
            <div className="workspace-cards-grid">
              {paginatedAgencies.map(agency => {
                const isFire = agency.agencyType.toLowerCase().includes('fire');
                const primaryContact = agency.keyContacts[0];
                const deptPhone = agency.headquartersPhone || primaryContact?.phone || '';
                const websiteUrl =
                  agency.officialWebsite ||
                  `https://www.google.com/search?q=${encodeURIComponent(`${agency.name} ${agency.city} ${agency.stateCode} official website`)}`;
                const mapsUrl =
                  agency.googleMapsUri ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`;

                return (
                  <div
                    key={agency.id}
                    onClick={() => onSelectAgency(agency)}
                    className="min-w-0 p-4 sm:p-6 rounded-xl border border-slate-200 bg-white hover:border-[#1E3A8A] hover:shadow-md cursor-pointer transition-all grid grid-cols-1 content-between gap-4 group"
                  >
                    <div className="space-y-4">
                      {/* Kicker + Color-Coded Urgent Trigger Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-white ${
                            isFire ? 'bg-[#B91C1C]' : 'bg-[#1E3A8A]'
                          }`}>
                            {isFire ? <Flame className="w-3 h-3" /> : <Siren className="w-3 h-3" />}
                            <span>{isFire ? 'Fire Dept' : 'EMS Provider'}</span>
                          </span>

                          <span className={`px-2 py-0.5 rounded-md font-bold border ${
                            agency.installedFleet.defibAgeYears >= 6
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {agency.installedFleet.defibAgeYears} Yr Old Monitors · {agency.installedFleet.defibWarrantyStatus}
                          </span>

                          {agency.grantStatus.afgAwarded && (
                            <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              FEMA Grant: ${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>

                        {agency.npiNumber && (
                          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tabular-nums">
                            NPI {agency.npiNumber}
                          </span>
                        )}
                      </div>

                      {/* Provider Name + Connected Hierarchy + Score */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors leading-snug">
                            {agency.name}
                          </h3>
                          <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                            {agency.state} ({agency.stateCode}) › {agency.county} › <strong className="text-[#0F172A]">{agency.city}</strong> (ZIP {agency.zipCode})
                          </div>
                        </div>

                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PulseIqScoreTooltip agency={agency} size="compact" showLabel={true} />
                        </div>
                      </div>

                      {/* Clean Single-Box Decision Maker, Verified Street Address & Official Links (Zero Duplicate Links) */}
                      <div
                        className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF] space-y-2 text-xs sm:text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {primaryContact && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 truncate">
                              Decision Maker: <strong className="text-[#111827] font-extrabold">{primaryContact.name}</strong> <span className="text-slate-500">({primaryContact.title})</span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-1.5 text-slate-800">
                          <MapPin className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                          <span className="font-semibold text-[#111827]">{agency.address}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E4DF]">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D4D2CD] hover:border-[#1E3A8A] text-xs font-bold text-[#1E3A8A] transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                            <span>Google Maps Station</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D4D2CD] hover:border-[#1E3A8A] text-xs font-bold text-[#1E3A8A] transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            <span>Official Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* 4 High-Contrast Key Callout Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                          <span className="text-[11px] font-bold text-emerald-900 block">Upgrade Value</span>
                          <span className="text-base font-black font-mono text-emerald-700 mt-0.5 block tabular-nums">
                            ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 truncate block">
                            Exp: {agency.competitorContract.contractEndDate}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80">
                          <span className="text-[11px] font-bold text-rose-900 block">Installed Monitors</span>
                          <span className="text-xs sm:text-sm font-extrabold text-[#111827] mt-0.5 truncate block" title={agency.installedFleet.defibBrand}>
                            {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand}
                          </span>
                          <span className="text-[11px] font-bold text-rose-700 block">
                            {agency.installedFleet.defibAgeYears} yrs old
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80">
                          <span className="text-[11px] font-bold text-[#1E3A8A] block">Claim Recovery</span>
                          <span className="text-base font-black font-mono text-[#1E3A8A] mt-0.5 block tabular-nums">
                            +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 block">
                            {agency.cmsData.claimDenialRate}% Denied
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-600 block">Runs &amp; Survival</span>
                          <span className="text-base font-black font-mono text-[#111827] mt-0.5 block tabular-nums">
                            {agency.annual911Transports.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 block">
                            {agency.utsteinSurvivalRate}% Survival
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Card Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="text-slate-600 truncate">
                        Pitch: <strong className="text-[#111827]">{agency.zollOpportunity.primaryTargetProduct}</strong> · ePCR: <strong className="text-slate-700">{agency.installedFleet.epcrCadSoftware}</strong>
                      </span>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {onOpenRfpGenerator && (
                          <button
                            type="button"
                            onClick={() => onOpenRfpGenerator(agency)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Generate RFP
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectAgency(agency)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#111827] hover:bg-[#1E3A8A] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Open Full Dossier &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalAgencyPages > 1 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Page {agencyPage} of {totalAgencyPages} ({matchingAgencies.length.toLocaleString()} Providers)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={agencyPage <= 1}
                  onClick={() => setAgencyPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-sans font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={agencyPage >= totalAgencyPages}
                  onClick={() => setAgencyPage(p => Math.min(totalAgencyPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-sans font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional PulseIQ Recharts View */}
      {activeFocusLevel === 'pulseiq_chart' && (
        <div className="space-y-4">
          <PulseIqRegionalBreakdownChart
            selectedState={selectedStateCode}
            selectedCounty={selectedCountyName}
            agencies={agencies}
            onSelectCounty={(c) => handleSelectCounty(c)}
            onSelectState={(st) => handleSelectState(st)}
            onSelectAgency={onSelectAgency}
            globalCategory={agencyCategoryFilter}
          />
        </div>
      )}

    </div>
  );
};
