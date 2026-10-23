/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency, TerritoryCluster } from '../types';
import { TERRITORY_CLUSTERS } from '../data/healthcareData';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS, EAST_COAST_CALLOUT_STATES } from '../data/usStatesSvgPaths';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { nationalProviderDb } from '../services/nationalProviderDatabase';
import { 
  Layers, 
  Activity, 
  HeartPulse, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  DollarSign,
  Filter,
  Flame,
  Radio,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  X,
  Compass,
  Crosshair,
  Hexagon,
  Navigation,
  FileText,
  Sun,
  Moon
} from 'lucide-react';
import { PulseIqRegionalBreakdownChart } from './PulseIqRegionalBreakdownChart';
import { InteractiveSparkline } from './InteractiveSparkline';

interface HexBinCell {
  id: string;
  cx: number;
  cy: number;
  points: string;
  agencies: Agency[];
  agencyCount: number;
  totalCardiacCalls: number;
  avgSurvival: number;
  normalizedIntensity: number;
  fillColor: string;
  strokeColor: string;
  topAgency: Agency;
  metricSummary: string;
}

interface GisTerritoryHeatmapProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onFilterByCluster: (clusterId: string) => void;
  onToggleRoute?: (agencyId: string) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenDataLineage?: (agency: Agency) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
  onSelectState?: (state: string) => void;
  onSelectCounty?: (county: string) => void;
  onSelectCity?: (city: string) => void;
  onSelectCategory?: (category: 'all' | 'ems' | 'fire') => void;
}

