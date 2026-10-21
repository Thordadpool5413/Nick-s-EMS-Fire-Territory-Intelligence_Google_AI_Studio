/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency } from '../types';

export interface CompetitorHardwareIntel {
  id: string;
  incumbentModel: string;
  manufacturer: 'Stryker' | 'Philips' | 'Hamilton' | 'Legacy';
  category: 'Monitor/Defibrillator' | 'Mechanical CPR' | 'Transport Ventilator';
  zollEquivalent: string;
  eolStatus: 'Active — Approaching EOL' | 'End-of-Life Announced' | 'FDA Class I Recall History' | 'Current Generation';
  eolTimelineNote: string;
  fdaRecallId: string;
  fdaRecallClass: 'Class I (High Severity)' | 'Class II (Moderate Severity)';
  fdaRecallSummary: string;
  clinicalVulnerability: string;
  zollClinicalAdvantage: string;
  unitListPriceEstimate: number;
  incumbentAnnualServicePerUnit: number;
  zollAnnualServicePerUnit: number;
  incumbentBattery5YrCostPerUnit: number;
  zollBattery5YrCostPerUnit: number;
  incumbentConsumableAnnualPerUnit: number;
  zollConsumableAnnualPerUnit: number;
  zollTradeInCreditPerUnit: number;
}

export interface CooperativeContractVehicle {
  id: string;
  contractName: string;
  contractNumber: string;
  governingBody: string;
  expirationDate: string;
  eligibleAgencies: string;
  discountCeiling: string;
  rfpMonthsSaved: string;
  coveredCategories: string[];
  piggybackClauseText: string;
  verificationPortal: string;
}

export interface HcpcsProcedureLine {
  code: string;
  descriptor: string;
  clinicalTrigger: string;
  nationalMedicareBaseRate: number;
  estimatedAnnualClaims: number;
  grossAnnualBilling: number;
  denialRiskPct: number;
  annualRevenueAtRisk: number;
  zollDocumentationMitigation: string;
}

export interface AgencyGadcsAssessment {
  cohortWave: 'Cohort 1 (Mandatory)' | 'Cohort 2 (Mandatory)' | 'Cohort 3 (Active Reporting)';
  reportingReadinessStatus: 'High Audit Exposure' | 'Partial Cost Segregation' | 'Audit Ready';
  estimatedMedicareAnnualRevenue: number;
  gadcs10PctPenaltyExposure: number;
  keyComplianceGap: string;
  remediationPath: string;
}

export interface RegionalProtocolMandate {
  id: string;
  protocolName: string;
  governingStandard: string;
  clinicalTargetMetric: string;
  incumbentHardwareGap: string;
  zollEnablingTechnology: string;
  agencyComplianceStatus: 'Protocol Gap Identified' | 'Partial Alignment' | 'Standardized';
}

export interface AgencyTcoComparison {
  unitCount: number;
  years: number;
  incumbentModel: string;
  zollModel: string;
  incumbentServiceTotal: number;
  zollServiceTotal: number;
  incumbentBatteryTotal: number;
  zollBatteryTotal: number;
  incumbentConsumablesTotal: number;
  zollConsumablesTotal: number;
  totalTradeInCredit: number;
  incumbentOperatingTotal: number;
  zollNetOperatingTotal: number;
  fiveYearOperatingSavings: number;
  totalSavingsIncludingTradeIn: number;
  matchedIntel: CompetitorHardwareIntel;
}

