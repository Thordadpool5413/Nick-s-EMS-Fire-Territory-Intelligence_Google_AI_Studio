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
REQUEST FOR PROPOSAL (RFP) TECHNICAL SPECIFICATION & 5-YEAR ACTUARIAL TCO ADDENDUM
SUBJECT: PRE-HOSPITAL RESUSCITATION, ACLS MONITOR/DEFIBRILLATOR & NEMSIS v3.5.0 FLEET MODERNIZATION
AGENCY: ${agency.name.toUpperCase()} (${agency.city}, ${agency.stateCode} · FDID ${agency.fdid || `${agency.stateCode}-FD`} · NPI ${agency.npiNumber || 'Registered'})
DATE OF ISSUANCE: ${new Date().toISOString().split('T')[0]} (MUNICIPAL FY END: ${agency.grantStatus.fiscalYearEndMonth.toUpperCase()})

SECTION 1. MANDATORY CLINICAL, FDA & AHA ECC TECHNICAL SPECIFICATIONS

1.1 FDA 510(k) / PMA RECTILINEAR BIPHASIC WAVEFORM & AHA ECC RESUSCITATION COMPLIANCE
- The monitor/defibrillator shall utilize an FDA Premarket Approved (PMA P160022 / 510(k) K181613) high-current, low-energy Rectilinear Biphasic™ waveform (120J-150J-200J adult escalating protocol) clinically proven to achieve higher high-impedance atrial and ventricular defibrillation efficacy with reduced myocardial stunning.
- In accordance with 2020/2025 American Heart Association (AHA) Guidelines for CPR and Emergency Cardiovascular Care (ECC), the device must incorporate integrated Chest Compression Fraction (CCF) telemetry targeting CCF >80% and real-time ECG compression artifact filtering (See-Thru CPR®) to reduce peri-shock pause intervals to <10 seconds (target <3 seconds).
- The unit shall not exceed 12.0 pounds (5.4 kg) fully equipped and must hold an IP55 ingress protection rating and MIL-STD-810G shock/vibration certification.

1.2 VENTILATION QUALITY, ETCO2 CAPNOGRAPHY & REAL-TIME FEEDBACK (REAL BVM HELP®)
${includeRealBvm ? `- MANDATORY SPECIFICATION: The monitor/defibrillator MUST provide real-time, breath-by-breath numerical and visual feedback on BOTH ventilation rate (breaths/min) and delivered tidal volume (mL), alongside continuous mainstream/sidestream end-tidal CO2 (ETCO2) waveform capnography (35–45 mmHg target window per AHA ECC Guidelines).
- Point solutions providing rate-only or capnography-only feedback without direct non-invasive tidal volume (mL) quantification are non-compliant.` : '- Standard AHA-compliant continuous ETCO2 waveform capnography monitoring (35–45 mmHg target).'}

1.3 MECHANICAL CPR SYSTEM (CIRCUMFERENTIAL LOAD-DISTRIBUTING BAND — FDA 510(k) K153012)
${includeAutoPulse ? `- MANDATORY SPECIFICATION: Any mechanical chest compression system deployed must utilize a wide, non-invasive Load-Distributing Band (LDB) that compresses the entire anterior and lateral thorax evenly to maximize coronary perfusion pressure (CPP).
- The device must maintain continuous compressions down multi-story stairwells and during ambulance transport, and include a radiolucent backboard compatible with cath-lab coronary angiography fluoroscopy.` : '- Standard mechanical chest compression system.'}

1.4 TRAUMATIC BRAIN INJURY (TBI) EPIC PROTOCOL DASHBOARD
${includeTbiDashboard ? `- MANDATORY SPECIFICATION: The unit must incorporate a dedicated Traumatic Brain Injury (TBI) clinical dashboard enforcing pre-hospital EPIC (Excellence in Prehospital Injury Care) guidelines.
- Persistent visual trends must alert clinicians whenever SBP <90 mmHg, SpO2 <90%, or ETCO2 deviates from 35–45 mmHg to prevent secondary cerebral hypoxia and hypotension.` : '- Standard trauma vital sign monitoring.'}

