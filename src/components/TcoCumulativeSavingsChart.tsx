/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency } from '../types';
import { calculateAgencyFleetTco } from '../data/clinicalAndCompetitiveIntelligence';
import { DollarSign, TrendingDown, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { InteractiveSparkline } from './InteractiveSparkline';
import { formatCurrency, formatInteger } from '../utils/numberFormatting';

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
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              CFO FINANCIAL LEDGER · 5-YEAR TCO
            </span>
            <span aria-hidden="true">·</span>
            <span>{units}-Unit Monitor/Defibrillator Fleet</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>5-Year Cumulative Operating Burden &amp; Net Cash Savings Ledger</span>
          </h3>
        </div>

        {/* Unboxed Tabular Total 5-Year Net Savings Readout */}
        <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-emerald-600 pl-3 sm:pl-0 sm:pr-3">
          <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">
            5-Yr Net Cash Savings (Incl. {formatCurrency(tco.totalTradeInCredit, { compact: false })} Trade-In)
          </span>
          <span className="pi-metric-large font-bold text-emerald-700 dark:text-emerald-400">
            +{formatCurrency(tco.totalSavingsIncludingTradeIn, { compact: false })}
          </span>
        </div>
      </div>

      {/* Flush 1px Hairline 5-Year Trajectory Matrix */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>Cumulative Operating Trajectory by Fiscal Year</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500"></span>
              <span>{tco.incumbentModel}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500"></span>
              <span>{tco.zollModel}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {yearlyData.map((d) => {
            const isSelected = hoverYear === d.year;
            const incumbentHeightPct = Math.round((d.incumbentTotal / maxCost) * 100);
            const zollHeightPct = Math.round((d.zollTotal / maxCost) * 100);

            return (
              <div
                key={`year-${d.year}`}
                onClick={() => setHoverYear(d.year)}
                onMouseEnter={() => setHoverYear(d.year)}
                className={`p-3 transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-slate-50 dark:bg-slate-800/90' 
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold text-xs pi-data-inline ${isSelected ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                      FY0{d.year}
                    </span>
                    <span className="text-[10px] pi-data-number font-bold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(d.cumulativeSavings)}
                    </span>
                  </div>
                  <div className={`h-[2px] w-full ${isSelected ? 'bg-[#1E3A8A] dark:bg-blue-400' : 'bg-transparent'}`} />
                </div>

                {/* Vertical Comparison Bar Tower */}
                <div className="h-24 flex items-end justify-center gap-2 my-2 pt-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-5 flex flex-col items-center gap-1">
                    <span className="text-[9px] pi-data-number text-rose-700 dark:text-rose-400 font-bold block">
                      {formatCurrency(d.incumbentTotal)}
                    </span>
                    <div 
                      className="w-full bg-rose-500 transition-all duration-300"
                      style={{ height: `${Math.max(10, incumbentHeightPct)}%` }}
                    />
                  </div>
                  <div className="w-5 flex flex-col items-center gap-1">
                    <span className="text-[9px] pi-data-number text-emerald-700 dark:text-emerald-400 font-bold block">
                      {formatCurrency(d.zollTotal)}
                    </span>
                    <div 
                      className="w-full bg-emerald-500 transition-all duration-300"
                      style={{ height: `${Math.max(10, zollHeightPct)}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] pi-data-inline text-slate-500 dark:text-slate-400 block">
                    Δ {formatCurrency(d.cumulativeSavings, { compact: false })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional CFO Line-Item Ledger with Dotted Leader Lines & Right-Aligned Monospace Columns */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase">
          <span>Fiscal Year {activeData.year} Cumulative Cost Schedule ({units} Units)</span>
          <span>Incumbent vs. ZOLL · Variance</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs bg-white dark:bg-slate-900 p-3 space-y-2">
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium shrink-0">
              {tco.incumbentModel} Cumulative Operating Burden
            </span>
            <span className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-2" />
            <span className="pi-metric-table font-semibold text-rose-700 dark:text-rose-400 text-right shrink-0">
              {formatCurrency(activeData.incumbentTotal, { compact: false })}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-2">
            <span className="text-slate-700 dark:text-slate-300 font-medium shrink-0">
              {tco.zollModel} Contracted Burden (Net of {formatCurrency(tco.totalTradeInCredit, { compact: false })} Trade-In)
            </span>
            <span className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-2" />
            <span className="pi-metric-table font-semibold text-slate-900 dark:text-white text-right shrink-0">
              {formatCurrency(activeData.zollTotal, { compact: false })}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white shrink-0">
              Year {activeData.year} Cumulative Net Budget Variance
            </span>
            <span className="flex-1 border-b border-dotted border-slate-300 dark:border-slate-700 mx-2" />
            <span className="pi-metric-table font-bold text-emerald-700 dark:text-emerald-400 text-sm text-right shrink-0">
              +{formatCurrency(activeData.cumulativeSavings, { compact: false })}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