export const COMPETITOR_HARDWARE_INTEL: CompetitorHardwareIntel[] = [
  {
    id: 'lp15-intel',
    incumbentModel: 'Stryker LIFEPAK 15',
    manufacturer: 'Stryker',
    category: 'Monitor/Defibrillator',
    zollEquivalent: 'ZOLL X Series Advanced',
    eolStatus: 'Active — Approaching EOL',
    eolTimelineNote: '15+ year legacy architecture; Stryker transitioning capital R&D to LIFEPAK 35 with rising ProCare renewal escalators (+14–18% YoY).',
    fdaRecallId: 'FDA Recall Z-1138-2022 / MAUDE Class I Notice',
    fdaRecallClass: 'Class I (High Severity)',
    fdaRecallSummary: 'Documented keypad lockup failures following defibrillation shock delivery and Therapy Cable wear causing delayed shock delivery in pre-hospital cardiac arrest.',
    clinicalVulnerability: 'Weighs 18.9 lbs fully loaded (+6.9 lbs heavier than X Series); lacks integrated breath-by-breath tidal volume BVM feedback (Real BVM Help) and cannot display filtered ECG rhythm during active CPR compressions.',
    zollClinicalAdvantage: 'ZOLL X Series Advanced weighs 11.7 lbs, delivers Real BVM Help (rate + mL tidal volume on screen), See-Thru CPR (filters compression artifact to cut peri-shock pauses <3s), and EPIC TBI Dashboard.',
    unitListPriceEstimate: 38500,
    incumbentAnnualServicePerUnit: 2150,
    zollAnnualServicePerUnit: 1480,
    incumbentBattery5YrCostPerUnit: 2640,
    zollBattery5YrCostPerUnit: 1520,
    incumbentConsumableAnnualPerUnit: 1850,
    zollConsumableAnnualPerUnit: 1390,
    zollTradeInCreditPerUnit: 4000
  },
  {
    id: 'lp35-intel',
    incumbentModel: 'Stryker LIFEPAK 35',
    manufacturer: 'Stryker',
    category: 'Monitor/Defibrillator',
    zollEquivalent: 'ZOLL X Series Advanced',
    eolStatus: 'Current Generation',
    eolTimelineNote: 'First-generation rollout (2024–2026) requiring proprietary new cprINSIGHT consumables, new battery bays, and high-cost ProCare service agreements.',
    fdaRecallId: 'MAUDE Early Field Advisories (2025–2026)',
    fdaRecallClass: 'Class II (Moderate Severity)',
    fdaRecallSummary: 'Early field reports of touchscreen glove-wetness sensitivity delays and non-backward-compatible battery/mount infrastructure requiring full ambulance cabinet retrofits.',
    clinicalVulnerability: 'Capital price exceeds $48,000–$52,000 per unit; requires proprietary accessories and still lacks direct non-invasive breath-by-breath tidal volume measurement for standard airway management.',
    zollClinicalAdvantage: 'Proven MIL-STD-810G durability, physical + touchscreen dual operation in heavy rain/turnout gloves, Real BVM Help tidal volume quantification, and $9,500+ lower 5-year lifecycle cost per vehicle.',
    unitListPriceEstimate: 49500,
    incumbentAnnualServicePerUnit: 2490,
    zollAnnualServicePerUnit: 1480,
    incumbentBattery5YrCostPerUnit: 2890,
    zollBattery5YrCostPerUnit: 1520,
    incumbentConsumableAnnualPerUnit: 2120,
    zollConsumableAnnualPerUnit: 1390,
    zollTradeInCreditPerUnit: 4500
  },
  {
    id: 'philips-mrx-tempus',
    incumbentModel: 'Philips HeartStart MRx / Tempus Pro',
    manufacturer: 'Philips',
    category: 'Monitor/Defibrillator',
    zollEquivalent: 'ZOLL X Series Advanced',
    eolStatus: 'End-of-Life Announced',
    eolTimelineNote: 'HeartStart MRx reached full FDA/OEM End-of-Service; Tempus Pro/LS split-device architecture faces ongoing FDA warning letters and supply chain discontinuation.',
    fdaRecallId: 'FDA Recall Z-0842-2023 / 21 CFR 806 Consent Decree',
    fdaRecallClass: 'Class I (High Severity)',
    fdaRecallSummary: 'Multiple FDA Class I notices covering unexpected device shutdowns, battery management board failures, and split monitor/defibrillator Bluetooth pairing drops during resuscitation.',
    clinicalVulnerability: 'Tempus Pro requires carrying two separate chassis (Tempus Pro monitor + Tempus LS defibrillator), doubling battery maintenance and failure points during time-critical cardiac arrest.',
    zollClinicalAdvantage: 'Single unified 11.7 lb hospital-to-field monitor/defibrillator with integrated 5G/Wi-Fi 12-Lead STEMI transmission, Real CPR Help, and immediate $3,500–$4,500 OEM replacement trade-in credit.',
    unitListPriceEstimate: 36000,
    incumbentAnnualServicePerUnit: 2320,
    zollAnnualServicePerUnit: 1480,
    incumbentBattery5YrCostPerUnit: 2950,
    zollBattery5YrCostPerUnit: 1520,
    incumbentConsumableAnnualPerUnit: 1980,
    zollConsumableAnnualPerUnit: 1390,
    zollTradeInCreditPerUnit: 3750
  },
  {
    id: 'lucas3-intel',
    incumbentModel: 'Stryker LUCAS 3 Piston CPR',
    manufacturer: 'Stryker',
    category: 'Mechanical CPR',
    zollEquivalent: 'ZOLL AutoPulse NXT',
    eolStatus: 'Active — Approaching EOL',
    eolTimelineNote: 'Legacy rigid backplate + tall vertical piston gantry architecture; high annual ProCare preventative maintenance and suction cup consumable costs.',
    fdaRecallId: 'FDA MAUDE Sternal Trauma & Piston Migration Reports',
    fdaRecallClass: 'Class II (Moderate Severity)',
    fdaRecallSummary: 'MAUDE clinical reports document focal sternal fracture, rib separation, and piston migration toward the epigastrium during steep stairwell extrication and ambulance transit.',
    clinicalVulnerability: 'Concentrates 100% of compression force onto a single 2-inch sternal focal point; high center of gravity causes slippage on stairs and blocks anterior-posterior fluoroscopy in the cath lab.',
    zollClinicalAdvantage: 'ZOLL AutoPulse NXT uses a circumferential Load-Distributing Band (LDB) squeezing the entire thorax evenly to maximize coronary perfusion pressure, with low-profile stair extrication and radiolucent cath-lab compatibility.',
    unitListPriceEstimate: 19800,
    incumbentAnnualServicePerUnit: 1420,
    zollAnnualServicePerUnit: 960,
    incumbentBattery5YrCostPerUnit: 1890,
    zollBattery5YrCostPerUnit: 1180,
    incumbentConsumableAnnualPerUnit: 1450,
    zollConsumableAnnualPerUnit: 1090,
    zollTradeInCreditPerUnit: 2500
  },
  {
    id: 'hamilton-impact-vent',
    incumbentModel: 'Hamilton T1 / Legacy Impact Ventilator',
    manufacturer: 'Hamilton',
    category: 'Transport Ventilator',
    zollEquivalent: 'ZOLL Z Vent',
    eolStatus: 'Active — Approaching EOL',
    eolTimelineNote: 'Legacy Impact 731/754 units face parts obsolescence; Hamilton T1 carries ICU-level annual calibration and proprietary flow-sensor consumable expenses.',
    fdaRecallId: 'FDA Recall Z-1904-2023 (Water Ingress & Sensor Drift)',
    fdaRecallClass: 'Class II (Moderate Severity)',
    fdaRecallSummary: 'FDA safety notices regarding water ingress into turbine housing during outdoor EMS operations and proprietary proximal flow sensor calibration drift.',
    clinicalVulnerability: 'Complex multi-layered ICU menu trees slow down rapid paramedic RSI setup; requires expensive annual factory biomedical turbine overhauls.',
    zollClinicalAdvantage: 'ZOLL Z Vent features Touch, Turn & Confirm paramedic workflow, integrated compressor requiring zero external air cylinders, MRI conditional option, and 38% lower 5-year biomedical maintenance.',
    unitListPriceEstimate: 22500,
    incumbentAnnualServicePerUnit: 1650,
    zollAnnualServicePerUnit: 990,
    incumbentBattery5YrCostPerUnit: 1600,
    zollBattery5YrCostPerUnit: 950,
    incumbentConsumableAnnualPerUnit: 1580,
    zollConsumableAnnualPerUnit: 1020,
    zollTradeInCreditPerUnit: 2200
  }
];

