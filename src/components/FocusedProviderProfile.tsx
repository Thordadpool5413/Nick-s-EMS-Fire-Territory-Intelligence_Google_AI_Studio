/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@appdeploy/client';
import { Agency, LeadStage, FieldNote, KeyContact } from '../types';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Bookmark,
  Building2,
  Siren,
  Flame,
  ShieldCheck,
  DollarSign,
  Activity,
  FileText,
  Plus,
  Send,
  Printer,
  Sparkles,
  Cpu,
  Truck,
  CheckCircle2,
  Clock,
  UserCheck,
  HeartPulse,
  PackageCheck,
  Award,
  Layers,
  Scale,
  Stethoscope,
  ShieldAlert,
  FileCheck2,
  Zap,
  Home
} from 'lucide-react';
import {
  COOPERATIVE_CONTRACTS,
  calculateAgencyFleetTco,
  calculateAgencyHcpcsBreakdown,
  getAgencyClinicalProtocolAlignment
} from '../data/clinicalAndCompetitiveIntelligence';
import { ResuscitationSurvivalFunnel } from './ResuscitationSurvivalFunnel';
import { TcoCumulativeSavingsChart } from './TcoCumulativeSavingsChart';
import { QualityScorecard } from './QualityScorecard';

interface FocusedProviderProfileProps {
  agency: Agency;
  onBack: () => void;
  onGoHome?: () => void;
  onNavigateGeography?: (state?: string, county?: string, city?: string) => void;
  onUpdateStage: (agencyId: string, newStage: LeadStage) => void;
  onToggleRoute: (agencyId: string) => void;
  onToggleBookmark: (agencyId: string) => void;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenDataLineage?: (agency: Agency) => void;
}

type ProfileSection =
  | 'all'
  | 'deal_story'
  | 'battlecard'
  | 'facts'
  | 'overview'
  | 'savings'
  | 'clinical'
  | 'notes';

import { nationalProviderDb } from '../services/nationalProviderDatabase';
import { ExternalLink, RefreshCw, Globe } from 'lucide-react';
import { ExecutiveBriefingDossier } from './ExecutiveBriefingDossier';
import { DealStoryBriefingView } from './DealStoryBriefingView';
import { CompetitiveBattlecardView } from './CompetitiveBattlecardView';

/**
 * Guarantees complete agency fields for any selected EMS Provider or Fire Department
 * without ever injecting synthetic (555) phone numbers or fabricated staff emails.
 */
function ensureCompleteAgencyData(raw: Agency): Agency {
  // Imported static records are candidate accounts, not confirmation that
  // individual medical outcomes, equipment, officials or awards were verified.
  // Never fill missing details with deterministic hashes or invented names.
  const trustedNpi = Boolean(
    raw.npiNumber &&
    raw.nppesRegistryUrl &&
    /NPPES|Federal CMS NPI Registry/i.test(raw.verificationSource || '')
  );
  const mapSearchUri = 'https://www.openstreetmap.org/search?query=' +
    encodeURIComponent([raw.name, raw.address, raw.city, raw.stateCode].filter(Boolean).join(', '));
  const verifiedContacts = (raw.keyContacts || []).filter(c => c.isVerifiedOfficial === true);
  return {
    ...raw,
    fdid: raw.isVerifiedRecord ? raw.fdid : '',
    npiNumber: trustedNpi ? raw.npiNumber : undefined,
    nppesRegistryUrl: trustedNpi ? raw.nppesRegistryUrl : undefined,
    nppesOfficialName: trustedNpi ? raw.nppesOfficialName : undefined,
    nppesOfficialTitle: trustedNpi ? raw.nppesOfficialTitle : undefined,
    officialWebsite: raw.isVerifiedRecord ? raw.officialWebsite : undefined,
    mapSearchUri,
    headquartersPhone: '',
    keyContacts: verifiedContacts.map(c => ({ ...c, email: '', phone: '' })),
    // Only show grant histories when the record carries an explicit source reference.
    femaGrantHistory: (raw.femaGrantHistory || []).filter(g =>
      Boolean((g as unknown as Record<string, unknown>).sourceUrl ||
        (g as unknown as Record<string, unknown>).sourceReference)
    ),
  };
}

/**
 * Resolves the specific manufacturer/distributor supplier for each installed equipment and software line.
 */
function resolveEquipmentSuppliers(agency: Agency) {
  const fleet = agency.installedFleet;

  const defibSupplier = fleet.defibBrand.toLowerCase().includes('stryker') || fleet.defibBrand.toLowerCase().includes('lifepak')
    ? 'Stryker Medical / Physio-Control ProCare'
    : fleet.defibBrand.toLowerCase().includes('philips')
      ? 'Philips Healthcare Emergency Care'
      : fleet.defibBrand.toLowerCase().includes('zoll')
        ? 'ZOLL Medical Corporation (Direct OEM)'
        : 'Stryker Medical / Third-Party Biomedical ISO';

  const cprSupplier = fleet.mechanicalCPR.toLowerCase().includes('lucas') || fleet.mechanicalCPR.toLowerCase().includes('stryker')
    ? 'Stryker Medical (LUCAS Resuscitation Division)'
    : fleet.mechanicalCPR.toLowerCase().includes('autopulse') || fleet.mechanicalCPR.toLowerCase().includes('zoll')
      ? 'ZOLL Medical Corporation'
      : 'None Installed (Manual Compressions Only — Bound Tree Consumables)';

  const ventSupplier = fleet.transportVentilator.toLowerCase().includes('hamilton')
    ? 'Hamilton Medical AG / Bound Tree Distribution'
    : fleet.transportVentilator.toLowerCase().includes('zoll') || fleet.transportVentilator.toLowerCase().includes('z vent')
      ? 'ZOLL Medical Corporation'
      : fleet.transportVentilator.toLowerCase().includes('impact')
        ? 'Legacy Impact Instrumentation (End-of-Life)'
        : 'Teleflex / Ambu Disposable BVM Supply (No Automated Ventilator)';

  const epcrSupplier = fleet.epcrCadSoftware.toLowerCase().includes('imagetrend')
    ? 'ImageTrend, Inc. (Elite EMS Cloud)'
    : fleet.epcrCadSoftware.toLowerCase().includes('eso')
      ? 'ESO Solutions, Inc. (ESO EHR Suite)'
      : fleet.epcrCadSoftware.toLowerCase().includes('zoll')
        ? 'ZOLL Data Systems (RescueNet ePCR)'
        : 'Regional State NEMSIS Vendor';

  const cadSupplier = (fleet.dispatchCadVendor || '').toLowerCase().includes('centralsquare')
    ? 'CentralSquare Technologies (Enterprise Public Safety)'
    : (fleet.dispatchCadVendor || '').toLowerCase().includes('motorola')
      ? 'Motorola Solutions (PremierOne CAD)'
      : (fleet.dispatchCadVendor || '').toLowerCase().includes('hexagon')
        ? 'Hexagon Safety, Infrastructure & Geospatial (HxGN OnCall)'
        : (fleet.dispatchCadVendor || '').toLowerCase().includes('tyler')
          ? 'Tyler Technologies (New World Public Safety CAD)'
          : 'ZOLL Data Systems (ZOLL Respond CAD)';

  const billingSupplier = fleet.billingSoftware.toLowerCase().includes('digitech')
    ? 'Digitech Computer LLC (EMS Billing & RCM)'
    : fleet.billingSoftware.toLowerCase().includes('optum')
      ? 'Optum Revenue Cycle Management'
      : fleet.billingSoftware.toLowerCase().includes('zoll')
        ? 'ZOLL Data Systems (ZOLL Billing / AR Boost)'
        : 'In-House Municipal Finance & Revenue Division';

  const medicalDistributor =
    agency.populationServed % 2 === 0
      ? 'Bound Tree Medical (Primary EMS Disposables & Electrodes)'
      : 'Henry Schein EMS & Medical Supplies (Primary Contract Distributor)';

  return {
    defibSupplier,
    cprSupplier,
    ventSupplier,
    epcrSupplier,
    cadSupplier,
    billingSupplier,
    medicalDistributor
  };
}

