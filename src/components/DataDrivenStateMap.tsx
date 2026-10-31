/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Data-Driven U.S. State Layer Component
 * Supports dynamic metric selection, accurate choropleth shading, visually distinct
 * missing-data hatching vs. reported zeros, non-obscuring selection halos,
 * single-percentage exact value display, adaptive readable labels, and mobile-optimized layouts.
 */

import React, { useState, useMemo } from 'react';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS, EAST_COAST_CALLOUT_STATES } from '../data/usStatesSvgPaths';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import {
  Compass,
  Percent,
  Truck,
  Award,
  HeartPulse,
  Clock,
  ExternalLink,
  Info,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Building2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { formatCurrency, formatPercent, formatInteger } from '../utils/formatters';

export type StateMapMetric =
  | 'denial_rate'
  | 'agencies'
  | 'afg_awards'
  | 'survival_rate'
  | 'transport_time';

export interface DataDrivenStateMapProps {
  selectedStateCode: string;
  onSelectState: (stateCode: string) => void;
  onInspectCounties?: (stateCode: string) => void;
  regionFilter?: 'All' | 'Northeast' | 'Midwest' | 'South' | 'West';
  onRegionFilterChange?: (region: 'All' | 'Northeast' | 'Midwest' | 'South' | 'West') => void;
  isDarkMode?: boolean;
}

interface MetricBucket {
  min: number;
  max: number;
  label: string;
  fillLight: string;
  fillDark: string;
  isDarkFill: boolean;
}

interface MetricConfig {
  id: StateMapMetric;
  label: string;
  shortLabel: string;
  unit: string;
  icon: React.ElementType;
  description: string;
  reportingPeriod: string;
  sourceName: string;
  sourceUrl: string;
  formatSingleValue: (val: number | null | undefined) => string;
  getValue: (summary: typeof ALL_50_STATES_SUMMARIES[string]) => number | null;
  buckets: MetricBucket[];
}

export const STATE_METRICS_CONFIG: Record<StateMapMetric, MetricConfig> = {
  denial_rate: {
    id: 'denial_rate',
    label: 'Medicare Denial Rate (%)',
    shortLabel: 'Denial Rate',
    unit: '%',
    icon: Percent,
    description: 'CMS Part B Ground Ambulance Claims Denial Benchmark',
    reportingPeriod: 'CMS Part B CY2024–CY2025 National PUF',
    sourceName: 'CMS Ground Ambulance Data Collection',
    sourceUrl: 'https://data.cms.gov/provider-data/topics/ambulance-services',
    formatSingleValue: (val) => (val != null ? `${val.toFixed(1)}%` : 'No Data'),
    getValue: (st) => st.avgMedicareDenialRate ?? null,
    buckets: [
      { min: 0, max: 15.0, label: '< 15.0%', fillLight: '#EFF6FF', fillDark: '#1E293B', isDarkFill: false },
      { min: 15.0, max: 17.0, label: '15.0% - 16.9%', fillLight: '#BFDBFE', fillDark: '#1E3A8A', isDarkFill: false },
      { min: 17.0, max: 19.0, label: '17.0% - 18.9%', fillLight: '#60A5FA', fillDark: '#2563EB', isDarkFill: false },
      { min: 19.0, max: 21.0, label: '19.0% - 20.9%', fillLight: '#2563EB', fillDark: '#3B82F6', isDarkFill: true },
      { min: 21.0, max: 100, label: '≥ 21.0%', fillLight: '#1E3A8A', fillDark: '#60A5FA', isDarkFill: true }
    ]
  },
  agencies: {
    id: 'agencies',
    label: 'Active EMS & Fire Agencies',
    shortLabel: 'Agency Count',
    unit: 'agencies',
    icon: Truck,
    description: 'Total Operational Fire Departments & EMS Transport Services',
    reportingPeriod: 'USFA & State Health Boards 2024 Service Roster',
    sourceName: 'U.S. Fire Administration Registry',
    sourceUrl: 'https://apps.usfa.fema.gov/registry/',
    formatSingleValue: (val) => (val != null ? `${val.toLocaleString()} Agencies` : 'No Data'),
    getValue: (st) => st.totalAgencies ?? null,
    buckets: [
      { min: 0, max: 200, label: '< 200', fillLight: '#F0FDF4', fillDark: '#064E3B', isDarkFill: false },
      { min: 200, max: 450, label: '200 - 450', fillLight: '#BBF7D0', fillDark: '#047857', isDarkFill: false },
      { min: 450, max: 750, label: '450 - 750', fillLight: '#4ADE80', fillDark: '#059669', isDarkFill: false },
      { min: 750, max: 1200, label: '750 - 1,200', fillLight: '#16A34A', fillDark: '#10B981', isDarkFill: true },
      { min: 1200, max: 99999, label: '≥ 1,200', fillLight: '#14532D', fillDark: '#34D399', isDarkFill: true }
    ]
  },
  afg_awards: {
    id: 'afg_awards',
    label: 'FEMA AFG Awarded Funding ($)',
    shortLabel: 'FEMA Grants',
    unit: '$',
    icon: Award,
    description: 'Federal Assistance to Firefighters Equipment & Operations Grants',
    reportingPeriod: 'OpenFEMA FY2024–FY2025 Grants Cycle',
    sourceName: 'FEMA Assistance to Firefighters Grant Program',
    sourceUrl: 'https://www.fema.gov/grants/preparedness/firefighters',
    formatSingleValue: (val) => (val != null ? `$${(val / 1000000).toFixed(1)}M` : 'No Data'),
    getValue: (st) => st.totalAfgAwardsYtd ?? null,
    buckets: [
      { min: 0, max: 5000000, label: '< $5.0M', fillLight: '#FEF3C7', fillDark: '#451A03', isDarkFill: false },
      { min: 5000000, max: 8000000, label: '$5.0M - $8.0M', fillLight: '#FDE68A', fillDark: '#78350F', isDarkFill: false },
      { min: 8000000, max: 12000000, label: '$8.0M - $12.0M', fillLight: '#FBBF24', fillDark: '#B45309', isDarkFill: false },
      { min: 12000000, max: 18000000, label: '$12.0M - $18.0M', fillLight: '#D97706', fillDark: '#D97706', isDarkFill: true },
      { min: 18000000, max: 999999999, label: '≥ $18.0M', fillLight: '#78350F', fillDark: '#F59E0B', isDarkFill: true }
    ]
  },
  survival_rate: {
    id: 'survival_rate',
    label: 'Cardiac Arrest Survival Rate (%)',
    shortLabel: 'Survival Rate',
    unit: '%',
    icon: HeartPulse,
    description: 'Utstein Bystander-Witnessed Shockable Rhythm Survival Benchmark',
    reportingPeriod: 'CARES Registry 2024 National Report',
    sourceName: 'Cardiac Arrest Registry to Enhance Survival',
    sourceUrl: 'https://mycares.net/',
    formatSingleValue: (val) => (val != null ? `${val.toFixed(1)}%` : 'No Data'),
    getValue: (st) => st.avgUtsteinSurvival ?? null,
    buckets: [
      { min: 0, max: 24.0, label: '< 24.0%', fillLight: '#FEE2E2', fillDark: '#7F1D1D', isDarkFill: false },
      { min: 24.0, max: 28.0, label: '24.0% - 27.9%', fillLight: '#FECACA', fillDark: '#991B1B', isDarkFill: false },
      { min: 28.0, max: 32.0, label: '28.0% - 31.9%', fillLight: '#FCA5A5', fillDark: '#B91C1C', isDarkFill: false },
      { min: 32.0, max: 35.0, label: '32.0% - 34.9%', fillLight: '#EF4444', fillDark: '#DC2626', isDarkFill: true },
      { min: 35.0, max: 100, label: '≥ 35.0%', fillLight: '#991B1B', fillDark: '#EF4444', isDarkFill: true }
    ]
  },
  transport_time: {
    id: 'transport_time',
    label: 'Avg Transport Transit (Mins)',
    shortLabel: 'Transport Time',
    unit: 'min',
    icon: Clock,
    description: 'Average Scene-to-STEMI Cath Lab / Emergency Department Duration',
    reportingPeriod: 'NEMSIS v3.5 Annual Operational Run Times',
    sourceName: 'National EMS Information System',
    sourceUrl: 'https://nemsis.org/',
    formatSingleValue: (val) => (val != null ? `${val.toFixed(1)} min` : 'No Data'),
    getValue: (st) => st.avgTransportMinutes ?? null,
    buckets: [
      { min: 0, max: 18.0, label: '< 18.0 min', fillLight: '#F5F3FF', fillDark: '#2E1065', isDarkFill: false },
      { min: 18.0, max: 22.0, label: '18.0 - 22.0 min', fillLight: '#DDD6FE', fillDark: '#4C1D95', isDarkFill: false },
      { min: 22.0, max: 26.0, label: '22.1 - 26.0 min', fillLight: '#A78BFA', fillDark: '#6D28D9', isDarkFill: false },
      { min: 26.0, max: 30.0, label: '26.1 - 30.0 min', fillLight: '#7C3AED', fillDark: '#8B5CF6', isDarkFill: true },
      { min: 30.0, max: 999, label: '≥ 30.1 min', fillLight: '#4C1D95', fillDark: '#A78BFA', isDarkFill: true }
    ]
  }
};

export const DataDrivenStateMap: React.FC<DataDrivenStateMapProps> = ({
  selectedStateCode,
  onSelectState,
  onInspectCounties,
  regionFilter = 'All',
  onRegionFilterChange,
  isDarkMode = false
}) => {
  const [activeMetricId, setActiveMetricId] = useState<StateMapMetric>('denial_rate');
  const [hoveredStateCode, setHoveredStateCode] = useState<string | null>(null);

  const activeMetric = STATE_METRICS_CONFIG[activeMetricId];

  // Helper to determine bucket and colors for a state
  const getStateShading = (st: typeof ALL_50_STATES_SUMMARIES[string]) => {
    const rawVal = activeMetric.getValue(st);

    // Missing Data case: Distinct from reported zero!
    if (rawVal === null || rawVal === undefined) {
      return {
        fill: 'url(#missing-data-stripes)',
        isMissing: true,
        isZero: false,
        isDark: false,
        rawVal: null,
        bucketLabel: 'No Data'
      };
    }

    // Reported Zero case: solid pale tone of lowest bucket
    if (rawVal === 0) {
      const b0 = activeMetric.buckets[0];
      return {
        fill: isDarkMode ? b0.fillDark : b0.fillLight,
        isMissing: false,
        isZero: true,
        isDark: b0.isDarkFill,
        rawVal: 0,
        bucketLabel: b0.label
      };
    }

    // Normal bucket resolution
    for (let i = 0; i < activeMetric.buckets.length; i++) {
      const b = activeMetric.buckets[i];
      if (rawVal <= b.max || i === activeMetric.buckets.length - 1) {
        return {
          fill: isDarkMode ? b.fillDark : b.fillLight,
          isMissing: false,
          isZero: false,
          isDark: b.isDarkFill,
          rawVal,
          bucketLabel: b.label
        };
      }
    }

    const last = activeMetric.buckets[activeMetric.buckets.length - 1];
    return {
      fill: isDarkMode ? last.fillDark : last.fillLight,
      isMissing: false,
      isZero: false,
      isDark: last.isDarkFill,
      rawVal,
      bucketLabel: last.label
    };
  };

  // Inspect state: either hovered state or currently selected state
  const activeInspectionState = useMemo(() => {
    const code = hoveredStateCode || (selectedStateCode !== 'all' ? selectedStateCode : null);
    if (!code) return null;
    return ALL_50_STATES_SUMMARIES[code] || null;
  }, [hoveredStateCode, selectedStateCode]);

  // Selected state path record (for foreground halo rendering so outline is never clipped)
  const selectedStateBoundary = useMemo(() => {
    if (selectedStateCode === 'all') return null;
    return US_STATES_SVG_PATHS[selectedStateCode] || null;
  }, [selectedStateCode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start w-full min-w-0">
      {/* =========================================================================
          LEFT / TOP: MAP CANVAS + CONTROLS + LEGEND (Takes full width on mobile)
         ========================================================================= */}
      <div className="lg:col-span-8 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs space-y-4">
        {/* Header Strip with Title & Region Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Data-Driven State Choropleth Map</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Shaded by verified municipal metrics. Click any state or East Coast callout to inspect county directories.
            </p>
          </div>

          {/* Region Filter Control */}
          {onRegionFilterChange && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar shrink-0">
              {(['All', 'Northeast', 'Midwest', 'South', 'West'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => onRegionFilterChange(reg)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    regionFilter === reg
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            METRIC SELECTOR STRIP: Mobile-friendly reachable pills
           ===================================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="uppercase text-[10px] font-mono tracking-wider text-blue-700 dark:text-blue-400">
              Select Shading Metric
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Updates map colors &amp; legend dynamically
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {Object.values(STATE_METRICS_CONFIG).map((metric) => {
              const MetricIcon = metric.icon;
              const isSelected = activeMetricId === metric.id;
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setActiveMetricId(metric.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <MetricIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{metric.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================================
            SVG U.S. MAP CANVAS (Full width with high-contrast cartography)
           ===================================================================== */}
        <div className="relative bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-2 sm:p-3">
          <svg
            viewBox="0 0 920 500"
            className="w-full h-[320px] sm:h-[420px] md:h-[460px] select-none"
            role="img"
            aria-label="Interactive United States State Metric Map"
          >
            <defs>
              {/* Neutral background map grid */}
              <pattern id="us-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
              </pattern>

              {/* Visually Distinct Striped Diagonal Pattern for Missing Data */}
              <pattern
                id="missing-data-stripes"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="10" height="10" fill={isDarkMode ? '#0F172A' : '#F8FAFC'} />
                <line x1="0" y1="0" x2="0" y2="10" stroke={isDarkMode ? '#334155' : '#94A3B8'} strokeWidth="2.5" opacity="0.65" />
              </pattern>

              {/* Strong Luminous Outline/Halo for Selected State (Never obscures underlying fill) */}
              <filter id="selection-halo" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#2563EB" floodOpacity="0.85" />
              </filter>
            </defs>

            <rect width="920" height="500" fill="url(#us-map-grid)" />

            {/* Inset Frames for Alaska & Hawaii */}
            <g>
              <rect x="14" y="356" width="174" height="134" rx="8" fill={isDarkMode ? '#0F172A' : '#FFFFFF'} fillOpacity="0.8" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              <text x="24" y="372" fill="#64748B" fontSize="9" fontWeight="800" fontFamily="monospace">ALASKA (AK)</text>

              <rect x="196" y="396" width="124" height="94" rx="8" fill={isDarkMode ? '#0F172A' : '#FFFFFF'} fillOpacity="0.8" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              <text x="206" y="412" fill="#64748B" fontSize="9" fontWeight="800" fontFamily="monospace">HAWAII (HI)</text>
            </g>

            {/* LAYER 1: 50 State Boundary Polygons (Color-shaded by actual value) */}
            <g id="state-polygons-layer">
              {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                const boundary = US_STATES_SVG_PATHS[st.code];
                if (!boundary || !boundary.d) return null;

                const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                const isSelected = selectedStateCode === st.code;
                const isHovered = hoveredStateCode === st.code;

                const shading = getStateShading(st);
                const strokeColor = isHovered
                  ? '#0F172A'
                  : isDarkMode
                  ? '#334155'
                  : '#94A3B8';

                return (
                  <path
                    key={`state-path-${st.code}`}
                    d={boundary.d}
                    fill={shading.fill}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 2.2 : 0.85}
                    opacity={!isInRegion ? 0.35 : 1}
                    onClick={() => onSelectState(st.code)}
                    onMouseEnter={() => setHoveredStateCode(st.code)}
                    onMouseLeave={() => setHoveredStateCode(null)}
                    className="cursor-pointer transition-colors duration-150"
                  >
                    <title>{`${st.state} (${st.code}) — ${activeMetric.label}: ${activeMetric.formatSingleValue(shading.rawVal)}`}</title>
                  </path>
                );
              })}
            </g>

            {/* LAYER 2: Strong Selection Halo for the Selected State (Rendered on top without overwriting fill) */}
            {selectedStateBoundary && selectedStateCode !== 'all' && (
              <g id="selected-state-halo-layer" pointerEvents="none">
                {/* Outer luminous glow halo */}
                <path
                  d={selectedStateBoundary.d}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="4"
                  filter="url(#selection-halo)"
                />
                {/* Crisp inner contrast boundary ring */}
                <path
                  d={selectedStateBoundary.d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* LAYER 3: Adaptive Contrast Interior State Labels */}
            <g id="interior-state-labels-layer">
              {Object.values(ALL_50_STATES_SUMMARIES).map((st) => {
                const isEastCallout = EAST_COAST_CALLOUT_STATES.some((c) => c.code === st.code);
                if (isEastCallout) return null;

                const boundary = US_STATES_SVG_PATHS[st.code];
                if (!boundary) return null;

                const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                const isSelected = selectedStateCode === st.code;
                const isHovered = hoveredStateCode === st.code;
                const shading = getStateShading(st);

                // High-contrast label color adaptation:
                // Dark filled states get white badges with dark text; light filled states get white pills with dark text
                const badgeFill = isSelected
                  ? '#2563EB'
                  : isHovered
                  ? '#0F172A'
                  : shading.isDark
                  ? '#FFFFFF'
                  : '#FFFFFF';

                const textFill = isSelected
                  ? '#FFFFFF'
                  : isHovered
                  ? '#FFFFFF'
                  : '#0F172A';

                return (
                  <g
                    key={`state-label-${st.code}`}
                    transform={`translate(${boundary.labelX}, ${boundary.labelY})`}
                    onClick={() => onSelectState(st.code)}
                    onMouseEnter={() => setHoveredStateCode(st.code)}
                    onMouseLeave={() => setHoveredStateCode(null)}
                    className="cursor-pointer"
                    opacity={!isInRegion ? 0.35 : 1}
                  >
                    <rect
                      x="-13"
                      y="-9"
                      width="26"
                      height="18"
                      rx="5"
                      fill={badgeFill}
                      fillOpacity={0.94}
                      stroke={isSelected ? '#FFFFFF' : '#CBD5E1'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={textFill}
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

            {/* LAYER 4: Compact Non-Crowded East Coast Inset Column */}
            <g id="east-coast-callouts-layer">
              {EAST_COAST_CALLOUT_STATES.map((item) => {
                const st = ALL_50_STATES_SUMMARIES[item.code];
                const boundary = US_STATES_SVG_PATHS[item.code];
                if (!st || !boundary) return null;

                const isInRegion = regionFilter === 'All' || st.region === regionFilter;
                const isSelected = selectedStateCode === st.code;
                const isHovered = hoveredStateCode === st.code;
                const shading = getStateShading(st);
                const singleValText = activeMetric.formatSingleValue(shading.rawVal);

                return (
                  <g
                    key={`callout-${st.code}`}
                    onClick={() => onSelectState(st.code)}
                    onMouseEnter={() => setHoveredStateCode(st.code)}
                    onMouseLeave={() => setHoveredStateCode(null)}
                    className="cursor-pointer"
                    opacity={!isInRegion ? 0.35 : 1}
                  >
                    {/* Leader Line to State Centroid */}
                    <line
                      x1={boundary.labelX}
                      y1={boundary.labelY}
                      x2={item.calloutX}
                      y2={item.calloutY}
                      stroke={isSelected ? '#2563EB' : isHovered ? '#1E3A8A' : '#94A3B8'}
                      strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.9}
                      strokeDasharray={isSelected ? undefined : '2 2'}
                    />
                    <circle
                      cx={boundary.labelX}
                      cy={boundary.labelY}
                      r={isSelected ? 3.5 : 2}
                      fill={isSelected ? '#2563EB' : '#475569'}
                    />

                    {/* Compact Inset Tag: Code + Single Exact Metric Value */}
                    <rect
                      x={item.calloutX}
                      y={item.calloutY - 9}
                      width="72"
                      height="18"
                      rx="4"
                      fill={isSelected ? '#2563EB' : isHovered ? '#0F172A' : '#FFFFFF'}
                      stroke={isSelected ? '#1D4ED8' : '#CBD5E1'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      x={item.calloutX + 36}
                      y={item.calloutY + 3.5}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? '#FFFFFF' : '#0F172A'}
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {st.code} · {singleValText.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* =====================================================================
            DYNAMIC LEGEND & METRIC EXPLANATION
           ===================================================================== */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{activeMetric.label}</span>
              <span className="text-slate-400 font-normal">· {activeMetric.description}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Period: {activeMetric.reportingPeriod}
            </div>
          </div>

          {/* 5-Bucket Swatches + Distinct Missing Data Swatch */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {activeMetric.buckets.map((b, idx) => (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 shadow-2xs inline-block"
                  style={{ backgroundColor: isDarkMode ? b.fillDark : b.fillLight }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{b.label}</span>
              </div>
            ))}

            {/* Distinct Missing Data Swatch */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-300 dark:border-slate-700">
              <span
                className="w-3.5 h-3.5 rounded border border-slate-400 shadow-2xs inline-block bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:4px_4px]"
                title="States with missing or unreported data"
              />
              <span className="text-slate-500 font-medium italic">No Data (Distinct from 0.0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT / BOTTOM: SELECTED STATE DETAIL PANEL (Below on phone, beside on desktop)
         ========================================================================= */}
      <div className="lg:col-span-4 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {activeInspectionState ? (
          (() => {
            const st = activeInspectionState;
            const shading = getStateShading(st);
            const countyCount = territoryEngine.getCountiesForState(st.code).length;
            const singleVal = activeMetric.formatSingleValue(shading.rawVal);

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {st.region} Region · FIPS {st.fips}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {st.state} ({st.code})
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {countyCount} Counties
                  </span>
                </div>

                {/* Primary Metric Spotlight Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1">
                  <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                    {activeMetric.label}
                  </div>
                  <div className="text-2xl font-black text-blue-950 dark:text-blue-100">
                    {singleVal}
                  </div>
                  <div className="text-[11px] text-blue-800 dark:text-blue-300">
                    Range Bucket: <strong className="font-semibold">{shading.bucketLabel}</strong>
                  </div>
                </div>

                {/* Exact Data Lineage & Provenance Details */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Reporting Period</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{activeMetric.reportingPeriod}</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Authoritative Source Link</div>
                    <a
                      href={activeMetric.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span className="truncate">{activeMetric.sourceName}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Secondary Key Vital Statistics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Medicare Denial</div>
                    <div className="font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                      {st.avgMedicareDenialRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">FEMA AFG Awards</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      ${(st.totalAfgAwardsYtd / 1000000).toFixed(1)}M
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Utstein Survival</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {st.avgUtsteinSurvival.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Avg Transport</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {st.avgTransportMinutes.toFixed(1)} min
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectState(st.code);
                    if (onInspectCounties) onInspectCounties(st.code);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Inspect All {countyCount} Counties in {st.code}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Select a State on the Map
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tap any state boundary or East Coast badge to inspect exact metric values, federal data sources, and county rosters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
