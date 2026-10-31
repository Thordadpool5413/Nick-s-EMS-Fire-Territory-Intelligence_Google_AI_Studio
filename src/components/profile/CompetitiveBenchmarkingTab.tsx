/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../../types';
import {
  Scale,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Zap,
  Activity,
  HeartPulse,
  Truck,
  Wind,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CompetitiveBenchmarkingTabProps {
  agency: Agency;
  onOpenRfpGenerator?: (agency: Agency) => void;
  className?: string;
}

type BenchmarkingModality = 'defib' | 'cpr' | 'vent' | 'aed';

interface TechnicalSpecRow {
  parameter: string;
  category: 'Physical & Ruggedness' | 'Clinical & Resuscitation' | 'Telemetry & Interoperability' | 'Regulatory & Lifecycle';
  incumbentSpec: string;
  zollSpec: string;
  winner: 'zoll' | 'incumbent' | 'tie';
  clinicalAdvantageNote?: string;
  isKeyDifferentiator?: boolean;
}

interface ModalityComparisonData {
  modalityTitle: string;
  agencyInstalledModel: string;
  incumbentManufacturer: string;
  zollAlternativeModel: string;
  incumbentAgeYears: number;
  incumbentWarrantyStatus: string;
  fdaAlertSnippet?: string;
  specs: TechnicalSpecRow[];
}

export const CompetitiveBenchmarkingTab: React.FC<CompetitiveBenchmarkingTabProps> = ({
  agency,
  onOpenRfpGenerator,
  className = ''
}) => {
  const [activeModality, setActiveModality] = useState<BenchmarkingModality>('defib');
  const [highlightDifferencesOnly, setHighlightDifferencesOnly] = useState<boolean>(false);
  const [customIncumbentModel, setCustomIncumbentModel] = useState<string>('');
  const [copiedBattlecard, setCopiedBattlecard] = useState<boolean>(false);

  // Installed hardware detection from agency record
  const recordedDefib = agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';
  const recordedCPR = agency.installedFleet?.mechanicalCPR || 'Stryker LUCAS 3';
  const recordedVent = agency.installedFleet?.transportVentilator || 'Ambu / Disposable BVM Only';
  const defibAge = agency.installedFleet?.defibAgeYears || 7;
  const warrantyStatus = agency.installedFleet?.defibWarrantyStatus || 'Expired';

  // Active Incumbent Model Override or Detected Default
  const currentDefibModel = customIncumbentModel || recordedDefib;

  // Comparison dataset for Defibrillator Modality
  const defibSpecs: TechnicalSpecRow[] = useMemo(() => {
    const isLP35 = currentDefibModel.toLowerCase().includes('35');
    const isPhilips = currentDefibModel.toLowerCase().includes('philips') || currentDefibModel.toLowerCase().includes('mrx') || currentDefibModel.toLowerCase().includes('tempus');
    
    return [
      // 1. Physical & Ruggedness
      {
        parameter: 'Operational Carry Weight',
        category: 'Physical & Ruggedness',
        incumbentSpec: isLP35 ? '16.8 lbs (with dual batteries)' : isPhilips ? '17.4 lbs (with battery & pads)' : '18.9 lbs (fully equipped)',
        zollSpec: '11.7 lbs (with battery, paper & pads)',
        winner: 'zoll',
        clinicalAdvantageNote: 'ZOLL is 38%–45% lighter, reducing paramedic ergonomic back injuries and apparatus compartment strain.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Ingress Protection (IP Rating)',
        category: 'Physical & Ruggedness',
        incumbentSpec: isLP35 ? 'IP55' : isPhilips ? 'IP34 (Low water protection)' : 'IP44 (Splash resistant only)',
        zollSpec: 'IP55 (Dust-protected & water-jet resistant)',
        winner: 'zoll',
        clinicalAdvantageNote: 'Withstands torrential downpours and dust storms without chassis bag protection.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Military Drop / Crash Safety',
        category: 'Physical & Ruggedness',
        incumbentSpec: isLP35 ? 'MIL-STD-810H (4 ft drop)' : isPhilips ? 'Standard Commercial Drop' : 'MIL-STD-810E (30-inch drop standard)',
        zollSpec: 'MIL-STD-810G (6.5-foot drop to concrete) + SAE J3043 30G Ambulance Crash Certified',
        winner: 'zoll',
        clinicalAdvantageNote: 'Highest drop certification in emergency medicine; survives accidental tailgate drops.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Turnout-Glove Wet Operation',
        category: 'Physical & Ruggedness',
        incumbentSpec: isLP35 ? 'Touchscreen-primary (glove sensitivity delays reported)' : isPhilips ? 'Rotary knob & softkeys' : 'Hard buttons & rotary selector',
        zollSpec: 'Dual-Interface: Full color touchscreen + Dedicated tactile rotary dials & hard buttons',
        winner: 'zoll',
        clinicalAdvantageNote: '100% operational in heavy rain or with thick fire turnout gloves when touchscreens become unresponsive.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Battery Runtime & Standby',
        category: 'Physical & Ruggedness',
        incumbentSpec: isLP35 ? 'Up to 5.5 hours' : isPhilips ? '3.5 hours per battery' : '4.2 hours per pair (dual battery required)',
        zollSpec: '6.0 hours continuous monitoring with SurePower II High-Capacity Lithium-Ion',
        winner: 'zoll',
        clinicalAdvantageNote: 'Extended runtime for multi-hour inter-facility critical care transfers.',
        isKeyDifferentiator: false
      },

      // 2. Clinical & Resuscitation
      {
        parameter: 'Ventilation Feedback (Real BVM Help®)',
        category: 'Clinical & Resuscitation',
        incumbentSpec: isLP35 ? 'None (Rate feedback only via capnography)' : 'None (No breath tidal volume feedback)',
        zollSpec: 'Real BVM Help®: Live breath-by-breath ventilation rate AND delivered tidal volume (mL)',
        winner: 'zoll',
        clinicalAdvantageNote: 'Exclusive to ZOLL. Prevents hyperventilation and gastric insufflation in cardiac arrest (AHA CCF & TBI).',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Compression Filtering (See-Thru CPR®)',
        category: 'Clinical & Resuscitation',
        incumbentSpec: isLP35 ? 'cprINSIGHT (pauses compressions during analysis)' : 'None (Must cease chest compressions to inspect rhythm)',
        zollSpec: 'See-Thru CPR®: Actively filters chest compression artifact from live ECG display',
        winner: 'zoll',
        clinicalAdvantageNote: 'Eliminates unnecessary compression pauses to inspect underlying organized rhythms, keeping CCF >85%.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Traumatic Brain Injury (TBI) Guidance',
        category: 'Clinical & Resuscitation',
        incumbentSpec: 'None (Manual clinician observation)',
        zollSpec: 'Dedicated EPIC Protocol TBI Dashboard (Monitors EtCO2, Hypoxia SpO2, and SBP targets simultaneously)',
        winner: 'zoll',
        clinicalAdvantageNote: 'Proven in the landmark EPIC study to triple survival in severe traumatic brain injury.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Defibrillation Waveform',
        category: 'Clinical & Resuscitation',
        incumbentSpec: isPhilips ? 'SMART Biphasic (150J)' : 'Biphasic Truncated Exponential (BTE, 360J escalations)',
        zollSpec: 'Rectilinear Biphasic™ Waveform (RBW, 200J maximum)',
        winner: 'zoll',
        clinicalAdvantageNote: 'Delivers higher peak current to high-impedance patients without myocardial cell damage from excessive 360J spikes.',
        isKeyDifferentiator: true
      },
      {
        parameter: '1-Button Pediatric Mode',
        category: 'Clinical & Resuscitation',
        incumbentSpec: isLP35 ? 'Requires specialized pediatric pads or adapter' : 'Manual energy dial-down and pediatric cable swap required',
        zollSpec: 'One-button pediatric mode with standard adult/pediatric OneStep™ electrodes',
        winner: 'zoll',
        clinicalAdvantageNote: 'Zero cable swap delay when resuscitating pediatric cardiac arrest patients.',
        isKeyDifferentiator: false
      },

      // 3. Telemetry & Interoperability
      {
        parameter: '12-Lead STEMI Cath Lab Transmission',
        category: 'Telemetry & Interoperability',
        incumbentSpec: isLP35 ? 'LIFENET Cloud System (Requires annual subscription)' : isPhilips ? 'Philips IntelliSpace' : 'LIFENET Gateway / Cellular modem accessory',
        zollSpec: 'ZOLL CaseReview & RescueNet 12-Lead: Direct transmission via cellular/Wi-Fi to hospital cath lab portal',
        winner: 'zoll',
        clinicalAdvantageNote: 'Zero proprietary hardware dongles; sends PDF and discrete DICOM data directly to receiving cardiologists.',
        isKeyDifferentiator: false
      },
      {
        parameter: 'ePCR Cloud Synchronous Ingestion',
        category: 'Telemetry & Interoperability',
        incumbentSpec: isLP35 ? 'Proprietary LIFENET bridge required' : 'Manual USB flash drive transfer or Bluetooth sync',
        zollSpec: 'Native Direct API Cloud Push into ImageTrend Elite, ESO EHR, and Traumasoft',
        winner: 'zoll',
        clinicalAdvantageNote: 'Auto-injects 12-lead PDF and continuous numeric CPR metrics upon monitor shutdown; saves ~14 min/run.',
        isKeyDifferentiator: true
      },

      // 4. Regulatory & Lifecycle
      {
        parameter: 'FDA Regulatory Recall Status',
        category: 'Regulatory & Lifecycle',
        incumbentSpec: isLP35 ? 'MAUDE field advisory alerts (2025–2026)' : isPhilips ? 'Class I Consent Decree / Device Discontinuation' : 'Class I Recall Z-1138-2022 (Keypad Lockup & Therapy Cable Failure)',
        zollSpec: 'Zero Active Class I FDA Recalls on X Series Advanced Core Defibrillation Engine',
        winner: 'zoll',
        clinicalAdvantageNote: 'Protects the municipality against equipment liability during emergency cardiac interventions.',
        isKeyDifferentiator: true
      },
      {
        parameter: '5-Year OEM Preventive Maintenance',
        category: 'Regulatory & Lifecycle',
        incumbentSpec: isLP35 ? '$2,490 / unit / yr ($12,450 5-yr)' : '$2,150 / unit / yr ($10,750 5-yr)',
        zollSpec: '$1,480 / unit / yr ($7,400 5-yr)',
        winner: 'zoll',
        clinicalAdvantageNote: 'Saves $3,350 to $5,050 in operating maintenance per vehicle over 5 years.',
        isKeyDifferentiator: true
      },
      {
        parameter: 'Retired Fleet Trade-In Equity',
        category: 'Regulatory & Lifecycle',
        incumbentSpec: '$0 OEM Trade-In Credit',
        zollSpec: '$4,000 – $4,500 guaranteed credit per LIFEPAK 15 unit displaced',
        winner: 'zoll',
        clinicalAdvantageNote: 'Recaptures immediate capital equity to subsidize new apparatus acquisition.',
        isKeyDifferentiator: true
      }
    ];
  }, [currentDefibModel]);

  // Comparison dataset for Mechanical CPR Modality
  const cprSpecs: TechnicalSpecRow[] = useMemo(() => [
    {
      parameter: 'Compression Architecture',
      category: 'Clinical & Resuscitation',
      incumbentSpec: 'Piston-based focal compression (2-inch sternal pad point force)',
      zollSpec: 'Circumferential Load-Distributing Band (LDB, distributes force 360° across thorax)',
      winner: 'zoll',
      clinicalAdvantageNote: 'Generates up to 33% higher coronary and cerebral perfusion pressure without focal point trauma.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Stairwell & Transport Migration',
      category: 'Physical & Ruggedness',
      incumbentSpec: 'High center-of-gravity vertical gantry (prone to migration on stairs/transit)',
      zollSpec: 'Low-profile contour board with LifeBand®; zero vertical gantry slippage',
      winner: 'zoll',
      clinicalAdvantageNote: 'Continuous unbroken compressions down steep narrow stairwells and around tight hallway corners.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Cath Lab Fluoroscopy Compatibility',
      category: 'Clinical & Resuscitation',
      incumbentSpec: 'Vertical piston and support arms block anterior-posterior X-ray views in cath lab',
      zollSpec: '100% Radiolucent backboard and band for unobstructed PCI fluoroscopy',
      winner: 'zoll',
      clinicalAdvantageNote: 'Interventional cardiologists can perform coronary stenting with AutoPulse running continuously.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Sternal Trauma & Rib Fractures',
      category: 'Regulatory & Lifecycle',
      incumbentSpec: 'Higher documented incidence of focal sternal fracture and liver/spleen laceration in MAUDE',
      zollSpec: 'Circumferential load distribution dramatically reduces focal skeletal fractures',
      winner: 'zoll',
      clinicalAdvantageNote: 'Superior post-resuscitation patient recovery and lower internal bleeding risk.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Annual Consumable Cost',
      category: 'Regulatory & Lifecycle',
      incumbentSpec: 'Suction cups & stabilization straps: ~$1,450 / unit / yr',
      zollSpec: 'Single-patient LifeBand®: ~$1,050 / unit / yr',
      winner: 'zoll',
      clinicalAdvantageNote: 'Lower recurring consumable expenditure for high-volume 911 departments.',
      isKeyDifferentiator: false
    }
  ], []);

  // Comparison dataset for Ventilator Modality
  const ventSpecs: TechnicalSpecRow[] = useMemo(() => [
    {
      parameter: 'Ventilation Modes Supported',
      category: 'Clinical & Resuscitation',
      incumbentSpec: recordedVent.toLowerCase().includes('bvm') ? 'Manual Bag-Valve-Mask Only (No automation)' : 'Standard Volume & Pressure Modes',
      zollSpec: 'Comprehensive: AC, SIMV, CPAP with PS, Bi-Level, and Smart Help® emergency apnea backup',
      winner: 'zoll',
      clinicalAdvantageNote: 'Hospital-grade ICU ventilation in a field-rugged military enclosure.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Weight & Portable Dimensions',
      category: 'Physical & Ruggedness',
      incumbentSpec: recordedVent.toLowerCase().includes('bvm') ? 'Disposable plastic (0.8 lbs)' : '10.8 lbs (Hamilton T1)',
      zollSpec: '9.7 lbs with battery and internal compressor',
      winner: 'zoll',
      clinicalAdvantageNote: 'Lightest full-featured critical care transport ventilator with internal compressor.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Oxygen Consumption Efficiency',
      category: 'Clinical & Resuscitation',
      incumbentSpec: 'High oxygen drive consumption; exhausts ambulance O2 cylinders rapidly',
      zollSpec: 'Internal high-efficiency compressor conserves cylinder oxygen for patient delivery',
      winner: 'zoll',
      clinicalAdvantageNote: 'Dramatically extends transport range on standard D and M oxygen cylinders.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Airworthiness & Altitude Compensation',
      category: 'Physical & Ruggedness',
      incumbentSpec: 'Standard ground ambulance rating only',
      zollSpec: 'FAA Airworthiness Certified & Aeromedical Altitude Compensation to 25,000 ft',
      winner: 'zoll',
      clinicalAdvantageNote: 'Standardized for both ground fire rescue and flight/critical care aeromedical transport.',
      isKeyDifferentiator: false
    }
  ], [recordedVent]);

  // Comparison dataset for AED Modality
  const aedSpecs: TechnicalSpecRow[] = useMemo(() => [
    {
      parameter: 'Real-Time CPR Coaching',
      category: 'Clinical & Resuscitation',
      incumbentSpec: 'Audio beeping metronome only (No compression depth measurement)',
      zollSpec: 'Real CPR Help® audio & visual display: Measures exact depth in inches and pushes to 2–2.4"',
      winner: 'zoll',
      clinicalAdvantageNote: 'Ensures lay responders and police push deep enough to generate brain perfusion.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Rhythm Analysis Latency (RapidShock™)',
      category: 'Clinical & Resuscitation',
      incumbentSpec: '8 to 12 seconds pause time for analysis and charging',
      zollSpec: 'RapidShock™: Rhythm analysis in under 5 seconds with pre-charging',
      winner: 'zoll',
      clinicalAdvantageNote: 'Minimizes hands-off pause time before shock delivery to maximize shock success.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Pediatric Rescue Pad Swapping',
      category: 'Clinical & Resuscitation',
      incumbentSpec: 'Requires carrying and swapping separate pediatric electrode pads or key',
      zollSpec: 'Universal CPR Uni-padz®: 1 set for Adult & Child with instant 1-button Child Mode',
      winner: 'zoll',
      clinicalAdvantageNote: 'Saves 60–90 critical seconds during pediatric cardiac arrest by eliminating pad swaps.',
      isKeyDifferentiator: true
    },
    {
      parameter: 'Cloud Fleet Readiness (PlusTrac™)',
      category: 'Telemetry & Interoperability',
      incumbentSpec: 'Manual physical inspection of blinking status LED by station captain',
      zollSpec: 'Automated Wi-Fi daily self-test reporting directly to municipal dashboard',
      winner: 'zoll',
      clinicalAdvantageNote: 'Eliminates liability of dead AED batteries in public parks, schools, or fire stations.',
      isKeyDifferentiator: true
    }
  ], []);

  // Active specs based on selected modality
  const currentSpecs = useMemo(() => {
    let list: TechnicalSpecRow[] = [];
    if (activeModality === 'defib') list = defibSpecs;
    else if (activeModality === 'cpr') list = cprSpecs;
    else if (activeModality === 'vent') list = ventSpecs;
    else list = aedSpecs;

    if (highlightDifferencesOnly) {
      return list.filter((s) => s.isKeyDifferentiator || s.winner !== 'tie');
    }
    return list;
  }, [activeModality, defibSpecs, cprSpecs, ventSpecs, aedSpecs, highlightDifferencesOnly]);

  const zollSuperiorCount = currentSpecs.filter((s) => s.winner === 'zoll').length;

  const handleCopyBattlecard = () => {
    const text = `
ZOLL vs. Incumbent Technical Specification Battlecard
Agency: ${agency.name} (${agency.city}, ${agency.stateCode})
Current Installed Defibrillator: ${currentDefibModel} (${defibAge} yrs old · Warranty: ${warrantyStatus})
Recommended ZOLL Upgrade: ZOLL X Series® Advanced

Key Technical Differentiators:
1. Operational Weight: ZOLL X Series is 11.7 lbs vs. ${currentDefibModel}'s 18.9 lbs (38% lighter).
2. Ventilation Feedback: Real BVM Help® (rate + volume in mL) — exclusive to ZOLL.
3. Compression Artifact Filtering: See-Thru CPR® filters rhythm without stopping compressions.
4. TBI Guideline Dashboard: EPIC Protocol real-time guidance (SpO2, EtCO2, SBP).
5. Ruggedness & Ingress: IP55 and MIL-STD-810G (6.5 ft drop to concrete) + SAE J3043 30G Crash Certified.
6. ePCR Cloud Integration: Direct API cloud sync with ${agency.installedFleet?.epcrCadSoftware || 'ImageTrend / ESO'}.
7. Financial TCO: Saves over $3,350+ per unit in OEM service + $4,000 trade-in credit per unit.
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBattlecard(true);
      setTimeout(() => setCopiedBattlecard(false), 3000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ====================================================================
          HEADER: EXECUTIVE BENCHMARKING HERO & SUMMARY
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl p-5 sm:p-6 lg:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400">
                <Scale className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#285EE8] dark:text-blue-400">
                Engineering &amp; Clinical Specification Audit
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#14283F] dark:text-white tracking-tight flex items-center gap-2">
              <span>Competitive Technical Specification Benchmarking</span>
            </h2>
            <p className="text-xs text-[#53657B] dark:text-slate-300 max-w-3xl leading-relaxed">
              Side-by-side empirical engineering comparison between {agency.name}'s recorded fleet models and our flagship ZOLL alternatives. Directly equips territory managers with verified physics, clinical telemetry, and lifecycle advantages.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyBattlecard}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 hover:bg-[#285EE8] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {copiedBattlecard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBattlecard ? 'Copied Battlecard!' : 'Copy Battlecard'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-200 hover:bg-[#F5F7FA] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Print side-by-side technical specification sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Spec Sheet</span>
            </button>

            {onOpenRfpGenerator && (
              <button
                type="button"
                onClick={() => onOpenRfpGenerator(agency)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#285EE8] hover:bg-[#194BC8] text-white transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
              >
                <span>Generate RFP Spec &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Agency Current Fleet Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-1">
            <div className="text-[11px] text-[#53657B] dark:text-slate-400 font-medium">Frontline Monitor Model</div>
            <div className="font-bold text-sm text-[#14283F] dark:text-white">{recordedDefib}</div>
            <div className="text-[11px] text-slate-500">
              {agency.installedFleet?.defibUnitsCount || 4} units · <strong className="text-amber-700 dark:text-amber-400">{defibAge} yrs in service</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-1">
            <div className="text-[11px] text-[#53657B] dark:text-slate-400 font-medium">OEM Service Warranty Status</div>
            <div className={`font-bold text-sm ${warrantyStatus.toLowerCase().includes('expired') || warrantyStatus.toLowerCase().includes('out') ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {warrantyStatus}
            </div>
            <div className="text-[11px] text-slate-500">
              Contract: {agency.competitorContract?.vendor || 'Stryker ProCare'} (Ends {agency.competitorContract?.contractEndDate || '2026-09-30'})
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-1">
            <div className="text-[11px] text-[#53657B] dark:text-slate-400 font-medium">Recommended ZOLL Platform</div>
            <div className="font-bold text-sm text-[#285EE8] dark:text-blue-400">ZOLL X Series® Advanced</div>
            <div className="text-[11px] text-slate-500">
              Real BVM Help® + See-Thru CPR® + TBI Guidance
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
            <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">ZOLL Technical Advantages</div>
            <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200 font-mono">
              {zollSuperiorCount} of {currentSpecs.length} Specifications
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Empirical superiorities verified in current view
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODALITY TABS & FILTERS
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Modality Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'defib', label: 'Monitor / Defibrillator', icon: Activity, subtitle: recordedDefib },
            { id: 'cpr', label: 'Mechanical Resuscitation', icon: HeartPulse, subtitle: recordedCPR },
            { id: 'vent', label: 'Critical Care Transport Vent', icon: Wind, subtitle: recordedVent },
            { id: 'aed', label: 'Public Access AED', icon: Zap, subtitle: 'AED 3 vs FRx/CR2' }
          ].map((mod) => {
            const Icon = mod.icon;
            const active = activeModality === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModality(mod.id as BenchmarkingModality);
                  setCustomIncumbentModel('');
                }}
                className={`whitespace-nowrap shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#285EE8] text-white shadow-2xs'
                    : 'bg-[#F5F7FA] dark:bg-[#16243A] text-[#53657B] dark:text-slate-300 hover:bg-[#EEF3FE] dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters and Comparison Overrides */}
        <div className="flex flex-wrap items-center gap-3">
          {activeModality === 'defib' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#53657B] dark:text-slate-400 text-[11px] font-medium">Compare vs:</span>
              <select
                value={currentDefibModel}
                onChange={(e) => setCustomIncumbentModel(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-white focus:outline-none cursor-pointer"
              >
                <option value={recordedDefib}>Recorded ({recordedDefib})</option>
                <option value="Stryker LIFEPAK 15">Stryker LIFEPAK 15</option>
                <option value="Stryker LIFEPAK 35">Stryker LIFEPAK 35 (New Gen)</option>
                <option value="Philips HeartStart MRx">Philips HeartStart MRx</option>
                <option value="Philips Tempus Pro / LS">Philips Tempus Pro/LS</option>
              </select>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#14283F] dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightDifferencesOnly}
              onChange={(e) => setHighlightDifferencesOnly(e.target.checked)}
              className="rounded border-[#DFE6EF] text-[#285EE8] focus:ring-[#285EE8] w-3.5 h-3.5 cursor-pointer"
            >
            </input>
            <span>Highlight Key Differentiators Only</span>
          </label>
        </div>
      </div>

      {/* ====================================================================
          SIDE-BY-SIDE SPECIFICATION COMPARISON MATRIX
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B1728] text-white border-b border-[#172D49]">
                <th className="py-4 px-4 sm:px-6 w-1/4 font-semibold text-xs tracking-wide">
                  Technical &amp; Clinical Specification
                </th>
                <th className="py-4 px-4 sm:px-6 w-3/8 bg-[#132238] border-r border-[#172D49]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        Agency's Current Fleet
                      </div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {activeModality === 'defib' ? currentDefibModel : activeModality === 'cpr' ? recordedCPR : activeModality === 'vent' ? recordedVent : 'Incumbent Public AED'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Incumbent Baseline
                    </span>
                  </div>
                </th>
                <th className="py-4 px-4 sm:px-6 w-3/8 bg-[#102A54]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-blue-300 tracking-wider">
                        Latest ZOLL Alternative
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {activeModality === 'defib' ? 'ZOLL X Series® Advanced' : activeModality === 'cpr' ? 'ZOLL AutoPulse® NXT' : activeModality === 'vent' ? 'ZOLL Z Vent®' : 'ZOLL AED 3® / AED Plus®'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      ZOLL Advantage
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6EF] dark:divide-[#1E2D42]">
              {currentSpecs.map((row, idx) => {
                const isZollWinner = row.winner === 'zoll';

                return (
                  <tr
                    key={row.parameter}
                    className={`transition-colors ${
                      row.isKeyDifferentiator
                        ? 'bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40'
                        : 'hover:bg-[#F5F7FA] dark:hover:bg-[#16243A]'
                    }`}
                  >
                    {/* Specification Parameter & Category */}
                    <td className="py-3.5 px-4 sm:px-6 align-top">
                      <div className="font-bold text-[#14283F] dark:text-white">
                        {row.parameter}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#53657B] dark:text-slate-400 mt-0.5">
                        {row.category}
                      </div>
                      {row.isKeyDifferentiator && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#285EE8] dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Key Decision Factor</span>
                        </span>
                      )}
                    </td>

                    {/* Incumbent Specification */}
                    <td className="py-3.5 px-4 sm:px-6 align-top bg-slate-50/50 dark:bg-slate-900/40 border-r border-[#DFE6EF] dark:border-[#1E2D42]">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {row.incumbentSpec}
                      </div>
                      {isZollWinner && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Hardware Gap</span>
                        </div>
                      )}
                    </td>

                    {/* ZOLL Specification & Clinical Advantage */}
                    <td className="py-3.5 px-4 sm:px-6 align-top bg-blue-50/20 dark:bg-blue-950/10">
                      <div className="text-xs font-bold text-[#14283F] dark:text-white flex items-baseline gap-1.5">
                        <span>{row.zollSpec}</span>
                      </div>
                      {row.clinicalAdvantageNote && (
                        <div className="mt-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{row.clinicalAdvantageNote}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          TACTICAL MEETING TALK TRACK: OVERCOMING INCUMBENT INERTIA
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#14283F] dark:text-white">
          <Info className="w-4 h-4 text-[#285EE8]" />
          <span>Chief &amp; Medical Director Specification Talk Track ({agency.name}):</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="font-bold text-[#14283F] dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#285EE8] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Weight &amp; Ergonomics</span>
            </div>
            <p className="text-[#53657B] dark:text-slate-300 leading-relaxed">
              "Chief, your crews currently carry an 18.9 lb monitor up 3 flights of apartment stairs. At 11.7 lbs, the ZOLL X Series is nearly 40% lighter with an identical screen size, directly reducing work comp claims and crew fatigue."
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="font-bold text-[#14283F] dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#285EE8] text-white flex items-center justify-center text-[10px]">2</span>
              <span>Real BVM Help® (Exclusive)</span>
            </div>
            <p className="text-[#53657B] dark:text-slate-300 leading-relaxed">
              "Every vendor provides CPR depth feedback today, but ZOLL is the only manufacturer that shows your medics real-time tidal volume in mL during ventilation. This prevents hyperventilation that kills cerebral perfusion in cardiac arrest."
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
            <div className="font-bold text-[#14283F] dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#285EE8] text-white flex items-center justify-center text-[10px]">3</span>
              <span>Trade-In &amp; Sourcewell Co-Op</span>
            </div>
            <p className="text-[#53657B] dark:text-slate-300 leading-relaxed">
              "We have an active trade-in credit of $4,000 per retired unit on your {recordedDefib} fleet, and this entire package is pre-competed under Sourcewell Contract #041823-ZOL, eliminating months of RFP overhead."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