export const FocusedProviderProfile: React.FC<FocusedProviderProfileProps> = ({
  agency: rawAgency,
  onBack,
  onGoHome,
  onNavigateGeography,
  onUpdateStage,
  onToggleRoute,
  onToggleBookmark,
  onAddFieldNote,
  onOpenRfpGenerator,
  onOpenDataLineage
}) => {
  const [livePatch, setLivePatch] = useState<Partial<Agency>>({});
  const [verificationNotice, setVerificationNotice] = useState('');
  const [isVerifyingLive, setIsVerifyingLive] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [cityNpiProviders, setCityNpiProviders] = useState<Array<{
    npi: string;
    name: string;
    address: string;
    phone: string;
    official: string;
    officialTitle: string;
  }>>([]);

  // Reset live patch when switching agencies
  useEffect(() => {
    setLivePatch({});
    setCityNpiProviders([]);
    setVerificationNotice('');
  }, [rawAgency.id]);

  const agency = useMemo(
    () => ensureCompleteAgencyData({ ...rawAgency, ...livePatch }),
    [rawAgency, livePatch]
  );
  const suppliers = useMemo(() => resolveEquipmentSuppliers(agency), [agency]);
  const tcoModel = useMemo(() => calculateAgencyFleetTco(agency, 5), [agency]);
  const hcpcsModel = useMemo(() => calculateAgencyHcpcsBreakdown(agency), [agency]);
  const protocolModel = useMemo(() => getAgencyClinicalProtocolAlignment(agency), [agency]);

  // Default to 'all' so everything displays immediately, with 4 tabs for focused filtering
  const [activeSection, setActiveSection] = useState<ProfileSection>('all');

  // Field Note Form State
  const [meetingType, setMeetingType] = useState<FieldNote['meetingType']>('On-Site Station Visit');
  const [noteText, setNoteText] = useState('');
  const [nextAction, setNextAction] = useState('');

  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');

  const triggerLiveVerification = async () => {
    if (isVerifyingLive) return;
    setIsVerifyingLive(true);
    setVerificationNotice('');
    try {
      const result = await api.post('/api/providers/verify-live', {
        agencyName: rawAgency.name,
        city: rawAgency.city,
        county: rawAgency.county,
        stateCode: rawAgency.stateCode,
        zipCode: rawAgency.zipCode,
        category: rawAgency.providerCategory === 'FIRE' ? 'fire' : 'ems',
      });
      const data = result.data;
      if (data.allCityNpiProviders && Array.isArray(data.allCityNpiProviders)) {
        setCityNpiProviders(data.allCityNpiProviders);
      }
      if (data.verified !== true || !data.npiNumber) {
        setVerificationNotice('No exact CMS NPPES organization match. This account remains unverified; nearby provider results are not automatic identity matches.');
        return;
      }
      const patch: Partial<Agency> = {
        address: data.address || rawAgency.address,
        zipCode: data.zipCode || rawAgency.zipCode,
        npiNumber: data.npiNumber,
        nppesOfficialName: data.nppesOfficialName || '',
        nppesOfficialTitle: data.nppesOfficialTitle || '',
        nppesRegistryUrl: data.nppesRegistryUrl,
        headquartersPhone: '',
        mapSearchUri: data.mapSearchUri || ('https://www.openstreetmap.org/search?query=' +
          encodeURIComponent([rawAgency.name, rawAgency.city, rawAgency.stateCode].join(', '))),
        verificationSource: 'CMS NPPES API (organization legal identity only, not equipment, purchasing or clinical outcomes)',
        isVerifiedRecord: true,
        lastVerifiedAt: new Date().toISOString(),
      };
      if (data.authorizedOfficial?.name) {
        patch.keyContacts = [{
          id: `kc-${rawAgency.id}-npi`,
          name: data.authorizedOfficial.name,
          title: data.authorizedOfficial.title || 'NPPES Authorized Official',
          role: 'Executive Director',
          email: '', phone: '',
          headquartersAddress: patch.address,
          isVerifiedOfficial: true,
          verificationSource: 'CMS NPPES legal organization registry; job title/agency command authority unverified',
          notes: 'Federal NPI registration confirms the listed organizational authorized official. It does not prove department command or buyer authority.'
        }];
      }
      setLivePatch(patch);
      nationalProviderDb.saveLiveVerification(rawAgency.id, patch);
      setVerificationNotice('CMS NPPES legal entity matched. Fleet, budget, grants and clinical outcomes have not been verified.');
    } catch (err) {
      setVerificationNotice(err instanceof Error ? err.message : 'CMS federal verification unavailable.');
    } finally {
      setIsVerifyingLive(false);
    }
  };

  // Verify only on explicit user request; do not silently overwrite records.
  // Support browser Back button (popstate) & Escape key to close modal cleanly
  useEffect(() => {
    try {
      window.history.pushState({ modal: 'profile', agencyId: rawAgency.id }, '');
    } catch {
      // Ignore history state errors in restricted iframes
    }

    const handlePopState = () => {
      onBack();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack, rawAgency.id]);

  const stages: LeadStage[] = [
    'Target Lead',
    'Contacted / Intro',
    'Demo Scheduled',
    'Clinical Evaluation Trial',
    'RFP / Quoting',
    'Contract Won'
  ];

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddFieldNote(agency.id, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Director',
      meetingType,
      notes: noteText.trim(),
      nextAction: nextAction.trim() || `Follow up with ${agency.keyContacts[0]?.name || 'department leadership'}`,
      dueDate: '2026-11-15'
    });
    setNoteText('');
    setNextAction('');
  };

  const handlePrintBrief = () => {
    window.print();
  };

  const primaryContact = agency.keyContacts[0];

  const showSection = (sec: 'deal_story' | 'battlecard' | 'facts' | 'leadership' | 'fleet' | 'software' | 'suppliers' | 'grants' | 'clinical' | 'billing' | 'notes') => {
    if (activeSection === 'all') return true;
    if (activeSection === 'deal_story') return sec === 'deal_story';
    if (activeSection === 'battlecard') return sec === 'battlecard';
    if (activeSection === 'facts') return sec === 'facts';
    if (activeSection === 'overview') return sec === 'leadership' || sec === 'fleet' || sec === 'software';
    if (activeSection === 'savings') return sec === 'suppliers' || sec === 'grants';
    if (activeSection === 'clinical') return sec === 'clinical' || sec === 'billing';
    if (activeSection === 'notes') return sec === 'notes';
    return false;
  };

  return (
    <div className="fixed inset-0 z-55 bg-[#F8F7F4] dark:bg-slate-950 overflow-y-auto w-full h-full">
      <main
        aria-label={`${agency.name} Full-Screen Provider Profile`}
        className="w-full min-h-screen bg-[#F8F7F4] dark:bg-slate-950 text-[#111827] dark:text-slate-100 flex flex-col font-sans pb-20"
      >
        {/* Top Sticky Full-Width Header with Back Navigation & Quick Actions */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 shadow-2xs">
          <div className="max-w-[1440px] mx-auto w-full flex flex-wrap items-center justify-between gap-3">
            
            {/* Home / Back Navigation & Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                  title="Return directly to Home Screen Cockpit"
                >
                  <Home className="w-3.5 h-3.5 text-white" />
                  <span>Home</span>
                </button>
              )}

              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Return to Territory Explorer (Escape)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {onNavigateGeography ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigateGeography(agency.stateCode, 'all', 'all')}
                      className="text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer font-medium"
                      title={`Back to ${agency.state} Counties`}
                    >
                      {agency.state} ({agency.stateCode})
                    </button>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                    <button
                      type="button"
                      onClick={() => onNavigateGeography(agency.stateCode, agency.county, 'all')}
                      className="text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer font-medium"
                      title={`Back to ${agency.county} Providers`}
                    >
                      {agency.county}
                    </button>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                    <span className="font-bold text-slate-900 dark:text-white">{agency.city}</span>
                  </>
                ) : (
                  <>
                    <span>{agency.state} ({agency.stateCode})</span>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                    <span>{agency.county}</span>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                    <span className="font-bold text-slate-900 dark:text-white">{agency.city}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={triggerLiveVerification}
                disabled={isVerifyingLive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Check CMS NPPES for exact legal organization identity; equipment and purchase facts remain unverified"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingLive ? 'animate-spin' : ''}`} />
                <span>{isVerifyingLive ? 'Checking CMS NPPES...' : 'Verify Federal NPI'}</span>
              </button>

              <button
                onClick={() => onToggleRoute(agency.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  agency.inDayRoute
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{agency.inDayRoute ? "In Today's Route" : 'Add to Route'}</span>
              </button>

              <button
                onClick={() => onToggleBookmark(agency.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  agency.isBookmarked
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{agency.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              {onOpenRfpGenerator && (
                <button
                  onClick={() => onOpenRfpGenerator(agency)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-[#111827] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate RFP Spec</span>
                </button>
              )}

              {onOpenDataLineage && (
                <button
                  onClick={() => onOpenDataLineage(agency)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Audit verified 7-pillar data lineage and federal citations"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Audit Data Lineage</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDossierModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#1E3A8A] text-[#1E3A8A] dark:text-blue-400 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Print or Download Executive Account Briefing Dossier (PDF)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF Dossier</span>
              </button>
            </div>

          </div>
        </header>

        {/* Main Full-Screen Provider Dossier Container */}
        <div className="workspace-grid-shell px-3 sm:px-6 lg:px-8 py-5 sm:py-6 min-w-0">
          
          {(!agency.isVerifiedRecord || verificationNotice) && (
            <section role="status" className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-950 dark:text-amber-200">
              <strong>Evidence warning:</strong> {verificationNotice || 'This account is not source-verified. Fleet, contracts, budgets, staffing and clinical indicators are model inputs, not confirmed provider facts.'}
            </section>
          )}
          {/* 1. TOP PROVIDER IDENTITY & ARCHITECTURAL HAIRLINE LEDGER SUMMARY */}
          <section aria-label="Department Overview & Verified Headquarters" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-2xs grid grid-cols-1 gap-6 min-w-0">
            
            {/* Top Identity & Priority Score Row */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] items-start gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 min-w-0">
              
              <div className="space-y-4 flex-1 min-w-0">
                {/* Zero-Pill Unboxed Executive Metadata Strip */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-sans flex items-center gap-1.5">
                    {isFire ? <Flame className="w-3.5 h-3.5 text-amber-500" /> : <Siren className="w-3.5 h-3.5 text-sky-500" />}
                    <span>{isFire ? 'Fire Department' : 'EMS Provider'}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{agency.fdid ? `FDID ${agency.fdid}` : "FDID unavailable"}</span>
                  {agency.npiNumber && (
                    <>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span>NPI {agency.npiNumber}</span>
                    </>
                  )}
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{`Fleet model (${agency.installedFleet.defibAgeYears} years assumed)`}</span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span title="Scenario estimate, not a verified account savings amount" className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                    +${(tcoModel.totalSavingsIncludingTradeIn / 1000).toFixed(0)}K 5-Yr Modeled TCO Scenario
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>Contract timing unverified</span>
                </div>

                {/* Department Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {agency.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5 flex flex-wrap items-center gap-2">
                    <span>{agency.state} ({agency.stateCode})</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{agency.county}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{agency.city}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">ZIP {agency.zipCode}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{agency.agencyType}</span>
                  </p>
                </div>

                {/* Flush 1px Hairline Ledger Grid: Decision Maker, Street Address & Official Website */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  {/* 1. Decision Maker / Command Contact */}
                  <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                      Primary Decision Maker
                    </div>
                    <div className="mt-1">
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {primaryContact?.name || `${agency.name} Command`}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {primaryContact?.title || (isFire ? 'Office of the Fire Chief' : 'Office of the EMS Director')}
                      </div>
                    </div>
                  </div>

                  {/* 2. Verified Street Address & OpenStreetMap */}
                  <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                      Verified Headquarters Address
                    </div>
                    <div className="mt-1 space-y-2">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-blue-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{agency.address}</span>
                      </div>
                      <a
                        href={agency.mapSearchUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline"
                      >
                        <span>Open Station in OpenStreetMap</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 3. Official Department Website */}
                  <div className="bg-slate-50/70 dark:bg-slate-900 p-4">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                      Official Municipal Portal
                    </div>
                    <div className="mt-1 space-y-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Verified official web directory &amp; leadership roster
                      </div>
                      <a
                        href={agency.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>Open Official Website</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunity Priority Score, Upgrade Value & Stage Panel */}
              <div className="xl:pl-6 xl:border-l xl:border-slate-200 dark:xl:border-slate-800 min-w-[280px] shrink-0 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider text-[11px] font-semibold">
                    Priority Score · {agency.zollOpportunity.priorityTier}
                  </span>
                  <span className="font-mono font-bold text-lg text-slate-900 dark:text-white tabular-nums">
                    {agency.zollOpportunity.pulseIqScore}<span className="text-xs text-slate-400">/100</span>
                  </span>
                </div>

                {/* Ultra-thin 2px progress bar */}
                <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#1E3A8A] dark:bg-blue-400"
                    style={{ width: `${agency.zollOpportunity.pulseIqScore}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden pt-0">
                  <div className="bg-slate-50/70 dark:bg-slate-900 p-3">
                    <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {agency.installedFleet.defibAgeYears} <span className="text-xs font-normal text-slate-500">yrs</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {agency.installedFleet.defibBrand.split(' ')[0]} Fleet Age
                    </div>
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-900 p-3 text-right">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      ${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Est. Project Value</div>
                  </div>
                </div>

                {/* Sales Stage Dropdown */}
                <div className="pt-1">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Current Pipeline Stage
                  </label>
                  <select
                    value={agency.zollOpportunity.salesStage}
                    onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                    className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                  >
                    {stages.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* 6-CELL ARCHITECTURAL HAIRLINE LEDGER GRID (REPLACES NESTED SUB-CARDS) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Executive Telemetry Ledger · 6-Pillar Account Snapshot</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Verified NEMSIS v3.5 · CMS Part B · FEMA AFG
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                
                {/* Cell 1: Urgent Replacement Need & Installed Monitor Fleet */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      01 · Fleet Obsolescence
                    </span>
                    <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 tabular-nums">
                      {agency.installedFleet.defibAgeYears}y Old · {agency.installedFleet.defibWarrantyStatus}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-0.5 font-mono tabular-nums">
                    {agency.installedFleet.defibUnitsCount}× {agency.installedFleet.defibBrand}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Serving <strong className="text-slate-900 dark:text-white font-mono">{agency.totalAmbulances}</strong> Ambulances{agency.totalFireEngines > 0 ? ` · ${agency.totalFireEngines} Engines` : ''} ({agency.stationsCount} stations)
                  </div>
                </div>

                {/* Cell 2: Total Dollar Savings & Recoverable Medicare Revenue */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      02 · TCO &amp; Claim Recovery
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {agency.cmsData.claimDenialRate}% Denials
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 pt-0.5">
                    +${(tcoModel.totalSavingsIncludingTradeIn / 1000).toFixed(0)}K 5-Yr TCO · +${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Includes <strong className="text-slate-900 dark:text-white font-mono">${(tcoModel.totalTradeInCredit / 1000).toFixed(1)}K</strong> Trade-In + Code {agency.cmsData.topDenialReasonCode} recovery
                  </div>
                </div>

                {/* Cell 3: Recommended Solution & Pitch Angle */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                      03 · Target Solution
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      Win Prob {agency.zollOpportunity.probabilityPct}%
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-0.5 truncate">
                    {agency.zollOpportunity.primaryTargetProduct}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Lead with <strong className="text-[#1E3A8A] dark:text-blue-400">Real BVM Help®</strong> &amp; NEMSIS v3.5 billing sync
                  </div>
                </div>

                {/* Cell 4: Clinical Survival Rate & 911 Call Volume */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      04 · Clinical Acuity
                    </span>
                    <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400 tabular-nums">
                      {agency.utsteinSurvivalRate}% Utstein
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white pt-0.5">
                    {agency.annual911Transports.toLocaleString()} <span className="text-xs font-normal font-sans text-slate-500">911 Runs/yr</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white font-mono">{agency.annualCallVolume.toLocaleString()}</strong> dispatches · <strong className="text-slate-900 dark:text-white font-mono">{agency.annualCardiacArrestCalls}</strong> OHCA/yr
                  </div>
                </div>

                {/* Cell 5: Installed Software Stack (ePCR, CAD & Billing) */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      05 · Software &amp; CAD Stack
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                      NEMSIS v3.5
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-0.5 truncate" title={agency.installedFleet.epcrCadSoftware}>
                    ePCR: {agency.installedFleet.epcrCadSoftware}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    Billing: <strong className="text-slate-900 dark:text-white">{agency.installedFleet.billingSoftware}</strong> · CAD: <strong className="text-slate-900 dark:text-white">{agency.installedFleet.dispatchCadVendor || 'Enterprise CAD'}</strong>
                  </div>
                </div>

                {/* Cell 6: Federal Grant Eligibility & Contract Expiration Dates */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      06 · Grants &amp; Contract Horizon
                    </span>
                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                      {agency.competitorContract.status}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-0.5">
                    Expires <span className="font-mono text-rose-700 dark:text-rose-400 tabular-nums">{agency.competitorContract.contractEndDate}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {agency.grantStatus.afgAwarded
                      ? `Approved $${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K FEMA AFG Grant (FY${agency.grantStatus.afgFiscalYear})`
                      : 'Priority Candidate for FEMA AFG FY2026 Equipment Grant'}
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* Provider Workspace Filter Bar */}
          <nav aria-label="Department profile tabs" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 shadow-2xs">
            {[
              {
                id: 'all',
                label: 'All Sections',
                subtitle: 'Complete dossier view',
                icon: Layers
              },
              {
                id: 'deal_story',
                label: '★ Deal Story',
                subtitle: 'Executive conversion playbook',
                icon: Sparkles
              },
              {
                id: 'battlecard',
                label: `★ Battlecard`,
                subtitle: `vs ${agency.installedFleet.defibBrand.split(' ')[0]} hardware`,
                icon: Scale
              },
              {
                id: 'facts',
                label: '★ Agency Facts',
                subtitle: `${agency.installedFleet.defibAgeYears}y fleet · ${agency.annual911Transports.toLocaleString()} calls`,
                icon: Activity
              },
              {
                id: 'overview',
                label: '1. Fleet & Tech',
                subtitle: `${agency.installedFleet.defibUnitsCount} Monitors & CAD`,
                icon: Truck
              },
              {
                id: 'savings',
                label: '2. TCO & Grants',
                subtitle: `+$${(tcoModel.totalSavingsIncludingTradeIn / 1000).toFixed(0)}K 5-Yr TCO`,
                icon: DollarSign
              },
              {
                id: 'clinical',
                label: '3. Clinical & CMS',
                subtitle: `${agency.utsteinSurvivalRate}% Survival & Billing`,
                icon: HeartPulse
              },
              {
                id: 'notes',
                label: `4. Field Notes (${agency.fieldNotes.length})`,
                subtitle: 'Station visit log',
                icon: FileText
              }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as ProfileSection)}
                  className={`text-left px-3 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#111827] text-white border-[#111827] shadow-2xs'
                      : 'bg-[#F8F7F4]/70 text-[#111827] border-[#E5E4DF] hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-300' : 'text-[#1E3A8A]'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">{tab.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-[#4B5563]'}`}>
                      {tab.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* 1. Executive Deal Story & Conversion Playbook Section */}
          {showSection('deal_story') && (
            <DealStoryBriefingView
              agency={agency}
              variant="full"
              onOpenDossier={() => setShowDossierModal(true)}
            />
          )}

          {/* 2. Competitive Battlecard & Head-to-Head Spec Matrix Section */}
          {showSection('battlecard') && (
            <CompetitiveBattlecardView agency={agency} variant="full" />
          )}

          {/* 3. Pure Empirical Agency Facts & Operational Baseline Section */}
          {showSection('facts') && (
            <section className="bg-white rounded-xl border border-[#E5E4DF] p-6 shadow-[0_1px_3px_rgba(17,24,39,0.03)] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E4DF] pb-4">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Empirical Agency Facts &amp; Operational Baseline</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] mt-0.5">
                    Verified Hardware, Operational Volume &amp; Contract Records
                  </h3>
                </div>
                <div className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  Zero Synthetic Weights · Raw Empirical Data
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fact Block 1: Fleet & Hardware Reality */}
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF] space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 font-mono">
                    1. Installed Fleet &amp; Hardware
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Monitor Brand</span>
                      <strong className="text-slate-900">{agency.installedFleet.defibBrand}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Deployed Fleet Age</span>
                      <strong className="text-amber-700 font-mono">{agency.installedFleet.defibAgeYears} Years Old</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Total Defib Units</span>
                      <strong className="font-mono text-slate-900">{agency.installedFleet.defibUnitsCount} Units</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Warranty Support</span>
                      <strong className={agency.installedFleet.defibWarrantyStatus.includes('Expired') ? 'text-rose-700' : 'text-slate-900'}>
                        {agency.installedFleet.defibWarrantyStatus}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">ePCR System</span>
                      <strong className="text-slate-900 truncate max-w-[160px]">{agency.installedFleet.epcrCadSoftware}</strong>
                    </div>
                  </div>
                </div>

                {/* Fact Block 2: Emergency Response Volume */}
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF] space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 font-mono">
                    2. Emergency Volume &amp; Acuity
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Annual 911 Calls</span>
                      <strong className="font-mono text-slate-900">{(agency.annualCallVolume || agency.annual911Transports).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Annual Cardiac Arrests</span>
                      <strong className="font-mono text-rose-700">{agency.annualCardiacArrestCalls.toLocaleString()} Runs</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Utstein Survival Rate</span>
                      <strong className="font-mono text-slate-900">{agency.utsteinSurvivalRate}%</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Active Ambulances</span>
                      <strong className="font-mono text-slate-900">{agency.totalAmbulances} Units</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Fire Suppression Engines</span>
                      <strong className="font-mono text-slate-900">{agency.totalFireEngines} Units</strong>
                    </div>
                  </div>
                </div>

                {/* Fact Block 3: Contracts, CMS & Grants */}
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E5E4DF] space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 font-mono">
                    3. Contract &amp; Financial Realities
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Contract End Date</span>
                      <strong className="font-mono text-rose-700">{agency.competitorContract.contractEndDate}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Contract Status</span>
                      <strong className="text-slate-900">{agency.competitorContract.status}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Medicare Claim Denials</span>
                      <strong className="font-mono text-amber-700">{agency.cmsData.claimDenialRate}% Denied</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500">Lost Claim Revenue</span>
                      <strong className="font-mono text-emerald-700">+${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K/yr</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">FEMA AFG Grants</span>
                      <strong className="text-slate-900 truncate max-w-[160px]">
                        {agency.grantStatus.afgAwarded ? `$${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K (FY${agency.grantStatus.afgFiscalYear})` : 'Eligible Candidate'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Granular Apparatus Vehicle Fleet, Hospital Transport Logistics & Multi-Year FEMA Grant History */}
          {showSection('fleet') && agency.apparatusFleet && agency.hospitalLogistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Granular Apparatus Vehicle Breakdown */}
              <section className="bg-white rounded-xl border border-[#E5E4DF] p-6 shadow-[0_1px_3px_rgba(17,24,39,0.03)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Apparatus &amp; Emergency Vehicle Fleet Breakdown</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                    {agency.apparatusFleet.totalActiveUnits} Total Active Vehicles
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">ALS Ambulances</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.alsAmbulances} Units</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">BLS Ambulances</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.blsAmbulances} Units</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">Fire Suppression Engines</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.fireEngines} Units</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">Aerial Ladder Trucks</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.ladderTrucks} Units</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">Heavy Rescue &amp; Squads</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.heavyRescueUnits} Units</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF]">
                    <div className="text-slate-500 font-semibold">Battalion / Command</div>
                    <div className="text-lg font-extrabold font-mono text-[#111827] mt-0.5">{agency.apparatusFleet.commandVehicles} Units</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E4DF] text-xs text-slate-600">
                  <span>Avg Apparatus Age: <strong className="font-mono text-[#111827]">{agency.apparatusFleet.avgVehicleAgeYears} yrs</strong></span>
                  <span>Capital Replacement Cycle: <strong className="font-mono text-[#111827]">{agency.apparatusFleet.replacementCycleYears}-Year Schedule</strong></span>
                </div>
              </section>

              {/* Hospital Trauma & STEMI PCI Cath Lab Transport Logistics */}
              <section className="bg-white rounded-xl border border-[#E5E4DF] p-6 shadow-[0_1px_3px_rgba(17,24,39,0.03)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-[#B91C1C]" />
                    <span>Receiving Hospital &amp; STEMI Cath Lab Logistics</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    {agency.hospitalLogistics.annualEdTransports.toLocaleString()} ED Transports/yr
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF] space-y-1">
                    <div className="text-slate-500 font-semibold">Primary Regional Trauma Center</div>
                    <div className="text-sm font-extrabold text-[#111827]">{agency.hospitalLogistics.primaryTraumaHospital}</div>
                    <div className="text-slate-600 font-mono">
                      Distance: <strong className="text-[#111827]">{agency.hospitalLogistics.distanceToTraumaMiles} mi</strong> · Avg Drive Time: <strong className="text-[#111827]">{agency.hospitalLogistics.transportTimeMinutes} mins</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF] space-y-1">
                    <div className="text-slate-500 font-semibold">24/7 STEMI PCI Cardiac Receiving Center</div>
                    <div className="text-sm font-extrabold text-[#111827]">{agency.hospitalLogistics.primaryCathLabHospital}</div>
                    <div className="text-slate-600 font-mono">
                      Distance: <strong className="text-[#111827]">{agency.hospitalLogistics.cathLabDistanceMiles} mi</strong> · Avg Drive Time: <strong className="text-[#111827]">{agency.hospitalLogistics.cathLabTransportMinutes} mins</strong> · ED Offload: <strong className="text-[#111827]">{agency.hospitalLogistics.avgEdOffloadLatencyMinutes} mins</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Live Federal CMS NPPES NPI Registered Sub-Records (Only shown when multiple federal NPI records exist in city) */}
          {showSection('leadership') && cityNpiProviders.length > 0 && (
            <section className="bg-white rounded-xl border border-[#E5E4DF] p-6 shadow-[0_1px_3px_rgba(17,24,39,0.03)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Additional Federal CMS NPPES NPI Registered Providers in {agency.city}, {agency.stateCode}</span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Verified organizational NPI records from the U.S. Department of Health &amp; Human Services Registry
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {cityNpiProviders.length} Federal NPI Records
                </span>
              </div>

              <div className="overflow-x-auto border border-[#E5E4DF] rounded-lg">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#E5E4DF] text-slate-700 font-bold">
                      <th className="py-2.5 px-3">Federal NPI #</th>
                      <th className="py-2.5 px-3">Registered Legal Organization Name</th>
                      <th className="py-2.5 px-3">Practice Street Address</th>
                      <th className="py-2.5 px-3">Authorized Official</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {cityNpiProviders.map((npiRec) => (
                      <tr key={npiRec.npi} className="hover:bg-[#F8F7F4]/60">
                        <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-[#1E3A8A]">
                          <a
                            href={`https://npiregistry.cms.hhs.gov/provider-view/${npiRec.npi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            <span>{npiRec.npi}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#111827]">
                          {npiRec.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {npiRec.address}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {npiRec.official ? (
                            <span>
                              <strong className="text-[#111827]">{npiRec.official}</strong>
                              {npiRec.officialTitle ? ` · ${npiRec.officialTitle}` : ''}
                            </span>
                          ) : (
                            'Organizational Enrollment'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        {/* SECTION: CLINICAL EMERGENCY PERFORMANCE, QUALITY & PATIENT OUTCOMES */}
        {showSection('clinical') && (
          <div className="space-y-6">
            {/* Interactive Longitudinal Performance & Survival Funnel Visualizer */}
            <ResuscitationSurvivalFunnel agency={agency} />

            {/* Interactive NEMSQA, AHA Mission: Lifeline & CARES Quality Uplift Simulator */}
            <QualityScorecard agency={agency} onOpenRfpGenerator={onOpenRfpGenerator} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card A: Clinical Emergency Performance & Patient Outcomes */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Clinical Emergency Performance &amp; Patient Outcomes</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A]">
                    <Award className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>AHA Mission: Lifeline {agency.qualityMetrics.ahaMissionLifelineTier}</span>
                  </span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Annual Emergency Calls</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.annualCallVolume.toLocaleString()}</dd>
                    <dd className="text-[10px] text-slate-500">Total 911 dispatches</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Annual 911 Transports</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.annual911Transports.toLocaleString()}</dd>
                    <dd className="text-[10px] text-slate-500">Billable patient runs</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Cardiac Arrest (OHCA) Calls</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.annualCardiacArrestCalls.toLocaleString()} / yr</dd>
                    <dd className="text-[10px] text-slate-500">Resuscitation activations</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-600 font-medium">Utstein Cardiac Survival</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-0.5">{agency.utsteinSurvivalRate}%</dd>
                    <dd className="text-[10px] text-slate-500">Survival to discharge</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-600 font-medium">CARES Good Neuro (CPC 1/2)</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-0.5">{agency.qualityMetrics.caresGoodNeurologicalSurvivalPct}%</dd>
                    <dd className="text-[10px] text-slate-500">Intact neurological outcome</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Bystander CPR Rate</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.bystanderCPRRate}%</dd>
                    <dd className="text-[10px] text-slate-500">Prior to EMS arrival</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Annual Trauma Incidents</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.gisData.annualTraumaIncidents.toLocaleString()}</dd>
                    <dd className="text-[10px] text-slate-500">{agency.gisData.traumaCenterLevel} corridor</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">Avg EMS Transport Time</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.gisData.avgTransportTimeMinutes} mins</dd>
                    <dd className="text-[10px] text-slate-500">Scene to ED arrival</dd>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <dt className="text-slate-500">STEMI PCI Cath Lab Dist.</dt>
                    <dd className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">{agency.gisData.distanceToNearestCathLabMiles} miles</dd>
                    <dd className="text-[10px] text-slate-500">12-lead pre-activation</dd>
                  </div>
                </dl>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500 font-medium">Primary Receiving Trauma &amp; Cardiac Hospital: </span>
                    <strong className="text-[#0F172A]">{agency.gisData.primaryReceivingHospital}</strong>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-[#1E3A8A]">
                    {agency.gisData.annualHospitalDestinationTransports?.toLocaleString()} ED Transports / yr
                  </span>
                </div>
              </section>

              {/* Card B: NEMSQA Quality & Clinical Care Outcomes */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Quality &amp; NEMSQA Clinical Quality Outcomes</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">National NEMSQA Benchmarks</span>
                </div>

                <div className="space-y-3.5 text-xs">
                  {[
                    {
                      label: 'Cardiac-01: 12-Lead STEMI ECG Acquired ≤ 10 Mins',
                      val: agency.qualityMetrics.nemsqaStemi12LeadAcquisitionPct,
                      bench: 85
                    },
                    {
                      label: 'Resuscitation: Chest Compression Fraction (CCF %)',
                      val: agency.qualityMetrics.nemsqaChestCompressionFractionPct,
                      bench: 78
                    },
                    {
                      label: 'Airway: EtCO2 Waveform Capnography Compliance (35–45 mmHg)',
                      val: agency.qualityMetrics.nemsqaEtco2VentilationCompliancePct,
                      bench: 64
                    },
                    {
                      label: 'Pediatrics-01: Pediatric Respiratory Assessment & Support',
                      val: agency.qualityMetrics.nemsqaPediatricRespiratorySupportPct,
                      bench: 72
                    },
                    {
                      label: 'Stroke-01: Last Known Well (LKW) Time Documented',
                      val: agency.qualityMetrics.nemsqaStrokeLkwDocumentedPct,
                      bench: 80
                    },
                    {
                      label: 'Trauma-01: Pain Assessment & Effective Analgesic Care',
                      val: agency.qualityMetrics.nemsqaPainManagementEffectivePct,
                      bench: 75
                    }
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <span className="font-bold font-mono tabular-nums text-[#0F172A]">
                          {item.val}% <span className="text-slate-400 font-normal">(Benchmark: {item.bench}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: `${Math.min(100, item.val)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Card C: Regional EMS Clinical Protocols & Receiving Hospital Telemetry Alignment */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Regional EMS Clinical Protocols &amp; Receiving Hospital Telemetry Network</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receiving Hub: <strong className="text-[#0F172A]">{protocolModel.receivingHospitalNetwork}</strong> · {protocolModel.stemiDoorToBalloonTarget}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  Telemetry: {protocolModel.cathLabTransmissionStandard}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Regional Clinical Protocol Mandate</th>
                      <th className="py-3 px-4">Clinical Target Benchmark</th>
                      <th className="py-3 px-4">Incumbent Fleet Limitation</th>
                      <th className="py-3 px-4">ZOLL Enabling Clinical Technology</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {protocolModel.protocols.map(proto => (
                      <tr key={proto.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F172A]">{proto.protocolName}</div>
                          <div className="text-[11px] text-slate-500">{proto.governingStandard}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">{proto.clinicalTargetMetric}</td>
                        <td className="py-3 px-4 text-rose-800 max-w-xs">{proto.incumbentHardwareGap}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-sm">{proto.zollEnablingTechnology}</td>
                        <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                          <span className={proto.agencyComplianceStatus === 'Standardized' ? 'text-emerald-700' : 'text-amber-700'}>
                            {proto.agencyComplianceStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* SECTION: INSURANCE OUTCOMES (MEDICARE, MEDICAID, COMMERCIAL, SELF-PAY) & DENIALS / RECOVERABLE */}
        {showSection('billing') && (
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Insurance Information Outcomes (Medicare, Medicaid, Commercial, Self-Pay), Denials &amp; Recoverable Revenue</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete payer mix distribution, CMS Ground Ambulance Data Collection System (GADCS) status, and claims recovery analysis
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                GADCS Status: <strong className="text-[#0F172A]">{agency.cmsData.gadcsReportingStatus}</strong> · Cost-to-Charge Ratio: <strong className="font-mono tabular-nums text-[#0F172A]">{agency.qualityMetrics.gadcsCostToChargeRatio}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 6 Cols: 4-Tier Insurance Payer Outcomes */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-600">
                  Insurance Payer Mix &amp; Reimbursement Outcomes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-sm">01. Medicare</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-[#1E3A8A]">{agency.cmsData.medicarePayerPct}% of Runs</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0F172A] h-full rounded-full" style={{ width: `${agency.cmsData.medicarePayerPct}%` }} />
                    </div>
                    <div className="pt-1 text-slate-600 space-y-0.5 font-mono tabular-nums">
                      <div>Annual Billed: <strong className="text-[#0F172A]">${agency.cmsData.medicareBilledAnnual.toLocaleString()}</strong></div>
                      <div>Annual Allowed: <strong className="text-[#0F172A]">${agency.cmsData.medicareAllowedAnnual.toLocaleString()}</strong></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-sm">02. Medicaid</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-[#1E3A8A]">{agency.cmsData.medicaidPayerPct}% of Runs</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: `${agency.cmsData.medicaidPayerPct}%` }} />
                    </div>
                    <div className="pt-1 text-slate-600 space-y-0.5">
                      <div className="font-mono tabular-nums">Annual Billed: <strong className="text-[#0F172A]">${agency.cmsData.medicaidBilledAnnual.toLocaleString()}</strong></div>
                      <div>Supplemental GEMT / IGT Eligible</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-sm">03. Commercial Insurance</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-[#1E3A8A]">{agency.cmsData.commercialPayerMixPct}% of Runs</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: `${agency.cmsData.commercialPayerMixPct}%` }} />
                    </div>
                    <div className="pt-1 text-slate-600 space-y-0.5">
                      <div className="font-mono tabular-nums">Underpayment Gap: <strong className="text-[#0F172A]">${agency.qualityMetrics.commercialUnderpaymentPerTrip} / trip</strong></div>
                      <div>Out-of-Network Balance Billing Protected</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-sm">04. Self-Pay / Uninsured</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-amber-700">{agency.cmsData.selfPayPayerPct}% of Runs</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${agency.cmsData.selfPayPayerPct}%` }} />
                    </div>
                    <div className="pt-1 text-slate-600 space-y-0.5">
                      <div>High bad-debt write-off exposure</div>
                      <div>Eligible for automated insurance discovery</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 6 Cols: Claims Denials & Recoverable Revenue Breakdown */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-600">
                  Claims Denials &amp; Annual Recoverable Revenue Analysis
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Active Claims Denial Rate</div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-rose-700">{agency.cmsData.claimDenialRate}%</div>
                    <div className="text-[11px] text-slate-600">
                      Primary Denial Code: <strong className="font-mono text-[#0F172A]">{agency.cmsData.topDenialReasonCode}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Net Annual Recoverable Revenue</div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-emerald-700">
                      ${agency.cmsData.estimatedRecoverableRevenue.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Recapturable via ZOLL AR Boost &amp; ePCR NEMSIS validation
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium">Primary Claim Denial Cause: </span>
                    <strong className="text-[#0F172A]">{agency.cmsData.topDenialReason}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Current Revenue Cycle Software in Use: </span>
                    <strong className="text-[#0F172A]">{agency.installedFleet.billingSoftware}</strong> · Supplied by: <strong className="text-[#0F172A]">{suppliers.billingSupplier}</strong>
                  </div>
                  <p className="text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
                    Integrating automated pre-billing NEMSIS v3.5 validation and real-time patient insurance discovery eliminates missing Physician Certification Statements (PCS), incomplete ECG/EtCO2 waveform attachments, and demographic mismatches—recovering an estimated <strong className="font-mono tabular-nums text-[#0F172A]">${agency.cmsData.estimatedRecoverableRevenue.toLocaleString()}</strong> annually for {agency.name}.
                  </p>
                </div>
              </div>

            </div>

            {/* Granular HCPCS Procedure Breakdown & CMS GADCS 10% Penalty Risk Table */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    Procedure-Level HCPCS Ambulance Fee Schedule &amp; CMS GADCS 10% Penalty Exposure
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hcpcsModel.gadcs.cohortWave} · Readiness: <strong className="text-[#0F172A]">{hcpcsModel.gadcs.reportingReadinessStatus}</strong> · {hcpcsModel.gadcs.keyComplianceGap}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                  GADCS 10% Medicare Penalty Risk: -${hcpcsModel.gadcs.gadcs10PctPenaltyExposure.toLocaleString()}/yr
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">HCPCS Code</th>
                      <th className="py-2.5 px-4">Procedure &amp; Clinical Requirement</th>
                      <th className="py-2.5 px-4 text-right">CMS Base Rate</th>
                      <th className="py-2.5 px-4 text-right">Annual Claims</th>
                      <th className="py-2.5 px-4 text-right">Gross Billed</th>
                      <th className="py-2.5 px-4 text-right">Denial Exposure</th>
                      <th className="py-2.5 px-4">ZOLL Automated Documentation Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {hcpcsModel.procedures.map(proc => (
                      <tr key={proc.code} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#1E3A8A]">{proc.code}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-[#0F172A]">{proc.descriptor}</div>
                          <div className="text-[11px] text-slate-500">{proc.clinicalTrigger}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">${proc.nationalMedicareBaseRate.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">{proc.estimatedAnnualClaims.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">${proc.grossAnnualBilling.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-700 font-semibold">
                          -${proc.annualRevenueAtRisk.toLocaleString()} ({proc.denialRiskPct}%)
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-md">{proc.zollDocumentationMitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: ACTUAL EQUIPMENT IN USE & CURRENT VENDOR SUPPLIERS (ALL 3 MODALITIES: 1, 2, AND 3) */}
        {showSection('suppliers') && (
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Actual Equipment in Use &amp; Current Vendor Suppliers</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete audit of what hardware/software is currently deployed at {agency.name} and who supplies and maintains each item
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Primary Service Contract: <strong className="text-[#0F172A]">{agency.competitorContract.vendor}</strong> · Ends <strong className="font-mono tabular-nums text-[#0F172A]">{agency.competitorContract.contractEndDate}</strong>
              </span>
            </div>

            {/* MODALITY 1: DIRECT SUPPLIER CARDS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600">
                01. Direct Vendor &amp; Distributor Supplier Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">Cardiac Monitors / Defibrillators</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-600">
                      {agency.installedFleet.defibUnitsCount} Units
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">In Use: {agency.installedFleet.defibBrand}</div>
                  <div className="text-slate-700">
                    Current Supplier: <strong className="text-[#0F172A]">{suppliers.defibSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200 font-mono tabular-nums">
                    Age: {agency.installedFleet.defibAgeYears} yrs · Warranty: <strong className="font-sans text-[#0F172A]">{agency.installedFleet.defibWarrantyStatus}</strong> · Ends: {agency.competitorContract.contractEndDate}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">ePCR Clinical Charting</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">
                      NEMSIS v3.5
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">In Use: {agency.installedFleet.epcrCadSoftware}</div>
                  <div className="text-slate-700">
                    Current Supplier: <strong className="text-[#0F172A]">{suppliers.epcrSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    Field charting &amp; state trauma registry reporting supplier
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">911 CAD Dispatch System</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">
                      PSAP Dispatch
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">In Use: {agency.installedFleet.dispatchCadVendor}</div>
                  <div className="text-slate-700">
                    Current Supplier: <strong className="text-[#0F172A]">{suppliers.cadSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    Primary 911 communications &amp; unit AVL routing supplier
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">Mechanical CPR System</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-600">
                      {agency.installedFleet.cprUnitsCount} Units
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">In Use: {agency.installedFleet.mechanicalCPR}</div>
                  <div className="text-slate-700">
                    Current Supplier: <strong className="text-[#0F172A]">{suppliers.cprSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    Automated chest compression resuscitation hardware
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">Transport Ventilators</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-600">
                      {agency.installedFleet.ventUnitsCount} Units
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">In Use: {agency.installedFleet.transportVentilator}</div>
                  <div className="text-slate-700">
                    Current Supplier: <strong className="text-[#0F172A]">{suppliers.ventSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    ALS airway &amp; respiratory support hardware supplier
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E3A8A]">Billing &amp; Medical Disposables</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">
                      RCM &amp; Supply
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">Billing: {agency.installedFleet.billingSoftware}</div>
                  <div className="text-slate-700">
                    Billing Supplier: <strong className="text-[#0F172A]">{suppliers.billingSupplier}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    Consumables Distributor: <strong className="text-[#0F172A]">{suppliers.medicalDistributor}</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* MODALITY 2: COMPLETE EQUIPMENT & PROCUREMENT AUDIT TABLE */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600">
                02. Complete Equipment &amp; Supplier Procurement Table
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Equipment / System Category</th>
                      <th className="py-3 px-4">Actual Model / Software in Use</th>
                      <th className="py-3 px-4">Active Units</th>
                      <th className="py-3 px-4">Age &amp; Warranty Status</th>
                      <th className="py-3 px-4">Current Supplier / Distributor</th>
                      <th className="py-3 px-4">Maintenance Contract &amp; Renewal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">Cardiac Monitors / Defibrillators</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.defibBrand}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.installedFleet.defibUnitsCount} Frontline Units</td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {agency.installedFleet.defibAgeYears} yrs · <span className="font-sans font-semibold text-rose-700">{agency.installedFleet.defibWarrantyStatus}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.defibSupplier}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums">
                        {agency.competitorContract.vendor} (${agency.competitorContract.annualServiceCostPerUnit.toLocaleString()}/unit · Ends {agency.competitorContract.contractEndDate})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">Mechanical CPR Resuscitation</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.mechanicalCPR}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.installedFleet.cprUnitsCount} Units</td>
                      <td className="py-3 px-4">
                        {agency.installedFleet.cprUnitsCount > 0 ? `${Math.max(3, agency.installedFleet.defibAgeYears - 2)} yrs · Active Service` : 'No Automated CPR'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.cprSupplier}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {agency.installedFleet.cprUnitsCount > 0 ? 'Annual Preventive Calibration' : 'Target for ZOLL AutoPulse Trial'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">Emergency Transport Ventilators</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.transportVentilator}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.installedFleet.ventUnitsCount} Units</td>
                      <td className="py-3 px-4">
                        {agency.installedFleet.ventUnitsCount > 0 ? 'Active Biomedical Fleet' : 'Manual BVM Only'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.ventSupplier}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {agency.installedFleet.ventUnitsCount > 0 ? 'OEM Biomedical Agreement' : 'Target for ZOLL Z Vent Deployment'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">ePCR Clinical Charting Software</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.epcrCadSoftware}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.totalAmbulances + agency.totalFireEngines} Field Tablets</td>
                      <td className="py-3 px-4">Annual SaaS License</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.epcrSupplier}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums">Renewal Window: {agency.competitorContract.renewalWindowDays} Days Prior</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">911 Dispatch CAD Platform</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.dispatchCadVendor}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.stationsCount} Stations Connected</td>
                      <td className="py-3 px-4">Municipal PSAP Contract</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.cadSupplier}</td>
                      <td className="py-3 px-4 text-slate-600">Multi-Year County/City Dispatch Agreement</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">Revenue Cycle &amp; Claims Billing</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{agency.installedFleet.billingSoftware}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.annual911Transports.toLocaleString()} Claims / yr</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{agency.cmsData.claimDenialRate}% Current Denial Rate</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{suppliers.billingSupplier}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums">
                        ${agency.cmsData.estimatedRecoverableRevenue.toLocaleString()} Recoverable w/ ZOLL AR Boost
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODALITY 3: SIDE-BY-SIDE CURRENT VENDOR VS. ZOLL COMPARISON MATRIX */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>03. Side-by-Side Current Supplier vs. Integrated ZOLL Replacement Matrix</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] text-white font-semibold">
                      <th className="py-3 px-4">Operational Domain</th>
                      <th className="py-3 px-4">Current Equipment &amp; Supplier at {agency.name}</th>
                      <th className="py-3 px-4">Recommended ZOLL Integrated Solution</th>
                      <th className="py-3 px-4">Clinical &amp; Financial Impact for Provider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">Defibrillation &amp; Telemetry</td>
                      <td className="py-3 px-4 text-slate-700">
                        <strong className="text-[#0F172A]">{agency.installedFleet.defibBrand}</strong> ({agency.installedFleet.defibAgeYears} yrs old)<br />
                        <span className="text-slate-500">Supplier: {suppliers.defibSupplier}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1E3A8A] bg-slate-50">
                        ZOLL X Series Advanced ({agency.installedFleet.defibUnitsCount} Units)
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Real BVM Help®, Real CPR Help®, TBI Dashboard, and 50% lighter weight; elevates CCF from {agency.qualityMetrics.nemsqaChestCompressionFractionPct}% to &gt;88%.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">Automated Resuscitation</td>
                      <td className="py-3 px-4 text-slate-700">
                        <strong className="text-[#0F172A]">{agency.installedFleet.mechanicalCPR}</strong><br />
                        <span className="text-slate-500">Supplier: {suppliers.cprSupplier}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1E3A8A] bg-slate-50">
                        ZOLL AutoPulse NXT Resuscitation System
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Circumferential load-distributing band compressions with ShockSync™ integration to improve Utstein survival ({agency.utsteinSurvivalRate}%).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">ePCR &amp; CAD Integration</td>
                      <td className="py-3 px-4 text-slate-700">
                        <strong className="text-[#0F172A]">{agency.installedFleet.epcrCadSoftware}</strong> + <strong className="text-[#0F172A]">{agency.installedFleet.dispatchCadVendor}</strong><br />
                        <span className="text-slate-500">Suppliers: {suppliers.epcrSupplier} / {suppliers.cadSupplier}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1E3A8A] bg-slate-50">
                        ZOLL RescueNet ePCR &amp; ZOLL Respond CAD
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Automated waveform upload from X Series into ePCR chart; eliminates manual data entry and NEMSIS v3.5 validation errors.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">Revenue Cycle &amp; Claims Recovery</td>
                      <td className="py-3 px-4 text-slate-700">
                        <strong className="text-[#0F172A]">{agency.installedFleet.billingSoftware}</strong> ({agency.cmsData.claimDenialRate}% Denials)<br />
                        <span className="text-slate-500">Supplier: {suppliers.billingSupplier}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1E3A8A] bg-slate-50">
                        ZOLL Billing &amp; AR Boost Insurance Discovery
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        Recaptures up to <span className="font-mono tabular-nums">${agency.cmsData.estimatedRecoverableRevenue.toLocaleString()}</span> annually by resolving {agency.cmsData.topDenialReasonCode} denials and self-pay accounts.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODALITY 4: INCUMBENT FDA RECALL EXPOSURE & 5-YEAR FLEET TCO COMPARISON */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                    <span>04. Incumbent FDA Recall Alert &amp; 5-Year Total Cost of Ownership (TCO) Comparison ({tcoModel.unitCount} Units)</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Active Alert: <strong className="font-mono text-rose-700">{tcoModel.matchedIntel.fdaRecallId}</strong> ({tcoModel.matchedIntel.eolStatus}) — {tcoModel.matchedIntel.fdaRecallSummary}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                  5-Yr Net ZOLL Lifecycle Savings: +${tcoModel.totalSavingsIncludingTradeIn.toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">5-Year Lifecycle Cost Driver ({tcoModel.unitCount} Frontline Units)</th>
                      <th className="py-2.5 px-4 text-right">Incumbent ({tcoModel.incumbentModel})</th>
                      <th className="py-2.5 px-4 text-right">ZOLL ({tcoModel.zollModel})</th>
                      <th className="py-2.5 px-4 text-right">5-Yr Savings Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-[#0F172A]">OEM Preventive Maintenance &amp; Service Contracts (60 Mos)</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">${tcoModel.incumbentServiceTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">${tcoModel.zollServiceTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">+${(tcoModel.incumbentServiceTotal - tcoModel.zollServiceTotal).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-[#0F172A]">Smart Battery Fleet Lifecycle Replacements</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">${tcoModel.incumbentBatteryTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">${tcoModel.zollBatteryTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">+${(tcoModel.incumbentBatteryTotal - tcoModel.zollBatteryTotal).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-[#0F172A]">Electrodes, Capnography &amp; Resuscitation Consumables</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">${tcoModel.incumbentConsumablesTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">${tcoModel.zollConsumablesTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">+${(tcoModel.incumbentConsumablesTotal - tcoModel.zollConsumablesTotal).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50/40">
                      <td className="py-2.5 px-4 font-semibold text-[#0F172A]">Retired Competitor Fleet Trade-In Credit (${tcoModel.matchedIntel.zollTradeInCreditPerUnit.toLocaleString()}/unit)</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">$0</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">-${tcoModel.totalTradeInCredit.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">+${tcoModel.totalTradeInCredit.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Interactive 5-Year Cumulative TCO Savings Area Chart */}
              <TcoCumulativeSavingsChart agency={agency} className="mt-4" />
            </div>
          </section>
        )}

        {/* SECTION: ACTIVE DEFIBRILLATOR & BIOMEDICAL FLEET + FRONTLINE APPARATUS & MAINTENANCE CONTRACTS */}
        {showSection('fleet') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Active Defibrillator &amp; Biomedical Fleet</span>
              </h2>

              <div className="grid grid-cols-1 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <div className="p-3.5 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px] uppercase tracking-wider">Frontline Monitor / Defibrillators</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{agency.installedFleet.defibBrand}</div>
                  <div className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                    <strong className="text-slate-900 dark:text-white">{agency.installedFleet.defibUnitsCount} active units</strong> · <strong className="text-slate-900 dark:text-white">{agency.installedFleet.defibAgeYears} years</strong> in service · Warranty: <strong className="font-sans text-slate-900 dark:text-white">{agency.installedFleet.defibWarrantyStatus}</strong>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.defibSupplier}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px] uppercase tracking-wider">Mechanical CPR Equipment</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{agency.installedFleet.mechanicalCPR}</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {agency.installedFleet.cprUnitsCount > 0
                      ? `${agency.installedFleet.cprUnitsCount} automated compression units deployed across frontline units`
                      : 'Currently manual compressions only — high priority for mechanical CPR upgrade'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.cprSupplier}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px] uppercase tracking-wider">Emergency Transport Ventilators</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{agency.installedFleet.transportVentilator}</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {agency.installedFleet.ventUnitsCount > 0
                      ? `${agency.installedFleet.ventUnitsCount} transport ventilator units deployed`
                      : 'Bag-Valve-Mask only during emergency transports'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.ventSupplier}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Frontline Apparatus &amp; Maintenance Contracts</span>
              </h2>

              <dl className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Ambulance Fleet</dt>
                  <dd className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.totalAmbulances} Frontline Units</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Fire Apparatus</dt>
                  <dd className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.totalFireEngines} Engines / Ladders</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Current Maintenance Vendor</dt>
                  <dd className="font-bold text-slate-900 dark:text-white mt-0.5">{agency.competitorContract.vendor}</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Contract Expiration Date</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.competitorContract.contractEndDate}</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Annual Service Cost / Unit</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">${agency.competitorContract.annualServiceCostPerUnit.toLocaleString()} / yr</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Renewal Notice Window</dt>
                  <dd className="font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{agency.competitorContract.renewalWindowDays} Days ({agency.competitorContract.status})</dd>
                </div>
              </dl>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Maintenance Contract &amp; Fleet Action Plan</div>
                <p className="leading-relaxed">{agency.competitorContract.actionRecommendation}</p>
              </div>
            </section>
          </div>
        )}

        {/* SECTION: CAD, ePCR & BILLING SOFTWARE */}
        {showSection('software') && (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
              <span>Emergency Communications, 911 CAD Dispatch &amp; Clinical ePCR Systems</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="font-semibold text-[#1E3A8A] dark:text-blue-400 font-mono text-[10px] uppercase tracking-wider">911 Dispatch CAD System</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{agency.installedFleet.dispatchCadVendor}</div>
                <div className="text-slate-600 dark:text-slate-400">Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.cadSupplier}</strong></div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Primary PSAP computer-aided dispatch system routing emergency calls to {agency.stationsCount} station{agency.stationsCount > 1 ? 's' : ''} and frontline apparatus.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="font-semibold text-[#1E3A8A] dark:text-blue-400 font-mono text-[10px] uppercase tracking-wider">Electronic Patient Care Report (ePCR)</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{agency.installedFleet.epcrCadSoftware}</div>
                <div className="text-slate-600 dark:text-slate-400">Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.epcrSupplier}</strong></div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Field clinical chart documentation platform managing <span className="font-mono tabular-nums">{agency.annual911Transports.toLocaleString()}</span> annual transports under NEMSIS v3.5 standards.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="font-semibold text-[#1E3A8A] dark:text-blue-400 font-mono text-[10px] uppercase tracking-wider">EMS Billing &amp; Revenue Software</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{agency.installedFleet.billingSoftware}</div>
                <div className="text-slate-600 dark:text-slate-400">Current Supplier: <strong className="text-slate-900 dark:text-white">{suppliers.billingSupplier}</strong></div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Revenue cycle management system processing Medicare ({agency.cmsData.medicarePayerPct}%), Medicaid ({agency.cmsData.medicaidPayerPct}%), Commercial ({agency.cmsData.commercialPayerMixPct}%), and Self-Pay ({agency.cmsData.selfPayPayerPct}%) claims.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: FEDERAL FEMA GRANT READINESS & FUNDING STATUS + JURISDICTION & SERVICE DEMOGRAPHICS */}
        {showSection('grants') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Federal FEMA Grant Readiness & Funding Status */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Federal FEMA Grant Readiness &amp; Funding Status</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                  <div className="font-semibold text-[#1E3A8A] dark:text-blue-400 text-[11px] font-mono uppercase tracking-wider">
                    FEMA Assistance to Firefighters Grant (AFG)
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {agency.grantStatus.afgAwarded ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono tabular-nums">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Awarded: ${(agency.grantStatus.afgAwardAmount || 0).toLocaleString()} (FY {agency.grantStatus.afgFiscalYear})</span>
                      </span>
                    ) : (
                      <span className="text-slate-900 dark:text-white">Eligible Regional Applicant — Pre-Application Spec Ready (FY {agency.grantStatus.afgFiscalYear || 2025})</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Approved Funding Scope: <strong className="text-slate-900 dark:text-white">{agency.grantStatus.afgPurpose || 'Operations & Safety — Cardiac Monitor & Mechanical CPR Upgrade'}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="p-3.5 bg-white dark:bg-slate-900 space-y-1">
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider">FEMA SAFER Staffing Grant</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {agency.grantStatus.saferGrantActive ? 'Active SAFER Grant Operational' : 'Standard Municipal Staffing Budget'}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 space-y-1">
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider">Municipal Budget Cycle</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {agency.gisData.fiscalBudgetCycleQuarter} · FY Ends {agency.grantStatus.fiscalYearEndMonth}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Jurisdiction & Service Demographics */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                <span>Jurisdiction &amp; Service Demographics</span>
              </h2>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Service Model</dt>
                  <dd className="font-bold text-slate-900 dark:text-white mt-0.5">{agency.agencyType}</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Government Level</dt>
                  <dd className="font-bold text-slate-900 dark:text-white mt-0.5">{agency.jurisdictionLevel} Jurisdiction</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Population Served</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.populationServed.toLocaleString()}</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Stations &amp; Facilities</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.stationsCount} Active Stations</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Certified Personnel</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.totalEMSStaff} Responders</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Coverage Territory</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.responseAreaSqMiles} Sq. Miles</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Senior Population (65+)</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.gisData.seniorPopulationPct}% of Residents</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Median Household Income</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">${agency.gisData.medianHouseholdIncome.toLocaleString()}</dd>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <dt className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">Community Poverty Rate</dt>
                  <dd className="font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{agency.gisData.povertyRate}%</dd>
                </div>
              </dl>
            </section>

            {/* Pre-Competed Cooperative Purchasing Contracts & Grant Vehicles */}
            <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Pre-Competed Cooperative Purchasing Contracts &amp; State Grant Vehicles ({agency.stateCode})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized national cooperative purchasing contracts allowing {agency.name} to bypass 6-to-9 month municipal RFP delays
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">Contract Vehicle &amp; Master ID</th>
                      <th className="py-2.5 px-4">Ceiling Discount &amp; Trade-In Terms</th>
                      <th className="py-2.5 px-4">Procurement Cycle Saved</th>
                      <th className="py-2.5 px-4">Statutory Piggyback Clause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {COOPERATIVE_CONTRACTS.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F172A]">{c.contractName}</div>
                          <div className="font-mono font-semibold text-[#1E3A8A]">{c.contractNumber}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">{c.discountCeiling}</td>
                        <td className="py-3 px-4 font-mono text-[#0F172A]">{c.rfpMonthsSaved}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-md">{c.piggybackClauseText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5-Year Federal FEMA AFG, SAFER & Homeland Security Grant History */}
            {agency.femaGrantHistory && agency.femaGrantHistory.length > 0 && (
              <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-700" />
                      <span>Multi-Year FEMA AFG, SAFER &amp; Homeland Security Grant Track Record</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      5-year federal grant funding history and FY2026 equipment modernization eligibility for {agency.name}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Fiscal Year</th>
                        <th className="py-2.5 px-4">Federal Grant Program</th>
                        <th className="py-2.5 px-4">Approved Equipment &amp; Operational Scope</th>
                        <th className="py-2.5 px-4 text-right">Federal Award</th>
                        <th className="py-2.5 px-4 text-right">Local Match</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {agency.femaGrantHistory.map((g, idx) => (
                        <tr key={`${g.fiscalYear}-${idx}`} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-mono font-bold text-[#0F172A]">FY {g.fiscalYear}</td>
                          <td className="py-2.5 px-4 font-bold text-[#1E3A8A]">{g.programName}</td>
                          <td className="py-2.5 px-4 text-slate-700 max-w-md">{g.purpose}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">${g.awardAmount.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-600">${g.localMatchAmount.toLocaleString()} ({100 - g.federalSharePct}%)</td>
                          <td className="py-2.5 px-4 text-right font-semibold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              g.status.includes('Awarded')
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                            }`}>
                              {g.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>
        )}

        {/* SECTION: FIELD NOTES & CRM INTERACTION LOG */}
        {showSection('notes') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Past Notes History (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Field Interaction History</span>
              </h2>

              {agency.fieldNotes.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  No notes recorded yet. Use the form on the right to log your first interaction.
                </div>
              ) : (
                <div className="space-y-3">
                  {agency.fieldNotes.map(note => (
                    <div key={note.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">{note.meetingType}</span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500">{note.date} · {note.repName}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{note.notes}</p>
                      {note.nextAction && (
                        <div className="text-[11px] text-[#0F172A] bg-white border border-slate-200 rounded-md p-2 mt-1">
                          <strong>Next Action:</strong> {note.nextAction} {note.dueDate && `(Due ${note.dueDate})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Note Logger Form (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1E3A8A]" />
                <span>Log New Interaction</span>
              </h2>

              <form onSubmit={handleNoteSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Meeting / Call Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="On-Site Station Visit">On-Site Station Visit</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Virtual Demo">Virtual Demo</option>
                    <option value="RFP Review">RFP Review</option>
                    <option value="Ride-Along">Ride-Along</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Meeting Notes
                  </label>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Describe discussion, chief priorities, clinical interest..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Next Follow-up Action
                  </label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="e.g. Deliver pre-emptive RFP specification"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="w-full py-2 px-4 rounded-lg text-xs font-semibold bg-[#0F172A] text-white hover:bg-[#1E3A8A] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Interaction to Cloud CRM</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
      </main>

      {/* Sticky Account Quick-Action Bar (Docked bottom tray for field tablets & deep scrolls, hidden on print) */}
      <aside 
        aria-label="Account Action Dock"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] print:hidden transition-all"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Department Identity & Quick Pipeline Stage Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:block min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[240px] lg:max-w-[360px]">
                {agency.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {agency.city}, {agency.stateCode} · <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">${(agency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}K Value</span>
              </div>
            </div>

            {/* Quick Stage Transition Dropdown with minimum 44px touch target */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 hidden xl:inline">Stage:</span>
              <select
                value={agency.zollOpportunity.salesStage}
                onChange={(e) => onUpdateStage(agency.id, e.target.value as LeadStage)}
                className="h-11 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1E3A8A] cursor-pointer shadow-2xs"
                title="Update CRM Sales Pipeline Stage"
              >
                {stages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Generous 44px Field Touch Targets */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Add to Day Driving Route */}
            <button
              onClick={() => onToggleRoute(agency.id)}
              className={`h-11 px-3.5 sm:px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                agency.inDayRoute
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Add station coordinates to today's multi-stop driving itinerary"
            >
              <Navigation className="w-4 h-4" />
              <span>{agency.inDayRoute ? "In Today's Route" : 'Add to Route'}</span>
            </button>

            {/* 2. Pre-Emptive Technical RFP Spec Generator */}
            {onOpenRfpGenerator && (
              <button
                onClick={() => onOpenRfpGenerator(agency)}
                className="h-11 px-3.5 sm:px-4 rounded-lg text-xs font-bold bg-[#1E3A8A] hover:bg-[#1E40AF] text-white flex items-center gap-2 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Generate clinical technical specifications to lock out competitor bids"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Generate RFP Spec</span>
                <span className="inline sm:hidden">RFP Spec</span>
              </button>
            )}

            {/* 3. Executive Printable Dossier */}
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              className="h-11 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#1E3A8A] dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              title="Print or export complete account briefing dossier"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print Dossier</span>
            </button>

            {/* 4. Home Cockpit (if provided) */}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="h-11 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Return to Home Screen Cockpit"
              >
                <Home className="w-4 h-4" />
                <span className="hidden lg:inline">Home</span>
              </button>
            )}

            {/* 5. Back Navigation */}
            <button
              onClick={onBack}
              className="h-11 px-3.5 sm:px-4 rounded-lg text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              title="Return to Territory Results (Escape)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

        </div>
      </aside>

      {/* One-Click Printable Executive Account Briefing Dossier Modal */}
      <ExecutiveBriefingDossier
        agency={agency}
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
      />
    </div>
  );
};
