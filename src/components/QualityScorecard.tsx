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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              NEMSQA, AHA &amp; CARES clinical quality scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pre-hospital clinical benchmarks for <strong className="text-slate-800 dark:text-slate-200 font-medium">{agency.name}</strong> audited against national NEMSIS v3 registries.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            type="button"
            onClick={() => setSimulateZollImpact(!simulateZollImpact)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border cursor-pointer ${
              simulateZollImpact
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulateZollImpact ? 'Forecast model: Active' : 'Project clinical uplift forecast'}</span>
          </button>

          {onOpenRfpGenerator && (
            <button
              type="button"
              onClick={() => onOpenRfpGenerator(agency)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 border border-sky-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Generate RFP specs</span>
            </button>
          )}
        </div>
      </div>

      {/* AHA Mission: Lifeline & Neurological Outcomes Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AHA Recognition Tier */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>AHA Mission: Lifeline tier</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className={`text-[24px] font-[650] leading-none ${
              simAha === 'Gold Plus' ? 'text-emerald-700 dark:text-emerald-400' :
              simAha === 'Gold' ? 'text-amber-700 dark:text-amber-400' :
              simAha === 'Silver' ? 'text-slate-800 dark:text-slate-100' : 'text-rose-700 dark:text-rose-400'
            }`}>
              {simAha}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {simulateZollImpact 
                ? 'Achieves Gold Plus status via cellular 12-lead transmission and Real CPR Help'
                : 'Currently at Silver status; 12-lead acquisition speed is primary constraint'}
            </div>
          </div>
        </div>

        {/* CARES Favorable Neurological Survival CPC 1/2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>CARES cerebral survival (CPC 1/2)</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-[24px] font-[650] text-slate-900 dark:text-white tabular-nums leading-none">
              {simCpc}%
              <span className="text-xs text-slate-400 font-normal ml-2 tabular-nums">
                (US average: {NATIONAL_BENCHMARKS.caresGoodNeurologicalSurvivalPct}%)
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Discharged with intact brain function (Cerebral Performance Category 1 or 2)
            </div>
          </div>
        </div>

        {/* GADCS & Commercial Underpayment */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Commercial payer underpayment</span>
            <DollarSign className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-[24px] font-[650] text-slate-900 dark:text-white tabular-nums leading-none">
              ${qm.commercialUnderpaymentPerTrip}
              <span className="text-xs text-slate-400 font-normal ml-1">/ transport</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
              Cost-to-charge ratio: <strong className="text-slate-800 dark:text-slate-200 font-medium">{qm.gadcsCostToChargeRatio}</strong> (GADCS audited)
            </div>
          </div>
        </div>

      </div>

      {/* NEMSQA Benchmark Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            NEMSQA standard quality measures
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Registry: National NEMSIS v3 Repository
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-3 px-4">Clinical quality measure</th>
                <th className="py-3 px-3 text-right">Agency baseline</th>
                <th className="py-3 px-3 text-right">US benchmark</th>
                <th className="py-3 px-3 text-right">With ZOLL uplift</th>
                <th className="py-3 px-4">Clinical mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              
              {/* Measure 1: STEMI 12-lead */}
              <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">STEMI 12-lead acquisition &le; 10 mins</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">NEMSQA Cardiac-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums font-medium">
                  {qm.nemsqaStemi12LeadAcquisitionPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaStemi12LeadAcquisitionPct}%
                </td>
                <td className="py-3.5 px-3 text-right font-medium text-sky-700 dark:text-sky-400 tabular-nums">
                  {simStemi}%
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  X Series Advanced cellular transmission directly to cath lab teams.
                </td>
              </tr>

              {/* Measure 2: Chest Compression Fraction (CCF) */}
              <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">Chest compression fraction (CCF &ge; 80%)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">AHA Resuscitation Standard</div>
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700 dark:text-rose-400 tabular-nums font-semibold">
                  {qm.nemsqaChestCompressionFractionPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaChestCompressionFractionPct}%
                </td>
                <td className="py-3.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {simCcf}%
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  AutoPulse load-distributing band maintains unbroken 95%+ CCF during stairwell extrication and transport.
                </td>
              </tr>

              {/* Measure 3: ETCO2 Ventilation Compliance */}
              <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">ETCO2 ventilation compliance (35&ndash;45 mmHg)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Hyperventilation prevention</div>
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700 dark:text-rose-400 tabular-nums font-semibold">
                  {qm.nemsqaEtco2VentilationCompliancePct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  {NATIONAL_BENCHMARKS.nemsqaEtco2VentilationCompliancePct}%
                </td>
                <td className="py-3.5 px-3 text-right font-medium text-sky-700 dark:text-sky-400 tabular-nums">
                  {simEtco2}%
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Real BVM Help ventilation rate guidance visually prevents hyperventilation.
                </td>
              </tr>

              {/* Measure 4: Pediatric Respiratory Support */}
              <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">Pediatric respiratory support compliance</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">NEMSQA Pediatrics-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums font-medium">
                  {qm.nemsqaPediatricRespiratorySupportPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  72.0%
                </td>
                <td className="py-3.5 px-3 text-right font-medium text-sky-700 dark:text-sky-400 tabular-nums">
                  {simulateZollImpact ? '88.5%' : `${qm.nemsqaPediatricRespiratorySupportPct}%`}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Z Vent internal compressor supports neonatal and pediatric tidal volumes down to 50 mL.
                </td>
              </tr>

              {/* Measure 5: Stroke LKW Documentation */}
              <tr className="hover:bg-sky-50/30 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">Stroke Last Known Well (LKW) documented</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">NEMSQA Stroke-01</div>
                </td>
                <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums font-medium">
                  {qm.nemsqaStrokeLkwDocumentedPct}%
                </td>
                <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                  80.0%
                </td>
                <td className="py-3.5 px-3 text-right font-medium text-sky-700 dark:text-sky-400 tabular-nums">
                  {simulateZollImpact ? '94.0%' : `${qm.nemsqaStrokeLkwDocumentedPct}%`}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
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
