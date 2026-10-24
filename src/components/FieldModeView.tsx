/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency, SyncOutboxItem, FieldNote, LeadStage } from '../types';
import { ZOLL_PRODUCTS } from '../data/zollProducts';
import { 
  Car, 
  Phone, 
  MapPin, 
  Navigation, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle2, 
  Send, 
  ExternalLink, 
  Sparkles, 
  FileText,
  ChevronRight,
  ShieldAlert,
  Award,
  RefreshCw,
  Download,
  Printer
} from 'lucide-react';

interface FieldModeViewProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  onUpdateStage: (agencyId: string, stage: LeadStage) => void;
  isOnline: boolean;
  toggleNetwork: () => void;
  outbox: SyncOutboxItem[];
  triggerManualSync: () => void;
  isSyncing: boolean;
  activeAccount?: Agency | null;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  onNavigateTab?: (tab: string) => void;
}

export const FieldModeView: React.FC<FieldModeViewProps> = ({
  agencies,
  onSelectAgency,
  onAddFieldNote,
  onUpdateStage,
  isOnline,
  toggleNetwork,
  outbox,
  triggerManualSync,
  isSyncing,
  activeAccount,
  onNavigateTab
}) => {
  const [quickNoteAgencyId, setQuickNoteAgencyId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickAction, setQuickAction] = useState('Follow up with Chief next week');
  const [activeBattlecard, setActiveBattlecard] = useState<string>('x-series-advanced');

  const dayRouteAgencies = agencies.filter(a => a.inDayRoute);

  const openMapRouteUrl = dayRouteAgencies.length > 0
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent([dayRouteAgencies[0].name, dayRouteAgencies[0].address].filter(Boolean).join(', '))}`
    : '';

  const handleExportRouteCsv = () => {
    const targetList = dayRouteAgencies.length > 0 ? dayRouteAgencies : agencies.slice(0, 50);
    const headers = [
      'Stop #',
      'Department Name',
      'Category',
      'Street Address',
      'City',
      'County',
      'State',
      'ZIP Code',
      'Command Official',
      'Title',
      'Official Website',
      'OpenStreetMap Link',
      'Installed Defib Brand',
      'Defib Units',
      'Priority Score'
    ];
    const rows = targetList.map((a, idx) => {
      const chief = a.keyContacts.find(c => c.role.includes('Chief')) || a.keyContacts[0];
      const mapsLink = a.mapSearchUri || `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${a.name}, ${a.address}`)}`;
      return [
        idx + 1,
        `"${(a.name || '').replace(/"/g, '""')}"`,
        a.providerCategory || (a.agencyType.toLowerCase().includes('fire') ? 'FIRE' : 'EMS'),
        `"${(a.address || '').replace(/"/g, '""')}"`,
        `"${(a.city || '').replace(/"/g, '""')}"`,
        `"${(a.county || '').replace(/"/g, '""')}"`,
        a.stateCode,
        a.zipCode,
        `"${(chief?.name || '').replace(/"/g, '""')}"`,
        `"${(chief?.title || '').replace(/"/g, '""')}"`,
        `"${(a.officialWebsite || '').replace(/"/g, '""')}"`,
        `"${mapsLink.replace(/"/g, '""')}"`,
        `"${(a.installedFleet.defibBrand || '').replace(/"/g, '""')}"`,
        a.installedFleet.defibUnitsCount,
        a.zollOpportunity.pulseIqScore
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `territory-route-call-sheet-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickLog = (agencyId: string) => {
    if (!quickNoteText.trim()) return;

    onAddFieldNote(agencyId, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Sarah Jenkins (TM)',
      meetingType: 'On-Site Station Visit',
      notes: quickNoteText.trim(),
      nextAction: quickAction,
      dueDate: '2026-10-28'
    });

    setQuickNoteText('');
    setQuickNoteAgencyId(null);
  };

  return (
    <div className="workspace-section-grid">
      
      {/* Tactical Status & Network State Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] min-w-0 ${
        isOnline 
          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800' 
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono ${
            isOnline ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
          }`}>
            {isOnline ? <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          </div>

          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Field Connectivity Mode
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isOnline ? 'Cloud Synchronized' : 'Offline Field Cache Active'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                isOnline ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              }`}>
                {isOnline ? 'LIVE SYNC' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isOnline 
                ? 'All field changes (visit notes, stage updates, day routes) are synced directly with central CRM.' 
                : 'Full account data and playbooks remain available. Outbox transactions will auto-sync upon reconnection.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={toggleNetwork}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isOnline 
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700' 
                : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
            }`}
          >
            {isOnline ? 'Simulate Offline' : 'Reconnect Cloud'}
          </button>

          {outbox.length > 0 && (
            <button
              onClick={triggerManualSync}
              disabled={isSyncing || !isOnline}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {outbox.length} Pending</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Route Stops */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-start xl:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 min-w-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
              <span>Today's Field Route Itinerary</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              User-selected station sequence. Confirm addresses, official websites, map lookup, and rapid field notes logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dayRouteAgencies.length > 0 && (
              <a
                href={openMapRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1E3A8A] text-white hover:bg-[#111827] dark:hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Search first selected stop on OpenStreetMap; multi-stop navigation is not currently integrated"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Find First Stop</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              type="button"
              onClick={handleExportRouteCsv}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Download CSV Territory Call Sheet"
            >
              <Download className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
              <span>Export Call Sheet (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Print Territory Route Call Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Print Sheet</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('3d_studio')}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] dark:bg-blue-600 text-white hover:bg-[#1E3A8A] dark:hover:bg-blue-500 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Launch Interactive 3D Apparatus & Monitor Studio"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>3D Equipment Demo</span>
              </button>
            )}

            <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
              {dayRouteAgencies.length} stops planned
            </div>
          </div>
        </div>

        {dayRouteAgencies.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {dayRouteAgencies.map((agency, index) => {
              const isLogging = quickNoteAgencyId === agency.id;
              const chief = agency.keyContacts.find(c => c.role.includes('Chief')) || agency.keyContacts[0];

              return (
                <div key={agency.id} className="py-4 first:pt-3 last:pb-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            {agency.name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.2 rounded-md">
                            Score: {agency.zollOpportunity.pulseIqScore}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 font-medium">
                          <span>{agency.address}</span>
                          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                          <span>Target: <strong className="text-slate-800 dark:text-slate-200">{agency.zollOpportunity.primaryTargetProduct}</strong></span>
                        </div>

                        {chief && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{chief.name} ({chief.title})</span>
                            <a
                              href={agency.mapSearchUri || `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 font-semibold inline-flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                              <span>OpenStreetMap Lookup</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setQuickNoteAgencyId(isLogging ? null : agency.id)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isLogging 
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isLogging ? 'Close Log' : 'Quick Log'}</span>
                      </button>

                      <button
                        onClick={() => onSelectAgency(agency)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
                      >
                        Dossier
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Visit Form */}
                  {isLogging && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Rapid Post-Visit Logger for {agency.name}
                      </div>

                      <textarea
                        rows={2}
                        value={quickNoteText}
                        onChange={(e) => setQuickNoteText(e.target.value)}
                        placeholder="Chief confirmed interest in Real BVM Help trial. Left 2 evaluation brochures..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
                      />

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <input
                          type="text"
                          value={quickAction}
                          onChange={(e) => setQuickAction(e.target.value)}
                          placeholder="Next action..."
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 flex-1 focus:outline-none focus:border-sky-500 shadow-sm"
                        />

                        <button
                          onClick={() => handleQuickLog(agency.id)}
                          className="min-h-[38px] px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Save &amp; Queue Sync</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Car className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">No agencies scheduled for today's route</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Go to the Lead Queue or Territory Map and click "Add to Day Route" on prioritized high-scoring agencies.
            </p>
          </div>
        )}
      </div>

      {/* Field Battlecards Cheat Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Field Rep Rapid Clinical &amp; Financial Battlecards
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Key clinical talking points, competitor displacement arguments, and CMS billing facts for quick station bay conversations.
        </p>

        {/* Product Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.values(ZOLL_PRODUCTS).map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveBattlecard(p.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                activeBattlecard === p.id 
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {p.name.split(' ')[0]} {p.name.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Battlecard Card */}
        {ZOLL_PRODUCTS[activeBattlecard] && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <div className="text-xs font-mono text-sky-700 dark:text-sky-400 font-semibold uppercase tracking-wider">
                {ZOLL_PRODUCTS[activeBattlecard].category}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {ZOLL_PRODUCTS[activeBattlecard].name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                "{ZOLL_PRODUCTS[activeBattlecard].tagline}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="font-bold text-sky-900 dark:text-sky-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Clinical &amp; Technical Differentiators</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {ZOLL_PRODUCTS[activeBattlecard].keyDifferentiators.map((diff, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-sky-600 dark:text-sky-400 font-bold">&bull;</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Competitor Displacements &amp; CMS Angle</span>
                </div>
                <div className="space-y-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold uppercase tracking-wider">Displaces Competitors:</span>
                    <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                      {ZOLL_PRODUCTS[activeBattlecard].displacementTargets.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-semibold uppercase tracking-wider">CMS Reimbursement Impact:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {ZOLL_PRODUCTS[activeBattlecard].cmsBenefit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Field Route Sheet Print Styling */}
      <style>{`
        @media print {
          nav, header, button, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 12px !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
