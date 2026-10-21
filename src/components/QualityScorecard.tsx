/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency } from '../types';
import { NATIONAL_BENCHMARKS } from '../data/healthcareData';
import { 
  Award, 
  Activity, 
  HeartPulse, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface QualityScorecardProps {
  agency: Agency;
  onOpenRfpGenerator?: (agency: Agency) => void;
}

export const QualityScorecard: React.FC<QualityScorecardProps> = ({
  agency,
  onOpenRfpGenerator
}) => {
  const [simulateZollImpact, setSimulateZollImpact] = useState<boolean>(false);

  const qm = agency.qualityMetrics || {
    nemsqaStemi12LeadAcquisitionPct: 68.4,
    nemsqaChestCompressionFractionPct: 71.8,
    nemsqaEtco2VentilationCompliancePct: 52.1,
    nemsqaPediatricRespiratorySupportPct: 64.5,
    nemsqaStrokeLkwDocumentedPct: 76.2,
    nemsqaPainManagementEffectivePct: 71.0,
    caresGoodNeurologicalSurvivalPct: 7.2,
    ahaMissionLifelineTier: 'Silver',
    gadcsCostToChargeRatio: 0.69,
    commercialUnderpaymentPerTrip: 245
  };

  // Projected values with ZOLL clinical intervention
  const simStemi = simulateZollImpact ? Math.min(95, qm.nemsqaStemi12LeadAcquisitionPct + 22) : qm.nemsqaStemi12LeadAcquisitionPct;
  const simCcf = simulateZollImpact ? Math.min(96, qm.nemsqaChestCompressionFractionPct + 23) : qm.nemsqaChestCompressionFractionPct;
  const simEtco2 = simulateZollImpact ? Math.min(92, qm.nemsqaEtco2VentilationCompliancePct + 36) : qm.nemsqaEtco2VentilationCompliancePct;
  const simCpc = simulateZollImpact ? (qm.caresGoodNeurologicalSurvivalPct * 1.6).toFixed(1) : qm.caresGoodNeurologicalSurvivalPct;
  const simAha = simulateZollImpact ? 'Gold Plus' : qm.ahaMissionLifelineTier;

  return (
    <div className="space-y-6">
      
      {/* Executive Quality Header & Simulator Switch */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              NEMSQA, AHA & CARES Clinical Quality Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-hospital clinical benchmarks for <strong className="text-slate-800">{agency.name}</strong> audited against national NEMSIS v3 registries and cerebral outcome metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => setSimulateZollImpact(!simulateZollImpact)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              simulateZollImpact
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulateZollImpact ? 'ZOLL Clinical Mode Active' : 'Simulate Quality Uplift'}</span>
          </button>

          {onOpenRfpGenerator && (
            <button
              onClick={() => onOpenRfpGenerator(agency)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-sky-700 hover:bg-sky-50 border border-sky-200 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Generate RFP Specs</span>
            </button>
          )}
        </div>
      </div>

      {/* AHA Mission: Lifeline & Neurological Outcomes Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AHA Recognition Tier */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>AHA Mission: Lifeline EMS Tier</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl font-black ${
              simAha === 'Gold Plus' ? 'text-emerald-700' :
              simAha === 'Gold' ? 'text-amber-700' :
              simAha === 'Silver' ? 'text-slate-800' : 'text-rose-700'
            }`}>
              {simAha}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {simulateZollImpact 
                ? 'Achieves Gold Plus status via cellular 12-lead transmission and Real CPR Help'
                : 'Currently at Silver status; 12-lead acquisition speed is primary constraint'}
            </div>
          </div>
        </div>

        {/* CARES Favorable Neurological Survival CPC 1/2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>CARES Intact Cerebral Survival (CPC 1/2)</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
              {simCpc}%
              <span className="text-xs text-slate-400 font-normal ml-2 font-sans">
                (US Avg: {NATIONAL_BENCHMARKS.caresGoodNeurologicalSurvivalPct}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Discharged with intact brain function (Cerebral Performance Category 1 or 2)
            </div>
          </div>
        </div>

        {/* GADCS & Commercial Underpayment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Commercial Payer Underpayment</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
              ${qm.commercialUnderpaymentPerTrip}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">/ transport</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Cost-to-Charge Ratio: <strong className="text-slate-800 font-mono">{qm.gadcsCostToChargeRatio}</strong> (GADCS audited)
            </div>
          </div>
        </div>

      </div>

      {/* NEMSQA Benchmark Comparison Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            NEMSQA National EMS Quality Alliance Standard Measures
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Registry: National NEMSIS v3 Repository
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Clinical Quality Measure</th>
                <th className="py-3 px-3 text-right">Agency Baseline</th>
                <th className="py-3 px-3 text-right">US Benchmark</th>
                <th className="py-3 px-3 text-right">With ZOLL Uplift</th>
                <th className="py-3 px-4">ZOLL Clinical Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              
              {/* Measure 1: STEMI 12-lead */}
              <tr className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">STEMI 12-Lead Acquisition &le; 10 Mins</div>
                  <div className="text-[11px] text-slate-500 font-mono">NEMSQA Cardiac-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 tabular-nums font-semibold">
                  {qm.nemsqaStemi12LeadAcquisitionPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaStemi12LeadAcquisitionPct}%
                </td>
                <td className="py-3.5 px-3 text-right font-black text-sky-700 tabular-nums">
                  {simStemi}%
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] leading-relaxed">
                  X Series Advanced cellular & Wi-Fi transmission directly to cath lab cardiologists.
                </td>
              </tr>

              {/* Measure 2: Chest Compression Fraction (CCF) */}
              <tr className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">Chest Compression Fraction (CCF &ge; 80%)</div>
                  <div className="text-[11px] text-slate-500 font-mono">AHA Resuscitation Standard</div>
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700 tabular-nums font-bold">
                  {qm.nemsqaChestCompressionFractionPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaChestCompressionFractionPct}%
                </td>
                <td className="py-3.5 px-3 text-right font-black text-emerald-700 tabular-nums">
                  {simCcf}%
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] leading-relaxed">
                  AutoPulse load-distributing band maintains unbroken 95%+ CCF during stairwell extrication and vehicle transit.
                </td>
              </tr>

              {/* Measure 3: ETCO2 Ventilation Compliance */}
              <tr className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">ETCO2 Ventilation Compliance (35–45 mmHg)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Hyperventilation Prevention</div>
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700 tabular-nums font-bold">
                  {qm.nemsqaEtco2VentilationCompliancePct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaEtco2VentilationCompliancePct}%
                </td>
                <td className="py-3.5 px-3 text-right font-black text-sky-700 tabular-nums">
                  {simEtco2}%
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] leading-relaxed">
                  Real BVM Help real-time ventilation rate bar graph visually prevents hyperventilation.
                </td>
              </tr>

              {/* Measure 4: Pediatric Respiratory Support */}
              <tr className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">Pediatric Respiratory Support Compliance</div>
                  <div className="text-[11px] text-slate-500 font-mono">NEMSQA Pediatrics-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 tabular-nums font-semibold">
                  {qm.nemsqaPediatricRespiratorySupportPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  72.0%
                </td>
                <td className="py-3.5 px-3 text-right font-black text-sky-700 tabular-nums">
                  {simulateZollImpact ? '88.5%' : `${qm.nemsqaPediatricRespiratorySupportPct}%`}
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] leading-relaxed">
                  Z Vent internal compressor supports neonatal and pediatric tidal volumes down to 50 mL.
                </td>
              </tr>

              {/* Measure 5: Stroke LKW Documentation */}
              <tr className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">Stroke Last Known Well (LKW) Documented</div>
                  <div className="text-[11px] text-slate-500 font-mono">NEMSQA Stroke-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 tabular-nums font-semibold">
                  {qm.nemsqaStrokeLkwDocumentedPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  80.0%
                </td>
                <td className="py-3.5 px-3 text-right font-black text-sky-700 tabular-nums">
                  {simulateZollImpact ? '94.0%' : `${qm.nemsqaStrokeLkwDocumentedPct}%`}
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] leading-relaxed">
                  ZOLL RescueNet ePCR mandatory clinical decision prompts validate LKW before hospital routing.
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
