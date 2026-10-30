/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Agency } from '../types';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { Award, ChevronRight, ExternalLink, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatInteger, formatScore } from '../utils/numberFormatting';

interface LiveOpenFemaRecord {
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

interface AfgGrantsTrackerProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
}

export const AfgGrantsTracker: React.FC<AfgGrantsTrackerProps> = ({
  agencies,
  onSelectAgency,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount
}) => {
  const [selectedState, setSelectedState] = useState<string>(globalState || 'all');
  const [selectedCounty, setSelectedCounty] = useState<string>(globalCounty || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(globalCity || 'all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [liveFemaAwards, setLiveFemaAwards] = useState<LiveOpenFemaRecord[]>([]);
  const [isLoadingFema, setIsLoadingFema] = useState<boolean>(false);
  const [femaQueryState, setFemaQueryState] = useState<string>(
    globalState && globalState !== 'all' ? globalState : 'TX'
  );
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (globalState !== undefined) {
      setSelectedState(globalState);
      if (globalState !== 'all') setFemaQueryState(globalState);
      setCurrentPage(1);
    }
  }, [globalState]);

  useEffect(() => {
    if (globalCounty !== undefined) {
      setSelectedCounty(globalCounty);
      setCurrentPage(1);
    }
  }, [globalCounty]);

  useEffect(() => {
    if (globalCity !== undefined) {
      setSelectedCity(globalCity);
      setCurrentPage(1);
    }
  }, [globalCity]);

  useEffect(() => {
    if (globalCategory !== undefined) {
      setSelectedCategory(globalCategory);
      setCurrentPage(1);
    }
  }, [globalCategory]);

  const fetchOpenFemaDirect = async (stCode: string, cityFilter?: string) => {
    setIsLoadingFema(true);
    try {
      const params = new URLSearchParams({
        stateCode: stCode === 'all' ? 'TX' : stCode,
        limit: '20'
      });
      if (cityFilter && cityFilter !== 'all') {
        params.set('city', cityFilter);
      }
      const res = await fetch(`/api/fema/afg-grants?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLiveFemaAwards(data.awards || []);
      }
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingFema(false);
    }
  };

  useEffect(() => {
    fetchOpenFemaDirect(femaQueryState, selectedCity);
  }, [femaQueryState, selectedCity]);

  const grantedAgencies = useMemo(() => {
    const base = agencies.filter(a => {
      if (!a.grantStatus.afgAwarded) return false;
      if (selectedState !== 'all' && a.stateCode !== selectedState) return false;
      if (selectedCounty !== 'all') {
        const cleanTarget = selectedCounty.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        const cleanAgency = a.county.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        if (cleanAgency !== cleanTarget && a.county !== selectedCounty) return false;
      }
      if (selectedCity !== 'all' && a.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedCategory === 'ems' && a.agencyType.toLowerCase().includes('fire')) return false;
      if (selectedCategory === 'fire' && !a.agencyType.toLowerCase().includes('fire')) return false;
      return true;
    });
    if (activeAccount) {
      return [activeAccount, ...base.filter(a => a.id !== activeAccount.id)];
    }
    return base;
  }, [agencies, selectedState, selectedCounty, selectedCity, selectedCategory, activeAccount]);

  const totalAwarded = useMemo(() => {
    return grantedAgencies.reduce((acc, a) => acc + a.grantStatus.afgAwardAmount, 0);
  }, [grantedAgencies]);

  const totalPages = Math.max(1, Math.ceil(grantedAgencies.length / PAGE_SIZE));
  const paginatedGrants = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return grantedAgencies.slice(start, start + PAGE_SIZE);
  }, [grantedAgencies, currentPage]);

  return (
    <div className="workspace-view-container min-w-0 w-full">
      {/* Banner & Filter Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>FEMA Assistance to Firefighters Grants &middot; OpenFEMA API v2</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Direct federal record
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-[650] text-slate-900 dark:text-white mt-1.5 tracking-tight">
              Verified grant allocations &amp; cooperative purchasing
            </h1>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Live queries to DHS OpenFEMA AFG v2 award records paired with territory capital equipment liquidity forecasts and pre-competed purchasing vehicles.
            </p>
          </div>

          <div className="pl-4 sm:border-l border-slate-200 dark:border-slate-800 text-left sm:text-right shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Modeled territory AFG liquidity</div>
            <div className="pi-metric-hero font-[650] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-none">
              {formatCurrency(totalAwarded)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pi-data-inline">
              <span className="pi-data-number font-semibold">{formatInteger(grantedAgencies.length)}</span> active recipient accounts &middot; FY Oct 1
            </div>
          </div>
        </div>

        {/* Synced Jurisdiction Context + Category Filter + Pre-Approved Cooperative Contracts */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
            <span className="text-slate-500 dark:text-slate-400">Active territory:</span>
            <strong className="text-slate-900 dark:text-white font-medium">
              {selectedState === 'all' ? 'All 50 States & DC' : `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})`}
            </strong>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">&middot;</span>
            <span className="text-slate-500 dark:text-slate-400">
              Cooperative contracts: <span className="text-slate-700 dark:text-slate-200 font-medium">Sourcewell #041823-ZOL</span> &middot; <span className="text-slate-700 dark:text-slate-200 font-medium">HGACBuy #EE08-24</span> &middot; <span className="text-slate-700 dark:text-slate-200 font-medium">NPPGov #PS20210-ZOL</span> &middot; <span className="text-slate-700 dark:text-slate-200 font-medium">NASPO #SW01924</span>
            </span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as 'all' | 'ems' | 'fire');
              setCurrentPage(1);
            }}
            className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="all">EMS &amp; Fire recipients ({grantedAgencies.length.toLocaleString()})</option>
            <option value="ems">EMS providers only</option>
            <option value="fire">Fire departments only</option>
          </select>
        </div>
      </div>

      {/* Live OpenFEMA API v2 Federal Awards Verification Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              OpenFEMA direct federal grant records ({femaQueryState})
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700">
              Direct API
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={femaQueryState}
              onChange={e => setFemaQueryState(e.target.value)}
              className="h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white"
            >
              {Object.keys(ALL_50_STATES_SUMMARIES).sort().map(st => (
                <option key={st} value={st}>State: {st}</option>
              ))}
            </select>
            <button
              onClick={() => fetchOpenFemaDirect(femaQueryState, selectedCity)}
              disabled={isLoadingFema}
              className="h-7 px-2.5 rounded bg-[#1E3A8A] text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer hover:bg-blue-900 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingFema ? 'animate-spin' : ''}`} />
              <span>{isLoadingFema ? 'Querying...' : 'Refresh records'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-2.5 px-4">Federal award number</th>
                <th className="py-2.5 px-3">Recipient grantee</th>
                <th className="py-2.5 px-3">Jurisdiction</th>
                <th className="py-2.5 px-3">Program category</th>
                <th className="py-2.5 px-3 text-right">Award amount</th>
                <th className="py-2.5 px-3">Award date</th>
                <th className="py-2.5 px-4 text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {liveFemaAwards.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-medium text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                    {rec.awardNumber}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                    {rec.grantee}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {rec.city}, {rec.stateCode}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {rec.programActivity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                    ${rec.federalShareAwarded.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 tabular-nums">
                    {rec.awardDate}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <a
                      href={rec.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1E3A8A] dark:text-blue-400 font-medium hover:underline"
                    >
                      <span>OpenFEMA</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
              {liveFemaAwards.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center text-slate-500">
                    {isLoadingFema ? 'Fetching live federal awards from fema.gov/api/open/v2/AssistanceToFirefightersGrants...' : 'No OpenFEMA records returned for current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Territory Granted Accounts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Territory agencies with AFG equipment liquidity ({grantedAgencies.length.toLocaleString()})
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              Forecast liquidity model
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Page {currentPage} of {totalPages} &middot; Federal fiscal year (Oct 1 &ndash; Sep 30)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-3 px-4">Agency &amp; jurisdiction</th>
                <th className="py-3 px-3 text-right">Award liquidity</th>
                <th className="py-3 px-4 hidden xl:table-cell">Program purpose</th>
                <th className="py-3 px-3 hidden md:table-cell">Target ZOLL solution</th>
                <th className="py-3 px-3 hidden sm:table-cell">Fiscal year close</th>
                <th className="py-3 px-3 text-right">Priority score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedGrants.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  onClick={() => onSelectAgency(agency)}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                      {agency.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {agency.city}, {agency.stateCode} &middot; {agency.county} &middot; FDID {agency.fdid || `${agency.stateCode}-FD`}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 pi-metric-card">
                      {formatCurrency(agency.grantStatus.afgAwardAmount, { compact: false })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 pi-data-inline">
                      FY{agency.grantStatus.afgFiscalYear}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs hidden xl:table-cell">
                    <div className="text-slate-700 dark:text-slate-300 leading-snug">
                      {agency.grantStatus.afgPurpose}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 hidden md:table-cell">
                    <span className="font-medium text-[#1E3A8A] dark:text-blue-400">
                      {agency.zollOpportunity.primaryTargetProduct}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 hidden sm:table-cell">
                    <div className="text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                      {agency.grantStatus.fiscalYearEndMonth} 2026
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Municipal fiscal close
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex flex-col items-end w-14">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white pi-data-inline">
                        <strong className="pi-data-number text-xs font-semibold">{formatScore(agency.zollOpportunity.pulseIqScore)}</strong>
                      </span>
                      <div className="w-full h-[3px] bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1 rounded-full">
                        <div
                          className="h-full bg-[#1E3A8A] dark:bg-blue-400 rounded-full"
                          style={{ width: `${agency.zollOpportunity.pulseIqScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectAgency(agency)}
                      className="h-7 px-3 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, grantedAgencies.length)} of {grantedAgencies.length.toLocaleString()} recipients
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
