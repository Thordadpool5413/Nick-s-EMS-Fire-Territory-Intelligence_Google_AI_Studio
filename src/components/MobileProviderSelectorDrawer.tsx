import React, { useState, useMemo } from 'react';
import { Agency, PriorityTier } from '../types';
import { 
  Search, 
  X, 
  Siren, 
  Flame, 
  MapPin, 
  ArrowRight, 
  Filter, 
  Bookmark, 
  Navigation,
  Activity,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';

interface MobileProviderSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onToggleBookmark?: (agencyId: string) => void;
  onToggleRoute?: (agencyId: string) => void;
  activeCategory: 'all' | 'ems' | 'fire';
  onCategoryChange: (category: 'all' | 'ems' | 'fire') => void;
  selectedState?: string;
  onSelectState?: (stateCode: string) => void;
  selectedCounty?: string;
  onSelectCounty?: (county: string) => void;
}

export const MobileProviderSelectorDrawer: React.FC<MobileProviderSelectorDrawerProps> = ({
  isOpen,
  onClose,
  agencies,
  onSelectAgency,
  onToggleBookmark,
  onToggleRoute,
  activeCategory,
  onCategoryChange,
  selectedState = 'all',
  onSelectState,
  selectedCounty = 'all',
  onSelectCounty
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'pulseIq' | 'fleetAge' | 'calls' | 'name'>('pulseIq');
  const [localCategory, setLocalCategory] = useState<'all' | 'ems' | 'fire'>(activeCategory);
  const [localState, setLocalState] = useState<string>(selectedState);
  const [localCounty, setLocalCounty] = useState<string>(selectedCounty);

  // Sync props when opening
  React.useEffect(() => {
    if (isOpen) {
      setLocalCategory(activeCategory);
      setLocalState(selectedState);
      setLocalCounty(selectedCounty);
    }
  }, [isOpen, activeCategory, selectedState, selectedCounty]);

  // Available counties for selected state
  const countiesInState = useMemo(() => {
    if (!localState || localState === 'all') return [];
    return territoryEngine.getCountiesForState(localState.toUpperCase()).map(c => c.countyName).sort();
  }, [localState]);

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    let pool = agencies;

    // Category filter
    if (localCategory !== 'all') {
      pool = pool.filter(a => {
        const isFire = a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire');
        return localCategory === 'fire' ? isFire : !isFire;
      });
    }

    // State filter
    if (localState && localState !== 'all') {
      const targetState = localState.trim().toUpperCase();
      pool = pool.filter(a => (a.stateCode || '').trim().toUpperCase() === targetState);
    }

    // County filter
    if (localCounty && localCounty !== 'all') {
      const targetCounty = localCounty.trim().toLowerCase();
      pool = pool.filter(a => (a.county || '').trim().toLowerCase().includes(targetCounty));
    }

    // Search query
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      pool = pool.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.county.toLowerCase().includes(q) ||
        (a.zipCode && a.zipCode.includes(q)) ||
        (a.fdid && a.fdid.toLowerCase().includes(q)) ||
        (a.npiNumber && a.npiNumber.includes(q))
      );
    }

    // Sort
    const sorted = [...pool].sort((a, b) => {
      if (sortBy === 'pulseIq') {
        return (b.zollOpportunity?.pulseIqScore || 0) - (a.zollOpportunity?.pulseIqScore || 0);
      }
      if (sortBy === 'fleetAge') {
        return (b.installedFleet?.defibAgeYears || 0) - (a.installedFleet?.defibAgeYears || 0);
      }
      if (sortBy === 'calls') {
        return (b.annualCallVolume || 0) - (a.annualCallVolume || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [agencies, localCategory, localState, localCounty, searchTerm, sortBy]);

  // Counts for tabs
  const categoryCounts = useMemo(() => {
    let base = agencies;
    if (localState && localState !== 'all') {
      const targetState = localState.trim().toUpperCase();
      base = base.filter(a => (a.stateCode || '').trim().toUpperCase() === targetState);
    }
    const ems = base.filter(a => !(a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire'))).length;
    const fire = base.filter(a => a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire')).length;
    return { all: base.length, ems, fire };
  }, [agencies, localState]);

  if (!isOpen) return null;

  const handleApplyCategory = (cat: 'all' | 'ems' | 'fire') => {
    setLocalCategory(cat);
    onCategoryChange(cat);
  };

  const handleSelectStateCode = (st: string) => {
    setLocalState(st);
    setLocalCounty('all');
    if (onSelectState) onSelectState(st);
    if (onSelectCounty) onSelectCounty('all');
  };

  const handleSelectCountyName = (county: string) => {
    setLocalCounty(county);
    if (onSelectCounty) onSelectCounty(county);
  };

  const handleSelectProvider = (agency: Agency) => {
    onSelectAgency(agency);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-finder-title"
    >
      {/* Background touch dismiss */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Sheet Container */}
      <div className="relative z-10 w-full max-h-[92vh] flex flex-col bg-white dark:bg-[#0B1728] rounded-t-2xl shadow-2xl border-t border-[#DFE6EF] dark:border-[#1E2D42] overflow-hidden">
        
        {/* Grab Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 id="mobile-finder-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#285EE8]" />
              Find &amp; Select Provider
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant mobile lookup for EMS agencies and Fire departments
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close provider search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0E1B2E] space-y-3 shrink-0">
          
          {/* 1. Large Touch Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agency name, city, county, ZIP..."
              className="w-full h-11 pl-10 pr-9 rounded-xl text-sm font-medium bg-white dark:bg-[#111C2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#285EE8] focus:border-transparent transition-all shadow-xs"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Tactile EMS vs Fire Discipline Toggle (Large Touch Targets >= 44px) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleApplyCategory('all')}
              className={`h-10 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                localCategory === 'all'
                  ? 'bg-white dark:bg-[#285EE8] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="text-[11px] opacity-75 font-mono">({categoryCounts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCategory('ems')}
              className={`h-10 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                localCategory === 'ems'
                  ? 'bg-[#285EE8] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Siren className="w-3.5 h-3.5 shrink-0" />
              <span>EMS</span>
              <span className="text-[11px] opacity-75 font-mono">({categoryCounts.ems})</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCategory('fire')}
              className={`h-10 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                localCategory === 'fire'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>Fire</span>
              <span className="text-[11px] opacity-75 font-mono">({categoryCounts.fire})</span>
            </button>
          </div>

          {/* 3. Geographic Selector (State & County Dropdowns) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                State
              </label>
              <select
                value={localState}
                onChange={(e) => handleSelectStateCode(e.target.value)}
                className="w-full h-9 rounded-lg bg-white dark:bg-[#111C2D] border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 px-2.5 focus:outline-none focus:ring-1 focus:ring-[#285EE8]"
              >
                <option value="all">All 50 States</option>
                {Object.entries(ALL_50_STATES_SUMMARIES)
                  .sort((a, b) => a[1].state.localeCompare(b[1].state))
                  .map(([code, s]) => (
                    <option key={code} value={code}>
                      {code} - {s.state}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                County
              </label>
              <select
                value={localCounty}
                onChange={(e) => handleSelectCountyName(e.target.value)}
                disabled={localState === 'all'}
                className="w-full h-9 rounded-lg bg-white dark:bg-[#111C2D] border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 px-2.5 focus:outline-none focus:ring-1 focus:ring-[#285EE8] disabled:opacity-50"
              >
                <option value="all">All Counties</option>
                {countiesInState.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Found <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">{filteredAgencies.length}</strong> {localCategory === 'fire' ? 'fire departments' : localCategory === 'ems' ? 'EMS agencies' : 'providers'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="pulseIq">PulseIQ Score</option>
              <option value="fleetAge">Oldest Fleet</option>
              <option value="calls">Call Volume</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[220px]">
          {filteredAgencies.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">No matching providers found</div>
              <p className="text-xs">Try clearing search text or expanding the state/county filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  handleApplyCategory('all');
                  handleSelectStateCode('all');
                }}
                className="mt-2 px-4 py-2 rounded-lg bg-[#285EE8] text-white text-xs font-semibold hover:bg-[#194BC8] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredAgencies.slice(0, 100).map((agency) => {
              const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
              const pulseIq = agency.zollOpportunity?.pulseIqScore || 80;
              const fleetAge = agency.installedFleet?.defibAgeYears || 7;
              const units = agency.installedFleet?.defibUnitsCount || 4;
              const brand = agency.installedFleet?.defibBrand || 'Competitor';

              return (
                <div
                  key={agency.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] hover:border-[#285EE8] dark:hover:border-[#285EE8] transition-all shadow-2xs flex flex-col gap-2.5"
                >
                  {/* Top Line: Category Badge + Score */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isFire 
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                    }`}>
                      {isFire ? <Flame className="w-3 h-3 shrink-0" /> : <Siren className="w-3 h-3 shrink-0" />}
                      <span>{isFire ? 'Fire Department' : 'EMS Provider'}</span>
                    </span>

                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
                      <span className="text-[10px] font-normal text-slate-400">PulseIQ</span>
                      <span className="text-[#285EE8] dark:text-blue-400 font-bold">{pulseIq}</span>
                      <span className="text-slate-400 font-normal">/100</span>
                    </span>
                  </div>

                  {/* Agency Name & Location */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider(agency)}
                    className="text-left group cursor-pointer"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#285EE8] transition-colors line-clamp-1">
                      {agency.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>{agency.city}, {agency.stateCode} · {agency.county}</span>
                    </div>
                  </button>

                  {/* Equipment Snippet */}
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Fleet:</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{units}× {brand}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Age:</span>{' '}
                      <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{fleetAge} yrs</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(agency.id)}
                        className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                          agency.isBookmarked
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-[#285EE8] border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-slate-700'
                        }`}
                        title={agency.isBookmarked ? 'Saved to bookmarks' : 'Bookmark account'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${agency.isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {onToggleRoute && (
                      <button
                        type="button"
                        onClick={() => onToggleRoute(agency.id)}
                        className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                          agency.inDayRoute
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-slate-700'
                        }`}
                        title={agency.inDayRoute ? 'In day route' : 'Add to route planner'}
                      >
                        <Navigation className={`w-3.5 h-3.5 ${agency.inDayRoute ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectProvider(agency)}
                      className="flex-1 h-9 rounded-lg bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-auto"
                    >
                      <span>Open Account 360</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#070F1C] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Tap any provider to open complete dossier</span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#285EE8]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