1.5 NEMSIS v3.5.0, CMS GADCS COMPLIANCE & HIPAA / SOC 2 TYPE II CLOUD TELEMETRY
- The system must support integrated multi-carrier 4G/5G and Wi-Fi transmission of diagnostic 12-lead STEMI ECGs to ${agency.gisData?.primaryReceivingHospital || `${agency.city} Regional STEMI Center`} and automated HL7/NEMSIS v3.5.0 XML vitals export into the agency's ePCR & Revenue Cycle platform.
- Software telemetry must operate within a HIPAA Safe Harbor (45 CFR § 164.514(b)) and SOC 2 Type II certified cloud environment, capturing auditable cost, utilization, and medical-necessity telemetry to eliminate Medicare CO-16 denials and prevent the mandatory 10% Medicare Part B fee reduction penalty under the CMS Ground Ambulance Data Collection System (GADCS — Social Security Act § 1834(l)(17)).

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

SECTION 3. APPROVED NATIONAL COOPERATIVE PURCHASING VEHICLES (PIGGYBACK AUTHORIZATION)
${includeSourcewellCoop ? `Pursuant to state interlocal cooperation statutes and municipal procurement code, ${agency.name} is authorized to bypass 6-to-9 month sealed bid cycles and execute immediate acquisition under any of the following competitively solicited national cooperative master agreements:
- Sourcewell Master Agreement #041823-ZOL (Public Safety, EMS & Rescue Equipment)
- HGACBuy Cooperative Contract #EE08-24 (Houston-Galveston Area Council — Emergency Medical & Rescue Equipment)
- NPPGov / FireRescue GPO Master Agreement #PS20210-ZOL (Public Safety & Medical Resuscitation Fleet)
- NASPO ValuePoint Master Agreement #SW01924 (Public Safety & Automated External/Manual Defibrillators)
All published cooperative volume ceilings, 5-year comprehensive on-site biomedical warranty caps, and OEM trade-in allowances ($${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()} per retired competitor monitor) shall apply directly.` : 'Procurement subject to standard municipal open sealed bid procedures.'}

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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Pre-emptive RFP specification &amp; 5-year TCO proposal generator
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Customized municipal procurement specification for <strong className="text-slate-900 dark:text-white">{agency.name}</strong> ({agency.city}, {agency.stateCode}) &middot; <span className="font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">5-Yr Net TCO Savings: +${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeRealBvm}
              onChange={(e) => setIncludeRealBvm(e.target.checked)}
              className="accent-[#1E3A8A] dark:accent-blue-500"
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Real BVM Help</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeAutoPulse}
              onChange={(e) => setIncludeAutoPulse(e.target.checked)}
              className="accent-[#1E3A8A] dark:accent-blue-500"
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium">AutoPulse LDB</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeTbiDashboard}
              onChange={(e) => setIncludeTbiDashboard(e.target.checked)}
              className="accent-[#1E3A8A] dark:accent-blue-500"
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium">EPIC TBI Spec</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeFiveYearTcoCap}
              onChange={(e) => setIncludeFiveYearTcoCap(e.target.checked)}
              className="accent-[#1E3A8A] dark:accent-blue-500"
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium">5-Yr TCO &amp; PM Cap</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A]/60 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeSourcewellCoop}
              onChange={(e) => setIncludeSourcewellCoop(e.target.checked)}
              className="accent-[#1E3A8A] dark:accent-blue-500"
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Co-Op Contracts</span>
          </label>
        </div>

        {/* Formatted Text Preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <textarea
            readOnly
            value={rfpText}
            className="w-full flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed resize-none focus:outline-none"
            rows={15}
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Includes 5-year OEM preventative maintenance cap, trade-in credits, and Sourcewell / NPPGov / HGACBuy clauses.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-9 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />}
              <span>{copied ? 'Copied to clipboard' : 'Copy spec & TCO package'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="h-9 px-4 bg-slate-900 dark:bg-blue-600 hover:bg-[#1E3A8A] dark:hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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
