/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NATIONAL_BENCHMARKS, STATE_SUMMARIES } from '../data/healthcareData';
import { Agency } from '../types';
import { 
  Building2, 
  TrendingDown, 
  Award, 
  FileCheck2, 
  Activity, 
  ShieldCheck, 
  BookOpen, 
  ChevronRight,
  Database,
  ArrowRight,
  Search,
  Scale,
  DollarSign,
  AlertTriangle,
  Flame,
  Siren
} from 'lucide-react';
interface PublicHealthcareExplorerProps {
  onSelectStateFilter: (stateCode: string) => void;
  onNavigateToQueue: () => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
}

export const PublicHealthcareExplorer: React.FC<PublicHealthcareExplorerProps> = ({
  onSelectStateFilter,
  onNavigateToQueue,
  activeAccount
}) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<'cms' | 'rosc' | 'fleet' | 'afg' | 'nemsqa' | 'et3'>('cms');

  return (
    <div className="space-y-5">

      {/* Active Account Clinical Telemetry Banner when an account is selected */}
      {activeAccount && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
              activeAccount.providerCategory === 'FIRE' || activeAccount.agencyType.toLowerCase().includes('fire')
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                : 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300'
            }`}>
              {activeAccount.providerCategory === 'FIRE' || activeAccount.agencyType.toLowerCase().includes('fire') ? <Flame className="w-5 h-5" /> : <Siren className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  LOCKED ACCOUNT CMS TELEMETRY
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">NPI: {activeAccount.npiNumber || '1497821034'}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {activeAccount.name} — {activeAccount.city}, {activeAccount.stateCode}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">CMS Denial Rate</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold tabular-nums text-sm">{activeAccount.cmsData.claimDenialRate}%</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Annual 911 Runs</span>
              <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm">{activeAccount.annual911Transports.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Primary Insurer</span>
              <span className="text-sky-700 dark:text-sky-300 font-bold text-sm">{activeAccount.cmsData.primaryPayerMix || (activeAccount.cmsData.medicareBilledAnnual > activeAccount.cmsData.medicaidBilledAnnual ? 'Medicare FFS' : 'Commercial')}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-lg">
              <span className="text-emerald-700 dark:text-emerald-300 block text-[10px]">Est. Deal Value</span>
              <span className="text-emerald-800 dark:text-emerald-400 font-bold tabular-nums text-sm">${(activeAccount.zollOpportunity.estimatedDealValue ?? activeAccount.zollOpportunity.projectedPipelineValue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Consultant Executive Briefing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-sky-700 dark:text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Strategic Consultant & Business Analyst Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              Public Healthcare, CMS Claims & EMS Outcomes Engine
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-3xl leading-relaxed">
              How territory managers leverage public datasets—CMS Medicare Part B ground ambulance claims, NEMSIS cardiac call volumes, USFA registries, CARES survival benchmarks, and FEMA AFG grant allocations—to prioritize accounts and consultative proposals.
            </p>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 p-4 rounded-xl shrink-0 text-right">
            <div className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">Total Public Addressable EMS Market</div>
            <div className="font-mono text-2xl font-bold text-sky-950 dark:text-white tabular-nums mt-0.5">$5.8B Annual</div>
            <div className="text-[10px] text-sky-700 dark:text-sky-400 mt-0.5">CMS Ground Ambulance Medicare Part B</div>
          </div>
        </div>

        {/* National Macro Benchmarks — Flush 1px Architectural Hairline Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-6">
          <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">National Medicare Denial Rate</div>
            <div className="font-mono text-xl font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
              {NATIONAL_BENCHMARKS.averageMedicareDenialRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Top: Medical necessity &amp; missing signatures</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">CARES Cardiac Survival (Utstein)</div>
            <div className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
              {NATIONAL_BENCHMARKS.averageUtsteinSurvivalRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Agencies &lt;25% need AutoPulse + Real BVM</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Annual 911 Ambulance Runs</div>
            <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {(NATIONAL_BENCHMARKS.totalAmbulanceTransports / 1000000).toFixed(1)}M
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across 21,450 registered agencies</div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Annual Federal AFG Allocations</div>
            <div className="font-mono text-xl font-bold text-sky-700 dark:text-sky-400 tabular-nums mt-1">
              ${(NATIONAL_BENCHMARKS.totalAfgFundingAllocated / 1000000).toFixed(0)}M
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Direct capital grants for EMS &amp; Fire</div>
          </div>
        </div>
      </div>

      {/* State-by-State Public Data Intelligence */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">State-by-State Healthcare &amp; Reimbursement Comparison</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any state to instantly filter and populate territory pipeline opportunities.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            8 Benchmark States
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">State / Jurisdiction</th>
                <th className="py-2.5 px-3 text-right">Registered Agencies</th>
                <th className="py-2.5 px-3 text-right">Avg Medicare Denial Rate</th>
                <th className="py-2.5 px-3 text-right">Cardiac Survival (Utstein)</th>
                <th className="py-2.5 px-3 text-right">YTD AFG Grant Awards</th>
                <th className="py-2.5 px-3 text-center">Medicaid Expansion</th>
                <th className="py-2.5 px-3 text-right">High-Value Leads</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {Object.values(STATE_SUMMARIES).map((summary) => (
                <tr key={summary.code} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white">
                    {summary.state} ({summary.code})
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                    {summary.totalAgencies.toLocaleString()}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold tabular-nums ${
                    summary.avgMedicareDenialRate > 18 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {summary.avgMedicareDenialRate}%
                  </td>
                  <td className={`py-3 px-3 text-right tabular-nums ${
                    summary.avgUtsteinSurvival < 28 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {summary.avgUtsteinSurvival}%
                  </td>
                  <td className="py-3 px-3 text-right text-sky-800 dark:text-sky-400 font-bold tabular-nums">
                    ${(summary.totalAfgAwardsYtd / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    {summary.medicaidExpansion ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Expanded</span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Non-Expanded</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-amber-800 dark:text-amber-400 tabular-nums">
                    {summary.highPriorityLeadsCount} accounts
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      onClick={() => {
                        onSelectStateFilter(summary.code);
                        onNavigateToQueue();
                      }}
                      className="text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 font-semibold text-xs flex items-center gap-1 justify-end ml-auto"
                    >
                      <span>Filter Queue</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Territory Consultant Playbooks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Territory Manager Public Data Strategic Selling Playbooks
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select a clinical or financial playbook to review the consultative positioning and sales soundbites.
        </p>

        {/* Playbook Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <button
            onClick={() => setSelectedPlaybook('cms')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'cms'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>1. CMS Denials</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">ZOLL Billing & AR Boost</div>
          </button>

          <button
            onClick={() => setSelectedPlaybook('rosc')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'rosc'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>2. Cardiac ROSC</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">AutoPulse + Real BVM</div>
          </button>

          <button
            onClick={() => setSelectedPlaybook('fleet')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'fleet'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>3. Aging Rivals</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">LP15 & Philips MRx EOL</div>
          </button>

          <button
            onClick={() => setSelectedPlaybook('afg')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'afg'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>4. Federal AFG</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Direct Grant Spend</div>
          </button>

          <button
            onClick={() => setSelectedPlaybook('nemsqa')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'nemsqa'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>5. NEMSQA Quality</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">AHA Gold Plus Criteria</div>
          </button>

          <button
            onClick={() => setSelectedPlaybook('et3')}
            className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedPlaybook === 'et3'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-semibold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>6. ET3 & MIH</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Wall Time Reduction</div>
          </button>
        </div>

        {/* Selected Playbook Content */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          {selectedPlaybook === 'cms' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 1: The CMS Medicare Ground Ambulance Reimbursement Play
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> CMS Medicare Part B ground ambulance claims show that departments with in-house or generic municipal clearinghouses suffer average denial rates of 18% to 25%. Under the mandatory Ground Ambulance Data Collection System (GADCS), agencies that fail to report or submit incomplete trip logs face a statutory 10% payment reduction penalty across all Medicare transports.
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Pitch <strong>ZOLL Billing and AR Boost</strong> directly to the City Finance Director, Town Auditor, and EMS Chief. Show them that AR Boost automated demographic matching and insurance discovery finds commercial insurance coverage on Medicare Advantage patients, immediately increasing collection rates by $85–$140 per transport.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Chief, your county is currently writing off $785,000 every year in denied ambulance claims because of documentation technicalities. ZOLL Billing scrubs those claims automatically before submission—recovering more than enough cash to replace your entire defibrillator fleet."
              </div>
            </>
          )}

          {selectedPlaybook === 'rosc' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 2: The Out-of-Hospital Cardiac Arrest (OHCA) Survival Play
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> CARES and NEMSIS cardiac arrest registry data reveals counties where the Utstein survival rate falls below the 29.7% national benchmark (e.g., Cuyahoga 24.2%, Akron 23.5%, Harris 21.8%).
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Pitch the combined <strong>AutoPulse Resuscitation System</strong> and <strong>X Series Advanced Real BVM Help</strong> to the EMS Medical Director and Training Captain. Point out that manual chest compressions degrade significantly during stairwell extrications and high-speed transit. The AutoPulse circumferential band provides continuous cerebral and coronary perfusion. Real BVM Help prevents hyperventilation—the leading cause of decreased survival in resuscitation.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Dr. Chen, your medics are doing hero work, but physics is working against them down 3 flights of stairs. The AutoPulse delivers unbroken compressions from living room to cath lab. Combined with Real BVM Help ventilation rate feedback, we consistently see peer agencies boost survival by 10 to 14 percentage points."
              </div>
            </>
          )}

          {selectedPlaybook === 'fleet' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 3: The Aging Competitor Fleet & Obsolescence Replacement
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> USFA equipment rosters indicate that over 40% of fire and EMS agencies still operate 8-to-11-year-old Stryker LIFEPAK 15 (v1/v2) and phased-out Philips HeartStart MRx monitors. Stryker has escalated annual maintenance fees by 20%+, and Philips no longer manufactures MRx replacement circuit boards.
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Offer the <strong>X Series Advanced Trade-In Program</strong>. Present the 11.7 lb weight advantage (reducing back strain on medics compared to 19+ lb LIFEPAK units) plus the integrated Traumatic Brain Injury (TBI) EPIC protocol dashboard.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Chief, your LP15 monitors are now out of factory warranty. When a battery or display board fails next week, Stryker's turnaround is 6 to 8 weeks. ZOLL will give you $3,500 per unit in trade-in credits, deliver an 11-pound modern monitor, and bundle 5-year on-site comprehensive warranty coverage."
              </div>
            </>
          )}

          {selectedPlaybook === 'afg' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 4: The FEMA Assistance to Firefighters Grant (AFG) Fast-Track
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> FEMA publishes public lists of fire and EMS departments awarded AFG and SAFER grants under the "Operations and Safety - EMS Equipment" category.
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Contact awarded departments within 48 hours of public listing. Provide ready-to-sign procurement packets utilizing national purchasing cooperatives (Sourcewell and HGACBuy), which allows the Chief to spend the federal grant immediately without holding a 6-month competitive RFP.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Congratulations on the $485,000 AFG award! Because ZOLL is already awarded under Sourcewell Contract #041223-ZOL, you don't have to navigate a complex bid process. We can lock in your delivery schedule today and ensure compliance with all federal procurement guidelines."
              </div>
            </>
          )}

          {selectedPlaybook === 'nemsqa' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 5: NEMSQA Quality Measures & AHA Mission: Lifeline Recognition
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> NEMSIS v3 public eOutcomes show that agencies struggle with STEMI 12-lead acquisition speed (&le;10 min), chest compression fraction (CCF &lt;75%), and end-tidal CO2 (ETCO2) ventilation compliance during resuscitation. Many departments are stuck at Bronze or Silver AHA Mission: Lifeline recognition due to manual documentation delays.
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Present the <strong>X Series Advanced with Real CPR Help and Real BVM Help</strong> alongside <strong>RescueNet ePCR</strong>. Real BVM Help automatically records rate and tidal volume directly into the ePCR, providing audit-proof compliance for AHA Mission: Lifeline Gold Plus recognition.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Chief, achieving AHA Mission: Lifeline Gold Plus status not only showcases clinical excellence to your city council, but it protects your agency against malpractice liability. ZOLL provides the only clinical system that measures real-time ventilation rate and depth directly at the patient's side."
              </div>
            </>
          )}

          {selectedPlaybook === 'et3' && (
            <>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Playbook 6: CMS ET3, Hospital Handoff Reduction & Community Paramedicine
              </div>
              <p>
                <strong>The Public Data Trigger:</strong> CMS Emergency Triage, Treat, and Transport (ET3) models and Mobile Integrated Health (MIH) regulations permit reimbursement for treatment-in-place and transport to alternative destinations (urgent care, behavioral crisis centers). In urban areas, transfer-of-care (hospital wall time) averages 45+ minutes, depleting front-line 911 coverage.
              </p>
              <p>
                <strong>The ZOLL Solution:</strong> Deploy <strong>ZOLL Respond CAD and RescueNet Telehealth</strong>. Paramedics can initiate secure video telemetry consults directly from the scene, receive emergency physician sign-off for treatment-in-place, and bill Medicare at standard transport rates without unnecessary hospital transfer delays.
              </p>
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-sky-300 rounded-xl font-mono text-[11px] leading-relaxed">
                Key Soundbite: "Every minute your crews wait on hospital wall time costs your city $8.50 in unbilled labor while leaving districts uncovered. ZOLL Telehealth and ET3 billing integration allow your medics to treat and release low-acuity patients on scene while generating Medicare reimbursement."
              </div>
            </>
          )}
        </div>

      </div>

      {/* NEMSQA & CARES National Quality Benchmark Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">NEMSQA & CARES National Clinical Quality Standards</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative pre-hospital clinical quality metrics driving resuscitation hardware adoption.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2.5 py-1 rounded-md font-semibold">
            National Registry Benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">STEMI 12-Lead Acquisition &le;10 min</div>
            <div className="font-mono text-2xl font-bold text-sky-800 dark:text-sky-400 tabular-nums mt-1">
              {NATIONAL_BENCHMARKS.nemsqaStemi12LeadAcquisitionPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">NEMSQA Cardiac-01 Benchmark</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              ZOLL cellular telemetry transmits ECG directly to cath lab interventionalists, reducing door-to-balloon times by up to 20 minutes.
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Chest Compression Fraction (CCF)</div>
            <div className="font-mono text-2xl font-bold text-emerald-800 dark:text-emerald-400 tabular-nums mt-1">
              {NATIONAL_BENCHMARKS.nemsqaChestCompressionFractionPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Target &ge;80% for Favorable ROSC</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              AutoPulse circumferential band eliminates compressions pauses down stairs and during ambulance transport, maintaining 95%+ CCF.
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Favorable Cerebral Survival (CPC 1/2)</div>
            <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {NATIONAL_BENCHMARKS.caresGoodNeurologicalSurvivalPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">CARES Registry Discharge Benchmark</div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Real CPR Help and Real BVM Help prevent hyperventilation and maintain optimal cerebral perfusion pressure throughout resuscitation.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
