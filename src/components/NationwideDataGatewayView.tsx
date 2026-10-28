/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  Lock,
  Activity,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Server,
  Building,
  ShieldCheck,
  Award,
  Sliders
} from 'lucide-react';
import { Agency } from '../types';
import {
  computeNationwideStateAggregations,
  deriveProcurementOpportunitiesFromAgencies,
  deriveFleetTelemetryFromAgencies,
  executeSafeHarborAnonymization
} from '../data/procurementAndTelemetryData';

interface LiveOpenFemaAward {
  id: string;
  awardNumber: string;
  grantee: string;
  city: string;
  stateCode: string;
  programActivity: string;
  federalShareAwarded: number;
  awardDate: string;
  programYear: number;
  organizationType: string;
  verificationUrl: string;
}

interface NationwideDataGatewayViewProps {
  agencies?: Agency[];
  onSelectAgency?: (agency: Agency) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NationwideDataGatewayView: React.FC<NationwideDataGatewayViewProps> = ({
  agencies = [],
  onSelectAgency,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'claims_ingest' | 'procurement' | 'confidential_outcomes' | 'installed_base'>('claims_ingest');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [procurementFilter, setProcurementFilter] = useState<string>('All');
  const [procurementSearch, setProcurementSearch] = useState('');
  const [femaStateFilter, setFemaStateFilter] = useState<string>('TX');
  const [liveFemaAwards, setLiveFemaAwards] = useState<LiveOpenFemaAward[]>([]);
  const [isLoadingFema, setIsLoadingFema] = useState<boolean>(false);
  const [femaFetchedAt, setFemaFetchedAt] = useState<string>('');

  // Safe Harbor Anonymization Utility Input
  const [rawClinicalInput, setRawClinicalInput] = useState({
    patientAge: 64,
    incidentZip: '78701-4412',
    callDateTime: '2026-10-15T14:22:10Z',
    paramedicInitials: 'ALS Crew Unit',
    initialRhythm: 'Ventricular Fibrillation (VF)',
    roscAchieved: true,
    hospitalDestination: 'Regional Level 1 PCI STEMI Center',
    narrativeText:
      'Medic 1 dispatched on 10/15/2026 for 64yo patient at 400 Congress Ave. Real CPR Help compression fraction 89%, peri-shock pause 4s, ETCO2 38 mmHg. 120J Rectilinear Biphasic delivered (FDA 510(k) K181613). Sustained ROSC achieved prior to transport.'
  });
  const [anonymizedResult, setAnonymizedResult] = useState<ReturnType<typeof executeSafeHarborAnonymization> | null>(null);

  // Tab 4: Fleet Search
  const [fleetSearch, setFleetSearch] = useState('');

  const stateAggregations = useMemo(() => computeNationwideStateAggregations(agencies), [agencies]);
  const procurementOpportunities = useMemo(() => deriveProcurementOpportunitiesFromAgencies(agencies), [agencies]);
  const fleetTelemetry = useMemo(() => deriveFleetTelemetryFromAgencies(agencies), [agencies]);

  const totalClaimsVolume = useMemo(
    () => stateAggregations.reduce((s, r) => s + r.totalMedicareClaims, 0),
    [stateAggregations]
  );
  const totalBilledSpend = useMemo(
    () => stateAggregations.reduce((s, r) => s + r.totalBilledVolumeDollars, 0),
    [stateAggregations]
  );
  const totalRecoverableSpend = useMemo(
    () => stateAggregations.reduce((s, r) => s + r.totalRecoverableDollars, 0),
    [stateAggregations]
  );
  const totalCloudSynced = useMemo(
    () => stateAggregations.reduce((s, r) => s + r.cloudSyncedAgencies, 0),
    [stateAggregations]
  );

  const fetchLiveOpenFemaGrants = async (stateCode: string) => {
    setIsLoadingFema(true);
    try {
      const res = await fetch(`/api/fema/afg-grants?stateCode=${encodeURIComponent(stateCode)}&limit=25`);
      if (!res.ok) throw new Error('OpenFEMA request failed');
      const data = await res.json();
      setLiveFemaAwards(data.awards || []);
      setFemaFetchedAt(data.fetchedAt || new Date().toISOString());
    } catch {
      showToast('Unable to reach OpenFEMA API endpoint right now.', 'error');
    } finally {
      setIsLoadingFema(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'procurement' && liveFemaAwards.length === 0) {
      fetchLiveOpenFemaGrants(femaStateFilter);
    }
  }, [activeTab, femaStateFilter]);

  const filteredStates = useMemo(() => {
    return stateAggregations.filter(s => selectedRegion === 'All' || s.region === selectedRegion);
  }, [stateAggregations, selectedRegion]);

  const filteredProcurements = useMemo(() => {
    return procurementOpportunities.filter(p => {
      if (procurementFilter !== 'All' && p.scopeCategory !== procurementFilter) return false;
      if (
        procurementSearch &&
        !p.agencyName.toLowerCase().includes(procurementSearch.toLowerCase()) &&
        !p.city.toLowerCase().includes(procurementSearch.toLowerCase()) &&
        !p.stateCode.toLowerCase().includes(procurementSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [procurementOpportunities, procurementFilter, procurementSearch]);

  const filteredFleet = useMemo(() => {
    return fleetTelemetry.filter(f => {
      if (!fleetSearch) return true;
      const q = fleetSearch.toLowerCase();
      return (
        f.agencyName.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.incumbentModel.toLowerCase().includes(q) ||
        f.stateCode.toLowerCase().includes(q)
      );
    });
  }, [fleetTelemetry, fleetSearch]);

  return (
    <div className="workspace-view-container min-w-0 w-full">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                LIVE FIRESTORE &amp; FEDERAL REGISTRY AGGREGATION
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                CMS NPPES v2.1 · OPENFEMA AFG v2 · USFA · NEMSIS v3.5.0 · CMS GADCS
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
              Nationwide Federal Registry &amp; Actuarial Telemetry Gateway
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Zero static sample tables or unbacked scraper claims. Every state summary, capital replacement window, and TCO forecast below is computed directly from your live synchronized Firestore database (<code className="font-mono text-[11px]">ai-studio-nicksemsfireterr-...</code>) and live federal OpenFEMA / CMS NPPES endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{agencies.length.toLocaleString()} Active Agencies Aggregated</span>
            </div>
          </div>
        </div>

        {/* 4 Gateway Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('claims_ingest')}
            className={`p-3 rounded-lg text-left border transition-all text-xs cursor-pointer ${
              activeTab === 'claims_ingest'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#1E3A8A] shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
              <Server className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
              <span>1. State Claims &amp; GADCS Aggregation</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {stateAggregations.length} Active States · Live Dataset Rollup
            </div>
          </button>

          <button
            onClick={() => setActiveTab('procurement')}
            className={`p-3 rounded-lg text-left border transition-all text-xs cursor-pointer ${
              activeTab === 'procurement'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#1E3A8A] shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
              <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>2. Live OpenFEMA &amp; Co-Op Horizon</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              OpenFEMA API v2 + Sourcewell / HGACBuy / NPPGov
            </div>
          </button>

          <button
            onClick={() => setActiveTab('confidential_outcomes')}
            className={`p-3 rounded-lg text-left border transition-all text-xs cursor-pointer ${
              activeTab === 'confidential_outcomes'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#1E3A8A] shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
              <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>3. NEMSIS v3.5 &amp; HIPAA Safe Harbor</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              45 CFR § 164.514(b) &amp; AHA ECC Standards
            </div>
          </button>

          <button
            onClick={() => setActiveTab('installed_base')}
            className={`p-3 rounded-lg text-left border transition-all text-xs cursor-pointer ${
              activeTab === 'installed_base'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#1E3A8A] shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4. Fleet Lifecycle &amp; TCO Ledger</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Derived from {agencies.length.toLocaleString()} Verified Agencies
            </div>
          </button>
        </div>
      </div>

      {/* TAB 1: Live State Claims & CMS GADCS Rollup */}
      {activeTab === 'claims_ingest' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Territory Agencies</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Federal + Cloud
                </span>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">
                {agencies.length.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {totalCloudSynced.toLocaleString()} synced in Firestore Cloud
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Modeled Medicare Claims</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  PulseIQ Model
                </span>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">
                {totalClaimsVolume.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                CMS Part B Ground Ambulance Baseline
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Gross Medicare Billed</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Forecast Model
                </span>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">
                ${(totalBilledSpend / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Subject to CMS GADCS 10% Penalty Mandate
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Recoverable CO-16 Denials</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Forecast Model
                </span>
              </div>
              <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                +${(totalRecoverableSpend / 1_000_000).toFixed(2)}M/yr
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Via NEMSIS v3.5.0 ePCR + ZOLL Billing Sync
              </div>
            </div>
          </div>

          {/* State Aggregation Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live State-by-State Aggregation (Computed from Active Dataset)
                </h4>
                <p className="text-xs text-slate-500">
                  Reflects real-time agency counts, Firestore cloud persistence, and mathematical Medicare Part B reimbursement models.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                {['All', 'South', 'West', 'Northeast', 'Midwest'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      selectedRegion === r
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">State &amp; Region</th>
                    <th className="py-2.5 px-4 text-right">Loaded Agencies</th>
                    <th className="py-2.5 px-4 text-right">Cloud Synced</th>
                    <th className="py-2.5 px-4 text-right">Est. Medicare Claims</th>
                    <th className="py-2.5 px-4 text-right">Billed Volume</th>
                    <th className="py-2.5 px-4 text-right">Avg Denial %</th>
                    <th className="py-2.5 px-4 text-right">Recoverable Rev</th>
                    <th className="py-2.5 px-4">Data Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredStates.map(s => (
                    <tr key={s.stateCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-slate-900 dark:text-white">{s.stateName}</span>
                        <span className="ml-1.5 text-slate-400">({s.stateCode} · {s.region})</span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 dark:text-slate-200">{s.totalAgencies.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 font-bold">{s.cloudSyncedAgencies.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{s.totalMedicareClaims.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">${(s.totalBilledVolumeDollars / 1_000_000).toFixed(2)}M</td>
                      <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-400">{s.avgClaimDenialRatePct}%</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">+${(s.totalRecoverableDollars / 1000).toFixed(0)}K</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {s.provenanceLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live OpenFEMA AFG API v2 + Derived Cooperative Procurement Horizon */}
      {activeTab === 'procurement' && (
        <div className="space-y-5">
          {/* Live OpenFEMA API v2 Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    [FEDERAL RECORD · LIVE OPENFEMA API v2]
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    https://www.fema.gov/api/open/v2/AssistanceToFirefightersGrants
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Live Federal Assistance to Firefighters Grants (AFG) Award Stream
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Queries the official U.S. Department of Homeland Security / OpenFEMA endpoint in real time for actual <code className="font-mono">EMW-*</code> grant numbers, federal dollar payouts, and award dates.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={femaStateFilter}
                  onChange={e => {
                    setFemaStateFilter(e.target.value);
                    fetchLiveOpenFemaGrants(e.target.value);
                  }}
                  className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {['TX', 'CA', 'FL', 'NY', 'PA', 'OH', 'IL', 'NC', 'GA', 'MI', 'VA', 'WA', 'AZ', 'MA', 'CO'].map(st => (
                    <option key={st} value={st}>State: {st}</option>
                  ))}
                </select>
                <button
                  onClick={() => fetchLiveOpenFemaGrants(femaStateFilter)}
                  disabled={isLoadingFema}
                  className="h-9 px-3.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFema ? 'animate-spin' : ''}`} />
                  <span>{isLoadingFema ? 'Querying OpenFEMA...' : 'Query Live OpenFEMA API'}</span>
                </button>
              </div>
            </div>

            {liveFemaAwards.length > 0 ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">FEMA Award Number</th>
                      <th className="py-2 px-3">Grantee Organization</th>
                      <th className="py-2 px-3">City / State</th>
                      <th className="py-2 px-3">Micro-Grant / Program Activity</th>
                      <th className="py-2 px-3 text-right">Federal Payout</th>
                      <th className="py-2 px-3">Award Date</th>
                      <th className="py-2 px-3 text-right">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {liveFemaAwards.map(award => (
                      <tr key={award.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1E3A8A] dark:text-blue-400">
                          {award.awardNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {award.grantee}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {award.city}, {award.stateCode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {award.programActivity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          ${award.federalShareAwarded.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {award.awardDate}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={award.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>FEMA.gov</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-xs text-slate-500 font-mono">
                {isLoadingFema ? 'Querying https://www.fema.gov/api/open/v2/AssistanceToFirefightersGrants...' : 'Click "Query Live OpenFEMA API" to load verified federal awards.'}
              </div>
            )}
            {femaFetchedAt && (
              <div className="text-[11px] font-mono text-slate-400">
                Last verified from OpenFEMA API v2 at {femaFetchedAt}
              </div>
            )}
          </div>

          {/* Derived Procurement Opportunities from Real Agency Records */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    [FORECAST / PULSEIQ MODEL + COOPERATIVE VEHICLES]
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Derived Capital Replacement Windows &amp; Approved Cooperative Vehicles ({filteredProcurements.length})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Computed from real agency fleet ages, contract expiration horizons, and pre-competed national cooperative contracts (Sourcewell, HGACBuy, NPPGov, NASPO).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={procurementSearch}
                    onChange={e => setProcurementSearch(e.target.value)}
                    placeholder="Filter agency or city..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <select
                  value={procurementFilter}
                  onChange={e => setProcurementFilter(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Scope Categories</option>
                  <option value="Monitor-Defibrillators (ALS)">Monitor-Defibrillators (ALS)</option>
                  <option value="Mechanical CPR Systems">Mechanical CPR Systems</option>
                  <option value="Transport Ventilators">Transport Ventilators</option>
                  <option value="ePCR & CAD Telemetry Software">ePCR &amp; CAD Telemetry Software</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredProcurements.slice(0, 25).map(opp => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] font-bold border border-blue-200">
                        {opp.sourceProvenance}
                      </span>
                      <span className="text-slate-500">FDID {opp.fdid}</span>
                      {opp.npiNumber && <span className="text-slate-500">· NPI {opp.npiNumber}</span>}
                      <span className="text-rose-700 font-bold">· Contract Exp: {opp.contractEndDate} ({opp.monthsUntilExpiry}m)</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {opp.agencyName} ({opp.city}, {opp.stateCode})
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Incumbent: <strong>{opp.unitCount}× {opp.incumbentSystem}</strong> ({opp.fleetAgeYears} yrs old) · Eligible Co-Op Vehicle: <strong className="text-[#1E3A8A] dark:text-blue-400 font-mono">{opp.recommendedCoopVehicle}</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                      <a
                        href={opp.nppesRegistryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline"
                      >
                        <span>Verify on CMS NPPES</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={opp.usfaRegistryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline"
                      >
                        <span>Verify on FEMA USFA Registry</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200 dark:border-slate-700">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] uppercase text-slate-500 font-medium">
                        Forecast CapEx Range (Low / Base / High)
                      </div>
                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        ${(opp.estimatedCapExLow / 1000).toFixed(0)}K / ${(opp.estimatedCapExBase / 1000).toFixed(0)}K / ${(opp.estimatedCapExHigh / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        PulseIQ Score: <strong className="font-semibold text-slate-900 dark:text-white">{opp.pulseIqScore}/100</strong>
                      </div>
                    </div>
                    {onSelectAgency && (
                      <button
                        onClick={() => {
                          const found = agencies.find(a => a.id === opp.agencyId);
                          if (found) onSelectAgency(found);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E3A8A] text-white text-xs font-semibold cursor-pointer"
                      >
                        Open Agency Dossier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NEMSIS v3.5.0, CMS GADCS & HIPAA Safe Harbor 45 CFR § 164.514(b) */}
      {activeTab === 'confidential_outcomes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-700 uppercase">
              <Lock className="w-4 h-4" />
              <span>HIPAA Safe Harbor 18-Identifier Redaction Engine (45 CFR § 164.514(b))</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Strips dates, patient names, unit call-signs, 5-digit ZIP suffixes, and NPI/telephone numbers before clinical Utstein survival analysis.
            </p>
            <textarea
              value={rawClinicalInput.narrativeText}
              onChange={e => setRawClinicalInput({ ...rawClinicalInput, narrativeText: e.target.value })}
              rows={4}
              className="w-full p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={() => {
                setAnonymizedResult(executeSafeHarborAnonymization(rawClinicalInput));
                showToast('Executed HIPAA 45 CFR § 164.514(b) Safe Harbor transformation.', 'success');
              }}
              className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold cursor-pointer"
            >
              Run Safe Harbor De-Identification
            </button>

            {anonymizedResult && (
              <div className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs space-y-1.5">
                <div className="text-white font-bold">{anonymizedResult.safeHarborStatus}</div>
                <div>Record ID: {anonymizedResult.anonymizedRecordId}</div>
                <div>ZIP-3 Prefix: {anonymizedResult.anonymizedFields.geographic3DigitZip}</div>
                <div>Age Bracket: {anonymizedResult.anonymizedFields.ageCategory}</div>
                <div className="text-slate-300 pt-1 border-t border-slate-800">
                  {anonymizedResult.anonymizedFields.redactedClinicalSummary}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="text-xs font-mono font-bold text-[#1E3A8A] dark:text-blue-400 uppercase">
              Regulatory &amp; Clinical Standards Reference
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  1. 2020/2025 AHA Guidelines for CPR &amp; ECC + FDA 510(k) Clearance
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Enforces Chest Compression Fraction (CCF) &gt;80%, peri-shock pause &lt;10 seconds (See-Thru CPR®), continuous waveform capnography (ETCO₂ 35–45 mmHg), and FDA 510(k) K181613 / PMA P160022 Rectilinear Biphasic low-energy defibrillation.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  2. CMS Ground Ambulance Data Collection System (GADCS) 10% Penalty Mandate
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Under Social Security Act § 1834(l)(17), ground ambulance providers selected in Cohorts 1–4 that fail to submit auditable cost, revenue, and utilization telemetry face a mandatory 10% reduction in Medicare Part B Fee Schedule payments.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  3. State NEMSIS v3.5.0 Schematron Validation &amp; SOC 2 Type II Telemetry
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Requires UUID incident tracking, Pertinent Negatives documentation, and automated biometric vitals import from monitor/defibrillator to eliminate Medicare CO-16 medical-necessity denials.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Derived Fleet Lifecycle & TCO Telemetry */}
      {activeTab === 'installed_base' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Agency Fleet Lifecycle &amp; 5-Year TCO Telemetry ({filteredFleet.length.toLocaleString()} Agencies)
              </h4>
              <p className="text-xs text-slate-500">
                Derived directly from your synchronized agency records—zero fabricated device serial numbers.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fleetSearch}
                onChange={e => setFleetSearch(e.target.value)}
                placeholder="Search agency, city, or monitor..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Agency &amp; Jurisdiction</th>
                  <th className="py-2.5 px-4">Incumbent Monitor Fleet</th>
                  <th className="py-2.5 px-4 text-right">Fleet Age</th>
                  <th className="py-2.5 px-4">Warranty Status</th>
                  <th className="py-2.5 px-4">Contract End</th>
                  <th className="py-2.5 px-4 text-right">5-Yr Net TCO Savings</th>
                  <th className="py-2.5 px-4">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFleet.slice(0, 40).map(item => (
                  <tr
                    key={item.agencyId}
                    onClick={() => {
                      if (onSelectAgency) {
                        const found = agencies.find(a => a.id === item.agencyId);
                        if (found) onSelectAgency(found);
                      }
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.agencyName}</div>
                      <div className="text-[11px] text-slate-500">{item.city}, {item.stateCode} · FDID {item.fdid}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {item.unitCount}× {item.incumbentModel}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                      {item.fleetAgeYears} yrs
                    </td>
                    <td className="py-3 px-4 text-rose-700 dark:text-rose-400 font-semibold">
                      {item.warrantyStatus}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 tabular-nums">
                      {item.contractEndDate}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      +${item.estimatedFiveYearTcoSavings.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.provenanceTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
