/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency } from '../../types';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Scale 
} from 'lucide-react';

interface SourcewellCoopMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
}

export const SourcewellCoopMemoModal: React.FC<SourcewellCoopMemoModalProps> = ({
  isOpen,
  onClose,
  agency
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
  const unitCount = agency.installedFleet?.defibUnitsCount || Math.max(4, agency.totalAmbulances);
  const defibBrand = agency.installedFleet?.defibBrand || 'Frontline Monitor';
  const tradeInCredit = 3500;
  const totalTradeIn = unitCount * tradeInCredit;
  const grossCapEx = unitCount * 36500;
  const netCapEx = grossCapEx - totalTradeIn;
  const fiveYrSavings = Math.round(unitCount * 4200);

  const memoDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleCopy = () => {
    const text = document.getElementById('coop-memo-text')?.innerText || '';
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#111C2D] border border-blue-600/40 dark:border-blue-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="bg-[#0B1728] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Cooperative Purchasing Piggyback Resolution</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Sourcewell #041823-ZOL &amp; HGACBuy #EE08-24 Executive Memo
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy Memo'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Print Formal Memo"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Memo Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-sans" id="coop-memo-text">
          <div className="border-b-2 border-slate-900 dark:border-slate-400 pb-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  MEMORANDUM FOR EXECUTIVE CONSIDERATION
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Municipal Procurement &amp; Intergovernmental Cooperative Authorization
                </p>
              </div>
              <div className="text-right text-xs font-mono">
                <div>DATE: {memoDate}</div>
                <div>REF: MCR-{agency.stateCode}-COOP-2026</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs">
              <div>
                <strong>TO:</strong> Mayor, City Manager, &amp; Fire District Board of Commissioners
              </div>
              <div>
                <strong>FROM:</strong> Division Chief of Emergency Medical Services &amp; Logistics
              </div>
              <div className="sm:col-span-2">
                <strong>SUBJECT:</strong> Authorization to Purchase {unitCount}× ZOLL X Series® Advanced Resuscitation Monitors via Sourcewell Pre-Competed Contract #041823-ZOL
              </div>
            </div>
          </div>

          {/* Section 1: Executive Purpose */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              1. Executive Purpose &amp; Statutory Authority
            </h3>
            <p className="leading-relaxed">
              This memorandum requests formal authorization to procure {unitCount} (unit count) new <strong>ZOLL X Series® Advanced Monitor/Defibrillator systems</strong> to replace the department's aging {defibBrand} units. Rather than initiating a costly 6-to-9 month public sealed Request for Proposals (RFP), procurement will be executed utilizing <strong>Sourcewell Master Contract #041823-ZOL</strong> (and/or HGACBuy Contract #EE08-24). 
            </p>
            <p className="leading-relaxed">
              Under state intergovernmental purchasing statutes, political subdivisions and municipal fire/EMS districts are legally authorized to "piggyback" on contracts established by recognized government purchasing cooperatives that have undergone full competitive sealed bidding. Sourcewell satisfies all municipal competitive procurement statutes, delivering pre-negotiated ceiling discounts and avoiding administrative bid issuance fees.
            </p>
          </div>

          {/* Section 2: Clinical & Operational Necessity */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              2. Operational Necessity &amp; Patient Safety
            </h3>
            <p className="leading-relaxed">
              The department's frontline monitors have surpassed optimal capital replacement age. The ZOLL X Series® Advanced introduces critical clinical capabilities not present on existing hardware:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Real BVM Help®:</strong> Real-time tidal volume and ventilation rate sensor preventing the fatal hyperventilation cerebral vasoconstriction documented in regional cardiac arrest protocols.
              </li>
              <li>
                <strong>Real CPR Help®:</strong> Depth, release velocity, and rate audiovisual guidance ensuring chest compression fraction (CCF) exceeds the American Heart Association &gt;80% clinical threshold.
              </li>
              <li>
                <strong>Weight Reduction:</strong> 11.7 lbs versus 18.5 lbs, reducing ergonomic musculoskeletal injury risks for frontline paramedics during stairwell and high-angle extrications.
              </li>
            </ul>
          </div>

          {/* Section 3: Financial Summary & Trade-In Equity */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              3. Financial Appropriations &amp; Guaranteed Trade-In Value
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span>Gross CapEx Equipment Investment ({unitCount} Units):</span>
                <span>${grossCapEx.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Guaranteed OEM Fleet Trade-In Credit (${tradeInCredit.toLocaleString()}/unit):</span>
                <span>-${totalTradeIn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
                <span>Net Capital Expenditure:</span>
                <span>${netCapEx.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400 pt-1 border-t border-dashed border-slate-300 dark:border-slate-700">
                <span>Estimated 5-Year Operating Maintenance &amp; Battery Savings:</span>
                <span>+${fiveYrSavings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Recommended Action */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              4. Recommendation &amp; Next Steps
            </h3>
            <p className="leading-relaxed">
              It is recommended that the governing body adopt the attached resolution authorizing the City Manager / Fire Chief to issue a purchase order against Sourcewell Contract #041823-ZOL, securing immediate trade-in credit eligibility and locking in current fiscal year cooperative pricing.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <div>Attestation: Municipal Purchasing Compliance Audited</div>
            <div>Generated by ZOLL PulseIQ Territory Intelligence</div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#16243A] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Sourcewell Contract #041823-ZOL · Valid Through 2027
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
