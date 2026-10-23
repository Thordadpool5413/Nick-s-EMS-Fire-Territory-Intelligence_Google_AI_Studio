/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { 
  COMPETITOR_HARDWARE_INTEL, 
  CompetitorHardwareIntel,
  calculateAgencyFleetTco 
} from '../data/clinicalAndCompetitiveIntelligence';
import { 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Activity, 
  ArrowRight, 
  HelpCircle,
  FileWarning,
  Zap,
  Check
} from 'lucide-react';

interface CompetitiveBattlecardViewProps {
  agency: Agency;
  variant?: 'compact' | 'full';
  onOpenFullProfile?: (agency: Agency) => void;
  className?: string;
}

export const CompetitiveBattlecardView: React.FC<CompetitiveBattlecardViewProps> = ({
  agency,
  variant = 'compact',
  onOpenFullProfile,
  className = ''
}) => {
  const initialIntel = useMemo(() => {
    return calculateAgencyFleetTco(agency, 5).matchedIntel;
  }, [agency]);

  const [selectedIntelId, setSelectedIntelId] = useState<string>(initialIntel.id);

  const activeIntel = useMemo(() => {
    return COMPETITOR_HARDWARE_INTEL.find(i => i.id === selectedIntelId) || initialIntel;
  }, [selectedIntelId, initialIntel]);

  const unitCount = Math.max(4, agency.installedFleet?.defibUnitsCount || 8);
  const fiveYrTco = useMemo(() => {
    return calculateAgencyFleetTco(agency, 5, unitCount, activeIntel.id);
  }, [agency, unitCount, activeIntel]);

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-left transition-all ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#0F172A] dark:bg-slate-800 text-white shrink-0 shadow-xs">
              <Scale className="w-3.5 h-3.5" />
            </span>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Head-to-Head Battlecard: {activeIntel.incumbentModel} vs {activeIntel.zollEquivalent}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Competitive intelligence · {activeIntel.category}
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            {activeIntel.eolStatus}
          </span>
        </div>

        {/* Side-by-Side Spec Comparison */}
        <div className="grid grid-cols-2 gap-2.5 my-2.5 text-xs">
          {/* Incumbent Column */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Incumbent: {activeIntel.incumbentModel.split(' ')[0]}
              </span>
              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
              {activeIntel.clinicalVulnerability}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Annual Service:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">${activeIntel.incumbentAnnualServicePerUnit}/unit/yr</strong>
            </div>
          </div>

          {/* ZOLL Column */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#1D4ED8] dark:text-blue-400 uppercase tracking-wide">
                ZOLL: {activeIntel.zollEquivalent.split(' ')[0]} {activeIntel.zollEquivalent.split(' ')[1]}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
              {activeIntel.zollClinicalAdvantage}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-400 flex justify-between">
              <span>Trade-In Value:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">${activeIntel.zollTradeInCreditPerUnit}/unit credit</strong>
            </div>
          </div>
        </div>

        {/* FDA Recall & 5-Yr TCO Delta Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <FileWarning className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{activeIntel.fdaRecallClass}:</span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[240px]">{activeIntel.fdaRecallId}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +${Math.round(fiveYrTco.totalSavingsIncludingTradeIn / 1000)}K Total 5-Yr Net Savings
            </span>
            {onOpenFullProfile && (
              <button
                onClick={() => onOpenFullProfile(agency)}
                className="text-[#1D4ED8] dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Battlecard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FULL-SCREEN VARIANT
  return (
    <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-left ${className}`}>
      {/* Top Header & Product Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/20 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Competitive Battlecard & Head-to-Head Spec Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side clinical, regulatory, and total lifecycle cost comparison for {agency.name}
            </p>
          </div>
        </div>

        {/* Product Category Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start md:self-auto overflow-x-auto max-w-full">
          {COMPETITOR_HARDWARE_INTEL.map((intel) => {
            const isSelected = intel.id === activeIntel.id;
            return (
              <button
                key={intel.id}
                onClick={() => setSelectedIntelId(intel.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isSelected 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {intel.incumbentModel.split(' ')[0]} {intel.incumbentModel.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* FDA Recall & Regulatory Alert Callout */}
      <div className="my-5 p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                Regulatory Alert: {activeIntel.fdaRecallClass}
              </span>
              <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">
                {activeIntel.fdaRecallId}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Status: {activeIntel.eolStatus}
              </span>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
              {activeIntel.fdaRecallSummary}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              {activeIntel.eolTimelineNote}
            </p>
          </div>
        </div>
      </div>

      {/* Head-to-Head Specification Matrix */}
      <div className="overflow-x-auto my-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-1/4">Feature / Vector</th>
              <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-3/8 text-rose-700 dark:text-rose-400">
                Incumbent: {activeIntel.incumbentModel}
              </th>
              <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-3/8 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                ZOLL Equivalent: {activeIntel.zollEquivalent}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">Clinical Capability</td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeIntel.clinicalVulnerability}
              </td>
              <td className="py-3 px-4 text-slate-800 dark:text-slate-100 bg-blue-50/30 dark:bg-blue-950/10 font-medium leading-relaxed">
                {activeIntel.zollClinicalAdvantage}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">Annual Preventative Service</td>
              <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                ${activeIntel.incumbentAnnualServicePerUnit}/unit/yr (+15% YoY escalation)
              </td>
              <td className="py-3 px-4 font-mono text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/10 font-semibold tabular-nums">
                ${activeIntel.zollAnnualServicePerUnit}/unit/yr (Fixed 5-Yr Price Cap)
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">5-Yr Battery Lifecycle Cost</td>
              <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                ${activeIntel.incumbentBattery5YrCostPerUnit}/unit (Frequent replacement)
              </td>
              <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10 font-semibold tabular-nums">
                ${activeIntel.zollBattery5YrCostPerUnit}/unit (Smart battery management)
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">Fleet Trade-In Credit</td>
              <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                $0 (Stryker proprietary lock-in)
              </td>
              <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10 font-bold tabular-nums">
                ${activeIntel.zollTradeInCreditPerUnit}/unit guaranteed credit
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">Total 5-Yr Fleet Impact ({unitCount} Units)</td>
              <td className="py-3 px-4 font-mono text-rose-700 dark:text-rose-400 font-semibold tabular-nums">
                ${fiveYrTco.incumbentOperatingTotal.toLocaleString()} operating cost
              </td>
              <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10 font-bold text-sm tabular-nums">
                +${fiveYrTco.totalSavingsIncludingTradeIn.toLocaleString()} Net 5-Yr Savings
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trap Questions & Field Objections */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          Field Battlecard Traps & Objection Handling for {activeIntel.incumbentModel}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              When Chief Says: "We're comfortable renewing our Stryker ProCare service agreement"
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              <strong>TM Response:</strong> "Chief, ProCare contracts on {activeIntel.incumbentModel} typically escalate +14%–18% annually as parts become obsolete. Over 5 years across {unitCount} units, you will spend ${fiveYrTco.incumbentServiceTotal.toLocaleString()} just keeping legacy hardware certified. That same budget pays for a brand new ZOLL fleet under Sourcewell with ${fiveYrTco.totalTradeInCredit.toLocaleString()} in immediate cash trade-in credits."
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              When Medical Director Says: "All defibrillators do the same thing"
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              <strong>TM Response:</strong> "Doctor, only ZOLL X Series Advanced gives your paramedics Real BVM Help with real-time breath-by-breath tidal volume and rate indicators right on screen. Hyperventilation is documented in over 80% of pre-hospital cardiac arrests; ZOLL actively guides the medic to prevent gastric insufflation and hypotension."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