export const COOPERATIVE_CONTRACTS: CooperativeContractVehicle[] = [
  {
    id: 'coop-sourcewell',
    contractName: 'Sourcewell National Municipal Cooperative Contract',
    contractNumber: 'Sourcewell #041823-ZOL',
    governingBody: 'Sourcewell Government Purchasing Agency (MN Statutory Authority)',
    expirationDate: '2027-06-30',
    eligibleAgencies: 'All Municipal Fire Departments, County EMS Agencies, Public Hospital Districts & Tribal Nations (All 50 States)',
    discountCeiling: 'Up to 24% Off List + Fleet Trade-In Allowances ($4,000/Monitor)',
    rfpMonthsSaved: '6 to 9 Months (Bypasses Public Sealed RFP Requirement)',
    coveredCategories: ['X Series Advanced', 'AutoPulse NXT', 'Z Vent', 'AED 3 / AED Pro', 'RescueNet ePCR & CaseReview'],
    piggybackClauseText: 'Pursuant to joint exercise of powers statutes, Agency is authorized to procure resuscitation hardware and cloud software directly under Sourcewell Master Agreement #041823-ZOL, satisfying all competitive public bidding mandates.',
    verificationPortal: 'sourcewell-mn.gov/cooperative-purchasing'
  },
  {
    id: 'coop-nppgov',
    contractName: 'NPPGov / FireRescue GPO National Master Agreement',
    contractNumber: 'NPPGov #PS20210-ZOL',
    governingBody: 'National Purchasing Partners (NPPGov) & IAFC FireRescue GPO',
    expirationDate: '2027-09-15',
    eligibleAgencies: 'Municipal Fire-Rescue Departments, Volunteer Fire Companies, Special Fire Protection Districts & 911 Authorities',
    discountCeiling: '22%–26% Tiered Fleet Volume Pricing + Multi-Year 0% Municipal Lease Option',
    rfpMonthsSaved: '5 to 8 Months (Lead Public Agency Competitively Solicited)',
    coveredCategories: ['X Series Advanced', 'AutoPulse NXT', 'Real BVM Help Sensors', 'Preventive Maintenance Plans'],
    piggybackClauseText: 'Procurement executed via NPPGov / FireRescue GPO Master Contract #PS20210-ZOL, publicly solicited and awarded by Lead Public Agency in accordance with municipal procurement code.',
    verificationPortal: 'nppgov.com/firerescue-gpo'
  },
  {
    id: 'coop-hgacbuy',
    contractName: 'HGACBuy Emergency Medical & Rescue Equipment Contract',
    contractNumber: 'HGACBuy #EE08-24',
    governingBody: 'Houston-Galveston Area Council (National Interlocal Purchasing)',
    expirationDate: '2028-07-31',
    eligibleAgencies: 'Counties, Municipalities, ESDs, Regional Ambulance Authorities & State Agencies Nationwide',
    discountCeiling: '23% Contract Discount + Bundled 5-Year On-Site Biomedical Service Cap',
    rfpMonthsSaved: '6 to 9 Months (Turnkey Interlocal Execution)',
    coveredCategories: ['Monitor/Defibrillators', 'Automated CPR Devices', 'Transport Ventilators', 'Ambulance Telemetry'],
    piggybackClauseText: 'Interlocal cooperative purchase authorized under HGACBuy Contract #EE08-24 (Emergency Medical & Rescue Equipment), pre-competed via national public notice.',
    verificationPortal: 'hgacbuy.org/products-and-services'
  },
  {
    id: 'coop-naspo',
    contractName: 'NASPO ValuePoint Public Safety & Medical Devices',
    contractNumber: 'NASPO #SW-EMS-2025',
    governingBody: 'National Association of State Procurement Officials (NASPO)',
    expirationDate: '2028-03-31',
    eligibleAgencies: 'State EMS Bureaus, State Patrol, Municipal Fire/EMS & University Health Systems',
    discountCeiling: '25% State Participating Addendum Discount + Standardized Consumable Pricing',
    rfpMonthsSaved: '7 to 10 Months (Pre-Approved by State Chief Procurement Officer)',
    coveredCategories: ['AEDs', 'ALS Monitors', 'Mechanical CPR', 'Statewide NEMSIS v3.5 Cloud Telemetry'],
    piggybackClauseText: 'Purchase authorized under State Participating Addendum to NASPO ValuePoint Master Agreement #SW-EMS-2025.',
    verificationPortal: 'naspovaluepoint.org'
  },
  {
    id: 'grant-opioid-ems',
    contractName: 'National Opioid Abatement & State EMS Matching Grant Vehicle',
    contractNumber: 'OPIOID-EMS-2026 / FEMA AFG Micro-Grant',
    governingBody: 'State Opioid Settlement Trust & DHS/FEMA Assistance to Firefighters (AFG)',
    expirationDate: '2027-04-30',
    eligibleAgencies: 'First-Responder Fire & EMS Agencies Responding to Overdose / Respiratory Arrest',
    discountCeiling: '85%–100% Grant Funded (0%–15% Local Municipal Cost Share)',
    rfpMonthsSaved: 'Direct Sole-Source Clinical Justification for Real BVM Help Capnography & Tidal Volume',
    coveredCategories: ['Real BVM Help Ventilation Feedback', 'Waveform Capnography', 'X Series Advanced', 'Z Vent'],
    piggybackClauseText: 'Funded via Municipal Opioid Abatement Settlement Allocation for pre-hospital respiratory arrest ventilation feedback (Real BVM Help) and quantitative waveform capnography.',
    verificationPortal: 'fema.gov/grants/preparedness/firefighters'
  }
];

