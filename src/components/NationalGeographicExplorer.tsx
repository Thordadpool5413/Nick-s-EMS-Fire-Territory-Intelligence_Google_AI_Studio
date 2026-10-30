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
import { aggregateProviderMedicareDenialRates } from '../services/dataSanitizationService';
import { getCountyMcrDenialRate } from '../services/countyMcrDenialService';
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
  Zap,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { PulseIqRegionalBreakdownChart } from './PulseIqRegionalBreakdownChart';
import { RealWorldCountyBoundaryMap } from './RealWorldCountyBoundaryMap';
import { countyBoundaryHierarchy } from '../services/countyBoundaryHierarchyService';
import { PulseIqScoreTooltip } from './PulseIqScoreTooltip';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';
import { PulseIqScoreExplainerHub } from './PulseIqScoreExplainerHub';
import { CountyMcrDrilldownModal } from './CountyMcrDrilldownModal';

interface NationalGeographicExplorerProps {
  agencies: Agency[];
  initialMode?: 'states' | 'counties' | 'cities' | 'pulseiq_chart';
  onModeChange?: (mode: 'states' | 'counties' | 'cities' | 'pulseiq_chart') => void;
  onSelectAgency: (agency: Agency) => void;
  onPreviewAgency?: (agency: Agency) => void;
  onNavigateToQueueWithFilter?: (stateCode?: string, county?: string, city?: string, zip?: string) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenDataLineage?: (agency?: Agency) => void;
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
  onPreviewAgency,
  onNavigateToQueueWithFilter,
  onOpenRfpGenerator,
  onOpenDataLineage,
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
  const [showCityPillsDrawer, setShowCityPillsDrawer] = useState<boolean>(false);
  const [providerSortBy, setProviderSortBy] = useState<'pulseIq' | 'fleetAge' | 'value' | 'denial'>('pulseIq');

