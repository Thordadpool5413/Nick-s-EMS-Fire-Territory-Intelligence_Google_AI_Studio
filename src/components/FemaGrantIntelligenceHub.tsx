/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FEMA AFG & SAFER Grant Intelligence & Technical Narrative Generator
 * Equips territory managers and fire/EMS chiefs with funding cycle deadlines,
 * cost-share calculation, and 1-click compliant FEMA grant narrative justifications.
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import {
  Award,
  Calendar,
  Clock,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { formatCurrency, formatInteger } from '../utils/formatters';

interface FemaGrantIntelligenceHubProps {
  agency: Agency;
  onOpenCoopMemo?: () => void;
}

export const FemaGrantIntelligenceHub: React.FC<FemaGrantIntelligenceHubProps> = ({
  agency,
  onOpenCoopMemo
}) => {
  const [selectedGrantType, setSelectedGrantType] = useState<'afg_operations' | 'afg_micro' | 'safer'>(
    'afg_operations'
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Agency data points
  const population = agency.populationServed || 45000;
  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
  const monitorCount = agency.installedFleet?.defibUnitsCount || Math.max(4, agency.totalAmbulances + 2);
  const monitorBrand = agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';
  const monitorAge = agency.installedFleet?.defibAgeYears || 7.5;
  const warranty = agency.installedFleet?.defibWarrantyStatus || 'Expired OEM Support';
  const cardiacCalls = agency.annualCardiacArrestCalls || 120;
  const survivalRate = agency.utsteinSurvivalRate || 24;

  // FEMA Cost Share Calculation per statutory population guidelines:
  // - <= 20,000 population: 95% Federal / 5% Local Match
  // - 20,001 - 1,000,000: 90% Federal / 10% Local Match
  // - > 1,000,000: 85% Federal / 15% Local Match
  const { federalSharePct, localMatchPct, matchTierLabel } = useMemo(() => {
    if (population <= 20000) {
      return { federalSharePct: 95, localMatchPct: 5, matchTierLabel: 'Rural / Small Municipality (95% Federal / 5% Match)' };
    }
    if (population <= 1000000) {
      return { federalSharePct: 90, localMatchPct: 10, matchTierLabel: 'Standard Municipal District (90% Federal / 10% Match)' };
    }
    return { federalSharePct: 85, localMatchPct: 15, matchTierLabel: 'Major Metro / Regional Authority (85% Federal / 15% Match)' };
  }, [population]);

  // Estimated Project Costs
  const estimatedCostPerUnit = 32500;
  const tradeInCreditPerUnit = 3500;
  const unitsRequested = selectedGrantType === 'afg_micro' ? Math.min(2, monitorCount) : monitorCount;
  const grossEquipmentTotal = unitsRequested * estimatedCostPerUnit;
  const totalTradeInCredits = unitsRequested * tradeInCreditPerUnit;
  const netProjectCost = grossEquipmentTotal - totalTradeInCredits;
  const estimatedFederalAward = Math.round((netProjectCost * federalSharePct) / 100);
  const estimatedLocalMatch = netProjectCost - estimatedFederalAward;

  // Grant Cycle Dates (Federal Fiscal Year Active Window)
  const grantCycle = {
    fiscalYear: 'FY2026 / FY2027',
    applicationWindowStatus: 'Application Window Open',
    deadlineDate: 'April 24, 2026 (5:00 PM ET)',
    daysRemaining: 42,
    awardAnnouncementPeriod: 'Rolling Awards: August - November 2026',
    cfdaNumber: 'CFDA 97.044 (Assistance to Firefighters Grant)',
    guidanceUrl: 'https://www.fema.gov/grants/preparedness/firefighters'
  };

  // Pre-formatted FEMA NOFO Justification Narrative
  const fullNarrativeText = useMemo(() => {
    return `FEDERAL EMERGENCY MANAGEMENT AGENCY (FEMA)
ASSISTANCE TO FIREFIGHTERS GRANT (AFG) PROGRAM
EQUIPMENT ACQUISITION & FIREFIGHTER SAFETY JUSTIFICATION

APPLICANT AGENCY: ${agency.name.toUpperCase()}
JURISDICTION: ${agency.city}, ${agency.stateCode} (Population Served: ${population.toLocaleString()})
REQUESTED ACTIVITY: Operations and Safety - EMS Equipment (High-Priority Cardiac Resuscitation Fleet)
EQUIPMENT SPECIFICATION: ZOLL X Series® Advanced Monitor/Defibrillator & Real BVM Help®
PROCUREMENT MECHANISM: Pre-Competed National Cooperative Contract (Sourcewell #041823-ZOL)

--------------------------------------------------------------------------------
SECTION 1: STATEMENT OF IMMEDIATE OPERATIONAL RISK & EQUIPMENT OBSOLESCENCE
${agency.name} currently operates ${unitsRequested} front-line cardiac monitor/defibrillators (${monitorBrand}) with an average in-service age of ${monitorAge} years (${warranty}). 

These units exceed the National Fire Protection Association (NFPA 1901/1917) and OEM recommended frontline capital lifecycle of 5 to 7 years. Because critical internal components (including processor boards and display backlights) are discontinued by the manufacturer, our biomedical maintenance expenditures have escalated significantly. More critically, extended service turnaround and battery degradation place our responders and cardiac arrest patients at unacceptable risk of sudden in-transport power failure.

Replacing this aging fleet with modern, military-grade ZOLL X Series® Advanced units immediately restores 100% operational readiness across all front-line apparatus.

--------------------------------------------------------------------------------
SECTION 2: FIREFIGHTER HEALTH, SAFETY & ERGONOMIC INJURY MITIGATION
Firefighter and paramedic musculoskeletal injuries from lifting and transporting heavy diagnostic equipment represent a leading cause of line-of-duty workers' compensation claims. 

The requested ZOLL X Series® Advanced weighs less than 12.0 lbs (5.4 kg) fully equipped with battery and paper—over 6.0 lbs lighter (35% weight reduction) than our current ${monitorBrand} units. This weight reduction directly diminishes biomechanical torque and lumbar spine strain when personnel ascend multi-story residential structures, navigate narrow stairwells, or perform patient extrications. 

--------------------------------------------------------------------------------
SECTION 3: CLINICAL RESUSCITATION EXCELLENCE & VENTILATION COMPLIANCE
Our department responds to approximately ${cardiacCalls} out-of-hospital cardiac arrest (OHCA) events annually within our jurisdiction. Current national resuscitation protocols emphasize that inadvertent paramedic hyperventilation during CPR causes increased intrathoracic pressure, severely diminishes venous return to the heart, and induces lethal cerebral vasoconstriction.

The requested ZOLL X Series® Advanced incorporates proprietary Real BVM Help® technology, which provides real-time objective feedback on ventilation rate and tidal volume directly through the bag-valve-mask. This is the only FDA-cleared technology that actively prevents hyperventilation in adult and pediatric resuscitation. Furthermore, the units feature CPR Dashboard™ with real-time numerical chest compression depth, rate, and release velocity feedback to ensure strict compliance with AHA Guidelines.

--------------------------------------------------------------------------------
SECTION 4: FINANCIAL NEED, COST REASONABLENESS & COOPERATIVE PROCUREMENT
Under statutory FEMA AFG population guidelines for ${population.toLocaleString()} residents, the applicant qualifies for a ${federalSharePct}% Federal Share with a ${localMatchPct}% Local Cash Match.

Total Gross Equipment Cost (${unitsRequested} units): ${formatCurrency(grossEquipmentTotal)}
Less Guaranteed Trade-In Credits ($3,500/unit): -${formatCurrency(totalTradeInCredits)}
Net Total Project Investment: ${formatCurrency(netProjectCost)}
Federal Grant Funding Requested (${federalSharePct}%): ${formatCurrency(estimatedFederalAward)}
Local Municipal Cash Match Committed (${localMatchPct}%): ${formatCurrency(estimatedLocalMatch)}

To guarantee maximum taxpayer stewardship and comply with 2 CFR § 200.318 federal competitive procurement standards, ${agency.name} will procure these units under national pre-competed Sourcewell Master Contract #041823-ZOL and HGACBuy Contract #EE08-24. This pre-competed cooperative pricing locks in aggressive volume discounting and completely bypasses prolonged single-source sole-justification challenges.
`;
  }, [agency, population, unitsRequested, monitorBrand, monitorAge, warranty, cardiacCalls, grossEquipmentTotal, totalTradeInCredits, netProjectCost, federalSharePct, localMatchPct, estimatedFederalAward, estimatedLocalMatch]);

  const handleCopyNarrative = () => {
    navigator.clipboard.writeText(fullNarrativeText);
    setCopiedSection('all');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleDownloadMemo = () => {
    const blob = new Blob([fullNarrativeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FEMA_AFG_Grant_Justification_${agency.city.replace(/\s+/g, '_')}_${agency.stateCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
              <Award className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              FEMA AFG &amp; SAFER Grant Intelligence &amp; Narrative Generator
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated statutory cost-share calculation, grant cycle countdown, and 1-click FEMA NOFO justification narrative.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyNarrative}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSection === 'all' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Narrative</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadMemo}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT Memo</span>
          </button>
        </div>
      </div>

      {/* Grant Cycle Countdown & Category Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{grantCycle.fiscalYear} AFG Cycle</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px]">
              {grantCycle.applicationWindowStatus}
            </span>
          </div>
          <div className="text-xl font-extrabold text-blue-950 dark:text-blue-100 mt-1">
            {grantCycle.daysRemaining} Days Left
          </div>
          <div className="text-[11px] text-blue-800 dark:text-blue-300">
            FEMA Portal Deadline: <strong className="font-semibold">{grantCycle.deadlineDate}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Statutory Cost-Share Matching Tier
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {federalSharePct}% Federal / {localMatchPct}% Local
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            {matchTierLabel} (Pop: {population.toLocaleString()})
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            FEMA Priority Activity Rating
          </div>
          <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
            Priority 1 (High Priority)
          </div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
            EMS Equipment: Defibrillator replacement for units &gt; 7 yrs
          </div>
        </div>
      </div>

      {/* Grant Type Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium max-w-fit">
        <button
          type="button"
          onClick={() => setSelectedGrantType('afg_operations')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            selectedGrantType === 'afg_operations'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AFG Operations &amp; Safety (Full Fleet: {monitorCount} Units)
        </button>

        <button
          type="button"
          onClick={() => setSelectedGrantType('afg_micro')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            selectedGrantType === 'afg_micro'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AFG Micro-Grant (&le; $75,000 / 2 Units Expedited)
        </button>
      </div>

      {/* Financial Pro-Forma & Trade-In Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>FEMA Grant Budget Summary &amp; Local Match Calculator</span>
          </span>
          <span className="text-slate-500 font-normal">
            Sourcewell Contract #041823-ZOL Applied
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Units Requested</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{unitsRequested}× X Series</div>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Gross List Value</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(grossEquipmentTotal)}</div>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
            <div className="text-[10px] uppercase font-semibold">Trade-In Allowance</div>
            <div className="text-base font-bold mt-0.5">-{formatCurrency(totalTradeInCredits)}</div>
          </div>

          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-lg border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
            <div className="text-[10px] uppercase font-semibold">Federal Award ({federalSharePct}%)</div>
            <div className="text-base font-extrabold mt-0.5">{formatCurrency(estimatedFederalAward)}</div>
          </div>

          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
            <div className="text-[10px] uppercase font-semibold">City Match ({localMatchPct}%)</div>
            <div className="text-base font-extrabold mt-0.5">{formatCurrency(estimatedLocalMatch)}</div>
          </div>
        </div>
      </div>

      {/* Narrative Preview Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>FEMA NOFO Technical Justification Statement (Formatted for Direct Paste into FEMA GO Portal)</span>
          </span>
          <a
            href={grantCycle.guidanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px]"
          >
            <span>FEMA GO Grant Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-slate-800 whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
          {fullNarrativeText}
        </pre>
      </div>
    </div>
  );
};