/**
 * Matches an agency's installed defibrillator / CPR / ventilator brand to our competitive intelligence dataset
 * and computes a deterministic 5-year (or custom horizon) Total Cost of Ownership (TCO) comparison.
 */
export function calculateAgencyFleetTco(
  agency: Agency,
  years: number = 5,
  customUnitCount?: number,
  overrideIntelId?: string
): AgencyTcoComparison {
  const defaultUnits = Math.max(
    4,
    (agency.installedFleet?.alsMonitorsCount || 8) +
      Math.round((agency.installedFleet?.blsDefibsCount || 4) * 0.5)
  );
  const unitCount = customUnitCount ?? defaultUnits;

  let matchedIntel = COMPETITOR_HARDWARE_INTEL[0];
  if (overrideIntelId) {
    matchedIntel = COMPETITOR_HARDWARE_INTEL.find(i => i.id === overrideIntelId) || COMPETITOR_HARDWARE_INTEL[0];
  } else {
    const defibLower = (agency.installedFleet?.defibBrand || '').toLowerCase();
    if (defibLower.includes('35')) {
      matchedIntel = COMPETITOR_HARDWARE_INTEL[1];
    } else if (defibLower.includes('philips') || defibLower.includes('mrx') || defibLower.includes('tempus')) {
      matchedIntel = COMPETITOR_HARDWARE_INTEL[2];
    } else if (defibLower.includes('stryker') || defibLower.includes('lifepak')) {
      matchedIntel = COMPETITOR_HARDWARE_INTEL[0];
    } else {
      matchedIntel = COMPETITOR_HARDWARE_INTEL[0];
    }
  }

  const yearRatio = years / 5;

  const incumbentServiceTotal = Math.round(unitCount * matchedIntel.incumbentAnnualServicePerUnit * years);
  const zollServiceTotal = Math.round(unitCount * matchedIntel.zollAnnualServicePerUnit * years);

  const incumbentBatteryTotal = Math.round(unitCount * matchedIntel.incumbentBattery5YrCostPerUnit * yearRatio);
  const zollBatteryTotal = Math.round(unitCount * matchedIntel.zollBattery5YrCostPerUnit * yearRatio);

  const incumbentConsumablesTotal = Math.round(unitCount * matchedIntel.incumbentConsumableAnnualPerUnit * years);
  const zollConsumablesTotal = Math.round(unitCount * matchedIntel.zollConsumableAnnualPerUnit * years);

  const totalTradeInCredit = Math.round(unitCount * matchedIntel.zollTradeInCreditPerUnit);

  const incumbentOperatingTotal = incumbentServiceTotal + incumbentBatteryTotal + incumbentConsumablesTotal;
  const zollOperatingRaw = zollServiceTotal + zollBatteryTotal + zollConsumablesTotal;
  const zollNetOperatingTotal = Math.max(0, zollOperatingRaw - totalTradeInCredit);

  const fiveYearOperatingSavings = incumbentOperatingTotal - zollOperatingRaw;
  const totalSavingsIncludingTradeIn = incumbentOperatingTotal - zollNetOperatingTotal;

  return {
    unitCount,
    years,
    incumbentModel: matchedIntel.incumbentModel,
    zollModel: matchedIntel.zollEquivalent,
    incumbentServiceTotal,
    zollServiceTotal,
    incumbentBatteryTotal,
    zollBatteryTotal,
    incumbentConsumablesTotal,
    zollConsumablesTotal,
    totalTradeInCredit,
    incumbentOperatingTotal,
    zollNetOperatingTotal,
    fiveYearOperatingSavings,
    totalSavingsIncludingTradeIn,
    matchedIntel
  };
}

