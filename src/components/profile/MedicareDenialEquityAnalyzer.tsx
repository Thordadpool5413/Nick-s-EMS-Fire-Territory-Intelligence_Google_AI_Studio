/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../../types';
import { 
  Scale, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  FileCheck2, 
  FileText, 
  HelpCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MedicareDenialEquityAnalyzerProps {
  agency: Agency;
  className?: string;
}

export const MedicareDenialEquityAnalyzer: React.FC<MedicareDenialEquityAnalyzerProps> = ({
  agency,
  className = ''
}) => {
  const annualBilled = agency.cmsData?.medicareBilledAnnual || 850000;
  const denialRate = agency.cmsData?.claimDenialRate || 18.4;
  const topCode = agency.cmsData?.topDenialReasonCode || 'CO-16';

  const [recaptureRatePct, setRecaptureRatePct] = useState<number>(65); // 65% default capture
  const [customTradeInCredit, setCustomTradeInCredit] = useState<number>(3500); // $3,500/unit
  const unitCount = agency.installedFleet?.defibUnitsCount || Math.max(4, agency.totalAmbulances);

  // Financial calculations
  const deniedPool = useMemo(() => {
    return Math.round(annualBilled * (denialRate / 100));
  }, [annualBilled, denialRate]);

  const annualRecovery = useMemo(() => {
    return Math.round(deniedPool * (recaptureRatePct / 100));
  }, [deniedPool, recaptureRatePct]);

  const fiveYrCumulativeRecovery = useMemo(() => {
    return annualRecovery * 5;
  }, [annualRecovery]);

  const totalTradeInEquity = useMemo(() => {
    return unitCount * customTradeInCredit;
  }, [unitCount, customTradeInCredit]);

  const grossCapEx = unitCount * 36500;
  const netCapEx = grossCapEx - totalTradeInEquity;

  const denialCategories = [
    {
      code: 'CO-16',
      label: 'Lacks Medical Necessity Documentation',
      sharePct: 68,
      amount: Math.round(deniedPool * 0.68),
      explanation: 'Missing time-synchronized CPR compression waveforms or uncorroborated ALS intervention narratives during transport.',
      mitigation: 'ZOLL emsCharts® auto-attaches NEMSIS v3.5 CPR & 12-lead ECG waveforms directly to electronic claim submissions.'
    },
    {
      code: 'CO-18',
      label: 'Duplicate Claim Submission',
      sharePct: 14,
      amount: Math.round(deniedPool * 0.14),
      explanation: 'Resubmissions executed without proper claim adjustment reason coding.',
      mitigation: 'Automated claim scrub rules prevent accidental secondary submissions before clearinghouse export.'
    },
    {
      code: 'CO-50',
      label: 'Non-Covered Transport Mileage',
      sharePct: 11,
      amount: Math.round(deniedPool * 0.11),
      explanation: 'Payer dispute over nearest appropriate hospital destination (trauma center versus local community ED).',
      mitigation: 'GIS geofence verification automatically validates bypass rationale for specialized STEMI/Trauma receiving facilities.'
    },
    {
      code: 'PR-204',
      label: 'Missing Prior Authorization / Benefit Plan Gap',
      sharePct: 7,
      amount: Math.round(deniedPool * 0.07),
      explanation: 'Unverified Medicare Advantage HMO managed care enrollment rules.',
      mitigation: 'Real-time 270/271 eligibility batch verification prior to claim adjudication.'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. CO-16 ROOT CAUSE DIAGNOSTIC & WAVEFORM RECAPTURE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#285EE8] dark:text-blue-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#285EE8]" />
              <span>Medicare Part B Reimbursement Diagnostic</span>
            </div>
            <h3 className="text-lg font-bold text-[#14283F] dark:text-white mt-0.5">
              Interactive CO-16 Claim Denial &amp; Waveform Recapture Analyzer
            </h3>
            <p className="text-xs text-[#53657B] dark:text-slate-400 mt-0.5">
              Annual CMS ground ambulance claims analysis showing how objective CPR/ECG waveform documentation overturns denied revenue.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono text-xs font-semibold">
            {denialRate}% Denial Rate (${deniedPool.toLocaleString()}/yr denied pool)
          </div>
        </div>

        {/* 3 Outcome KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
            <div className="text-xs text-rose-800 dark:text-rose-300 font-medium">
              Annual Denied Medicare Pool
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">
              ${deniedPool.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              Based on ${annualBilled.toLocaleString()} annual Medicare Billed claims
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-2xs space-y-1">
            <div className="text-xs text-emerald-100 font-medium">
              Annual Recovered Cash Flow
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              +${annualRecovery.toLocaleString()} / yr
            </div>
            <div className="text-[11px] text-emerald-100">
              At {recaptureRatePct}% waveform documentation capture rate
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#16243A] border border-emerald-200 dark:border-emerald-900/60 space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              5-Year Cumulative Cash Recovery
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +${fiveYrCumulativeRecovery.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              Total bottom-line Medicare revenue restored to department
            </div>
          </div>
        </div>

        {/* Interactive Recapture Slider */}
        <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Waveform Documentation Recapture Rate</span>
            </span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
              {recaptureRatePct}% Recaptured
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={85}
            step={5}
            value={recaptureRatePct}
            onChange={(e) => setRecaptureRatePct(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Conservative: 40%</span>
            <span>Target Benchmark: 65%</span>
            <span>Aggressive: 85%</span>
          </div>
        </div>

        {/* Detailed Breakdown of 4 Root Cause Denial Categories */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Root-Cause Breakdown of Denied Claims
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {denialCategories.map((cat) => (
              <div 
                key={cat.code}
                className="p-3.5 rounded-xl bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                    {cat.code} · {cat.sharePct}% of denials
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    ${cat.amount.toLocaleString()}/yr
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {cat.label}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {cat.explanation}
                </p>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  ✓ {cat.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE TRADE-IN EQUITY MODELER */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Capital Appropriations Offset</span>
            </div>
            <h3 className="text-lg font-bold text-[#14283F] dark:text-white mt-0.5">
              Guaranteed OEM Trade-In Equity Modeler
            </h3>
            <p className="text-xs text-[#53657B] dark:text-slate-400 mt-0.5">
              Apply guaranteed trade-in allowances on retiring {agency.installedFleet?.defibBrand || 'monitor'} units directly against new capital expenditures.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold">
            {unitCount} Frontline Units · ${totalTradeInEquity.toLocaleString()} Total Trade-In
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slider: Trade-in allowance */}
          <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                OEM Trade-In Allowance / Unit
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ${customTradeInCredit.toLocaleString()} / unit
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={5000}
              step={250}
              value={customTradeInCredit}
              onChange={(e) => setCustomTradeInCredit(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Standard: $2,500</span>
              <span>Enhanced: $3,500</span>
              <span>Competitive Bonus: $5,000</span>
            </div>
          </div>

          {/* Net Investment Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross CapEx ({unitCount} Units):</span>
              <span>${grossCapEx.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Instant Trade-In Credit ({unitCount} × ${customTradeInCredit.toLocaleString()}):</span>
              <span>-${totalTradeInEquity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
              <span>Net Municipal Capital Expenditure:</span>
              <span>${netCapEx.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
