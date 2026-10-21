/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency, LeadStage, FieldNote } from '../types';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  ShieldAlert, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Bookmark, 
  Navigation, 
  Sliders,
  FileText,
  User,
  HeartPulse,
  Send,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import { QualityScorecard } from './QualityScorecard';

interface AgencyDossierModalProps {
  agency: Agency;
  onClose: () => void;
  onUpdateStage: (agencyId: string, stage: LeadStage) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  isOnline: boolean;
  onOpenRfpGenerator?: (agency: Agency) => void;
}

export const AgencyDossierModal: React.FC<AgencyDossierModalProps> = ({
  agency,
  onClose,
  onUpdateStage,
  onToggleRoute,
  onToggleBookmark,
  onAddFieldNote,
  isOnline,
  onOpenRfpGenerator
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'clinical' | 'quality' | 'cms' | 'grants' | 'stakeholders' | 'notes'>('score');
  
  // Interactive CMS ROI Simulator State
  const [simTransports, setSimTransports] = useState<number>(agency.annual911Transports);
  const [simTargetDenial, setSimTargetDenial] = useState<number>(2.5); // Target denial rate with ZOLL Billing
  
  // Note Form State
  const [newMeetingType, setNewMeetingType] = useState<FieldNote['meetingType']>('On-Site Station Visit');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNextAction, setNewNextAction] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-10-30');

  const stages: LeadStage[] = [
    'Target Lead',
    'Contacted / Intro',
    'Demo Scheduled',
    'Clinical Evaluation Trial',
    'RFP / Quoting',
    'Contract Won'
  ];

  // Calculated ROI
  const avgReimbursementPerTransport = 480; // Medicare Part B ALS/BLS blended average
  const currentLostRevenue = (simTransports * (agency.cmsData.claimDenialRate / 100)) * avgReimbursementPerTransport;
  const newLostRevenue = (simTransports * (simTargetDenial / 100)) * avgReimbursementPerTransport;
  const annualRecoveredRevenue = Math.max(0, currentLostRevenue - newLostRevenue);

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    onAddFieldNote(agency.id, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Sarah Jenkins (TM)',
      meetingType: newMeetingType,
      notes: newNoteText.trim(),
      nextAction: newNextAction.trim() || 'Follow up with Fire Chief',
      dueDate: newDueDate
    });

    setNewNoteText('');
    setNewNextAction('');
  };

  const bd = agency.zollOpportunity.scoreBreakdown || {
    clinicalAcuityPts: 24,
    fleetObsolescencePts: 25,
    cmsFinancialPts: 19,
    demographicVulnerabilityPts: 14,
    budgetGrantReadinessPts: 15
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-900">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 font-mono font-bold text-lg flex items-center justify-center shrink-0 tabular-nums shadow-xs">
              {agency.zollOpportunity.pulseIqScore}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {agency.name}
                </h1>
                <span className="text-xs font-mono text-sky-800 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {agency.zollOpportunity.priorityTier}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  [{agency.gisData.territoryClusterName.split(' ')[0]} Cluster]
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {agency.address}
                </span>
                <span aria-hidden="true">·</span>
                <span>FDID: <strong className="text-slate-700 font-mono">{agency.fdid}</strong></span>
                <span aria-hidden="true">·</span>
                <span>{agency.agencyType}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            
            {/* Stage Selector */}
            <select
              value={agency.zollOpportunity.salesStage}
              onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-sky-800 font-semibold focus:outline-none focus:border-sky-500 shadow-2xs"
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Route Button */}
            <button
              onClick={() => onToggleRoute(agency.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors shadow-2xs ${
                agency.inDayRoute 
                  ? 'bg-sky-600 text-white border-sky-600' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{agency.inDayRoute ? 'On Route' : 'Add Route'}</span>
            </button>

            {/* Pre-Emptive RFP Spec Generator Button */}
            {onOpenRfpGenerator && (
              <button
                onClick={() => onOpenRfpGenerator(agency)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Generate Pre-Emptive Technical RFP Specifications"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">RFP Spec</span>
              </button>
            )}

            {/* Bookmark */}
            <button
              onClick={() => onToggleBookmark(agency.id)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-400 hover:text-amber-500 transition-colors shadow-2xs"
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-400 hover:text-slate-800 transition-colors shadow-2xs"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('score')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'score' ? 'border-sky-600 text-sky-700 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Score Rationale & Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('clinical')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'clinical' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Clinical & Fleet Intel</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'quality' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Clinical Quality Scorecard</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'cms' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>CMS Claims & ROI Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('grants')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'grants' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>AFG Grants & Budget</span>
          </button>

          <button
            onClick={() => setActiveTab('stakeholders')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'stakeholders' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Key Stakeholders ({agency.keyContacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'notes' ? 'border-sky-600 text-sky-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Field Visits & Outbox ({agency.fieldNotes.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 0: Score Rationale & Math Breakdown */}
          {activeTab === 'score' && (
            <div className="space-y-6">
              
              {/* Score Rationale Card */}
              <div className="bg-slate-950 border border-cyan-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Predictive Model Score Audit & Strategic Rationale
                  </div>
                  <span className="font-mono text-sm font-extrabold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 tabular-nums">
                    Score: {agency.zollOpportunity.pulseIqScore} / 100
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {agency.zollOpportunity.scoreRationale}
                </p>
              </div>

              {/* Point-by-Point Factor Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                  Multi-Factor Point Allocation (100 Pt Model)
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Factor 1 */}
                  <div>
                    <div className="flex items-center justify-between text-slate-200 mb-1">
                      <span>1. Clinical Acuity, OHCA Calls & Transport Time</span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">{bd.clinicalAcuityPts} / 25 pts</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(bd.clinicalAcuityPts / 25) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.annualCardiacArrestCalls} annual cardiac arrests · {agency.gisData.avgTransportTimeMinutes} min transport time · {agency.utsteinSurvivalRate}% survival
                    </div>
                  </div>

                  {/* Factor 2 */}
                  <div>
                    <div className="flex items-center justify-between text-slate-200 mb-1">
                      <span>2. Competitor Fleet Obsolescence & Warranty Lapses</span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">{bd.fleetObsolescencePts} / 25 pts</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(bd.fleetObsolescencePts / 25) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.installedFleet.defibBrand} ({agency.installedFleet.defibAgeYears} yrs old, {agency.installedFleet.defibWarrantyStatus})
                    </div>
                  </div>

                  {/* Factor 3 */}
                  <div>
                    <div className="flex items-center justify-between text-slate-200 mb-1">
                      <span>3. CMS Claims Denial Severity & Financial Recovery Upside</span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">{bd.cmsFinancialPts} / 20 pts</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(bd.cmsFinancialPts / 20) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.cmsData.claimDenialRate}% denial rate · ${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K recoverable cash flow
                    </div>
                  </div>

                  {/* Factor 4 */}
                  <div>
                    <div className="flex items-center justify-between text-slate-200 mb-1">
                      <span>4. Demographic Vulnerability, Seniors & Public Access Deficit</span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">{bd.demographicVulnerabilityPts} / 15 pts</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(bd.demographicVulnerabilityPts / 15) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.gisData.seniorPopulationPct}% age 65+ seniors · {agency.gisData.publicAccessAedDeficitPct}% unmet AED demand
                    </div>
                  </div>

                  {/* Factor 5 */}
                  <div>
                    <div className="flex items-center justify-between text-slate-200 mb-1">
                      <span>5. Budget Cycle Timing & Federal AFG Grant Readiness</span>
                      <span className="font-mono font-bold text-cyan-400 tabular-nums">{bd.budgetGrantReadinessPts} / 15 pts</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(bd.budgetGrantReadinessPts / 15) * 100}%` }}></div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {agency.grantStatus.afgAwarded ? `$${agency.grantStatus.afgAwardAmount.toLocaleString()} active AFG` : 'No active AFG'} · {agency.grantStatus.fiscalYearEndMonth} FY surplus
                    </div>
                  </div>
                </div>
              </div>

              {/* GIS & Demographic Public Health Profile */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  GIS & Public Health Spatial Statistics
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Avg Transport Time</span>
                    <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                      {agency.gisData.avgTransportTimeMinutes} mins
                    </span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">To receiving hospital</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Distance to Cath Lab</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {agency.gisData.distanceToNearestCathLabMiles} miles
                    </span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">STEMI PCI facility</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Senior Pop (65+)</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm tabular-nums">
                      {agency.gisData.seniorPopulationPct}%
                    </span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">Public health risk</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Public Access AED Deficit</span>
                    <span className="font-mono font-bold text-rose-300 text-sm tabular-nums">
                      {agency.gisData.publicAccessAedDeficitPct}%
                    </span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">Unmet municipal need</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: Clinical & Fleet Intel */}
          {activeTab === 'clinical' && (
            <div className="space-y-6">
              
              {/* Strategic Opportunity Summary Box */}
              <div className="bg-slate-950 border border-cyan-900/60 rounded-xl p-4">
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Target Product Solution
                </div>
                <div className="text-base font-bold text-white mt-1">
                  {agency.zollOpportunity.primaryTargetProduct}
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {agency.zollOpportunity.clinicalBenefitNarrative}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Recommended ZOLL Deployment Bundle:</div>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {agency.zollOpportunity.recommendedBundle.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Competitive Fleet Replacement Matrix */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">
                  Installed Fleet Audit & Competitive Displacement
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Defib Monitor */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Cardiac Defibrillator</div>
                    <div className="font-bold text-white text-xs mt-1 truncate">
                      {agency.installedFleet.defibBrand}
                    </div>
                    <div className="text-rose-400 font-mono text-xs mt-1">
                      {agency.installedFleet.defibUnitsCount} units · {agency.installedFleet.defibAgeYears} yrs old
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Warranty: <span className="font-semibold text-slate-200">{agency.installedFleet.defibWarrantyStatus}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                      &rarr; Replace with X Series Adv.
                    </div>
                  </div>

                  {/* Mechanical CPR */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Mechanical CPR System</div>
                    <div className="font-bold text-white text-xs mt-1 truncate">
                      {agency.installedFleet.mechanicalCPR}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-1">
                      {agency.installedFleet.cprUnitsCount} units active
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                      &rarr; Replace with AutoPulse LDB
                    </div>
                  </div>

                  {/* Ventilator */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Transport Ventilator</div>
                    <div className="font-bold text-white text-xs mt-1 truncate">
                      {agency.installedFleet.transportVentilator}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-1">
                      {agency.installedFleet.ventUnitsCount} units active
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                      &rarr; Replace with Z Vent Tactical
                    </div>
                  </div>

                  {/* Software Ecosystem */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">ePCR, CAD & Billing Stack</div>
                    <div className="font-bold text-white text-xs mt-1 truncate">
                      ePCR: {agency.installedFleet.epcrCadSoftware}
                    </div>
                    <div className="text-slate-300 text-xs mt-1 truncate">
                      CAD: {agency.installedFleet.dispatchCadVendor || 'CentralSquare Enterprise CAD'}
                    </div>
                    <div className="text-slate-400 text-xs mt-1 truncate">
                      Billing: {agency.installedFleet.billingSoftware}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                      &rarr; ZOLL RescueNet, Respond & Billing
                    </div>
                  </div>

                </div>

                {/* Hospital Destination & Dispatch Telemetry Strip */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">Primary Receiving Facility</div>
                    <div className="font-semibold text-white mt-0.5 truncate">
                      {agency.gisData.primaryReceivingHospital || `${agency.city} Regional Medical Center (Level 1 Trauma & PCI)`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Annual Hospital Destination Volume</div>
                    <div className="font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
                      {(agency.gisData.annualHospitalDestinationTransports ?? Math.round(agency.annual911Transports * 0.88)).toLocaleString()} transports/yr
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Dispatch CAD Integration</div>
                    <div className="font-semibold text-slate-200 mt-0.5 truncate">
                      {agency.installedFleet.dispatchCadVendor || 'CentralSquare Enterprise CAD'} · {agency.gisData.avgTransportTimeMinutes}m avg transit
                    </div>
                  </div>
                </div>
              </div>

              {/* NEMSIS & CARES Cardiac Clinical Outcomes */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">
                  Clinical Cardiac & Trauma Outcomes (NEMSIS V3 / CARES Registry)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-500">Annual 911 Calls</div>
                    <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                      {agency.annualCallVolume.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Annual Cardiac Arrests (OHCA)</div>
                    <div className="font-mono text-base font-bold text-rose-400 tabular-nums mt-0.5">
                      {agency.annualCardiacArrestCalls.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Bystander CPR Rate</div>
                    <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
                      {agency.bystanderCPRRate}%
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Utstein Survival Rate</div>
                    <div className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                      agency.utsteinSurvivalRate < 28 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {agency.utsteinSurvivalRate}%
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        (US Avg: 29.7%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900 rounded-lg text-xs text-slate-300">
                  <span className="font-semibold text-cyan-400">Clinical Pitch Angle for Medical Director:</span>{' '}
                  This agency experiences {agency.annualCardiacArrestCalls} cardiac arrests per year with a {agency.utsteinSurvivalRate}% survival rate. Emphasize that ZOLL X Series Real BVM Help provides real-time ventilation rate feedback, preventing inadvertent hyperventilation which reduces coronary perfusion pressure. Combining Real BVM Help with AutoPulse circumferential compressions provides continuous cerebral blood flow throughout transit.
                </div>
              </div>

            </div>
          )}

          {/* TAB: NEMSQA, AHA & CARES Clinical Quality Scorecard */}
          {activeTab === 'quality' && (
            <QualityScorecard 
              agency={agency} 
              onOpenRfpGenerator={onOpenRfpGenerator} 
            />
          )}

          {/* TAB 2: CMS Claims & Interactive ROI Simulator */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              
              {/* CMS Public Ground Ambulance Data */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">
                  CMS Medicare Part B Ground Ambulance Claims Audit
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Annual Medicare Billed</div>
                    <div className="font-mono text-lg font-bold text-white tabular-nums mt-0.5">
                      ${(agency.cmsData.medicareBilledAnnual / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Allowed: ${(agency.cmsData.medicareAllowedAnnual / 1000000).toFixed(2)}M
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Medicare Claim Denial Rate</div>
                    <div className="font-mono text-lg font-bold text-rose-400 tabular-nums mt-0.5">
                      {agency.cmsData.claimDenialRate.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      National Average: 16.8%
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">GADCS Cost Reporting</div>
                    <div className="font-semibold text-amber-400 text-xs mt-1">
                      {agency.cmsData.gadcsReportingStatus}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Subject to 10% penalty if non-compliant
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Medicare Share</div>
                    <div className="font-mono font-bold text-white tabular-nums mt-0.5">
                      {agency.cmsData.medicarePayerPct ?? 42.0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Medicaid Share</div>
                    <div className="font-mono font-bold text-white tabular-nums mt-0.5">
                      {agency.cmsData.medicaidPayerPct ?? 24.0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Commercial Insurance</div>
                    <div className="font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
                      {agency.cmsData.commercialPayerMixPct}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Self-Pay / Uninsured</div>
                    <div className="font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                      {agency.cmsData.selfPayPayerPct ?? 8.0}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-900/80 rounded-lg text-xs border border-slate-800">
                  <span className="font-bold text-slate-300">Top CMS Claim Denial Reason:</span>{' '}
                  <span className="text-rose-300 font-mono text-[11px]">{agency.cmsData.topDenialReason}</span>
                </div>
              </div>

              {/* Interactive ROI Simulator */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-800/60 rounded-xl p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      ZOLL Billing & AR Boost Financial ROI Simulator
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Demonstrate immediate municipal cash-flow recovery by scrubbing billing errors before CMS submission.
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-1 rounded border border-cyan-800 font-semibold">
                    Interactive Field Calculator
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">Annual 911 Ambulance Transports</span>
                        <span className="font-mono text-cyan-400 font-bold tabular-nums">
                          {simTransports.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="150000"
                        step="1000"
                        value={simTransports}
                        onChange={(e) => setSimTransports(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">ZOLL Target Denial Rate (Scrubbed)</span>
                        <span className="font-mono text-emerald-400 font-bold tabular-nums">
                          {simTargetDenial.toFixed(1)}% (Down from {agency.cmsData.claimDenialRate}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="8.0"
                        step="0.5"
                        value={simTargetDenial}
                        onChange={(e) => setSimTargetDenial(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      Based on CMS Ambulance Fee Schedule average Medicare Part B payment of $480 per transport and AR Boost automatic commercial insurance discovery.
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Projected Annual Net Cash Recovered
                    </div>
                    <div className="font-mono text-3xl font-extrabold text-emerald-400 tabular-nums mt-1">
                      +${Math.round(annualRecoveredRevenue).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 max-w-xs">
                      Reclaims <strong className="text-white font-mono">{Math.round(currentLostRevenue - newLostRevenue).toLocaleString()}</strong> in denied claims. This single financial gain covers the lease of <strong className="text-cyan-400 font-mono">{Math.max(4, Math.round(annualRecoveredRevenue / 18000))}</strong> new ZOLL X Series Advanced defibrillators each year.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Grants & Budget */}
          {activeTab === 'grants' && (
            <div className="space-y-6">
              
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Federal FEMA AFG / SAFER Grant Intelligence</h3>
                  {agency.grantStatus.afgAwarded && (
                    <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                      Awarded & Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">AFG Grant Allocation</div>
                    <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
                      ${agency.grantStatus.afgAwardAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      FY{agency.grantStatus.afgFiscalYear} Award Cycle
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">FEMA Grant Stated Purpose</div>
                    <div className="font-medium text-white text-xs mt-1 leading-snug">
                      {agency.grantStatus.afgPurpose}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-500">Fiscal Year-End Deadline</div>
                    <div className="font-bold text-amber-400 text-sm mt-1">
                      {agency.grantStatus.fiscalYearEndMonth}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Surplus cycle: {agency.gisData.fiscalBudgetCycleQuarter}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900 rounded-lg text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-cyan-400">Expedited Purchasing Cooperative Contracts:</div>
                  <p>
                    Because this agency has federal grant funds, the Territory Manager can recommend bypassing cumbersome 6-month competitive bidding by purchasing through existing national cooperative agreements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                      <strong>Sourcewell:</strong> Contract #041223-ZOL (EMS & Rescue Equipment)
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                      <strong>HGACBuy:</strong> Contract #EE08-19 (Emergency Medical Apparatus)
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Stakeholders */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">
                Account Decision Makers & Clinical Leadership
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agency.keyContacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 font-semibold">
                          {contact.role}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white text-sm mt-2">
                        {contact.name}
                      </h4>
                      <div className="text-xs text-slate-400">
                        {contact.title}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <a 
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono">{contact.phone}</span>
                      </a>

                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors truncate"
                      >
                        <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Field Notes & Outbox Activity */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              
              <form onSubmit={handleAddNoteSubmit} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Log Field Note / Meeting Record
                  </h3>
                  {!isOnline && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      Offline Mode Active (Will save locally & queue for sync)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Interaction Type</label>
                    <select
                      value={newMeetingType}
                      onChange={(e) => setNewMeetingType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="On-Site Station Visit">On-Site Station Visit</option>
                      <option value="Virtual Demo">Virtual Demo</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="RFP Review">RFP Review</option>
                      <option value="Ride-Along">Ride-Along</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Next Action Due Date</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Meeting Notes & Customer Feedback</label>
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Details from Chief meeting, competitor feedback, crew trial impressions..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Next Action Item</label>
                  <input
                    type="text"
                    value={newNextAction}
                    onChange={(e) => setNewNextAction(e.target.value)}
                    placeholder="e.g. Bring 2 demo evaluation units to Station 4 on Thursday"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="min-h-[38px] px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Field Record</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400">Interaction History</h4>
                {agency.fieldNotes.map((note) => (
                  <div key={note.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-semibold text-cyan-400">{note.meetingType}</span>
                      <span className="font-mono text-slate-500">{note.date} · {note.repName}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{note.notes}</p>
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-400">
                      <span>Next Action: {note.nextAction}</span>
                      <span className="font-mono text-slate-400">Due: {note.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