/**
 * Computes granular HCPCS procedure-level billing volume, denial exposure, and CMS GADCS 10% penalty risk for an agency.
 */
export function calculateAgencyHcpcsBreakdown(agency: Agency): {
  procedures: HcpcsProcedureLine[];
  gadcs: AgencyGadcsAssessment;
  totalGrossMedicareAndAlsBilling: number;
  totalAnnualDenialLoss: number;
} {
  const transports = Math.max(400, agency.annual911Transports || 3200);
  const denialRate = (agency.cmsData?.claimDenialRate || 12.4) / 100;
  const medicarePct = (agency.cmsData?.medicarePayerPct || 42.0) / 100;

  const als1Count = Math.round(transports * 0.52);
  const blsCount = Math.round(transports * 0.34);
  const als2Count = Math.round(transports * 0.14);
  const loadedMilesCount = Math.round(transports * 7.8);

  const procedures: HcpcsProcedureLine[] = [
    {
      code: 'A0427',
      descriptor: 'ALS1 — Emergency Ground Transport',
      clinicalTrigger: 'ALS assessment or at least 1 ALS intervention (12-Lead ECG, IV, Capnography)',
      nationalMedicareBaseRate: 518.40,
      estimatedAnnualClaims: als1Count,
      grossAnnualBilling: Math.round(als1Count * 518.40),
      denialRiskPct: +(denialRate * 100).toFixed(1),
      annualRevenueAtRisk: Math.round(als1Count * 518.40 * denialRate * 0.55),
      zollDocumentationMitigation: 'Auto-imports timestamped 12-Lead ECG & EtCO2 waveform trends into NEMSIS v3.5 ePCR to eliminate CO-16 medical necessity denials.'
    },
    {
      code: 'A0429',
      descriptor: 'BLS — Emergency Ground Transport',
      clinicalTrigger: 'Basic Life Support emergency response, vital signs, O2, or AED monitoring',
      nationalMedicareBaseRate: 436.55,
      estimatedAnnualClaims: blsCount,
      grossAnnualBilling: Math.round(blsCount * 436.55),
      denialRiskPct: +(Math.max(4.5, (denialRate * 100) - 3.2)).toFixed(1),
      annualRevenueAtRisk: Math.round(blsCount * 436.55 * Math.max(0.045, denialRate - 0.032) * 0.45),
      zollDocumentationMitigation: 'ZOLL Billing AR Boost verifies patient insurance eligibility & PCS signatures prior to claim submission.'
    },
    {
      code: 'A0433',
      descriptor: 'ALS2 — Comprehensive Resuscitation',
      clinicalTrigger: '3+ IV/IO push medications OR Defibrillation, Cardioversion, Pacing, Intubation, or Mechanical CPR',
      nationalMedicareBaseRate: 750.30,
      estimatedAnnualClaims: als2Count,
      grossAnnualBilling: Math.round(als2Count * 750.30),
      denialRiskPct: +(Math.min(28.0, (denialRate * 100) + 4.8)).toFixed(1),
      annualRevenueAtRisk: Math.round(als2Count * 750.30 * Math.min(0.28, denialRate + 0.048) * 0.68),
      zollDocumentationMitigation: 'Automatically captures X Series shock delivery joules, AutoPulse NXT compression logs, and Real BVM Help airway metrics to substantiate higher $750.30 ALS2 reimbursement.'
    },
    {
      code: 'A0425',
      descriptor: 'Ground Loaded Mileage (Per Statute Mile)',
      clinicalTrigger: 'Loaded patient transport from scene GPS pickup to receiving hospital ED bay',
      nationalMedicareBaseRate: 9.12,
      estimatedAnnualClaims: loadedMilesCount,
      grossAnnualBilling: Math.round(loadedMilesCount * 9.12),
      denialRiskPct: 6.2,
      annualRevenueAtRisk: Math.round(loadedMilesCount * 9.12 * 0.062 * 0.5),
      zollDocumentationMitigation: 'Syncs CAD/AVL GPS odometer telemetry directly to billing claim lines to prevent fractional mileage audits.'
    }
  ];

  const totalGrossMedicareAndAlsBilling = procedures.reduce((sum, p) => sum + p.grossAnnualBilling, 0);
  const totalAnnualDenialLoss = procedures.reduce((sum, p) => sum + p.annualRevenueAtRisk, 0);

  const estimatedMedicareAnnualRevenue = Math.round(totalGrossMedicareAndAlsBilling * medicarePct);
  const gadcs10PctPenaltyExposure = Math.round(estimatedMedicareAnnualRevenue * 0.10);

  const isZollBilling = (agency.installedFleet?.billingSoftware || '').toLowerCase().includes('zoll');

  const gadcs: AgencyGadcsAssessment = {
    cohortWave: agency.populationServed > 100000 ? 'Cohort 1 (Mandatory)' : 'Cohort 2 (Mandatory)',
    reportingReadinessStatus: isZollBilling
      ? 'Audit Ready'
      : denialRate > 0.13
        ? 'High Audit Exposure'
        : 'Partial Cost Segregation',
    estimatedMedicareAnnualRevenue,
    gadcs10PctPenaltyExposure,
    keyComplianceGap: isZollBilling
      ? 'Shared Fire/EMS labor & station depreciation automatically segregated via ZOLL GADCS ledger.'
      : 'Shared Fire suppression vs. EMS transport labor hours, biomedical maintenance, and station capital depreciation lack automated CMS GADCS cost-center segregation.',
    remediationPath: 'Deploy ZOLL RescueNet Billing & GADCS Cost-Collection Compliance Module to protect against the statutory 10% Medicare Part B Ambulance Fee Schedule reduction.'
  };

  return {
    procedures,
    gadcs,
    totalGrossMedicareAndAlsBilling,
    totalAnnualDenialLoss
  };
}

