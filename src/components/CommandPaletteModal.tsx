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
  BarChart3,
  Sliders
} from 'lucide-react';
import { Agency } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onNavigateTab: (tab: string) => void;
  onOpenWeightTuner?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  agencies,
  onSelectAgency,
  onNavigateTab,
  onOpenWeightTuner
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter agencies with early exit for instant search across 17,066+ EMS & Fire profiles
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
    { id: 'knowledge', title: 'Go to Clinical & Competitive Knowledge Hub (5-Yr TCO & FDA Recalls)', subtitle: 'Competitor TCO calculator, FDA MAUDE recalls, Sourcewell/NPPGov contracts & HCPCS/GADCS', icon: FileText },
    { id: 'pulseiq_adjust', title: 'Tune PulseIQ Predictive Algorithm & Score Adjustment', subtitle: 'Adjust 5-pillar weights (Fleet Age, Denials, Cardiac, AFG Grants, Software Whitespace)', icon: Sliders },
    { id: 'queue', title: 'Go to Territory Lead Queue', subtitle: 'View ranked predictive opportunities across 50 states', icon: Layers },
    { id: 'geo', title: 'Go to 50 States & Zips Directory', subtitle: 'Drill down all states, counties, cities and zip codes', icon: Globe },
    { id: 'gis', title: 'Go to GIS Hotspots & Risk Maps', subtitle: 'Explore cardiac clusters & transport latency', icon: MapPin },
    { id: 'pulseiq', title: 'Go to PulseIQ Comparative Breakdown (Recharts)', subtitle: 'Compare PulseIQ scores across regions for selected state or county', icon: BarChart3 },
    { id: 'contracts', title: 'Go to Rival Contract Expirations', subtitle: 'Stryker & Philips replacement timeline', icon: Calendar },
    { id: 'claims', title: 'Go to CMS Enrollment & Claims', subtitle: 'Live NPI acceptance testing & billing analysis', icon: Activity },
    { id: 'resilience', title: 'Go to Cloud Backup & Resilience', subtitle: 'Signed-in write, read, conflict & restore testing', icon: Cloud },
    { id: 'gateway', title: 'Go to Nationwide Ingestion Gateway', subtitle: '50-state ETL & municipal procurement monitor', icon: Server }
  ].filter(t => !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.subtitle.toLowerCase().includes(query.toLowerCase()));

  const allItems = [
    ...quickNavTabs.map(t => ({ type: 'nav' as const, item: t })),
    ...filteredAgencies.map(a => ({ type: 'agency' as const, item: a }))
  ];

  const handleSelectNavTab = (tabId: string) => {
    if (tabId === 'pulseiq_adjust') {
      if (onOpenWeightTuner) {
        onOpenWeightTuner();
      }
    } else {
      onNavigateTab(tabId);
    }
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 p-4 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type an agency, city, state, competitor brand, or workspace tab..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 text-xs">
          
          {/* Quick Navigation Items */}
          {quickNavTabs.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspace Commands & Views
            </div>
          )}

          {quickNavTabs.map((nav, idx) => {
            const isSelected = selectedIndex === idx;
            const Icon = nav.icon;
            return (
              <button
                key={nav.id}
                onClick={() => handleSelectNavTab(nav.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  isSelected ? 'bg-sky-50 text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{nav.title}</div>
                    <div className="text-[11px] text-slate-400">{nav.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}

          {/* Agencies Items */}
          {filteredAgencies.length > 0 && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Agency Accounts ({filteredAgencies.length})
            </div>
          )}

          {filteredAgencies.map((agency, idx) => {
            const globalIndex = quickNavTabs.length + idx;
            const isSelected = selectedIndex === globalIndex;
            return (
              <button
                key={agency.id}
                onClick={() => {
                  onSelectAgency(agency);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  isSelected ? 'bg-sky-50 text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    agency.zollOpportunity.pulseIqScore >= 90
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {agency.zollOpportunity.pulseIqScore}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{agency.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({agency.stateCode})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Fleet: {agency.installedFleet.defibBrand}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono">${(agency.zollOpportunity.projectedPipelineValue / 1000).toLocaleString()}K Pipeline</span>
                    </div>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Open Dossier →
                </span>
              </button>
            );
          })}

          {allItems.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No matching accounts or commands found for "{query}".
            </div>
          )}

        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-700">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-700">↓</kbd></span>
          <span>Select with <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">ENTER</kbd></span>
        </div>

      </div>
    </div>
  );
};