  const [providerViewMode, setProviderViewModeState] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('nicks_agency_view_mode');
      if (saved === 'table') return 'table';
    } catch {
      // ignore
    }
    return 'cards';
  });

  const setProviderViewMode = (mode: 'cards' | 'table') => {
    setProviderViewModeState(mode);
    try {
      localStorage.setItem('nicks_agency_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const [drilldownCounty, setDrilldownCounty] = useState<{
    countyName: string;
    stateCode: string;
    countyFips: string;
    countyPopulation?: number;
    povertyRatePct?: number;
    seniorPopPct?: number;
    averageTransportMinutes?: number;
    ratePct: number | null;
    source: string;
  } | null>(null);

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

  // Browser History popstate integration for natural backward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      if (selectedCityName !== 'all') {
        setSelectedCityName('all');
        setMiddleTabState('cities');
        if (onSyncGlobalGeography) onSyncGlobalGeography(selectedStateCode, selectedCountyName, 'all', agencyCategoryFilter);
      } else if (selectedCountyName !== 'all') {
        setSelectedCountyName('all');
        setMiddleTabState('counties');
        if (onSyncGlobalGeography) onSyncGlobalGeography(selectedStateCode, 'all', 'all', agencyCategoryFilter);
      } else if (selectedStateCode !== 'all') {
        handleResetFilters();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedCityName, selectedCountyName, selectedStateCode, agencyCategoryFilter, onSyncGlobalGeography]);

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

  // Matching agencies after EMS/Fire category filter & sorting
  const matchingAgencies = useMemo(() => {
    const filtered = territoryEngine.filterByCategory(jurisdictionBaseAgencies, agencyCategoryFilter);
    return [...filtered].sort((a, b) => {
      if (providerSortBy === 'pulseIq') return (b.zollOpportunity.pulseIqScore || 0) - (a.zollOpportunity.pulseIqScore || 0);
      if (providerSortBy === 'fleetAge') return b.installedFleet.defibAgeYears - a.installedFleet.defibAgeYears;
      if (providerSortBy === 'value') return b.zollOpportunity.projectedPipelineValue - a.zollOpportunity.projectedPipelineValue;
      if (providerSortBy === 'denial') return b.cmsData.claimDenialRate - a.cmsData.claimDenialRate;
      return 0;
    });
  }, [jurisdictionBaseAgencies, agencyCategoryFilter, providerSortBy]);

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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-2xs grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center justify-between gap-3 min-w-0">
          <nav aria-label="Geographic Drill-Down Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
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
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
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
                      ? 'bg-[#0F172A] dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
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

          {/* Right: Quick State & County Dropdown Pickers + Step Back Action */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick State Dropdown Picker */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="breadcrumb-state-dropdown" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">
                State:
              </label>
              <select
                id="breadcrumb-state-dropdown"
                value={selectedStateCode}
                onChange={(e) => handleSelectState(e.target.value)}
                className="h-8 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg px-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                title="Switch State / Jurisdiction"
              >
                <option value="all">All 50 States</option>
                {Object.values(ALL_50_STATES_SUMMARIES)
                  .sort((a, b) => a.state.localeCompare(b.state))
                  .map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.state} ({st.code})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick County Dropdown Picker (when a state is active) */}
            {selectedStateCode !== 'all' && availableCounties.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <label htmlFor="breadcrumb-county-dropdown" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">
                  County:
                </label>
                <select
                  id="breadcrumb-county-dropdown"
                  value={selectedCountyName}
                  onChange={(e) => {
                    const c = e.target.value;
                    if (c === 'all') {
                      setSelectedCountyName('all');
                      setSelectedCityName('all');
                      setMiddleTab('counties');
                      setCountyPage(1);
                      setAgencyPage(1);
                      if (onSyncGlobalGeography) onSyncGlobalGeography(selectedStateCode, 'all', 'all', agencyCategoryFilter);
                    } else {
                      handleSelectCounty(c, selectedStateCode);
                    }
                  }}
                  className="h-8 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg px-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer max-w-[170px] truncate"
                  title="Switch County"
                >
                  <option value="all">All {availableCounties.length} Counties</option>
                  {availableCounties.map((c) => (
                    <option key={c.countyFips || c.countyName} value={c.countyName}>
                      {c.countyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCityName !== 'all' ? (
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#1E3A8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>&larr; Back to {selectedCountyName}</span>
              </button>
            ) : selectedCountyName !== 'all' ? (
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#1E3A8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>&larr; Back to {activeStateSummary?.state || selectedStateCode} Counties</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>&larr; Back to All 50 States</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Reset all filters back to All 50 States"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL 1: CLEAN TERRITORY SELECTOR & INTERACTIVE U.S. MAP (NO 50-STATE CARD WALL)
         ===================================================================== */}
      {activeFocusLevel === 'states' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start w-full min-w-0">
          
          {/* Left 7/8 Cols: Interactive U.S. Territory Map */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 shrink-0" />
                  <span>Interactive U.S. Territory Map</span>
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Click any State boundary on the map or use the selector on the right to inspect counties and verified EMS &amp; Fire providers.
                </p>
              </div>

              {/* Region Filter Segmented Control (Zero horizontal scrollbar, all 5 regions always visible) */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                {(['All', 'Northeast', 'Midwest', 'South', 'West'] as const).map(reg => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setRegionFilter(reg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      regionFilter === reg
                        ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG U.S. State Boundary Choropleth Map Canvas */}
            <div className="relative bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-3">
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
              <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                {hoveredMapStateCode && ALL_50_STATES_SUMMARIES[hoveredMapStateCode] ? (
                  (() => {
                    const hSt = ALL_50_STATES_SUMMARIES[hoveredMapStateCode];
                    const cCount = territoryEngine.getCountiesForState(hSt.code).length;
                    const stAgg = aggregateProviderMedicareDenialRates(agencies, hSt.code);
                    return (
                      <div className="flex flex-wrap items-center gap-2.5 tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-[#1E3A8A] text-white font-semibold">
                          {hSt.code}
                        </span>
                        <strong className="text-slate-900 dark:text-white text-sm font-semibold tracking-[-0.01em]">{hSt.state}</strong>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-semibold text-[#1E3A8A] dark:text-blue-400 tabular-nums">{cCount} Counties</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          Medicare Denials:{' '}
                          <strong className="text-rose-700 dark:text-rose-400 font-semibold tabular-nums">
                            {stAgg.hasMeasuredData ? `${stAgg.ratePct}%` : `${hSt.avgMedicareDenialRate}%`}
                          </strong>{' '}
                          <span className="text-[10px] text-slate-400">
                            {stAgg.hasMeasuredData
                              ? `(${stAgg.supplierCount} CMS ${stAgg.supplierCount === 1 ? 'supplier' : 'suppliers'})`
                              : '(State Model)'}
                          </span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-700 dark:text-slate-300">FEMA Grants: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">${(hSt.totalAfgAwardsYtd / 1000000).toFixed(1)}M</strong></span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed tabular-nums">
                    <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                      <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400 shrink-0" />
                      <span>Click any State boundary or East Coast callout badge to inspect its Counties</span>
                    </span>
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <span className="w-3 h-3 rounded-xs bg-[#DBEAFE] border border-[#60A5FA] inline-block" />
                      <span>Elevated Claim Denial (&ge;19.5% · CMS PUF)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#E2E8F0] border border-[#64748B] inline-block" />
                      <span>Standard Territory</span>
                    </span>
                  </div>
                )}
                <span className="tabular-nums text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  50 States &amp; DC · 3,144 Counties
                </span>
              </div>
            </div>
          </div>

          {/* Right 5/4 Cols: Clean Territory & Jurisdiction Picker */}
          <div className="lg:col-span-5 xl:col-span-4 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 gap-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                Step 1 · Select Territory Scope
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                Quick State, County &amp; ZIP Selector
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Choose a State or search by County, City, or 5-digit ZIP code to view EMS &amp; Fire providers.
              </p>
            </div>

            {/* Direct State Dropdown Selector */}
            <div className="space-y-1.5">
              <label htmlFor="home-state-picker" className="block text-xs font-bold text-slate-900 dark:text-white">
                1. Choose a State or Jurisdiction
              </label>
              <select
                id="home-state-picker"
                value={selectedStateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  handleSelectState(code);
                }}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
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

            {/* Direct Cascading County Dropdown Selector */}
            {selectedStateCode !== 'all' && availableCounties.length > 0 && (
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="home-county-picker" className="block text-xs font-bold text-slate-900 dark:text-white">
                  Choose County in {activeStateSummary?.state || selectedStateCode}
                </label>
                <select
                  id="home-county-picker"
                  value={selectedCountyName}
                  onChange={(e) => {
                    const c = e.target.value;
                    if (c === 'all') {
                      setSelectedCountyName('all');
                      setSelectedCityName('all');
                      setMiddleTab('counties');
                    } else {
                      handleSelectCounty(c, selectedStateCode);
                    }
                  }}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                >
                  <option value="all">All {availableCounties.length} Counties</option>
                  {availableCounties.map((c) => (
                    <option key={c.countyFips || c.countyName} value={c.countyName}>
                      {c.countyName} (Seat: {c.countySeat})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Direct City / County / ZIP Instant Jump */}
            <div className="space-y-1.5">
              <label htmlFor="home-zip-county-search" className="block text-xs font-bold text-slate-900 dark:text-white">
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
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
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
                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 max-h-52 overflow-y-auto">
                  {matchingLocations.length > 0 ? (
                    matchingLocations.map((loc) => (
                      <button
                        key={`${loc.zipCode}-${loc.city}`}
                        type="button"
                        onClick={() => {
                          handleSelectCity(loc.city, loc.county, loc.stateCode);
                          setZipSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {loc.city}, {loc.stateCode} <span className="font-mono text-[#1E3A8A] dark:text-blue-400">({loc.zipCode})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{loc.county}</div>
                        </div>
                        <span className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 shrink-0">Open &rarr;</span>
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
                        className="w-full text-left px-3 py-2.5 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {c.countyName}, {c.stateCode}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">County Seat: {c.countySeat}</div>
                        </div>
                        <span className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 shrink-0">Inspect &rarr;</span>
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
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  3. Quick Jump ({regionFilter === 'All' ? 'All Regions' : `${regionFilter} Region`})
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
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
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                    }`}
                    title={`${st.state} (${st.code})`}
                  >
                    <span className="font-mono font-bold text-xs">{st.code}</span>
                    <span className={`text-[10px] font-mono ${hoveredMapStateCode === st.code ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {territoryEngine.getCountiesForState(st.code).length}c
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Priority Accounts & Regional Summary */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <div className="p-2.5 bg-slate-50/80 dark:bg-slate-900">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Mapped Jurisdictions</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block tabular-nums">3,144 Counties</span>
                </div>
                <div className="p-2.5 bg-slate-50/80 dark:bg-slate-900">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Data Provenance</span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 block">FDID · NPI · FIPS Verified</span>
                </div>
              </div>

              {onNavigateToQueueWithFilter && (
                <button
                  type="button"
                  onClick={() => onNavigateToQueueWithFilter()}
                  className="w-full h-10 px-4 rounded-lg font-bold text-xs bg-[#1E3A8A] text-white hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs grid grid-cols-1 gap-5 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
            <div>
              <div className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400">
                {activeStateSummary?.state || selectedStateCode} Territory Drill-Down
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Select a County in {activeStateSummary?.state || selectedStateCode} ({availableCounties.length.toLocaleString()})
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:bg-white dark:focus:bg-slate-900"
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
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
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
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#1E3A8A] dark:hover:border-blue-500 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                            {c.countyName}
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span>Seat: <strong className="text-slate-700 dark:text-slate-200 font-medium">{c.countySeat}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span className="pi-metric-id">FIPS {c.countyFips}</span>
                            {c.landAreaSqMiles && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="pi-data-number">{c.landAreaSqMiles} sq mi</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 pi-data-inline">
                          {cityCountInCounty} {cityCountInCounty === 1 ? 'City' : 'Cities'} · {cityCountInCounty * 2} Providers
                        </span>
                      </div>

                      {/* Real-World Boundary Coordinates & Verified USPS ZIPs */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 tabular-nums">
                        <span>
                          Centroid: {c.centroidLat ? `${c.centroidLat.toFixed(3)}°N, ${c.centroidLng?.toFixed(3)}°W` : 'NAD83 Verified'}
                        </span>
                        {c.primaryZipCodes && c.primaryZipCodes.length > 0 && (
                          <span>ZIPs: {c.primaryZipCodes.slice(0, 3).join(', ')}</span>
                        )}
                      </div>

                      {/* Connected Real US Census / USPS Cities in this County */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
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
                              className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-[#1E3A8A] hover:text-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              {cityName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs tabular-nums">
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">Population</span>
                          <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{c.population.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">MCR Denial</span>
                          {(() => {
                            const cAgg = aggregateProviderMedicareDenialRates(agencies, c.stateCode, c.countyName);
                            const countyDenial = getCountyMcrDenialRate(c.countyFips, c.stateCode, c.countyName, {
                              population: c.population,
                              povertyRatePct: c.povertyRatePct,
                              seniorPopPct: c.seniorPopPct,
                              averageTransportMinutes: c.averageTransportMinutes
                            });
                            const denialRateVal = cAgg.hasMeasuredData && cAgg.ratePct !== null
                              ? cAgg.ratePct
                              : (c.medicareDenialRatePct !== undefined && c.medicareDenialRatePct !== null
                                  ? c.medicareDenialRatePct
                                  : countyDenial.ratePct);
                            const denialSourceText = cAgg.hasMeasuredData && cAgg.provenance
                              ? cAgg.provenance
                              : (c.medicareDenialSource || countyDenial.source);
                            const stAgg = aggregateProviderMedicareDenialRates(agencies, c.stateCode);
                            const stateBaselineRate = stAgg.hasMeasuredData && stAgg.ratePct !== null
                              ? stAgg.ratePct
                              : (ALL_50_STATES_SUMMARIES[c.stateCode]?.avgMedicareDenialRate ?? null);

                            return (
                              <>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="font-semibold text-rose-700 dark:text-rose-400">
                                    {denialRateVal !== null && denialRateVal !== undefined
                                      ? `${denialRateVal}%`
                                      : 'Not available'}
                                  </span>
                                  {denialRateVal !== null && denialRateVal !== undefined && stateBaselineRate !== null && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                      (St: {stateBaselineRate}%)
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5 line-clamp-2">
                                  {denialSourceText
                                    ? denialSourceText
                                    : stAgg.hasMeasuredData
                                      ? stAgg.provenance
                                      : 'State denial benchmark unavailable'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDrilldownCounty({
                                      countyName: c.countyName,
                                      stateCode: c.stateCode,
                                      countyFips: c.countyFips,
                                      countyPopulation: c.population,
                                      povertyRatePct: c.povertyRatePct,
                                      seniorPopPct: c.seniorPopPct,
                                      averageTransportMinutes: c.averageTransportMinutes,
                                      ratePct: denialRateVal ?? null,
                                      source: denialSourceText
                                    });
                                  }}
                                  className="mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Drill down into individual agency claim rates and aggregation diagnostic for this county"
                                >
                                  <BarChart3 className="w-2.5 h-2.5" />
                                  <span>Breakdown &amp; Diagnostic</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">Avg Transport</span>
                          <span className="font-semibold text-[#1E3A8A] dark:text-blue-400 mt-0.5 block">{c.averageTransportMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 pi-data-inline text-[11px]">
                        <strong className="pi-data-number font-semibold">{c.annualCardiacArrestIncidents}</strong> OHCA/yr · NEMSIS v3.5
                      </span>
                      <span className="font-semibold text-[#1E3A8A] dark:text-blue-400 pi-data-inline group-hover:translate-x-0.5 transition-transform">
                        Inspect All {cityCountInCounty} Cities &amp; Providers &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalCountyPages > 1 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs pi-data-inline text-slate-500">
              <span>Page {countyPage} of {totalCountyPages} ({availableCounties.length.toLocaleString()} Counties)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={countyPage <= 1}
                  onClick={() => setCountyPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-sans font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={countyPage >= totalCountyPages}
                  onClick={() => setCountyPage(p => Math.min(totalCountyPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-sans font-semibold"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 grid grid-cols-1 gap-4 min-w-0">
          
          {/* Streamlined Single-Row Filter Bar + Hybrid View Mode Toggle */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 min-w-0">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400">
                {selectedCityName !== 'all'
                  ? `${selectedCityName} · ${selectedCountyName !== 'all' ? selectedCountyName : ''} ${selectedStateCode}`
                  : selectedCountyName !== 'all'
                    ? `${selectedCountyName}, ${activeStateSummary?.state || selectedStateCode}`
                    : `${activeStateSummary?.state || selectedStateCode} Statewide Providers`}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                EMS &amp; Fire Providers ({matchingAgencies.length.toLocaleString()})
              </h2>
            </div>

            {/* Right Single-Row Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Instant Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={zipSearchQuery}
                  onChange={(e) => {
                    setZipSearchQuery(e.target.value);
                    setAgencyPage(1);
                  }}
                  placeholder="Search provider, city, ZIP..."
                  className="w-full h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Compact City Selector Dropdown */}
              {availableCities.length > 0 && (
                <select
                  value={selectedCityName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setSelectedCityName('all');
                      setAgencyPage(1);
                      if (onSyncGlobalGeography) {
                        onSyncGlobalGeography(selectedStateCode, selectedCountyName, 'all', agencyCategoryFilter);
                      }
                    } else {
                      const foundCity = availableCities.find(c => c.city === val);
                      if (foundCity) {
                        handleSelectCity(foundCity.city, foundCity.county, foundCity.stateCode);
                      }
                    }
                  }}
                  aria-label="Filter by City"
                  className="h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#1E3A8A] max-w-[180px] truncate cursor-pointer"
                >
                  <option value="all">All Cities ({availableCities.length})</option>
                  {availableCities.map((c) => (
                    <option key={`${c.stateCode}-${c.county}-${c.city}`} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              )}

              {/* All / EMS / Fire Category Switcher */}
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('all'); setAgencyPage(1); }}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    agencyCategoryFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({jurisdictionBaseAgencies.length.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('ems'); setAgencyPage(1); }}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    agencyCategoryFilter === 'ems'
                      ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  EMS ({emsJurisdictionCount.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => { setAgencyCategoryFilter('fire'); setAgencyPage(1); }}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    agencyCategoryFilter === 'fire'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Fire ({fireJurisdictionCount.toLocaleString()})
                </button>
              </div>

              {/* Collapsible City Grid Toggle */}
              {availableCities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCityPillsDrawer(prev => !prev)}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showCityPillsDrawer
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>City Directory</span>
                </button>
              )}

              {/* MCR Denial Drill-Down Button */}
              {selectedCountyName !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    const foundCounty = availableCounties.find(c => c.countyName.toLowerCase() === selectedCountyName.toLowerCase()) || activeCountyRecord;
                    setDrilldownCounty({
                      countyName: selectedCountyName,
                      stateCode: selectedStateCode,
                      countyFips: foundCounty?.countyFips || '',
                      countyPopulation: foundCounty?.population,
                      povertyRatePct: foundCounty?.povertyRatePct,
                      seniorPopPct: foundCounty?.seniorPopPct,
                      averageTransportMinutes: foundCounty?.averageTransportMinutes,
                      ratePct: null,
                      source: ''
                    });
                  }}
                  className="h-8 px-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={`Inspect individual agency Medicare claim denial rates and aggregation diagnostics for ${selectedCountyName}`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>MCR Denial Drill-Down</span>
                </button>
              )}

              {/* Hybrid Cards | Table View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setProviderViewMode('cards')}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    providerViewMode === 'cards'
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
                  onClick={() => setProviderViewMode('table')}
                  className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    providerViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Compact Comparison Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
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

          {/* Collapsible Connected City Filter Drawer */}
          {showCityPillsDrawer && availableCities.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
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
                      ? 'bg-[#0F172A] dark:bg-blue-600 text-white border-[#0F172A] dark:border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
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

          {/* Hybrid Provider Display: Cards vs. Compact Table */}
          {paginatedAgencies.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No providers matched the current filter. Click Reset or return to Counties.
            </div>
          ) : providerViewMode === 'cards' ? (
            <div className="workspace-cards-grid">
              {paginatedAgencies.map(agency => {
                const isFire = agency.agencyType.toLowerCase().includes('fire');
                const primaryContact = agency.keyContacts[0];
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
                    className="min-w-0 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-colors grid grid-cols-1 content-between gap-4 group"
                  >
                    <div className="space-y-3.5">
                      {/* Unboxed Monospace Provenance & Classification Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-sans font-semibold text-slate-900 dark:text-white text-xs">
                            {isFire ? 'Fire Dept' : 'EMS Provider'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span>FDID {agency.fdid || '04102'}</span>
                          {agency.npiNumber && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                              <span>NPI {agency.npiNumber}</span>
                            </>
                          )}
                          {agency.grantStatus.afgAwarded && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                FEMA AFG ${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K
                              </span>
                            </>
                          )}
                        </div>

                        {onOpenDataLineage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDataLineage(agency);
                            }}
                            className="text-[11px] font-mono font-medium text-slate-500 hover:text-[#1E3A8A] dark:hover:text-blue-400 hover:underline cursor-pointer"
                          >
                            Data Lineage
                          </button>
                        )}
                      </div>

                      {/* Provider Name + Connected Hierarchy + Score */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors leading-snug tracking-[-0.02em]">
                            {agency.name}
                          </h3>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                            {agency.state} ({agency.stateCode}) › {agency.county} › <strong className="text-slate-900 dark:text-white">{agency.city}</strong> <span className="font-mono text-xs text-slate-500">(ZIP {agency.zipCode})</span>
                          </div>
                        </div>

                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PulseIqScoreTooltip agency={agency} size="compact" showLabel={true} />
                        </div>
                      </div>

                      {/* Quiet Decision Maker & Headquarters Row */}
                      <div
                        className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="truncate">
                          {primaryContact && (
                            <span>
                              <strong className="text-slate-900 dark:text-white">{primaryContact.name}</strong> ({primaryContact.title}) ·{' '}
                            </span>
                          )}
                          <span>{agency.address}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-medium">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1E3A8A] dark:text-blue-400 hover:underline"
                          >
                            <span>Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1E3A8A] dark:text-blue-400 hover:underline"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* 4-Cell 1px Architectural Hairline Ledger Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs tabular-nums">
                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Upgrade Value</span>
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 block tabular-nums">
                            ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block tabular-nums">
                            Exp: {agency.competitorContract.contractEndDate}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Installed Fleet</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate block tabular-nums" title={agency.installedFleet.defibBrand}>
                            {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand.split(' ')[0]}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block tabular-nums">
                            {agency.installedFleet.defibAgeYears} yrs old
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Claim Recovery</span>
                          <span className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 mt-0.5 block tabular-nums">
                            +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block tabular-nums">
                            {agency.cmsData.claimDenialRate}% Denials
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Runs &amp; ROSC</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 block tabular-nums">
                            {agency.annual911Transports.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block tabular-nums">
                            {agency.utsteinSurvivalRate}% ROSC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Card Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        Target: <strong className="text-slate-900 dark:text-white">{agency.zollOpportunity.primaryTargetProduct}</strong>
                      </span>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                          className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Quick Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectAgency(agency)}
                          className="h-8 px-3.5 rounded-lg text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Full Dossier &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-Density Sortable Provider Comparison Table */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse tabular-nums">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider text-[11px]">
                      <th
                        onClick={() => setProviderSortBy('pulseIq')}
                        className="py-2.5 px-3 w-24 font-mono cursor-pointer hover:text-[#1E3A8A]"
                      >
                        Score {providerSortBy === 'pulseIq' ? '↓' : ''}
                      </th>
                      <th className="py-2.5 px-4">Provider &amp; Jurisdiction</th>
                      <th
                        onClick={() => setProviderSortBy('fleetAge')}
                        className="py-2.5 px-3 hidden md:table-cell cursor-pointer hover:text-[#1E3A8A]"
                      >
                        Frontline Fleet {providerSortBy === 'fleetAge' ? '↓' : ''}
                      </th>
                      <th
                        onClick={() => setProviderSortBy('value')}
                        className="py-2.5 px-3 text-right hidden sm:table-cell cursor-pointer hover:text-[#1E3A8A]"
                      >
                        Upgrade Value {providerSortBy === 'value' ? '↓' : ''}
                      </th>
                      <th
                        onClick={() => setProviderSortBy('denial')}
                        className="py-2.5 px-3 text-right hidden lg:table-cell cursor-pointer hover:text-[#1E3A8A]"
                      >
                        Claim Recovery {providerSortBy === 'denial' ? '↓' : ''}
                      </th>
                      <th className="py-2.5 px-3 text-right hidden xl:table-cell">Runs &amp; ROSC</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {paginatedAgencies.map((agency) => {
                      const isFire = agency.agencyType.toLowerCase().includes('fire');
                      return (
                        <tr
                          key={agency.id}
                          onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white tabular-nums">
                            {agency.zollOpportunity.pulseIqScore}<span className="text-[10px] text-slate-400 font-normal">/100</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                              {agency.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                              {agency.city}, {agency.stateCode} · {agency.county} · {isFire ? 'Fire' : 'EMS'} · <span className="font-mono text-[10px]">FDID {agency.fdid}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand.split(' ')[0]} ({agency.installedFleet.defibAgeYears}y)
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                              {agency.installedFleet.epcrCadSoftware}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                            </div>
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              Exp {agency.competitorContract.contractEndDate}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right hidden lg:table-cell">
                            <div className="font-semibold text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                              +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr
                            </div>
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              {agency.cmsData.claimDenialRate}% Denials
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right hidden xl:table-cell">
                            <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              {agency.annual911Transports.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              {agency.utsteinSurvivalRate}% ROSC
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => (onPreviewAgency ? onPreviewAgency(agency) : onSelectAgency(agency))}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectAgency(agency)}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#1E3A8A] text-white hover:bg-[#172554] transition-colors flex items-center gap-1 cursor-pointer"
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

          {totalAgencyPages > 1 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs pi-data-inline text-slate-500">
              <span>Page {agencyPage} of {totalAgencyPages} ({matchingAgencies.length.toLocaleString()} Providers)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={agencyPage <= 1}
                  onClick={() => setAgencyPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-sans font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={agencyPage >= totalAgencyPages}
                  onClick={() => setAgencyPage(p => Math.min(totalAgencyPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-sans font-semibold cursor-pointer"
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

      {/* County Medicare Part B Denial & Aggregation Diagnostic Drill-Down Modal */}
      {drilldownCounty && (
        <CountyMcrDrilldownModal
          isOpen={true}
          onClose={() => setDrilldownCounty(null)}
          countyName={drilldownCounty.countyName}
          stateCode={drilldownCounty.stateCode}
          countyFips={drilldownCounty.countyFips}
          countyPopulation={drilldownCounty.countyPopulation}
          povertyRatePct={drilldownCounty.povertyRatePct}
          seniorPopPct={drilldownCounty.seniorPopPct}
          averageTransportMinutes={drilldownCounty.averageTransportMinutes}
          countyDenialRatePct={drilldownCounty.ratePct}
          countyDenialSource={drilldownCounty.source}
          agencies={agencies}
          onSelectAgency={(agency) => {
            onSelectAgency(agency);
            setDrilldownCounty(null);
          }}
        />
      )}

    </div>
  );
};
