/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency, FieldNote } from '../../types';
import { 
  X, 
  Phone, 
  MapPin, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  Printer, 
  Send, 
  Building2, 
  UserCheck, 
  Truck, 
  ShieldCheck, 
  Flame, 
  HeartPulse,
  Download,
  FileText
} from 'lucide-react';

interface PreVisitBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
}

export const PreVisitBriefModal: React.FC<PreVisitBriefModalProps> = ({
  isOpen,
  onClose,
  agency,
  onAddFieldNote
}) => {
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState('');
  const [isNoteSubmitted, setIsNoteSubmitted] = useState(false);

  if (!isOpen) return null;

  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
  const chiefContact = agency.keyContacts?.find(c => 
    c.title.toLowerCase().includes('chief') || 
    c.role.toLowerCase().includes('chief') || 
    c.role.toLowerCase().includes('executive')
  ) || agency.keyContacts?.[0];

  const medicalDirector = agency.keyContacts?.find(c => 
    c.title.toLowerCase().includes('medical director') || 
    c.role.toLowerCase().includes('medical director') || 
    c.name.toLowerCase().includes('md')
  ) || {
    name: 'Office of Medical Direction',
    title: 'Operational Medical Direction',
    role: 'Medical Director',
    phone: agency.headquartersPhone || 'Station Headquarters',
    email: agency.keyContacts?.[0]?.email || 'Refer to Station Directory'
  };

  const doctorGreeting = medicalDirector.name.startsWith('Dr.')
    ? medicalDirector.name
    : medicalDirector.name === 'Office of Medical Direction'
      ? 'Doctor / Medical Director'
      : `Dr. ${medicalDirector.name.split(' ').slice(-1)[0]}`;

  const defibBrand = agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';
  const defibUnits = agency.installedFleet?.defibUnitsCount || Math.max(4, agency.totalAmbulances);
  const defibAge = agency.installedFleet?.defibAgeYears || 7.8;
  const warranty = agency.installedFleet?.defibWarrantyStatus || 'Expired OEM Warranty';
  const contractEndDate = agency.competitorContract?.contractEndDate || '2026-09-30';
  const renewalWindowDays = agency.competitorContract?.renewalWindowDays || 120;
  const denialRate = agency.cmsData?.claimDenialRate || 18.4;
  const denialCode = agency.cmsData?.topDenialReasonCode || 'CO-16';

  const discoveryQuestions = [
    {
      topic: 'Defibrillator Fleet Age & Service Cost',
      question: `Chief, with your ${defibUnits}× ${defibBrand} units currently at ${defibAge} years (${warranty}), how significantly have your annual biomedical maintenance contract renewals and replacement battery costs escalated this budget cycle?`
    },
    {
      topic: 'Real-Time Ventilation Compliance (Real BVM Help®)',
      question: `${doctorGreeting}, in your annual resuscitation reviews, how does the department currently audit paramedic ventilation volume and breath rate during CPR to prevent the hyperventilation cerebral vasoconstriction documented in AHA protocols?`
    },
    {
      topic: 'Procurement Bypass & Trade-In Value',
      question: `Are you aware that through pre-competed Sourcewell (#041823-ZOL) and HGACBuy, you can bypass the 9-month sealed competitive RFP process while locking in $3,500+ per-unit trade-in credits for your retiring ${defibBrand} fleet?`
    }
  ];

  const quickInteractionOutcomes = [
    'Station Visit: Met with leadership at headquarters station',
    'Clinical Briefing: Discussed resuscitation and cardiac transport protocols',
    'Biomed Check: Inspected monitor fleet age and battery rotation cycle',
    'Procurement Review: Presented Sourcewell cooperative contract memo'
  ];

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const handleCopyAllBrief = () => {
    const briefText = `PRE-VISIT FIELD CHEAT SHEET: ${agency.name}
Location: ${agency.address}, ${agency.city}, ${agency.stateCode}
Stations: ${agency.stationsCount} | Ambulances: ${agency.totalAmbulances} | Engines: ${agency.totalFireEngines}
NPI: ${agency.npiNumber || 'Registered'} | PulseIQ Score: ${agency.zollOpportunity.pulseIqScore}/100

COMMAND & LEADERSHIP:
- Department Head: ${chiefContact?.name || 'Chief Command Officer'} (${chiefContact?.title || 'Fire / EMS Chief'}) - ${chiefContact?.phone || agency.headquartersPhone || 'Station Headquarters'}
- Clinical Oversight: ${medicalDirector.name} (${medicalDirector.title}) - ${medicalDirector.email}

CURRENT FLEET FOOTPRINT:
- Active Defibrillators: ${defibUnits}x ${defibBrand} (Avg Age: ${defibAge} yrs, ${warranty})
- Contract Expiration: ${contractEndDate} (${renewalWindowDays}-day renewal window)
- CAD / ePCR: ${agency.installedFleet?.epcrCadSoftware || agency.installedFleet?.dispatchCadVendor || 'ImageTrend Elite'}
- Primary Cath Lab: ${agency.hospitalLogistics?.primaryCathLabHospital || 'Regional Medical Center'} (${agency.hospitalLogistics?.cathLabTransportMinutes || 11} min transit)

PRIORITY DISCOVERY QUESTIONS:
1. ${discoveryQuestions[0].question}
2. ${discoveryQuestions[1].question}
3. ${discoveryQuestions[2].question}

COOPERATIVE CONTRACTS:
- Sourcewell Contract #041823-ZOL (EMS & Rescue Equipment)
- HGACBuy Contract #EE08-24
- Guaranteed Trade-in Allowance: $3,500/unit`;

    navigator.clipboard.writeText(briefText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleQuickLog = (outcome: string) => {
    onAddFieldNote(agency.id, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Specialist',
      meetingType: 'On-site Station Briefing',
      notes: outcome,
      nextAction: 'Provide Sourcewell procurement memo and schedule clinical ventilation evaluation',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setIsNoteSubmitted(true);
    setTimeout(() => setIsNoteSubmitted(false), 3000);
  };

  const handleCustomNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;
    onAddFieldNote(agency.id, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Specialist',
      meetingType: 'Field Interaction',
      notes: customNote.trim(),
      nextAction: 'Follow up on discussion items',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setCustomNote('');
    setIsNoteSubmitted(true);
    setTimeout(() => setIsNoteSubmitted(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Print Specific CSS Sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #station-pocket-brief-printable, #station-pocket-brief-printable * {
            visibility: visible !important;
          }
          #station-pocket-brief-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="station-pocket-brief-printable"
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#111C2D] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-[#0B1728] via-[#14283F] to-[#1E3A8A] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold text-blue-300">
              <Sparkles className="w-3 h-3" />
              <span>3-Minute Station Briefing Cheat Sheet</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 text-white flex items-center gap-2">
              {isFire ? <Flame className="w-5 h-5 text-amber-300 shrink-0" /> : <HeartPulse className="w-5 h-5 text-emerald-300 shrink-0" />}
              <span>{agency.name}</span>
            </h2>
            <div className="text-xs text-blue-100 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span>{agency.city}, {agency.stateCode}</span>
              <span>·</span>
              <span>{agency.stationsCount} Stations</span>
              <span>·</span>
              <span>{agency.totalAmbulances} ALS Ambulances</span>
              <span>·</span>
              <span className="font-mono">PulseIQ Score: {agency.zollOpportunity.pulseIqScore}/100</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 no-print">
            <button
              type="button"
              onClick={handleCopyAllBrief}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Copy All Brief Text"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Print 1-Page Pocket Brief (PDF Ready)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Contact Strip */}
        <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900/60 px-4 sm:px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
            HQ: <span className="font-semibold">{agency.address}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 no-print">
            {(chiefContact?.phone || agency.headquartersPhone) && (
              <a
                href={`tel:${(chiefContact?.phone || agency.headquartersPhone || '').replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
              >
                <Phone className="w-3 h-3" />
                <span>Call HQ</span>
              </a>
            )}
            <a
              href={agency.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px]"
            >
              <MapPin className="w-3 h-3" />
              <span>Navigate</span>
            </a>
          </div>
        </div>

        {/* Scrollable Pocket Brief Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Success Banner */}
          {isNoteSubmitted && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-semibold no-print">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Field observation saved to Agency Notes!</span>
            </div>
          )}

          {/* SECTION A: WHO TO ASK FOR */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Who To Ask For (Command Roster)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#111C2D] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Department Head</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate">
                  {chiefContact?.name || 'Chief Command Officer'}
                </div>
                <div className="text-slate-600 dark:text-slate-400 truncate">{chiefContact?.title || 'Fire / EMS Chief'}</div>
                <div className="mt-1 text-blue-600 dark:text-blue-400 font-mono font-medium text-[11px]">
                  {chiefContact?.phone || agency.headquartersPhone || 'Station Headquarters'}
                </div>
              </div>

              <div className="bg-white dark:bg-[#111C2D] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Clinical Oversight</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate">
                  {medicalDirector.name}
                </div>
                <div className="text-slate-600 dark:text-slate-400 truncate">{medicalDirector.title}</div>
                <div className="mt-1 text-blue-600 dark:text-blue-400 font-mono font-medium text-[11px] truncate">
                  {medicalDirector.email}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: CURRENT HARDWARE FOOTPRINT & SERVICE CONTRACT */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>2. Hardware Footprint &amp; Vulnerability Hook</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold">
                {warranty}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white dark:bg-[#111C2D] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Current Defibs</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{defibUnits}× {defibBrand.replace('Stryker ', '')}</div>
              </div>
              <div className="bg-white dark:bg-[#111C2D] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Fleet Age</div>
                <div className="font-bold text-sm text-rose-600 dark:text-rose-400 mt-0.5">{defibAge} Years Old</div>
              </div>
              <div className="bg-white dark:bg-[#111C2D] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Contract End</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{contractEndDate}</div>
              </div>
              <div className="bg-white dark:bg-[#111C2D] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Trade-In Value</div>
                <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">${(defibUnits * 3500).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* SECTION C: 3 KEY DISCOVERY QUESTIONS */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. High-Impact Conversation Starters</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Tap icon to copy</span>
            </div>

            {discoveryQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111C2D] p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 relative group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-800 dark:text-blue-300">
                    Q{idx + 1}: {q.topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyQuestion(q.question, idx)}
                    className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer no-print"
                    title="Copy Question"
                  >
                    {copiedQuestionIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed italic text-[11px]">
                  "{q.question}"
                </p>
              </div>
            ))}
          </div>

          {/* SECTION D: CLINICAL DESTINATION & COOPERATIVE CONTRACTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Primary STEMI Cath Lab</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {agency.hospitalLogistics?.primaryCathLabHospital || 'Regional Heart Center'}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {agency.hospitalLogistics?.cathLabTransportMinutes || 11} min transit · STEMI Alert Bypass Enabled
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Pre-Competed Cooperative</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                Sourcewell #041823-ZOL &amp; HGACBuy
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Guaranteed $3,500/unit trade-in credits bypass municipal sealed RFP.
              </div>
            </div>
          </div>

          {/* PRINT-ONLY CLIPBOARD OBSERVATIONS SECTION */}
          <div className="hidden print:block pt-3 border-t border-slate-300">
            <div className="font-bold text-xs uppercase mb-1">Field Observation &amp; Action Notes (Clipboard Lined Area):</div>
            <div className="border border-slate-300 h-28 p-2 rounded">
              <div className="border-b border-dashed border-slate-300 h-7"></div>
              <div className="border-b border-dashed border-slate-300 h-7"></div>
              <div className="border-b border-dashed border-slate-300 h-7"></div>
              <div className="h-7"></div>
            </div>
          </div>

          {/* SECTION E: 1-TAP FIELD NOTE LOGGING (SCREEN ONLY) */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2.5 no-print">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              4. 1-Tap Agency Notes Logger
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickInteractionOutcomes.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLog(chip)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111C2D] border border-blue-300 dark:border-blue-800 hover:border-blue-500 text-slate-800 dark:text-slate-200 font-medium text-[11px] hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer text-left shadow-2xs"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomNoteSubmit} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type quick note (e.g., Met with Deputy Chief, demonstrated Real BVM Help)..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="flex-1 h-9 rounded-lg px-3 bg-white dark:bg-[#111C2D] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!customNote.trim()}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#16243A] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 no-print">
          <span className="text-[11px] text-slate-500">
            NPI #{agency.npiNumber || 'Registered'} · OpenFEMA · CMS Part B PUF Ground Truth
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 1-Page PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
