/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency, TerritoryCluster } from '../types';
import { TERRITORY_CLUSTERS } from '../data/healthcareData';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS } from '../data/usStatesSvgPaths';
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
  ArrowUpRight
} from 'lucide-react';
import { PulseIqRegionalBreakdownChart } from './PulseIqRegionalBreakdownChart';
import { InteractiveSparkline } from './InteractiveSparkline';

interface GisTerritoryHeatmapProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onFilterByCluster: (clusterId: string) => void;
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
  const [sidebarTab, setSidebarTab] = useState<'nemsis_epicenters' | 'acuity_distribution' | 'product_matrix'>('nemsis_epicenters');
  const [showDensityHalos, setShowDensityHalos] = useState<boolean>(true);
  const [showPulseAnimations, setShowPulseAnimations] = useState<boolean>(true);

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
    if (selectedState === 'all') {
      return territoryEngine.getCountiesForState('all').map(c => c.countyName);
    }
    return territoryEngine.getCountiesForState(selectedState).map(c => c.countyName);
  }, [selectedState]);

  const availableCities = useMemo(() => {
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-start xl:items-center justify-between gap-4 min-w-0">
          <div>
            <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Geographic Information System (GIS) & Public Health Analysis
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              High-Potential Territory Clusters & Product Demand Hotspots
            </h1>
            <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
              Synthesizing emergency call locations, cardiac arrest survival rates, transport distance isochrones, and senior population density across all 50 states, 3,143 counties, and 5,389+ cities for EMS Providers & Fire Departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">GIS Heatmap Layer:</span>
            <div className="flex flex-wrap items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setSelectedLayer('nemsis_cardiac')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  selectedLayer === 'nemsis_cardiac' 
                    ? 'bg-rose-600 text-white font-bold shadow-xs' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>NEMSIS Cardiac Acuity</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  selectedLayer === 'nemsis_cardiac' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                }`}>
                  HOTSPOTS
                </span>
              </button>
              <button
                onClick={() => setSelectedLayer('cardiac')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'cardiac' ? 'bg-white text-rose-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Survival Deficit
              </button>
              <button
                onClick={() => setSelectedLayer('aed')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'aed' ? 'bg-white text-sky-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AED Need
              </button>
              <button
                onClick={() => setSelectedLayer('transport')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'transport' ? 'bg-white text-amber-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Long Transport (&gt;20 min)
              </button>
              <button
                onClick={() => setSelectedLayer('cms')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  selectedLayer === 'cms' ? 'bg-white text-emerald-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CMS Denial Zones
              </button>
            </div>
          </div>
        </div>

        {/* Strategic Corridor Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          {TERRITORY_CLUSTERS.map((cluster) => {
            const isSelected = selectedClusterId === cluster.id;
            return (
              <div
                key={cluster.id}
                onClick={() => {
                  setSelectedClusterId(isSelected ? 'all' : cluster.id);
                  onFilterByCluster(isSelected ? 'all' : cluster.id);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-sky-50 border-sky-400 shadow-md ring-1 ring-sky-300' 
                    : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-sky-800 font-bold">
                    {cluster.states.join(', ')} Corridor
                  </span>
                  <span className="text-slate-500 font-mono">
                    {cluster.highPriorityAgencyCount} Accounts
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                  {cluster.name}
                </h3>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {cluster.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pipeline</span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">
                      ${(cluster.totalPipelineValue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Survival</span>
                    <span className="font-mono font-bold text-rose-700 tabular-nums">
                      {cluster.averageSurvivalRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transport</span>
                    <span className="font-mono font-bold text-amber-800 tabular-nums">
                      {cluster.averageTransportMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Map & Equipment Demand Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0">
        
        {/* Interactive GIS Spatial Visualizer */}
        <div className="lg:col-span-8 min-w-0 bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs flex flex-col text-slate-900">
          {/* Interactive Jurisdiction Navigation & Geographic Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
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
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-100/80 border border-sky-300 px-2 py-0.5 rounded-md">
                {selectedCity !== 'all' ? `${selectedCity}, ${selectedState}` : selectedCounty !== 'all' ? `${selectedCounty}, ${selectedState}` : selectedState !== 'all' ? `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})` : 'US Nationwide (50 States + DC)'}
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
                      <span className={`text-[10px] font-mono border px-2 py-0.5 rounded-full font-bold ${
                        selectedLayer === 'nemsis_cardiac' ? 'bg-rose-500/30 border-rose-400/50 text-rose-200' :
                        selectedLayer === 'cardiac' ? 'bg-red-500/30 border-red-400/50 text-red-200' :
                        selectedLayer === 'aed' ? 'bg-fuchsia-500/30 border-fuchsia-400/50 text-fuchsia-200' :
                        selectedLayer === 'transport' ? 'bg-amber-500/30 border-amber-400/50 text-amber-200' :
                        'bg-emerald-500/30 border-emerald-400/50 text-emerald-200'
                      }`}>
                        {selectedLayer === 'nemsis_cardiac' ? 'v3.5 LIVE DATASET' :
                         selectedLayer === 'cardiac' ? 'UTSTEIN RESUSCITATION REGISTRY' :
                         selectedLayer === 'aed' ? 'GIS PAD CENSUS' :
                         selectedLayer === 'transport' ? 'NEMSIS TRANSIT REGISTRY' :
                         'MEDICARE MAC REVENUE AUDIT'}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
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

                <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700/80 rounded-xl px-2 py-1 text-[11px] text-slate-300">
                  <button
                    onClick={() => setShowDensityHalos(prev => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      showDensityHalos ? 'bg-sky-900/80 text-sky-200 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle spatial GIS density halo radii"
                  >
                    Heat Halos: {showDensityHalos ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowPulseAnimations(prev => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      showPulseAnimations ? 'bg-sky-900/80 text-sky-200 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle pulsing rings on critical epicenters"
                  >
                    Pulse: {showPulseAnimations ? 'ON' : 'OFF'}
                  </button>
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

          <div className="relative flex-1 bg-[#F8FAFC] p-3 min-h-[460px] flex items-center justify-center overflow-hidden">
            <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full max-h-[500px] select-none">
              <defs>
                <pattern id="gis-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                  <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.14)" strokeWidth="1" />
                </pattern>

                {/* NEMSIS Cardiac Intensity Gradients */}
                <radialGradient id="nemsis-critical-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#be123c" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#e11d48" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nemsis-high-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2410c" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#ea580c" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#fb923c" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fdba74" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nemsis-moderate-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.7" />
                  <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#fde047" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nemsis-baseline-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
                </radialGradient>

                {/* Survival Deficit Gradients */}
                <radialGradient id="survival-critical-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#dc2626" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f87171" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fee2e2" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="survival-high-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2410c" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#ea580c" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#fb923c" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ffedd5" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="survival-moderate-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.7" />
                  <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#fde047" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="survival-benchmark-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d1fae5" stopOpacity="0" />
                </radialGradient>

                {/* AED Need Gradients */}
                <radialGradient id="aed-critical-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a21caf" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#c026d3" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#e879f9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fae8ff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="aed-high-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0369a1" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#0284c7" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="aed-moderate-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity="0.7" />
                  <stop offset="45%" stopColor="#0d9488" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#2dd4bf" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ccfbf1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="aed-baseline-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#64748b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0" />
                </radialGradient>

                {/* Transport Isochrone Gradients */}
                <radialGradient id="transport-critical-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9a3412" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#b45309" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="transport-high-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c2410c" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#d97706" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="transport-moderate-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d1fae5" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="transport-baseline-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
                </radialGradient>

                {/* CMS Denial Gradients */}
                <radialGradient id="cms-critical-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9f1239" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#be123c" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#fb7185" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffe4e6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="cms-high-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#a78bfa" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ede9fe" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="cms-moderate-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0369a1" stopOpacity="0.65" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="cms-baseline-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#d1fae5" stopOpacity="0" />
                </radialGradient>

                <filter id="nemsis-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width={mapWidth} height={mapHeight} fill="url(#gis-map-grid)" />

              {/* Alaska & Hawaii Inset Frames */}
              <g>
                <rect x="14" y="356" width="174" height="134" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
                <text x="24" y="373" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="800">ALASKA (AK)</text>

                <rect x="196" y="396" width="124" height="94" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
                <text x="206" y="413" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="800">HAWAII (HI)</text>
              </g>

              {/* Authoritative U.S. Census 50-State + DC Boundary Polygons */}
              <g>
                {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                  const isActiveState = selectedState === 'all' || selectedState === sc;
                  return (
                    <path
                      key={`gis-poly-${sc}`}
                      d={boundary.d}
                      fill={selectedState === sc ? '#DBEAFE' : '#E2E8F0'}
                      stroke={selectedState === sc ? '#1E3A8A' : '#94A3B8'}
                      strokeWidth={selectedState === sc ? 1.5 : 0.9}
                      opacity={isActiveState ? 0.95 : 0.35}
                      onClick={() => {
                        const next = selectedState === sc ? 'all' : sc;
                        setSelectedState(next);
                        setSelectedCounty('all');
                        setSelectedCity('all');
                        if (onSelectState) onSelectState(next);
                        if (onSelectCounty) onSelectCounty('all');
                        if (onSelectCity) onSelectCity('all');
                      }}
                      className="cursor-pointer transition-colors"
                    >
                      <title>{`${ALL_50_STATES_SUMMARIES[sc]?.state || sc} (${sc})`}</title>
                    </path>
                  );
                })}
              </g>

              {/* GIS Heat Radii based on Active Layer */}
              {showDensityHalos && mapRenderedAgencies.map((agency) => {
                const { x, y } = projectCoord(agency.latitude, agency.longitude);
                const visual = getAgencyLayerVisual(agency, selectedLayer);

                return (
                  <g key={`heat-${agency.id}`} transform={`translate(${x}, ${y})`}>
                    {/* Gradient Ambient Heat Zone */}
                    <circle
                      r={visual.heatRadius}
                      fill={`url(#${visual.gradientId})`}
                      filter="url(#nemsis-glow)"
                    />
                    {/* Isochrone / Deficit Contour Ring */}
                    <circle
                      r={visual.heatRadius * 0.65}
                      fill="none"
                      stroke={visual.ringColor}
                      strokeWidth="1"
                      strokeDasharray={visual.isCritical ? "3 2" : "none"}
                      opacity={visual.ringOpacity}
                    />
                    {/* Animated Pulse Ring for Critical Hotspots */}
                    {visual.isCritical && showPulseAnimations && (
                      <circle
                        r={visual.heatRadius * 0.9}
                        fill="none"
                        stroke={visual.ringColor}
                        strokeWidth="1.5"
                        opacity="0.65"
                        className="animate-ping"
                        style={{ transformOrigin: '0 0', animationDuration: '3s' }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Agency Interactive Markers */}
              {mapRenderedAgencies.map((agency) => {
                const { x, y } = projectCoord(agency.latitude, agency.longitude);
                const visual = getAgencyLayerVisual(agency, selectedLayer);
                const isHovered = hoveredAgency?.id === agency.id;

                return (
                  <g
                    key={agency.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => onSelectAgency(agency)}
                    onMouseEnter={() => setHoveredAgency(agency)}
                    onMouseLeave={() => setHoveredAgency(null)}
                  >
                    {visual.isCritical && (
                      <circle
                        r={visual.markerRadius + 3}
                        fill="none"
                        stroke={visual.ringColor}
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                    )}
                    <circle
                      r={isHovered ? visual.markerRadius * 1.5 : visual.markerRadius}
                      fill={visual.markerFill}
                      stroke="#ffffff"
                      strokeWidth={visual.isCritical ? 1.75 : 1.25}
                      className="transition-transform duration-150 group-hover:scale-150 shadow-md"
                    />
                    {visual.isCritical && (
                      <circle
                        r="1.8"
                        fill="#ffffff"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Map Intensity Scale Legend Overlay */}
            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-2.5 shadow-sm text-[11px] pointer-events-auto">
              <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wider block mb-1.5 flex items-center gap-1">
                {selectedLayer === 'nemsis_cardiac' ? <HeartPulse className="w-3 h-3 text-rose-600" /> :
                 selectedLayer === 'cardiac' ? <Activity className="w-3 h-3 text-red-600" /> :
                 selectedLayer === 'aed' ? <Zap className="w-3 h-3 text-fuchsia-600" /> :
                 selectedLayer === 'transport' ? <Clock className="w-3 h-3 text-amber-600" /> :
                 <DollarSign className="w-3 h-3 text-rose-600" />}
                {selectedLayer === 'nemsis_cardiac' ? 'NEMSIS Call Intensity' :
                 selectedLayer === 'cardiac' ? 'Survival Deficit Intensity' :
                 selectedLayer === 'aed' ? 'Public Access AED Need' :
                 selectedLayer === 'transport' ? 'Transport Isochrones' :
                 'CMS Denial Concentrations'}
              </span>

              {selectedLayer === 'nemsis_cardiac' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-700 ring-2 ring-rose-300"></span>
                    <span className="text-slate-800 font-semibold">≥800 Calls (Critical Epicenter)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                    <span className="text-slate-700 font-medium">400–799 Calls (High Acuity)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">200–399 Calls (Moderate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-slate-500">&lt;200 Calls (Baseline)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'cardiac' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-700 ring-2 ring-red-300"></span>
                    <span className="text-slate-800 font-semibold">&lt;22% Survival (Critical Deficit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                    <span className="text-slate-700 font-medium">22–26% Survival (High Deficit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">26–30% Survival (Moderate Deficit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-slate-500">&gt;30% Survival (Benchmark Tier)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'aed' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-700 ring-2 ring-fuchsia-300"></span>
                    <span className="text-slate-800 font-semibold">≥55% Deficit (Severe Shortage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    <span className="text-slate-700 font-medium">45–54% Deficit (High ZOLL Need)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    <span className="text-slate-600">35–44% Deficit (Moderate Need)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span className="text-slate-500">&lt;35% Deficit (Adequate Coverage)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'transport' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-800 ring-2 ring-amber-300"></span>
                    <span className="text-slate-800 font-semibold">≥28 min (Extreme Isochrone)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <span className="text-slate-700 font-medium">22–27 min (Prolonged Route)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-slate-600">16–21 min (Standard Transit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    <span className="text-slate-500">&lt;16 min (Rapid Urban Dispatch)</span>
                  </div>
                </div>
              )}

              {selectedLayer === 'cms' && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-700 ring-2 ring-rose-300"></span>
                    <span className="text-slate-800 font-semibold">≥21% Denials (Severe Denial Zone)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span className="text-slate-700 font-medium">18–20.9% Denials (High AR Target)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    <span className="text-slate-600">14–17.9% Denials (Moderate Rate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-slate-500">&lt;14% Denials (Compliant Medicare)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Floating Hover Telemetry Card */}
            {hoveredAgency && (
              <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl p-3.5 shadow-2xl max-w-sm pointer-events-auto transition-all animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                      {selectedLayer === 'nemsis_cardiac' ? <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> :
                       selectedLayer === 'cardiac' ? <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" /> :
                       selectedLayer === 'aed' ? <Zap className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" /> :
                       selectedLayer === 'transport' ? <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> :
                       <DollarSign className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                      <span>{getAgencyLayerVisual(hoveredAgency, selectedLayer).tierLabel}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-tight mt-0.5">
                      {hoveredAgency.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {hoveredAgency.city}, {hoveredAgency.stateCode} · {hoveredAgency.county}
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

                <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 mb-2.5">
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
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">STEMI Alerts</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {Math.round((hoveredAgency.annualCardiacArrestCalls || 500) * 0.165)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 mb-2.5 leading-snug">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Incumbent Defib:</span>
                    <span className="font-semibold text-white">{hoveredAgency.installedFleet.defibBrand} ({hoveredAgency.installedFleet.defibAgeYears} yrs)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mechanical CPR:</span>
                    <span className="font-semibold text-white">{hoveredAgency.installedFleet.mechanicalCPR}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Clinical Solution:</span>
                    <span className="font-semibold text-sky-400">AutoPulse + Real CPR Help</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectAgency(hoveredAgency)}
                  className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Open Full Clinical Battlecard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Panel: NEMSIS High-Acuity Call Epicenters & Product Demand Matrix */}
        <div className="lg:col-span-4 min-w-0 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
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

    </div>
  );
};