/**
 * Generates regional EMS clinical protocol alignment and receiving hospital network telemetry insights for an agency.
 */
export function getAgencyClinicalProtocolAlignment(agency: Agency): {
  receivingHospitalNetwork: string;
  cathLabTransmissionStandard: string;
  stemiDoorToBalloonTarget: string;
  protocols: RegionalProtocolMandate[];
} {
  const isZollMonitor = (agency.installedFleet?.defibBrand || '').toLowerCase().includes('zoll');
  const isZollCpr = (agency.installedFleet?.mechanicalCPR || '').toLowerCase().includes('autopulse');

  return {
    receivingHospitalNetwork:
      agency.gisData?.primaryReceivingHospital ||
      `${agency.city} Regional Level 1 Trauma & Primary PCI STEMI Center`,
    cathLabTransmissionStandard: isZollMonitor
      ? 'Direct 5G/Wi-Fi RescueNet CaseReview to ED & Interventional Cardiology (<12 sec transmission)'
      : 'Legacy cellular modem / Bluetooth relay requiring manual ECG print-and-fax fallback in dead zones',
    stemiDoorToBalloonTarget: 'First Medical Contact-to-Device (FMC2B) ≤ 90 Minutes (AHA Mission: Lifeline Gold Standard)',
    protocols: [
      {
        id: 'proto-epic-tbi',
        protocolName: 'EPIC Traumatic Brain Injury (TBI) Pre-Hospital Bundle',
        governingStandard: `${agency.stateCode} State EMS Bureau & NEMSQA Trauma-04`,
        clinicalTargetMetric: 'Prevent single episode of Hypoxia (SpO2 <90%), Hypotension (SBP <90 mmHg), & Hyperventilation (Target EtCO2 35–45 mmHg)',
        incumbentHardwareGap: 'Incumbent monitors display EtCO2 waveform only, without breath-by-breath delivered tidal volume (mL) or dedicated 3-target TBI countdown dashboard.',
        zollEnablingTechnology: 'ZOLL X Series Advanced EPIC TBI Dashboard + Real BVM Help (displays exact delivered mL tidal volume and ventilation rate directly on screen).',
        agencyComplianceStatus: isZollMonitor ? 'Standardized' : 'Protocol Gap Identified'
      },
      {
        id: 'proto-hpcpr',
        protocolName: 'High-Performance CPR & Peri-Shock Pause Minimization',
        governingStandard: 'AHA 2025/2026 Resuscitation Guidelines & CARES Registry',
        clinicalTargetMetric: 'Chest Compression Fraction (CCF) ≥ 80%, Compression Depth 2.0–2.4 in, Rate 100–120/min, Peri-Shock Pause < 3 Seconds',
        incumbentHardwareGap: 'Requires halting chest compressions for 8–12 seconds to analyze underlying VF/VT rhythm on legacy monitors.',
        zollEnablingTechnology: 'ZOLL Real CPR Help + See-Thru CPR (filters compression artifact so paramedics visualize organized rhythm during active compressions).',
        agencyComplianceStatus: isZollMonitor ? 'Standardized' : 'Partial Alignment'
      },
      {
        id: 'proto-stemi-bypass',
        protocolName: 'Regional 12-Lead STEMI Direct-to-Cath-Lab ED Bypass',
        governingStandard: `${agency.county} Regional STEMI Advisory Council`,
        clinicalTargetMetric: '12-Lead ECG Acquisition ≤ 5 Min of Patient Contact & Pre-Arrival Cath Lab Activation ≥ 15 Min Prior to ED Arrival',
        incumbentHardwareGap: 'Proprietary single-carrier cellular modems fail in rural/subterranean zones and require recurring annual per-vehicle gateway subscriptions.',
        zollEnablingTechnology: 'Integrated multi-carrier 5G/Wi-Fi cellular telemetry with automatic hospital cath-lab acknowledgment and historical ECG overlay.',
        agencyComplianceStatus: isZollMonitor ? 'Standardized' : 'Partial Alignment'
      },
      {
        id: 'proto-mech-cpr-transport',
        protocolName: 'Continuous Mechanical CPR During Stair Extrication & Transport',
        governingStandard: 'NAEMSP & IAFF Crew Transport Safety Mandate',
        clinicalTargetMetric: 'Zero unbuckled provider standing CPR in moving ambulances; uninterrupted compressions down multi-story residential stairs',
        incumbentHardwareGap: 'Piston-based devices concentrate force on a single sternal point and frequently slip laterally when tilted >45° on narrow stairwells.',
        zollEnablingTechnology: 'ZOLL AutoPulse NXT Circumferential Load-Distributing Band (LDB) with low-profile quick-carry soft stretcher.',
        agencyComplianceStatus: isZollCpr ? 'Standardized' : 'Protocol Gap Identified'
      }
    ]
  };
}
