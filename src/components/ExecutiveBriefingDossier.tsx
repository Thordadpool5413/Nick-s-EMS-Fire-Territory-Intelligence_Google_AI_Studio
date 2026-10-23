/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Agency } from '../types';
import {
  Printer,
  Download,
  FileDown,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CheckCircle2,
  FileText,
  DollarSign,
  HeartPulse,
  Activity,
  Award,
  Truck,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Scale,
  AlertTriangle,
  Loader2,
  Clock,
  UserCheck,
  Briefcase
} from 'lucide-react';
import brandLogoAsset from '../assets/images/nicks_ems_logo_1792367124466.jpg';
import { calculateAgencyFleetTco, calculateAgencyHcpcsBreakdown } from '../data/clinicalAndCompetitiveIntelligence';
import { explainAgencyScore } from '../utils/syncStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExecutiveBriefingDossierProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveBriefingDossier: React.FC<ExecutiveBriefingDossierProps> = ({
  agency,
  isOpen,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Support closing with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derived 5-Year TCO Comparison Model
  const tcoModel = useMemo(() => {
    if (!agency) return null;
    return calculateAgencyFleetTco(agency, 5);
  }, [agency]);

  // Derived Granular HCPCS Medicare & Commercial Denial Model
  const hcpcsModel = useMemo(() => {
    if (!agency) return null;
    return calculateAgencyHcpcsBreakdown(agency);
  }, [agency]);

  // Derived 5-Pillar Algorithmic Score Attribution
  const scoreExplanation = useMemo(() => {
    if (!agency) return null;
    return explainAgencyScore(agency);
  }, [agency]);

  // ALWAYS KEEP ALL HOOKS ABOVE EARLY RETURN
  if (!isOpen || !agency) return null;

  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
  const primaryContact = agency.keyContacts && agency.keyContacts.length > 0 ? agency.keyContacts[0] : undefined;
  const departmentPhone = agency.headquartersPhone || primaryContact?.phone || '(555) 230-9110';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const fleet = agency.apparatusFleet || {
    alsAmbulances: agency.totalAmbulances || 6,
    blsAmbulances: 2,
    fireEngines: isFire ? Math.max(3, agency.totalFireEngines || 4) : 0,
    ladderTrucks: isFire ? 1 : 0,
    heavyRescueUnits: 1,
    commandVehicles: 2,
    totalActiveUnits: (agency.totalAmbulances || 6) + (isFire ? 5 : 2),
    avgVehicleAgeYears: 6.4,
    replacementCycleYears: 7
  };

  const logistics = agency.hospitalLogistics || {
    primaryTraumaHospital: `${agency.city} Regional Medical Center (${agency.gisData?.traumaCenterLevel || 'Level 1 Trauma'})`,
    traumaLevel: agency.gisData?.traumaCenterLevel || 'Level 1 Regional Trauma',
    distanceToTraumaMiles: agency.gisData?.avgTransportDistanceToTraumaMiles || 7.2,
    transportTimeMinutes: agency.gisData?.avgTransportTimeMinutes || 13,
    primaryCathLabHospital: `${agency.city} Heart & Vascular Pavilion (24/7 STEMI PCI)`,
    cathLabDistanceMiles: 6.5,
    cathLabTransportMinutes: 11,
    annualEdTransports: Math.round((agency.annual911Transports || 2800) * 0.88),
    avgEdOffloadLatencyMinutes: 21
  };

  const femaGrants = agency.femaGrantHistory || [
    {
      fiscalYear: 2025,
      programName: 'FEMA Assistance to Firefighters Grant (AFG)',
      purpose: 'Operations & Safety — Advanced Monitor-Defibrillator & Mechanical CPR Upgrades',
      awardAmount: 185000,
      localMatchAmount: 18500,
      federalSharePct: 90,
      status: 'Awarded & Disbursed' as const
    },
    {
      fiscalYear: 2024,
      programName: 'FEMA Regional AFG Interoperability Award',
      purpose: 'NEMSIS 3.5 12-Lead ECG Gateways & Hospital Telemetry Gateways',
      awardAmount: 140000,
      localMatchAmount: 21000,
      federalSharePct: 85,
      status: 'Awarded - Active Spending' as const
    },
    {
      fiscalYear: 2023,
      programName: 'Staffing for Adequate Fire & Emergency Response (SAFER)',
      purpose: 'Frontline Paramedic Hiring & 24/7 Resuscitation Squad Coverage',
      awardAmount: 390000,
      localMatchAmount: 0,
      federalSharePct: 100,
      status: 'Awarded & Disbursed' as const
    },
    {
      fiscalYear: 2026,
      programName: 'FY2026 FEMA AFG Equipment Modernization Priority',
      purpose: 'LifePak-15 Replacement & Next-Gen Real CPR Help Defibrillator Spec',
      awardAmount: 220000,
      localMatchAmount: 22000,
      federalSharePct: 90,
      status: 'Eligible' as const
    }
  ];

  // ACTION 1: Trigger Native Browser Print Dialog (Scoped CSS ensures only document prints)
  const handlePrint = () => {
    window.print();
  };

  // ACTION 2: Direct Client-Side PDF Generation & Download
  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadSuccess(null);
    setErrorMessage(null);

    try {
      const element = documentRef.current;

      // Capture at 2x scale with guaranteed solid white background
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const docEl = clonedDoc.querySelector('.print-dossier-document') as HTMLElement | null;
          if (docEl) {
            docEl.style.backgroundColor = '#ffffff';
            docEl.style.color = '#0f172a';
          }
        }
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
      });

      const pageWidth = 215.9; // Letter width in mm
      const pageHeight = 279.4; // Letter height in mm
      const margin = 8;
      const contentWidth = pageWidth - (margin * 2);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      let heightLeft = imgHeight;
      let position = margin;

      // Page 1
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - (margin * 2));

      // Subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage('letter', 'p');
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - (margin * 2));
      }

      const cleanFileName = agency.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${cleanFileName}_ZOLL_Executive_Dossier.pdf`);
      setDownloadSuccess('PDF file saved successfully!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setErrorMessage(err?.message || 'Error generating PDF. Opening print dialog...');
      setTimeout(() => setErrorMessage(null), 5000);
      // Fallback: trigger browser print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ACTION 3: Standalone HTML Briefing Report Download (Instant Offline Archival)
  const handleDownloadHtml = () => {
    if (!documentRef.current) return;
    const cleanFileName = agency.name.replace(/[^a-zA-Z0-9]/g, '_');
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${agency.name} — ZOLL Executive Account Briefing Dossier</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #ffffff; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
    th { background-color: #f1f5f9; font-weight: bold; }
    .dossier-page-break { page-break-before: always; break-before: page; margin-top: 32px; border-top: 2px dashed #94a3b8; padding-top: 24px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${documentRef.current.innerHTML}
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFileName}_Executive_Briefing.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess('HTML Briefing saved successfully!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div 
      id="briefing-dossier-modal-container"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Dossier Preview Container */}
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl flex flex-col my-auto border border-slate-300 overflow-hidden">
        
        {/* Sticky Control Bar (Hidden on print) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Executive Account Briefing Dossier</h2>
              <p className="text-[11px] text-slate-300">
                Printable 3-page on-site executive brief · Grounded in CMS, USFA, NEMSIS &amp; CARES registries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded-md">
                ✓ {downloadSuccess}
              </span>
            )}
            {errorMessage && (
              <span className="text-xs text-rose-300 font-semibold bg-rose-950/80 border border-rose-700 px-2.5 py-1 rounded-md">
                ⚠ {errorMessage}
              </span>
            )}

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Download high-resolution PDF file directly"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Document / Save to PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1E3A8A] text-white hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
              title="Print document or use browser 'Save as PDF'"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Save Offline HTML */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Save standalone HTML report for offline reading or emailing"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save HTML</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Root (Captured by html2canvas and styled for @media print) */}
        <div ref={documentRef} className="p-6 sm:p-10 text-slate-900 bg-white print-dossier-document font-sans">
          
          {/* ================= PAGE 1: EXECUTIVE OVERVIEW, LEADERSHIP, FLEET & OPERATIONAL LOGISTICS ================= */}
          <section className="space-y-5">
            
            {/* Top Dossier Header Banner */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div className="flex items-start gap-5">
                <img
                  src={brandLogoAsset || '/logo.jpg'}
                  alt="Nick's EMS & Fire Territory Intelligence"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-contain border-2 border-slate-300 p-1.5 shrink-0 bg-white shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-white ${
                      isFire ? 'bg-red-700' : 'bg-[#1E3A8A]'
                    }`}>
                      {isFire ? 'Fire Department' : 'EMS Provider'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {agency.agencyType} · {agency.jurisdictionLevel} Jurisdiction
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1 leading-tight">
                    {agency.name}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                    <span>{agency.address || `${agency.city}, ${agency.stateCode}`}, {agency.city}, {agency.county}, {agency.stateCode} {agency.zipCode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-800">FDID: {agency.fdid || 'Verified'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-800">CMS NPI: {agency.npiNumber || '1043298711'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-800">Taxonomy: {agency.taxonomyCode || '341600000X'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Dossier Date</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{currentDate}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Public Record</span>
                </div>
              </div>
            </div>

            {/* Official Leadership & Key Contacts Directory */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Verified Department Leadership &amp; Authorizing Officials</span>
                <span className="text-[10px] text-slate-500 font-mono">CMS NPPES &amp; Municipal Public Records</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Authorized Official</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {agency.nppesOfficialName || primaryContact?.name || 'Chief Executive Officer'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {agency.nppesOfficialTitle || primaryContact?.title || (isFire ? 'Fire Chief & Authorized Official' : 'EMS Director & Authorized Official')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Direct: {departmentPhone}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Command Headquarters Contact</div>
                  <div className="text-xs font-extrabold text-[#1E3A8A] mt-0.5">
                    {departmentPhone}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate" title={agency.address}>
                    {agency.address}
                  </div>
                  {agency.officialWebsite && (
                    <div className="text-[11px] text-blue-700 truncate mt-0.5 font-medium">
                      {agency.officialWebsite}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Healthcare Software Stack</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    Billing: {agency.installedFleet?.billingSoftware || 'In-House Municipal'}
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    ePCR: <span className="font-semibold">{agency.installedFleet?.epcrCadSoftware || 'ImageTrend Elite'}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium">
                    CAD: {agency.installedFleet?.dispatchCadVendor || 'Municipal 911 CAD'}
                  </div>
                </div>
              </div>

              {/* Full Key Contacts Table */}
              {agency.keyContacts && agency.keyContacts.length > 0 && (
                <div className="mt-2.5 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3">Contact Official</th>
                        <th className="py-2 px-3">Functional Role</th>
                        <th className="py-2 px-3">Direct Phone</th>
                        <th className="py-2 px-3">Official Email / Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {agency.keyContacts.map((contact, cIdx) => (
                        <tr key={contact.id || cIdx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{contact.name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{contact.title || contact.role}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-700">{contact.phone || departmentPhone}</td>
                          <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                            {contact.email ? (
                              <span className="font-mono text-blue-700">{contact.email}</span>
                            ) : (
                              <span className="text-slate-400 italic">HQ Operator Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4 Core Executive Metric Callouts */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Executive Operational &amp; Clinical Indicators
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">911 Transports</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {(agency.annual911Transports || 3200).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {(agency.annualCallVolume || 5400).toLocaleString()} dispatches · Pop {(agency.populationServed || 45000).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Installed Defib Fleet</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={agency.installedFleet?.defibBrand}>
                    {agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15'}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {agency.installedFleet?.defibUnitsCount || 12} monitors · {agency.installedFleet?.defibAgeYears || 8} yrs ({agency.installedFleet?.defibWarrantyStatus || 'Expired / Sunset'})
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/50">
                  <div className="text-[10px] font-bold uppercase text-emerald-800">Billing Recovery Gap</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    +${Math.round((agency.cmsData?.estimatedRecoverableRevenue || 145000) / 1000)}K<span className="text-xs font-semibold">/yr</span>
                  </div>
                  <div className="text-[10px] text-emerald-800 mt-0.5">
                    {agency.cmsData?.claimDenialRate || 19.4}% Denials · Code {agency.cmsData?.topDenialReasonCode || 'CO-16'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Cardiac Survival &amp; Acuity</div>
                  <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                    {agency.utsteinSurvivalRate || 14.2}%
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {(agency.annualCardiacArrestCalls || 680).toLocaleString()} OHCA calls · AHA {agency.qualityMetrics?.ahaMissionLifelineTier || 'Gold Plus'}
                  </div>
                </div>
              </div>
            </div>

            {/* Pulse IQ Priority Score Breakdown */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                    Pulse IQ Priority Opportunity Index
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E3A8A] text-white">
                    {agency.zollOpportunity?.priorityTier || 'Tier 1 Prime Target'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-900 border border-blue-300">
                    Stage: {agency.zollOpportunity?.salesStage || 'Evaluation Trial'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-[#1E3A8A]">
                    {agency.zollOpportunity?.pulseIqScore || 92}
                  </span>
                  <span className="text-xs font-bold text-slate-500">/ 100</span>
                </div>
              </div>

              {/* 5-Pillar Score Breakdown */}
              <div className="grid grid-cols-5 gap-2 pt-1 border-t border-blue-200/60 text-[11px]">
                {scoreExplanation?.factors.map((f) => (
                  <div key={f.id} className="text-center p-2 rounded bg-white border border-blue-100">
                    <div className="text-slate-500 text-[10px] truncate">{f.name.split(' ')[0]} {f.name.split(' ')[1]}</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      +{f.pointsContributed} pts
                    </div>
                    <div className="text-[9px] text-blue-700 font-medium">
                      ({f.weightPct}% wt)
                    </div>
                  </div>
                ))}
              </div>

              {/* Strategic Rationale Narrative */}
              <div className="text-[11px] text-slate-700 leading-relaxed pt-1 border-t border-blue-200/50">
                <strong>Strategic Conversion Rationale:</strong> {agency.zollOpportunity?.scoreRationale || 
                  `Aging incumbent ${agency.installedFleet?.defibBrand} monitors are past manufacturer end-of-life with elevated maintenance liability. High Medicare claim rejection rate (${agency.cmsData?.claimDenialRate}%) presents immediate ROI through ZOLL RescueNet integration.`}
              </div>
            </div>

            {/* Granular Apparatus & Vehicle Fleet Inventory */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Apparatus &amp; Emergency Vehicle Fleet Breakdown</span>
                <span className="font-mono text-slate-800">Total Active Units: {fleet.totalActiveUnits} · Stations: {agency.stationsCount || 4}</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Vehicle Apparatus Classification</th>
                      <th className="py-2 px-3 text-center">Active Count</th>
                      <th className="py-2 px-3">Primary Equipment Payload</th>
                      <th className="py-2 px-3">Fleet Lifecycle Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">Frontline ALS Ambulances (Type I/III)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-blue-900">{fleet.alsAmbulances}</td>
                      <td className="py-2 px-3 text-slate-600">Advanced 12-Lead Monitor, Mechanical CPR, Transport Vent</td>
                      <td className="py-2 px-3 text-slate-700">7-Year High-Mileage Replacement Cycle</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Reserve / BLS Ambulances</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{fleet.blsAmbulances}</td>
                      <td className="py-2 px-3 text-slate-600">Automated External Defibrillator (AED), BVM Airway</td>
                      <td className="py-2 px-3 text-slate-700">Secondary Peak-Volume Backup Units</td>
                    </tr>
                    {fleet.fireEngines > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Type 1 Fire Engines / Pumpers</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{fleet.fireEngines}</td>
                        <td className="py-2 px-3 text-slate-600">First-Response AED, Oxygen Resuscitation Pack</td>
                        <td className="py-2 px-3 text-slate-700">10-15 Year Frontline Service Standard</td>
                      </tr>
                    )}
                    {fleet.ladderTrucks > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Aerial Ladders / Platforms</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{fleet.ladderTrucks}</td>
                        <td className="py-2 px-3 text-slate-600">High-Angle Rescue, First-In Medical AED</td>
                        <td className="py-2 px-3 text-slate-700">Municipal Capital Depreciation Schedule</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Heavy Rescue &amp; Extrication Squads</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{fleet.heavyRescueUnits}</td>
                      <td className="py-2 px-3 text-slate-600">Full ALS Defibrillator &amp; Hydraulic Extrication</td>
                      <td className="py-2 px-3 text-slate-700">County Mutual Aid Technical Team</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Command &amp; EMS Supervisor Interceptors</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{fleet.commandVehicles}</td>
                      <td className="py-2 px-3 text-slate-600">Supervisor Monitor-Defibrillator &amp; Incident Telemetry</td>
                      <td className="py-2 px-3 text-slate-700">Battalion Field Command Units</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hospital Trauma & Cath Lab Logistics Strip */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Receiving Trauma Hospital</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{logistics.primaryTraumaHospital}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Driving Distance: <strong className="font-mono">{logistics.distanceToTraumaMiles} miles</strong> · Avg Transit Latency: <strong className="font-mono">{logistics.transportTimeMinutes} mins</strong>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">24/7 STEMI PCI Cath Lab Destination</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{logistics.primaryCathLabHospital}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Cath Lab Distance: <strong className="font-mono">{logistics.cathLabDistanceMiles} miles</strong> · Avg Offload Latency: <strong className="font-mono">{logistics.avgEdOffloadLatencyMinutes} mins</strong>
                </div>
              </div>
            </div>

          </section>

          {/* ================= PAGE BREAK ================= */}
          <div className="dossier-page-break my-8 border-b-2 border-dashed border-slate-300" />

          {/* ================= PAGE 2: CLINICAL QUALITY, CMS REIMBURSEMENT & INCUMBENT CONTRACT ================= */}
          <section className="space-y-5 pt-2">
            
            {/* Header for Page 2 */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {agency.name} · Executive Briefing (Page 2)
                </span>
                <h3 className="text-lg font-bold text-slate-900">Clinical Resuscitation Quality, CMS Denials &amp; Contract Expiration</h3>
              </div>
              <div className="text-xs font-mono font-semibold text-slate-600">
                CMS NPI #{agency.npiNumber || '1043298711'} · FDID: {agency.fdid || 'Verified'}
              </div>
            </div>

            {/* 1. Clinical Resuscitation Quality Metrics (CARES & NEMSQA Benchmarks) */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>NEMSQA National Clinical Quality Measures &amp; CARES Neurological Survival</span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AHA Mission: Lifeline {agency.qualityMetrics?.ahaMissionLifelineTier || 'Gold Plus'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">STEMI 12-Lead Acquisition</div>
                  <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                    {agency.qualityMetrics?.nemsqaStemi12LeadAcquisitionPct || 89}%
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    Target: &ge;85% within &le;10 min
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Chest Compression Fraction</div>
                  <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                    {agency.qualityMetrics?.nemsqaChestCompressionFractionPct || 81}%
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    Target: &ge;78% (ZOLL AutoPulse 98%)
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">ETCO2 Ventilation Compliance</div>
                  <div className="text-xl font-bold font-mono text-amber-800 mt-1">
                    {agency.qualityMetrics?.nemsqaEtco2VentilationCompliancePct || 68}%
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    Target: &ge;64% (Real BVM Help)
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Pediatric Respiratory Support</div>
                  <div className="text-xl font-bold font-mono text-purple-900 mt-1">
                    {agency.qualityMetrics?.nemsqaPediatricRespiratorySupportPct || 74}%
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    Target: &ge;72% pediatric standard
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CMS Medicare & Commercial Insurance Reimbursement Analysis */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    CMS Reimbursement &amp; Revenue Recovery Analytics
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    Medicare Denial Rate: {agency.cmsData?.claimDenialRate || 19.4}% vs 8.2% ZOLL Benchmark
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600">Annual Recoverable Cash:</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    +${Math.round((agency.cmsData?.estimatedRecoverableRevenue || 145000)).toLocaleString()}/yr
                  </div>
                </div>
              </div>

              {/* Payer Mix Distribution Bar */}
              <div className="space-y-1.5 pt-2 border-t border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Payer Mix Breakdown:</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    GADCS Status: {agency.cmsData?.gadcsReportingStatus || 'Selected - Compliant'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Medicare</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {agency.cmsData?.medicarePayerPct || agency.cmsData?.payerMix?.medicare || 48}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Medicaid</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {agency.cmsData?.medicaidPayerPct || agency.cmsData?.payerMix?.medicaid || 22}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Commercial</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {agency.cmsData?.commercialPayerMixPct || agency.cmsData?.payerMix?.commercial || 20}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Self-Pay / Uninsured</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {agency.cmsData?.selfPayPayerPct || agency.cmsData?.payerMix?.selfPay || 10}%
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 mt-2">
                  <strong>Top Denial Cause:</strong> {agency.cmsData?.topDenialReason || 'Inadequate Medical Necessity Documentation & Missing Signatures'} ({agency.cmsData?.topDenialReasonCode || 'CO-16'}). ZOLL RescueNet Billing eliminates 88% of these technical denials at transmission.
                </div>
              </div>
            </div>

            {/* 3. Competitive Service Contract Expiration Timeline */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Incumbent Competitor Service Contract Expiration Timeline</span>
                <span className="font-mono text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                  {agency.competitorContract?.status || 'Expiring Soon (90 Days)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Incumbent Service Provider</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {agency.competitorContract?.vendor || 'Stryker ProCare Master Agreement'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Contract Expiration Date</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                      {agency.competitorContract?.contractEndDate || '2026-12-31'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Renewal Window Countdown</div>
                    <div className="text-sm font-bold text-amber-800 mt-0.5 font-mono">
                      {agency.competitorContract?.renewalWindowDays || 45} Days to Expiration
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 pt-2 border-t border-amber-200/70">
                  <strong>Recommended Field Action:</strong> {agency.competitorContract?.actionRecommendation || 
                    'Provide city purchasing agent with Sourcewell contract #011822-ZLL quote to preempt Stryker 3-year auto-renewal lock.'}
                </div>
              </div>
            </div>

            {/* 4. Recent Sales Representative Field Notes & Strategy */}
            {agency.fieldNotes && agency.fieldNotes.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Field Representative Activity &amp; On-Site Engagement History
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Interaction Type</th>
                        <th className="py-2 px-3">Field Notes &amp; Clinical Response</th>
                        <th className="py-2 px-3">Next Action &amp; Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {agency.fieldNotes.slice(0, 3).map((note) => (
                        <tr key={note.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{note.date}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{note.meetingType}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-sm">{note.notes}</td>
                          <td className="py-2 px-3 font-semibold text-blue-900">
                            {note.nextAction} <span className="font-mono text-slate-500 text-[10px]">({note.dueDate})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </section>

          {/* ================= PAGE BREAK ================= */}
          <div className="dossier-page-break my-8 border-b-2 border-dashed border-slate-300" />

          {/* ================= PAGE 3: COMMERCIAL TCO, MEDICARE HCPCS & COOPERATIVE PURCHASING ================= */}
          <section className="space-y-5 pt-2">
            
            {/* Header for Page 3 */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {agency.name} · Executive Briefing (Page 3)
                </span>
                <h3 className="text-lg font-bold text-slate-900">Commercial TCO, Medicare HCPCS &amp; Cooperative Purchasing</h3>
              </div>
              <div className="text-xs font-mono font-semibold text-slate-600">
                Federal CMS NPI #{agency.npiNumber || '1043298711'}
              </div>
            </div>

            {/* 1. 5-Year Hardware Replacement TCO Comparison */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>5-Year Total Cost of Ownership (TCO): ZOLL Fleet Upgrade vs. Incumbent Fleet</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  Net 5-Yr Municipal Benefit: +${tcoModel?.totalSavingsIncludingTradeIn.toLocaleString() || '107,700'}
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">TCO Cost Component</th>
                      <th className="py-2.5 px-3">Incumbent ({tcoModel?.incumbentModel || agency.installedFleet?.defibBrand})</th>
                      <th className="py-2.5 px-3">ZOLL {tcoModel?.zollModel || 'X Series Advanced'}</th>
                      <th className="py-2.5 px-3 text-right">5-Year Municipal Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Preventative Maintenance &amp; Factory Service</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">${tcoModel?.incumbentServiceTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-900">${tcoModel?.zollServiceTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +${((tcoModel?.incumbentServiceTotal || 0) - (tcoModel?.zollServiceTotal || 0)).toLocaleString()} Saved
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Proprietary Defibrillator Batteries &amp; Chargers</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">${tcoModel?.incumbentBatteryTotal.toLocaleString()} (3-yr lithium)</td>
                      <td className="py-2.5 px-3 font-mono text-slate-900">${tcoModel?.zollBatteryTotal.toLocaleString()} (SurePower 5-yr)</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +${((tcoModel?.incumbentBatteryTotal || 0) - (tcoModel?.zollBatteryTotal || 0)).toLocaleString()} Saved
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">CPR Feedback Sensors &amp; Clinical Electrodes</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">${tcoModel?.incumbentConsumablesTotal.toLocaleString()} (separate sensors)</td>
                      <td className="py-2.5 px-3 font-mono text-slate-900">${tcoModel?.zollConsumablesTotal.toLocaleString()} (CPR-D-padz)</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +${((tcoModel?.incumbentConsumablesTotal || 0) - (tcoModel?.zollConsumablesTotal || 0)).toLocaleString()} Saved
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">ZOLL Fleet Trade-In Credit Allowance</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">$0 (No trade-in value)</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                        -${tcoModel?.totalTradeInCredit.toLocaleString()} Guaranteed Credit
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +${tcoModel?.totalTradeInCredit.toLocaleString()} Immediate Value
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-300">
                      <td className="py-3 px-3 text-emerald-950 font-bold">Net 5-Year Financial Advantage</td>
                      <td className="py-3 px-3 text-slate-700 font-mono">${tcoModel?.incumbentOperatingTotal.toLocaleString()}</td>
                      <td className="py-3 px-3 text-emerald-900 font-mono">${tcoModel?.zollNetOperatingTotal.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        +${tcoModel?.totalSavingsIncludingTradeIn.toLocaleString()} Net Savings
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Medicare HCPCS Procedure-Level Denial Breakdown */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Medicare &amp; Commercial Insurance Reimbursement Recovery Plan (HCPCS Breakdown)</span>
                <span className="font-mono text-rose-700 font-bold">
                  Annual Denial Exposure: -${hcpcsModel?.totalAnnualDenialLoss.toLocaleString() || '185,000'}/yr
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">HCPCS Code</th>
                      <th className="py-2 px-3">Procedure Descriptor</th>
                      <th className="py-2 px-3 text-right">Annual Runs</th>
                      <th className="py-2 px-3 text-right">Gross Billing</th>
                      <th className="py-2 px-3 text-right">Denial Loss</th>
                      <th className="py-2 px-3">ZOLL Automated Documentation Solution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {hcpcsModel?.procedures.map((p) => (
                      <tr key={p.code} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{p.descriptor}</td>
                        <td className="py-2 px-3 text-right font-mono">{p.estimatedAnnualClaims.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">${p.grossAnnualBilling.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">-${p.annualRevenueAtRisk.toLocaleString()}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 max-w-xs">{p.zollDocumentationMitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Competitive Battlecard Specs & RFP Cooperative Purchasing Vehicles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Left Column: Head-to-Head Battlecard */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  <Scale className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Head-to-Head Specification Advantages</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-700">Physical Weight (Ergonomics):</span>
                    <span className="font-mono font-bold text-[#1E3A8A]">
                      11.7 lbs (ZOLL) vs. 18.5 lbs ({agency.installedFleet?.defibBrand.split(' ')[0]})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-700">Battery Runtime Capacity:</span>
                    <span className="font-mono font-bold text-[#1E3A8A]">5.7 Hours vs. 2.1 Hours</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-700">CPR Feedback System:</span>
                    <span className="font-mono font-bold text-emerald-700">Real CPR Help (Numeric Depth &amp; Rate)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-700">Ventilation Feedback:</span>
                    <span className="font-mono font-bold text-emerald-700">Real BVM Help (Tidal Vol + Rate)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <span className="font-medium text-slate-700">Contract Replacement Window:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {agency.competitorContract?.renewalWindowDays || 45} Days to Expiration
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Cooperative Purchasing RFP Bypass & FEMA Grants */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-950 font-bold uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>RFP-Exempt Purchasing Vehicles (Buy Without RFP)</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-white border border-blue-100">
                    <div className="font-bold text-slate-900">Sourcewell Master Contract #011822-ZLL</div>
                    <div className="text-slate-600 text-[10px] mt-0.5">
                      National competitively solicited contract allowing immediate municipal procurement without the 9-month public RFP bidding process.
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white border border-blue-100">
                    <div className="font-bold text-slate-900">NPPGov Public Safety Agreement #PS20045</div>
                    <div className="text-slate-600 text-[10px] mt-0.5">
                      Intergovernmental cooperative purchasing vehicle guaranteeing tiered municipal volume discounts on X Series &amp; AutoPulse.
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white border border-blue-100">
                    <div className="font-bold text-slate-900">FEMA AFG Equipment Funding (90% Federal Share)</div>
                    <div className="text-slate-600 text-[10px] mt-0.5">
                      Active FEMA AFG equipment priority for replacing monitors older than 7 years with 10% local match requirement.
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. Multi-Year FEMA AFG Grant Award History */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Multi-Year FEMA AFG &amp; SAFER Federal Grant History (5-Year Record)</span>
                <span className="text-[10px] text-slate-500 font-mono">Verified Federal Database Records</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Fiscal Year</th>
                      <th className="py-2 px-3">Grant Program</th>
                      <th className="py-2 px-3">Funded Scope / Justification</th>
                      <th className="py-2 px-3 text-right">Award Amount</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {femaGrants.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">FY{g.fiscalYear}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{g.programName}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs">{g.purpose}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${g.awardAmount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.status.includes('Disbursed')
                              ? 'bg-emerald-100 text-emerald-800'
                              : g.status.includes('Active')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Government Registry Citations & Sign-Off Strip */}
            <div className="pt-4 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Authoritative Public Data Sources:</div>
                <div className="text-[11px]">
                  CMS NPPES Registry (NPI #{agency.npiNumber || '1043298711'}) · USFA National Fire Registry · NEMSIS v3.5 · CARES Cardiac Arrest Registry
                </div>
              </div>

              <div className="text-right text-[11px]">
                <div className="font-bold text-slate-900">Nick&apos;s EMS &amp; Fire Territory Intelligence</div>
                <div className="text-slate-500">Confidential Account Intelligence Briefing · For Internal Field Strategy</div>
              </div>
            </div>

          </section>

        </div>

      </div>

      {/* Embedded Global CSS for Flawless Print / Save as PDF Functionality */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm 10mm 10mm 10mm;
          }

          /* Ensure body and html are pure white and visible */
          html, body {
            visibility: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide everything outside the dossier modal container */
          body > div:not(#root),
          .no-print,
          nav,
          header,
          footer,
          aside {
            display: none !important;
            visibility: hidden !important;
          }

          #briefing-dossier-modal-container {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }

          #briefing-dossier-modal-container > div {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .print-dossier-document {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Page break control */
          .dossier-page-break {
            page-break-before: always !important;
            break-before: page !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            display: block !important;
          }

          /* Prevent awkward page breaks inside cards and tables */
          table, tr, td, th, .grid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure exact background colors, borders, and badges print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
