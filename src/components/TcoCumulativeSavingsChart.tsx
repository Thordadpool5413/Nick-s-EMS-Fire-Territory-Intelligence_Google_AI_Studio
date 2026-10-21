/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency } from '../types';
import { calculateAgencyFleetTco } from '../data/clinicalAndCompetitiveIntelligence';
import { DollarSign, TrendingDown, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { InteractiveSparkline } from './InteractiveSparkline';

interface TcoCumulativeSavingsChartProps {
  agency: Agency;
  className?: string;
}

export const TcoCumulativeSavingsChart: React.FC<TcoCumulativeSavingsChartProps> = ({ agency, className = '' }) => {
  const [hoverYear, setHoverYear] = useState<number>(5);

  const tco = calculateAgencyFleetTco(agency, 5);
  const units = tco.unitCount;

  // Compute year-by-year cumulative costs
  const yearlyData = [1, 2, 3, 4, 5].map((yr) => {
    const incumbentService = Math.round(units * (tco.incumbentServiceTotal / (5 * units)) * yr);
    const incumbentBatteries = Math.round(units * (tco.incumbentBatteryTotal / (5 * units)) * yr);
    const incumbentConsumables = Math.round(units * (tco.incumbentConsumablesTotal / (5 * units)) * yr);
    const incumbentTotal = incumbentService + incumbentBatteries + incumbentConsumables;

    const zollService = Math.round(units * (tco.zollServiceTotal / (5 * units)) * yr);
    const zollBatteries = Math.round(units * (tco.zollBatteryTotal / (5 * units)) * yr);
    const zollConsumables = Math.round(units * (tco.zollConsumablesTotal / (5 * units)) * yr);
    // Trade-in credit applies in Year 1
    const zollTotal = Math.max(0, (zollService + zollBatteries + zollConsumables) - tco.totalTradeInCredit);

    const cumulativeSavings = incumbentTotal - zollTotal;

    return {
      year: yr,
      incumbentTotal,
      zollTotal,
      cumulativeSavings
    };
  });

  const activeData = yearlyData[hoverYear - 1];
  const maxCost = yearlyData[4].incumbentTotal;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              TOTAL COST OF OWNERSHIP (TCO) PROJECTION
            </span>
            <span className="text-xs font-mono text-slate-500">
              {units} Monitor/Defibrillator Fleet
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>5-Year Cumulative Operating Burden &amp; Savings Wedge</span>
          </h3>
        </div>

        {/* Total 5-Year Net Savings Chip */}
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">5-Yr Total Savings</span>
            <span className="font-mono font-bold text-emerald-700 text-lg tabular-nums">
              +${tco.totalSavingsIncludingTradeIn.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold bg-white border border-emerald-300 px-2 py-1 rounded">
            Includes ${tco.totalTradeInCredit.toLocaleString()} Trade-In
          </span>
        </div>
      </div>

      {/* Year-by-Year Interactive Visual Comparison Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Cumulative Cost Trajectory by Fiscal Year</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span>{tco.incumbentModel} Maintenance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span>{tco.zollModel} Contracted Cost</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {yearlyData.map((d) => {
            const isSelected = hoverYear === d.year;
            const incumbentHeightPct = Math.round((d.incumbentTotal / maxCost) * 100);
            const zollHeightPct = Math.round((d.zollTotal / maxCost) * 100);

            return (
              <div
                key={`year-${d.year}`}
                onClick={() => setHoverYear(d.year)}
                onMouseEnter={() => setHoverYear(d.year)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-300 shadow-xs' 
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">Year {d.year}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      +${(d.cumulativeSavings / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">Cumulative</span>
                </div>

                {/* Vertical Comparison Bar Tower */}
                <div className="h-28 flex items-end justify-center gap-2 my-2 pt-2 border-b border-slate-200">
                  <div className="w-5 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-rose-700 font-bold block">
                      ${(d.incumbentTotal / 1000).toFixed(0)}K
                    </span>
                    <div 
                      className="w-full bg-rose-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(10, incumbentHeightPct)}%` }}
                    />
                  </div>
                  <div className="w-5 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-emerald-700 font-bold block">
                      ${(d.zollTotal / 1000).toFixed(0)}K
                    </span>
                    <div 
                      className="w-full bg-emerald-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(10, zollHeightPct)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-mono text-slate-600 block">
                    Save ${(d.cumulativeSavings).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Year Inspection Callout */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-xs">
            Year {activeData.year} Fiscal Breakdown for {agency.name}:
          </span>
          <p className="text-[11px] text-slate-500 leading-snug">
            Maintaining {units} units of {tco.incumbentModel} costs an estimated <strong className="text-rose-700 font-mono">${activeData.incumbentTotal.toLocaleString()}</strong> vs. <strong className="text-emerald-700 font-mono">${activeData.zollTotal.toLocaleString()}</strong> under ZOLL Master Cooperative Agreement.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shrink-0 text-center shadow-xs">
          <span className="text-[10px] text-slate-400 block font-semibold">Net Cash Divergence</span>
          <span className="font-mono font-bold text-emerald-700 text-sm">
            +${activeData.cumulativeSavings.toLocaleString()}
          </span>
        </div>
      </div>

    </div>
  );
};
