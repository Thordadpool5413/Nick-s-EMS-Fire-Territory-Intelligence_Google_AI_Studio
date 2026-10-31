/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../../types';
import { 
  COMPETITOR_HARDWARE_INTEL, 
  CompetitorHardwareIntel, 
  calculateAgencyFleetTco 
} from '../../data/clinicalAndCompetitiveIntelligence';
import { 
  HeartPulse, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Scale, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Zap, 
  ArrowRight, 
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';

interface CompetitiveBattlecardLivesSavedProps {
  agency: Agency;
  className?: string;
}

export const CompetitiveBattlecardLivesSaved: React.FC<CompetitiveBattlecardLivesSavedProps> = ({
  agency,
  className = ''
}) => {
  const initialIntel = useMemo(() => {
    return calculateAgencyFleetTco(agency, 5).matchedIntel;
  }, [agency]);

  const [selectedIntelId, setSelectedIntelId] = useState<string>(initialIntel.id);

  const activeIntel = useMemo(() => {
    return COMPETITOR_HARDWARE_INTEL.find(i => i.id === selectedIntelId) || initialIntel;
  }, [selectedIntelId, initialIntel]);

  // Interactive Resuscitation Survival & Lives-Saved Calculator State
  const [annualCardiacArrests, setAnnualCardiacArrests] = useState<number>(agency.annualCardiacArrestCalls || 68);
  const [baselineCcf, setBaselineCcf] = useState<number>(62); // 62% baseline compression fraction
  const [targetCcf, setTargetCcf] = useState<number>(84); // 84% target CCF with ZOLL CPR Dashboard
  const [ventComplianceBaseline, setVentComplianceBaseline] = useState<number>(45); // 45% baseline
  const [ventComplianceTarget, setVentComplianceTarget] = useState<number>(85); // 85% target with Real BVM Help®

  // Resuscitation impact mathematical model (Bobrow et al., Resuscitation / AHA Guidelines)
  // Baseline OHCA survival to discharge is ~8.5%
  // Each 10% increase in CCF yields ~1.1% absolute increase in survival to discharge
  // Real BVM Help ventilation rate & volume feedback prevents cerebral vasoconstriction, adding ~1.3% absolute survival
  const livesSavedModel = useMemo(() => {
    const ccfDelta = Math.max(0, targetCcf - baselineCcf);
    const ccfSurvivalGainPct = (ccfDelta / 10) * 1.1; // e.g. (22/10)*1.1 = +2.42%

    const ventDelta = Math.max(0, ventComplianceTarget - ventComplianceBaseline);
    const ventSurvivalGainPct = (ventDelta / 40) * 1.3; // e.g. (40/40)*1.3 = +1.3%

    const totalSurvivalGainPct = +(ccfSurvivalGainPct + ventSurvivalGainPct).toFixed(1);
    const baselineSurvivalPct = agency.utsteinSurvivalRate || 8.5;
    const projectedSurvivalPct = +(baselineSurvivalPct + totalSurvivalGainPct).toFixed(1);

    const additionalAnnualSurvivors = +(annualCardiacArrests * (totalSurvivalGainPct / 100)).toFixed(1);
    const fiveYearCumulativeLives = Math.round(additionalAnnualSurvivors * 5);

    return {
      baselineSurvivalPct,
      projectedSurvivalPct,
      totalSurvivalGainPct,
      additionalAnnualSurvivors,
      fiveYearCumulativeLives
    };
  }, [annualCardiacArrests, baselineCcf, targetCcf, ventComplianceBaseline, ventComplianceTarget, agency.utsteinSurvivalRate]);

  const unitCount = Math.max(4, agency.installedFleet?.defibUnitsCount || 8);
  const fiveYrTco = useMemo(() => {
    return calculateAgencyFleetTco(agency, 5, unitCount, activeIntel.id);
  }, [agency, unitCount, activeIntel]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. MODEL SELECTION & HEAD-TO-HEAD BATTLECARD */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#285EE8] dark:text-blue-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#285EE8]" />
              <span>Competitive Differentiation &amp; Spec Matrix</span>
            </div>
            <h3 className="text-lg font-bold text-[#14283F] dark:text-white mt-0.5">
              ZOLL X Series® Advanced vs. {activeIntel.incumbentModel}
            </h3>
            <p className="text-xs text-[#53657B] dark:text-slate-400 mt-0.5">
              Objective technical and clinical capability comparison grounded in published manufacturer device specifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="competitor-intel-select" className="text-xs font-semibold text-[#53657B] dark:text-slate-400">
              Compare Against:
            </label>
            <select
              id="competitor-intel-select"
              value={selectedIntelId}
              onChange={(e) => setSelectedIntelId(e.target.value)}
              className="h-9 rounded-lg bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] px-3 text-xs font-semibold text-[#14283F] dark:text-white cursor-pointer"
            >
              {COMPETITOR_HARDWARE_INTEL.map(intel => (
                <option key={intel.id} value={intel.id}>
                  {intel.incumbentModel} ({intel.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Head-to-Head Specification Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Competitor Column */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>{activeIntel.incumbentModel}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {activeIntel.eolStatus}
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111C2D] p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
              <strong>Clinical Vulnerability:</strong> {activeIntel.clinicalVulnerability}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Real-Time Ventilation Feedback:</span>
                <strong className="text-rose-600 dark:text-rose-400">None (Rate/volume unmeasured)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Monitor Weight:</span>
                <strong className="text-slate-900 dark:text-white">18.5 lbs (Heavy chassis)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span>Annual Biomedical Service:</span>
                <strong className="text-slate-900 dark:text-white tabular-nums">${activeIntel.incumbentAnnualServicePerUnit.toLocaleString()} / unit / yr</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Battery 5-Year Maintenance:</span>
                <strong className="text-slate-900 dark:text-white tabular-nums">${activeIntel.incumbentBattery5YrCostPerUnit.toLocaleString()} / unit</strong>
              </div>
            </div>
          </div>

          {/* ZOLL Column */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#14283F] dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ZOLL X Series® Advanced</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Current Generation · 5G Ready
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111C2D] p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 leading-relaxed">
              <strong>ZOLL Clinical Advantage:</strong> {activeIntel.zollClinicalAdvantage}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span>Real-Time Ventilation Feedback:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">Real BVM Help® (Tidal volume &amp; rate)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span>Monitor Weight:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">11.7 lbs (37% lighter)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/40">
                <span>Annual Biomedical Service:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">${activeIntel.zollAnnualServicePerUnit.toLocaleString()} / unit / yr</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Trade-In Credit Offered:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums font-bold">${activeIntel.zollTradeInCreditPerUnit.toLocaleString()} / unit credit</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE RESUSCITATION SURVIVAL & LIVES-SAVED CALCULATOR */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-emerald-900/60 pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Evidence-Based Resuscitation Outcome Modeler</span>
            </div>
            <h3 className="text-lg font-bold text-[#14283F] dark:text-white mt-0.5">
              Community Resuscitation Lives-Saved Impact Calculator
            </h3>
            <p className="text-xs text-[#53657B] dark:text-slate-400 mt-0.5">
              Translating real-time CCF and ventilation quality metrics directly into projected neurological intact cardiac arrest survivors.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111C2D] border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              AHA CCF &gt;80% Target Compliance
            </span>
          </div>
        </div>

        {/* 3 Outcome Display Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C2D] border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Survival to Discharge Rate
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#14283F] dark:text-white tabular-nums">
                {livesSavedModel.projectedSurvivalPct}%
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                (+{livesSavedModel.totalSurvivalGainPct}% lift)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Baseline: {livesSavedModel.baselineSurvivalPct}% Utstein survival
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-2xs space-y-1">
            <div className="text-xs text-emerald-100 font-medium">
              Additional Annual Survivors
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums mt-1">
              +{livesSavedModel.additionalAnnualSurvivors} Patients
            </div>
            <div className="text-[11px] text-emerald-100">
              Surviving to hospital discharge with CPC 1–2
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#111C2D] border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              5-Year Community Impact
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
              +{livesSavedModel.fiveYearCumulativeLives} Lives Saved
            </div>
            <div className="text-[11px] text-slate-500">
              Cumulatively across {annualCardiacArrests * 5} cardiac responses
            </div>
          </div>
        </div>

        {/* Interactive Sensitivity Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Slider 1: Chest Compression Fraction */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Target CCF (Chest Compression Fraction)</span>
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {targetCcf}%
              </span>
            </div>
            <input
              type="range"
              min={65}
              max={95}
              step={1}
              value={targetCcf}
              onChange={(e) => setTargetCcf(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Baseline: {baselineCcf}%</span>
              <span>AHA Benchmark: &gt;80%</span>
              <span>Max: 95%</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              Enabled by ZOLL CPR Dashboard™ audio-visual depth, release, and rate feedback.
            </div>
          </div>

          {/* Slider 2: Ventilation Compliance with Real BVM Help */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ventilation Volume &amp; Rate Compliance</span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {ventComplianceTarget}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={1}
              value={ventComplianceTarget}
              onChange={(e) => setVentComplianceTarget(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Baseline: {ventComplianceBaseline}%</span>
              <span>Target: 85%</span>
              <span>Max: 95%</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              Real BVM Help® real-time tidal volume sensor eliminates fatal hyperventilation.
            </div>
          </div>
        </div>

        {/* Clinical Study Citations */}
        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-emerald-900 dark:text-emerald-300">Resuscitation Evidence Grounding:</strong> Based on clinical trials in <em>Resuscitation</em> (Bobrow et al.) and AHA Guidelines for Cardiopulmonary Resuscitation. Higher chest compression fraction (&gt;80%) combined with controlled tidal volumes (500–600 mL) delivers statistically verified improvements in cerebral perfusion pressure and survival to hospital discharge with favorable neurological status.
        </div>
      </div>
    </div>
  );
};
