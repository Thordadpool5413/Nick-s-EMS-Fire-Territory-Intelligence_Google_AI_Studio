/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  Lock,
  Activity,
  FileCheck,
  ArrowUpRight,
  CloudUpload,
  Sparkles,
  Server,
  Layers
} from 'lucide-react';
import { Agency } from '../types';
import {
  dataSanitizationService,
  DataProvenanceTier
} from '../services/dataSanitizationService';

interface DataHealthDashboardProps {
  agencies: Agency[];
  isCloudConnected: boolean;
  isSyncing: boolean;
  cloudSyncCount: number;
  strictCloudOnlyMode: boolean;
  onToggleStrictCloudOnlyMode: (enabled: boolean) => void;
  onHydrateBatchToCloud: (maxRecords?: number) => Promise<number>;
  onRunDeepCloudPurgeAndSanitize: () => Promise<{ purgedAgencies: number; purgedNotes: number }>;
  onSyncSingleAgencyToCloud: (agency: Agency) => Promise<void>;
  onSelectAgency?: (agency: Agency) => void;
}

export const DataHealthDashboard: React.FC<DataHealthDashboardProps> = ({
  agencies,
  isCloudConnected,
  isSyncing,
  cloudSyncCount,
  strictCloudOnlyMode,
  onToggleStrictCloudOnlyMode,
  onHydrateBatchToCloud,
  onRunDeepCloudPurgeAndSanitize,
  onSyncSingleAgencyToCloud,
  onSelectAgency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | DataProvenanceTier>('all');
  const [syncingRowId, setSyncingRowId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Generate live Data Health report from the sanitization service
  const report = useMemo(() => {
    void refreshTick;
    return dataSanitizationService.getDataHealthReport(
      agencies,
      isCloudConnected,
      'ai-studio-nicksemsfireterr-26354b36-e812-4fee-8cf9-2df9f9c26acf'
    );
  }, [agencies, isCloudConnected, cloudSyncCount, strictCloudOnlyMode, refreshTick]);

  // Filter agencies for the Provenance Inspector table
  const filteredAgencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agencies.filter((agency) => {
      const tier = dataSanitizationService.classifyProvenanceTier(agency);
      if (sourceFilter !== 'all' && tier !== sourceFilter) {
        return false;
      }
      if (!q) return true;
      return (
        agency.name.toLowerCase().includes(q) ||
        agency.city.toLowerCase().includes(q) ||
        agency.county.toLowerCase().includes(q) ||
        agency.stateCode.toLowerCase().includes(q) ||
        (agency.fdid || '').toLowerCase().includes(q) ||
        (agency.npiNumber || '').toLowerCase().includes(q)
      );
    });
  }, [agencies, searchQuery, sourceFilter, cloudSyncCount]);

  const handleSyncSingleRow = async (agency: Agency) => {
    setSyncingRowId(agency.id);
    try {
      await onSyncSingleAgencyToCloud(agency);
      setRefreshTick((t) => t + 1);
    } finally {
      setSyncingRowId(null);
    }
  };

  const handleHydrateBatch = async () => {
    await onHydrateBatchToCloud(35);
    setRefreshTick((t) => t + 1);
  };

  const handleDeepSanitize = async () => {
    await onRunDeepCloudPurgeAndSanitize();
    setRefreshTick((t) => t + 1);
  };

  const getTierLabel = (tier: DataProvenanceTier) => {
    switch (tier) {
      case 'firestore_cloud_synced':
        return 'Firestore Cloud Synced';
      case 'live_federal_registry':
        return 'Live Federal NPI Registry';
      case 'public_federal_baseline':
        return 'Public USFA / Census Baseline';
    }
  };

  return (
    <div className="workspace-view-container min-w-0 w-full">
      {/* 1. EXECUTIVE DATA HEALTH & PROVENANCE HEADER */}
      <section className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Data Sanitization Firewall Active
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px]">
                DB: {report.cloudDatabaseId}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isCloudConnected ? 'Live Cloud Connected' : 'Local Verified Cache'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              Data Health, Cloud Synchronization &amp; Source Transparency
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Real-time verification of every agency record, field note, and mathematical PulseIQ™ score. All mock, sample, and synthetic test data are automatically stripped at the service layer before reaching the interface.
            </p>
          </div>

          {/* Primary Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDeepSanitize}
              disabled={isSyncing}
              className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-pulse' : ''}`} />
              <span>Verify &amp; Purge Cloud Mock Data</span>
            </button>

            <button
              type="button"
              onClick={handleHydrateBatch}
              disabled={isSyncing}
              className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F172A] dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white transition-colors flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Synchronizing with Firestore...' : 'Hydrate Batch to Firestore'}</span>
            </button>
          </div>
        </div>

        {/* Strict Cloud-Only Mode Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Data Display Enforcement Mode:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-400">
                {strictCloudOnlyMode
                  ? 'Strict Firestore Cloud-Only (Exclusively displaying records persisted in Google Cloud Firestore)'
                  : 'Verified Cloud + Public Federal Registry (Displaying Firestore records alongside verified USFA/Census municipal baselines)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onToggleStrictCloudOnlyMode(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                !strictCloudOnlyMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Verified Real Data ({agencies.length})
            </button>
            <button
              type="button"
              onClick={() => onToggleStrictCloudOnlyMode(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                strictCloudOnlyMode
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Strict Firestore Cloud-Only ({report.firestoreSyncedCount})
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4-COLUMN DATA HEALTH & PROVENANCE KPI GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Firestore Cloud Synced */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Firestore Cloud Synced</span>
              <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-[#0F172A] dark:text-white">
                {report.firestoreSyncedCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                / {report.totalActiveRecords.toLocaleString()} records ({report.cloudCoveragePct}%)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 dark:bg-sky-500 transition-all duration-300"
                style={{ width: `${Math.max(8, report.cloudCoveragePct)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              Persisted in <span className="font-mono text-[10px]">agencies</span> collection
            </div>
          </div>
        </div>

        {/* KPI 2: Live Federal NPI / Maps Telemetry */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Live Federal NPI &amp; Maps Verified</span>
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-[#0F172A] dark:text-white">
                {report.liveFederalNpiCount.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                CMS NPPES / Maps
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            10-digit Federal NPI &amp; verified municipal station coordinates
          </div>
        </div>

        {/* KPI 3: Public Municipal Registry Baseline */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Public USFA / Census Baseline</span>
              <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-[#0F172A] dark:text-white">
                {report.publicBaselineCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Read-only until hydrated
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Authentic USFA FDID &amp; U.S. Census county demographics
          </div>
        </div>

        {/* KPI 4: Mock & Test Data Sanitization Shield */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Mock / Test Data Blocked</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                0 Active
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                · {report.dataPurityPct}% Purity
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            {report.pulseIqVerifiedTotal.toLocaleString()} PulseIQ scores mathematically verified
          </div>
        </div>
      </section>

      {/* 3. DATA SOURCE DIFFERENTIATION & TRANSPARENCY MATRIX */}
      <section className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
              Data Source Lineage &amp; Differentiation Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explicit distinction between live cloud-persisted records, federal registries, mathematical forecasting models, and blocked test artifacts.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Last Sanitized: {new Date(report.lastSanitizedAt).toLocaleTimeString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-5">Data Tier &amp; Classification</th>
                <th className="py-3 px-4">Origin &amp; Authority</th>
                <th className="py-3 px-4">Fields Governed</th>
                <th className="py-3 px-4 text-right">Active Record Count</th>
                <th className="py-3 px-5 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {/* Row 1: Live Cloud Firestore */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  1. Live Synchronized Cloud Data
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Google Cloud Firestore (agencies &amp; field_notes)
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  Pipeline stages, user-logged field visit notes, day routes, bookmarks &amp; hydrated agency records
                </td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                  {report.firestoreSyncedCount.toLocaleString()} records
                </td>
                <td className="py-3.5 px-5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                  Live Bidirectional Sync
                </td>
              </tr>

              {/* Row 2: Live Federal APIs */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  2. Live Federal Registry Telemetry
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  HHS CMS NPPES NPI API v2.1 &amp; Google Maps Platform
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  10-digit National Provider Identifiers, taxonomy codes, legal entity names &amp; station coordinates
                </td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                  {report.liveFederalNpiCount.toLocaleString()} records
                </td>
                <td className="py-3.5 px-5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                  Real-Time API Verified
                </td>
              </tr>

              {/* Row 3: Public Municipal Baseline */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  3. Public Federal &amp; Municipal Baseline
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  FEMA USFA National Registry &amp; U.S. Census Bureau
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  Department names, USFA FDIDs, county populations, senior demographics &amp; FDA Class I recall notices
                </td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                  {report.publicBaselineCount.toLocaleString()} records
                </td>
                <td className="py-3.5 px-5 text-right font-medium text-sky-700 dark:text-sky-400">
                  Authentic Public Baseline
                </td>
              </tr>

              {/* Row 4: Mathematical PulseIQ & Forecasting Models */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                  4. PulseIQ™ &amp; Financial Forecasting Models
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Deterministic Mathematical Scoring Engine
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  PulseIQ opportunity score (0–100), 5-year TCO lease savings &amp; Medicare denial recovery projections
                </td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                  {report.pulseIqVerifiedTotal.toLocaleString()} models
                </td>
                <td className="py-3.5 px-5 text-right font-medium text-amber-700 dark:text-amber-400">
                  Calculated Predictive Model
                </td>
              </tr>

              {/* Row 5: Mock / Sample / Test Data */}
              <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                <td className="py-3.5 px-5 font-semibold text-slate-500 dark:text-slate-400">
                  5. Mock / Sample / Test Data
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                  Blocked by DataSanitizationService
                </td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                  Legacy zoll-lead-* records, synthetic personas &amp; mock alerts
                </td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-400">
                  0 active ({report.mockAgenciesStrippedTotal + report.mockNotesStrippedTotal} stripped)
                </td>
                <td className="py-3.5 px-5 text-right font-semibold text-rose-700 dark:text-rose-400">
                  Purged &amp; Blocked
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. RECORD-BY-RECORD DATA PROVENANCE & CLOUD SYNC INSPECTOR */}
      <section className="bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
              Record-by-Record Data Provenance &amp; Cloud Sync Inspector
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect individual agency sync state, mathematical PulseIQ™ verification, and field note cleanliness. Click any record to sync directly to Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agency, state, county, FDID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
              />
            </div>

            {/* Interactive Source Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              {(
                [
                  { id: 'all', label: 'All Verified' },
                  { id: 'firestore_cloud_synced', label: 'Firestore Synced' },
                  { id: 'live_federal_registry', label: 'Federal NPI' },
                  { id: 'public_federal_baseline', label: 'Public Baseline' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSourceFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    sourceFilter === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-5">Department / Agency</th>
                <th className="py-3 px-4">Jurisdiction &amp; Registry ID</th>
                <th className="py-3 px-4">Data Source Classification</th>
                <th className="py-3 px-4">PulseIQ™ Mathematical Audit</th>
                <th className="py-3 px-4">Field Notes State</th>
                <th className="py-3 px-5 text-right">Cloud Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredAgencies.slice(0, 75).map((agency) => {
                const tier = dataSanitizationService.classifyProvenanceTier(agency);
                const isCloud = tier === 'firestore_cloud_synced';
                const sb = agency.zollOpportunity.scoreBreakdown;
                const notesCount = agency.fieldNotes?.length || 0;

                return (
                  <tr
                    key={agency.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {onSelectAgency ? (
                          <button
                            type="button"
                            onClick={() => onSelectAgency(agency)}
                            className="hover:text-sky-600 dark:hover:text-sky-400 text-left flex items-center gap-1 cursor-pointer"
                          >
                            <span>{agency.name}</span>
                            <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
                          </button>
                        ) : (
                          <span>{agency.name}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {agency.city}, {agency.stateCode} · {agency.county}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>FDID: {agency.fdid || 'Verified Municipal'}</div>
                      {agency.npiNumber && <div>NPI: {agency.npiNumber}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCloud
                              ? 'bg-emerald-500'
                              : tier === 'live_federal_registry'
                                ? 'bg-sky-500'
                                : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={
                            isCloud
                              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {getTierLabel(tier)}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {agency._syncedAt
                          ? `Synced ${new Date(agency._syncedAt).toLocaleTimeString()}`
                          : agency.verificationSource || 'USFA & Census Verified'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {agency.zollOpportunity.pulseIqScore}/100 Calculated
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                        Fleet:{sb.fleetObsolescencePts} · CMS:{sb.cmsFinancialPts} · Acuity:{sb.clinicalAcuityPts}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {notesCount > 0 ? (
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {notesCount} Cloud-Synced {notesCount === 1 ? 'Note' : 'Notes'}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 Notes · Clean</span>
                      )}
                    </td>

                    <td className="py-3 px-5 text-right">
                      {isCloud ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Firestore</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSyncSingleRow(agency)}
                          disabled={syncingRowId === agency.id || isSyncing}
                          className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CloudUpload className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          <span>{syncingRowId === agency.id ? 'Syncing...' : 'Sync to Cloud'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. REAL-TIME SANITIZATION & CLOUD SYNC AUDIT LOG */}
      <section className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 p-5 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-200">
              LIVE SANITIZATION &amp; FIRESTORE PROVENANCE AUDIT LOG
            </span>
          </div>
          <span>{report.auditEvents.length} recorded verification events</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {report.auditEvents.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 leading-relaxed">
              <span className="text-slate-500 shrink-0 text-[10px] tabular-nums">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-emerald-400 font-semibold shrink-0 text-[10px]">
                [{evt.action}]
              </span>
              <span className="text-slate-300">{evt.summary}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
