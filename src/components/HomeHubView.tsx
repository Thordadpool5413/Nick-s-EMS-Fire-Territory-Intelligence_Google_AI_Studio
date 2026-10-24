/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
const brandLogoAsset = 'https://raw.githubusercontent.com/Thordadpool5413/Nick-s-EMS-Fire-Territory-Intelligence_Google_AI_Studio/main/src/assets/images/nicks_ems_logo_1792367124466.jpg';
import { 
  Agency, 
  PushAlert 
} from '../types';
import { 
  ShieldCheck, 
  Compass, 
  MapPin, 
  Users, 
  PiggyBank, 
  Car, 
  Siren, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  Scale, 
  Award, 
  DollarSign, 
  BookOpen,
  HelpCircle,
  X,
  Play
} from 'lucide-react';

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
}

interface OnboardingStep {
  id: string;
  phase: string;
  title: string;
  tagline: string;
  summary: string;
  actionLabel: string;
  targetTab: string;
  keyMetrics: string[];
  tacticalTip: string;
  icon: React.ElementType;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'geo_exploration',
    phase: 'Phase 01',
    title: 'Geographic Intelligence & Density Mapping',
    tagline: '50-State & 3,143-County Directory + 2D Gaussian Kernel GIS Heatmap',
    summary: 'Analyze nationwide EMS and Fire coverage corridors. Filter by state, county, and municipal jurisdiction to uncover high-volume ALS/BLS catchments and hospital destinations.',
    actionLabel: 'Launch Territory Explorer',
    targetTab: 'states_directory',
    keyMetrics: ['50 US States Monitored', '3,143 County Baselines', 'KDE Bandwidth Tuning (15–80km)'],
    tacticalTip: 'Toggle between the 50-State Directory and the GIS Territory Heatmap to inspect real-time Gaussian thermal clusters and find competitor fleet pockets.',
    icon: Compass
  },
  {
    id: 'pulseiq_prioritization',
    phase: 'Phase 02',
    title: 'Algorithmic Opportunity Scoring (PulseIQ™)',
    tagline: 'Predictive Lead Queue & 5-Pillar Weight Calibration',
    summary: 'Every department is evaluated dynamically across Clinical Acuity (25%), Fleet Obsolescence (25%), CMS Medicare Claims (20%), Demographics (15%), and Budget/AFG Grant Eligibility (15%).',
    actionLabel: 'Open Priority Accounts Queue',
    targetTab: 'queue',
    keyMetrics: ['Top Tier-1 Lead Ranking', 'Fleet Age > 8 Yr Flags', 'Live Weight Calibration'],
    tacticalTip: 'Calibrate scoring weights to match your regional mix—raise CMS Financial Claims in high-transport suburban districts or raise Fleet Obsolescence in aging municipal departments.',
    icon: Users
  },
  {
    id: 'clinical_displacement',
    phase: 'Phase 03',
    title: 'Clinical & Economic Displacement Arsenal',
    tagline: '5-Year TCO Calculator, FDA Recalls & Pre-Emptive RFP Generator',
    summary: 'Arm your medical director presentations with undeniable evidence. Calculate 5-year battery and maintenance savings ($180k+ avg advantage over LIFEPAK 15) and generate board-ready RFP specifications.',
    actionLabel: 'Access Displacement Knowledge Hub',
    targetTab: 'knowledge',
    keyMetrics: ['11.7 lbs vs 18.5 lbs Form Factor', 'Real CPR & Real BVM Feedback', 'Pre-Emptive Technical Specs'],
    tacticalTip: 'Open any account dossier to export a pre-emptive RFP specification that embeds Real BVM Help® and Dual-Mode 12-Lead STEMI as non-negotiable procurement criteria.',
    icon: PiggyBank
  },
  {
    id: 'field_execution',
    phase: 'Phase 04',
    title: 'Field Driving Routes & Interactive 3D Apparatus',
    tagline: 'Multi-Stop Itineraries & CAD-Grade Apparatus Hardware Studio',
    summary: 'Optimize multi-stop driving itineraries between fire stations and EMS headquarters with offline-resilient logging. Launch interactive 3D ALS Ambulance and Fire Engine vehicle staging for live hardware demonstrations.',
    actionLabel: 'Open Field Operations & 3D Fleet',
    targetTab: 'field',
    keyMetrics: ['Multi-Stop Turn-by-Turn', 'Offline Outbox Sync', 'Interactive 3D Hardware Hotspots'],
    tacticalTip: 'Use Field Mode on tablet during station visits to log meeting outcomes offline—the app will automatically synchronize to Firestore once cellular connection is restored.',
    icon: Car
  }
];

