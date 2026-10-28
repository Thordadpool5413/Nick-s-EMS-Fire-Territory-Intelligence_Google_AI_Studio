/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Activity, 
  FileText, 
  Sparkles, 
  X,
  Server,
  Cloud,
  Layers,
  Globe,
  BarChart3
} from 'lucide-react';
import { Agency } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { formatCurrency } from '../utils/formatters';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onNavigateTab: (tab: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  agencies,
  onSelectAgency,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close command palette on click-away or Escape
  useClickOutside(modalRef, onClose, { enabled: isOpen, closeOnEscape: true });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter agencies with early exit for instant search across all EMS & Fire profiles
  const filteredAgencies = React.useMemo(() => {
    if (!isOpen) return [];
    if (!query.trim()) return agencies.slice(0, 10);
    const q = query.toLowerCase().trim();
    const matches: Agency[] = [];
    for (let i = 0; i < agencies.length; i++) {
      const a = agencies[i];
      if (
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.county && a.county.toLowerCase().includes(q)) ||
        (a.zipCode && a.zipCode.includes(q)) ||
        (a.npiNumber && a.npiNumber.includes(q)) ||
        (a.fdid && a.fdid.toLowerCase().includes(q)) ||
        a.state.toLowerCase().includes(q) ||
        a.stateCode.toLowerCase() === q ||
        a.installedFleet.defibBrand.toLowerCase().includes(q) ||
        (a.installedFleet?.dispatchCadVendor && a.installedFleet.dispatchCadVendor.toLowerCase().includes(q)) ||
        a.keyContacts.some(c => c.name.toLowerCase().includes(q))
      ) {
        matches.push(a);
        if (matches.length >= 12) break;
      }
    }
    return matches;
  }, [isOpen, agencies, query]);

  if (!isOpen) return null;

  const quickNavTabs = [
    { id: 'home', title: '1. Territory & Home Explorer (50 States & Live Maps)', subtitle: 'Browse all 50 states, 3,144 counties, or switch to live Google Maps', icon: Globe },
    { id: 'queue', title: '2. Priority Accounts Queue (Ranked Opportunities)', subtitle: 'Ranked EMS & Fire replacement targets by PulseIQ™ score and pipeline stage', icon: Layers },
    { id: 'knowledge', title: '3. ROI, Grants & TCO Hub (Calculator, AFG & Recalls)', subtitle: '5-year TCO calculator, OpenFEMA AFG awards, FDA recalls & Sourcewell contracts', icon: FileText },
    { id: 'field', title: '4. Field & 3D Demo Ops (Driving Routes & 3D Fleet)', subtitle: 'Multi-stop station itineraries, offline field notes & 3D apparatus staging', icon: MapPin },
    { id: 'google_maps', title: 'Google Maps Live Territory Explorer', subtitle: 'Satellite, terrain & street views with station pins', icon: MapPin },
    { id: 'pulseiq', title: 'PulseIQ™ Analytics & Regional Benchmarks', subtitle: 'Compare opportunity scores across regions and counties', icon: BarChart3 },
    { id: 'data_health', title: 'Data Health & Cloud Sync Verification', subtitle: 'Real-time Firestore sync status & federal registry lineage', icon: Cloud }
  ].filter(t => !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.subtitle.toLowerCase().includes(query.toLowerCase()));

  const allItems = [
    ...filteredAgencies.map(a => ({ type: 'agency' as const, item: a })),
    ...quickNavTabs.map(t => ({ type: 'nav' as const, item: t }))
  ];

  const handleSelectNavTab = (tabId: string) => {
    onNavigateTab(tabId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'nav') {
          handleSelectNavTab(current.item.id);
        } else {
          onSelectAgency(current.item);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
      >
        
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search any agency name, city, county, state, 10-digit NPI, or monitor brand..."
            className="w-full text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
            ESC
          </span>
        </div>

        {/* Results List (Agencies First for Instant Lookup) */}
        <div className="max-h-[420px] overflow-y-auto p-2 space-y-1 text-xs">
          
          {/* Agencies Items */}
          {filteredAgencies.length > 0 && (
            <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Matching Agencies ({filteredAgencies.length})</span>
              <span>PulseIQ™ · Fleet · Pipeline</span>
            </div>
          )}

          {filteredAgencies.map((agency, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={agency.id}
                onClick={() => {
                  onSelectAgency(agency);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    title={`PulseIQ Score: ${agency.zollOpportunity.pulseIqScore}/100`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs tabular-nums shrink-0 ${
                      agency.zollOpportunity.pulseIqScore >= 88
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {agency.zollOpportunity.pulseIqScore}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                      <span className="truncate">{agency.name}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
                        {agency.city}, {agency.stateCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{agency.installedFleet.defibBrand} ({agency.installedFleet.defibAgeYears} yrs)</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatCurrency(agency.zollOpportunity.projectedPipelineValue)} pipeline
                      </span>
                      {agency.npiNumber && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="font-mono text-[10px] text-slate-400">NPI {agency.npiNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-xs text-[#285EE8] dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0 ml-2">
                  Open Summary →
                </span>
              </button>
            );
          })}

          {/* Quick Navigation Items */}
          {quickNavTabs.length > 0 && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              4 Primary Navigation Pillars &amp; Tools
            </div>
          )}

          {quickNavTabs.map((nav, idx) => {
            const globalIndex = filteredAgencies.length + idx;
            const isSelected = selectedIndex === globalIndex;
            const Icon = nav.icon;
            return (
              <button
                key={nav.id}
                onClick={() => handleSelectNavTab(nav.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{nav.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{nav.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </button>
            );
          })}

          {allItems.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No matching agencies, NPI numbers, or tools found for &ldquo;{query}&rdquo;.
            </div>
          )}

        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>Use <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">↓</kbd> to navigate</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">ENTER</kbd> to open account or tool</span>
        </div>

      </div>
    </div>
  );
};
