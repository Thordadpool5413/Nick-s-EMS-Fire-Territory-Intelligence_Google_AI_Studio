/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import {
  COMPETITOR_HARDWARE_INTEL,
  COOPERATIVE_CONTRACTS,
  calculateAgencyFleetTco,
  calculateAgencyHcpcsBreakdown,
  getAgencyClinicalProtocolAlignment
} from '../data/clinicalAndCompetitiveIntelligence';
import {
  Scale,
  ShieldAlert,
  FileCheck2,
  DollarSign,
  Stethoscope,
  Copy,
  Check,
  FileText,
  Calculator,
  Search
} from 'lucide-react';
import { QualityScorecard } from './QualityScorecard';
import { formatCurrency, formatInteger, formatPercent } from '../utils/numberFormatting';

interface ClinicalCompetitiveKnowledgeHubProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
}

type HubSection = 'tco' | 'recalls' | 'coop' | 'hcpcs_protocols';

export const ClinicalCompetitiveKnowledgeHub: React.FC<ClinicalCompetitiveKnowledgeHubProps> = ({
  agencies,
  onSelectAgency,
  onOpenRfpGenerator
}) => {
  const [activeSection, setActiveSection] = useState<HubSection>('tco');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(agencies[0]?.id || '');
  const [selectedIntelId, setSelectedIntelId] = useState<string>(COMPETITOR_HARDWARE_INTEL[0].id);
  const [customUnits, setCustomUnits] = useState<number>(18);
  const [lifecycleYears, setLifecycleYears] = useState<number>(5);
  const [manufacturerFilter, setManufacturerFilter] = useState<'ALL' | 'Stryker' | 'Philips' | 'Hamilton'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const referenceAgency = useMemo(() => {
    return agencies.find(a => a.id === selectedAgencyId) || agencies[0];
  }, [agencies, selectedAgencyId]);

  const handleAgencyChange = (newId: string) => {
    setSelectedAgencyId(newId);
    const found = agencies.find(a => a.id === newId);
    if (found) {
      const units = Math.max(
        4,
        (found.installedFleet?.alsMonitorsCount || 8) +
          Math.round((found.installedFleet?.blsDefibsCount || 4) * 0.5)
      );
      setCustomUnits(units);
      const brandLower = (found.installedFleet?.defibBrand || '').toLowerCase();
      if (brandLower.includes('35')) {
        setSelectedIntelId('lp35-intel');
      } else if (brandLower.includes('philips') || brandLower.includes('mrx') || brandLower.includes('tempus')) {
        setSelectedIntelId('philips-mrx-tempus');
      } else {
        setSelectedIntelId('lp15-intel');
      }
    }
  };

  const tcoModel = useMemo(() => {
    if (!referenceAgency) return null;
    return calculateAgencyFleetTco(referenceAgency, lifecycleYears, customUnits, selectedIntelId);
  }, [referenceAgency, lifecycleYears, customUnits, selectedIntelId]);

  const hcpcsModel = useMemo(() => {
    if (!referenceAgency) return null;
    return calculateAgencyHcpcsBreakdown(referenceAgency);
  }, [referenceAgency]);

  const protocolModel = useMemo(() => {
    if (!referenceAgency) return null;
    return getAgencyClinicalProtocolAlignment(referenceAgency);
  }, [referenceAgency]);

  const filteredRecalls = useMemo(() => {
    return COMPETITOR_HARDWARE_INTEL.filter(item => {
      if (manufacturerFilter !== 'ALL' && item.manufacturer !== manufacturerFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.incumbentModel.toLowerCase().includes(q) ||
        item.fdaRecallId.toLowerCase().includes(q) ||
        item.fdaRecallSummary.toLowerCase().includes(q) ||
        item.zollEquivalent.toLowerCase().includes(q)
      );
    });
  }, [manufacturerFilter, searchQuery]);

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const buildTcoBriefText = () => {
    if (!tcoModel || !referenceAgency) return '';
    return [
      `EXECUTIVE ${tcoModel.years}-YEAR TOTAL COST OF OWNERSHIP (TCO) & MAINTENANCE BRIEF`,
      `Account: ${referenceAgency.name} (${referenceAgency.city}, ${referenceAgency.stateCode})`,
      `Fleet Size Evaluated: ${tcoModel.unitCount} Frontline Units | Horizon: ${tcoModel.years} Years`,
      `Comparison: ${tcoModel.incumbentModel} vs. ${tcoModel.zollModel}`,
      `-------------------------------------------------------------------------`,
      `1. Preventive Maintenance / Service Contracts (${tcoModel.years} Yrs):`,
      `   - Incumbent (${tcoModel.incumbentModel}): $${tcoModel.incumbentServiceTotal.toLocaleString()}`,
      `   - ${tcoModel.zollModel}: $${tcoModel.zollServiceTotal.toLocaleString()}`,
      `2. Smart Battery Lifecycle Replacements (${tcoModel.years} Yrs):`,
      `   - Incumbent Fleet: $${tcoModel.incumbentBatteryTotal.toLocaleString()}`,
      `   - ZOLL SurePower / Smart Battery Fleet: $${tcoModel.zollBatteryTotal.toLocaleString()}`,
      `3. Electrode Pad & Sensor Standardization (${tcoModel.years} Yrs):`,
      `   - Incumbent Consumables: $${tcoModel.incumbentConsumablesTotal.toLocaleString()}`,
      `   - ZOLL Standardized OneStep / Real BVM Consumables: $${tcoModel.zollConsumablesTotal.toLocaleString()}`,
      `4. OEM Trade-In Allowance Applied: -$${tcoModel.totalTradeInCredit.toLocaleString()} ($${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()}/unit)`,
      `-------------------------------------------------------------------------`,
      `NET ${tcoModel.years}-YEAR LIFECYCLE SAVINGS WITH ZOLL: $${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}`,
      `Pre-Competed Cooperative Vehicle: Sourcewell #041823-ZOL / NPPGov #PS20210-ZOL`
    ].join('\n');
  };

  return (
    <div className="workspace-section-grid">
      {/* Top Executive Header & Benchmark Account Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] grid grid-cols-1 gap-5 min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-start xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 min-w-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#1E3A8A] dark:text-blue-400">
              <span>Clinical &amp; competitive intelligence</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-slate-500 dark:text-slate-400">FDA MAUDE &middot; CMS HCPCS &middot; Sourcewell / NPPGov</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-[650] tracking-tight text-slate-900 dark:text-white mt-1">
              Clinical &amp; competitive knowledge hub
            </h1>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Multi-year competitor TCO &amp; maintenance modeling, verified FDA recall intelligence, cooperative purchasing vehicles, and procedure-level HCPCS clinical quality analytics.
            </p>
          </div>

          {/* Active Benchmark Agency Picker */}
          {referenceAgency && (
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 shrink-0">
              <div className="text-xs">
                <label htmlFor="hub-agency-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Benchmark agency
                </label>
                <select
                  id="hub-agency-select"
                  value={referenceAgency.id}
                  onChange={(e) => handleAgencyChange(e.target.value)}
                  className="mt-0.5 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] max-w-[260px]"
                >
                  {agencies.slice(0, 80).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.stateCode}) &mdash; {a.installedFleet.defibBrand}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onSelectAgency(referenceAgency)}
                className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A] text-xs font-medium text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                Open dossier
              </button>

              {onOpenRfpGenerator && (
                <button
                  onClick={() => onOpenRfpGenerator(referenceAgency)}
                  className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>RFP spec</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plain-English Navigation Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tco', label: 'Cost & maintenance savings', icon: Calculator },
            { id: 'recalls', label: 'Safety recalls & talk tracks', icon: ShieldAlert },
            { id: 'coop', label: 'Cooperative purchasing vehicles', icon: FileCheck2 },
            { id: 'hcpcs_protocols', label: 'Quality scorecard & fee schedules', icon: Stethoscope }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as HubSection)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: INTERACTIVE 5-YEAR COMPETITOR TCO & MAINTENANCE CALCULATOR */}
      {activeSection === 'tco' && tcoModel && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Competitor TCO and maintenance comparison</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-year OEM service contracts, battery replacement cycles, electrode standardization, and trade-in credits.
              </p>
            </div>

            <button
              onClick={() => handleCopyText('tco-brief', buildTcoBriefText())}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              {copiedKey === 'tco-brief' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'tco-brief' ? 'Copied brief' : 'Copy executive brief'}</span>
            </button>
          </div>

          {/* Interactive Parameter Controls */}
          <div className="p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-medium text-slate-900 dark:text-white mb-1.5">
                Incumbent hardware line
              </label>
              <select
                value={selectedIntelId}
                onChange={(e) => setSelectedIntelId(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]"
              >
                {COMPETITOR_HARDWARE_INTEL.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.incumbentModel} &rarr; vs. {item.zollEquivalent}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Status: <strong className="text-amber-700 dark:text-amber-400 font-medium">{tcoModel.matchedIntel.eolStatus}</strong> &middot; {tcoModel.matchedIntel.fdaRecallId}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-900 dark:text-white">
                  Frontline fleet count
                </label>
                <span className="font-medium text-sm text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                  {customUnits} devices
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={120}
                value={customUnits}
                onChange={(e) => setCustomUnits(Number(e.target.value))}
                className="w-full accent-[#1E3A8A] dark:accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 tabular-nums">
                <span>2 devices (rural)</span>
                <span>25 devices (municipal)</span>
                <span>120 devices (metro)</span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-900 dark:text-white mb-1.5">
                Budget lifecycle horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map(yr => (
                  <button
                    key={yr}
                    onClick={() => setLifecycleYears(yr)}
                    className={`h-9 rounded-lg text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
                      lifecycleYears === yr
                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {yr}-year horizon
                  </button>
                ))}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Includes trade-in credit of <strong className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()} per device</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {tcoModel.years}-year incumbent operating cost
              </div>
              <div className="pi-metric-large text-rose-700 dark:text-rose-400 mt-1 leading-none">
                {formatCurrency(tcoModel.incumbentOperatingTotal, { compact: false })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pi-data-inline">
                {tcoModel.incumbentModel} ({formatInteger(tcoModel.unitCount)} devices)
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {tcoModel.years}-year ZOLL net operating cost
              </div>
              <div className="pi-metric-large text-slate-900 dark:text-white mt-1 leading-none">
                {formatCurrency(tcoModel.zollNetOperatingTotal, { compact: false })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pi-data-inline">
                After {formatCurrency(tcoModel.totalTradeInCredit, { compact: false })} fleet trade-in credit
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Direct maintenance &amp; battery savings
              </div>
              <div className="pi-metric-large text-emerald-700 dark:text-emerald-400 mt-1 leading-none">
                +{formatCurrency(tcoModel.fiveYearOperatingSavings, { compact: false })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Reduced biomedical &amp; consumable spend
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 dark:bg-slate-800/60">
              <div className="text-xs font-medium text-[#1E3A8A] dark:text-blue-400">
                Total {tcoModel.years}-year net lifecycle savings
              </div>
              <div className="pi-metric-hero text-emerald-700 dark:text-emerald-400 mt-1 leading-none">
                {formatCurrency(tcoModel.totalSavingsIncludingTradeIn, { compact: false })}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 pi-data-inline">
                {formatCurrency(Math.round(tcoModel.totalSavingsIncludingTradeIn / tcoModel.unitCount), { compact: false })} savings per vehicle
              </div>
            </div>
          </div>

          {/* Granular Line-Item Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">Lifecycle cost driver ({tcoModel.years} years &middot; {tcoModel.unitCount} devices)</th>
                  <th className="py-3 px-4 text-right">Incumbent: {tcoModel.incumbentModel}</th>
                  <th className="py-3 px-4 text-right">ZOLL: {tcoModel.zollModel}</th>
                  <th className="py-3 px-4 text-right">Net municipal savings</th>
                  <th className="py-3 px-4">Clinical &amp; biomedical justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    Preventive maintenance &amp; service contracts
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    ${tcoModel.incumbentServiceTotal.toLocaleString()}
                    <div className="text-[11px] text-slate-400 tabular-nums">${tcoModel.matchedIntel.incumbentAnnualServicePerUnit.toLocaleString()}/device/yr</div>
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                    ${tcoModel.zollServiceTotal.toLocaleString()}
                    <div className="text-[11px] text-slate-400 tabular-nums">${tcoModel.matchedIntel.zollAnnualServicePerUnit.toLocaleString()}/device/yr</div>
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    +${(tcoModel.incumbentServiceTotal - tcoModel.zollServiceTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    Caps annual biomedical calibration &amp; loaner coverage; eliminates legacy service escalators.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    Smart lithium-ion battery replacements
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    ${tcoModel.incumbentBatteryTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                    ${tcoModel.zollBatteryTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    +${(tcoModel.incumbentBatteryTotal - tcoModel.zollBatteryTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    ZOLL SurePower II smart batteries provide runtime calibration telemetry, reducing premature discard.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    Resuscitation electrodes, capnography &amp; sensors
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    ${tcoModel.incumbentConsumablesTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                    ${tcoModel.zollConsumablesTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    +${(tcoModel.incumbentConsumablesTotal - tcoModel.zollConsumablesTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    Unified OneStep CPR electrodes integrate pacing, defib, and Real CPR Help depth sensor in one pad.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    Retired competitor hardware trade-in credit
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-400">
                    $0
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    -${tcoModel.totalTradeInCredit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    +${tcoModel.totalTradeInCredit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    Sourcewell / NPPGov trade-in rebate of ${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()} per retired incumbent device.
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-xs">
                  <td className="py-3.5 px-4 text-slate-900 dark:text-white">
                    Total {tcoModel.years}-year fleet operating and trade-in summary
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    ${tcoModel.incumbentOperatingTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-semibold">
                    ${tcoModel.zollNetOperatingTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    +${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-normal">
                    {tcoModel.matchedIntel.zollClinicalAdvantage}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: FDA MAUDE RECALLS, SAFETY NOTICES & EOL REGISTRY */}
      {activeSection === 'recalls' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <span>FDA MAUDE recalls, end-of-life status &amp; clinical differentiators</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified regulatory recall histories, obsolescence timelines, and clinical engineering differentiation for replacement presentations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter recalls, models, FDA IDs..."
                  className="h-8 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {(['ALL', 'Stryker', 'Philips', 'Hamilton'] as const).map(mfg => (
                <button
                  key={mfg}
                  onClick={() => setManufacturerFilter(mfg)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    manufacturerFilter === mfg
                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {mfg === 'ALL' ? 'All manufacturers' : mfg}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredRecalls.map(item => (
              <div key={item.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{item.incumbentModel}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">&middot;</span>
                    <span className="text-slate-600 dark:text-slate-400">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">&middot;</span>
                    <span className="font-medium text-rose-700 dark:text-rose-400">{item.fdaRecallId}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">&middot;</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">{item.eolStatus}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1E3A8A] dark:text-blue-400">
                      Replacement: {item.zollEquivalent}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(
                          item.id,
                          `${item.incumbentModel} (${item.fdaRecallId} - ${item.eolStatus}): ${item.fdaRecallSummary} Clinical Gap: ${item.clinicalVulnerability} ZOLL Advantage (${item.zollEquivalent}): ${item.zollClinicalAdvantage}`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />}
                      <span>{copiedKey === item.id ? 'Copied brief' : 'Copy battlecard'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                      FDA recall &amp; obsolescence risk
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.fdaRecallSummary}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.eolTimelineNote}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-4">
                    <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Clinical &amp; operational vulnerability
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.clinicalVulnerability}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-4">
                    <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      ZOLL clinical &amp; financial advantage ({item.zollEquivalent})
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.zollClinicalAdvantage}
                    </p>
                    <div className="mt-1.5 text-xs text-slate-900 dark:text-white font-medium tabular-nums">
                      Service savings: ${(item.incumbentAnnualServicePerUnit - item.zollAnnualServicePerUnit).toLocaleString()}/device/yr &middot; Trade-in: ${item.zollTradeInCreditPerUnit.toLocaleString()}/device
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: COOPERATIVE PURCHASING & GRANT VEHICLES DIRECTORY */}
      {activeSection === 'coop' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Pre-competed cooperative purchasing contracts &amp; vehicles</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authorized national cooperative master agreements enabling municipal Fire &amp; EMS agencies to bypass sealed RFP cycles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">Contract vehicle</th>
                  <th className="py-3 px-4">Eligible agencies</th>
                  <th className="py-3 px-4">Discount terms</th>
                  <th className="py-3 px-4">Procurement time saved</th>
                  <th className="py-3 px-4">Legal piggyback clause</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {COOPERATIVE_CONTRACTS.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 align-top">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{contract.contractName}</div>
                      <div className="font-medium text-[#1E3A8A] dark:text-blue-400 mt-0.5">{contract.contractNumber}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">Valid thru {contract.expirationDate}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 max-w-xs">
                      {contract.eligibleAgencies}
                    </td>
                    <td className="py-4 px-4 font-medium text-emerald-700 dark:text-emerald-400 max-w-xs">
                      {contract.discountCeiling}
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {contract.rfpMonthsSaved}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                      {contract.piggybackClauseText}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleCopyText(contract.id, `${contract.contractNumber}: ${contract.piggybackClauseText}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {copiedKey === contract.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />}
                        <span>{copiedKey === contract.id ? 'Copied clause' : 'Copy clause'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: NEMSQA QUALITY SCORECARD, HCPCS FEE SCHEDULE, CMS GADCS 10% PENALTY & REGIONAL CLINICAL PROTOCOLS */}
      {activeSection === 'hcpcs_protocols' && hcpcsModel && protocolModel && referenceAgency && (
        <div className="space-y-6">
          {/* Interactive NEMSQA / AHA Mission: Lifeline / CARES Clinical Quality Uplift Simulator */}
          <QualityScorecard agency={referenceAgency} onOpenRfpGenerator={onOpenRfpGenerator} />

          {/* HCPCS & GADCS Table */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>HCPCS ambulance fee schedule &amp; CMS audit exposure &mdash; {referenceAgency.name}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  Procedure reimbursement breakdown across {referenceAgency.annual911Transports.toLocaleString()} annual transports and CMS Ground Ambulance Data Collection System (GADCS) exposure.
                </p>
              </div>

              <div className="text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 px-3 py-1.5 rounded-lg font-medium tabular-nums">
                GADCS 10% penalty exposure: -${hcpcsModel.gadcs.gadcs10PctPenaltyExposure.toLocaleString()}/yr ({hcpcsModel.gadcs.cohortWave})
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4">HCPCS code</th>
                    <th className="py-3 px-4">Procedure &amp; clinical trigger</th>
                    <th className="py-3 px-4 text-right">CMS base rate</th>
                    <th className="py-3 px-4 text-right">Est. annual claims</th>
                    <th className="py-3 px-4 text-right">Gross annual billing</th>
                    <th className="py-3 px-4 text-right">Denial exposure</th>
                    <th className="py-3 px-4">ZOLL documentation mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {hcpcsModel.procedures.map(proc => (
                    <tr key={proc.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-medium text-[#1E3A8A] dark:text-blue-400 tabular-nums">{proc.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{proc.descriptor}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{proc.clinicalTrigger}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        ${proc.nationalMedicareBaseRate.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                        {proc.estimatedAnnualClaims.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                        ${proc.grossAnnualBilling.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-rose-700 dark:text-rose-400 font-medium">
                        -${proc.annualRevenueAtRisk.toLocaleString()}
                        <div className="text-[11px] text-slate-400 tabular-nums">{proc.denialRiskPct}% risk</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                        {proc.zollDocumentationMitigation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Regional Clinical Protocols & Receiving Hospital Network */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                  <span>Regional EMS clinical protocols &amp; telemetry alignment</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Receiving center: <strong className="text-slate-800 dark:text-slate-200 font-medium">{protocolModel.receivingHospitalNetwork}</strong> &middot; Target: {protocolModel.stemiDoorToBalloonTarget}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4">Regional clinical protocol</th>
                    <th className="py-3 px-4">Target benchmark</th>
                    <th className="py-3 px-4">Incumbent hardware limitation</th>
                    <th className="py-3 px-4">ZOLL clinical technology</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {protocolModel.protocols.map(proto => (
                    <tr key={proto.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{proto.protocolName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{proto.governingStandard}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs">{proto.clinicalTargetMetric}</td>
                      <td className="py-3.5 px-4 text-rose-800 dark:text-rose-400 max-w-xs">{proto.incumbentHardwareGap}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-sm">{proto.zollEnablingTechnology}</td>
                      <td className="py-3.5 px-4 text-right font-medium whitespace-nowrap">
                        <span className={proto.agencyComplianceStatus === 'Standardized' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                          {proto.agencyComplianceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
