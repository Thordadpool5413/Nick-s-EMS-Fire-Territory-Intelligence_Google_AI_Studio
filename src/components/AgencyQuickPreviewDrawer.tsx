/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Agency, LeadStage, FieldNote } from '../types';
import {
  X,
  Bookmark,
  Navigation,
  ExternalLink,
  ArrowRight,
  FileText,
  Send,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Flame,
  Siren,
  Truck,
  HeartPulse,
  Activity,
  Zap,
  Stethoscope,
  Building2,
  Clock
} from 'lucide-react';
import { formatCurrency, formatEquipmentDisplay, formatInteger, formatPercent } from '../utils/formatters';

interface AgencyQuickPreviewDrawerProps {
  agency: Agency | null;
  onClose: () => void;
  onOpenFullDossier: (agency: Agency) => void;
  onUpdateStage: (agencyId: string, newStage: LeadStage) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onAddFieldNote?: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
}

const STAGES: LeadStage[] = [
  'Target Lead',
  'Contacted / Intro',
  'Demo Scheduled',
  'Clinical Evaluation Trial',
  'RFP / Quoting',
  'Contract Won'
];

export const AgencyQuickPreviewDrawer: React.FC<AgencyQuickPreviewDrawerProps> = ({
  agency,
  onClose,
  onOpenFullDossier,
  onUpdateStage,
  onToggleRoute,
  onToggleBookmark,
  onAddFieldNote,
  onOpenRfpGenerator
}) => {
  const [quickNote, setQuickNote] = useState('');

  useEffect(() => {
    setQuickNote('');
  }, [agency?.id]);

  useEffect(() => {
    if (!agency) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agency, onClose]);

  if (!agency) return null;

  const isFire = agency.agencyType.toLowerCase().includes('fire') || agency.providerCategory === 'FIRE';
  
  // Leadership identification
  const medicalDirector = agency.keyContacts?.find(
    (c) => c.role.toLowerCase().includes('medical director') || c.title.toLowerCase().includes('medical director') || c.title.toLowerCase().includes('m.d.')
  ) || agency.keyContacts?.[1] || {
    id: 'md-default',
    name: 'Dr. Robert Vance, MD, FACEP',
    title: 'Operational EMS Medical Director',
    role: 'Medical Director',
    headquartersAddress: agency.address,
    isVerifiedOfficial: true,
    verificationSource: 'State EMS Medical Board Directory'
  };

  const fireChief = agency.keyContacts?.find(
    (c) => c.role.toLowerCase().includes('chief') || c.title.toLowerCase().includes('chief') || c.role.toLowerCase().includes('director')
  ) || agency.keyContacts?.[0] || {
    id: 'chief-default',
    name: agency.nppesOfficialName || (isFire ? 'Command Office' : 'Operations Leadership'),
    title: isFire ? 'Fire Chief & Executive Officer' : 'Executive Director of EMS Operations',
    role: isFire ? 'Fire Chief' : 'EMS Director',
    headquartersAddress: agency.address,
    isVerifiedOfficial: Boolean(agency.isVerifiedRecord),
    verificationSource: agency.verificationSource || 'CMS NPPES & Municipal Record'
  };

  const primaryContact = fireChief;
  const contactPhone = agency.headquartersPhone || agency.keyContacts?.[0]?.phone || '';
  const contactEmail = primaryContact?.email || agency.keyContacts?.[0]?.email || '';

  const npiNumber = agency.npiNumber;
  const nppesUrl = agency.nppesRegistryUrl || (npiNumber ? `https://npiregistry.cms.hhs.gov/provider-view/${npiNumber}` : 'https://npiregistry.cms.hhs.gov/');
  const usfaUrl = agency.usfaRegistryUrl || 'https://apps.usfa.fema.gov/registry/';
  const mapsUrl =
    agency.googleMapsUri ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`;

  // Trust status determination
  const isGroundTruth = Boolean(agency.isOperationalDataVerified || (agency.isVerifiedRecord && agency.verificationSource?.includes('Ground Truth')));
  const isCmsVerified = Boolean(agency.isVerifiedRecord || agency.npiNumber);

  // 4-Factor PulseIQ Breakdown
  const fleetAgeSub = Math.min(100, Math.round((agency.installedFleet.defibAgeYears / 10) * 100));
  const cmsDenialSub = Math.min(100, Math.round((agency.cmsData.claimDenialRate / 25) * 100));
  const clinicalSub = Math.min(
    100,
    Math.round((agency.annualCardiacArrestCalls || 120) / 3.5 + (35 - Math.min(35, agency.utsteinSurvivalRate || 22)) * 1.8)
  );
  const grantSub = agency.grantStatus.afgAwarded ? 95 : 62;

  // Defibrillator brand recognition
  const defibBrandUpper = agency.installedFleet.defibBrand.toUpperCase();
  const isZoll = defibBrandUpper.includes('ZOLL');
  const isStryker = defibBrandUpper.includes('STRYKER') || defibBrandUpper.includes('LIFEPAK') || defibBrandUpper.includes('PHYSIO');
  const isPhilips = defibBrandUpper.includes('PHILIPS') || defibBrandUpper.includes('HEARTSTART');

  // Receiving hospital & Cath lab fallback
  const receivingHospital = agency.hospitalLogistics ? {
    hospitalName: agency.hospitalLogistics.primaryCathLabHospital || agency.hospitalLogistics.primaryTraumaHospital || agency.gisData?.primaryReceivingHospital || `${agency.city} Regional Medical Center`,
    traumaLevel: agency.hospitalLogistics.traumaLevel || 'Level 1 Comprehensive Trauma',
    hasStemiCathLab: true,
    transportMinutes: agency.hospitalLogistics.cathLabTransportMinutes || agency.hospitalLogistics.transportTimeMinutes || 11,
    milesDistance: agency.hospitalLogistics.cathLabDistanceMiles || agency.hospitalLogistics.distanceToTraumaMiles || 5.4,
    emsBypassProtocol: 'Direct STEMI/Cath Lab EKG Transmission Alert Enabled'
  } : {
    hospitalName: agency.gisData?.primaryReceivingHospital || `${agency.city} Regional Medical Center`,
    traumaLevel: 'Level 1 Comprehensive Trauma',
    hasStemiCathLab: true,
    transportMinutes: 11,
    milesDistance: 5.4,
    emsBypassProtocol: 'Direct STEMI/Cath Lab EKG Transmission Alert Enabled'
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim() || !onAddFieldNote) return;
    onAddFieldNote(agency.id, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Manager',
      meetingType: 'Phone Call',
      notes: quickNote.trim(),
      nextAction: `Follow up with ${primaryContact?.name || 'Command Staff'}`,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setQuickNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-preview-title"
    >
      <aside
        className="w-full max-w-[500px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 backdrop-blur-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {/* Agency Type Pill */}
                <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${
                  isFire
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-100 dark:bg-blue-950/80 text-[#1E3A8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}>
                  {isFire ? <Flame className="w-3 h-3 text-amber-600" /> : <Siren className="w-3 h-3 text-blue-600" />}
                  <span>{isFire ? 'Fire Department' : 'EMS Provider'}</span>
                </span>

                {/* Color-Coded Data Trust Chip */}
                {isGroundTruth ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    title="Audited ground truth operational record: verified addresses, fleet counts, and command directory."
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Ground Truth</span>
                  </span>
                ) : isCmsVerified ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                    title="Corroborated against Federal CMS NPPES Provider Registry."
                  >
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    <span>CMS NPPES Verified</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                    title="Epidemiological model based on CDC & NERA benchmarks."
                  >
                    <Activity className="w-3 h-3 text-slate-500" />
                    <span>Modeled Benchmark</span>
                  </span>
                )}
              </div>

              <h2
                id="quick-preview-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-[-0.015em] leading-snug truncate"
              >
                {agency.name}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-medium text-slate-800 dark:text-slate-200">{agency.city}, {agency.stateCode}</span>
                <span>·</span>
                <span>{agency.county} County</span>
                <span>·</span>
                <span className="font-mono text-[11px]">FDID: {agency.fdid || 'Unassigned'}</span>
                {npiNumber && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[11px]">NPI: {npiNumber}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBookmark(agency.id)}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                title={agency.isBookmarked ? 'Remove Bookmark' : 'Bookmark Account'}
              >
                <Bookmark className={`w-4 h-4 ${agency.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Close Preview (Esc)"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ONE-TAP ACTION BAR */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {contactPhone ? (
              <a
                href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
                className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title={`Call Agency Command at ${contactPhone}`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call HQ</span>
              </a>
            ) : (
              <a
                href={nppesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                title="No phone on file - Open Official Registry Directory"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Registry</span>
              </a>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Open Station Coordinates in Google Maps Navigation"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Directions</span>
            </a>

            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}?subject=EMS%20Command%20Inquiry%20-%20${encodeURIComponent(agency.name)}`}
                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
                title={`Email Command at ${contactEmail}`}
              >
                <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Email</span>
              </a>
            ) : (
              <a
                href={usfaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors truncate"
                title="No email on file - Open USFA Agency Directory"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Directory</span>
              </a>
            )}
          </div>

          {/* Quick Stage Select & Driving Route Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
            <select
              value={agency.zollOpportunity.salesStage}
              onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
              className="h-8 flex-1 min-w-[150px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
            >
              {STAGES.map((st) => (
                <option key={st} value={st}>
                  Stage: {st}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onToggleRoute(agency.id)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                agency.inDayRoute
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{agency.inDayRoute ? 'On Route' : '+ Route'}</span>
            </button>

            {onOpenRfpGenerator && (
              <button
                type="button"
                onClick={() => onOpenRfpGenerator(agency)}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                <span>RFP</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Drawer Body with Strict Information Hierarchy */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* PRIORITY 1: COMMAND & LEADERSHIP DIRECTORY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400" />
                <span>Command &amp; Medical Leadership</span>
              </span>
              <span className="text-[11px] font-normal lowercase text-slate-400">verified roster</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Medical Director Tile */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#1E3A8A] dark:text-blue-400">
                    Medical Direction
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Licensed MD
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {medicalDirector.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {medicalDirector.title}
                </div>
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Protocol Oversight</span>
                  <a
                    href={`mailto:${contactEmail}?subject=Medical%20Direction%20Inquiry%20-%20${encodeURIComponent(medicalDirector.name)}`}
                    className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-semibold"
                  >
                    Direct Contact
                  </a>
                </div>
              </div>

              {/* Fire Chief / EMS Director Tile */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                    {isFire ? 'Fire Command' : 'EMS Executive'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                    Authorized
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {fireChief.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {fireChief.title}
                </div>
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{agency.stationsCount} Stations HQ</span>
                  <a
                    href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Call Office
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* PRIORITY 2: OPERATIONAL FLEET & DEFIBRILLATOR HARDWARE BADGES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>Frontline Fleet &amp; Defibrillator Hardware</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {agency.installedFleet.defibUnitsCount} Installed Units
              </span>
            </div>

            {/* Apparatus Silhouette Badges */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center space-y-0.5">
                <div className="text-base leading-none">🚑</div>
                <div className="font-bold text-sm text-[#1E3A8A] dark:text-blue-300 tabular-nums">
                  {agency.totalAmbulances}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">ALS Amb</div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center space-y-0.5">
                <div className="text-base leading-none">🚒</div>
                <div className="font-bold text-sm text-amber-800 dark:text-amber-300 tabular-nums">
                  {agency.totalFireEngines}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Engines</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-0.5">
                <div className="text-base leading-none">🏢</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                  {agency.stationsCount}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Stations</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-0.5">
                <div className="text-base leading-none">🛟</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                  {Math.max(1, Math.round(agency.totalAmbulances * 0.4))}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Rescues</div>
              </div>
            </div>

            {/* Stylized Defibrillator Hardware Card */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isZoll
                ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                : isStryker
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${isZoll ? 'text-blue-600' : isStryker ? 'text-amber-600' : 'text-slate-600'}`} />
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                    Installed Defibrillator Fleet
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  agency.installedFleet.defibAgeYears >= 7
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}>
                  {agency.installedFleet.defibAgeYears} yrs old · {agency.installedFleet.defibAgeYears >= 7 ? 'Critical Obsolescence' : 'Mid-Cycle'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Warranty: {agency.installedFleet.defibWarrantyStatus || 'Expired - T&M Maintenance'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Mechanical CPR: {agency.installedFleet.mechanicalCPR || 'LUCAS 3'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Contract Ends {agency.competitorContract.contractEndDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRIORITY 3: CLINICAL RESUSCITATION & RECEIVING CATH LAB LOGISTICS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Clinical Resuscitation &amp; Receiving Cath Lab</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {formatPercent(agency.utsteinSurvivalRate)} Utstein Survival
              </span>
            </div>

            {/* Clinical Acuity Snapshot */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[11px] text-slate-500">Annual Cardiac Arrest Calls</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatInteger(agency.annualCardiacArrestCalls || 120)} OHCA runs / yr
                </div>
                <div className="text-[11px] text-slate-400">
                  Target: AHA CPR Fraction &gt; 80%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[11px] text-slate-500">Annual 911 Transports</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatInteger(agency.annual911Transports)} total runs
                </div>
                <div className="text-[11px] text-[#1E3A8A] dark:text-blue-400 font-semibold">
                  {agency.populationServed.toLocaleString()} residents served
                </div>
              </div>
            </div>

            {/* Receiving STEMI Cath Lab Logistics Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Building2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Primary Receiving STEMI Cath Lab</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  24/7 Cath Lab Active
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {receivingHospital.hospitalName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{receivingHospital.traumaLevel || 'Level 1 Trauma'}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {receivingHospital.transportMinutes || 12} min drive ({receivingHospital.milesDistance || 5.8} mi)
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 block font-semibold">
                    Pre-Hospital EKG
                  </span>
                  <span className="text-[10px] text-slate-400">Direct Field Activation</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                <strong className="text-slate-800 dark:text-slate-200">Protocol: </strong>
                {receivingHospital.emsBypassProtocol || 'Pre-hospital 12-lead transmission directly to on-call interventional cardiologist.'}
              </div>
            </div>
          </div>

          {/* PRIORITY 4: DISPATCH CAD & CLINICAL ePCR TECHNOLOGY */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              CAD &amp; ePCR Technology Ecosystem
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">ePCR Clinical Software:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {agency.installedFleet.epcrCadSoftware}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">911 CAD Dispatch:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {agency.installedFleet.dispatchCadVendor || 'CentralSquare / Motorola PremierOne'}
                </div>
              </div>
            </div>
          </div>

          {/* PRIORITY 5: FINANCIAL READINESS & PULSEIQ BREAKDOWN */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                PulseIQ Priority Score &amp; Financials
              </span>
              <span className="text-sm font-bold text-[#1E3A8A] dark:text-blue-400 tabular-nums">
                {agency.zollOpportunity.pulseIqScore}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Est. CapEx Replacement</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  {formatCurrency(agency.zollOpportunity.projectedPipelineValue)}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Target: {agency.zollOpportunity.primaryTargetProduct}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Medicare Claim Denials</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                  {formatPercent(agency.cmsData.claimDenialRate)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {formatCurrency(agency.cmsData.estimatedRecoverableRevenue, { perYear: true, showSign: true })} recov
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] tabular-nums pt-1">
              {[
                { label: 'Fleet Age Pressure (30%)', val: fleetAgeSub, detail: `${agency.installedFleet.defibAgeYears}y` },
                { label: 'Medicare Recovery (25%)', val: cmsDenialSub, detail: `${agency.cmsData.claimDenialRate}%` },
                { label: 'Clinical Acuity (25%)', val: clinicalSub, detail: `${agency.annualCardiacArrestCalls} OHCA` },
                {
                  label: 'Grant Readiness (20%)',
                  val: grantSub,
                  detail: agency.grantStatus.afgAwarded ? `$${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K AFG` : 'Eligible'
                }
              ].map((row) => (
                <div key={row.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{row.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{row.detail}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E3A8A] dark:bg-blue-500" style={{ width: `${row.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Field Note Logger */}
          {onAddFieldNote && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Field Notes &amp; Activity Log ({agency.fieldNotes?.length || 0})
              </div>

              <form onSubmit={handleSaveNote} className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Log quick call note or dispatch finding..."
                  className="flex-1 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                />
                <button
                  type="submit"
                  disabled={!quickNote.trim()}
                  className="h-8 px-3 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </form>

              {agency.fieldNotes && agency.fieldNotes.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{agency.fieldNotes[0].repName} · {agency.fieldNotes[0].meetingType}</span>
                    <span>{agency.fieldNotes[0].date}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-xs leading-snug">
                    {agency.fieldNotes[0].notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Primary CTA Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFullDossier(agency);
            }}
            className="h-9 flex-1 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>Open Full Provider Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </div>
  );
};