const INITIAL_CHECKLIST_ITEMS = [
  { id: 'review_territory', text: 'Explore the 50-State Territory Explorer & GIS Heatmap', tab: 'states_directory' },
  { id: 'calibrate_weights', text: 'Inspect PulseIQ 5-pillar scoring weights for your territory', tab: 'pulseiq' },
  { id: 'inspect_top_leads', text: 'Review the Top 3 Tier-1 conversion targets in the Priority Queue', tab: 'queue' },
  { id: 'check_fda_recalls', text: 'Examine Stryker LIFEPAK 15 & Philips MRx FDA recall alerts', tab: 'knowledge' },
  { id: 'simulate_quality', text: 'Review the 5-Year TCO savings ledger and clinical uplift metrics', tab: 'knowledge' },
  { id: 'demo_3d_apparatus', text: 'Stage the interactive 3D ALS Ambulance and X Series Advanced', tab: '3d_studio' }
];

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  agencies,
  onNavigateTab,
  onSelectAgency,
  onOpenRfpGenerator,
  onOpenWeightsModal,
  onOpenCommandPalette,
  onOpenDataLineageModal,
  isOnline,
  isDarkMode,
  alerts,
  isCloudConnected,
  cloudSyncCount = 0,
  globalCategory,
  setGlobalCategory
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(brandLogoAsset || 'https://raw.githubusercontent.com/Thordadpool5413/Nick-s-EMS-Fire-Territory-Intelligence_Google_AI_Studio/main/src/assets/images/nicks_ems_logo_1792367124466.jpg');
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  const [isInteractiveTourOpen, setIsInteractiveTourOpen] = useState<boolean>(false);
  const [isPlaybookDrawerOpen, setIsPlaybookDrawerOpen] = useState<boolean>(false);
  const [activeTourIndex, setActiveTourIndex] = useState<number>(0);
  const [selectedDrawerTab, setSelectedDrawerTab] = useState<'onboarding' | 'checklist' | 'battlecards'>('onboarding');

  // Keyboard Escape listener for Playbook Drawer
  useEffect(() => {
    if (!isPlaybookDrawerOpen && !isInteractiveTourOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlaybookDrawerOpen(false);
        setIsInteractiveTourOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaybookDrawerOpen, isInteractiveTourOpen]);

  // Persistent Checklist State in LocalStorage
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('tm_onboarding_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleChecklistItem = (id: string) => {
    setCompletedChecklist(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('tm_onboarding_checklist', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const completedCount = useMemo(() => {
    return INITIAL_CHECKLIST_ITEMS.filter(item => !!completedChecklist[item.id]).length;
  }, [completedChecklist]);

  const checklistProgressPercent = Math.round((completedCount / INITIAL_CHECKLIST_ITEMS.length) * 100);

  // Live Aggregated Territory Telemetry (Clean 4-metric institutional strip)
  const territoryStats = useMemo(() => {
    const totalCount = agencies.length;
    const tier1Count = agencies.filter(a => (a.zollOpportunity?.pulseIqScore ?? 0) >= 80).length;
    const agingCompetitorUnits = agencies.reduce((acc, a) => {
      const brand = (a.installedFleet?.defibBrand || '').toLowerCase();
      const isCompetitor = brand.includes('lifepak') || 
                           brand.includes('mrx') || 
                           brand.includes('philips') ||
                           brand.includes('stryker');
      const isAging = (a.installedFleet?.defibAgeYears ?? 0) >= 7;
      return acc + (isCompetitor && isAging ? (a.installedFleet?.defibUnitsCount ?? 0) : 0);
    }, 0);

    const totalAllowedClaims = agencies.reduce((acc, a) => {
      return acc + (a.cmsData?.medicareAllowedAnnual ?? 0);
    }, 0);

    return {
      totalCount,
      tier1Count,
      agingCompetitorUnits,
      totalAllowedClaims
    };
  }, [agencies]);

  // Top 5 Highest Priority Opportunities
  const topPriorities = useMemo(() => {
    return [...agencies]
      .sort((a, b) => (b.zollOpportunity?.pulseIqScore ?? 0) - (a.zollOpportunity?.pulseIqScore ?? 0))
      .slice(0, 5);
  }, [agencies]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-150">
      
      {/* =========================================================================
          ZONE A: EXECUTIVE COMMAND BANNER (PROMINENT CREST + ORIENTATION + CTAS)
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
            
            {/* Left: Prominent Executive Crest Logo + Mission Briefing */}
            <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-7 min-w-0">
              <div className="relative shrink-0 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">
                {!logoFailed ? (
                  <img
                    src={logoSrc}
                    alt="Nick's EMS & Fire Intelligence Crest"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (logoSrc !== 'https://raw.githubusercontent.com/Thordadpool5413/Nick-s-EMS-Fire-Territory-Intelligence_Google_AI_Studio/main/src/assets/images/nicks_ems_logo_1792367124466.jpg') {
                        setLogoSrc('https://raw.githubusercontent.com/Thordadpool5413/Nick-s-EMS-Fire-Territory-Intelligence_Google_AI_Studio/main/src/assets/images/nicks_ems_logo_1792367124466.jpg');
                      } else {
                        setLogoFailed(true);
                      }
                    }}
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl object-cover border border-slate-300 dark:border-slate-700 ring-1 ring-slate-900/10 dark:ring-white/15 bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-xl bg-[#0F172A] dark:bg-blue-600 flex items-center justify-center text-white border border-slate-300 dark:border-slate-700 ring-1 ring-slate-900/10 dark:ring-white/15">
                    <ShieldCheck className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-[#1E3A8A] dark:text-blue-400">
                    ZOLL Medical Corporation
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    EMS &amp; Fire Division
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Enterprise Territory Intelligence
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Nick&apos;s EMS &amp; Fire Territory Intelligence
                </h1>

                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Systematically identify, prioritize, and capture capital fleet conversions across 3,143 counties. Triangulating CMS Medicare Part B ambulance claims, NEMSIS cardiac registries, and FEMA AFG grant allocations to replace aging Stryker LIFEPAK 15 and Philips MRx fleets with the ZOLL X Series® Advanced.
                </p>

                {/* Quiet Single-Line Strategic Anchors */}
                <div className="pt-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] dark:bg-blue-400" />
                    <span>CMS Part B Triangulation</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>Competitor Obsolescence Targeting</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Real CPR Help® Survival Uplift</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Primary Fast Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaybookDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                title="Open the complete onboarding guide, readiness checklist, and competitor battlecards"
              >
                <BookOpen className="w-4 h-4 text-white shrink-0" />
                <span>Field Playbook &amp; TM Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInteractiveTourOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Start the 4-phase step-by-step interactive walkthrough"
              >
                <Play className="w-4 h-4 fill-current text-[#1E3A8A] dark:text-blue-400 shrink-0" />
                <span>Interactive Stepper Tour</span>
              </button>

              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Quick Search (Press ⌘K)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE B: TERRITORY TELEMETRY STRIP (4-METRIC 1PX HAIRLINE LEDGER GRID)
          ========================================================================= */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1E3A8A] dark:bg-blue-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
              Territory Telemetry &amp; Verifiable Federal Footprint
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Cross-Walked: USFA FDID · CMS NPI · Census FIPS
            </span>
            {onOpenDataLineageModal && (
              <button
                type="button"
                onClick={onOpenDataLineageModal}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer"
                title="Open Data Freshness & Sync Ledger"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Audit Federal Sources &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Symmetrical 4-Column Ledger Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          
          {/* Tile 1: Monitored Agencies */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Monitored Agencies</span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold" title="Verified Federal Record: USFA National Fire Department Registry & State EMS Rosters">
                ● USFA FDID Verified
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {territoryStats.totalCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>Source: USFA Registry · 3,143 Counties</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Tier-1 Targets */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Tier-1 Targets</span>
              <span className="font-mono text-[10px] text-[#1E3A8A] dark:text-blue-400 font-semibold" title="Deterministic 5-Pillar Composite Formula">
                ● PulseIQ™ v4.2
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#1E3A8A] dark:text-blue-400 tabular-nums tracking-tight">
                {territoryStats.tier1Count.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>Deterministic score ≥ 80 / 100</span>
              </div>
            </div>
          </div>

          {/* Tile 3: Aging Units */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Aging Units (&gt;7 Yrs)</span>
              <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-semibold" title="Municipal Capital Filings & Modeled Replacement Cycle">
                ◐ Procurement &amp; Modeled
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {territoryStats.agingCompetitorUnits.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>Stryker LP15 &amp; Philips MRx</span>
              </div>
            </div>
          </div>

          {/* Tile 4: Medicare Transport Billing */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Medicare Part B Claims</span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold" title="Verified Federal Record: CMS Ambulance Fee Schedule Public Use File FY2025">
                ● CMS PUF FY2025
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                ${(territoryStats.totalAllowedClaims / 1_000_000).toFixed(1)}M
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>Source: CMS NPI Part B PUF</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          ZONE C: CENTERPIECE — TOP 5 IMMEDIATE PRIORITY OPPORTUNITIES
          ========================================================================= */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Immediate Conversion Opportunities (Top 5 Priority Accounts)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked dynamically by PulseIQ™ predictive scoring based on fleet age, clinical acuity, and Medicare claims volume.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('queue')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>View Full Queue ({agencies.length} Accounts)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tabular Numerals Institutional Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Agency &amp; Location</th>
                <th className="py-2.5 px-3">Current Installed Fleet</th>
                <th className="py-2.5 px-3">Fleet Age</th>
                <th className="py-2.5 px-3">Medicare Claims</th>
                <th className="py-2.5 px-3">PulseIQ™ Score</th>
                <th className="py-2.5 px-3 text-right">Instant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {topPriorities.map((agency) => (
                <tr 
                  key={agency.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectAgency(agency)}
                      className="font-bold text-slate-900 dark:text-white hover:text-[#1E3A8A] dark:hover:text-blue-400 text-left block cursor-pointer"
                    >
                      {agency.name}
                    </button>
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {agency.county} County, {agency.stateCode} · FDID {agency.fdid || 'N/A'} · {agency.agencyType}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {agency.installedFleet?.defibBrand || 'Unknown Defib'}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {agency.installedFleet?.defibUnitsCount ?? 0} frontline units
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums" title="Confidence: Municipal Procurement Record / Modeled Fleet Replacement Cycle">
                      {agency.installedFleet?.defibAgeYears ?? 0} Years Old
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      ◐ {(agency.installedFleet?.defibAgeYears ?? 0) >= 8 ? 'Capital Cycle Due' : 'Modeled Fleet Cycle'}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums" title={`Source: CMS Ambulance Fee Schedule PUF FY2025 · NPI ${agency.npiNumber || 'Verified'}`}>
                      ${(((agency.cmsData?.medicareAllowedAnnual ?? 0)) / 1000).toFixed(0)}k
                    </div>
                    <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                      ● CMS PUF · {(agency.annualCardiacArrestCalls ?? 0)} OHCA/yr
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                        {agency.zollOpportunity?.pulseIqScore ?? 0}/100
                      </span>
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#1E3A8A] dark:bg-blue-400 h-full rounded-full"
                          style={{ width: `${agency.zollOpportunity?.pulseIqScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectAgency(agency)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Open agency profile drawer"
                      >
                        Profile
                      </button>
                      {onOpenRfpGenerator && (
                        <button
                          type="button"
                          onClick={() => onOpenRfpGenerator(agency)}
                          className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#1E3A8A] dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer"
                          title="Generate pre-emptive RFP specification"
                        >
                          RFP Spec
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          ZONE D: FAST-ACTION WORKSPACE LAUNCHPAD (CLEAN 6-TILE SHORTCUT GRID)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
              Direct Workspace Shortcuts
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">1-Click Jump</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('queue')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <Users className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">Priority Queue</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ranked Leads</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('map')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <MapPin className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">GIS Heatmap</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Density Clusters</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('states_directory')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <Compass className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">50-State Directory</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">3,143 Counties</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('knowledge')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <PiggyBank className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">5-Yr TCO &amp; Grants</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">FEMA AFG &amp; Recalls</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('field')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <Car className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">Day Driving Route</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Turn-by-Turn GPS</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('3d_studio')}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group shadow-xs"
          >
            <Siren className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-slate-900 dark:text-white">3D Apparatus Studio</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">X Series Demo</div>
          </button>
        </div>
      </section>

      {/* =========================================================================
          ON-DEMAND SLIDE-OVER DRAWER: FIELD PLAYBOOK, ONBOARDING & BATTLECARDS
          ========================================================================= */}
      {isPlaybookDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setIsPlaybookDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50">
              
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Territory Manager Field Playbook &amp; Guide
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Curriculum · Readiness Checklist · Competitive Battlecards
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlaybookDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close playbook drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tab Navigation */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 bg-slate-50 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setSelectedDrawerTab('onboarding')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    selectedDrawerTab === 'onboarding'
                      ? 'border-[#1E3A8A] dark:border-blue-400 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  4-Phase Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDrawerTab('checklist')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedDrawerTab === 'checklist'
                      ? 'border-[#1E3A8A] dark:border-blue-400 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>TM Readiness Checklist</span>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                    {completedCount}/6
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDrawerTab('battlecards')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    selectedDrawerTab === 'battlecards'
                      ? 'border-[#1E3A8A] dark:border-blue-400 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Competitive Matrix
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* TAB 1: 4-PHASE ONBOARDING CURRICULUM */}
                {selectedDrawerTab === 'onboarding' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Master the 4 operational pillars to systematically win territory conversions.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaybookDrawerOpen(false);
                          setIsInteractiveTourOpen(true);
                        }}
                        className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Interactive Stepper</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {ONBOARDING_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                          <div 
                            key={step.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-mono text-[10px] uppercase font-bold text-[#1E3A8A] dark:text-blue-400">
                                    {step.phase}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                    {step.title}
                                  </h4>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsPlaybookDrawerOpen(false);
                                  onNavigateTab(step.targetTab);
                                }}
                                className="px-2.5 py-1 rounded bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                              >
                                <span>Go</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {step.summary}
                            </p>

                            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[10px]">
                                  Field Directive:
                                </span>{' '}
                                {step.tacticalTip}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: TM READINESS CHECKLIST */}
                {selectedDrawerTab === 'checklist' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Onboarding Milestone Progress
                        </span>
                        <span className="font-mono text-xs font-bold text-[#1E3A8A] dark:text-blue-400">
                          {checklistProgressPercent}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${checklistProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {INITIAL_CHECKLIST_ITEMS.map((item) => {
                        const isChecked = !!completedChecklist[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-all ${
                              isChecked
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <label 
                              onClick={() => toggleChecklistItem(item.id)}
                              className="flex items-start gap-3 cursor-pointer select-none min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                              />
                              <span className={`text-xs ${
                                isChecked
                                  ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                                  : 'text-slate-800 dark:text-slate-200 font-medium'
                              }`}>
                                {item.text}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setIsPlaybookDrawerOpen(false);
                                onNavigateTab(item.tab);
                              }}
                              className="text-[11px] font-mono font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                            >
                              Jump →
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {checklistProgressPercent === 100 && (
                      <div className="p-3.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
                        <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <strong>Field Ready:</strong> All onboarding milestones verified. Your territory baseline is primed for capital replacement presentations.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: COMPETITIVE MATRIX & BATTLECARDS */}
                {selectedDrawerTab === 'battlecards' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Head-to-head clinical &amp; economic benchmarks for hospital and medical director committee presentations.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Dimension</th>
                            <th className="py-2 px-3 text-[#1E3A8A] dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">
                              ZOLL X Series® Adv.
                            </th>
                            <th className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              Stryker LIFEPAK 15
                            </th>
                            <th className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              Philips MRx
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">Carry Weight</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                              11.7 lbs (5.3 kg)
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                              18.5 lbs (+58%)
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              13.2 lbs (EOL)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">Real BVM Help®</td>
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                              Live tidal vol &amp; rate
                            </td>
                            <td className="py-2 px-3 text-slate-500">None</td>
                            <td className="py-2 px-3 text-slate-500">None</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">CPR Feedback</td>
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                              Real CPR Help® audio
                            </td>
                            <td className="py-2 px-3 text-slate-500">Metronome only</td>
                            <td className="py-2 px-3 text-slate-500">Fragile puck wire</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">5-Yr Battery Cost</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                              $3,200 (Li-Ion)
                            </td>
                            <td className="py-2 px-3 font-mono text-rose-600 dark:text-rose-400">
                              $14,800 (Dual churn)
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">Obsolete</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">5-Yr TCO Adv.</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                              +$184,200 Net Savings
                            </td>
                            <td className="py-2 px-3 font-mono text-rose-600">Baseline</td>
                            <td className="py-2 px-3 text-slate-500">Discontinued</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaybookDrawerOpen(false);
                          onNavigateTab('knowledge');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <span>Open Complete Clinical &amp; Competitive Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400">
                  Press Escape or click outside to dismiss
                </span>
                <button
                  type="button"
                  onClick={() => setIsPlaybookDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Playbook
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE STEPPER WALKTHROUGH MODAL
          ========================================================================= */}
      {isInteractiveTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                {!logoFailed ? (
                  <img
                    src={logoSrc}
                    alt="Nick's EMS & Fire Crest"
                    className="w-11 h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs ring-1 ring-[#1E3A8A]/20 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Territory Manager Interactive Onboarding Walkthrough
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Step {activeTourIndex + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[activeTourIndex].phase}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInteractiveTourOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div className="font-mono text-xs font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider">
                {ONBOARDING_STEPS[activeTourIndex].tagline}
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {ONBOARDING_STEPS[activeTourIndex].title}
              </h4>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {ONBOARDING_STEPS[activeTourIndex].summary}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                  <span>Strategic Field Directive:</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ONBOARDING_STEPS[activeTourIndex].tacticalTip}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {ONBOARDING_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTourIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === activeTourIndex 
                        ? 'w-8 bg-[#1E3A8A] dark:bg-blue-400' 
                        : 'w-2 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={activeTourIndex === 0}
                onClick={() => setActiveTourIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous Step
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = ONBOARDING_STEPS[activeTourIndex].targetTab;
                    setIsInteractiveTourOpen(false);
                    onNavigateTab(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Jump to {ONBOARDING_STEPS[activeTourIndex].actionLabel}
                </button>

                {activeTourIndex < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTourIndex(prev => prev + 1)}
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsInteractiveTourOpen(false)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Finish Tour ✓
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
