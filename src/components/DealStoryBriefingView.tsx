/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { 
  calculateAgencyFleetTco, 
  COOPERATIVE_CONTRACTS 
} from '../data/clinicalAndCompetitiveIntelligence';
import { 
  Flame, 
  ShieldAlert, 
  DollarSign, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  FileText, 
  HeartPulse, 
  Award,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react';

interface DealStoryBriefingViewProps {
  agency: Agency;
  variant?: 'compact' | 'full';
  onOpenFullProfile?: (agency: Agency) => void;
  onOpenDossier?: () => void;
  className?: string;
}

export const DealStoryBriefingView: React.FC<DealStoryBriefingViewProps> = ({
  agency,
  variant = 'compact',
  onOpenFullProfile,
  onOpenDossier,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const tco = useMemo(() => {
    return calculateAgencyFleetTco(agency, 5);
  }, [agency]);

  const coopContract = useMemo(() => {
    const isFire = agency.providerCategory === 'FIRE' || (agency.agencyType || '').toLowerCase().includes('fire');
    return isFire ? COOPERATIVE_CONTRACTS[1] : COOPERATIVE_CONTRACTS[0]; // NPPGov or Sourcewell
  }, [agency]);

  const defibBrand = agency.installedFleet?.defibBrand || 'Incumbent';
  const defibAge = agency.installedFleet?.defibAgeYears || 7;
  const defibCount = agency.installedFleet?.defibUnitsCount || 8;
  const warranty = agency.installedFleet?.defibWarrantyStatus || 'Expired';
  const denialRate = agency.cmsData?.claimDenialRate || 14.2;
  const recoverableK = Math.round((agency.cmsData?.estimatedRecoverableRevenue || 85000) / 1000);
  const fiveYrSavingsK = Math.round(tco.fiveYearOperatingSavings / 1000);
  const tradeInK = Math.round(tco.totalTradeInCredit / 1000);
  const totalFinancialBenefitK = fiveYrSavingsK + tradeInK + Math.round(recoverableK * 3);

  // Generate customized Elevator Pitch
  const elevatorPitch = useMemo(() => {
    return `Chief / Director at ${agency.name}: Your current ${defibBrand} fleet of ${defibCount} units is ${defibAge} years old and currently ${warranty.toLowerCase()}. By transitioning to ZOLL X Series Advanced, the department captures $${tradeInK}K in immediate fleet trade-in credits, saves $${fiveYrSavingsK}K over 5 years on biomedical service contracts, and protects an estimated +$${recoverableK}K/year in recoverable Medicare ambulance claims through automated 12-lead ePCR documentation. Best of all, this can be procured immediately under the ${coopContract.contractName} (${coopContract.contractNumber}), bypassing the 6-9 month public sealed bid process.`;
  }, [agency, defibBrand, defibCount, defibAge, warranty, tradeInK, fiveYrSavingsK, recoverableK, coopContract]);

  const handleCopy = () => {
    navigator.clipboard.writeText(elevatorPitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const toggleSection = (sec: string) => {
    setExpandedSection(prev => prev === sec ? null : sec);
  };

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-slate-900/90 text-left transition-all ${className}`}>
        {/* Header / Hook */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Executive Deal Story: Why {agency.name.split(' ')[0]} Now?
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Strategic conversion narrative · {defibBrand} replacement window
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            title="Copy Elevator Pitch"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-xs shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy Pitch</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 my-3 text-xs">
          {/* Pillar 1: Incumbent Vulnerability */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400 text-[11px] mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>1. Incumbent Vulnerability</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-100">{defibCount} {defibBrand}</strong> units ({defibAge} yrs old, {warranty.toLowerCase()}). Escalating preventative maintenance renewal costs (+16% YoY).
            </p>
          </div>

          {/* Pillar 2: Financial Leverage */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>2. 5-Yr Financial ROI</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono tabular-nums">+${fiveYrSavingsK}K</strong> operating savings + <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">${tradeInK}K</strong> trade-in allowance. Recover +${recoverableK}K/yr in billing.
            </p>
          </div>

          {/* Pillar 3: Procurement Bypass */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400 text-[11px] mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>3. Fast-Track Vehicle</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Pre-approved under <strong className="text-slate-900 dark:text-slate-100">{coopContract.contractName.split(' ')[0]}</strong> ({coopContract.contractNumber}), saving 6–9 mos of public RFP delays.
            </p>
          </div>
        </div>

        {/* Narrative Accordion / Pitch Preview */}
        <div className="p-2.5 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-blue-900 dark:text-blue-300">TM Quick Pitch: </span>
          <span>"{elevatorPitch.slice(0, 160)}..." </span>
          {onOpenFullProfile && (
            <button
              onClick={() => onOpenFullProfile(agency)}
              className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline ml-1"
            >
              <span>View full strategy & objections</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // FULL-SCREEN VARIANT
  return (
    <div className={`p-6 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-sm text-left ${className}`}>
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Executive Deal Story & Conversion Playbook
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Priority Opportunity
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Targeted account conversion thesis for ZOLL Territory Managers · {agency.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDossier && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1E3A8A] text-white hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
              title="Open printable 2-page Executive Briefing Dossier with direct PDF download"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF Brief</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">Pitch Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Copy Elevator Pitch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 30-Second Elevator Pitch Card */}
      <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            30-Second Executive Elevator Pitch
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans italic">
          "{elevatorPitch}"
        </p>
      </div>

      {/* 4 Core Narrative Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {/* 1. Incumbent Pain */}
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>1. Incumbent Crisis</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {defibAge} Yrs Old
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1.5">
            {warranty} Warranty ({defibCount} units)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Stryker/Incumbent hardware aging past safe service life. Rising annual ProCare renewals and MAUDE/FDA advisory notices.
          </p>
        </div>

        {/* 2. Clinical Advantage */}
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs mb-2">
            <HeartPulse className="w-4 h-4" />
            <span>2. Clinical Protocol</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {agency.utsteinSurvivalRate || 10.8}% Utstein
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1.5">
            AHA Guideline Upgrade
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Real BVM Help provides real-time ventilation rate and tidal volume feedback to eliminate hyperventilation in cardiac arrest.
          </p>
        </div>

        {/* 3. Financial Savings */}
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2">
            <DollarSign className="w-4 h-4" />
            <span>3. 5-Yr Financial ROI</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            +${totalFinancialBenefitK}K
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1.5">
            Net Financial Value
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            ${fiveYrSavingsK}K lower maintenance costs + ${tradeInK}K direct trade-in credit + ${recoverableK}K/yr recoverable Medicare claims.
          </p>
        </div>

        {/* 4. Procurement Speed */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs mb-2">
            <Award className="w-4 h-4" />
            <span>4. Purchasing Fast-Track</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            6–9 Mos Saved
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1.5">
            {coopContract.contractNumber}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Procure immediately via {coopContract.contractName.split(' ')[0]} cooperative purchasing, satisfying all public competition rules.
          </p>
        </div>
      </div>

      {/* Recommended TM Meeting Tactics & Objections */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          Tactical Meeting Playbook & Trap Questions
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Question 1: For the Fire Chief / Director */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Trap Question · Fire Chief / EMS Director
            </span>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-1 mb-1.5">
              "How much has your annual biomedical preventative maintenance contract increased year-over-year on your {defibBrand} fleet?"
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pivot: Show that ZOLL guarantees fixed 5-year biomedical service caps, saving ${fiveYrSavingsK}K over 5 years.
            </p>
          </div>

          {/* Question 2: For Medical Director / Quality Officer */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Trap Question · Medical Director / CQI Officer
            </span>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-1 mb-1.5">
              "Can your current monitors tell paramedics on scene whether they are hyperventilating a patient during CPR?"
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pivot: Highlight that only ZOLL X Series Advanced provides Real BVM Help breath-by-breath volume feedback on screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
