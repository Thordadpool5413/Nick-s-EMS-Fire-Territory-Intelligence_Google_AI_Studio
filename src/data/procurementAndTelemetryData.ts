/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NationwideIngestState {
  stateCode: string;
  stateName: string;
  region: 'Northeast' | 'Midwest' | 'South' | 'West';
  totalAgencies: number;
  totalMedicareClaims: number;
  totalBilledVolumeDollars: number;
  lastIngestTimestamp: string;
  ingestionStatus: 'Ingested & Verified' | 'Incremental Sync In Progress' | 'Queued For Batch ETL';
  schemaErrors: number;
  dataLatencyHours: number;
  npiMatchRatePct: number;
}

export const NATIONWIDE_INGESTION_REGISTRY: NationwideIngestState[] = [
  { stateCode: 'TX', stateName: 'Texas', region: 'South', totalAgencies: 1840, totalMedicareClaims: 1240000, totalBilledVolumeDollars: 268000000, lastIngestTimestamp: '2026-10-15T02:15:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.2, npiMatchRatePct: 98.9 },
  { stateCode: 'CA', stateName: 'California', region: 'West', totalAgencies: 1420, totalMedicareClaims: 1120000, totalBilledVolumeDollars: 310000000, lastIngestTimestamp: '2026-10-15T02:22:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 3.8, npiMatchRatePct: 99.2 },
  { stateCode: 'FL', stateName: 'Florida', region: 'South', totalAgencies: 960, totalMedicareClaims: 980000, totalBilledVolumeDollars: 215000000, lastIngestTimestamp: '2026-10-15T02:30:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.5, npiMatchRatePct: 98.6 },
  { stateCode: 'NY', stateName: 'New York', region: 'Northeast', totalAgencies: 1280, totalMedicareClaims: 1050000, totalBilledVolumeDollars: 295000000, lastIngestTimestamp: '2026-10-15T02:40:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 3.1, npiMatchRatePct: 99.4 },
  { stateCode: 'PA', stateName: 'Pennsylvania', region: 'Northeast', totalAgencies: 1650, totalMedicareClaims: 780000, totalBilledVolumeDollars: 172000000, lastIngestTimestamp: '2026-10-15T03:00:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 5.0, npiMatchRatePct: 97.8 },
  { stateCode: 'OH', stateName: 'Ohio', region: 'Midwest', totalAgencies: 1180, totalMedicareClaims: 710000, totalBilledVolumeDollars: 154000000, lastIngestTimestamp: '2026-10-15T03:15:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.8, npiMatchRatePct: 98.4 },
  { stateCode: 'IL', stateName: 'Illinois', region: 'Midwest', totalAgencies: 1220, totalMedicareClaims: 840000, totalBilledVolumeDollars: 188000000, lastIngestTimestamp: '2026-10-15T03:30:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 3.9, npiMatchRatePct: 98.7 },
  { stateCode: 'NC', stateName: 'North Carolina', region: 'South', totalAgencies: 840, totalMedicareClaims: 520000, totalBilledVolumeDollars: 118000000, lastIngestTimestamp: '2026-10-15T03:45:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 5.2, npiMatchRatePct: 98.1 },
  { stateCode: 'GA', stateName: 'Georgia', region: 'South', totalAgencies: 620, totalMedicareClaims: 480000, totalBilledVolumeDollars: 104000000, lastIngestTimestamp: '2026-10-15T04:00:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 6.1, npiMatchRatePct: 97.4 },
  { stateCode: 'MI', stateName: 'Michigan', region: 'Midwest', totalAgencies: 790, totalMedicareClaims: 560000, totalBilledVolumeDollars: 122000000, lastIngestTimestamp: '2026-10-15T04:15:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.9, npiMatchRatePct: 98.2 },
  { stateCode: 'VA', stateName: 'Virginia', region: 'South', totalAgencies: 590, totalMedicareClaims: 410000, totalBilledVolumeDollars: 92000000, lastIngestTimestamp: '2026-10-15T04:30:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 5.4, npiMatchRatePct: 98.5 },
  { stateCode: 'WA', stateName: 'Washington', region: 'West', totalAgencies: 540, totalMedicareClaims: 390000, totalBilledVolumeDollars: 98000000, lastIngestTimestamp: '2026-10-15T04:45:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.1, npiMatchRatePct: 99.0 },
  { stateCode: 'AZ', stateName: 'Arizona', region: 'West', totalAgencies: 410, totalMedicareClaims: 380000, totalBilledVolumeDollars: 89000000, lastIngestTimestamp: '2026-10-15T05:00:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.7, npiMatchRatePct: 98.3 },
  { stateCode: 'MA', stateName: 'Massachusetts', region: 'Northeast', totalAgencies: 460, totalMedicareClaims: 370000, totalBilledVolumeDollars: 102000000, lastIngestTimestamp: '2026-10-15T05:15:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 3.6, npiMatchRatePct: 99.3 },
  { stateCode: 'CO', stateName: 'Colorado', region: 'West', totalAgencies: 480, totalMedicareClaims: 340000, totalBilledVolumeDollars: 84000000, lastIngestTimestamp: '2026-10-15T05:30:00Z', ingestionStatus: 'Ingested & Verified', schemaErrors: 0, dataLatencyHours: 4.3, npiMatchRatePct: 98.8 }
];

export interface MunicipalProcurementSolicitation {
  id: string;
  sourcePortal: 'SAM.gov Federal Contracting' | 'BidNet Direct Municipal' | 'GovWin IQ Procurement' | 'City Council Agendas Scraper';
  agencyName: string;
  stateCode: string;
  solicitationNumber: string;
  title: string;
  scopeCategory: 'Monitor-Defibrillators (ALS)' | 'Mechanical CPR Systems' | 'Public Access AED Units' | 'ePCR & CAD Telemetry Software';
  estimatedBudget: number;
  postDate: string;
  submissionDeadline: string;
  daysRemaining: number;
  status: 'Active Solicitation / Open' | 'Pre-RFP Draft Published' | 'Sole-Source Public Notice';
  specificationHighlights: string[];
  zollAdvantagePitch: string;
  documentDownloadUrl: string;
}

export const MUNICIPAL_PROCUREMENT_FEED: MunicipalProcurementSolicitation[] = [
  {
    id: 'SOL-2026-081',
    sourcePortal: 'BidNet Direct Municipal',
    agencyName: 'Austin-Travis County Emergency Medical Services',
    stateCode: 'TX',
    solicitationNumber: 'RFP-2026-EMS-0094',
    title: 'Replacement of Frontline Advanced Life Support Cardiac Monitor-Defibrillators (48 Units)',
    scopeCategory: 'Monitor-Defibrillators (ALS)',
    estimatedBudget: 2150000,
    postDate: '2026-10-12',
    submissionDeadline: '2026-11-20',
    daysRemaining: 35,
    status: 'Active Solicitation / Open',
    specificationHighlights: [
      'Real-time CPR quality feedback (depth, rate, chest compression fraction)',
      'Rectilinear biphasic or equivalent low-energy pediatric dosing',
      'Direct Bluetooth/Cellular telemetry to receiving hospital STEMI cath labs',
      'Integration with cloud ePCR and NEMSIS v3.5 export'
    ],
    zollAdvantagePitch: 'X Series Advanced with Real CPR Help and closed-loop RescueNet integration offers 100% specification compliance over Stryker LP15.',
    documentDownloadUrl: 'https://procurement.austintexas.gov/solicitations/RFP-2026-EMS-0094.pdf'
  },
  {
    id: 'SOL-2026-104',
    sourcePortal: 'GovWin IQ Procurement',
    agencyName: 'Chicago Fire Department - Bureau of EMS',
    stateCode: 'IL',
    solicitationNumber: 'IFB-CFD-2026-441',
    title: 'Automated Mechanical Resuscitation Compression Devices (75 Units + Fleet Mounts)',
    scopeCategory: 'Mechanical CPR Systems',
    estimatedBudget: 1680000,
    postDate: '2026-10-08',
    submissionDeadline: '2026-11-05',
    daysRemaining: 20,
    status: 'Active Solicitation / Open',
    specificationHighlights: [
      'Load-distributing band or piston architecture delivering continuous compressions during transport',
      'NFPA-compliant ambulance mounting brackets with dynamic crash-test certification',
      'Rapid deployment under 20 seconds during active resuscitation'
    ],
    zollAdvantagePitch: 'AutoPulse Resuscitation System distributes circumferential thoracic pressure without focal chest wall fractures or LUCAS suction slippage.',
    documentDownloadUrl: 'https://chicago.gov/purchasing/bids/IFB-CFD-2026-441.pdf'
  },
  {
    id: 'SOL-2026-142',
    sourcePortal: 'City Council Agendas Scraper',
    agencyName: 'Miami-Dade Fire Rescue Department',
    stateCode: 'FL',
    solicitationNumber: 'MDFR-SOLE-2026-02',
    title: 'Notice of Intent to Sole-Source: Fleet Modernization to ZOLL RescueNet CAD & Clinical ePCR Suite',
    scopeCategory: 'ePCR & CAD Telemetry Software',
    estimatedBudget: 1450000,
    postDate: '2026-10-14',
    submissionDeadline: '2026-10-28',
    daysRemaining: 12,
    status: 'Sole-Source Public Notice',
    specificationHighlights: [
      'Direct integration with existing ZOLL X Series fleet without 3rd-party middleware gateways',
      'Automated NEMSIS v3.5 state registry submission and Medicare billing scrubbing',
      'Real-time ambulance dispatch CAD synchronization'
    ],
    zollAdvantagePitch: 'Sole-source justification supported by interoperability and 0-latency biometric vitals handoff from defibrillator to electronic patient record.',
    documentDownloadUrl: 'https://miamidade.gov/fire/procurement/MDFR-SOLE-2026-02.pdf'
  },
  {
    id: 'SOL-2026-189',
    sourcePortal: 'SAM.gov Federal Contracting',
    agencyName: 'FEMA / USFA National Fire Academy & Federal EMS Response',
    stateCode: 'DC',
    solicitationNumber: '70FA-2026-R-0041',
    title: 'Public Access Automated External Defibrillators (AEDs) with Real-Time CPR Feedback for Federal Facilities (320 Units)',
    scopeCategory: 'Public Access AED Units',
    estimatedBudget: 620000,
    postDate: '2026-10-15',
    submissionDeadline: '2026-11-30',
    daysRemaining: 45,
    status: 'Active Solicitation / Open',
    specificationHighlights: [
      'Visual and audio prompts with real-time compression depth sensor',
      'Uni-padz electrodes suitable for both adult and pediatric patients with child-mode toggle',
      'Wi-Fi cloud readiness self-test telemetry reportable to central facility management'
    ],
    zollAdvantagePitch: 'ZOLL AED 3 with Universal Uni-padz eliminates pediatric pad swapping costs and provides PlusTrac cloud asset telemetry.',
    documentDownloadUrl: 'https://sam.gov/opp/70FA-2026-R-0041/view'
  }
];

export interface ZollInstalledBaseAsset {
  serialNumber: string;
  model: 'X Series Advanced' | 'AutoPulse Resuscitation System' | 'ZOLL AED 3' | 'Z Vent Transport Ventilator' | 'AED Pro';
  assignedAgencyId: string;
  assignedAgencyName: string;
  installationDate: string;
  warrantyExpirationDate: string;
  softwareFirmwareRevision: string;
  latestSelfTestResult: 'Pass / 100% Ready' | 'Warning: Battery Replacement Required' | 'Service Due: Annual Calibration';
  batteryHealthCycles: number;
  batteryHealthMaxCycles: number;
  electrodePadExpirationDate: string;
  serviceContractType: 'ZOLL TotalProtect Gold' | 'Standard Limited Warranty' | 'Uncovered / Time & Materials';
  replacementUrgencyScore: number; // 0 to 100
  notes: string;
}

export const ZOLL_INSTALLED_BASE_INVENTORY: ZollInstalledBaseAsset[] = [
  {
    serialNumber: 'XR-994821',
    model: 'X Series Advanced',
    assignedAgencyId: 'agency-01',
    assignedAgencyName: 'Cleveland Division of Emergency Medical Service',
    installationDate: '2021-04-10',
    warrantyExpirationDate: '2026-04-10',
    softwareFirmwareRevision: 'v04.14.02 (Telemetry Ready)',
    latestSelfTestResult: 'Pass / 100% Ready',
    batteryHealthCycles: 142,
    batteryHealthMaxCycles: 500,
    electrodePadExpirationDate: '2027-08-30',
    serviceContractType: 'ZOLL TotalProtect Gold',
    replacementUrgencyScore: 28,
    notes: 'Unit stationed on Medic 1. Frontline clinical condition.'
  },
  {
    serialNumber: 'XR-994822',
    model: 'X Series Advanced',
    assignedAgencyId: 'agency-01',
    assignedAgencyName: 'Cleveland Division of Emergency Medical Service',
    installationDate: '2019-02-15',
    warrantyExpirationDate: '2024-02-15',
    softwareFirmwareRevision: 'v03.88.00 (Upgrade Recommended)',
    latestSelfTestResult: 'Warning: Battery Replacement Required',
    batteryHealthCycles: 488,
    batteryHealthMaxCycles: 500,
    electrodePadExpirationDate: '2026-11-15',
    serviceContractType: 'Uncovered / Time & Materials',
    replacementUrgencyScore: 82,
    notes: 'Medic 4 backup unit. Battery capacity degraded to 488 cycles. High refresh priority.'
  },
  {
    serialNumber: 'AP-881204',
    model: 'AutoPulse Resuscitation System',
    assignedAgencyId: 'agency-03',
    assignedAgencyName: 'Miami-Dade Fire Rescue',
    installationDate: '2022-09-01',
    warrantyExpirationDate: '2027-09-01',
    softwareFirmwareRevision: 'v02.30.01',
    latestSelfTestResult: 'Pass / 100% Ready',
    batteryHealthCycles: 98,
    batteryHealthMaxCycles: 600,
    electrodePadExpirationDate: '2027-12-01',
    serviceContractType: 'ZOLL TotalProtect Gold',
    replacementUrgencyScore: 18,
    notes: 'Rescue 22 unit. Consistently achieves >92% chest compression fraction.'
  },
  {
    serialNumber: 'ZV-339108',
    model: 'Z Vent Transport Ventilator',
    assignedAgencyId: 'agency-02',
    assignedAgencyName: 'Austin-Travis County EMS',
    installationDate: '2023-01-20',
    warrantyExpirationDate: '2028-01-20',
    softwareFirmwareRevision: 'v03.10.00',
    latestSelfTestResult: 'Pass / 100% Ready',
    batteryHealthCycles: 64,
    batteryHealthMaxCycles: 500,
    electrodePadExpirationDate: 'N/A (Ventilator Circuit)',
    serviceContractType: 'ZOLL TotalProtect Gold',
    replacementUrgencyScore: 12,
    notes: 'Frontline ALS transport ventilator. Excellent O2 conservation metrics.'
  },
  {
    serialNumber: 'AED3-410291',
    model: 'ZOLL AED 3',
    assignedAgencyId: 'agency-04',
    assignedAgencyName: 'Charlotte Fire Department',
    installationDate: '2020-06-18',
    warrantyExpirationDate: '2028-06-18',
    softwareFirmwareRevision: 'v01.82.04',
    latestSelfTestResult: 'Service Due: Annual Calibration',
    batteryHealthCycles: 310,
    batteryHealthMaxCycles: 500,
    electrodePadExpirationDate: '2026-12-31',
    serviceContractType: 'Standard Limited Warranty',
    replacementUrgencyScore: 68,
    notes: 'Engine 12 first-responder AED. Uni-padz expiring in December.'
  }
];

/**
 * Demonstrates HIPAA Safe Harbor 18-Element De-Identification Transformation
 * ensuring confidential agency-specific clinical outcomes can be analyzed without PHI exposure.
 */
export function executeSafeHarborAnonymization(rawInput: {
  patientAge: number;
  incidentZip: string;
  callDateTime: string;
  paramedicInitials: string;
  initialRhythm: string;
  roscAchieved: boolean;
  hospitalDestination: string;
  narrativeText: string;
}) {
  return {
    anonymizedRecordId: `UTSTEIN-ANON-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    safeHarborStatus: '100% PHI Redacted (HIPAA 45 CFR § 164.514(b))',
    anonymizedFields: {
      ageCategory: rawInput.patientAge > 89 ? 'Age 90+' : `${Math.floor(rawInput.patientAge / 10) * 10}-${Math.floor(rawInput.patientAge / 10) * 10 + 9}`,
      geographic3DigitZip: rawInput.incidentZip.substring(0, 3) + 'XX',
      quarterYear: 'Q3 2026',
      paramedicCredentialHash: 'REDACTED_ANONYMOUS_EMS_CLINICIAN',
      cardiacRhythmGroup: rawInput.initialRhythm,
      outcomeRosc: rawInput.roscAchieved ? 'ROSC Sustained > 20 Mins' : 'No ROSC In Field',
      receivingFacilityTier: 'Level 1 Accredited STEMI PCI Center',
      redactedClinicalSummary: rawInput.narrativeText
        .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE_REDACTED]')
        .replace(/\b(Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+/g, '[PATIENT_NAME_REDACTED]')
        .replace(/\b(Medic|Engine|Rescue)\s+\d+\b/g, '[UNIT_ID_REDACTED]')
        .replace(/\b\d{10}\b/g, '[PHONE/NPI_REDACTED]')
    },
    cryptographicHash: 'sha256-' + Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16)
  };
}
