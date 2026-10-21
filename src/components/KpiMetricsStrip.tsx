/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Agency } from '../types';
import { TrendingUp, ShieldAlert, DollarSign, Activity, Award } from 'lucide-react';

interface KpiMetricsStripProps {
  agencies: Agency[];
  selectedJurisdiction: string;
}

export const KpiMetricsStrip: React.FC<KpiMetricsStripProps> = ({ agencies, selectedJurisdiction }) => {
  const totalPipeline = agencies.reduce((acc, a) => acc + a.zollOpportunity.projectedPipelineValue, 0);
  const criticalCount = agencies.filter(a => a.zollOpportunity.pulseIqScore >= 90).length;
  const totalAfgFunds = agencies.reduce((acc, a) => acc + (a.grantStatus.afgAwardAmount || 0), 0);
  const totalCmsRecoverable = agencies.reduce((acc, a) => acc + (a.cmsData.estimatedRecoverableRevenue || 0), 0);
  const totalCardiacArrests = agencies.reduce((acc, a) => acc + a.annualCardiacArrestCalls, 0);

  const emsCount = agencies.filter(a => !a.agencyType.toLowerCase().includes('fire')).length;
  const fireCount = agencies.filter(a => a.agencyType.toLowerCase().includes('fire')).length;

  const pipelineDisplay = totalPipeline >= 1000000000
    ? `$${(totalPipeline / 1000000000).toFixed(2)}B`
    : `$${(totalPipeline / 1000000).toFixed(1)}M`;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Card 1: Total Pipeline */}
          <div className="flex flex-col pt-2 md:pt-0 md:pr-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-xs bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.7)] shrink-0" />
              <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Target Pipeline</span>
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {pipelineDisplay}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono flex items-center gap-1">
              <span className="text-sky-700 dark:text-sky-400 font-semibold">{emsCount.toLocaleString()} EMS</span>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{fireCount.toLocaleString()} Fire</span>
            </div>
          </div>

          {/* Card 2: High Propensity Leads */}
          <div className="flex flex-col pt-2 md:pt-0 md:px-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-xs bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)] shrink-0" />
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Priority Leads (&ge; 90)</span>
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {criticalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">Accounts</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              <span>Immediate field calling window</span>
            </div>
          </div>

          {/* Card 3: AFG Grant Funding */}
          <div className="flex flex-col pt-2 md:pt-0 md:px-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-xs bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] shrink-0" />
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>AFG Federal Capital</span>
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tight">
              ${(totalAfgFunds / 1000000).toFixed(1)}M
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              <span>FEMA FY24/25 active awards</span>
            </div>
          </div>

          {/* Card 4: CMS Claims Recovery */}
          <div className="flex flex-col pt-2 md:pt-0 md:px-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-xs bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.7)] shrink-0" />
              <DollarSign className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>CMS Denials Upside</span>
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              ${(totalCmsRecoverable / 1000000).toFixed(1)}M
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              <span>Recoverable billing cashflow</span>
            </div>
          </div>

          {/* Card 5: Cardiac Acuity Volume */}
          <div className="flex flex-col col-span-2 md:col-span-1 pt-2 md:pt-0 md:pl-4">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-xs bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] shrink-0" />
              <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>OHCA Cardiac Runs</span>
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {totalCardiacArrests.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              <span>NEMSIS v3 emergency volume</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
