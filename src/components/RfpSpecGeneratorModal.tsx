/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { Agency } from '../types';
import { calculateAgencyFleetTco } from '../data/clinicalAndCompetitiveIntelligence';
import { X, Copy, Check, Download, FileText, ShieldCheck } from 'lucide-react';

interface RfpSpecGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
}

export const RfpSpecGeneratorModal: React.FC<RfpSpecGeneratorModalProps> = ({
  isOpen,
  onClose,
  agency
}) => {
  const [includeRealBvm, setIncludeRealBvm] = useState<boolean>(true);
  const [includeAutoPulse, setIncludeAutoPulse] = useState<boolean>(true);
  const [includeTbiDashboard, setIncludeTbiDashboard] = useState<boolean>(true);
  const [includeSourcewellCoop, setIncludeSourcewellCoop] = useState<boolean>(true);
  const [includeFiveYearTcoCap, setIncludeFiveYearTcoCap] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const tcoModel = useMemo(() => calculateAgencyFleetTco(agency, 5), [agency]);
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Close modal on click-away or Escape key
  useClickOutside(modalCardRef, onClose, { enabled: isOpen, closeOnEscape: true });

  if (!isOpen) return null;

  const rfpText = `
REQUEST FOR PROPOSAL (RFP) TECHNICAL SPECIFICATION & 5-YEAR TCO ADDENDUM
SUBJECT: PRE-HOSPITAL RESUSCITATION & ADVANCED CARDIAC LIFE SUPPORT (ACLS) FLEET REPLACEMENT
AGENCY: ${agency.name.toUpperCase()} (${agency.city}, ${agency.stateCode})
DATE OF ISSUANCE: OCTOBER 2026

SECTION 1. MANDATORY CLINICAL & TECHNICAL SPECIFICATIONS

1.1 PHYSICAL ERGONOMICS & WEIGHT RESTRICTION
- The monitor/defibrillator shall not exceed 12.0 pounds (5.4 kg) fully equipped with operational battery and paper roll, to minimize cumulative lifting strain and firefighter/paramedic workplace back injuries.
- The unit must feature an ingress protection rating of at least IP55 for water and particulate dust resistance during adverse weather operations.

1.2 VENTILATION QUALITY & REAL-TIME FEEDBACK (REAL BVM HELP)
${includeRealBvm ? `- MANDATORY SPECIFICATION: The monitor/defibrillator MUST provide real-time, breath-by-breath feedback on BOTH ventilation rate and delivered tidal volume (mL).
- The display must incorporate an active ventilation target bar graph and audible alerts notifying the clinician of hyperventilation or hypoventilation in real time during adult and pediatric cardiac arrest, in compliance with AHA resuscitation guidelines. Point solutions providing rate-only or waveform-only feedback without tidal volume target indicators are NOT acceptable.` : '- Standard capnography ETCO2 waveform monitoring.'}

1.3 MECHANICAL CPR SYSTEM (CIRCUMFERENTIAL LOAD-DISTRIBUTING BAND)
${includeAutoPulse ? `- MANDATORY SPECIFICATION: Any mechanical chest compression system deployed must utilize a wide, non-invasive Load-Distributing Band (LDB) that compresses the entire anterior and lateral chest wall evenly.
- The device must maintain continuous, unbroken compressions down multi-story stairwells, around 90-degree corners, and during active emergency vehicle transit without displacement. Focal point piston devices that concentrate compressive forces on a single sternal point are prohibited due to chest trauma risks and slippage during stair extrication.` : '- Standard mechanical chest compression system.'}

1.4 TRAUMATIC BRAIN INJURY (TBI) CLINICAL PROTOCOL DASHBOARD
${includeTbiDashboard ? `- MANDATORY SPECIFICATION: The unit must incorporate a dedicated Traumatic Brain Injury (TBI) dashboard enforcing pre-hospital EPIC (Excellence in Prehospital Injury Care) protocol parameters.
- The system must provide persistent visual alerts whenever systolic blood pressure drops below 90 mmHg, oxygen saturation drops below 90%, or ETCO2 deviates from the 35–45 mmHg therapeutic window, to prevent secondary ischemic brain injury in trauma victims.` : '- Standard trauma monitoring parameter alerts.'}

1.5 CELLULAR & WI-FI HOSPITAL TRANSMISSION
- The unit must support integrated multi-carrier 4G/5G cellular and Wi-Fi transmission of diagnostic 12-lead STEMI ECGs directly to receiving percutaneous coronary intervention (PCI) cardiac catheterization laboratories (${agency.gisData?.primaryReceivingHospital || `${agency.city} Regional STEMI Center`}) without requiring external dongles or paired mobile phones.

SECTION 2. 5-YEAR TOTAL COST OF OWNERSHIP (TCO) & PREVENTIVE MAINTENANCE CAP
${includeFiveYearTcoCap ? `Bidders must guarantee a 60-month (5-year) ceiling on preventive maintenance, smart battery lifecycle replacements, and resuscitation electrode standardization across ${tcoModel.unitCount} frontline units:
- Incumbent Baseline (${tcoModel.incumbentModel} — ${tcoModel.matchedIntel.fdaRecallId}):
  * 5-Yr OEM Preventive Maintenance: $${tcoModel.incumbentServiceTotal.toLocaleString()}
  * 5-Yr Battery & Consumable Spend: $${(tcoModel.incumbentBatteryTotal + tcoModel.incumbentConsumablesTotal).toLocaleString()}
  * Total 5-Yr Incumbent Operating Cost: $${tcoModel.incumbentOperatingTotal.toLocaleString()}
- Mandatory ZOLL Benchmark Cap (${tcoModel.zollModel}):
  * 5-Yr OEM Preventive Maintenance Cap: $${tcoModel.zollServiceTotal.toLocaleString()} ($${tcoModel.matchedIntel.zollAnnualServicePerUnit.toLocaleString()}/unit/yr)
  * 5-Yr Smart Battery & Standardized OneStep Consumables: $${(tcoModel.zollBatteryTotal + tcoModel.zollConsumablesTotal).toLocaleString()}
  * Guaranteed Retired Hardware Trade-In Credit: -$${tcoModel.totalTradeInCredit.toLocaleString()} ($${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()}/unit)
  * Net 5-Year Municipal TCO Lifecycle Savings: +$${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}` : 'Standard annual OEM biomedical maintenance pricing applies.'}

SECTION 3. APPROVED COOPERATIVE PURCHASING EXEMPTION CLAUSE
${includeSourcewellCoop ? `In accordance with municipal procurement policy and state joint exercise of powers statutes, ${agency.name} reserves the right to expedite procurement and bypass 6-to-9 month sealed bid delays by purchasing under active, competitively solicited national master purchasing agreements:
- Sourcewell Master Contract #041823-ZOL (EMS & Rescue Equipment, Advanced Defibrillators, and Mechanical Resuscitation)
- NPPGov / FireRescue GPO Master Agreement #PS20210-ZOL (Public Safety & Medical Resuscitation Fleet)
- HGACBuy Cooperative Purchasing Agreement #EE08-24 (Emergency Medical Apparatus & Telemetry)
All published municipal volume discounts, 5-year comprehensive on-site warranty caps, and manufacturer trade-in allowances ($${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()} per retired competitor monitor) shall apply directly.` : 'Procurement subject to standard municipal open sealed bid procedures.'}

SECTION 4. CLINICAL TRIAL & EVALUATION BENCHMARK
Bidders must provide two (2) complete operational test evaluation units for a mandatory 30-day clinical road trial with ${agency.name} frontline paramedic squads.
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(rfpText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([rfpText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${agency.name.replace(/[^a-zA-Z0-9]/g, '_')}_ZOLL_RFP_and_TCO_Spec.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div 
        ref={modalCardRef}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col text-[#0F172A]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#1E3A8A]" />
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Pre-Emptive RFP Specification &amp; 5-Year TCO Proposal Generator
              </h2>
              <div className="text-xs text-slate-500">
                Customized municipal procurement specification for <strong className="text-[#0F172A]">{agency.name}</strong> ({agency.city}, {agency.stateCode}) · <span className="font-mono font-semibold text-emerald-700">5-Yr Net TCO Savings: +${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRealBvm}
              onChange={(e) => setIncludeRealBvm(e.target.checked)}
              className="accent-[#1E3A8A]"
            />
            <span className="text-[#0F172A] font-semibold">Real BVM Help</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeAutoPulse}
              onChange={(e) => setIncludeAutoPulse(e.target.checked)}
              className="accent-[#1E3A8A]"
            />
            <span className="text-[#0F172A] font-semibold">AutoPulse LDB</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeTbiDashboard}
              onChange={(e) => setIncludeTbiDashboard(e.target.checked)}
              className="accent-[#1E3A8A]"
            />
            <span className="text-[#0F172A] font-semibold">EPIC TBI Spec</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeFiveYearTcoCap}
              onChange={(e) => setIncludeFiveYearTcoCap(e.target.checked)}
              className="accent-[#1E3A8A]"
            />
            <span className="text-[#0F172A] font-semibold">5-Yr TCO &amp; PM Cap</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeSourcewellCoop}
              onChange={(e) => setIncludeSourcewellCoop(e.target.checked)}
              className="accent-[#1E3A8A]"
            />
            <span className="text-[#0F172A] font-semibold">Co-Op Contracts</span>
          </label>
        </div>

        {/* Formatted Text Preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <textarea
            readOnly
            value={rfpText}
            className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono text-[#0F172A] leading-relaxed resize-none focus:outline-none"
            rows={15}
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Includes 5-year OEM preventative maintenance cap, trade-in credits, and Sourcewell / NPPGov / HGACBuy clauses.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-9 px-3.5 bg-white hover:bg-slate-50 text-[#0F172A] font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A]" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Spec & TCO Package'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="h-9 px-4 bg-[#0F172A] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
