import React from 'react';
import { Search, Siren, Flame, MapPin, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { Agency } from '../types';

interface MobileQuickProviderBarProps {
  globalCategory: 'all' | 'ems' | 'fire';
  setGlobalCategory: (cat: 'all' | 'ems' | 'fire') => void;
  onOpenProviderFinder: () => void;
  globalState?: string;
  globalCounty?: string;
  onClearGeography?: () => void;
  agencies?: Agency[];
}

export const MobileQuickProviderBar: React.FC<MobileQuickProviderBarProps> = ({
  globalCategory,
  setGlobalCategory,
  onOpenProviderFinder,
  globalState = 'all',
  globalCounty = 'all',
  onClearGeography,
  agencies = []
}) => {
  // Count agencies in current geographic scope
  const counts = React.useMemo(() => {
    let base = agencies;
    if (globalState && globalState !== 'all') {
      base = base.filter(a => (a.stateCode || '').trim().toUpperCase() === globalState.trim().toUpperCase());
    }
    if (globalCounty && globalCounty !== 'all') {
      base = base.filter(a => (a.county || '').trim().toLowerCase().includes(globalCounty.trim().toLowerCase()));
    }
    const ems = base.filter(a => !(a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire'))).length;
    const fire = base.filter(a => a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire')).length;
    return { all: base.length, ems, fire };
  }, [agencies, globalState, globalCounty]);

  const hasGeography = globalState !== 'all' || globalCounty !== 'all';

  return (
    <div 
      className="md:hidden w-full bg-white dark:bg-[#0E1B2E] border-b border-[#DFE6EF] dark:border-[#1E2D42] px-3.5 py-2.5 space-y-2 select-none shadow-2xs"
      role="region"
      aria-label="Mobile Provider Filter Bar"
    >
      {/* 1. Fast Search & Select Trigger + Geography Indicator */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenProviderFinder}
          className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#16243A] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          title="Search and select an EMS agency or Fire department"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-[#285EE8] shrink-0" />
            <span className="truncate">
              {globalCategory === 'fire' ? 'Find Fire Department...' : globalCategory === 'ems' ? 'Find EMS Agency...' : 'Find EMS or Fire Provider...'}
            </span>
          </span>
          <span className="text-[10px] font-semibold text-[#285EE8] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 shrink-0">
            Select &rarr;
          </span>
        </button>

        {hasGeography && (
          <button
            type="button"
            onClick={onClearGeography}
            className="h-10 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[#285EE8] dark:text-blue-400 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
            title="Reset geography to All States"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-[70px] truncate">{globalState}</span>
            <span className="text-[10px] opacity-75">✕</span>
          </button>
        )}
      </div>

      {/* 2. Tactile 3-Way Category Switcher (Large 44px Touch Targets) */}
      <div 
        className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[#070F1C] rounded-xl border border-slate-200 dark:border-[#1E2D42]"
        role="group"
        aria-label="Provider Discipline Selector"
      >
        <button
          type="button"
          onClick={() => setGlobalCategory('all')}
          className={`min-h-[40px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            globalCategory === 'all'
              ? 'bg-white dark:bg-[#1E2D42] text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>All</span>
          <span className="text-[10px] font-mono tabular-nums opacity-70">
            {counts.all > 0 ? `(${counts.all})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setGlobalCategory('ems')}
          className={`min-h-[40px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            globalCategory === 'ems'
              ? 'bg-[#285EE8] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Siren className="w-3.5 h-3.5 shrink-0" />
          <span>EMS</span>
          <span className="text-[10px] font-mono tabular-nums opacity-75">
            {counts.ems > 0 ? `(${counts.ems})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setGlobalCategory('fire')}
          className={`min-h-[40px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            globalCategory === 'fire'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 shrink-0" />
          <span>Fire</span>
          <span className="text-[10px] font-mono tabular-nums opacity-75">
            {counts.fire > 0 ? `(${counts.fire})` : ''}
          </span>
        </button>
      </div>
    </div>
  );
};
