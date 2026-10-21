/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { Award, DollarSign, Calendar, ChevronRight, FileCheck, ExternalLink, Shield, Filter } from 'lucide-react';
import { PulseIqScoreTooltip } from './PulseIqScoreTooltip';

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
  const PAGE_SIZE = 50;

  React.useEffect(() => {
    if (globalState !== undefined) {
      setSelectedState(globalState);
      setCurrentPage(1);
    }
  }, [globalState]);

  React.useEffect(() => {
    if (globalCounty !== undefined) {
      setSelectedCounty(globalCounty);
      setCurrentPage(1);
    }
  }, [globalCounty]);

  React.useEffect(() => {
    if (globalCity !== undefined) {
      setSelectedCity(globalCity);
      setCurrentPage(1);
    }
  }, [globalCity]);

  React.useEffect(() => {
    if (globalCategory !== undefined) {
      setSelectedCategory(globalCategory);
      setCurrentPage(1);
    }
  }, [globalCategory]);

  const availableStates = useMemo(() => Object.keys(ALL_50_STATES_SUMMARIES).sort(), []);
  const availableCounties = useMemo(() => territoryEngine.getCountiesForState(selectedState).map(c => c.countyName), [selectedState]);
  const availableCities = useMemo(() => territoryEngine.getCitiesForState(selectedState, selectedCounty !== 'all' ? selectedCounty : undefined), [selectedState, selectedCounty]);

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
    <div className="space-y-5">
      
      {/* Banner & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>FEMA Assistance to Firefighters Grants (AFG) &amp; SAFER Intelligence</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-1 tracking-tight">
              Federal Grant Allocations for EMS &amp; Fire Equipment Across All 50 States
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Agencies with awarded AFG capital hold pre-allocated federal funds dedicated to modern firefighter safety and resuscitation apparatus.
            </p>
          </div>

          <div className="pl-4 border-l border-slate-200 text-right shrink-0">
            <div className="text-[11px] text-slate-500 font-medium">Unspent AFG Territory Funds</div>
            <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
              ${(totalAwarded / 1000).toLocaleString()}K
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {grantedAgencies.length.toLocaleString()} active recipient accounts
            </div>
          </div>
        </div>

        {/* Synced Jurisdiction Context + Category Filter + Pre-Approved Cooperative Contracts */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <Filter className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="text-slate-500">Active Territory:</span>
            <strong className="text-[#0F172A]">
              {selectedState === 'all' ? 'All 50 States & DC' : `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})`}
            </strong>
            {selectedCounty !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <strong className="text-[#0F172A]">{selectedCounty}</strong>
              </>
            )}
            {selectedCity !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <strong className="text-[#0F172A]">{selectedCity}</strong>
              </>
            )}
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-slate-500">
              Co-Op Contracts: <strong className="font-mono text-[#0F172A]">Sourcewell #041223-ZOL</strong> · <strong className="font-mono text-[#0F172A]">HGACBuy #EE08-19</strong> · <strong className="font-mono text-[#0F172A]">NPPGov #VH11640</strong>
            </span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as 'all' | 'ems' | 'fire');
              setCurrentPage(1);
            }}
            className="h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="all">EMS + Fire Recipients ({grantedAgencies.length.toLocaleString()})</option>
            <option value="ems">EMS Providers Only</option>
            <option value="fire">Fire Departments Only</option>
          </select>
        </div>
      </div>

      {/* Granted Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#0F172A]">
            Active AFG Award Recipient Agencies ({grantedAgencies.length.toLocaleString()})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Page {currentPage} of {totalPages} · Fiscal Year 2025/2026 Grants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4">Agency / Jurisdiction</th>
                <th className="py-3 px-3 text-right">Award Amount</th>
                <th className="py-3 px-4 hidden xl:table-cell">FEMA Stated Purpose</th>
                <th className="py-3 px-3 hidden md:table-cell">Target ZOLL Solution</th>
                <th className="py-3 px-3 hidden sm:table-cell">Exp. Deadline</th>
                <th className="py-3 px-3 text-right">PulseIQ</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrants.map((agency) => (
                <tr 
                  key={agency.id} 
                  className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  onClick={() => onSelectAgency(agency)}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                      {agency.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.city}, {agency.stateCode} · {agency.county}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                      ${agency.grantStatus.afgAwardAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      FY{agency.grantStatus.afgFiscalYear}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs hidden xl:table-cell">
                    <div className="text-slate-700 leading-snug">
                      {agency.grantStatus.afgPurpose}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 hidden md:table-cell">
                    <span className="font-semibold text-[#1E3A8A]">
                      {agency.zollOpportunity.primaryTargetProduct}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 hidden sm:table-cell">
                    <div className="text-amber-700 font-semibold font-mono">
                      {agency.grantStatus.fiscalYearEndMonth} 2026
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Surplus cycle
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <PulseIqScoreTooltip agency={agency} size="badge" showLabel={false} />
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectAgency(agency)}
                      className="h-7 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E3A8A] text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
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
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-mono text-slate-600">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, grantedAgencies.length)} of {grantedAgencies.length.toLocaleString()} Recipients
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0F172A] disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0F172A] disabled:opacity-40 hover:bg-slate-50"
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