export const GisTerritoryHeatmap: React.FC<GisTerritoryHeatmapProps> = ({
  agencies,
  onSelectAgency,
  onFilterByCluster,
  onToggleRoute,
  onOpenRfpGenerator,
  onOpenDataLineage,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount,
  onSelectState,
  onSelectCounty,
  onSelectCity,
  onSelectCategory
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'nemsis_cardiac' | 'cardiac' | 'aed' | 'transport' | 'cms'>('nemsis_cardiac');
  const [nemsisAcuityFilter, setNemsisAcuityFilter] = useState<'all' | 'high' | 'critical'>('all');
  const [layerThresholdFilter, setLayerThresholdFilter] = useState<'all' | 'high' | 'critical'>('all');
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all');
  const [selectedTargetProduct, setSelectedTargetProduct] = useState<string>('all');

  // Helper to resolve state code reliably from any format (2-letter code or state name)
  const resolveStateCode = (raw?: string): string => {
    if (!raw) return 'all';
    const clean = raw.trim();
    if (!clean || clean.toLowerCase() === 'all') return 'all';
    const upper = clean.toUpperCase();
    if (ALL_50_STATES_SUMMARIES[upper]) return upper;
    const match = Object.entries(ALL_50_STATES_SUMMARIES).find(
      ([code, s]) => s.state.toLowerCase() === clean.toLowerCase()
    );
    if (match) return match[0];
    return upper;
  };

  const [selectedState, setSelectedState] = useState<string>(resolveStateCode(globalState));
  const [selectedCounty, setSelectedCounty] = useState<string>(globalCounty || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(globalCity || 'all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');
  const [hoveredAgency, setHoveredAgency] = useState<Agency | null>(null);
  const [hoveredStateCode, setHoveredStateCode] = useState<string | null>(null);
  const [hoveredHexCell, setHoveredHexCell] = useState<HexBinCell | null>(null);
  const [mapDisplayMode, setMapDisplayMode] = useState<'kde' | 'hexbin' | 'choropleth' | 'hotspots' | 'pins'>('kde');
  const [basemapTheme, setBasemapTheme] = useState<'dark' | 'light'>('dark');
  const [kdeBandwidth, setKdeBandwidth] = useState<number>(34);
  const [kdeOpacity, setKdeOpacity] = useState<number>(0.88);
  const [colorSpectrum, setColorSpectrum] = useState<'inferno' | 'plasma' | 'viridis'>('inferno');
  const [showIsoContours, setShowIsoContours] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showStationOverlay, setShowStationOverlay] = useState<boolean>(true);
  const [cursorGeoCoords, setCursorGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const [dragStartPt, setDragStartPt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sidebarTab, setSidebarTab] = useState<'nemsis_epicenters' | 'acuity_distribution' | 'product_matrix'>('nemsis_epicenters');
  const [showDensityHalos, setShowDensityHalos] = useState<boolean>(true);
  const [showPulseAnimations, setShowPulseAnimations] = useState<boolean>(true);
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  const [isTheaterModal, setIsTheaterModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Escape key closes Theater Mode
  React.useEffect(() => {
    if (!isTheaterModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTheaterModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterModal]);

  React.useEffect(() => {
    setLayerThresholdFilter('all');
    setNemsisAcuityFilter('all');
    if (selectedLayer === 'nemsis_cardiac') {
      setSidebarTab('nemsis_epicenters');
    }
  }, [selectedLayer]);

  React.useEffect(() => {
    if (globalState !== undefined) setSelectedState(resolveStateCode(globalState));
  }, [globalState]);

  React.useEffect(() => {
    if (globalCounty !== undefined) setSelectedCounty(globalCounty);
  }, [globalCounty]);

  React.useEffect(() => {
    if (globalCity !== undefined) setSelectedCity(globalCity);
  }, [globalCity]);

  React.useEffect(() => {
    if (globalCategory !== undefined) setSelectedCategory(globalCategory);
  }, [globalCategory]);

  // Full dataset guarantee: ensure 100% full nationwide coverage across all 50 states + DC
  const effectiveAgencies = useMemo<Agency[]>(() => {
    if (agencies && agencies.length > 500) return agencies;
    return nationalProviderDb.getInitialBaselineAgencies();
  }, [agencies]);

  const availableStates = useMemo(() => Object.keys(ALL_50_STATES_SUMMARIES).sort(), []);

  const stateCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < effectiveAgencies.length; i++) {
      const sc = effectiveAgencies[i].stateCode;
      map[sc] = (map[sc] || 0) + 1;
    }
    return map;
  }, [effectiveAgencies]);

  const availableCounties = useMemo(() => {
    if (selectedState === 'all') return [];
    return territoryEngine.getCountiesForState(selectedState).map(c => c.countyName);
  }, [selectedState]);

  const availableCities = useMemo(() => {
    if (selectedState === 'all') return [];
    return territoryEngine.getCitiesForState(
      selectedState,
      selectedCounty !== 'all' ? selectedCounty : undefined
    );
  }, [selectedState, selectedCounty]);

  const filteredAgencies = useMemo<Agency[]>(() => {
    const base: Agency[] = effectiveAgencies.filter((a: Agency) => {
      if (selectedState !== 'all' && a.stateCode !== selectedState) return false;
      if (selectedCounty !== 'all') {
        const cleanTarget = selectedCounty.replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/i, '').toLowerCase().trim();
        const cleanAgency = (a.county || '').replace(/\s+(County|Parish|Borough|Census Area|Municipality)$/i, '').toLowerCase().trim();
        if (cleanAgency !== cleanTarget && a.county.toLowerCase() !== selectedCounty.toLowerCase()) return false;
      }
      if (selectedCity !== 'all' && a.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedCategory === 'ems' && a.agencyType.toLowerCase().includes('fire')) return false;
      if (selectedCategory === 'fire' && !a.agencyType.toLowerCase().includes('fire')) return false;
      if (selectedClusterId !== 'all') {
        const cluster = TERRITORY_CLUSTERS.find(c => c.id === selectedClusterId);
        if (cluster && !cluster.states.includes(a.stateCode)) return false;
      }
      if (selectedTargetProduct !== 'all' && a.zollOpportunity.primaryTargetProduct !== selectedTargetProduct) return false;

      // Active Layer Threshold Filtering
      if (selectedLayer === 'nemsis_cardiac') {
        const calls = a.annualCardiacArrestCalls || Math.round((a.annual911Transports || 3000) * 0.12);
        if (nemsisAcuityFilter === 'high' && calls < 400) return false;
        if (nemsisAcuityFilter === 'critical' && calls < 800) return false;
      } else if (layerThresholdFilter === 'high') {
        if (selectedLayer === 'cardiac') {
          if ((a.utsteinSurvivalRate || 10.8) >= 26) return false;
        } else if (selectedLayer === 'aed') {
          if ((a.gisData?.publicAccessAedDeficitPct || 42) < 45) return false;
        } else if (selectedLayer === 'transport') {
          if ((a.gisData?.avgTransportTimeMinutes || 20) < 20) return false;
        } else if (selectedLayer === 'cms') {
          if ((a.cmsData?.claimDenialRate || 18) < 18) return false;
        }
      } else if (layerThresholdFilter === 'critical') {
        if (selectedLayer === 'cardiac') {
          if ((a.utsteinSurvivalRate || 10.8) >= 22) return false;
        } else if (selectedLayer === 'aed') {
          if ((a.gisData?.publicAccessAedDeficitPct || 42) < 55) return false;
        } else if (selectedLayer === 'transport') {
          if ((a.gisData?.avgTransportTimeMinutes || 20) < 28) return false;
        } else if (selectedLayer === 'cms') {
          if ((a.cmsData?.claimDenialRate || 18) < 21) return false;
        }
      }

      return true;
    });
    if (activeAccount) {
      return [activeAccount, ...base.filter(a => a.id !== activeAccount.id)];
    }
    return base;
  }, [agencies, selectedState, selectedCounty, selectedCity, selectedCategory, selectedClusterId, selectedTargetProduct, activeAccount, selectedLayer, nemsisAcuityFilter, layerThresholdFilter]);

  // Layer-specific metric evaluation function for accurate hotspot ranking
  const getLayerMetric = (a: Agency, layer: string): number => {
    if (layer === 'nemsis_cardiac') {
      return a.annualCardiacArrestCalls || Math.round((a.annual911Transports || 3000) * 0.12);
    }
    if (layer === 'cardiac') {
      // Survival Deficit: lower survival rate (<30%) and higher cardiac arrest calls
      const calls = a.annualCardiacArrestCalls || Math.round((a.annual911Transports || 3000) * 0.12);
      const deficit = Math.max(1, 38 - (a.utsteinSurvivalRate || 10.8));
      return deficit * (Math.log10(calls + 10) || 1);
    }
    if (layer === 'aed') {
      // Public Access AED Need: public access AED deficit and senior population
      const deficitPct = a.gisData?.publicAccessAedDeficitPct || 42;
      const seniorPct = a.gisData?.seniorPopulationPct || 16;
      return deficitPct * (seniorPct / 10);
    }
    if (layer === 'transport') {
      // Long Transport (>20 min)
      return a.gisData?.avgTransportTimeMinutes || 20;
    }
    if (layer === 'cms') {
      // CMS Denial Zones: high Medicare claim denial rate & recoverable revenue
      const denial = a.cmsData?.claimDenialRate || 18;
      const recoverable = a.cmsData?.estimatedRecoverableRevenue || 50000;
      return denial * (Math.log10(recoverable + 10) || 1);
    }
    return a.zollOpportunity?.pulseIqScore || 80;
  };

  // Comprehensive Territory Telemetry across filtered jurisdiction for ALL 5 layers (Single-Pass O(N) Algorithm)
  const nemsisTerritoryStats = useMemo(() => {
    const len = filteredAgencies.length;
    if (len === 0) {
      return {
        totalCardiacCalls: 0,
        total911Transports: 0,
        totalStemiTransmissions: 0,
        avgSurvival: 10.8,
        criticalCount: 0,
        agingFleetInCardiacZonesCount: 0,
        criticalSurvivalCount: 0,
        avgAedDeficit: 42,
        highAedNeedCount: 0,
        avgTransportTime: 22.4,
        longTransportCount: 0,
        extremeTransportCount: 0,
        avgDenialRate: 18.5,
        highDenialCount: 0,
        totalRecoverableRevenue: 0,
        autoPulseNeedCount: 0,
        agingDefibCount: 0,
        ventOpportunityCount: 0
      };
    }

    let totalCardiacCalls = 0;
    let total911Transports = 0;
    let sumSurvival = 0;
    let criticalCount = 0;
    let agingFleetInCardiacZonesCount = 0;
    let criticalSurvivalCount = 0;
    let sumAedDeficit = 0;
    let highAedNeedCount = 0;
    let sumTransportTime = 0;
    let longTransportCount = 0;
    let extremeTransportCount = 0;
    let sumDenialRate = 0;
    let highDenialCount = 0;
    let totalRecoverableRevenue = 0;
    let autoPulseNeedCount = 0;
    let agingDefibCount = 0;
    let ventOpportunityCount = 0;

    for (let i = 0; i < len; i++) {
      const a = filteredAgencies[i];
      const cardiacCalls = a.annualCardiacArrestCalls || 0;
      const transports = a.annual911Transports || 0;
      const survival = a.utsteinSurvivalRate || 0;
      const defibAge = a.installedFleet?.defibAgeYears ?? 7;
      const aedDeficit = a.gisData?.publicAccessAedDeficitPct ?? 42;
      const transportTime = a.gisData?.avgTransportTimeMinutes ?? 20;
      const denialRate = a.cmsData?.claimDenialRate ?? 18;
      const recoverableRev = a.cmsData?.estimatedRecoverableRevenue || 0;
      const mechCpr = a.installedFleet?.mechanicalCPR;
      const vent = a.installedFleet?.transportVentilator;

      totalCardiacCalls += cardiacCalls;
      total911Transports += transports;
      sumSurvival += survival;
      sumAedDeficit += aedDeficit;
      sumTransportTime += transportTime;
      sumDenialRate += denialRate;
      totalRecoverableRevenue += recoverableRev;

      if (cardiacCalls >= 800) criticalCount++;
      if (cardiacCalls >= 400 && defibAge >= 7) agingFleetInCardiacZonesCount++;
      if (survival < 25) criticalSurvivalCount++;
      if (aedDeficit >= 50) highAedNeedCount++;
      if (transportTime >= 20) longTransportCount++;
      if (transportTime >= 28) extremeTransportCount++;
      if (denialRate >= 19) highDenialCount++;
      if (!mechCpr || mechCpr.includes('None')) autoPulseNeedCount++;
      if (defibAge >= 7) agingDefibCount++;
      if (transportTime >= 20 && (!vent || vent.includes('None'))) ventOpportunityCount++;
    }

    const totalStemiTransmissions = Math.round(totalCardiacCalls * 0.165);
    const avgSurvival = +(sumSurvival / len).toFixed(1);
    const avgAedDeficit = Math.round(sumAedDeficit / len);
    const avgTransportTime = +(sumTransportTime / len).toFixed(1);
    const avgDenialRate = +(sumDenialRate / len).toFixed(1);

    return {
      totalCardiacCalls,
      total911Transports,
      totalStemiTransmissions,
      avgSurvival,
      criticalCount,
      agingFleetInCardiacZonesCount,
      criticalSurvivalCount,
      avgAedDeficit,
      highAedNeedCount,
      avgTransportTime,
      longTransportCount,
      extremeTransportCount,
      avgDenialRate,
      highDenialCount,
      totalRecoverableRevenue,
      autoPulseNeedCount,
      agingDefibCount,
      ventOpportunityCount
    };
  }, [filteredAgencies]);

  // Nationwide geographic distribution across all 50 states + DC ensuring coast-to-coast coverage
  const mapRenderedAgencies = useMemo(() => {
    if (selectedState !== 'all') {
      // In single-state view, prioritize by active layer metric
      return [...filteredAgencies]
        .sort((a, b) => getLayerMetric(b, selectedLayer) - getLayerMetric(a, selectedLayer))
        .slice(0, 300);
    }

    // In nationwide 50-state view, ensure every state across West, Midwest, South, and East is populated!
    const byState = new Map<string, Agency[]>();
    for (let i = 0; i < filteredAgencies.length; i++) {
      const a = filteredAgencies[i];
      const sc = a.stateCode;
      if (!byState.has(sc)) byState.set(sc, []);
      byState.get(sc)!.push(a);
    }

    const selectedSet = new Set<string>();
    const sampled: Agency[] = [];

    // 1. Pick top 8 priority agencies for the active layer from EVERY single state across the country (West, Midwest, South, East)
    byState.forEach((stateAgencies) => {
      const sorted = [...stateAgencies].sort((a, b) => getLayerMetric(b, selectedLayer) - getLayerMetric(a, selectedLayer));
      for (let i = 0; i < Math.min(8, sorted.length); i++) {
        if (!selectedSet.has(sorted[i].id)) {
          selectedSet.add(sorted[i].id);
          sampled.push(sorted[i]);
        }
      }
    });

    // 2. Supplement with top 120 nationwide highest-urgency epicenters for this layer
    const allSorted = [...filteredAgencies].sort((a, b) => getLayerMetric(b, selectedLayer) - getLayerMetric(a, selectedLayer));
    for (let i = 0; i < Math.min(120, allSorted.length); i++) {
      if (!selectedSet.has(allSorted[i].id)) {
        selectedSet.add(allSorted[i].id);
        sampled.push(allSorted[i]);
      }
    }

    return sampled;
  }, [filteredAgencies, selectedLayer, selectedState]);

  // Ranked hotspots for the active layer
  const topCardiacEpicenters = useMemo(() => {
    return [...filteredAgencies]
      .sort((a, b) => getLayerMetric(b, selectedLayer) - getLayerMetric(a, selectedLayer))
      .slice(0, 8);
  }, [filteredAgencies, selectedLayer]);

  const acuityDistributionStats = useMemo(() => {
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let baselineCount = 0;
    let agingDefibCount = 0;

    const countyMap: Record<string, { name: string; totalCalls: number; agencyCount: number; avgSurvival: number }> = {};

    filteredAgencies.forEach(a => {
      const calls = a.annualCardiacArrestCalls || Math.round((a.annual911Transports || 3000) * 0.12);
      if (calls >= 800) criticalCount++;
      else if (calls >= 400) highCount++;
      else if (calls >= 200) moderateCount++;
      else baselineCount++;

      if (a.installedFleet.defibAgeYears >= 7) agingDefibCount++;

      const cName = a.county || 'Metro County';
      if (!countyMap[cName]) {
        countyMap[cName] = { name: cName, totalCalls: 0, agencyCount: 0, avgSurvival: 0 };
      }
      countyMap[cName].totalCalls += calls;
      countyMap[cName].agencyCount += 1;
      countyMap[cName].avgSurvival += (a.utsteinSurvivalRate || 10.8);
    });

    const sortedCounties = Object.values(countyMap)
      .map(c => ({
        ...c,
        avgSurvival: +(c.avgSurvival / Math.max(1, c.agencyCount)).toFixed(1)
      }))
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 5);

    const total = Math.max(1, filteredAgencies.length);

    return {
      criticalCount,
      highCount,
      moderateCount,
      baselineCount,
      agingDefibCount,
      criticalPct: Math.round((criticalCount / total) * 100),
      highPct: Math.round((highCount / total) * 100),
      moderatePct: Math.round((moderateCount / total) * 100),
      baselinePct: Math.round((baselineCount / total) * 100),
      agingPct: Math.round((agingDefibCount / total) * 100),
      sortedCounties
    };
  }, [filteredAgencies]);

  // State-level thematic intensity for choropleth mapping across all 50 states + DC
  const stateAcuityMap = useMemo<Record<string, {
    code: string;
    name: string;
    metricLabel: string;
    metricValue: string;
    tier: 'critical' | 'high' | 'moderate' | 'baseline';
    fillColor: string;
    borderColor: string;
    agencyCount: number;
  }>>(() => {
    const stateStats: Record<string, { totalCardiac: number; agencyCount: number; sumSurvival: number; sumAed: number; sumTransport: number; sumDenial: number }> = {};
    for (let i = 0; i < effectiveAgencies.length; i++) {
      const a = effectiveAgencies[i];
      const sc = a.stateCode;
      if (!stateStats[sc]) {
        stateStats[sc] = { totalCardiac: 0, agencyCount: 0, sumSurvival: 0, sumAed: 0, sumTransport: 0, sumDenial: 0 };
      }
      const st = stateStats[sc];
      st.agencyCount++;
      st.totalCardiac += (a.annualCardiacArrestCalls || Math.round((a.annual911Transports || 3000) * 0.12));
      st.sumSurvival += (a.utsteinSurvivalRate || 10.8);
      st.sumAed += (a.gisData?.publicAccessAedDeficitPct || 42);
      st.sumTransport += (a.gisData?.avgTransportTimeMinutes || 20);
      st.sumDenial += (a.cmsData?.claimDenialRate || 18);
    }

    const result: Record<string, any> = {};

    Object.keys(ALL_50_STATES_SUMMARIES).forEach((sc) => {
      const summary = ALL_50_STATES_SUMMARIES[sc];
      const stats = stateStats[sc];
      const count = stats?.agencyCount || summary.totalAgencies || 10;
      const stateName = summary.state;

      let metricLabel = '';
      let metricValue = '';
      let tier: 'critical' | 'high' | 'moderate' | 'baseline' = 'baseline';
      let fillColor = '#e2e8f0';
      let borderColor = '#94a3b8';

      if (selectedLayer === 'nemsis_cardiac') {
        const totalCalls = stats?.totalCardiac || (summary.totalAgencies * 450);
        metricLabel = 'Annual Cardiac Arrests';
        metricValue = `${totalCalls.toLocaleString()} calls`;
        if (totalCalls >= 10000) {
          tier = 'critical';
          fillColor = basemapTheme === 'dark' ? '#7f1d1d' : '#fecdd3';
          borderColor = basemapTheme === 'dark' ? '#f43f5e' : '#e11d48';
        } else if (totalCalls >= 5000) {
          tier = 'high';
          fillColor = basemapTheme === 'dark' ? '#7c2d12' : '#fed7aa';
          borderColor = basemapTheme === 'dark' ? '#f97316' : '#ea580c';
        } else if (totalCalls >= 2000) {
          tier = 'moderate';
          fillColor = basemapTheme === 'dark' ? '#713f12' : '#fef08a';
          borderColor = basemapTheme === 'dark' ? '#eab308' : '#d97706';
        } else {
          tier = 'baseline';
          fillColor = basemapTheme === 'dark' ? '#0c4a6e' : '#e0f2fe';
          borderColor = basemapTheme === 'dark' ? '#38bdf8' : '#0284c7';
        }
      } else if (selectedLayer === 'cardiac') {
        const survival = stats?.agencyCount ? +(stats.sumSurvival / stats.agencyCount).toFixed(1) : summary.avgUtsteinSurvival;
        metricLabel = 'Utstein Survival Rate';
        metricValue = `${survival}%`;
        if (survival < 23) {
          tier = 'critical';
          fillColor = basemapTheme === 'dark' ? '#7f1d1d' : '#fee2e2';
          borderColor = basemapTheme === 'dark' ? '#ef4444' : '#dc2626';
        } else if (survival < 27) {
          tier = 'high';
          fillColor = basemapTheme === 'dark' ? '#7c2d12' : '#ffedd5';
          borderColor = basemapTheme === 'dark' ? '#f97316' : '#ea580c';
        } else if (survival < 31) {
          tier = 'moderate';
          fillColor = basemapTheme === 'dark' ? '#713f12' : '#fef9c3';
          borderColor = basemapTheme === 'dark' ? '#eab308' : '#d97706';
        } else {
          tier = 'baseline';
          fillColor = basemapTheme === 'dark' ? '#064e3b' : '#d1fae5';
          borderColor = basemapTheme === 'dark' ? '#10b981' : '#059669';
        }
      } else if (selectedLayer === 'aed') {
        const aedDeficit = stats?.agencyCount ? Math.round(stats.sumAed / stats.agencyCount) : Math.round(summary.seniorPopPct * 2.5);
        metricLabel = 'AED Access Deficit';
        metricValue = `${aedDeficit}% deficit`;
        if (aedDeficit >= 52) {
          tier = 'critical';
          fillColor = basemapTheme === 'dark' ? '#701a75' : '#fae8ff';
          borderColor = basemapTheme === 'dark' ? '#e879f9' : '#c026d3';
        } else if (aedDeficit >= 44) {
          tier = 'high';
          fillColor = basemapTheme === 'dark' ? '#0c4a6e' : '#e0f2fe';
          borderColor = basemapTheme === 'dark' ? '#38bdf8' : '#0284c7';
        } else if (aedDeficit >= 38) {
          tier = 'moderate';
          fillColor = basemapTheme === 'dark' ? '#134e4a' : '#ccfbf1';
          borderColor = basemapTheme === 'dark' ? '#2dd4bf' : '#0d9488';
        } else {
          tier = 'baseline';
          fillColor = basemapTheme === 'dark' ? '#1e293b' : '#f1f5f9';
          borderColor = basemapTheme === 'dark' ? '#64748b' : '#64748b';
        }
      } else if (selectedLayer === 'transport') {
        const transit = stats?.agencyCount ? +(stats.sumTransport / stats.agencyCount).toFixed(1) : summary.avgTransportMinutes;
        metricLabel = 'Avg Transport Transit';
        metricValue = `${transit} min`;
        if (transit >= 27) {
          tier = 'critical';
          fillColor = basemapTheme === 'dark' ? '#7c2d12' : '#ffedd5';
          borderColor = basemapTheme === 'dark' ? '#f97316' : '#c2410c';
        } else if (transit >= 22) {
          tier = 'high';
          fillColor = basemapTheme === 'dark' ? '#713f12' : '#fef3c7';
          borderColor = basemapTheme === 'dark' ? '#f59e0b' : '#d97706';
        } else if (transit >= 18) {
          tier = 'moderate';
          fillColor = basemapTheme === 'dark' ? '#0c4a6e' : '#e0f2fe';
          borderColor = basemapTheme === 'dark' ? '#38bdf8' : '#0284c7';
        } else {
          tier = 'baseline';
          fillColor = basemapTheme === 'dark' ? '#064e3b' : '#f0fdf4';
          borderColor = basemapTheme === 'dark' ? '#22c55e' : '#16a34a';
        }
      } else {
        const denial = stats?.agencyCount ? +(stats.sumDenial / stats.agencyCount).toFixed(1) : summary.avgMedicareDenialRate;
        metricLabel = 'Medicare Denial Rate';
        metricValue = `${denial}%`;
        if (denial >= 20.5) {
          tier = 'critical';
          fillColor = basemapTheme === 'dark' ? '#881337' : '#ffe4e6';
          borderColor = basemapTheme === 'dark' ? '#fb7185' : '#be123c';
        } else if (denial >= 18) {
          tier = 'high';
          fillColor = basemapTheme === 'dark' ? '#4c1d95' : '#ede9fe';
          borderColor = basemapTheme === 'dark' ? '#a78bfa' : '#7c3aed';
        } else if (denial >= 15) {
          tier = 'moderate';
          fillColor = basemapTheme === 'dark' ? '#0c4a6e' : '#e0f2fe';
          borderColor = basemapTheme === 'dark' ? '#38bdf8' : '#0284c7';
        } else {
          tier = 'baseline';
          fillColor = basemapTheme === 'dark' ? '#064e3b' : '#d1fae5';
          borderColor = basemapTheme === 'dark' ? '#10b981' : '#059669';
        }
      }

      result[sc] = {
        code: sc,
        name: stateName,
        metricLabel,
        metricValue,
        tier,
        fillColor,
        borderColor,
        agencyCount: count
      };
    });

    return result;
  }, [effectiveAgencies, selectedLayer, basemapTheme]);

  // Map coordinates projection aligned with 920x500 US_STATES_SVG_PATHS (with Alaska & Hawaii insets)
  const mapWidth = 920;
  const mapHeight = 500;
  const projectCoord = (lat: number, lon: number) => {
    if (lat > 52 || (lon < -130 && lat > 45)) {
      const nLng = lon > 0 ? lon - 360 : lon;
      const akX = 25 + ((nLng - (-172)) / ((-130) - (-172))) * 145;
      const akY = 482 - ((lat - 54) / (71.5 - 54)) * 108;
      return { x: Math.max(20, Math.min(180, akX)), y: Math.max(365, Math.min(488, akY)) };
    }
    if (lat < 25 && lon < -150) {
      const hiX = 200 + ((lon - (-160.5)) / ((-154.8) - (-160.5))) * 105;
      const hiY = 480 - ((lat - 18.8) / (22.4 - 18.8)) * 68;
      return { x: Math.max(192, Math.min(312, hiX)), y: Math.max(405, Math.min(488, hiY)) };
    }
    const x = 32 + ((lon - (-124.8)) / ((-66.8) - (-124.8))) * 755;
    const y = 20 + ((49.5 - lat) / (49.5 - 24.5)) * 425;
    return { x: Math.max(20, Math.min(mapWidth - 20, x)), y: Math.max(20, Math.min(mapHeight - 20, y)) };
  };

  // Inverse coordinate projection for real-time cursor geodetic telemetry HUD
  const unprojectCoord = (svgX: number, svgY: number): { lat: number; lon: number } => {
    if (svgX >= 14 && svgX <= 188 && svgY >= 356 && svgY <= 490) {
      const lon = -172 + ((svgX - 25) / 145) * 42;
      const lat = 54 + ((482 - svgY) / 108) * 17.5;
      return { lat: +Math.max(52, Math.min(71.5, lat)).toFixed(3), lon: +Math.max(-172, Math.min(-130, lon)).toFixed(3) };
    }
    if (svgX >= 196 && svgX <= 320 && svgY >= 396 && svgY <= 490) {
      const lon = -160.5 + ((svgX - 200) / 105) * 5.7;
      const lat = 18.8 + ((480 - svgY) / 68) * 3.6;
      return { lat: +Math.max(18.5, Math.min(22.5, lat)).toFixed(3), lon: +Math.max(-161, Math.min(-154.5, lon)).toFixed(3) };
    }
    const lon = -124.8 + ((svgX - 32) / 755) * (124.8 - 66.8);
    const lat = 49.5 - ((svgY - 20) / 425) * (49.5 - 24.5);
    return {
      lat: +Math.max(24.0, Math.min(50.0, lat)).toFixed(3),
      lon: +Math.max(-125.5, Math.min(-66.0, lon)).toFixed(3)
    };
  };

  // Scientific Color Spectrum Interpolator (Inferno / Plasma / Viridis)
  const sampleSpectrumRgb = (t: number, ramp: 'inferno' | 'plasma' | 'viridis'): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, t));
    const stops: Record<'inferno' | 'plasma' | 'viridis', Array<[number, [number, number, number]]>> = {
      inferno: [
        [0.0, [10, 7, 34]],
        [0.22, [66, 10, 104]],
        [0.45, [147, 38, 103]],
        [0.68, [221, 81, 58]],
        [0.86, [252, 165, 10]],
        [1.0, [252, 255, 164]]
      ],
      plasma: [
        [0.0, [13, 8, 135]],
        [0.25, [106, 0, 168]],
        [0.5, [177, 42, 144]],
        [0.75, [225, 100, 98]],
        [0.9, [252, 166, 54]],
        [1.0, [240, 249, 33]]
      ],
      viridis: [
        [0.0, [68, 1, 84]],
        [0.25, [59, 82, 139]],
        [0.5, [33, 145, 140]],
        [0.75, [94, 201, 98]],
        [1.0, [253, 231, 37]]
      ]
    };
    const palette = stops[ramp];
    for (let i = 0; i < palette.length - 1; i++) {
      const [t0, c0] = palette[i];
      const [t1, c1] = palette[i + 1];
      if (clamped >= t0 && clamped <= t1) {
        const u = (clamped - t0) / Math.max(0.0001, t1 - t0);
        return [
          Math.round(c0[0] + (c1[0] - c0[0]) * u),
          Math.round(c0[1] + (c1[1] - c0[1]) * u),
          Math.round(c0[2] + (c1[2] - c0[2]) * u)
        ];
      }
    }
    return palette[palette.length - 1][1];
  };

  // True 2D Gaussian Kernel Density Estimation (KDE) Thermal Canvas Surface
  const kdeThermalDataUrl = useMemo<string>(() => {
    if (typeof document === 'undefined' || mapRenderedAgencies.length === 0) return '';
    const gridW = 230;
    const gridH = 125;
    const scaleX = gridW / mapWidth;
    const scaleY = gridH / mapHeight;

    const canvas = document.createElement('canvas');
    canvas.width = gridW;
    canvas.height = gridH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const densityField = new Float32Array(gridW * gridH);
    const metrics = mapRenderedAgencies.map(a => getLayerMetric(a, selectedLayer));
    let minM = Infinity;
    let maxM = -Infinity;
    for (let i = 0; i < metrics.length; i++) {
      if (metrics[i] < minM) minM = metrics[i];
      if (metrics[i] > maxM) maxM = metrics[i];
    }
    const metricSpan = Math.max(1e-5, maxM - minM);

    const sigmaGrid = Math.max(2.2, (kdeBandwidth * scaleX) * 0.42);
    const twoSigmaSq = 2 * sigmaGrid * sigmaGrid;
    const cutoffRadius = Math.ceil(sigmaGrid * 3.1);

    for (let i = 0; i < mapRenderedAgencies.length; i++) {
      const a = mapRenderedAgencies[i];
      const pt = projectCoord(a.latitude, a.longitude);
      const gx = pt.x * scaleX;
      const gy = pt.y * scaleY;
      const normWeight = 0.25 + 0.75 * ((metrics[i] - minM) / metricSpan);

      const x0 = Math.max(0, Math.floor(gx - cutoffRadius));
      const x1 = Math.min(gridW - 1, Math.ceil(gx + cutoffRadius));
      const y0 = Math.max(0, Math.floor(gy - cutoffRadius));
      const y1 = Math.min(gridH - 1, Math.ceil(gy + cutoffRadius));

      for (let py = y0; py <= y1; py++) {
        const dy = py - gy;
        const dySq = dy * dy;
        const rowOffset = py * gridW;
        for (let px = x0; px <= x1; px++) {
          const dx = px - gx;
          const dSq = dx * dx + dySq;
          if (dSq <= cutoffRadius * cutoffRadius) {
            densityField[rowOffset + px] += normWeight * Math.exp(-dSq / twoSigmaSq);
          }
        }
      }
    }

    let maxDensity = 0;
    for (let i = 0; i < densityField.length; i++) {
      if (densityField[i] > maxDensity) maxDensity = densityField[i];
    }
    if (maxDensity <= 0) return '';

    const imgData = ctx.createImageData(gridW, gridH);
    const data = imgData.data;

    for (let i = 0; i < densityField.length; i++) {
      const rawNorm = densityField[i] / maxDensity;
      if (rawNorm < 0.045) continue;

      // Non-linear gamma boost for rich mid-range thermal visibility
      const t = Math.pow(rawNorm, 0.72);
      const [r, g, b] = sampleSpectrumRgb(t, colorSpectrum);

      // Topographic Iso-Density Contour Ring Detection
      let isContourLine = false;
      if (showIsoContours) {
        const bands = [0.25, 0.45, 0.65, 0.84];
        for (let bIdx = 0; bIdx < bands.length; bIdx++) {
          if (Math.abs(t - bands[bIdx]) < 0.014) {
            isContourLine = true;
            break;
          }
        }
      }

      const idx = i * 4;
      if (isContourLine) {
        data[idx] = Math.min(255, r + 65);
        data[idx + 1] = Math.min(255, g + 65);
        data[idx + 2] = Math.min(255, b + 65);
        data[idx + 3] = Math.round(Math.min(255, (0.45 + t * 0.55) * 255));
      } else {
        const smoothAlpha = t < 0.18 ? (t / 0.18) * 0.55 : Math.min(0.96, 0.55 + (t - 0.18) * 0.5);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(smoothAlpha * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }, [mapRenderedAgencies, selectedLayer, kdeBandwidth, colorSpectrum, showIsoContours]);

  // H3 Spatial Hexagonal Tessellation & Aggregation Engine
  const hexBinCells = useMemo<HexBinCell[]>(() => {
    if (mapRenderedAgencies.length === 0) return [];
    const hexRadius = selectedState !== 'all' ? 20 : 15;
    const dx = hexRadius * 1.5;
    const dy = hexRadius * Math.sqrt(3);

    const bins = new Map<string, { col: number; row: number; cx: number; cy: number; agencies: Agency[]; metricSum: number }>();

    for (let i = 0; i < mapRenderedAgencies.length; i++) {
      const a = mapRenderedAgencies[i];
      const pt = projectCoord(a.latitude, a.longitude);
      const col = Math.round((pt.x - 24) / dx);
      const yShift = (Math.abs(col) % 2) * (dy * 0.5);
      const row = Math.round((pt.y - 20 - yShift) / dy);
      const cx = 24 + col * dx;
      const cy = 20 + row * dy + yShift;
      const key = `${col}:${row}`;

      if (!bins.has(key)) {
        bins.set(key, { col, row, cx, cy, agencies: [], metricSum: 0 });
      }
      const cell = bins.get(key)!;
      cell.agencies.push(a);
      cell.metricSum += getLayerMetric(a, selectedLayer);
    }

    let maxCellScore = 0;
    bins.forEach((cell) => {
      if (cell.metricSum > maxCellScore) maxCellScore = cell.metricSum;
    });
    const safeMax = Math.max(1, maxCellScore);

    const cells: HexBinCell[] = [];
    const rDraw = hexRadius * 0.94;

    bins.forEach((cell, key) => {
      const pts: string[] = [];
      for (let k = 0; k < 6; k++) {
        const angle = (Math.PI / 3) * k;
        const px = cell.cx + rDraw * Math.cos(angle);
        const py = cell.cy + rDraw * Math.sin(angle);
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }

      const norm = Math.pow(cell.metricSum / safeMax, 0.65);
      const [r, g, b] = sampleSpectrumRgb(Math.max(0.18, norm), colorSpectrum);
      const fillColor = `rgb(${r}, ${g}, ${b})`;
      const strokeColor = norm > 0.7 ? '#ffffff' : `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, 0.85)`;

      let totalCalls = 0;
      let sumSurv = 0;
      let topAgency = cell.agencies[0];
      let topMetric = -Infinity;

      for (let i = 0; i < cell.agencies.length; i++) {
        const ag = cell.agencies[i];
        const calls = ag.annualCardiacArrestCalls || Math.round((ag.annual911Transports || 3000) * 0.12);
        totalCalls += calls;
        sumSurv += (ag.utsteinSurvivalRate || 10.8);
        const m = getLayerMetric(ag, selectedLayer);
        if (m > topMetric) {
          topMetric = m;
          topAgency = ag;
        }
      }

      const avgSurvival = +(sumSurv / cell.agencies.length).toFixed(1);
      const metricSummary =
        selectedLayer === 'nemsis_cardiac' ? `${totalCalls.toLocaleString()} OHCA calls` :
        selectedLayer === 'cardiac' ? `${avgSurvival}% avg Utstein survival` :
        selectedLayer === 'aed' ? `${Math.round(topAgency.gisData?.publicAccessAedDeficitPct || 45)}% peak AED deficit` :
        selectedLayer === 'transport' ? `${topAgency.gisData?.avgTransportTimeMinutes || 22} min peak transit` :
        `${topAgency.cmsData?.claimDenialRate || 19}% peak CMS denial`;

      cells.push({
        id: `hex-${key}`,
        cx: cell.cx,
        cy: cell.cy,
        points: pts.join(' '),
        agencies: cell.agencies,
        agencyCount: cell.agencies.length,
        totalCardiacCalls: totalCalls,
        avgSurvival,
        normalizedIntensity: norm,
        fillColor,
        strokeColor,
        topAgency,
        metricSummary
      });
    });

    return cells;
  }, [mapRenderedAgencies, selectedLayer, selectedState, colorSpectrum]);

  // Active Route Corridors for agencies selected for Field Route
  const activeRouteCorridorPoints = useMemo(() => {
    const routeAgencies = effectiveAgencies.filter(a => a.inDayRoute);
    return routeAgencies.map(a => ({
      agency: a,
      ...projectCoord(a.latitude, a.longitude)
    }));
  }, [effectiveAgencies]);

  interface AgencyLayerVisual {
    gradientId: string;
    ringColor: string;
    ringOpacity: number;
    isCritical: boolean;
    markerFill: string;
    markerStroke: string;
    markerRadius: number;
    heatRadius: number;
    tierLabel: string;
    metricDisplay: string;
  }

  const getAgencyLayerVisual = (agency: Agency, layer: string): AgencyLayerVisual => {
    if (layer === 'nemsis_cardiac') {
      const calls = agency.annualCardiacArrestCalls || Math.round((agency.annual911Transports || 3000) * 0.12);
      if (calls >= 800) {
        return {
          gradientId: 'nemsis-critical-gradient',
          ringColor: '#e11d48',
          ringOpacity: 0.8,
          isCritical: true,
          markerFill: '#be123c',
          markerStroke: '#ffe4e6',
          markerRadius: 6.5,
          heatRadius: Math.min(74, 38 + Math.round(calls / 30)),
          tierLabel: 'Critical Epicenter (≥800 Calls)',
          metricDisplay: `${calls.toLocaleString()} OHCA calls/yr`
        };
      }
      if (calls >= 400) {
        return {
          gradientId: 'nemsis-high-gradient',
          ringColor: '#ea580c',
          ringOpacity: 0.6,
          isCritical: false,
          markerFill: '#ea580c',
          markerStroke: '#ffedd5',
          markerRadius: 5.5,
          heatRadius: Math.min(52, 26 + Math.round(calls / 35)),
          tierLabel: 'High Acuity (400–799 Calls)',
          metricDisplay: `${calls.toLocaleString()} OHCA calls/yr`
        };
      }
      if (calls >= 200) {
        return {
          gradientId: 'nemsis-moderate-gradient',
          ringColor: '#f59e0b',
          ringOpacity: 0.45,
          isCritical: false,
          markerFill: '#d97706',
          markerStroke: '#fef3c7',
          markerRadius: 4.5,
          heatRadius: Math.min(36, 18 + Math.round(calls / 40)),
          tierLabel: 'Moderate Volume (200–399 Calls)',
          metricDisplay: `${calls.toLocaleString()} OHCA calls/yr`
        };
      }
      return {
        gradientId: 'nemsis-baseline-gradient',
        ringColor: '#0284c7',
        ringOpacity: 0.3,
        isCritical: false,
        markerFill: '#0284c7',
        markerStroke: '#e0f2fe',
        markerRadius: 4,
        heatRadius: 18,
        tierLabel: 'Baseline Volume (<200 Calls)',
        metricDisplay: `${calls.toLocaleString()} OHCA calls/yr`
      };
    }

    if (layer === 'cardiac') {
      const survival = agency.utsteinSurvivalRate || 10.8;
      const calls = agency.annualCardiacArrestCalls || Math.round((agency.annual911Transports || 3000) * 0.12);
      if (survival < 22) {
        return {
          gradientId: 'survival-critical-gradient',
          ringColor: '#dc2626',
          ringOpacity: 0.85,
          isCritical: true,
          markerFill: '#b91c1c',
          markerStroke: '#fee2e2',
          markerRadius: 6.5,
          heatRadius: Math.min(70, 34 + Math.round(calls / 35)),
          tierLabel: 'Critical Survival Deficit (<22%)',
          metricDisplay: `${survival}% Utstein survival`
        };
      }
      if (survival < 26) {
        return {
          gradientId: 'survival-high-gradient',
          ringColor: '#ea580c',
          ringOpacity: 0.65,
          isCritical: false,
          markerFill: '#c2410c',
          markerStroke: '#ffedd5',
          markerRadius: 5.5,
          heatRadius: Math.min(52, 26 + Math.round(calls / 40)),
          tierLabel: 'High Survival Deficit (22–26%)',
          metricDisplay: `${survival}% Utstein survival`
        };
      }
      if (survival < 30) {
        return {
          gradientId: 'survival-moderate-gradient',
          ringColor: '#f59e0b',
          ringOpacity: 0.45,
          isCritical: false,
          markerFill: '#d97706',
          markerStroke: '#fef3c7',
          markerRadius: 4.5,
          heatRadius: 32,
          tierLabel: 'Moderate Deficit (26–30%)',
          metricDisplay: `${survival}% Utstein survival`
        };
      }
      return {
        gradientId: 'survival-benchmark-gradient',
        ringColor: '#10b981',
        ringOpacity: 0.35,
        isCritical: false,
        markerFill: '#059669',
        markerStroke: '#d1fae5',
        markerRadius: 4,
        heatRadius: 20,
        tierLabel: 'Benchmark Tier (>30%)',
        metricDisplay: `${survival}% Utstein survival`
      };
    }

    if (layer === 'aed') {
      const deficit = agency.gisData?.publicAccessAedDeficitPct || 42;
      const senior = agency.gisData?.seniorPopulationPct || 16;
      if (deficit >= 55) {
        return {
          gradientId: 'aed-critical-gradient',
          ringColor: '#c026d3',
          ringOpacity: 0.85,
          isCritical: true,
          markerFill: '#a21caf',
          markerStroke: '#fae8ff',
          markerRadius: 6.5,
          heatRadius: Math.min(68, 30 + senior * 1.8),
          tierLabel: 'Severe AED Shortage (≥55% Deficit)',
          metricDisplay: `${deficit}% public access deficit`
        };
      }
      if (deficit >= 45) {
        return {
          gradientId: 'aed-high-gradient',
          ringColor: '#0284c7',
          ringOpacity: 0.65,
          isCritical: false,
          markerFill: '#0369a1',
          markerStroke: '#e0f2fe',
          markerRadius: 5.5,
          heatRadius: Math.min(50, 24 + senior * 1.5),
          tierLabel: 'High AED Shortage (45–54%)',
          metricDisplay: `${deficit}% public access deficit`
        };
      }
      if (deficit >= 35) {
        return {
          gradientId: 'aed-moderate-gradient',
          ringColor: '#0d9488',
          ringOpacity: 0.45,
          isCritical: false,
          markerFill: '#0f766e',
          markerStroke: '#ccfbf1',
          markerRadius: 4.5,
          heatRadius: 30,
          tierLabel: 'Moderate Shortage (35–44%)',
          metricDisplay: `${deficit}% public access deficit`
        };
      }
      return {
        gradientId: 'aed-baseline-gradient',
        ringColor: '#64748b',
        ringOpacity: 0.3,
        isCritical: false,
        markerFill: '#475569',
        markerStroke: '#f1f5f9',
        markerRadius: 4,
        heatRadius: 18,
        tierLabel: 'Adequate Coverage (<35%)',
        metricDisplay: `${deficit}% public access deficit`
      };
    }

    if (layer === 'transport') {
      const transportTime = agency.gisData?.avgTransportTimeMinutes || 20;
      if (transportTime >= 28) {
        return {
          gradientId: 'transport-critical-gradient',
          ringColor: '#b45309',
          ringOpacity: 0.85,
          isCritical: true,
          markerFill: '#9a3412',
          markerStroke: '#ffedd5',
          markerRadius: 6.5,
          heatRadius: Math.min(72, 32 + transportTime * 1.3),
          tierLabel: 'Extreme Transport (≥28 min)',
          metricDisplay: `${transportTime} min avg transport`
        };
      }
      if (transportTime >= 22) {
        return {
          gradientId: 'transport-high-gradient',
          ringColor: '#d97706',
          ringOpacity: 0.65,
          isCritical: false,
          markerFill: '#c2410c',
          markerStroke: '#ffedd5',
          markerRadius: 5.5,
          heatRadius: Math.min(52, 24 + transportTime * 1.1),
          tierLabel: 'Prolonged Transport (22–27 min)',
          metricDisplay: `${transportTime} min avg transport`
        };
      }
      if (transportTime >= 16) {
        return {
          gradientId: 'transport-moderate-gradient',
          ringColor: '#059669',
          ringOpacity: 0.45,
          isCritical: false,
          markerFill: '#047857',
          markerStroke: '#d1fae5',
          markerRadius: 4.5,
          heatRadius: 30,
          tierLabel: 'Standard Transport (16–21 min)',
          metricDisplay: `${transportTime} min avg transport`
        };
      }
      return {
        gradientId: 'transport-baseline-gradient',
        ringColor: '#0284c7',
        ringOpacity: 0.3,
        isCritical: false,
        markerFill: '#0284c7',
        markerStroke: '#e0f2fe',
        markerRadius: 4,
        heatRadius: 18,
        tierLabel: 'Rapid Urban Transit (<16 min)',
        metricDisplay: `${transportTime} min avg transport`
      };
    }

    // CMS Denial Zones layer
    const denial = agency.cmsData?.claimDenialRate || 18;
    const recoverable = agency.cmsData?.estimatedRecoverableRevenue || 50000;
    if (denial >= 21) {
      return {
        gradientId: 'cms-critical-gradient',
        ringColor: '#be123c',
        ringOpacity: 0.85,
        isCritical: true,
        markerFill: '#9f1239',
        markerStroke: '#ffe4e6',
        markerRadius: 6.5,
        heatRadius: Math.min(70, 32 + denial * 1.6),
        tierLabel: 'Severe Denials (≥21%)',
        metricDisplay: `${denial}% Medicare denials ($${(recoverable / 1000).toFixed(0)}k recoverable)`
      };
    }
    if (denial >= 18) {
      return {
        gradientId: 'cms-high-gradient',
        ringColor: '#7c3aed',
        ringOpacity: 0.65,
        isCritical: false,
        markerFill: '#6d28d9',
        markerStroke: '#ede9fe',
        markerRadius: 5.5,
        heatRadius: Math.min(52, 24 + denial * 1.3),
        tierLabel: 'High Denials (18–20.9%)',
        metricDisplay: `${denial}% Medicare denials ($${(recoverable / 1000).toFixed(0)}k recoverable)`
      };
    }
    if (denial >= 14) {
      return {
        gradientId: 'cms-moderate-gradient',
        ringColor: '#0284c7',
        ringOpacity: 0.45,
        isCritical: false,
        markerFill: '#0369a1',
        markerStroke: '#e0f2fe',
        markerRadius: 4.5,
        heatRadius: 30,
        tierLabel: 'Moderate Denials (14–17.9%)',
        metricDisplay: `${denial}% Medicare denials`
      };
    }
    return {
      gradientId: 'cms-baseline-gradient',
      ringColor: '#059669',
      ringOpacity: 0.3,
      isCritical: false,
      markerFill: '#047857',
      markerStroke: '#d1fae5',
      markerRadius: 4,
      heatRadius: 18,
      tierLabel: 'Compliant Claims (<14%)',
      metricDisplay: `${denial}% Medicare denials`
    };
  };

  return (
    <div className="workspace-section-grid">
      
      {/* Top GIS Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xs min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-start xl:items-center justify-between gap-4 min-w-0">
          <div>
            <div className="text-xs font-mono text-sky-700 dark:text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Geographic Information System (GIS) &amp; Spatial Acuity Telemetry
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              High-Potential Territory Clusters &amp; Product Demand Hotspots
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              Synthesizing emergency call locations, cardiac arrest survival rates, transport distance isochrones, and senior population density across all 50 states, 3,143 counties, and 5,389+ cities for EMS Providers &amp; Fire Departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">GIS Layer:</span>
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setSelectedLayer('nemsis_cardiac')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  selectedLayer === 'nemsis_cardiac' 
                    ? 'bg-rose-600 text-white font-bold shadow-xs' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>NEMSIS Cardiac Acuity</span>
              </button>
              <button
                onClick={() => setSelectedLayer('cardiac')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'cardiac' ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Survival Deficit
              </button>
              <button
                onClick={() => setSelectedLayer('aed')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'aed' ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AED Need
              </button>
              <button
                onClick={() => setSelectedLayer('transport')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'transport' ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-400 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Long Transport (&gt;20 min)
              </button>
              <button
                onClick={() => setSelectedLayer('cms')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'cms' ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CMS Denial Zones
              </button>
            </div>
          </div>
        </div>

        {/* Strategic Corridor Summary — Flush 1px Hairline Ledger Grid */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setShowCorridors(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <span className="font-bold text-sky-800 dark:text-sky-400">Strategic High-Volume Corridors ({TERRITORY_CLUSTERS.length})</span>
            {showCorridors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            {showCorridors ? 'Click corridor to filter map' : 'Collapsed for full-screen map visibility'}
          </span>
        </div>

        {showCorridors && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-3">
            {TERRITORY_CLUSTERS.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              return (
                <div
                  key={cluster.id}
                  onClick={() => {
                    setSelectedClusterId(isSelected ? 'all' : cluster.id);
                    onFilterByCluster(isSelected ? 'all' : cluster.id);
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-slate-900 text-white dark:bg-blue-950' 
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={`font-bold ${isSelected ? 'text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {cluster.states.join(' · ')}
                    </span>
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                      {cluster.highPriorityAgencyCount} Accounts
                    </span>
                  </div>

                  <h3 className={`font-bold text-xs mt-1.5 leading-snug ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {cluster.name}
                  </h3>

                  <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {cluster.description}
                  </p>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${isSelected ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Pipeline</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ${(cluster.totalPipelineValue / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Survival</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {cluster.averageSurvivalRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Transport</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {cluster.averageTransportMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Interactive Map & Equipment Demand Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0">
        
        {/* Interactive GIS Spatial Visualizer */}
        <div className={`${isExpandedView ? 'lg:col-span-12' : 'lg:col-span-8'} min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col text-slate-900 dark:text-white transition-all`}>
          {/* Interactive Jurisdiction Navigation & Geographic Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedLayer === 'nemsis_cardiac'
                    ? `NEMSIS Cardiac Acuity Intensity (${filteredAgencies.length.toLocaleString()} Providers)`
                    : selectedLayer === 'cardiac'
                      ? `Survival Deficit Analysis (${filteredAgencies.length.toLocaleString()} Providers)`
                      : selectedLayer === 'aed'
                        ? `Public Access AED Deficit (${filteredAgencies.length.toLocaleString()} Providers)`
                        : selectedLayer === 'transport'
                          ? `Transport Time Isochrones (${filteredAgencies.length.toLocaleString()} Providers)`
                          : `CMS Billing Denials (${filteredAgencies.length.toLocaleString()} Providers)`}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                · {selectedCity !== 'all' ? `${selectedCity}, ${selectedState}` : selectedCounty !== 'all' ? `${selectedCounty}, ${selectedState}` : selectedState !== 'all' ? `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})` : 'US Nationwide (50 States + DC)'}
              </span>
            </div>

            {/* Geography Selectors & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              
              {/* State Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const st = e.target.value;
                    setSelectedState(st);
                    setSelectedCounty('all');
                    setSelectedCity('all');
                    if (onSelectState) onSelectState(st);
                    if (onSelectCounty) onSelectCounty('all');
                    if (onSelectCity) onSelectCity('all');
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">All 50 States (National)</option>
                  {availableStates.map(sc => (
                    <option key={sc} value={sc}>
                      {sc} - {ALL_50_STATES_SUMMARIES[sc]?.state || sc} ({stateCountsMap[sc] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* County Dropdown (Active when a state is selected) */}
              {selectedState !== 'all' && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">County:</span>
                  <select
                    value={selectedCounty}
                    onChange={(e) => {
                      const c = e.target.value;
                      setSelectedCounty(c);
                      setSelectedCity('all');
                      if (onSelectCounty) onSelectCounty(c);
                      if (onSelectCity) onSelectCity('all');
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer max-w-[160px]"
                  >
                    <option value="all">All Counties in {selectedState}</option>
                    {availableCounties.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* City Dropdown (Active when a county is selected) */}
              {selectedState !== 'all' && availableCities.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">City:</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      setSelectedCity(city);
                      if (onSelectCity) onSelectCity(city);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer max-w-[140px]"
                  >
                    <option value="all">All Cities</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Provider Category Toggle */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    if (onSelectCategory) onSelectCategory('all');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedCategory === 'all' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ems');
                    if (onSelectCategory) onSelectCategory('ems');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedCategory === 'ems' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EMS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('fire');
                    if (onSelectCategory) onSelectCategory('fire');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedCategory === 'fire' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fire
                </button>
              </div>

              {/* Reset Jurisdiction Filter */}
              {(selectedClusterId !== 'all' || selectedState !== 'all' || selectedCounty !== 'all' || selectedCity !== 'all' || selectedCategory !== 'all' || nemsisAcuityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedClusterId('all');
                    setSelectedState('all');
                    setSelectedCounty('all');
                    setSelectedCity('all');
                    setSelectedCategory('all');
                    setNemsisAcuityFilter('all');
                    if (onSelectState) onSelectState('all');
                    if (onSelectCounty) onSelectCounty('all');
                    if (onSelectCity) onSelectCity('all');
                    if (onSelectCategory) onSelectCategory('all');
                  }}
                  className="px-2.5 py-1 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg font-semibold cursor-pointer transition-colors"
                  title="Reset to nationwide 50-state coverage"
                >
                  Reset Jurisdiction
                </button>
              )}

              {/* Full Width (12-Col) and Theater Fullscreen Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => setIsExpandedView(prev => !prev)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    isExpandedView
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                  }`}
                  title={isExpandedView ? 'Switch to split layout (8 cols map + 4 cols intelligence)' : 'Expand map across full screen width (12 cols)'}
                >
                  {isExpandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isExpandedView ? 'Split View' : 'Full Width'}</span>
                </button>

                <button
                  onClick={() => setIsTheaterModal(true)}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Open dedicated Full-Screen Theater GIS Command Center (Esc to exit)"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Theater Fullscreen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic GIS Telemetry & Layer Filter Strip (Active across all 5 layers) */}
          <div className={`p-4 text-white border-b ${
            selectedLayer === 'nemsis_cardiac' ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-rose-900/40' :
            selectedLayer === 'cardiac' ? 'bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-red-900/40' :
            selectedLayer === 'aed' ? 'bg-gradient-to-r from-fuchsia-950 via-slate-900 to-slate-950 border-fuchsia-900/40' :
            selectedLayer === 'transport' ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-amber-900/40' :
            'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-emerald-900/40'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 border rounded-xl ${
                  selectedLayer === 'nemsis_cardiac' ? 'bg-rose-600/30 border-rose-500/40 text-rose-400' :
                  selectedLayer === 'cardiac' ? 'bg-red-600/30 border-red-500/40 text-red-400' :
                  selectedLayer === 'aed' ? 'bg-fuchsia-600/30 border-fuchsia-500/40 text-fuchsia-400' :
                  selectedLayer === 'transport' ? 'bg-amber-600/30 border-amber-500/40 text-amber-400' :
                  'bg-emerald-600/30 border-emerald-500/40 text-emerald-400'
                }`}>
                  {selectedLayer === 'nemsis_cardiac' ? <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" /> :
                   selectedLayer === 'cardiac' ? <Activity className="w-5 h-5 text-red-500 animate-pulse" /> :
                   selectedLayer === 'aed' ? <Zap className="w-5 h-5 text-fuchsia-400 animate-pulse" /> :
                   selectedLayer === 'transport' ? <Clock className="w-5 h-5 text-amber-400 animate-pulse" /> :
                   <DollarSign className="w-5 h-5 text-emerald-400 animate-pulse" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                      <span>
                        {selectedLayer === 'nemsis_cardiac' ? 'NEMSIS High-Acuity Cardiac Telemetry' :
                         selectedLayer === 'cardiac' ? 'Cardiac Arrest Survival Deficit Zones' :
                         selectedLayer === 'aed' ? 'Public Access AED Need & Demographics' :
                         selectedLayer === 'transport' ? 'Extended Transport Isochrones (>20 min)' :
                         'CMS Medicare Claim Denial Concentrations'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium tracking-wider uppercase">
                        · {selectedLayer === 'nemsis_cardiac' ? 'v3.5 Live Dataset' :
                           selectedLayer === 'cardiac' ? 'Utstein Resuscitation Registry' :
                           selectedLayer === 'aed' ? 'GIS PAD Census' :
                           selectedLayer === 'transport' ? 'NEMSIS Transit Registry' :
                           'Medicare MAC Revenue Audit'}
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {selectedLayer === 'nemsis_cardiac' && `Territory-wide Out-of-Hospital Cardiac Arrest (OHCA) call volume, STEMI transmissions & Utstein survival telemetry across ${selectedCounty !== 'all' ? selectedCounty : selectedState !== 'all' ? selectedState : 'all 50 states'}.`}
                    {selectedLayer === 'cardiac' && `Identifying severe survival deficits (<26% Utstein survival rate) where ZOLL AutoPulse and ResQCPR generate highest clinical resuscitation impact.`}
                    {selectedLayer === 'aed' && `Mapping public access AED deficits and age 65+ demographic vulnerability to deploy ZOLL AED 3 community networks.`}
                    {selectedLayer === 'transport' && `Long transport corridors (>20 min) requiring EMV+ mechanical transport ventilators and uninterrupted patient monitoring.`}
                    {selectedLayer === 'cms' && `Medicare Part B claim denials (>18%) addressable through ZOLL RescueNet Billing and AR Boost automated revenue recovery.`}
                  </p>
                </div>
              </div>

              {/* Acuity Level Filters & Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 px-1.5 font-bold">Filter:</span>
                  
                  {/* Layer: nemsis_cardiac */}
                  {selectedLayer === 'nemsis_cardiac' && (
                    <>
                      <button
                        onClick={() => setNemsisAcuityFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          nemsisAcuityFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setNemsisAcuityFilter('high')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          nemsisAcuityFilter === 'high'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-amber-300 hover:text-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>≥400 Calls</span>
                      </button>
                      <button
                        onClick={() => setNemsisAcuityFilter('critical')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          nemsisAcuityFilter === 'critical'
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>≥800 Epicenters</span>
                      </button>
                    </>
                  )}

                  {/* Layer: cardiac (Survival Deficit) */}
                  {selectedLayer === 'cardiac' && (
                    <>
                      <button
                        onClick={() => setLayerThresholdFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          layerThresholdFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Tiers
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('high')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'high'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-amber-300 hover:text-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>&lt;26% High Deficit</span>
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('critical')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'critical'
                            ? 'bg-red-600 text-white font-bold shadow-xs'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                        <span>&lt;22% Critical</span>
                      </button>
                    </>
                  )}

                  {/* Layer: aed */}
                  {selectedLayer === 'aed' && (
                    <>
                      <button
                        onClick={() => setLayerThresholdFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          layerThresholdFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Zones
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('high')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'high'
                            ? 'bg-sky-500 text-white font-bold shadow-xs'
                            : 'text-sky-300 hover:text-sky-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                        <span>≥45% Deficit</span>
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('critical')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'critical'
                            ? 'bg-fuchsia-600 text-white font-bold shadow-xs'
                            : 'text-fuchsia-400 hover:text-fuchsia-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
                        <span>≥55% Severe</span>
                      </button>
                    </>
                  )}

                  {/* Layer: transport */}
                  {selectedLayer === 'transport' && (
                    <>
                      <button
                        onClick={() => setLayerThresholdFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          layerThresholdFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Transit
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('high')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'high'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-amber-300 hover:text-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>≥20 min Prolonged</span>
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('critical')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'critical'
                            ? 'bg-orange-600 text-white font-bold shadow-xs'
                            : 'text-orange-400 hover:text-orange-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
                        <span>≥28 min Extreme</span>
                      </button>
                    </>
                  )}

                  {/* Layer: cms */}
                  {selectedLayer === 'cms' && (
                    <>
                      <button
                        onClick={() => setLayerThresholdFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          layerThresholdFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Denials
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('high')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'high'
                            ? 'bg-purple-500 text-white font-bold shadow-xs'
                            : 'text-purple-300 hover:text-purple-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span>≥18% High</span>
                      </button>
                      <button
                        onClick={() => setLayerThresholdFilter('critical')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          layerThresholdFilter === 'critical'
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                        <span>≥21% Severe</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Map Display Mode: Thermal KDE, H3 Hexbins, Choropleth, Tactical Pins & Kernel Tuning */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 text-[11px]">
                    <button
                      onClick={() => setMapDisplayMode('kde')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mapDisplayMode === 'kde'
                          ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="2D Gaussian Kernel Density Estimation (KDE) continuous thermal field"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Thermal KDE</span>
                    </button>
                    <button
                      onClick={() => setMapDisplayMode('hexbin')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mapDisplayMode === 'hexbin'
                          ? 'bg-purple-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="H3 Spatial Hexagonal Tessellation & Binning"
                    >
                      <Hexagon className="w-3.5 h-3.5" />
                      <span>H3 Hexbins</span>
                    </button>
                    <button
                      onClick={() => setMapDisplayMode('choropleth')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mapDisplayMode === 'choropleth'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="State-level choropleth intensity shading based on active layer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Choropleth</span>
                    </button>
                    <button
                      onClick={() => setMapDisplayMode('pins')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mapDisplayMode === 'pins'
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="Tactical EMS/Fire station vector markers"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Station Vectors</span>
                    </button>
                  </div>

                  {/* Scientific Spectrum & Basemap Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-[11px] text-slate-300">
                    {(mapDisplayMode === 'kde' || mapDisplayMode === 'hexbin') && (
                      <>
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-700/80">
                          <span className="text-[10px] font-mono uppercase text-slate-400">Spectrum:</span>
                          {(['inferno', 'plasma', 'viridis'] as const).map((ramp) => (
                            <button
                              key={ramp}
                              onClick={() => setColorSpectrum(ramp)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                                colorSpectrum === ramp
                                  ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {ramp}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {mapDisplayMode === 'kde' && (
                      <>
                        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700/80" title="Gaussian Kernel Bandwidth (Sigma)">
                          <span className="text-[10px] font-mono text-slate-400">σ={kdeBandwidth}px</span>
                          <input
                            type="range"
                            min={18}
                            max={56}
                            step={2}
                            value={kdeBandwidth}
                            onChange={(e) => setKdeBandwidth(Number(e.target.value))}
                            className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>
                        <button
                          onClick={() => setShowIsoContours(prev => !prev)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                            showIsoContours ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                          title="Toggle topographic iso-density contour bands"
                        >
                          Iso-Contours: {showIsoContours ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => setShowStationOverlay(prev => !prev)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                            showStationOverlay ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                          title="Overlay EMS/Fire station vectors atop KDE thermal field"
                        >
                          Stations: {showStationOverlay ? 'ON' : 'OFF'}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setShowGraticule(prev => !prev)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                        showGraticule ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Toggle Geodetic Lat/Lon Graticule Grid"
                    >
                      Grid
                    </button>

                    <button
                      onClick={() => setBasemapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Switch between Tactical Dark and Daylight Survey cartography"
                    >
                      {basemapTheme === 'dark' ? <Moon className="w-3 h-3 text-sky-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
                      <span>{basemapTheme === 'dark' ? 'Tactical Dark' : 'Daylight'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800/80">
              
              {/* CARD 1 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                    {selectedLayer === 'nemsis_cardiac' ? 'Total Cardiac Arrests' :
                     selectedLayer === 'cardiac' ? 'Avg Utstein Survival' :
                     selectedLayer === 'aed' ? 'Avg Public Access Deficit' :
                     selectedLayer === 'transport' ? 'Avg Emergency Transit' :
                     'Avg Claim Denial Rate'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-mono font-bold text-rose-400 tabular-nums">
                      {selectedLayer === 'nemsis_cardiac' && `${nemsisTerritoryStats.totalCardiacCalls.toLocaleString()}`}
                      {selectedLayer === 'cardiac' && `${nemsisTerritoryStats.avgSurvival}%`}
                      {selectedLayer === 'aed' && `${nemsisTerritoryStats.avgAedDeficit}%`}
                      {selectedLayer === 'transport' && `${nemsisTerritoryStats.avgTransportTime} min`}
                      {selectedLayer === 'cms' && `${nemsisTerritoryStats.avgDenialRate}%`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedLayer === 'nemsis_cardiac' ? 'OHCA/yr' :
                       selectedLayer === 'cardiac' ? 'vs 29.7% bench' :
                       selectedLayer === 'aed' ? 'community gap' :
                       selectedLayer === 'transport' ? 'to hospital' :
                       'Part B Medicare'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800">
                  <InteractiveSparkline
                    data={
                      selectedLayer === 'nemsis_cardiac' ? [
                        Math.round(nemsisTerritoryStats.totalCardiacCalls * 0.86),
                        Math.round(nemsisTerritoryStats.totalCardiacCalls * 0.90),
                        Math.round(nemsisTerritoryStats.totalCardiacCalls * 0.94),
                        Math.round(nemsisTerritoryStats.totalCardiacCalls * 0.98),
                        nemsisTerritoryStats.totalCardiacCalls
                      ] :
                      selectedLayer === 'cardiac' ? [
                        +(nemsisTerritoryStats.avgSurvival - 1.1).toFixed(1),
                        +(nemsisTerritoryStats.avgSurvival - 0.7).toFixed(1),
                        +(nemsisTerritoryStats.avgSurvival - 0.4).toFixed(1),
                        +(nemsisTerritoryStats.avgSurvival - 0.1).toFixed(1),
                        nemsisTerritoryStats.avgSurvival
                      ] :
                      selectedLayer === 'aed' ? [
                        Math.round(nemsisTerritoryStats.avgAedDeficit * 0.92),
                        Math.round(nemsisTerritoryStats.avgAedDeficit * 0.95),
                        Math.round(nemsisTerritoryStats.avgAedDeficit * 0.97),
                        Math.round(nemsisTerritoryStats.avgAedDeficit * 0.99),
                        nemsisTerritoryStats.avgAedDeficit
                      ] :
                      selectedLayer === 'transport' ? [
                        +(nemsisTerritoryStats.avgTransportTime - 1.2).toFixed(1),
                        +(nemsisTerritoryStats.avgTransportTime - 0.8).toFixed(1),
                        +(nemsisTerritoryStats.avgTransportTime - 0.5).toFixed(1),
                        +(nemsisTerritoryStats.avgTransportTime - 0.2).toFixed(1),
                        nemsisTerritoryStats.avgTransportTime
                      ] :
                      [
                        +(nemsisTerritoryStats.avgDenialRate - 1.2).toFixed(1),
                        +(nemsisTerritoryStats.avgDenialRate - 0.8).toFixed(1),
                        +(nemsisTerritoryStats.avgDenialRate - 0.4).toFixed(1),
                        +(nemsisTerritoryStats.avgDenialRate - 0.1).toFixed(1),
                        nemsisTerritoryStats.avgDenialRate
                      ]
                    }
                    color={selectedLayer === 'cms' ? 'emerald' : selectedLayer === 'transport' ? 'amber' : 'rose'}
                    height={20}
                    valueSuffix={selectedLayer === 'transport' ? ' min' : selectedLayer === 'nemsis_cardiac' ? ' calls' : '%'}
                  />
                </div>
              </div>

              {/* CARD 2 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                    {selectedLayer === 'nemsis_cardiac' ? 'STEMI Pre-Hospital Alerts' :
                     selectedLayer === 'cardiac' ? 'Critical Deficits (<22%)' :
                     selectedLayer === 'aed' ? 'High Need AED Zones (≥50%)' :
                     selectedLayer === 'transport' ? 'Prolonged Routes (≥20 min)' :
                     'High Denial Providers (≥19%)'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-mono font-bold text-amber-400 tabular-nums">
                      {selectedLayer === 'nemsis_cardiac' && `${nemsisTerritoryStats.totalStemiTransmissions.toLocaleString()}`}
                      {selectedLayer === 'cardiac' && `${nemsisTerritoryStats.criticalSurvivalCount}`}
                      {selectedLayer === 'aed' && `${nemsisTerritoryStats.highAedNeedCount}`}
                      {selectedLayer === 'transport' && `${nemsisTerritoryStats.longTransportCount}`}
                      {selectedLayer === 'cms' && `${nemsisTerritoryStats.highDenialCount}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedLayer === 'nemsis_cardiac' ? 'transmissions' : 'agencies'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800">
                  <InteractiveSparkline
                    data={[
                      Math.round((nemsisTerritoryStats.totalStemiTransmissions || 100) * 0.82),
                      Math.round((nemsisTerritoryStats.totalStemiTransmissions || 100) * 0.89),
                      Math.round((nemsisTerritoryStats.totalStemiTransmissions || 100) * 0.93),
                      Math.round((nemsisTerritoryStats.totalStemiTransmissions || 100) * 0.97),
                      nemsisTerritoryStats.totalStemiTransmissions || 100
                    ]}
                    color="amber"
                    height={20}
                    valueSuffix=" alerts"
                  />
                </div>
              </div>

              {/* CARD 3 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                    {selectedLayer === 'nemsis_cardiac' ? 'Active 911 Call Load' :
                     selectedLayer === 'cardiac' ? 'AutoPulse CPR Need' :
                     selectedLayer === 'aed' ? 'Total Population Served' :
                     selectedLayer === 'transport' ? 'Extreme Rural Routes (≥28 min)' :
                     'Estimated Recoverable Revenue'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-mono font-bold text-emerald-400 tabular-nums">
                      {selectedLayer === 'nemsis_cardiac' && `${nemsisTerritoryStats.total911Transports.toLocaleString()}`}
                      {selectedLayer === 'cardiac' && `${nemsisTerritoryStats.autoPulseNeedCount}`}
                      {selectedLayer === 'aed' && `${nemsisTerritoryStats.total911Transports.toLocaleString()}`}
                      {selectedLayer === 'transport' && `${nemsisTerritoryStats.extremeTransportCount}`}
                      {selectedLayer === 'cms' && `$${(nemsisTerritoryStats.totalRecoverableRevenue / 1000000).toFixed(1)}M`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedLayer === 'cardiac' ? 'agencies without mech CPR' :
                       selectedLayer === 'transport' ? 'extended transit zones' :
                       selectedLayer === 'cms' ? 'recoverable cash' :
                       'transports/yr'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800">
                  <InteractiveSparkline
                    data={[
                      Math.round((nemsisTerritoryStats.autoPulseNeedCount || 50) * 0.85),
                      Math.round((nemsisTerritoryStats.autoPulseNeedCount || 50) * 0.89),
                      Math.round((nemsisTerritoryStats.autoPulseNeedCount || 50) * 0.94),
                      Math.round((nemsisTerritoryStats.autoPulseNeedCount || 50) * 0.98),
                      nemsisTerritoryStats.autoPulseNeedCount || 50
                    ]}
                    color="emerald"
                    height={20}
                    valueSuffix={selectedLayer === 'cms' ? 'M' : ' units'}
                  />
                </div>
              </div>

              {/* CARD 4 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-rose-300 font-semibold block">
                    {selectedLayer === 'nemsis_cardiac' ? 'High-Acuity Defib Deficit' :
                     selectedLayer === 'cardiac' ? 'Aging Fleets in Deficit' :
                     selectedLayer === 'aed' ? 'AED 3 Upgrade Target' :
                     selectedLayer === 'transport' ? 'Ventilator Expansion Need' :
                     'Avg Denial Recovery / Agency'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-mono font-bold text-rose-300 tabular-nums">
                      {selectedLayer === 'nemsis_cardiac' && `${nemsisTerritoryStats.agingFleetInCardiacZonesCount}`}
                      {selectedLayer === 'cardiac' && `${nemsisTerritoryStats.agingDefibCount}`}
                      {selectedLayer === 'aed' && `${Math.round(nemsisTerritoryStats.avgAedDeficit * 16.5)}`}
                      {selectedLayer === 'transport' && `${nemsisTerritoryStats.ventOpportunityCount}`}
                      {selectedLayer === 'cms' && `$${Math.round(nemsisTerritoryStats.totalRecoverableRevenue / Math.max(1, filteredAgencies.length) / 1000)}k`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedLayer === 'cms' ? '/agency upside' : 'priority replacements'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800">
                  <InteractiveSparkline
                    data={[
                      Math.max(1, Math.round((nemsisTerritoryStats.agingDefibCount || 40) * 0.70)),
                      Math.max(1, Math.round((nemsisTerritoryStats.agingDefibCount || 40) * 0.80)),
                      Math.max(1, Math.round((nemsisTerritoryStats.agingDefibCount || 40) * 0.90)),
                      Math.max(1, Math.round((nemsisTerritoryStats.agingDefibCount || 40) * 0.95)),
                      nemsisTerritoryStats.agingDefibCount || 40
                    ]}
                    color="rose"
                    height={20}
                    valueSuffix=" target accounts"
                  />
                </div>
              </div>

            </div>
          </div>

          <div
            className={`relative flex-1 ${
              basemapTheme === 'dark'
                ? 'bg-gradient-to-b from-[#040914] via-[#071022] to-[#050B16]'
                : 'bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0]'
            } p-2 sm:p-3 ${
              isExpandedView ? 'min-h-[640px] lg:min-h-[720px]' : 'min-h-[560px] lg:min-h-[640px]'
            } flex flex-col justify-between overflow-hidden transition-colors`}
          >
            {/* Interactive Map Zoom, Pan & Opacity Control Cluster */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
              <div className="relative backdrop-blur-md bg-slate-950/85 border border-white/10 text-slate-100 rounded-xl shadow-2xl overflow-hidden p-0.5">
                {/* Tactical corner ticks */}
                <span className="absolute top-0.5 left-1 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute top-0.5 right-1 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute bottom-0.5 left-1 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>

                <div className="flex flex-col">
                  <button 
                    onClick={() => setZoomLevel(z => Math.min(3.5, +(z + 0.35).toFixed(2)))} 
                    title="Zoom In (+)" 
                    className="p-2 hover:bg-sky-500/20 hover:text-sky-400 transition-colors border-b border-white/10 cursor-pointer text-slate-200"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(z => Math.max(1, +(z - 0.35).toFixed(2)))} 
                    title="Zoom Out (-)" 
                    className="p-2 hover:bg-sky-500/20 hover:text-sky-400 transition-colors border-b border-white/10 cursor-pointer text-slate-200"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }} 
                    title="Reset Nationwide View" 
                    className="p-2 hover:bg-sky-500/20 hover:text-sky-400 transition-colors text-[10px] font-mono font-bold cursor-pointer text-slate-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-2 py-0.5 text-[8.5px] font-mono text-slate-400 border-t border-white/10 flex items-center justify-between gap-1.5 bg-slate-900/60">
                  <span className="text-sky-400 font-bold">MAG</span>
                  <span className="tabular-nums text-slate-200 font-semibold">{zoomLevel.toFixed(1)}x</span>
                </div>
              </div>

              {/* Active Geodesic Route Corridors Toggle */}
              {activeRouteCorridorPoints.length > 0 && (
                <button
                  onClick={() => setShowCorridors(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xl flex items-center gap-1.5 cursor-pointer transition-all backdrop-blur-md ${
                    showCorridors
                      ? 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950/85 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle active field route geodesic vector corridor"
                >
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>Route ({activeRouteCorridorPoints.length})</span>
                </button>
              )}
            </div>

            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className={`w-full flex-1 select-none ${isDraggingMap ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-crosshair'}`}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                setIsDraggingMap(true);
                setDragStartPt({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  const rawSvgX = ((e.clientX - rect.left) / rect.width) * mapWidth;
                  const rawSvgY = ((e.clientY - rect.top) / rect.height) * mapHeight;
                  const adjX = (rawSvgX - 460 - panOffset.x) / zoomLevel + 460;
                  const adjY = (rawSvgY - 250 - panOffset.y) / zoomLevel + 250;
                  setCursorGeoCoords(unprojectCoord(adjX, adjY));
                }
                if (isDraggingMap) {
                  setPanOffset({
                    x: Math.max(-420 * zoomLevel, Math.min(420 * zoomLevel, e.clientX - dragStartPt.x)),
                    y: Math.max(-240 * zoomLevel, Math.min(240 * zoomLevel, e.clientY - dragStartPt.y))
                  });
                }
              }}
              onMouseUp={() => setIsDraggingMap(false)}
              onMouseLeave={() => {
                setIsDraggingMap(false);
                setCursorGeoCoords(null);
              }}
            >
              <defs>
                <pattern id="gis-map-grid-dark" width="46" height="46" patternUnits="userSpaceOnUse">
                  <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="0.75" />
                </pattern>
                <pattern id="gis-map-grid-light" width="46" height="46" patternUnits="userSpaceOnUse">
                  <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.16)" strokeWidth="0.75" />
                </pattern>

                <filter id="nemsis-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dynamic Pan & Zoom Transformation Wrapper */}
              <g 
                transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`} 
                style={{
                  transformOrigin: '460px 250px',
                  transition: isDraggingMap ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <rect
                  width={mapWidth}
                  height={mapHeight}
                  fill={basemapTheme === 'dark' ? 'url(#gis-map-grid-dark)' : 'url(#gis-map-grid-light)'}
                />

                {/* Geodetic Graticule Parallels & Meridians (25°N–45°N, 120°W–70°W) */}
                {showGraticule && (
                  <g className="pointer-events-none select-none">
                    {[25, 30, 35, 40, 45].map((lat) => {
                      const y = 20 + ((49.5 - lat) / (49.5 - 24.5)) * 425;
                      return (
                        <g key={`grat-lat-${lat}`}>
                          <line
                            x1={24}
                            y1={y}
                            x2={805}
                            y2={y}
                            stroke={basemapTheme === 'dark' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(100, 116, 139, 0.18)'}
                            strokeWidth="0.6"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={8}
                            y={y - 2}
                            fill={basemapTheme === 'dark' ? 'rgba(148, 163, 184, 0.5)' : 'rgba(71, 85, 105, 0.65)'}
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            {lat}°N
                          </text>
                        </g>
                      );
                    })}
                    {[-120, -110, -100, -90, -80, -70].map((lon) => {
                      const x = 32 + ((lon - (-124.8)) / ((-66.8) - (-124.8))) * 755;
                      return (
                        <g key={`grat-lon-${lon}`}>
                          <line
                            x1={x}
                            y1={14}
                            x2={x}
                            y2={455}
                            stroke={basemapTheme === 'dark' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(100, 116, 139, 0.18)'}
                            strokeWidth="0.6"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={x + 2}
                            y={12}
                            fill={basemapTheme === 'dark' ? 'rgba(148, 163, 184, 0.5)' : 'rgba(71, 85, 105, 0.65)'}
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            {Math.abs(lon)}°W
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Alaska & Hawaii Inset Frames */}
                <g>
                  <rect
                    x="14"
                    y="356"
                    width="174"
                    height="134"
                    rx="8"
                    fill={basemapTheme === 'dark' ? '#070E1C' : '#FFFFFF'}
                    fillOpacity="0.92"
                    stroke={basemapTheme === 'dark' ? '#1E293B' : '#94A3B8'}
                    strokeWidth="1"
                  />
                  <text
                    x="22"
                    y="371"
                    fill={basemapTheme === 'dark' ? '#64748B' : '#334155'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="800"
                  >
                    ALASKA INSET (54°N–71°N)
                  </text>

                  <rect
                    x="196"
                    y="396"
                    width="124"
                    height="94"
                    rx="8"
                    fill={basemapTheme === 'dark' ? '#070E1C' : '#FFFFFF'}
                    fillOpacity="0.92"
                    stroke={basemapTheme === 'dark' ? '#1E293B' : '#94A3B8'}
                    strokeWidth="1"
                  />
                  <text
                    x="204"
                    y="411"
                    fill={basemapTheme === 'dark' ? '#64748B' : '#334155'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="800"
                  >
                    HAWAII (19°N–22°N)
                  </text>
                </g>

                {/* Authoritative U.S. Census 50-State + DC Boundary Polygons */}
                <g>
                  {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                    const isActiveState = selectedState === 'all' || selectedState === sc;
                    const isHovered = hoveredStateCode === sc;
                    const acuity = stateAcuityMap[sc];

                    let fill = basemapTheme === 'dark' ? '#0C1629' : '#E2E8F0';
                    let stroke = basemapTheme === 'dark' ? '#1E293B' : '#94A3B8';
                    let strokeWidth = 0.85;
                    let opacity = isActiveState ? 0.96 : 0.32;

                    if (mapDisplayMode === 'choropleth') {
                      if (selectedState === sc) {
                        fill = basemapTheme === 'dark' ? '#1D4ED8' : '#3B82F6';
                        stroke = '#38BDF8';
                        strokeWidth = 2.2;
                        opacity = 1;
                      } else if (isHovered) {
                        fill = acuity?.fillColor || '#1E3A8A';
                        stroke = basemapTheme === 'dark' ? '#F8FAFC' : '#0F172A';
                        strokeWidth = 1.8;
                        opacity = 1;
                      } else {
                        fill = acuity?.fillColor || (basemapTheme === 'dark' ? '#0F172A' : '#E2E8F0');
                        stroke = acuity?.borderColor || (basemapTheme === 'dark' ? '#334155' : '#94A3B8');
                        strokeWidth = selectedState === 'all' ? 1.05 : 0.75;
                        opacity = selectedState === 'all' ? 0.92 : 0.28;
                      }
                    } else {
                      if (selectedState === sc) {
                        fill = basemapTheme === 'dark' ? '#112240' : '#DBEAFE';
                        stroke = '#38BDF8';
                        strokeWidth = 1.8;
                        opacity = 1;
                      } else if (isHovered) {
                        fill = basemapTheme === 'dark' ? '#16243D' : '#E2E8F0';
                        stroke = basemapTheme === 'dark' ? '#64748B' : '#475569';
                        strokeWidth = 1.3;
                      } else {
                        fill = basemapTheme === 'dark' ? '#0B1426' : '#F8FAFC';
                        stroke = basemapTheme === 'dark' ? '#1E293B' : '#CBD5E1';
                        strokeWidth = 0.85;
                      }
                    }

                    return (
                      <path
                        key={`gis-poly-${sc}`}
                        d={boundary.d}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        onMouseEnter={() => setHoveredStateCode(sc)}
                        onMouseLeave={() => setHoveredStateCode(null)}
                        onClick={() => {
                          const next = selectedState === sc ? 'all' : sc;
                          setSelectedState(next);
                          setSelectedCounty('all');
                          setSelectedCity('all');
                          if (onSelectState) onSelectState(next);
                          if (onSelectCounty) onSelectCounty('all');
                          if (onSelectCity) onSelectCity('all');

                          if (next !== 'all' && boundary) {
                            setZoomLevel(1.55);
                            setPanOffset({
                              x: (mapWidth / 2 - boundary.labelX) * 0.7,
                              y: (mapHeight / 2 - boundary.labelY) * 0.7
                            });
                          } else {
                            setZoomLevel(1);
                            setPanOffset({ x: 0, y: 0 });
                          }
                        }}
                        className="cursor-pointer transition-colors duration-150"
                      >
                        <title>{`${ALL_50_STATES_SUMMARIES[sc]?.state || sc} (${sc}) — ${acuity?.metricLabel || ''}: ${acuity?.metricValue || ''}`}</title>
                      </path>
                    );
                  })}
                </g>

                {/* LAYER MODE 1: Continuous 2D Gaussian Kernel Density Estimation (KDE) Surface */}
                {(mapDisplayMode === 'kde' || mapDisplayMode === 'hotspots') && kdeThermalDataUrl && (
                  <image
                    href={kdeThermalDataUrl}
                    x={0}
                    y={0}
                    width={mapWidth}
                    height={mapHeight}
                    opacity={kdeOpacity}
                    preserveAspectRatio="none"
                    className="pointer-events-none"
                    style={{ mixBlendMode: basemapTheme === 'dark' ? 'screen' : 'multiply' }}
                  />
                )}

                {/* Crisp State Borders Overlay Above Thermal KDE so state boundaries stay razor-sharp */}
                {(mapDisplayMode === 'kde' || mapDisplayMode === 'hotspots') && (
                  <g className="pointer-events-none">
                    {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => (
                      <path
                        key={`kde-border-${sc}`}
                        d={boundary.d}
                        fill="none"
                        stroke={
                          selectedState === sc
                            ? '#38BDF8'
                            : basemapTheme === 'dark'
                            ? 'rgba(148, 163, 184, 0.35)'
                            : 'rgba(51, 65, 85, 0.35)'
                        }
                        strokeWidth={selectedState === sc ? 1.8 : 0.75}
                      />
                    ))}
                  </g>
                )}

                {/* LAYER MODE 2: H3 Spatial Hexagonal Tessellation Bins */}
                {mapDisplayMode === 'hexbin' && (
                  <g>
                    {hexBinCells.map((cell) => {
                      const isHexHovered = hoveredHexCell?.id === cell.id;
                      return (
                        <g
                          key={cell.id}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredHexCell(cell)}
                          onMouseLeave={() => setHoveredHexCell(null)}
                          onClick={() => onSelectAgency(cell.topAgency)}
                        >
                          <polygon
                            points={cell.points}
                            fill={cell.fillColor}
                            fillOpacity={isHexHovered ? 0.96 : 0.82}
                            stroke={isHexHovered ? '#FFFFFF' : cell.strokeColor}
                            strokeWidth={isHexHovered ? 2 : 0.9}
                            className="transition-all duration-100"
                          />
                          {cell.agencyCount > 1 && (
                            <text
                              x={cell.cx}
                              y={cell.cy}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="7.5"
                              fontFamily="monospace"
                              fontWeight="800"
                              fill={cell.normalizedIntensity > 0.65 ? '#0F172A' : '#FFFFFF'}
                              className="pointer-events-none"
                            >
                              {cell.agencyCount}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Active Field Route Geodesic Corridor Vector Polyline */}
                {showCorridors && activeRouteCorridorPoints.length > 1 && (
                  <g className="pointer-events-none">
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeOpacity="0.28"
                      points={activeRouteCorridorPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="1.6"
                      strokeDasharray="5 3"
                      points={activeRouteCorridorPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    />
                  </g>
                )}

                {/* State Abbreviation Typography Labels for Interior States */}
                <g className="pointer-events-none select-none">
                  {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                    const isCallout = EAST_COAST_CALLOUT_STATES.some(c => c.code === sc);
                    if (isCallout) return null;
                    const isSelected = selectedState === sc;
                    const isHovered = hoveredStateCode === sc;
                    const isActive = selectedState === 'all' || isSelected;

                    return (
                      <text
                        key={`lbl-${sc}`}
                        x={boundary.labelX}
                        y={boundary.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={sc === 'CA' || sc === 'TX' || sc === 'MT' || sc === 'AK' ? '10.5' : '9'}
                        fontWeight="800"
                        fill={
                          basemapTheme === 'dark'
                            ? isSelected
                              ? '#38BDF8'
                              : isHovered
                              ? '#FFFFFF'
                              : 'rgba(226, 232, 240, 0.78)'
                            : isSelected
                            ? '#1E3A8A'
                            : '#0F172A'
                        }
                        opacity={isActive ? 1 : 0.35}
                        className="font-mono tracking-tight"
                        style={{
                          textShadow:
                            basemapTheme === 'dark'
                              ? '0 1px 3px rgba(0,0,0,0.95)'
                              : '0 1px 2px rgba(255,255,255,0.9)'
                        }}
                      >
                        {sc}
                      </text>
                    );
                  })}
                </g>

                {/* East Coast Callout Badges with Clean Leader Lines */}
                <g className="select-none">
                  {EAST_COAST_CALLOUT_STATES.map((callout) => {
                    const boundary = US_STATES_SVG_PATHS[callout.code];
                    if (!boundary) return null;
                    const isSelected = selectedState === callout.code;
                    const isHovered = hoveredStateCode === callout.code;
                    const acuity = stateAcuityMap[callout.code];

                    return (
                      <g
                        key={`callout-${callout.code}`}
                        className="cursor-pointer pointer-events-auto"
                        onMouseEnter={() => setHoveredStateCode(callout.code)}
                        onMouseLeave={() => setHoveredStateCode(null)}
                        onClick={() => {
                          const next = selectedState === callout.code ? 'all' : callout.code;
                          setSelectedState(next);
                          setSelectedCounty('all');
                          setSelectedCity('all');
                          if (onSelectState) onSelectState(next);
                          if (onSelectCounty) onSelectCounty('all');
                          if (onSelectCity) onSelectCity('all');
                        }}
                      >
                        <line
                          x1={boundary.labelX}
                          y1={boundary.labelY}
                          x2={callout.calloutX - 16}
                          y2={callout.calloutY}
                          stroke={isSelected ? '#38BDF8' : basemapTheme === 'dark' ? '#475569' : '#94A3B8'}
                          strokeWidth={isSelected || isHovered ? 1.5 : 0.9}
                          strokeDasharray="2 2"
                        />
                        <rect
                          x={callout.calloutX - 16}
                          y={callout.calloutY - 8}
                          width="32"
                          height="16"
                          rx="4"
                          fill={
                            isSelected
                              ? '#2563EB'
                              : mapDisplayMode === 'choropleth'
                              ? (acuity?.fillColor || (basemapTheme === 'dark' ? '#0F172A' : '#FFFFFF'))
                              : basemapTheme === 'dark'
                              ? '#0F172A'
                              : '#FFFFFF'
                          }
                          stroke={
                            isSelected
                              ? '#38BDF8'
                              : (acuity?.borderColor || (basemapTheme === 'dark' ? '#334155' : '#CBD5E1'))
                          }
                          strokeWidth={isSelected || isHovered ? 1.5 : 1}
                        />
                        <text
                          x={callout.calloutX}
                          y={callout.calloutY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="8.5"
                          fontWeight="800"
                          fill={isSelected || basemapTheme === 'dark' ? '#FFFFFF' : '#0F172A'}
                          className="font-mono pointer-events-none"
                        >
                          {callout.code}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Tactical Agency Station Vector Markers */}
                {mapDisplayMode !== 'hexbin' && (mapDisplayMode !== 'kde' || showStationOverlay) && mapRenderedAgencies.map((agency) => {
                  const { x, y } = projectCoord(agency.latitude, agency.longitude);
                  const visual = getAgencyLayerVisual(agency, selectedLayer);
                  const isHovered = hoveredAgency?.id === agency.id;
                  const isRouteStop = Boolean(agency.inDayRoute);
                  const baseR = mapDisplayMode === 'kde' ? Math.max(2.2, visual.markerRadius * 0.58) : visual.markerRadius * 0.85;

                  return (
                    <g
                      key={agency.id}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer group"
                      onClick={() => onSelectAgency(agency)}
                      onMouseEnter={() => setHoveredAgency(agency)}
                      onMouseLeave={() => setHoveredAgency(null)}
                    >
                      {(visual.isCritical || isRouteStop) && (
                        <circle
                          r={baseR + 3.2}
                          fill="none"
                          stroke={isRouteStop ? '#10B981' : visual.ringColor}
                          strokeWidth={isRouteStop ? 1.6 : 1.1}
                          opacity="0.85"
                        />
                      )}
                      <circle
                        r={isHovered ? baseR * 1.8 : baseR}
                        fill={isRouteStop ? '#10B981' : visual.markerFill}
                        stroke={basemapTheme === 'dark' ? '#0F172A' : '#FFFFFF'}
                        strokeWidth={1.1}
                        className="transition-transform duration-150"
                      />
                      {(visual.isCritical || isHovered) && (
                        <circle
                          r="1.3"
                          fill="#FFFFFF"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Scientific Spectrum & Layer Telemetry Legend Overlay */}
            <div className="absolute top-4 right-4 z-10 backdrop-blur-md bg-slate-950/85 border border-white/10 text-white rounded-xl p-3 shadow-2xl text-[11px] pointer-events-auto min-w-[225px] relative">
              {/* Tactical corner ticks */}
              <span className="absolute top-1 left-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
              <span className="absolute top-1 right-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
              <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
              <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>

              {/* Tactical Telemetry Ribbon */}
              <div className="flex items-center justify-between text-[8px] font-mono text-sky-400/80 mb-1.5 pb-1 border-b border-white/10 tracking-widest uppercase">
                <span>HUD TELEMETRY</span>
                <span>KDE BW: {kdeBandwidth}KM</span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold uppercase text-[9.5px] tracking-wider flex items-center gap-1.5 font-mono text-white">
                  {selectedLayer === 'nemsis_cardiac' ? <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> :
                   selectedLayer === 'cardiac' ? <Activity className="w-3.5 h-3.5 text-red-500" /> :
                   selectedLayer === 'aed' ? <Zap className="w-3.5 h-3.5 text-fuchsia-400" /> :
                   selectedLayer === 'transport' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> :
                   <DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
                  {selectedLayer === 'nemsis_cardiac' ? 'NEMSIS OHCA Density' :
                   selectedLayer === 'cardiac' ? 'Utstein Deficit Surface' :
                   selectedLayer === 'aed' ? 'Public AED Deficit' :
                   selectedLayer === 'transport' ? 'Transit Isochrones' :
                   'CMS Claim Denials'}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold">
                  {mapDisplayMode.toUpperCase()}
                </span>
              </div>

              {/* Continuous Scientific Color Ramp Bar for KDE & Hexbin Modes */}
              {(mapDisplayMode === 'kde' || mapDisplayMode === 'hexbin') && (
                <div className="mb-2.5 pb-2 border-b border-slate-700/50">
                  <div
                    className="h-2.5 w-full rounded-full border border-white/15"
                    style={{
                      background:
                        colorSpectrum === 'inferno'
                          ? 'linear-gradient(90deg, #0a0722 0%, #420a68 25%, #932667 50%, #dd513a 75%, #fca50a 90%, #fcffa4 100%)'
                          : colorSpectrum === 'plasma'
                          ? 'linear-gradient(90deg, #0d0887 0%, #6a00a8 25%, #b12a90 50%, #e16462 75%, #fca636 90%, #f0f921 100%)'
                          : 'linear-gradient(90deg, #440154 0%, #3b528b 25%, #21918c 50%, #5ec962 75%, #fde725 100%)'
                    }}
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                    <span>Baseline (0.1σ)</span>
                    <span>Median (0.5σ)</span>
                    <span className="text-amber-300 font-bold">Peak Epicenter (1.0σ)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'nemsis_cardiac' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/40"></span>
                    <span className="font-semibold">≥800 Calls (Critical Epicenter)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span className="opacity-90">400–799 Calls (High Acuity)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="opacity-75">200–399 Calls (Moderate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="opacity-65">&lt;200 Calls (Baseline)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'cardiac' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></span>
                    <span className="font-semibold">&lt;22% Survival (Critical Deficit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span className="opacity-90">22–26% Survival (High Deficit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="opacity-75">26–30% Survival (Moderate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="opacity-65">&gt;30% Survival (Benchmark)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'aed' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 ring-2 ring-fuchsia-400/40"></span>
                    <span className="font-semibold">≥55% Deficit (Severe Shortage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="opacity-90">45–54% Deficit (High ZOLL Need)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <span className="opacity-75">35–44% Deficit (Moderate Need)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="opacity-65">&lt;35% Deficit (Adequate)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'transport' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/40"></span>
                    <span className="font-semibold">≥28 min (Extreme Isochrone)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                    <span className="opacity-90">22–27 min (Prolonged Route)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="opacity-75">16–21 min (Standard Transit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="opacity-65">&lt;16 min (Rapid Dispatch)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'cms' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/40"></span>
                    <span className="font-semibold">≥21% Denials (Severe Zone)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    <span className="opacity-90">18–20.9% Denials (High AR)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="opacity-75">14–17.9% Denials (Moderate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="opacity-65">&lt;14% Denials (Compliant)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Floating Hover Telemetry Card for Agency */}
            {hoveredAgency && (
              <div className="absolute bottom-12 left-4 z-20 backdrop-blur-md bg-slate-950/85 border border-white/15 text-white rounded-xl p-3.5 shadow-2xl max-w-sm pointer-events-auto transition-all animate-in fade-in duration-150 relative">
                {/* Tactical corner ticks */}
                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute top-1 right-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>

                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>{getAgencyLayerVisual(hoveredAgency, selectedLayer).tierLabel}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-tight mt-0.5">
                      {hoveredAgency.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {hoveredAgency.city}, {hoveredAgency.stateCode} · LAT {hoveredAgency.latitude.toFixed(2)}°N · LON {Math.abs(hoveredAgency.longitude).toFixed(2)}°W
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    getAgencyLayerVisual(hoveredAgency, selectedLayer).isCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {getAgencyLayerVisual(hoveredAgency, selectedLayer).metricDisplay}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-900/80 rounded-lg p-2 border border-white/10 mb-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Annual OHCA</span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {(hoveredAgency.annualCardiacArrestCalls || Math.round((hoveredAgency.annual911Transports || 3000) * 0.12)).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Utstein Survival</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {hoveredAgency.utsteinSurvivalRate || 10.8}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Priority Score</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {hoveredAgency.zollOpportunity.pulseIqScore}/100
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 mb-2.5 leading-snug">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Incumbent Defib:</span>
                    <span className="font-semibold text-white">{hoveredAgency.installedFleet.defibBrand} ({hoveredAgency.installedFleet.defibAgeYears} yrs)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Solution:</span>
                    <span className="font-semibold text-sky-400">{hoveredAgency.zollOpportunity.primaryTargetProduct}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectAgency(hoveredAgency)}
                    className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>Battlecard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {onToggleRoute && (
                    <button
                      onClick={() => onToggleRoute(hoveredAgency.id)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        hoveredAgency.inDayRoute
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{hoveredAgency.inDayRoute ? 'In Route' : '+ Route'}</span>
                    </button>
                  )}
                  {onOpenRfpGenerator && (
                    <button
                      onClick={() => onOpenRfpGenerator(hoveredAgency)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Generate RFP Response"
                    >
                      <FileText className="w-3 h-3 text-sky-400" />
                      <span>RFP</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Floating Hover Card for H3 Hexagonal Spatial Bin */}
            {hoveredHexCell && !hoveredAgency && (
              <div className="absolute bottom-12 left-4 z-20 backdrop-blur-md bg-slate-950/85 border border-purple-500/40 text-white rounded-xl p-3.5 shadow-2xl max-w-xs pointer-events-auto transition-all animate-in fade-in duration-150 relative">
                {/* Tactical corner ticks */}
                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-purple-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute top-1 right-1.5 text-[8px] font-mono text-purple-400/70 leading-none select-none pointer-events-none">+</span>

                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">
                    <Hexagon className="w-3.5 h-3.5 text-purple-400" />
                    <span>H3 Spatial Bin · {hoveredHexCell.id.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold">
                    {hoveredHexCell.agencyCount} {hoveredHexCell.agencyCount === 1 ? 'Agency' : 'Agencies'}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono mb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Cluster Metric:</span>
                    <span className="font-bold text-amber-300">{hoveredHexCell.metricSummary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Avg Utstein ROSC:</span>
                    <span className="font-bold text-emerald-400">{hoveredHexCell.avgSurvival}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Lead Epicenter:</span>
                    <span className="font-bold text-white truncate max-w-[145px]">{hoveredHexCell.topAgency.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Floating Hover State Card (when no agency or hex is hovered) */}
            {hoveredStateCode && !hoveredAgency && !hoveredHexCell && stateAcuityMap[hoveredStateCode] && (
              <div className="absolute bottom-12 left-4 z-20 backdrop-blur-md bg-slate-950/85 border border-white/15 text-white rounded-xl p-3 shadow-2xl max-w-xs pointer-events-auto transition-all animate-in fade-in duration-150 relative">
                {/* Tactical corner ticks */}
                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>
                <span className="absolute top-1 right-1.5 text-[8px] font-mono text-sky-400/70 leading-none select-none pointer-events-none">+</span>

                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                      {ALL_50_STATES_SUMMARIES[hoveredStateCode]?.region || 'US'} Region · {hoveredStateCode}
                    </span>
                    <h4 className="font-bold text-sm text-white leading-tight">
                      {stateAcuityMap[hoveredStateCode].name}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    stateAcuityMap[hoveredStateCode].tier === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : stateAcuityMap[hoveredStateCode].tier === 'high'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {stateAcuityMap[hoveredStateCode].tier}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 mb-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-sans">{stateAcuityMap[hoveredStateCode].metricLabel}:</span>
                    <span className="font-bold text-white">{stateAcuityMap[hoveredStateCode].metricValue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-sans">EMS / Fire Agencies:</span>
                    <span className="font-bold text-white">{stateAcuityMap[hoveredStateCode].agencyCount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const next = selectedState === hoveredStateCode ? 'all' : hoveredStateCode;
                    setSelectedState(next);
                    setSelectedCounty('all');
                    setSelectedCity('all');
                    if (onSelectState) onSelectState(next);
                    if (onSelectCounty) onSelectCounty('all');
                    if (onSelectCity) onSelectCity('all');
                  }}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>{selectedState === hoveredStateCode ? 'Reset to All States' : `Filter to ${stateAcuityMap[hoveredStateCode].name}`}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom Cartographic Geodetic Telemetry & Scale Bar HUD */}
            <div className="mt-2 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md bg-slate-950/85 text-white flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shadow-2xl relative">
              {/* Tactical corner ticks */}
              <span className="absolute top-0.5 left-1.5 text-[8px] font-mono text-sky-400/60 leading-none select-none pointer-events-none">+</span>
              <span className="absolute top-0.5 right-1.5 text-[8px] font-mono text-sky-400/60 leading-none select-none pointer-events-none">+</span>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sky-400 font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>EPSG:4326 · ALBERS US COMPOSITE</span>
                </span>
                <span className="hidden sm:inline text-white/20">|</span>
                <span className="hidden sm:flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-emerald-400" />
                  {cursorGeoCoords ? (
                    <span className="text-white font-semibold">
                      LAT {cursorGeoCoords.lat.toFixed(3)}°N · LON {Math.abs(cursorGeoCoords.lon).toFixed(3)}°W
                    </span>
                  ) : (
                    <span className="text-slate-400">LAT 31.968°N · LON 99.901°W · KDE BANDWIDTH: {kdeBandwidth}KM</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-slate-400">
                  KERNEL: <span className="text-sky-300 font-bold">{mapDisplayMode === 'kde' ? `2D GAUSSIAN (σ=${kdeBandwidth}px, ${colorSpectrum.toUpperCase()})` : mapDisplayMode === 'hexbin' ? `H3 HEXBIN (${hexBinCells.length} CELLS)` : mapDisplayMode.toUpperCase()}</span>
                </span>
                {/* Dynamic Cartographic Scale Bar */}
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span>0</span>
                  <div className="w-16 h-1.5 border border-white/30 flex">
                    <div className="w-1/2 h-full bg-white/70" />
                  </div>
                  <span className="font-semibold text-white">{Math.round(500 / zoomLevel)} mi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel: NEMSIS High-Acuity Call Epicenters & Product Demand Matrix */}
        <div className={`${isExpandedView ? 'lg:col-span-12' : 'lg:col-span-4'} min-w-0 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4 transition-all`}>
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Territory Intelligence
              </span>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                {filteredAgencies.length} Accounts
              </span>
            </div>

            {/* Sidebar Tab Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setSidebarTab('nemsis_epicenters')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'nemsis_epicenters'
                    ? 'bg-white text-rose-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Epicenters</span>
              </button>
              <button
                onClick={() => setSidebarTab('acuity_distribution')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'acuity_distribution'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Acuity Dist.</span>
              </button>
              <button
                onClick={() => setSidebarTab('product_matrix')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sidebarTab === 'product_matrix'
                    ? 'bg-white text-sky-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Products</span>
              </button>
            </div>
          </div>

          {sidebarTab === 'nemsis_epicenters' ? (
            /* Ranked High-Acuity Cardiac Epicenters in Territory */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Top High-Acuity Resuscitation Hotspots</span>
                <span className="text-[10px] text-slate-400 font-mono">By OHCA Volume</span>
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {topCardiacEpicenters.map((agency, idx) => {
                  const calls = agency.annualCardiacArrestCalls || Math.round((agency.annual911Transports || 3000) * 0.12);
                  const isExtreme = calls >= 800;
                  const isHigh = calls >= 400 && calls < 800;
                  const isStryker = agency.installedFleet.defibBrand.toLowerCase().includes('stryker') || agency.installedFleet.defibBrand.toLowerCase().includes('lifepak');
                  const isOldFleet = agency.installedFleet.defibAgeYears >= 7;

                  return (
                    <div
                      key={`epicenter-${agency.id}`}
                      onClick={() => onSelectAgency(agency)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 bg-slate-50/70 transition-all cursor-pointer group space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                            idx === 0 
                              ? 'bg-rose-600 text-white shadow-xs' 
                              : idx === 1 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors leading-tight line-clamp-1">
                              {agency.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {agency.city}, {agency.stateCode} · {agency.county}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                          isExtreme
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isHigh
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-sky-100 text-sky-800'
                        }`}>
                          {calls.toLocaleString()} OHCA
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-slate-400 block font-semibold">Incumbent Monitor</span>
                          <span className={`font-semibold line-clamp-1 ${isOldFleet ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                            {agency.installedFleet.defibBrand} ({agency.installedFleet.defibAgeYears}y)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Utstein Survival</span>
                          <span className="font-mono font-bold text-rose-700">
                            {agency.utsteinSurvivalRate || 10.8}% <span className="text-[9px] text-slate-400 font-normal">(-{(29.7 - (agency.utsteinSurvivalRate || 10.8)).toFixed(1)}% gap)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-sky-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" />
                          <span>Target: {agency.zollOpportunity.primaryTargetProduct}</span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          <span>Inspect Playbook</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* NEMSIS Clinical Opportunity Callout */}
              <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-xl text-xs space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clinical Value Driver: Utstein Deficit Conversion</span>
                </div>
                <p className="text-[11px] text-rose-900/80 leading-relaxed">
                  High-volume departments lose survival points during long manual transport. Presenting the <strong>AutoPulse Mechanical CPR System</strong> alongside <strong>X Series Advanced Real CPR Help</strong> demonstrates measurable ROSC improvement for the EMS Medical Director.
                </p>
              </div>
            </div>
          ) : sidebarTab === 'acuity_distribution' ? (
            /* Territory Acuity & Volume Distribution Chart */
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">Cardiac Acuity Tier Breakdown</span>
                  <span className="text-[10px] text-slate-500 font-mono">{filteredAgencies.length} Accounts</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Distribution of departments across NEMSIS cardiac event intensity tiers.
                </p>
              </div>

              {/* Acuity Tiers Progress Stack */}
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-rose-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      <span>Critical Epicenter (≥800 OHCA)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {acuityDistributionStats.criticalCount} ({acuityDistributionStats.criticalPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(4, acuityDistributionStats.criticalPct)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>High Acuity (400–799 OHCA)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {acuityDistributionStats.highCount} ({acuityDistributionStats.highPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(4, acuityDistributionStats.highPct)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-sky-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>Moderate Acuity (200–399 OHCA)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {acuityDistributionStats.moderateCount} ({acuityDistributionStats.moderatePct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(4, acuityDistributionStats.moderatePct)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Baseline (&lt;200 OHCA)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {acuityDistributionStats.baselineCount} ({acuityDistributionStats.baselinePct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-slate-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(4, acuityDistributionStats.baselinePct)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Defibrillator Fleet Age Risk Callout */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Incumbent Fleet Replacement Risk</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                    {acuityDistributionStats.agingPct}% Vulnerable
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  <strong>{acuityDistributionStats.agingDefibCount} departments</strong> in this territory operate monitor/defibrillator fleets ≥7 years old (primarily Stryker LIFEPAK 15 units approaching or past manufacturer end-of-service).
                </p>
              </div>

              {/* Regional County Acuity Distribution */}
              {acuityDistributionStats.sortedCounties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Top County Resuscitation Volumes</span>
                    <span className="text-[10px] font-mono text-slate-400">OHCA &amp; Survival</span>
                  </div>
                  <div className="space-y-1.5">
                    {acuityDistributionStats.sortedCounties.map((county) => (
                      <div key={county.name} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{county.name}</span>
                          <span className="font-mono font-bold text-rose-700 tabular-nums">
                            {county.totalCalls.toLocaleString()} OHCA
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{county.agencyCount} Department{county.agencyCount > 1 ? 's' : ''}</span>
                          <span className="font-mono text-slate-600">
                            Avg ROSC: <strong className="text-emerald-700">{county.avgSurvival}%</strong> (vs 29.7% bench)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Product Demand Matching Matrix */
            <div className="space-y-3 text-xs">
              
              {/* Public Access AEDs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900">Public Access Defibrillators (ZOLL AED 3)</span>
                  <span className="text-[10px] font-mono bg-sky-100 text-sky-900 px-2 py-0.5 rounded font-semibold">
                    High Demand
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  <strong>Target Profile:</strong> High senior citizen concentration (&gt;20% age 65+), dense residential high-rises, and recreational municipal parks with low bystander CPR rates.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Key Account: Pinellas County EMS (FL) · 26.4% Senior pop · 62% AED Deficit
                </div>
              </div>

              {/* Advanced Resuscitation Hardware */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">X Series Advanced ACLS Monitor</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                    Core Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  <strong>Target Profile:</strong> High 911 ALS call volume, traumatic brain injury (TBI) incidence, and aging Stryker LIFEPAK 15 units (&gt;8 yrs) needing Real BVM Help.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Key Accounts: Cuyahoga County (OH), Miami-Dade (FL), Columbus (OH)
                </div>
              </div>

              {/* AutoPulse Mechanical CPR */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">AutoPulse Mechanical CPR System</span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                    Lifesaver Demand
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  <strong>Target Profile:</strong> Extended transport times (&gt;20 mins), 2-person volunteer staffing crews, and multi-story stairwell extrications.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Key Accounts: McDowell County (NC, 34-min transport), Allegheny Volunteer (PA)
                </div>
              </div>

              {/* Z Vent Portable Transport Ventilator */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900">Z Vent Transport Ventilator</span>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-semibold">
                    Critical Transport
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  <strong>Target Profile:</strong> Long distance highway transfers (&gt;30 miles) requiring internal compressor without depleting vehicle oxygen bottles.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Key Accounts: Harris County EMS (TX), Denver Health (CO)
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Comparative Breakdown of PulseIQ Scores Across Regions (Recharts Data Visualization) */}
      <PulseIqRegionalBreakdownChart
        selectedState={selectedState}
        selectedCounty={selectedCounty}
        agencies={effectiveAgencies}
        onSelectCounty={(c) => {
          setSelectedCounty(c);
          if (onSelectCounty) onSelectCounty(c);
        }}
        onSelectState={(st) => {
          setSelectedState(st);
          setSelectedCounty('all');
          setSelectedCity('all');
          if (onSelectState) onSelectState(st);
          if (onSelectCounty) onSelectCounty('all');
          if (onSelectCity) onSelectCity('all');
        }}
        onSelectAgency={onSelectAgency}
        globalCategory={selectedCategory}
      />

      {/* Transparent Lead Scoring System Architecture */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              PulseIQ Multi-Factor Lead Scoring Formula & Weight Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mathematical scoring formula predicting the probability of successful sale based on public data.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md font-semibold">
            100 Pt Model
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 text-xs">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>1. Clinical Acuity</span>
              <span className="text-sky-700 font-mono font-bold">25 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Cardiac arrest volume (OHCA), Utstein ROSC survival rate deficit vs. 29.7% benchmark, and drive times to cath labs.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>2. Rival Fleet Age</span>
              <span className="text-sky-700 font-mono font-bold">25 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Installed LIFEPAK 15 and MRx units older than 7 years, out of warranty, and subject to competitor maintenance price hikes.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>3. CMS Recovery</span>
              <span className="text-sky-700 font-mono font-bold">20 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              CMS Medicare Part B claim denial rate (&gt;15%), GADCS penalty risk, and addressable cash recovery via ZOLL Billing.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>4. Demographics</span>
              <span className="text-sky-700 font-mono font-bold">15 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Senior population percentage (age 65+), municipal poverty rates, and public access AED coverage deficit in schools/parks.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>5. Budget & AFG</span>
              <span className="text-sky-700 font-mono font-bold">15 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Active FEMA Assistance to Firefighters Grant (AFG) award status and municipal fiscal year-end surplus spend timing.
            </p>
          </div>

        </div>
      </div>

      {/* THEATER FULLSCREEN MODE (Immersive Command-Center View) */}
      {isTheaterModal && (
        <div className="fixed inset-0 z-50 bg-[#070D1E] text-white flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Top Control Bar */}
          <div className="bg-[#0B1528] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>ZOLL Spatial GIS Command Center</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      FULL THEATER
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {filteredAgencies.length.toLocaleString()} Active Accounts · {selectedState === 'all' ? 'Nationwide Coverage' : `${selectedState} (${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState})`}
                  </p>
                </div>
              </div>

              {/* State Filter Dropdown in Theater Mode */}
              <div className="flex items-center gap-1.5 ml-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const st = e.target.value;
                    setSelectedState(st);
                    setSelectedCounty('all');
                    setSelectedCity('all');
                    if (onSelectState) onSelectState(st);
                    if (st !== 'all' && US_STATES_SVG_PATHS[st]) {
                      setZoomLevel(1.5);
                      setPanOffset({
                        x: (mapWidth / 2 - US_STATES_SVG_PATHS[st].labelX) * 0.7,
                        y: (mapHeight / 2 - US_STATES_SVG_PATHS[st].labelY) * 0.7
                      });
                    } else {
                      setZoomLevel(1);
                      setPanOffset({ x: 0, y: 0 });
                    }
                  }}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All 50 States (National)</option>
                  {availableStates.map(sc => (
                    <option key={sc} value={sc} className="bg-slate-900 text-white">
                      {sc} - {ALL_50_STATES_SUMMARIES[sc]?.state || sc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Layer Selection Pills */}
            <div className="flex flex-wrap items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setSelectedLayer('nemsis_cardiac')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLayer === 'nemsis_cardiac' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>NEMSIS Cardiac</span>
              </button>
              <button
                onClick={() => setSelectedLayer('cardiac')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayer === 'cardiac' ? 'bg-rose-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Survival Deficits
              </button>
              <button
                onClick={() => setSelectedLayer('aed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayer === 'aed' ? 'bg-fuchsia-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                AED Need
              </button>
              <button
                onClick={() => setSelectedLayer('transport')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayer === 'transport' ? 'bg-amber-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Transit Times
              </button>
              <button
                onClick={() => setSelectedLayer('cms')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayer === 'cms' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                CMS Denials
              </button>
            </div>

            {/* Display Mode & Exit Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setMapDisplayMode('kde')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${mapDisplayMode === 'kde' ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Thermal KDE
                </button>
                <button
                  onClick={() => setMapDisplayMode('hexbin')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${mapDisplayMode === 'hexbin' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  H3 Hexbins
                </button>
                <button
                  onClick={() => setMapDisplayMode('choropleth')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${mapDisplayMode === 'choropleth' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Choropleth
                </button>
                <button
                  onClick={() => setMapDisplayMode('pins')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${mapDisplayMode === 'pins' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Stations
                </button>
              </div>

              {/* Toggle Intelligence Slide Drawer */}
              <button
                onClick={() => setIsDrawerOpen(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isDrawerOpen
                    ? 'bg-sky-600 text-white border-sky-500 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle Territory Intelligence slideout drawer"
              >
                {isDrawerOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Telemetry</span>
              </button>

              {/* Exit Fullscreen Button */}
              <button
                onClick={() => setIsTheaterModal(false)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                title="Exit theater fullscreen mode (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
                <kbd className="hidden sm:inline bg-rose-800 text-white text-[10px] px-1 rounded font-mono">Esc</kbd>
              </button>
            </div>
          </div>

          {/* Main Full-Screen Body */}
          <div className="relative flex-1 w-full h-full flex overflow-hidden">
            {/* Map Canvas */}
            <div className="relative flex-1 w-full h-full bg-[#040914] flex items-center justify-center overflow-hidden">
              {/* Zoom & Pan Widget in Theater Mode */}
              <div className="absolute top-4 left-4 z-20 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg overflow-hidden text-slate-200 pointer-events-auto">
                <button 
                  onClick={() => setZoomLevel(z => Math.min(3.5, +(z + 0.35).toFixed(2)))} 
                  title="Zoom In (+)" 
                  className="p-2 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-700 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setZoomLevel(z => Math.max(1, +(z - 0.35).toFixed(2)))} 
                  title="Zoom Out (-)" 
                  className="p-2 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-700 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }} 
                  title="Reset Nationwide View" 
                  className="p-2 hover:bg-slate-800 hover:text-white transition-colors text-[10px] font-mono font-bold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Theater SVG Map */}
              <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full select-none">
                <defs>
                  <pattern id="gis-theater-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                    <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
                  </pattern>
                </defs>

                <g 
                  transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`} 
                  style={{ transformOrigin: '460px 250px', transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <rect width={mapWidth} height={mapHeight} fill="url(#gis-theater-grid)" />

                  {/* Alaska & Hawaii Inset Frames */}
                  <g>
                    <rect x="14" y="356" width="174" height="134" rx="10" fill="#0F172A" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
                    <text x="24" y="373" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="800">ALASKA (AK)</text>

                    <rect x="196" y="396" width="124" height="94" rx="10" fill="#0F172A" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
                    <text x="206" y="413" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="800">HAWAII (HI)</text>
                  </g>

                  {/* Authoritative U.S. Census 50-State + DC Boundary Polygons */}
                  <g>
                    {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                      const isActiveState = selectedState === 'all' || selectedState === sc;
                      const isHovered = hoveredStateCode === sc;
                      const acuity = stateAcuityMap[sc];

                      let fill = '#0B1426';
                      let stroke = '#1E293B';
                      let strokeWidth = 0.9;
                      let opacity = isActiveState ? 0.95 : 0.3;

                      if (mapDisplayMode === 'choropleth') {
                        if (selectedState === sc) {
                          fill = '#2563EB';
                          stroke = '#60A5FA';
                          strokeWidth = 2.5;
                          opacity = 1;
                        } else if (isHovered) {
                          fill = '#38BDF8';
                          stroke = '#FFFFFF';
                          strokeWidth = 2;
                          opacity = 1;
                        } else {
                          fill = acuity?.fillColor || '#0F172A';
                          stroke = acuity?.borderColor || '#334155';
                          strokeWidth = 1.1;
                          opacity = selectedState === 'all' ? 0.9 : 0.25;
                        }
                      } else {
                        if (selectedState === sc) {
                          fill = '#112240';
                          stroke = '#38BDF8';
                          strokeWidth = 2;
                          opacity = 1;
                        } else if (isHovered) {
                          fill = '#1E293B';
                          stroke = '#94A3B8';
                          strokeWidth = 1.5;
                        }
                      }

                      return (
                        <path
                          key={`gis-theater-poly-${sc}`}
                          d={boundary.d}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          opacity={opacity}
                          onMouseEnter={() => setHoveredStateCode(sc)}
                          onMouseLeave={() => setHoveredStateCode(null)}
                          onClick={() => {
                            const next = selectedState === sc ? 'all' : sc;
                            setSelectedState(next);
                            setSelectedCounty('all');
                            setSelectedCity('all');
                            if (onSelectState) onSelectState(next);
                            if (next !== 'all' && boundary) {
                              setZoomLevel(1.5);
                              setPanOffset({
                                x: (mapWidth / 2 - boundary.labelX) * 0.7,
                                y: (mapHeight / 2 - boundary.labelY) * 0.7
                              });
                            } else {
                              setZoomLevel(1);
                              setPanOffset({ x: 0, y: 0 });
                            }
                          }}
                          className="cursor-pointer transition-colors duration-150"
                        >
                          <title>{`${ALL_50_STATES_SUMMARIES[sc]?.state || sc} (${sc})`}</title>
                        </path>
                      );
                    })}
                  </g>

                  {/* Continuous KDE Thermal Surface in Theater Mode */}
                  {(mapDisplayMode === 'kde' || mapDisplayMode === 'hotspots') && kdeThermalDataUrl && (
                    <image
                      href={kdeThermalDataUrl}
                      x={0}
                      y={0}
                      width={mapWidth}
                      height={mapHeight}
                      opacity={kdeOpacity}
                      preserveAspectRatio="none"
                      className="pointer-events-none"
                      style={{ mixBlendMode: 'screen' }}
                    />
                  )}

                  {/* H3 Hexbins in Theater Mode */}
                  {mapDisplayMode === 'hexbin' && (
                    <g>
                      {hexBinCells.map((cell) => (
                        <polygon
                          key={`theater-${cell.id}`}
                          points={cell.points}
                          fill={cell.fillColor}
                          fillOpacity={0.85}
                          stroke={cell.strokeColor}
                          strokeWidth={0.9}
                          className="cursor-pointer"
                          onClick={() => {
                            onSelectAgency(cell.topAgency);
                            setIsTheaterModal(false);
                          }}
                        />
                      ))}
                    </g>
                  )}

                  {/* State Abbreviation Typography Labels */}
                  <g className="pointer-events-none select-none">
                    {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                      const isCallout = EAST_COAST_CALLOUT_STATES.some(c => c.code === sc);
                      if (isCallout) return null;
                      const isSelected = selectedState === sc;
                      const isHovered = hoveredStateCode === sc;
                      const isActive = selectedState === 'all' || isSelected;

                      return (
                        <text
                          key={`theater-lbl-${sc}`}
                          x={boundary.labelX}
                          y={boundary.labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={sc === 'CA' || sc === 'TX' || sc === 'MT' || sc === 'AK' ? '11' : '9.5'}
                          fontWeight="800"
                          fill={isSelected ? '#38BDF8' : isHovered ? '#FFFFFF' : 'rgba(226,232,240,0.78)'}
                          opacity={isActive ? 1 : 0.4}
                          className="font-mono tracking-tight"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
                        >
                          {sc}
                        </text>
                      );
                    })}
                  </g>

                  {/* Agency Markers */}
                  {mapDisplayMode !== 'hexbin' && mapRenderedAgencies.map((agency) => {
                    const { x, y } = projectCoord(agency.latitude, agency.longitude);
                    const visual = getAgencyLayerVisual(agency, selectedLayer);
                    const isHovered = hoveredAgency?.id === agency.id;
                    const baseR = mapDisplayMode === 'kde' ? Math.max(2.2, visual.markerRadius * 0.58) : visual.markerRadius * 0.85;

                    return (
                      <g
                        key={`theater-ag-${agency.id}`}
                        transform={`translate(${x}, ${y})`}
                        className="cursor-pointer group"
                        onClick={() => {
                          onSelectAgency(agency);
                          setIsTheaterModal(false);
                        }}
                        onMouseEnter={() => setHoveredAgency(agency)}
                        onMouseLeave={() => setHoveredAgency(null)}
                      >
                        <circle
                          r={isHovered ? baseR * 1.6 : baseR}
                          fill={visual.markerFill}
                          stroke="#0F172A"
                          strokeWidth={1.1}
                          className="transition-transform duration-150"
                        />
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Intensity Scale Legend in Theater Mode */}
              <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs pointer-events-auto">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider block mb-1.5 flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Intensity Scale</span>
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-400"></span>
                    <span className="text-white font-semibold">Critical Epicenter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span className="text-slate-300">High Acuity / Deficit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span className="text-slate-400">Moderate Need</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-slate-400">Baseline Tier</span>
                  </div>
                </div>
              </div>

              {/* State Hover Telemetry in Theater Mode */}
              {hoveredStateCode && !hoveredAgency && stateAcuityMap[hoveredStateCode] && (
                <div className="absolute bottom-5 left-5 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-xl p-3 shadow-2xl max-w-xs animate-in fade-in duration-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                    {ALL_50_STATES_SUMMARIES[hoveredStateCode]?.region || 'US'} Region · {hoveredStateCode}
                  </span>
                  <h4 className="font-bold text-sm text-white">
                    {stateAcuityMap[hoveredStateCode].name}
                  </h4>
                  <div className="space-y-1 text-xs text-slate-300 mt-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">{stateAcuityMap[hoveredStateCode].metricLabel}:</span>
                      <span className="font-bold text-white">{stateAcuityMap[hoveredStateCode].metricValue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">EMS / Fire Agencies:</span>
                      <span className="font-bold text-white">{stateAcuityMap[hoveredStateCode].agencyCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Agency Hover Telemetry in Theater Mode */}
              {hoveredAgency && (
                <div className="absolute bottom-5 left-5 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-xl p-3.5 shadow-2xl max-w-sm animate-in fade-in duration-100">
                  <h4 className="font-bold text-sm text-white">{hoveredAgency.name}</h4>
                  <p className="text-xs text-slate-400">{hoveredAgency.city}, {hoveredAgency.stateCode} · {hoveredAgency.county}</p>
                  <div className="mt-2 text-xs font-mono text-emerald-400">
                    Target: {hoveredAgency.zollOpportunity.primaryTargetProduct} (${(hoveredAgency.zollOpportunity.estimatedDealValue || hoveredAgency.zollOpportunity.projectedPipelineValue).toLocaleString()})
                  </div>
                  <button
                    onClick={() => {
                      onSelectAgency(hoveredAgency);
                      setIsTheaterModal(false);
                    }}
                    className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Open Account Battlecard
                  </button>
                </div>
              )}
            </div>

            {/* Slide-out Intelligence Telemetry Drawer */}
            {isDrawerOpen && (
              <div className="w-80 sm:w-96 bg-[#0B1528] border-l border-slate-800 p-4 overflow-y-auto flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span>Territory Telemetry</span>
                  </h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Top Layer Hotspots</span>
                  {topCardiacEpicenters.map((agency) => (
                    <div
                      key={`drawer-${agency.id}`}
                      onClick={() => {
                        onSelectAgency(agency);
                        setIsTheaterModal(false);
                      }}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all"
                    >
                      <div className="font-bold text-xs text-white truncate">{agency.name}</div>
                      <div className="text-[11px] text-slate-400">{agency.city}, {agency.stateCode}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-rose-400">{getAgencyLayerVisual(agency, selectedLayer).metricDisplay}</span>
                        <span className="text-emerald-400">${(agency.zollOpportunity.estimatedDealValue || agency.zollOpportunity.projectedPipelineValue).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
