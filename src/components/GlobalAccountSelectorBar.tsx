/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency, LeadStage, FieldNote } from '../types';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import {
  MapPin,
  Siren,
  Flame,
  ChevronRight,
  RotateCcw,
  Search,
  Globe
} from 'lucide-react';

interface GlobalAccountSelectorBarProps {
  agencies: Agency[];
  selectedState: string;
  selectedCounty: string;
  selectedCity: string;
  selectedCategory: 'all' | 'ems' | 'fire';
  activeAccount: Agency | null;
  onSelectState: (stateCode: string) => void;
  onSelectCounty: (countyName: string) => void;
  onSelectCity: (cityName: string) => void;
  onSelectCategory: (category: 'all' | 'ems' | 'fire') => void;
  onSelectAccount: (agency: Agency | null) => void;
  onUpdateStage: (agencyId: string, newStage: LeadStage) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  onOpenDossierModal: (agency: Agency) => void;
  onOpenRfpGenerator: (agency: Agency) => void;
  onNavigateTab: (tab: string) => void;
  activeTab: string;
}

export const GlobalAccountSelectorBar: React.FC<GlobalAccountSelectorBarProps> = ({
  agencies,
  selectedState,
  selectedCounty,
  selectedCity,
  selectedCategory,
  activeAccount,
  onSelectState,
  onSelectCounty,
  onSelectCity,
  onSelectCategory,
  onSelectAccount,
  onNavigateTab,
  activeTab
}) => {
  const [accountFilterQuery, setAccountFilterQuery] = useState<string>('');

  // All 50 States + DC sorted alphabetically
  const allStates = useMemo(() => {
    return Object.values(ALL_50_STATES_SUMMARIES).sort((a, b) => a.state.localeCompare(b.state));
  }, []);

  // Cascading Counties for selected state
  const availableCounties = useMemo(() => {
    if (selectedState === 'all') return [];
    const raw = territoryEngine.getCountiesForState(selectedState);
    const unique = new Set<string>();
    for (let i = 0; i < raw.length; i++) {
      unique.add(raw[i].countyName);
    }
    return Array.from(unique).sort();
  }, [selectedState]);

  // Normalize county value so dropdown stays in sync regardless of 'County'/'Parish' suffix
  const resolvedSelectedCounty = useMemo(() => {
    if (selectedCounty === 'all') return 'all';
    const exact = availableCounties.find(c => c.toLowerCase() === selectedCounty.toLowerCase());
    if (exact) return exact;
    const normSelected = selectedCounty.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
    const normMatch = availableCounties.find(
      c => c.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim() === normSelected
    );
    return normMatch || selectedCounty;
  }, [selectedCounty, availableCounties]);

  // Universal instant municipal city lookup across all 5,402 cities
  const matchingCities = useMemo(() => {
    const q = accountFilterQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    const all = territoryEngine.getAllCitiesWithMetadata(selectedState !== 'all' ? selectedState : 'all', selectedCounty !== 'all' ? selectedCounty : undefined);
    const hits: Array<{ city: string; county: string; stateCode: string; primaryZip?: string }> = [];
    const seen = new Set<string>();
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      if (c.city.toLowerCase().includes(q) || (c.primaryZip && c.primaryZip.startsWith(q))) {
        const key = `${c.stateCode}:${c.city}:${c.county}`;
        if (!seen.has(key)) {
          seen.add(key);
          hits.push(c);
          if (hits.length >= 5) break;
        }
      }
    }
    return hits;
  }, [accountFilterQuery, selectedState, selectedCounty]);

  const handleJumpToCity = (c: { city: string; county: string; stateCode: string }) => {
    onSelectState(c.stateCode);
    onSelectCounty(c.county);
    onSelectCity(c.city);
    setAccountFilterQuery('');
  };

  // Filtered accounts matching current State, County, City, Category, and quick search query
  const matchingAccounts = useMemo(() => {
    const q = accountFilterQuery.toLowerCase().trim();
    if (!q && selectedState === 'all') {
      // Fast path when at national level with no search query
      return agencies.filter(a => {
        if (selectedCategory === 'all') return true;
        const cat = (a.providerCategory || (a.agencyType.toLowerCase().includes('fire') ? 'fire' : 'ems')).toLowerCase();
        return cat === selectedCategory;
      });
    }

    const resultList: Agency[] = [];
    const seenIds = new Set<string>();
    const normCounty = selectedCounty !== 'all'
      ? selectedCounty.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim()
      : 'all';

    for (let i = 0; i < agencies.length; i++) {
      const a = agencies[i];
      if (selectedState !== 'all' && a.stateCode !== selectedState) continue;
      if (normCounty !== 'all') {
        const aNormCounty = a.county.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality)$/i, '').trim();
        if (aNormCounty !== normCounty && !aNormCounty.includes(normCounty) && !normCounty.includes(aNormCounty)) continue;
      }
      if (selectedCity !== 'all' && a.city.toLowerCase() !== selectedCity.toLowerCase()) continue;
      if (selectedCategory !== 'all') {
        const cat = (a.providerCategory || (a.agencyType.toLowerCase().includes('fire') ? 'fire' : 'ems')).toLowerCase();
        if (cat !== selectedCategory) continue;
      }

      if (q) {
        const hit =
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.county.toLowerCase().includes(q) ||
          a.stateCode.toLowerCase().includes(q) ||
          a.zipCode.includes(q);
        if (!hit) continue;
      }

      if (!seenIds.has(a.id)) {
        seenIds.add(a.id);
        resultList.push(a);
      }
    }

    if (selectedState !== 'all') {
      const stateAgencies = selectedCounty !== 'all'
        ? territoryEngine.getAgenciesForCountyAndCities(
            selectedState,
            resolvedSelectedCounty,
            selectedCity !== 'all' ? [selectedCity] : undefined,
            agencies,
            selectedCategory
          )
        : territoryEngine.getAgenciesForState(selectedState, agencies, selectedCategory);

      for (const ca of stateAgencies) {
        if (!seenIds.has(ca.id)) {
          if (selectedCity !== 'all' && ca.city.toLowerCase() !== selectedCity.toLowerCase()) continue;
          if (q) {
            const hit =
              ca.name.toLowerCase().includes(q) ||
              ca.city.toLowerCase().includes(q) ||
              ca.county.toLowerCase().includes(q) ||
              ca.stateCode.toLowerCase().includes(q) ||
              ca.zipCode.includes(q);
            if (!hit) continue;
          }
          seenIds.add(ca.id);
          resultList.push(ca);
        }
        if (q && resultList.length >= 100) break;
      }
    }

    return resultList;
  }, [agencies, selectedState, selectedCounty, resolvedSelectedCounty, selectedCity, selectedCategory, accountFilterQuery]);

  // Contextual sub-views integrated directly into this single unified bar
  const subViewOptions = useMemo(() => {
    if (['states_directory', 'geo', 'gis', 'pulseiq', 'map'].includes(activeTab)) {
      return [
        { id: 'states_directory', label: 'State & County Explorer' },
        { id: 'gis', label: 'GIS Heatmap' },
        { id: 'pulseiq', label: 'Regional Charts' }
      ];
    }
    if (['knowledge', 'contracts', 'grants', 'claims'].includes(activeTab)) {
      return [
        { id: 'knowledge', label: '5-Yr Savings & Recalls' },
        { id: 'contracts', label: 'Contract Calendar' },
        { id: 'grants', label: 'FEMA Grants' },
        { id: 'claims', label: 'Medicare Claims' }
      ];
    }
    if (['field', '3d_studio'].includes(activeTab)) {
      return [
        { id: 'field', label: 'Station Route & Notes' },
        { id: '3d_studio', label: '3D Equipment Demo' }
      ];
    }
    return [];
  }, [activeTab]);

  return (
    <div className="bg-white border-b border-[#E5E4DF] sticky top-14 z-30 transition-colors w-full max-w-full">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-2 space-y-2">
        
        {/* Streamlined Single-Row Location Filter Bar: All 50 States › State › County + Unified Search | Category + Sub-View */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 min-w-0">
          
          {/* Left: Location Selectors + One Unified Search Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                onSelectState('all');
                onSelectCounty('all');
                onSelectCity('all');
                onSelectAccount(null);
                setAccountFilterQuery('');
              }}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedState === 'all'
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-[#F8F7F4] hover:bg-[#F1EFEA] text-[#374151] border-[#E5E4DF]'
              }`}
              title="Reset to All 50 US States and DC"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All 50 States</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />

            {/* 1. STATE DROPDOWN */}
            <select
              aria-label="Filter by State"
              value={selectedState}
              onChange={(e) => {
                const nextState = e.target.value;
                onSelectState(nextState);
                setAccountFilterQuery('');
              }}
              className={`h-8 border rounded-lg px-2.5 text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] transition-all w-[155px] sm:w-[175px] truncate shrink-0 cursor-pointer ${
                selectedState !== 'all'
                  ? 'bg-[#1E3A8A]/10 border-[#1E3A8A] text-[#1E3A8A]'
                  : 'bg-[#F8F7F4] hover:bg-white border-[#E5E4DF] text-[#111827]'
              }`}
            >
              <option value="all">Pick a State (50)...</option>
              {allStates.map(s => (
                <option key={s.code} value={s.code}>
                  {s.state} ({s.code})
                </option>
              ))}
            </select>

            <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] hidden sm:inline shrink-0" />

            {/* 2. COUNTY DROPDOWN */}
            <select
              aria-label="Filter by County"
              value={resolvedSelectedCounty}
              onChange={(e) => {
                const nextCounty = e.target.value;
                onSelectCounty(nextCounty);
                setAccountFilterQuery('');
              }}
              disabled={selectedState === 'all'}
              className={`h-8 border rounded-lg px-2.5 text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] disabled:opacity-45 transition-all w-[155px] sm:w-[185px] truncate shrink-0 cursor-pointer ${
                selectedCounty !== 'all'
                  ? 'bg-[#1E3A8A]/10 border-[#1E3A8A] text-[#1E3A8A]'
                  : 'bg-[#F8F7F4] hover:bg-white border-[#E5E4DF] text-[#111827]'
              }`}
            >
              <option value="all">
                {selectedState === 'all'
                  ? 'Select State First'
                  : `All ${availableCounties.length} Counties`}
              </option>
              {availableCounties.map(county => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>

            {/* Active City Chip (if drilled down to a specific city) */}
            {selectedCity !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCity('all')}
                className="h-8 px-2.5 rounded-lg bg-[#1E3A8A]/10 border border-[#1E3A8A] text-[#1E3A8A] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="Click to clear city filter"
              >
                <MapPin className="w-3 h-3" />
                <span>{selectedCity}</span>
                <span className="text-[11px] font-bold">×</span>
              </button>
            )}

            {/* 3. SINGLE UNIFIED SEARCH INPUT (Zero collision with right-side buttons) */}
            <div className="relative min-w-[160px] max-w-[280px] flex-1">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={accountFilterQuery}
                onChange={(e) => setAccountFilterQuery(e.target.value)}
                placeholder={
                  selectedCounty !== 'all'
                    ? `Search ${resolvedSelectedCounty} depts or cities...`
                    : selectedState !== 'all'
                      ? `Search ${selectedState} depts, counties or ZIP...`
                      : 'Search dept, city, county or ZIP...'
                }
                className="w-full h-8 bg-[#F8F7F4] focus:bg-white border border-[#E5E4DF] rounded-lg pl-8 pr-6 text-xs text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#1E3A8A] transition-all"
              />
              {accountFilterQuery && (
                <button
                  type="button"
                  onClick={() => setAccountFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B7280] hover:text-[#111827] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Right: EMS/Fire Segmented Toggle + Contextual Sub-View Switcher + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* EMS / Fire Filter */}
            <div className="flex items-center gap-0.5 bg-[#F1EFEA] p-0.5 rounded-lg border border-[#E5E4DF] shrink-0" title="Filter by EMS Providers or Fire Departments">
              <button
                onClick={() => onSelectCategory('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white text-[#111827] shadow-2xs'
                    : 'text-[#374151] hover:text-[#111827]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSelectCategory('ems')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === 'ems'
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'text-[#374151] hover:text-[#1E3A8A]'
                }`}
              >
                <Siren className="w-3 h-3" />
                <span>EMS</span>
              </button>
              <button
                onClick={() => onSelectCategory('fire')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === 'fire'
                    ? 'bg-[#111827] text-white shadow-2xs'
                    : 'text-[#374151] hover:text-[#111827]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Fire</span>
              </button>
            </div>

            {/* Integrated Contextual Sub-View Pills */}
            {subViewOptions.length > 0 && (
              <div className="flex items-center gap-0.5 bg-[#F1EFEA] p-0.5 rounded-lg border border-[#E5E4DF] shrink-0">
                {subViewOptions.map((sub) => {
                  const isSubActive =
                    activeTab === sub.id ||
                    (sub.id === 'states_directory' && activeTab === 'geo') ||
                    (sub.id === 'gis' && activeTab === 'map');
                  return (
                    <button
                      key={sub.id}
                      onClick={() => onNavigateTab(sub.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSubActive
                          ? 'bg-[#111827] text-white shadow-2xs'
                          : 'text-[#374151] hover:text-[#111827]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}

            {(selectedState !== 'all' || selectedCounty !== 'all' || selectedCity !== 'all' || selectedCategory !== 'all' || activeAccount || accountFilterQuery) && (
              <button
                onClick={() => {
                  onSelectState('all');
                  onSelectCounty('all');
                  onSelectCity('all');
                  onSelectCategory('all');
                  onSelectAccount(null);
                  setAccountFilterQuery('');
                }}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#374151] bg-[#F8F7F4] hover:bg-[#F1EFEA] border border-[#E5E4DF] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Reset all location and category filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Instant Search Matches Strip (Only appears when typing a search query) */}
        {accountFilterQuery.trim().length >= 2 && (
          <div className="pt-2 border-t border-[#E5E4DF] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[#6B7280]">Quick Jump to Department:</span>
              {matchingAccounts.slice(0, 4).map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    onSelectAccount(acc);
                    setAccountFilterQuery('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F8F7F4] hover:bg-[#1E3A8A] hover:text-white border border-[#E5E4DF] text-[#111827] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{acc.name}</span>
                  <span className="text-[11px] opacity-75">({acc.city}, {acc.stateCode})</span>
                </button>
              ))}
            </div>

            {matchingCities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#6B7280]">Cities:</span>
                {matchingCities.map(mc => (
                  <button
                    key={`${mc.stateCode}-${mc.county}-${mc.city}`}
                    type="button"
                    onClick={() => handleJumpToCity(mc)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-[#F1EFEA] border border-[#E5E4DF] text-[#111827] font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#1E3A8A]" />
                    <span>{mc.city}, {mc.stateCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
