/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Biomedical Battery & Obsolescence TCO Escalator
 * Quantifies the escalating maintenance tax of keeping aging competitor monitor fleets
 * past their 5-7 year capital lifecycle: battery degradation, biomedical contract spikes,
 * thermal paper waste, and out-of-warranty capacitor failures.
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import {
  Wrench,
  BatteryCharging,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BiomedicalObsolescenceTcoEscalatorProps {
  agency: Agency;
  onOpenCoopMemo?: () => void;
}

export const BiomedicalObsolescenceTcoEscalator: React.FC<BiomedicalObsolescenceTcoEscalatorProps> = ({
  agency,
  onOpenCoopMemo
}) => {
  const initialUnits = agency.installedFleet?.defibUnitsCount || Math.max(4, agency.totalAmbulances + 2);
  const initialAge = agency.installedFleet?.defibAgeYears || 7.5;
  const initialBrand = agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';

  const [unitCount, setUnitCount] = useState<number>(initialUnits);
  const [fleetAge, setFleetAge] = useState<number>(initialAge);
  const [includeDepotFailures, setIncludeDepotFailures] = useState<boolean>(true);

  // Quantitative Biomed Cost Constants (Verified Industry Benchmarks)
  const BATTERY_COST_PER_PACK = 620; // Stryker LP15 replacement battery
  const BATTERIES_PER_DEVICE = 2;
  const BATTERY_LIFESPAN_YEARS = 1.75; // Legacy lithium degrades after 300 cycles (~21 months)
  const ANNUAL_BATTERY_COST_PER_UNIT = Math.round((BATTERY_COST_PER_PACK * BATTERIES_PER_DEVICE) / BATTERY_LIFESPAN_YEARS);

  // Annual maintenance escalation curve based on age past 5 years
  const annualBiomedMaintenancePerUnit = useMemo(() => {
    if (fleetAge <= 5) return 980;
    if (fleetAge <= 7) return 1850;
    if (fleetAge <= 9) return 2450;
    return 2900; // Legacy / End-of-Life parts scarcity markup
  }, [fleetAge]);

  const annualThermalPaperPerUnit = 380; // Paper rolls + mechanical thermal printhead upkeep
  const annualDepotFailureRiskProbability = fleetAge > 7 ? 0.22 : fleetAge > 5 ? 0.12 : 0.05;
  const averageDepotRepairCost = 4600; // Out-of-warranty capacitor/mainboard replacement
  const annualExpectedDepotFailureCost = includeDepotFailures
    ? Math.round(annualDepotFailureRiskProbability * averageDepotRepairCost)
    : 0;

  // Annual Totals (Status Quo Maintenance Drain)
  const annualCostPerUnitStatusQuo =
    ANNUAL_BATTERY_COST_PER_UNIT +
    annualBiomedMaintenancePerUnit +
    annualThermalPaperPerUnit +
    annualExpectedDepotFailureCost;

  const totalAnnualStatusQuoFleetDrain = annualCostPerUnitStatusQuo * unitCount;
  const cumulative5YearStatusQuoDrain = totalAnnualStatusQuoFleetDrain * 5;

  // Modernization with ZOLL X Series Advanced (5-Year Protected Model)
  const tradeInCreditPerUnit = 3500;
  const totalTradeInAllowance = unitCount * tradeInCreditPerUnit;
  const zoll5YearComprehensiveMaintenancePerUnit = 750; // Comprehensive OEM warranty
  const zollSmartBatteryCostPerUnit = 220; // SurePower II 4-year lifecycle
  const zollThermalPaperCost = 0; // 100% paperless direct-to-cloud Wi-Fi transmission
  const zoll5YearFleetOperatingCost =
    (zoll5YearComprehensiveMaintenancePerUnit + zollSmartBatteryCostPerUnit + zollThermalPaperCost) * unitCount * 5;

  const netCumulativeSavings = cumulative5YearStatusQuoDrain - zoll5YearFleetOperatingCost + totalTradeInAllowance;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
              <Wrench className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Biomedical Battery &amp; Obsolescence TCO Escalator
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quantifying the hidden annual maintenance tax of keeping legacy competitor monitor fleets ({initialBrand}) past their capital lifecycle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUnitCount(initialUnits);
            setFleetAge(initialAge);
            setIncludeDepotFailures(true);
          }}
          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Monitors in Service:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{unitCount} units</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={unitCount}
            onChange={(e) => setUnitCount(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Fleet Age:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{fleetAge.toFixed(1)} years</span>
          </div>
          <input
            type="range"
            min={3}
            max={14}
            step={0.5}
            value={fleetAge}
            onChange={(e) => setFleetAge(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-3 pt-2 sm:pt-0">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDepotFailures}
              onChange={(e) => setIncludeDepotFailures(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Include Depot Repair Risk ({(annualDepotFailureRiskProbability * 100).toFixed(0)}%/yr)</span>
          </label>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Status Quo Legacy Drain */}
        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Status Quo: Keeping Aging {initialBrand}</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
              {formatCurrency(annualCostPerUnitStatusQuo)} / unit / yr
            </span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-rose-200/60 dark:border-rose-900/40">
              <span>Battery Degradation (2 packs every 21 mos):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(ANNUAL_BATTERY_COST_PER_UNIT * unitCount)}/yr</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-rose-200/60 dark:border-rose-900/40">
              <span>Biomed PM Contract (Age {fleetAge} yrs Parts Surcharge):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(annualBiomedMaintenancePerUnit * unitCount)}/yr</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-rose-200/60 dark:border-rose-900/40">
              <span>Thermal ECG Paper &amp; Stylus Printheads:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(annualThermalPaperPerUnit * unitCount)}/yr</span>
            </div>

            {includeDepotFailures && (
              <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-rose-200/60 dark:border-rose-900/40">
                <span>Expected Out-of-Warranty Depot Failure:</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">+{formatCurrency(annualExpectedDepotFailureCost * unitCount)}/yr</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-right">
            <div className="text-[10px] uppercase font-semibold text-rose-700 dark:text-rose-400">Cumulative 5-Year Maintenance Drain</div>
            <div className="text-xl font-extrabold text-rose-900 dark:text-rose-200">{formatCurrency(cumulative5YearStatusQuoDrain)}</div>
          </div>
        </div>

        {/* Card B: Modernized Protected ZOLL Model */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modernization: ZOLL X Series® Fleet</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Sourcewell Pre-Competed
            </span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <span>SurePower™ II Smart Batteries (4-Yr Life):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(zollSmartBatteryCostPerUnit * unitCount * 5)} (5-Yr Total)</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <span>5-Year Comprehensive Factory Warranty:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(zoll5YearComprehensiveMaintenancePerUnit * unitCount * 5)} (5-Yr Total)</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <span>Thermal Paper Expense (100% Paperless Wi-Fi):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">$0.00 (Zero Waste)</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-300 pb-1 border-b border-emerald-200/60 dark:border-emerald-900/40">
              <span>Trade-In Credit Allowance ($3,500/unit):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(totalTradeInAllowance)} (Instant Equity)</span>
            </div>
          </div>

          <div className="pt-2 text-right">
            <div className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">Net 5-Year Maintenance Outlay</div>
            <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">{formatCurrency(zoll5YearFleetOperatingCost - totalTradeInAllowance)}</div>
          </div>
        </div>
      </div>

      {/* Net 5-Year Financial Advantage Hero Banner */}
      <div className="p-4 rounded-xl bg-blue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-blue-200">
            5-Year Fleet Modernization Advantage
          </div>
          <div className="text-2xl font-black mt-0.5">
            {formatCurrency(netCumulativeSavings)} Net Operational Capital Preserved
          </div>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Redirects biomedical repair waste directly into funding new front-line monitors with trade-in credits under Sourcewell Master Contract #041823-ZOL.
          </p>
        </div>

        {onOpenCoopMemo && (
          <button
            type="button"
            onClick={onOpenCoopMemo}
            className="px-3.5 py-2 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>Generate Sourcewell Memo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
