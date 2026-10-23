/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  DollarSign, 
  Sparkles,
  FileText,
  Filter
} from 'lucide-react';

interface ContractExpirationCalendarProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onOpenRfpGenerator: (agency: Agency) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
}

export const ContractExpirationCalendar: React.FC<ContractExpirationCalendarProps> = ({
  agencies,
  onSelectAgency,
  onOpenRfpGenerator,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount
}) => {
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');
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

  const expiringAgencies = useMemo(() => {
    const sorted = agencies.filter(a => {
      if (selectedState !== 'all' && a.stateCode !== selectedState) return false;
      if (selectedCounty !== 'all') {
        const cleanTarget = selectedCounty.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        const cleanAgency = a.county.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        if (cleanAgency !== cleanTarget && a.county !== selectedCounty) return false;
      }
      if (selectedCity !== 'all' && a.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedCategory === 'ems' && a.agencyType.toLowerCase().includes('fire')) return false;
      if (selectedCategory === 'fire' && !a.agencyType.toLowerCase().includes('fire')) return false;
      if (filterVendor !== 'all' && a.competitorContract.vendor !== filterVendor) return false;
      if (filterQuarter === 'q4-2026') {
        const d = new Date(a.competitorContract.contractEndDate);
        if (d.getFullYear() !== 2026 || d.getMonth() < 9) return false;
      } else if (filterQuarter === 'q1-2027') {
        const d = new Date(a.competitorContract.contractEndDate);
        if (d.getFullYear() !== 2027 || d.getMonth() > 2) return false;
      }
      return true;
    }).sort((a, b) => {
      return new Date(a.competitorContract.contractEndDate).getTime() - new Date(b.competitorContract.contractEndDate).getTime();
    });
    if (activeAccount) {
      return [activeAccount, ...sorted.filter(a => a.id !== activeAccount.id)];
    }
    return sorted;
  }, [agencies, selectedState, selectedCounty, selectedCity, selectedCategory, filterQuarter, filterVendor, activeAccount]);

  const totalPages = Math.max(1, Math.ceil(expiringAgencies.length / PAGE_SIZE));
  const paginatedAgencies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return expiringAgencies.slice(start, start + PAGE_SIZE);
  }, [expiringAgencies, currentPage]);

  return (
    <div className="space-y-5">
      
      {/* Calendar Header & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
              <span>Competitor Maintenance Agreement Expiration Tracker</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white mt-1 tracking-tight">
              Stryker ProCare &amp; Philips Service Renewal Intervention Calendar
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Agencies enter a 90-day intervention window prior to maintenance contract expiration before multi-year auto-renewal clauses lock capital budgets.
            </p>
          </div>

          <div className="pl-4 border-l border-slate-200 dark:border-slate-800 text-right shrink-0">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Expiring Within 90 Days</div>
            <div className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">
              {expiringAgencies.filter(a => a.competitorContract.renewalWindowDays <= 90).length.toLocaleString()} Accounts
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Priority intervention window</div>
          </div>
        </div>

        {/* Streamlined Contract Filter Controls (Synced with Global Territory Filter Bar) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
            <span className="text-slate-500 dark:text-slate-400">Active Territory:</span>
            <strong className="text-[#0F172A] dark:text-white">
              {selectedState === 'all' ? 'All 50 States & DC' : `${ALL_50_STATES_SUMMARIES[selectedState]?.state || selectedState} (${selectedState})`}
            </strong>
            {selectedCounty !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <strong className="text-[#0F172A] dark:text-white">{selectedCounty}</strong>
              </>
            )}
            {selectedCity !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <strong className="text-[#0F172A] dark:text-white">{selectedCity}</strong>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as 'all' | 'ems' | 'fire');
                setCurrentPage(1);
              }}
              className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-[#0F172A] dark:text-white font-semibold focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All EMS &amp; Fire ({expiringAgencies.length.toLocaleString()})</option>
              <option value="ems">EMS Providers Only</option>
              <option value="fire">Fire Departments Only</option>
            </select>

            <select
              value={filterQuarter}
              onChange={(e) => {
                setFilterQuarter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-[#0F172A] dark:text-white font-semibold focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All Expiration Windows</option>
              <option value="q4-2026">Q4 2026 (Oct–Dec) Urgent</option>
              <option value="q1-2027">Q1 2027 (Jan–Mar)</option>
            </select>

            <select
              value={filterVendor}
              onChange={(e) => {
                setFilterVendor(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-[#0F172A] dark:text-white font-semibold focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All Incumbent Vendors</option>
              <option value="Stryker ProCare">Stryker ProCare</option>
              <option value="Philips Master Service">Philips Master Service</option>
              <option value="Medtronic Legacy">Medtronic Legacy</option>
              <option value="Third-Party ISO">Third-Party ISO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expiration Timeline Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Upcoming Maintenance Agreement End Dates ({expiringAgencies.length.toLocaleString()} Matching Agencies)
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages} · Sorted by Expiration Date
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <th className="py-3 px-4">Agency / Jurisdiction</th>
                <th className="py-3 px-3">Incumbent Vendor &amp; Fleet</th>
                <th className="py-3 px-3 hidden sm:table-cell">End Date</th>
                <th className="py-3 px-3 hidden md:table-cell">Renewal Window</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">Rival Annual Cost</th>
                <th className="py-3 px-4 hidden xl:table-cell">Sales Intervention Strategy</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {paginatedAgencies.map((agency) => {
                const cc = agency.competitorContract;
                const isUrgent = cc.renewalWindowDays <= 90;

                return (
                  <tr 
                    key={agency.id}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    onClick={() => onSelectAgency(agency)}
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-[#0F172A] dark:text-white group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                        {agency.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {agency.city}, {agency.stateCode} · {agency.county} · Installed: <strong className="text-slate-700 dark:text-slate-200">{agency.installedFleet.defibBrand}</strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#0F172A] dark:text-white">
                        {cc.vendor}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">{agency.installedFleet.defibUnitsCount}</span> units under agreement
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-[#0F172A] dark:text-white tabular-nums hidden sm:table-cell">
                      {cc.contractEndDate}
                    </td>

                    <td className="py-3.5 px-3 hidden md:table-cell">
                      <span className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
                        isUrgent ? 'font-bold text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {isUrgent && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                        <span>{cc.renewalWindowDays} days</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400 font-bold hidden lg:table-cell">
                      ${cc.annualServiceCostPerUnit.toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-normal block font-sans">/ unit / yr</span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300 text-[11px] max-w-xs leading-relaxed hidden xl:table-cell">
                      {cc.actionRecommendation}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenRfpGenerator(agency)}
                          className="h-7 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1E3A8A] dark:text-blue-400 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Generate Pre-Emptive Technical RFP Specs"
                        >
                          RFP Spec
                        </button>

                        <button
                          onClick={() => onSelectAgency(agency)}
                          className="h-7 px-3 bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Inspect</span>
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, expiringAgencies.length)} of {expiringAgencies.length.toLocaleString()} Contracts
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-white disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
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
