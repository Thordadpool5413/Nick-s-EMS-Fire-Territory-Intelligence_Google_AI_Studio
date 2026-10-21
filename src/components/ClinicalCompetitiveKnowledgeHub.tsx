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
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] grid grid-cols-1 gap-5 min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] items-start xl:items-center justify-between gap-4 border-b border-slate-100 pb-4 min-w-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A8A]">
              <span>Clinical, Regulatory &amp; Financial Reference Center</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">FDA MAUDE · CMS HCPCS · Sourcewell / NPPGov</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
              Clinical &amp; Competitive Knowledge Hub
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Authoritative 5-year competitor TCO &amp; preventative maintenance modeling, verified FDA recall intelligence, pre-competed cooperative purchasing vehicles, and procedure-level HCPCS / GADCS billing analytics.
            </p>
          </div>

          {/* Active Benchmark Agency Picker */}
          {referenceAgency && (
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 shrink-0">
              <div className="text-xs">
                <label htmlFor="hub-agency-select" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Benchmark Agency Account
                </label>
                <select
                  id="hub-agency-select"
                  value={referenceAgency.id}
                  onChange={(e) => handleAgencyChange(e.target.value)}
                  className="mt-0.5 h-8 bg-white border border-slate-200 rounded px-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1E3A8A] max-w-[260px]"
                >
                  {agencies.slice(0, 80).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.stateCode}) — {a.installedFleet.defibBrand}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onSelectAgency(referenceAgency)}
                className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:border-[#1E3A8A] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                Open Dossier
              </button>

              {onOpenRfpGenerator && (
                <button
                  onClick={() => onOpenRfpGenerator(referenceAgency)}
                  className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E3A8A] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>RFP + TCO Spec</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plain-English Navigation Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tco', label: '1. 5-Year Cost & Maintenance Savings Calculator', icon: Calculator },
            { id: 'recalls', label: '2. Competitor FDA Safety Recalls & Talk Tracks', icon: ShieldAlert },
            { id: 'coop', label: '3. Fast-Track Cooperative Contracts (Skip RFP)', icon: FileCheck2 },
            { id: 'hcpcs_protocols', label: '4. Medicare Billing Codes & Hospital Protocols', icon: Stethoscope }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as HubSection)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-2xs'
                    : 'bg-[#F8F7F4] text-[#374151] hover:text-[#111827] hover:bg-[#F1EFEA] border border-[#E5E4DF]'
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
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1E3A8A]" />
                <span>Interactive Competitor TCO &amp; Preventative Maintenance Comparison Engine</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare multi-year OEM ProCare/service contracts, battery replacement cycles, electrode standardization, and trade-in credits.
              </p>
            </div>

            <button
              onClick={() => handleCopyText('tco-brief', buildTcoBriefText())}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0F172A] hover:bg-[#1E3A8A] text-white transition-colors cursor-pointer"
            >
              {copiedKey === 'tco-brief' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'tco-brief' ? 'Copied TCO Brief' : 'Copy Executive TCO Brief'}</span>
            </button>
          </div>

          {/* Interactive Parameter Controls */}
          <div className="p-5 bg-slate-50/70 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                1. Incumbent Competitor Hardware Line
              </label>
              <select
                value={selectedIntelId}
                onChange={(e) => setSelectedIntelId(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
              >
                {COMPETITOR_HARDWARE_INTEL.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.incumbentModel} → vs. {item.zollEquivalent}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Status: <strong className="text-amber-700">{tcoModel.matchedIntel.eolStatus}</strong> · {tcoModel.matchedIntel.fdaRecallId}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-[#0F172A]">
                  2. Frontline Fleet Unit Count
                </label>
                <span className="font-mono font-bold text-sm text-[#1E3A8A] tabular-nums">
                  {customUnits} Units
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={120}
                value={customUnits}
                onChange={(e) => setCustomUnits(Number(e.target.value))}
                className="w-full accent-[#1E3A8A] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>2 Units (Rural)</span>
                <span>25 Units (Municipal)</span>
                <span>120 Units (Metro)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                3. Municipal Budget Lifecycle Horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map(yr => (
                  <button
                    key={yr}
                    onClick={() => setLifecycleYears(yr)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      lifecycleYears === yr
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {yr}-Year TCO
                  </button>
                ))}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Includes OEM trade-in credit of <strong className="font-mono text-emerald-700">${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()}/unit</strong>
              </div>
            </div>
          </div>

          {/* Executive Summary KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 bg-white">
            <div className="p-4">
              <div className="text-[11px] font-medium text-slate-500">
                {tcoModel.years}-Yr Incumbent Operating Cost
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1">
                ${tcoModel.incumbentOperatingTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {tcoModel.incumbentModel} ({tcoModel.unitCount} units)
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-medium text-slate-500">
                {tcoModel.years}-Yr ZOLL Net Operating Cost
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                ${tcoModel.zollNetOperatingTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                After ${tcoModel.totalTradeInCredit.toLocaleString()} fleet trade-in credit
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-medium text-slate-500">
                Direct Maintenance &amp; Battery Savings
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                +${tcoModel.fiveYearOperatingSavings.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Lower annual biomedical &amp; consumable spend
              </div>
            </div>

            <div className="p-4 bg-slate-50/60">
              <div className="text-[11px] font-semibold text-[#1E3A8A]">
                Total {tcoModel.years}-Year Net Lifecycle Advantage
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                ${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                ${Math.round(tcoModel.totalSavingsIncludingTradeIn / tcoModel.unitCount).toLocaleString()} total savings per vehicle
              </div>
            </div>
          </div>

          {/* Granular Line-Item Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Lifecycle Cost Driver ({tcoModel.years} Years · {tcoModel.unitCount} Units)</th>
                  <th className="py-3 px-4 text-right">Incumbent: {tcoModel.incumbentModel}</th>
                  <th className="py-3 px-4 text-right">ZOLL: {tcoModel.zollModel}</th>
                  <th className="py-3 px-4 text-right">Net Municipal Savings</th>
                  <th className="py-3 px-4">Clinical &amp; Biomedical Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    1. OEM Preventive Maintenance &amp; Service Contracts
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${tcoModel.incumbentServiceTotal.toLocaleString()}
                    <div className="text-[10px] text-slate-400">${tcoModel.matchedIntel.incumbentAnnualServicePerUnit.toLocaleString()}/unit/yr</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A] font-semibold">
                    ${tcoModel.zollServiceTotal.toLocaleString()}
                    <div className="text-[10px] text-slate-400">${tcoModel.matchedIntel.zollAnnualServicePerUnit.toLocaleString()}/unit/yr</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    +${(tcoModel.incumbentServiceTotal - tcoModel.zollServiceTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Caps annual OEM biomedical calibration &amp; loaner coverage; avoids incumbent legacy service escalators.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    2. Smart Lithium-Ion Battery Fleet Replacements
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${tcoModel.incumbentBatteryTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A] font-semibold">
                    ${tcoModel.zollBatteryTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    +${(tcoModel.incumbentBatteryTotal - tcoModel.zollBatteryTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    ZOLL SurePower II high-capacity smart batteries provide runtime calibration telemetry, reducing premature discard.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    3. Resuscitation Electrodes, Capnography &amp; Sensors
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${tcoModel.incumbentConsumablesTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A] font-semibold">
                    ${tcoModel.zollConsumablesTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    +${(tcoModel.incumbentConsumablesTotal - tcoModel.zollConsumablesTotal).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Unified OneStep CPR resuscitation electrodes integrate pacing, defib, and Real CPR Help depth sensor in one pad.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 bg-emerald-50/30">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    4. Retired Competitor Hardware Trade-In Credit
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-400">
                    $0
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                    -${tcoModel.totalTradeInCredit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    +${tcoModel.totalTradeInCredit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Guaranteed Sourcewell / NPPGov trade-in rebate of ${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()} per retired incumbent unit.
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs">
                  <td className="py-3.5 px-4 text-[#0F172A]">
                    TOTAL {tcoModel.years}-YEAR FLEET OPERATING &amp; TRADE-IN SUMMARY
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-700">
                    ${tcoModel.incumbentOperatingTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A]">
                    ${tcoModel.zollNetOperatingTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 text-sm">
                    +${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
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
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <span>Competitive FDA MAUDE Recalls, End-of-Life (EOL) &amp; Clinical Engineering Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified regulatory recall histories, obsolescence timelines, and clinical engineering differentiation for displacement presentations.
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
                  className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {(['ALL', 'Stryker', 'Philips', 'Hamilton'] as const).map(mfg => (
                <button
                  key={mfg}
                  onClick={() => setManufacturerFilter(mfg)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    manufacturerFilter === mfg
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mfg === 'ALL' ? 'All Competitors' : mfg}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredRecalls.map(item => (
              <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-sm text-[#0F172A]">{item.incumbentModel}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-600">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono font-semibold text-rose-700">{item.fdaRecallId}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-semibold text-amber-700">{item.eolStatus}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1E3A8A]">
                      Replacement: {item.zollEquivalent}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(
                          item.id,
                          `${item.incumbentModel} (${item.fdaRecallId} - ${item.eolStatus}): ${item.fdaRecallSummary} Clinical Gap: ${item.clinicalVulnerability} ZOLL Advantage (${item.zollEquivalent}): ${item.zollClinicalAdvantage}`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] cursor-pointer"
                    >
                      {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                      <span>{copiedKey === item.id ? 'Copied Brief' : 'Copy Battlecard'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-rose-700">
                      FDA Recall &amp; Obsolescence Risk
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {item.fdaRecallSummary}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {item.eolTimelineNote}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-slate-100 lg:pl-4">
                    <div className="text-[11px] font-semibold text-amber-700">
                      Clinical &amp; Operational Vulnerability
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {item.clinicalVulnerability}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-slate-100 lg:pl-4">
                    <div className="text-[11px] font-semibold text-emerald-700">
                      ZOLL Clinical &amp; Financial Advantage ({item.zollEquivalent})
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {item.zollClinicalAdvantage}
                    </p>
                    <div className="mt-1.5 font-mono text-[11px] text-[#0F172A] font-semibold">
                      Service Savings: ${(item.incumbentAnnualServicePerUnit - item.zollAnnualServicePerUnit).toLocaleString()}/unit/yr · Trade-In: ${item.zollTradeInCreditPerUnit.toLocaleString()}/unit
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
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1E3A8A]" />
                <span>Pre-Competed Cooperative Purchasing Contracts &amp; Grant Vehicles</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized national cooperative master agreements enabling municipal Fire &amp; EMS agencies to bypass 6-to-9 month sealed RFP cycles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Contract Vehicle &amp; ID</th>
                  <th className="py-3 px-4">Eligible Municipal Agencies</th>
                  <th className="py-3 px-4">Discount Ceiling &amp; Terms</th>
                  <th className="py-3 px-4">Procurement Time Saved</th>
                  <th className="py-3 px-4">Legal Piggyback Exemption Clause</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {COOPERATIVE_CONTRACTS.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/80 align-top">
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#0F172A]">{contract.contractName}</div>
                      <div className="font-mono font-semibold text-[#1E3A8A] mt-0.5">{contract.contractNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Valid thru {contract.expirationDate}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 max-w-xs">
                      {contract.eligibleAgencies}
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-700 max-w-xs">
                      {contract.discountCeiling}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#0F172A]">
                      {contract.rfpMonthsSaved}
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-md leading-relaxed">
                      {contract.piggybackClauseText}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleCopyText(contract.id, `${contract.contractNumber}: ${contract.piggybackClauseText}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] cursor-pointer"
                      >
                        {copiedKey === contract.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                        <span>{copiedKey === contract.id ? 'Copied Clause' : 'Copy Clause'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: HCPCS FEE SCHEDULE, CMS GADCS 10% PENALTY & REGIONAL CLINICAL PROTOCOLS */}
      {activeSection === 'hcpcs_protocols' && hcpcsModel && protocolModel && referenceAgency && (
        <div className="space-y-6">
          {/* HCPCS & GADCS Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>Granular HCPCS Ambulance Fee Schedule &amp; CMS GADCS 10% Penalty Risk — {referenceAgency.name}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Procedure-level reimbursement breakdown across {referenceAgency.annual911Transports.toLocaleString()} annual transports and CMS Ground Ambulance Data Collection System (GADCS) audit exposure.
                </p>
              </div>

              <div className="text-xs font-mono bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-lg font-semibold">
                GADCS 10% Medicare Penalty Exposure: -${hcpcsModel.gadcs.gadcs10PctPenaltyExposure.toLocaleString()}/yr ({hcpcsModel.gadcs.cohortWave})
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">HCPCS Code</th>
                    <th className="py-3 px-4">Procedure &amp; Clinical Trigger</th>
                    <th className="py-3 px-4 text-right">CMS Base Rate</th>
                    <th className="py-3 px-4 text-right">Est. Annual Claims</th>
                    <th className="py-3 px-4 text-right">Gross Annual Billing</th>
                    <th className="py-3 px-4 text-right">Denial Exposure</th>
                    <th className="py-3 px-4">ZOLL Automated Documentation Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {hcpcsModel.procedures.map(proc => (
                    <tr key={proc.code} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">{proc.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A]">{proc.descriptor}</div>
                        <div className="text-[11px] text-slate-500">{proc.clinicalTrigger}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        ${proc.nationalMedicareBaseRate.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A] font-semibold">
                        {proc.estimatedAnnualClaims.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0F172A] font-semibold">
                        ${proc.grossAnnualBilling.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-700 font-semibold">
                        -${proc.annualRevenueAtRisk.toLocaleString()}
                        <div className="text-[10px] text-slate-400">{proc.denialRiskPct}% risk</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        {proc.zollDocumentationMitigation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Regional Clinical Protocols & Receiving Hospital Network */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Regional EMS Clinical Protocols &amp; Receiving Hospital Telemetry Alignment</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Primary Receiving Center: <strong className="text-[#0F172A]">{protocolModel.receivingHospitalNetwork}</strong> · Target: {protocolModel.stemiDoorToBalloonTarget}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Regional Clinical Protocol</th>
                    <th className="py-3 px-4">Clinical Target Benchmark</th>
                    <th className="py-3 px-4">Incumbent Fleet Limitation</th>
                    <th className="py-3 px-4">ZOLL Enabling Clinical Technology</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {protocolModel.protocols.map(proto => (
                    <tr key={proto.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{proto.protocolName}</div>
                        <div className="text-[11px] text-slate-500">{proto.governingStandard}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs">{proto.clinicalTargetMetric}</td>
                      <td className="py-3.5 px-4 text-rose-800 max-w-xs">{proto.incumbentHardwareGap}</td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-sm">{proto.zollEnablingTechnology}</td>
                      <td className="py-3.5 px-4 text-right font-semibold whitespace-nowrap">
                        <span className={proto.agencyComplianceStatus === 'Standardized' ? 'text-emerald-700' : 'text-amber-700'}>
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
