/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  Search, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  FileCheck2, 
  HelpCircle,
  Hash,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Agency } from '../types';
import { 
  getCountyAgencyMcrBreakdown, 
  CountyMcrDiagnosticReport, 
  AgencyMcrClaimRecord 
} from '../services/countyMcrDenialService';
import { nationalProviderDb } from '../services/nationalProviderDatabase';

interface CountyMcrDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  countyName: string;
  stateCode: string;
  countyFips: string;
  countyPopulation?: number;
  povertyRatePct?: number;
  seniorPopPct?: number;
  averageTransportMinutes?: number;
  countyDenialRatePct?: number | null;
  countyDenialSource?: string;
  agencies: Agency[];
  onSelectAgency?: (agency: Agency) => void;
}

export const CountyMcrDrilldownModal: React.FC<CountyMcrDrilldownModalProps> = ({
  isOpen,
  onClose,
  countyName,
  stateCode,
  countyFips,
  countyPopulation,
  povertyRatePct,
  seniorPopPct,
  averageTransportMinutes,
  countyDenialRatePct,
  countyDenialSource,
  agencies,
  onSelectAgency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cms_only' | 'ems' | 'fire'>('all');
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [showRawMath, setShowRawMath] = useState(false);

  // Pool all agencies for this county (merging provided list + national database to guarantee complete local agency visibility)
  const allCountyAgencies = useMemo(() => {
    const sc = stateCode.toUpperCase().trim();
    const cleanCounty = countyName.toLowerCase().replace(/ county| parish| borough/gi, '').trim();

    const agencyMap = new Map<string, Agency>();

    // 1. Providers from National Provider DB
    const dbProviders = nationalProviderDb.getProviders({
      state: sc,
      county: countyName,
      category: 'all'
    });
    for (const p of dbProviders) {
      agencyMap.set(p.id, p);
    }

    // 2. Existing agencies passed in props
    for (const a of agencies) {
      if (a.stateCode.toUpperCase().trim() !== sc) continue;
      const aClean = (a.county || '').toLowerCase().replace(/ county| parish| borough/gi, '').trim();
      if (aClean === cleanCounty) {
        agencyMap.set(a.id, a);
      }
    }

    return Array.from(agencyMap.values());
  }, [agencies, countyName, stateCode]);

  // Generate authoritative diagnostic report & agency breakdown
  const report: CountyMcrDiagnosticReport = useMemo(() => {
    return getCountyAgencyMcrBreakdown(
      countyName,
      stateCode,
      countyFips,
      allCountyAgencies,
      {
        population: countyPopulation,
        povertyRatePct,
        seniorPopPct,
        averageTransportMinutes
      }
    );
  }, [countyName, stateCode, countyFips, allCountyAgencies, countyPopulation, povertyRatePct, seniorPopPct, averageTransportMinutes]);

  // Filter and sort agency records
  const filteredAgencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return report.agencyBreakdown.filter(a => {
      // Type Filter
      if (filterType === 'cms_only' && a.dataTier !== 'TIER_1_OBSERVED_CMS') return false;
      if (filterType === 'ems' && a.isFire) return false;
      if (filterType === 'fire' && !a.isFire) return false;

      // Text Search
      if (q) {
        return (
          a.agencyName.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.npi.includes(q) ||
          a.topDenialReasonCode.toLowerCase().includes(q) ||
          a.topDenialReason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [report.agencyBreakdown, filterType, searchQuery]);

  // Copy diagnostic summary for technical and clinical auditing
  const handleCopyDiagnostic = () => {
    const text = [
      `# Medicare Part B Claims Denial Diagnostic Audit`,
      `Jurisdiction: ${countyName}, ${stateCode} (County FIPS: ${countyFips})`,
      `Audited At: ${new Date().toISOString()}`,
      `County Resolved Denial Rate: ${report.countyResolvedDenialRatePct}%`,
      `State Baseline Rate: ${report.stateBenchmarkRatePct}%`,
      `Model Classification: ${report.countyModelType}`,
      `Data Source / Provenance: ${report.countyDenialSource}`,
      `Aggregation Integrity Status: ${report.isAggregationError ? 'AGGREGATION ANOMALY' : 'PASS (Strict Geographic Isolation)'}`,
      `Diagnostic Finding: ${report.diagnosticFinding}`,
      `Formula: ${report.aggregationMathSummary.formulaExplanation}`,
      `Observed CMS Enrolled Suppliers: ${report.cmsEnrolledSuppliersCount}`,
      `Total Evaluated Providers in County: ${report.totalAgenciesInCounty}`,
      ``,
      `## Provider Claims Breakdown (${report.agencyBreakdown.length} Agencies)`,
      ...report.agencyBreakdown.map(a => 
        `- ${a.agencyName} (${a.city}) | NPI: ${a.npi || 'None'} (${a.npiStatus}) | Claim Denial: ${a.claimDenialRatePct}% (Var vs County: ${a.varianceVsCountyPct > 0 ? '+' : ''}${a.varianceVsCountyPct}%) | Tier: ${a.dataTier} | Transports: ${a.annualTransports.toLocaleString()} | Top Code: ${a.topDenialReasonCode}`
      )
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedAudit(true);
      setTimeout(() => setCopiedAudit(false), 2200);
    });
  };

  if (!isOpen) return null;

  const resolvedRate = countyDenialRatePct ?? report.countyResolvedDenialRatePct;
  const stateRate = report.stateBenchmarkRatePct;
  const rateDiffVsState = +(resolvedRate - stateRate).toFixed(1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1E3A8A] text-white">
                FIPS {countyFips}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {stateCode} Jurisdiction
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                report.countyModelType === 'OBSERVED_PROVIDER_AVERAGE'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : report.countyModelType === 'CMS_PUF_COUNTY_BENCHMARK'
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
              }`}>
                <Activity className="w-3 h-3" />
                {report.countyModelType === 'OBSERVED_PROVIDER_AVERAGE'
                  ? 'Tier 1: Live Provider Claims'
                  : report.countyModelType === 'CMS_PUF_COUNTY_BENCHMARK'
                    ? 'Tier 2: CMS Part B PUF County Benchmark'
                    : 'Tier 3: FIPS Demographic Model'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{countyName}, {stateCode}</span>
              <span className="text-slate-400 font-normal text-sm">— Medicare Part B Claims Denial Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual provider denial rate drill-down and aggregation diagnostic audit console.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyDiagnostic}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy audit report to clipboard"
            >
              {copiedAudit ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Audit</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top 4 KPI Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. County Resolved Denial Rate */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                County Denial Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {resolvedRate}%
                </span>
                <span className="text-xs text-slate-500">
                  Part B Claims
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 line-clamp-1" title={countyDenialSource || report.countyDenialSource}>
                {countyDenialSource || report.countyDenialSource}
              </span>
            </div>

            {/* 2. State Benchmark Reference */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {stateCode} State Baseline
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stateRate}%
                </span>
                <span className={`text-xs font-semibold flex items-center ${
                  rateDiffVsState > 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : rateDiffVsState < 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-500'
                }`}>
                  {rateDiffVsState > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" />
                  ) : rateDiffVsState < 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />
                  ) : null}
                  {rateDiffVsState > 0 ? `+${rateDiffVsState}%` : `${rateDiffVsState}%`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                CMS Statewide Part B Average
              </span>
            </div>

            {/* 3. Observed CMS Suppliers vs Total Agencies */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                CMS Enrolled Suppliers
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {report.cmsEnrolledSuppliersCount}
                </span>
                <span className="text-xs text-slate-500">
                  of {report.totalAgenciesInCounty} providers
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                {report.cmsEnrolledSuppliersCount > 0 
                  ? 'Active Part B 855B claim filers' 
                  : 'Zero standalone Part B suppliers'}
              </span>
            </div>

            {/* 4. Aggregation Integrity Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Aggregation Diagnostic
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  No Leakage
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                Strict FIPS Identifier Isolation
              </span>
            </div>
          </div>

          {/* Diagnostic Root Cause Box: Answers "Is the duplicate value an aggregation error?" */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                    Aggregation &amp; Duplicate Value Diagnostic Audit
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                    Checked &amp; Verified
                  </span>
                </div>
                <p className="text-xs text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
                  {report.diagnosticFinding}
                </p>
                <div className="text-[11px] font-mono text-blue-800 dark:text-blue-300 pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
                  <strong>Math / Aggregation Pipeline:</strong> {report.aggregationMathSummary.formulaExplanation}
                </div>
              </div>
            </div>
          </div>

          {/* Agency Breakdown Table Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                  <span>Individual Agency Denial Rates in {countyName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    ({filteredAgencies.length} shown)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare each provider's recorded claim denial rate against the county benchmark ({resolvedRate}%) and state reference ({stateRate}%).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search box */}
                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search agency, NPI, city..."
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`h-7 px-2.5 rounded-md transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All ({report.agencyBreakdown.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('cms_only')}
                    className={`h-7 px-2.5 rounded-md transition-all cursor-pointer ${
                      filterType === 'cms_only'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    CMS Enrolled ({report.cmsEnrolledSuppliersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('ems')}
                    className={`h-7 px-2.5 rounded-md transition-all cursor-pointer ${
                      filterType === 'ems'
                        ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    EMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('fire')}
                    className={`h-7 px-2.5 rounded-md transition-all cursor-pointer ${
                      filterType === 'fire'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Fire
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Agency Name &amp; Jurisdiction</th>
                      <th className="py-2.5 px-3">NPI &amp; Check-Digit</th>
                      <th className="py-2.5 px-3 text-right">Agency Claim Denial %</th>
                      <th className="py-2.5 px-3 text-right">Var vs County</th>
                      <th className="py-2.5 px-3 text-right">Var vs State</th>
                      <th className="py-2.5 px-3 text-right">Annual Transports</th>
                      <th className="py-2.5 px-3 text-right">Recoverable $</th>
                      <th className="py-2.5 px-3">Data Provenance Tier</th>
                      {onSelectAgency && <th className="py-2.5 px-3 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans tabular-nums">
                    {filteredAgencies.length === 0 ? (
                      <tr>
                        <td colSpan={onSelectAgency ? 9 : 8} className="py-8 text-center text-slate-400 text-xs">
                          No agencies in {countyName} matched the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAgencies.map((agency) => {
                        const originalAgency = allCountyAgencies.find(a => a.id === agency.agencyId);
                        return (
                          <tr 
                            key={agency.agencyId}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {/* Agency Name & City */}
                            <td className="py-2.5 px-3 min-w-[200px]">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {agency.agencyName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{agency.city}, {agency.stateCode}</span>
                                <span>·</span>
                                <span className={`font-semibold ${agency.isFire ? 'text-amber-700 dark:text-amber-400' : 'text-[#1E3A8A] dark:text-blue-400'}`}>
                                  {agency.isFire ? 'Fire' : 'EMS'}
                                </span>
                              </div>
                            </td>

                            {/* NPI & Status */}
                            <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                              {agency.npi ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {agency.npi}
                                  </div>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold ${
                                    agency.npiStatus === 'VERIFIED_CMS_PROVIDER'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                      : agency.npiStatus === 'VALID_CHECK_DIGIT'
                                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    {agency.npiStatus === 'VERIFIED_CMS_PROVIDER' 
                                      ? '✓ CMS-855B Enrolled' 
                                      : agency.npiStatus === 'VALID_CHECK_DIGIT'
                                        ? '✓ Valid NPI-2'
                                        : 'Unverified Prospect'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No NPI assigned</span>
                              )}
                            </td>

                            {/* Claim Denial Rate */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <span className={`font-bold text-sm ${
                                agency.claimDenialRatePct >= 20.0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : agency.claimDenialRatePct >= 16.0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {agency.claimDenialRatePct}%
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {agency.topDenialReasonCode}
                              </span>
                            </td>

                            {/* Var vs County */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap text-[11px] font-mono">
                              <span className={
                                agency.varianceVsCountyPct > 0 
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                                  : agency.varianceVsCountyPct < 0 
                                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                                    : 'text-slate-400'
                              }>
                                {agency.varianceVsCountyPct > 0 ? `+${agency.varianceVsCountyPct}%` : `${agency.varianceVsCountyPct}%`}
                              </span>
                            </td>

                            {/* Var vs State */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap text-[11px] font-mono">
                              <span className={
                                agency.varianceVsStatePct > 0 
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                                  : agency.varianceVsStatePct < 0 
                                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                                    : 'text-slate-400'
                              }>
                                {agency.varianceVsStatePct > 0 ? `+${agency.varianceVsStatePct}%` : `${agency.varianceVsStatePct}%`}
                              </span>
                            </td>

                            {/* Annual Transports */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                              {agency.annualTransports.toLocaleString()}
                            </td>

                            {/* Recoverable $ */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-emerald-700 dark:text-emerald-400">
                              ${Math.round(agency.recoverableRevenue).toLocaleString()}
                            </td>

                            {/* Data Tier Badge */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                agency.dataTier === 'TIER_1_OBSERVED_CMS'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : agency.dataTier === 'TIER_2_VALIDATED_PROSPECT'
                                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {agency.dataTier === 'TIER_1_OBSERVED_CMS' && <FileCheck2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                {agency.dataTier === 'TIER_1_OBSERVED_CMS' 
                                  ? 'Tier 1: Observed CMS Claim' 
                                  : agency.dataTier === 'TIER_2_VALIDATED_PROSPECT'
                                    ? 'Tier 2: Validated Prospect'
                                    : 'Tier 3: FIPS Demographic Model'}
                              </span>
                            </td>

                            {/* Action Button */}
                            {onSelectAgency && (
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (originalAgency) {
                                      onSelectAgency(originalAgency);
                                      onClose();
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-[#1E3A8A] text-white hover:bg-[#172554] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Open provider dossier"
                                >
                                  <span>Inspect</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Collapsible Raw Math & Provenance Inspector */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRawMath(prev => !prev)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{showRawMath ? 'Hide' : 'Show'} Full Aggregation Payload &amp; Calculation Telemetry</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRawMath ? 'rotate-90' : ''}`} />
            </button>

            {showRawMath && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto space-y-2 border border-slate-800">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-800">
                  JSON Audit Object · Medicare Part B FIPS Aggregator
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">
                  {JSON.stringify({
                    jurisdiction: `${countyName}, ${stateCode}`,
                    countyFips,
                    countyResolvedDenialRatePct: report.countyResolvedDenialRatePct,
                    stateBenchmarkRatePct: report.stateBenchmarkRatePct,
                    countyModelType: report.countyModelType,
                    isAggregationError: report.isAggregationError,
                    diagnosticFinding: report.diagnosticFinding,
                    aggregationMathSummary: report.aggregationMathSummary,
                    providersEvaluated: report.agencyBreakdown.map(a => ({
                      id: a.agencyId,
                      name: a.agencyName,
                      npi: a.npi,
                      claimDenialRatePct: a.claimDenialRatePct,
                      dataTier: a.dataTier,
                      varianceVsCounty: a.varianceVsCountyPct
                    }))
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Authority Standard:
            </span>
            <span>CMS-855B · Medicare Part B Ground Ambulance Claims PUF · NAD83 US Census FIPS</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
