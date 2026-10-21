/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency, TerritoryCluster } from '../types';

export interface NationalBenchmark {
  totalAnnual911Calls: number;
  totalAmbulanceTransports: number;
  averageMedicareDenialRate: number;
  averageUtsteinSurvivalRate: number;
  totalAfgFundingAllocated: number;
  activeEmsAgenciesCount: number;
  medicarePartBGroundSpend: number;
  // Quality & Outcomes Benchmarks
  nemsqaStemi12LeadAcquisitionPct: number;
  nemsqaChestCompressionFractionPct: number;
  nemsqaEtco2VentilationCompliancePct: number;
  caresGoodNeurologicalSurvivalPct: number;
  commercialUnderpaymentPerTrip: number;
  gadcsCostToChargeRatio: number;
}

export const NATIONAL_BENCHMARKS: NationalBenchmark = {
  totalAnnual911Calls: 36800000,
  totalAmbulanceTransports: 22400000,
  averageMedicareDenialRate: 16.8, // 16.8% national average Medicare Part B denial rate
  averageUtsteinSurvivalRate: 29.7, // CARES report national benchmark
  totalAfgFundingAllocated: 360000000, // $360M FEMA AFG
  activeEmsAgenciesCount: 21450,
  medicarePartBGroundSpend: 5800000000, // $5.8B annual CMS ground ambulance spend
  nemsqaStemi12LeadAcquisitionPct: 74.2, // NEMSQA Cardiac-01 benchmark
  nemsqaChestCompressionFractionPct: 71.5, // Target >80%
  nemsqaEtco2VentilationCompliancePct: 58.4, // Target >75%
  caresGoodNeurologicalSurvivalPct: 8.2, // CARES CPC 1/2 benchmark
  commercialUnderpaymentPerTrip: 265, // Dollar gap in non-network claims
  gadcsCostToChargeRatio: 0.64
};

import { ALL_50_STATES_SUMMARIES } from './nationalGeographicData';
import { COMPREHENSIVE_NATIONWIDE_AGENCIES } from './nationalAgenciesData';
import { ALL_50_STATES_ADDITIONAL_AGENCIES } from './allStatesAgenciesData';

export interface StateSummary {
  state: string;
  code: string;
  totalAgencies: number;
  avgMedicareDenialRate: number;
  avgUtsteinSurvival: number;
  totalAfgAwardsYtd: number;
  medicaidExpansion: boolean;
  highPriorityLeadsCount: number;
  avgTransportMinutes: number;
  seniorPopPct: number;
}

export const STATE_SUMMARIES: Record<string, StateSummary> = ALL_50_STATES_SUMMARIES;

export const TERRITORY_CLUSTERS: TerritoryCluster[] = [
  {
    id: 'cluster-ohio-valley',
    name: 'Ohio Valley Resuscitation & Medicare Recovery Zone',
    states: ['OH', 'PA', 'WV'],
    description: 'High cardiac arrest incidence, low Utstein survival (23-26%), and elevated Medicare Part B claim denial rates (19-23%). Concentrated municipal fire-based EMS with aging Stryker/Philips fleets.',
    primaryClinicalDrivers: 'Low bystander CPR, high coronary artery disease prevalence, 9+ year old monitor fleets.',
    bestFitProducts: ['X Series Advanced', 'AutoPulse Resuscitation System', 'ZOLL Billing / AR Boost'],
    totalPipelineValue: 6450000,
    averageSurvivalRate: 24.8,
    averageTransportMinutes: 19.2,
    highPriorityAgencyCount: 7
  },
  {
    id: 'cluster-texas-gulf',
    name: 'Texas Sunbelt Highway & Rapid Transit Corridor',
    states: ['TX', 'LA'],
    description: 'Rapid suburban expansion, large coverage districts, longer transport times (24+ mins) to STEMI/Trauma centers. Non-expansion Medicaid state creating massive uncompensated care deficits.',
    primaryClinicalDrivers: 'Long transport distance to tertiary cath labs, high highway trauma rates, obsolete ventilator units.',
    bestFitProducts: ['AutoPulse Resuscitation System', 'Z Vent Transport Ventilator', 'X Series Advanced'],
    totalPipelineValue: 4890000,
    averageSurvivalRate: 22.4,
    averageTransportMinutes: 26.5,
    highPriorityAgencyCount: 6
  },
  {
    id: 'cluster-florida-senior',
    name: 'Florida Senior Demographic & Public Access Hotspot',
    states: ['FL'],
    description: 'Highest concentration of age 65+ residents in the United States (21.8% senior pop). Immense demand for Public Access Defibrillators (AEDs) in parks, transit, and condos, plus high 911 ALS run volumes.',
    primaryClinicalDrivers: 'High senior population density, seasonal cardiac arrest surges, significant Medicare billing volumes.',
    bestFitProducts: ['ZOLL AED 3 & Public Access Defibrillators', 'X Series Advanced', 'ZOLL Billing / AR Boost'],
    totalPipelineValue: 5820000,
    averageSurvivalRate: 26.5,
    averageTransportMinutes: 21.2,
    highPriorityAgencyCount: 5
  },
  {
    id: 'cluster-southeast-rural',
    name: 'Southeast Rural Transport & Mountain Terrain Corridor',
    states: ['NC', 'TN', 'VA'],
    description: 'Rural and mountainous jurisdictions where ambulance transport times exceed 30 minutes. Paramedics cannot perform manual CPR in transit for 30 minutes without profound fatigue.',
    primaryClinicalDrivers: 'Extensive transport times (>30 mins), limited paramedic staffing, high trauma incident volume.',
    bestFitProducts: ['AutoPulse Resuscitation System', 'Z Vent Transport Ventilator'],
    totalPipelineValue: 3950000,
    averageSurvivalRate: 25.1,
    averageTransportMinutes: 32.4,
    highPriorityAgencyCount: 4
  },
  {
    id: 'cluster-pacific-west',
    name: 'Pacific West Coast High-Density Urban & Transit Corridor',
    states: ['CA', 'WA', 'OR'],
    description: 'Major Pacific coast metropolitan centers and diverse regional EMS systems with high 9-1-1 volume, active STEMI networks, and rapid technological adoption.',
    primaryClinicalDrivers: 'High OHCA call volumes, multi-agency dispatch consolidation, rapid hardware lifecycle replacement.',
    bestFitProducts: ['X Series Advanced', 'AutoPulse Resuscitation System', 'ZOLL Respond & CAD'],
    totalPipelineValue: 8920000,
    averageSurvivalRate: 28.4,
    averageTransportMinutes: 20.2,
    highPriorityAgencyCount: 8
  },
  {
    id: 'cluster-mountain-west',
    name: 'Rocky Mountain & Desert Rural Critical Access Zone',
    states: ['CO', 'AZ', 'NV', 'UT', 'ID', 'NM'],
    description: 'Sprawling high-elevation and desert jurisdictions with prolonged rural transport times (26-38 mins) where mechanical ventilation and rugged telemetry are imperative.',
    primaryClinicalDrivers: 'Extended transport windows to Level 1 trauma centers, high senior migration, wilderness search and rescue.',
    bestFitProducts: ['Z Vent Transport Ventilator', 'AutoPulse Resuscitation System', 'X Series Advanced'],
    totalPipelineValue: 5640000,
    averageSurvivalRate: 26.2,
    averageTransportMinutes: 29.8,
    highPriorityAgencyCount: 6
  },
  {
    id: 'cluster-midwest-heartland',
    name: 'Great Lakes Industrial Heartland & EMS Consolidation',
    states: ['IL', 'MI', 'IN', 'WI', 'MN'],
    description: 'Dense municipal fire and countywide EMS departments managing legacy LIFEPAK fleets (>8 yrs old) and undergoing regional dispatch interoperability upgrades.',
    primaryClinicalDrivers: 'Aging legacy defibrillator fleets past manufacturer end-of-life, cold weather cardiac surges, regional mutual aid.',
    bestFitProducts: ['X Series Advanced', 'ZOLL RescueNet ePCR', 'AutoPulse Resuscitation System'],
    totalPipelineValue: 7120000,
    averageSurvivalRate: 27.1,
    averageTransportMinutes: 21.5,
    highPriorityAgencyCount: 7
  },
  {
    id: 'cluster-northeast-metro',
    name: 'Northeast Corridor High-Acuity STEMI & Hospital Consolidation',
    states: ['NY', 'MA', 'CT', 'NJ', 'MD'],
    description: 'Dense urban networks with high-volume municipal fire departments and academic medical center hospital networks demanding real-time clinical dashboards.',
    primaryClinicalDrivers: 'High cardiac volume per square mile, hospital electronic medical record integration, dense public transit AED deployments.',
    bestFitProducts: ['X Series Advanced', 'ZOLL AED 3 & Public Access Defibrillators', 'ZOLL RescueNet ePCR'],
    totalPipelineValue: 7850000,
    averageSurvivalRate: 29.2,
    averageTransportMinutes: 17.8,
    highPriorityAgencyCount: 8
  }
];

export const INITIAL_AGENCIES: Agency[] = [
  ...COMPREHENSIVE_NATIONWIDE_AGENCIES,
  ...ALL_50_STATES_ADDITIONAL_AGENCIES,
  {
    id: 'zoll-lead-001',
    name: 'Cuyahoga County Fire & Emergency Services',
    fdid: 'OH-03512',
    agencyType: 'Career Fire Department',
    jurisdictionLevel: 'County',
    state: 'Ohio',
    stateCode: 'OH',
    county: 'Cuyahoga County',
    city: 'Cleveland',
    zipCode: '44114',
    address: '1645 Superior Ave E, Cleveland, OH',
    latitude: 41.5038,
    longitude: -81.6749,
    populationServed: 1264000,
    responseAreaSqMiles: 458,
    stationsCount: 26,
    totalAmbulances: 34,
    totalFireEngines: 42,
    totalEMSStaff: 680,
    annualCallVolume: 104200,
    annual911Transports: 64800,
    annualCardiacArrestCalls: 1420,
    bystanderCPRRate: 38.4,
    utsteinSurvivalRate: 24.2,
    gisData: {
      populationDensityPerSqMile: 2760,
      medianHouseholdIncome: 56400,
      seniorPopulationPct: 18.9,
      povertyRate: 17.8,
      avgTransportTimeMinutes: 18.2,
      distanceToNearestCathLabMiles: 4.8,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 44.5,
      highRiseBuildingDensity: 'High',
      annualTraumaIncidents: 3850,
      fiscalBudgetCycleQuarter: 'Q4 (Oct-Dec)',
      territoryClusterId: 'cluster-ohio-valley',
      territoryClusterName: 'Ohio Valley Resuscitation & Medicare Recovery Zone'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 68.4,
      nemsqaChestCompressionFractionPct: 71.8,
      nemsqaEtco2VentilationCompliancePct: 52.1,
      nemsqaPediatricRespiratorySupportPct: 64.5,
      nemsqaStrokeLkwDocumentedPct: 76.2,
      nemsqaPainManagementEffectivePct: 71.0,
      caresGoodNeurologicalSurvivalPct: 7.2,
      ahaMissionLifelineTier: 'Silver',
      gadcsCostToChargeRatio: 0.69,
      commercialUnderpaymentPerTrip: 245
    },
    competitorContract: {
      vendor: 'Stryker ProCare',
      contractEndDate: '2026-12-31',
      renewalWindowDays: 75,
      annualServiceCostPerUnit: 2950,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Deliver X Series Advanced trade-in proposal before automatic 1-year ProCare renewal locks in on Dec 31.'
    },
    cmsData: {
      medicareBilledAnnual: 18450000,
      medicareAllowedAnnual: 14200000,
      claimDenialRate: 21.8,
      topDenialReason: 'Incomplete ALS Medical Necessity & Missing Origin/Dest Mileage Signatures',
      medicaidBilledAnnual: 9200000,
      commercialPayerMixPct: 32,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 785000
    },
    installedFleet: {
      defibBrand: 'Stryker LIFEPAK 15 (v2)',
      defibUnitsCount: 38,
      defibAgeYears: 9.4,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'Stryker LUCAS 2 (Aging)',
      cprUnitsCount: 18,
      transportVentilator: 'None / Bag-Valve-Mask Only',
      ventUnitsCount: 0,
      epcrCadSoftware: 'ImageTrend Elite (Legacy on-prem)',
      billingSoftware: 'In-House Municipal Clearinghouse'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 485000,
      afgFiscalYear: 2025,
      afgPurpose: 'Operations and Safety - EMS Advanced Cardiac Equipment Replacement',
      saferGrantActive: true,
      fiscalYearEndMonth: 'December'
    },
    zollOpportunity: {
      pulseIqScore: 96,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'X Series Advanced',
      recommendedBundle: [
        '38x X Series Advanced with Real BVM Help & TBI Dashboard',
        '26x AutoPulse Resuscitation Systems for frontline ALS rigs',
        'ZOLL Billing & AR Boost integration to reclaim $785K annual CMS denials'
      ],
      projectedPipelineValue: 1680000,
      clinicalBenefitNarrative: 'Replacing aging LP15s with X Series Real BVM Help will reduce deadly hyperventilation during cardiac arrest. AutoPulse deployment directly addresses county low ROSC rate (24.2% vs 29.7% national benchmark).',
      financialRoiNarrative: 'AFG grant of $485K is currently active and unspent. ZOLL Billing claim scrubbing guarantees recovery of ~$785K in denied Medicare ground ambulance transports.',
      scoreRationale: 'Score 96/100: Cuyahoga exhibits extreme clinical and financial readiness. The fleet of 38 Stryker LP15s is 9.4 years old and out of warranty (25/25 fleet obsolescence). County cardiac survival of 24.2% is well below the 29.7% benchmark with 1,420 annual OHCA runs (24/25 clinical acuity). The 21.8% Medicare denial rate yields $785K in recoverable cash flow (19/20 CMS financial). Awarded $485K in active FY25 AFG funds with a Q4 budget surplus deadline (15/15 budget readiness), and high senior population density (13/15 demographics).',
      scoreBreakdown: {
        clinicalAcuityPts: 24,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 19,
        demographicVulnerabilityPts: 13,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'Demo Scheduled',
      probabilityPct: 85
    },
    officialWebsite: 'https://www.clevelandohio.gov/city-hall/departments/public-safety/divisions/fire',
    headquartersPhone: '(216) 664-6800',
    keyContacts: [
      { id: 'c1', name: 'Cleveland / Cuyahoga Fire & EMS Command', title: 'Division of Fire & EMS Headquarters', role: 'Fire Chief', email: '', phone: '(216) 664-6800', officialWebsite: 'https://www.clevelandohio.gov/city-hall/departments/public-safety/divisions/fire', headquartersAddress: '1645 Superior Ave E, Cleveland, OH 44114', isVerifiedOfficial: true },
      { id: 'c2', name: 'Office of EMS Medical Direction', title: 'County EMS Medical Director Office', role: 'Medical Director', email: '', phone: '(216) 664-2555', officialWebsite: 'https://www.clevelandohio.gov/city-hall/departments/public-safety/divisions/emergency-medical-service', headquartersAddress: '1701 Lakeside Ave E, Cleveland, OH 44114', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-1',
        date: '2026-10-04',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Met with Capt. Kowalski at Station 1. Demonstrated X Series Advanced Real BVM Help live on mannequin. Kowalski was blown away by ventilation bar graph. He confirmed 14 of their LP15s failed bench test last month.',
        nextAction: 'Deliver evaluation units for 30-day clinical trial to Station 1 & 4 crews',
        dueDate: '2026-10-24'
      }
    ],
    lastContactDate: '2026-10-04',
    isBookmarked: true,
    inDayRoute: true
  },
  {
    id: 'zoll-lead-002',
    name: 'Harris County Emergency Corps',
    fdid: 'TX-10144',
    agencyType: 'Municipal 3rd Service EMS',
    jurisdictionLevel: 'County',
    state: 'Texas',
    stateCode: 'TX',
    county: 'Harris County',
    city: 'Houston',
    zipCode: '77037',
    address: '2500 Aldine Bender Rd, Houston, TX',
    latitude: 29.9072,
    longitude: -95.3852,
    populationServed: 540000,
    responseAreaSqMiles: 210,
    stationsCount: 14,
    totalAmbulances: 24,
    totalFireEngines: 0,
    totalEMSStaff: 240,
    annualCallVolume: 46200,
    annual911Transports: 31800,
    annualCardiacArrestCalls: 780,
    bystanderCPRRate: 31.0,
    utsteinSurvivalRate: 21.8,
    gisData: {
      populationDensityPerSqMile: 2570,
      medianHouseholdIncome: 49200,
      seniorPopulationPct: 12.8,
      povertyRate: 20.4,
      avgTransportTimeMinutes: 27.4,
      distanceToNearestCathLabMiles: 14.2,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 56.0,
      highRiseBuildingDensity: 'Moderate',
      annualTraumaIncidents: 2940,
      fiscalBudgetCycleQuarter: 'Q3 (Jul-Sep)',
      territoryClusterId: 'cluster-texas-gulf',
      territoryClusterName: 'Texas Sunbelt Highway & Rapid Transit Corridor'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 61.5,
      nemsqaChestCompressionFractionPct: 65.2,
      nemsqaEtco2VentilationCompliancePct: 47.9,
      nemsqaPediatricRespiratorySupportPct: 58.0,
      nemsqaStrokeLkwDocumentedPct: 68.5,
      nemsqaPainManagementEffectivePct: 64.2,
      caresGoodNeurologicalSurvivalPct: 6.4,
      ahaMissionLifelineTier: 'Not Recognized / Gap',
      gadcsCostToChargeRatio: 0.74,
      commercialUnderpaymentPerTrip: 310
    },
    competitorContract: {
      vendor: 'Philips Master Service',
      contractEndDate: '2026-11-30',
      renewalWindowDays: 45,
      annualServiceCostPerUnit: 3400,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Philips MRx parts discontinuation letter has been issued. Pitch emergency trade-in before service lapses.'
    },
    cmsData: {
      medicareBilledAnnual: 12200000,
      medicareAllowedAnnual: 8900000,
      claimDenialRate: 24.6,
      topDenialReason: 'Repetitive Transport Prior Authorization Lapse & GADCS Cost Allocation Errors',
      medicaidBilledAnnual: 5400000,
      commercialPayerMixPct: 24,
      gadcsReportingStatus: 'Pending Audit',
      estimatedRecoverableRevenue: 920000
    },
    installedFleet: {
      defibBrand: 'Philips HeartStart MRx [End of Life]',
      defibUnitsCount: 26,
      defibAgeYears: 11.2,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'None / Manual Only',
      cprUnitsCount: 0,
      transportVentilator: 'Impact Uni-Vent 754 (Obsolete)',
      ventUnitsCount: 8,
      epcrCadSoftware: 'ESO Solutions',
      billingSoftware: 'Third-Party Clearinghouse'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 320000,
      afgFiscalYear: 2025,
      afgPurpose: 'Defibrillator Fleet Replacement - Philips EOL Mandate',
      saferGrantActive: false,
      fiscalYearEndMonth: 'September'
    },
    zollOpportunity: {
      pulseIqScore: 98,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'X Series Advanced',
      recommendedBundle: [
        '26x X Series Advanced with Dual ECG & TBI Dashboard',
        '16x AutoPulse Resuscitation Systems for frontline ambulances',
        '8x Z Vent Portable Ventilators to replace obsolete Impact units'
      ],
      projectedPipelineValue: 1240000,
      clinicalBenefitNarrative: 'Philips MRx parts are no longer manufactured; service risk is severe. Moving to ZOLL provides military-grade reliability and automated mechanical CPR for high-density highway transport times.',
      financialRoiNarrative: 'Highest Medicare denial rate in the district (24.6%). Deploying ZOLL Billing + ePCR validation can recapture ~$920K annually.',
      scoreRationale: 'Score 98/100: Harris County represents the highest clinical urgency in Region 6. Philips MRx units are 11.2 years old with zero factory support (25/25 fleet obsolescence). Extended 27.4-minute highway transport times to Texas Medical Center cause acute CPR fatigue; Utstein survival is just 21.8% (25/25 clinical acuity). The 24.6% CMS denial rate is the worst in the territory with $920K in uncaptured revenue (20/20 CMS financial). Has $320K in unexpended AFG funds (14/15 budget) and high poverty/uninsured patient index (14/15 demographics).',
      scoreBreakdown: {
        clinicalAcuityPts: 25,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 20,
        demographicVulnerabilityPts: 14,
        budgetGrantReadinessPts: 14
      },
      salesStage: 'RFP / Quoting',
      probabilityPct: 90
    },
    officialWebsite: 'https://hcec.com',
    headquartersPhone: '(281) 449-3131',
    keyContacts: [
      { id: 'c4', name: 'Chief Jeremy Adams', title: 'Executive Director of EMS', role: 'EMS Chief', email: '', phone: '(281) 449-3131', officialWebsite: 'https://hcec.com', headquartersAddress: '2800 Aldine Bender Rd, Houston, TX 77032', isVerifiedOfficial: true },
      { id: 'c5', name: 'HCEC Office of the Medical Director', title: 'EMS Clinical & Medical Direction', role: 'Medical Director', email: '', phone: '(281) 449-3131', officialWebsite: 'https://hcec.com', headquartersAddress: '2800 Aldine Bender Rd, Houston, TX 77032', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-2',
        date: '2026-10-09',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'RFP Review',
        notes: 'Chief Adams verified their Philips MRx units will not receive state certification next quarter. RFP draft is favoring ZOLL X Series Real BVM Help specs.',
        nextAction: 'Submit formal bid response through Houston-Galveston Area Council (HGACBuy) cooperative contract',
        dueDate: '2026-10-28'
      }
    ],
    lastContactDate: '2026-10-09',
    isBookmarked: true,
    inDayRoute: true
  },
  {
    id: 'zoll-lead-003',
    name: 'Pinellas County Emergency Medical Services',
    fdid: 'FL-05201',
    agencyType: 'Municipal 3rd Service EMS',
    jurisdictionLevel: 'County',
    state: 'Florida',
    stateCode: 'FL',
    county: 'Pinellas County',
    city: 'Clearwater',
    zipCode: '33756',
    address: '10750 Ulmerton Rd, Largo, FL',
    latitude: 27.8967,
    longitude: -82.7844,
    populationServed: 960000,
    responseAreaSqMiles: 280,
    stationsCount: 28,
    totalAmbulances: 46,
    totalFireEngines: 32,
    totalEMSStaff: 540,
    annualCallVolume: 142000,
    annual911Transports: 92000,
    annualCardiacArrestCalls: 2240,
    bystanderCPRRate: 36.2,
    utsteinSurvivalRate: 25.4,
    gisData: {
      populationDensityPerSqMile: 3420,
      medianHouseholdIncome: 62800,
      seniorPopulationPct: 26.4,
      povertyRate: 11.8,
      avgTransportTimeMinutes: 19.5,
      distanceToNearestCathLabMiles: 6.2,
      traumaCenterLevel: 'Level 2 Trauma',
      publicAccessAedDeficitPct: 62.5,
      highRiseBuildingDensity: 'High',
      annualTraumaIncidents: 2810,
      fiscalBudgetCycleQuarter: 'Q3 (Jul-Sep)',
      territoryClusterId: 'cluster-florida-senior',
      territoryClusterName: 'Florida Senior Demographic & Public Access Hotspot'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 74.5,
      nemsqaChestCompressionFractionPct: 71.0,
      nemsqaEtco2VentilationCompliancePct: 56.4,
      nemsqaPediatricRespiratorySupportPct: 68.2,
      nemsqaStrokeLkwDocumentedPct: 81.0,
      nemsqaPainManagementEffectivePct: 76.5,
      caresGoodNeurologicalSurvivalPct: 7.8,
      ahaMissionLifelineTier: 'Silver',
      gadcsCostToChargeRatio: 0.65,
      commercialUnderpaymentPerTrip: 280
    },
    competitorContract: {
      vendor: 'Philips Master Service',
      contractEndDate: '2027-01-15',
      renewalWindowDays: 90,
      annualServiceCostPerUnit: 3100,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Pitch municipal package combining ZOLL AED 3 for high-rise condos with X Series trade-in.'
    },
    cmsData: {
      medicareBilledAnnual: 34500000,
      medicareAllowedAnnual: 27800000,
      claimDenialRate: 19.8,
      topDenialReason: 'Medicare Advantage Managed Care Pre-Authorization Denial',
      medicaidBilledAnnual: 6800000,
      commercialPayerMixPct: 38,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 1320000
    },
    installedFleet: {
      defibBrand: 'Philips HeartStart MRx [End of Life]',
      defibUnitsCount: 42,
      defibAgeYears: 9.8,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'None / Manual Only',
      cprUnitsCount: 0,
      transportVentilator: 'Impact 754 (Obsolete)',
      ventUnitsCount: 12,
      epcrCadSoftware: 'Custom County CAD / ImageTrend',
      billingSoftware: 'Digitech'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 540000,
      afgFiscalYear: 2025,
      afgPurpose: 'Senior Community Cardiac Resuscitation & Public Access Defibrillators',
      saferGrantActive: false,
      fiscalYearEndMonth: 'September'
    },
    zollOpportunity: {
      pulseIqScore: 97,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'ZOLL AED 3 & Public Access Defibrillators',
      recommendedBundle: [
        '120x ZOLL AED 3 with PlusTrac Cloud Monitoring for senior condos and municipal facilities',
        '42x X Series Advanced with Real BVM Help & TBI Dashboards',
        '28x AutoPulse Resuscitation Systems for high-rise senior living extrications',
        'ZOLL Billing with AR Boost to capture $1.32M in denied Medicare Advantage claims'
      ],
      projectedPipelineValue: 2450000,
      clinicalBenefitNarrative: 'Pinellas County has the densest senior retirement population in Florida (26.4% age 65+). High-rise condo extrications cause severe chest compression interruptions. Deploying ZOLL AED 3 in residential complexes combined with AutoPulse on medic rigs will transform survival.',
      financialRoiNarrative: 'Massive $1.32M revenue recovery opportunity using ZOLL AR Boost to discover commercial insurance policies on Medicare Advantage denials.',
      scoreRationale: 'Score 97/100: Top demographic opportunity in the country for combined Public Access AED and ACLS monitors. Over 26.4% of residents are 65+ with 2,240 annual cardiac arrests (15/15 demographic vulnerability, 24/25 clinical acuity). Existing 42 Philips MRx monitors are 9.8 years old and sunsetted (25/25 fleet obsolescence). $540K AFG award active with $1.32M in recoverable CMS claims (19/20 CMS financial, 14/15 budget readiness).',
      scoreBreakdown: {
        clinicalAcuityPts: 24,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 19,
        demographicVulnerabilityPts: 15,
        budgetGrantReadinessPts: 14
      },
      salesStage: 'Demo Scheduled',
      probabilityPct: 88
    },
    officialWebsite: 'https://pinellas.gov/department/safety-and-emergency-services/',
    headquartersPhone: '(727) 582-2000',
    keyContacts: [
      { id: 'c22', name: 'Craig Hare', title: 'Director of EMS & Fire Administration', role: 'EMS Chief', email: '', phone: '(727) 582-2000', officialWebsite: 'https://pinellas.gov/department/safety-and-emergency-services/', headquartersAddress: '12490 Ulmerton Rd, Largo, FL 33774', isVerifiedOfficial: true },
      { id: 'c23', name: 'Dr. Angus Jameson, MD', title: 'Pinellas County EMS Medical Director', role: 'Medical Director', email: '', phone: '(727) 582-2000', officialWebsite: 'https://pinellas.gov/department/safety-and-emergency-services/', headquartersAddress: '12490 Ulmerton Rd, Largo, FL 33774', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-11',
        date: '2026-10-10',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Director Hare emphasized the county commission mandate to install 100+ public access AEDs in senior residential hubs. Demonstrated ZOLL AED 3 child mode and PlusTrac cloud self-testing dashboard.',
        nextAction: 'Deliver master proposal with Sourcewell contract pricing to County Board on Nov 12',
        dueDate: '2026-11-01'
      }
    ],
    lastContactDate: '2026-10-10',
    isBookmarked: true,
    inDayRoute: false
  },
  {
    id: 'zoll-lead-004',
    name: 'McDowell County EMS & Mountain Rescue',
    fdid: 'NC-56001',
    agencyType: 'Municipal 3rd Service EMS',
    jurisdictionLevel: 'County',
    state: 'North Carolina',
    stateCode: 'NC',
    county: 'McDowell County',
    city: 'Marion',
    zipCode: '28752',
    address: '60 East Court St, Marion, NC',
    latitude: 35.6840,
    longitude: -81.9998,
    populationServed: 45000,
    responseAreaSqMiles: 442,
    stationsCount: 6,
    totalAmbulances: 10,
    totalFireEngines: 0,
    totalEMSStaff: 72,
    annualCallVolume: 12400,
    annual911Transports: 8600,
    annualCardiacArrestCalls: 240,
    bystanderCPRRate: 24.1,
    utsteinSurvivalRate: 18.2,
    gisData: {
      populationDensityPerSqMile: 102,
      medianHouseholdIncome: 44100,
      seniorPopulationPct: 21.2,
      povertyRate: 18.5,
      avgTransportTimeMinutes: 34.6,
      distanceToNearestCathLabMiles: 38.5,
      traumaCenterLevel: 'Level 3 / Critical Access',
      publicAccessAedDeficitPct: 68.0,
      highRiseBuildingDensity: 'Low',
      annualTraumaIncidents: 940,
      fiscalBudgetCycleQuarter: 'Q2 (Apr-Jun)',
      territoryClusterId: 'cluster-southeast-rural',
      territoryClusterName: 'Southeast Rural Transport & Mountain Terrain Corridor'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 54.8,
      nemsqaChestCompressionFractionPct: 58.2,
      nemsqaEtco2VentilationCompliancePct: 42.0,
      nemsqaPediatricRespiratorySupportPct: 52.4,
      nemsqaStrokeLkwDocumentedPct: 64.0,
      nemsqaPainManagementEffectivePct: 68.0,
      caresGoodNeurologicalSurvivalPct: 5.1,
      ahaMissionLifelineTier: 'Not Recognized / Gap',
      gadcsCostToChargeRatio: 0.78,
      commercialUnderpaymentPerTrip: 295
    },
    competitorContract: {
      vendor: 'Medtronic Legacy',
      contractEndDate: '2026-10-31',
      renewalWindowDays: 15,
      annualServiceCostPerUnit: 1800,
      status: 'Month-to-Month / Lapsed',
      actionRecommendation: 'Service contract has effectively lapsed; units are past mandatory battery lifecycle. Immediate conversion opportunity.'
    },
    cmsData: {
      medicareBilledAnnual: 3400000,
      medicareAllowedAnnual: 2500000,
      claimDenialRate: 23.2,
      topDenialReason: 'Rural Mileage Disallowance & Physician Medical Necessity Sign-off Delay',
      medicaidBilledAnnual: 1850000,
      commercialPayerMixPct: 18,
      gadcsReportingStatus: 'Pending Audit',
      estimatedRecoverableRevenue: 285000
    },
    installedFleet: {
      defibBrand: 'Medtronic LIFEPAK 12 [Obsolete]',
      defibUnitsCount: 12,
      defibAgeYears: 14.1,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'None / Manual Only',
      cprUnitsCount: 0,
      transportVentilator: 'None / Bag-Valve-Mask Only',
      ventUnitsCount: 0,
      epcrCadSoftware: 'Legacy State Registry',
      billingSoftware: 'In-House Municipal'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 380000,
      afgFiscalYear: 2025,
      afgPurpose: 'Rural EMS Cardiac and Mechanical Transport Ventilation Initiative',
      saferGrantActive: false,
      fiscalYearEndMonth: 'June'
    },
    zollOpportunity: {
      pulseIqScore: 99,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'AutoPulse Resuscitation System',
      recommendedBundle: [
        '8x AutoPulse Resuscitation Systems for continuous CPR during 35-min mountain transit',
        '8x Z Vent Tactical Ventilators with internal air compressor',
        '10x X Series Advanced with 12-lead STEMI cellular transmission to Mission Hospital cath lab'
      ],
      projectedPipelineValue: 690000,
      clinicalBenefitNarrative: 'Paramedics face 34.6-minute average transport times down winding Blue Ridge mountain roads to Asheville. Manual chest compressions are physically impossible to maintain with quality during high-G turns. AutoPulse and Z Vent will revolutionize rural patient outcomes.',
      financialRoiNarrative: 'Full fleet replacement funded 100% by active $380K AFG award + $285K recovered through ZOLL Billing claim scrubbing.',
      scoreRationale: 'Score 99/100: Textbook case of extreme clinical necessity combined with total equipment obsolescence. Medtronic LP12 monitors are 14.1 years old (25/25 fleet obsolescence). Extreme 34.6-minute transport times and 38-mile distance to nearest cath lab make continuous mechanical CPR an absolute lifesaver; survival is only 18.2% (25/25 clinical acuity). $380K AFG award covers over 55% of the capital bundle (15/15 budget readiness). High poverty rural population with 21.2% seniors (14/15 demographics) and 23.2% Medicare denial rate (20/20 CMS financial).',
      scoreBreakdown: {
        clinicalAcuityPts: 25,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 20,
        demographicVulnerabilityPts: 14,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'RFP / Quoting',
      probabilityPct: 94
    },
    officialWebsite: 'https://www.mcdowellgov.com/departments/emergency-services',
    headquartersPhone: '(828) 652-3982',
    keyContacts: [
      { id: 'c24', name: 'Chief William Kehler', title: 'Emergency Services Director', role: 'EMS Chief', email: '', phone: '(828) 652-3982', officialWebsite: 'https://www.mcdowellgov.com/departments/emergency-services', headquartersAddress: '5095 US-70 West, Marion, NC 28752', isVerifiedOfficial: true },
      { id: 'c25', name: 'Office of the Medical Director', title: 'McDowell County EMS Medical Direction', role: 'Medical Director', email: '', phone: '(828) 652-3982', officialWebsite: 'https://www.mcdowellgov.com/departments/emergency-services', headquartersAddress: '5095 US-70 West, Marion, NC 28752', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-12',
        date: '2026-10-13',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'Ride-Along',
        notes: 'Joined Medic 2 crew on a mountain transport from Old Fort to Asheville. Medics had to perform chest compressions while swaying through tight curves. Crew Captain confirmed an AutoPulse would completely change their clinical reality.',
        nextAction: 'Finalize grant purchase contract through Sourcewell',
        dueDate: '2026-10-29'
      }
    ],
    lastContactDate: '2026-10-13',
    isBookmarked: true,
    inDayRoute: true
  },
  {
    id: 'zoll-lead-005',
    name: 'Akron Fire Department',
    fdid: 'OH-77001',
    agencyType: 'Career Fire Department',
    jurisdictionLevel: 'Local',
    state: 'Ohio',
    stateCode: 'OH',
    county: 'Summit County',
    city: 'Akron',
    zipCode: '44308',
    address: '81 S High St, Akron, OH',
    latitude: 41.0814,
    longitude: -81.5190,
    populationServed: 190000,
    responseAreaSqMiles: 62,
    stationsCount: 13,
    totalAmbulances: 15,
    totalFireEngines: 16,
    totalEMSStaff: 320,
    annualCallVolume: 48500,
    annual911Transports: 31200,
    annualCardiacArrestCalls: 620,
    bystanderCPRRate: 34.2,
    utsteinSurvivalRate: 23.5,
    gisData: {
      populationDensityPerSqMile: 3060,
      medianHouseholdIncome: 43200,
      seniorPopulationPct: 16.4,
      povertyRate: 23.1,
      avgTransportTimeMinutes: 14.8,
      distanceToNearestCathLabMiles: 3.1,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 52.0,
      highRiseBuildingDensity: 'Moderate',
      annualTraumaIncidents: 1820,
      fiscalBudgetCycleQuarter: 'Q4 (Oct-Dec)',
      territoryClusterId: 'cluster-ohio-valley',
      territoryClusterName: 'Ohio Valley Resuscitation & Medicare Recovery Zone'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 69.2,
      nemsqaChestCompressionFractionPct: 68.0,
      nemsqaEtco2VentilationCompliancePct: 51.5,
      nemsqaPediatricRespiratorySupportPct: 62.0,
      nemsqaStrokeLkwDocumentedPct: 74.0,
      nemsqaPainManagementEffectivePct: 70.5,
      caresGoodNeurologicalSurvivalPct: 7.0,
      ahaMissionLifelineTier: 'Bronze',
      gadcsCostToChargeRatio: 0.72,
      commercialUnderpaymentPerTrip: 230
    },
    competitorContract: {
      vendor: 'Philips Master Service',
      contractEndDate: '2026-12-15',
      renewalWindowDays: 60,
      annualServiceCostPerUnit: 3200,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Philips contract expires in December; deliver AutoPulse and X Series proposal before City Council budget session.'
    },
    cmsData: {
      medicareBilledAnnual: 8400000,
      medicareAllowedAnnual: 6500000,
      claimDenialRate: 22.4,
      topDenialReason: 'Inadequate Narrative Justification for Advanced Life Support (ALS-2) Level',
      medicaidBilledAnnual: 4800000,
      commercialPayerMixPct: 22,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 425000
    },
    installedFleet: {
      defibBrand: 'Philips HeartStart MRx [End of Life]',
      defibUnitsCount: 18,
      defibAgeYears: 10.5,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'None / Manual Only',
      cprUnitsCount: 0,
      transportVentilator: 'None / Bag-Valve-Mask Only',
      ventUnitsCount: 0,
      epcrCadSoftware: 'ImageTrend Elite',
      billingSoftware: 'Municipal City Auditor'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 290000,
      afgFiscalYear: 2025,
      afgPurpose: 'Firefighter Safety - CPR and Resuscitation Hardware',
      saferGrantActive: false,
      fiscalYearEndMonth: 'December'
    },
    zollOpportunity: {
      pulseIqScore: 97,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'AutoPulse Resuscitation System',
      recommendedBundle: [
        '13x AutoPulse Resuscitation Systems for all frontline engines and medic units',
        '18x X Series Advanced Monitor/Defibrillators',
        'ZOLL RescueNet clinical documentation upgrade'
      ],
      projectedPipelineValue: 780000,
      clinicalBenefitNarrative: 'Akron cardiac arrest survival is 23.5%, well below the state average. Zero mechanical CPR currently on rigs. AutoPulse will solve chest compression degradation during transport.',
      financialRoiNarrative: 'Awarded $290K in AFG FY2025 funds specifically for resuscitation devices. City auditor struggling with 22.4% Medicare claim denials.',
      scoreRationale: 'Score 97/100: Akron exhibits high municipal poverty (23.1%) and a severe 22.4% Medicare claim denial rate. Zero mechanical CPR units currently in service across 620 cardiac arrest calls annually (24/25 clinical acuity). The 18 Philips MRx units are 10.5 years old with expired support (25/25 fleet obsolescence). Awarded $290K AFG with a December FY budget deadline (15/15 budget readiness), plus $425K in recoverable CMS revenue (19/20 CMS financial).',
      scoreBreakdown: {
        clinicalAcuityPts: 24,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 19,
        demographicVulnerabilityPts: 14,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'Demo Scheduled',
      probabilityPct: 88
    },
    officialWebsite: 'https://www.akronohio.gov/departments/fire/',
    headquartersPhone: '(330) 375-2101',
    keyContacts: [
      { id: 'c10', name: 'Chief Leon Henderson', title: 'Fire Chief', role: 'Fire Chief', email: '', phone: '(330) 375-2101', officialWebsite: 'https://www.akronohio.gov/departments/fire/', headquartersAddress: '81 S High St, Akron, OH 44308', isVerifiedOfficial: true },
      { id: 'c11', name: 'Akron Fire EMS Bureau', title: 'EMS Operations & Administration', role: 'EMS Chief', email: '', phone: '(330) 375-2101', officialWebsite: 'https://www.akronohio.gov/departments/fire/', headquartersAddress: '81 S High St, Akron, OH 44308', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-5',
        date: '2026-10-14',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Station 2 demo with District Chief Miller. Medics practiced strapping AutoPulse on rescue mannequin. Medic crew raved about the quick-deploy harness and single-person application.',
        nextAction: 'Deliver formal procurement packet before City Council committee meeting on Nov 3rd',
        dueDate: '2026-10-27'
      }
    ],
    lastContactDate: '2026-10-14',
    isBookmarked: true,
    inDayRoute: true
  },
  {
    id: 'zoll-lead-006',
    name: 'Miami-Dade Fire Rescue (MDFR)',
    fdid: 'FL-01300',
    agencyType: 'Career Fire Department',
    jurisdictionLevel: 'County',
    state: 'Florida',
    stateCode: 'FL',
    county: 'Miami-Dade County',
    city: 'Doral',
    zipCode: '33178',
    address: '9300 NW 41st St, Doral, FL',
    latitude: 25.8118,
    longitude: -80.3475,
    populationServed: 2700000,
    responseAreaSqMiles: 1883,
    stationsCount: 71,
    totalAmbulances: 92,
    totalFireEngines: 84,
    totalEMSStaff: 2100,
    annualCallVolume: 274000,
    annual911Transports: 182000,
    annualCardiacArrestCalls: 3400,
    bystanderCPRRate: 36.5,
    utsteinSurvivalRate: 26.2,
    gisData: {
      populationDensityPerSqMile: 1430,
      medianHouseholdIncome: 57800,
      seniorPopulationPct: 17.2,
      povertyRate: 15.6,
      avgTransportTimeMinutes: 22.4,
      distanceToNearestCathLabMiles: 5.5,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 48.0,
      highRiseBuildingDensity: 'High',
      annualTraumaIncidents: 6850,
      fiscalBudgetCycleQuarter: 'Q3 (Jul-Sep)',
      territoryClusterId: 'cluster-florida-senior',
      territoryClusterName: 'Florida Senior Demographic & Public Access Hotspot'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 76.2,
      nemsqaChestCompressionFractionPct: 74.0,
      nemsqaEtco2VentilationCompliancePct: 59.0,
      nemsqaPediatricRespiratorySupportPct: 71.5,
      nemsqaStrokeLkwDocumentedPct: 83.0,
      nemsqaPainManagementEffectivePct: 78.0,
      caresGoodNeurologicalSurvivalPct: 8.1,
      ahaMissionLifelineTier: 'Gold',
      gadcsCostToChargeRatio: 0.62,
      commercialUnderpaymentPerTrip: 260
    },
    competitorContract: {
      vendor: 'Stryker ProCare',
      contractEndDate: '2027-03-31',
      renewalWindowDays: 165,
      annualServiceCostPerUnit: 2800,
      status: 'Active Term',
      actionRecommendation: 'Initiate clinical trial evaluation now to position X Series Advanced for upcoming FY27 capital budget review.'
    },
    cmsData: {
      medicareBilledAnnual: 48900000,
      medicareAllowedAnnual: 38200000,
      claimDenialRate: 21.9,
      topDenialReason: 'Prior Authorization & Destination Requirement Audit',
      medicaidBilledAnnual: 18500000,
      commercialPayerMixPct: 35,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 2340000
    },
    installedFleet: {
      defibBrand: 'Stryker LIFEPAK 15',
      defibUnitsCount: 110,
      defibAgeYears: 8.2,
      defibWarrantyStatus: 'Third-Party',
      mechanicalCPR: 'Stryker LUCAS 3 (60 units)',
      cprUnitsCount: 60,
      transportVentilator: 'Hamilton T1 (30 units)',
      ventUnitsCount: 30,
      epcrCadSoftware: 'Custom County CAD / ImageTrend',
      billingSoftware: 'Digitech'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 750000,
      afgFiscalYear: 2025,
      afgPurpose: 'Regional Mass Casualty & Advanced Resuscitation Resilience',
      saferGrantActive: true,
      fiscalYearEndMonth: 'September'
    },
    zollOpportunity: {
      pulseIqScore: 95,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'X Series Advanced',
      recommendedBundle: [
        '110x X Series Advanced with Real BVM Help & TBI Dashboards',
        '70x Z Vent Tactical Ventilators for high-heat transport endurance',
        'ZOLL Billing enterprise integration targeting $2.34M Medicare recovery'
      ],
      projectedPipelineValue: 4800000,
      clinicalBenefitNarrative: 'Massive cardiac call volume (3,400 OHCA cases). Standardizing on X Series Real BVM Help gives MDFR uniform clinical telemetry across all air rescue helicopters and ground units.',
      financialRoiNarrative: 'Largest single revenue recovery opportunity in the state: $2.34M in annual denied claims due to documentation gaps.',
      scoreRationale: 'Score 95/100: Highest aggregate dollar value in the Southern region ($4.8M pipeline). 3,400 annual cardiac arrest calls and 6,850 trauma incidents across a 1,883 sq mile area (25/25 clinical acuity). The 110 Stryker LP15 units are entering their 9th year with steep third-party maintenance charges (22/25 fleet obsolescence). $2.34M in recoverable CMS claims provides overwhelming fiscal justification for the Board of County Commissioners (20/20 CMS financial). Awarded $750K in AFG FY25 funds (15/15 budget readiness).',
      scoreBreakdown: {
        clinicalAcuityPts: 25,
        fleetObsolescencePts: 22,
        cmsFinancialPts: 20,
        demographicVulnerabilityPts: 13,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'Clinical Evaluation Trial',
      probabilityPct: 82
    },
    officialWebsite: 'https://www.miamidade.gov/global/fire/home.page',
    headquartersPhone: '(786) 331-5000',
    keyContacts: [
      { id: 'c12', name: 'Chief Ray Jadallah', title: 'Fire Chief', role: 'Fire Chief', email: '', phone: '(786) 331-5000', officialWebsite: 'https://www.miamidade.gov/global/fire/home.page', headquartersAddress: '9300 NW 41st St, Doral, FL 33178', isVerifiedOfficial: true },
      { id: 'c13', name: 'MDFR Emergency Medical Services Division', title: 'Office of the EMS Medical Director', role: 'Medical Director', email: '', phone: '(786) 331-4400', officialWebsite: 'https://www.miamidade.gov/global/fire/home.page', headquartersAddress: '9300 NW 41st St, Doral, FL 33178', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-6',
        date: '2026-10-02',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Presented to Battalion Chiefs and Dr. Lloyd. Dr. Lloyd confirmed interest in EPIC TBI guidelines compliance to protect trauma patients.',
        nextAction: 'Deliver 6 pilot test units to Station 2 and Station 34 for 60-day road trials',
        dueDate: '2026-11-10'
      }
    ],
    lastContactDate: '2026-10-02',
    isBookmarked: true,
    inDayRoute: false
  },
  {
    id: 'zoll-lead-008',
    name: 'Allegheny County Emergency Services',
    fdid: 'PA-02008',
    agencyType: 'Volunteer / Combination Fire',
    jurisdictionLevel: 'County',
    state: 'Pennsylvania',
    stateCode: 'PA',
    county: 'Allegheny County',
    city: 'Pittsburgh',
    zipCode: '15219',
    address: '400 North Lexington St, Pittsburgh, PA',
    latitude: 40.4406,
    longitude: -79.9959,
    populationServed: 1210000,
    responseAreaSqMiles: 745,
    stationsCount: 44,
    totalAmbulances: 48,
    totalFireEngines: 62,
    totalEMSStaff: 750,
    annualCallVolume: 92400,
    annual911Transports: 58000,
    annualCardiacArrestCalls: 1280,
    bystanderCPRRate: 35.1,
    utsteinSurvivalRate: 25.1,
    gisData: {
      populationDensityPerSqMile: 1620,
      medianHouseholdIncome: 63500,
      seniorPopulationPct: 19.8,
      povertyRate: 12.2,
      avgTransportTimeMinutes: 21.0,
      distanceToNearestCathLabMiles: 4.2,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 58.2,
      highRiseBuildingDensity: 'Moderate',
      annualTraumaIncidents: 2410,
      fiscalBudgetCycleQuarter: 'Q4 (Oct-Dec)',
      territoryClusterId: 'cluster-ohio-valley',
      territoryClusterName: 'Ohio Valley Resuscitation & Medicare Recovery Zone'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 59.2,
      nemsqaChestCompressionFractionPct: 62.4,
      nemsqaEtco2VentilationCompliancePct: 46.0,
      nemsqaPediatricRespiratorySupportPct: 55.0,
      nemsqaStrokeLkwDocumentedPct: 67.2,
      nemsqaPainManagementEffectivePct: 66.0,
      caresGoodNeurologicalSurvivalPct: 6.8,
      ahaMissionLifelineTier: 'Not Recognized / Gap',
      gadcsCostToChargeRatio: 0.76,
      commercialUnderpaymentPerTrip: 275
    },
    competitorContract: {
      vendor: 'Third-Party ISO',
      contractEndDate: '2026-11-15',
      renewalWindowDays: 30,
      annualServiceCostPerUnit: 2200,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Third-party service contract ends in 30 days. Board is meeting to allocate $640K AFG grant; prime time to present.'
    },
    cmsData: {
      medicareBilledAnnual: 17200000,
      medicareAllowedAnnual: 13500000,
      claimDenialRate: 21.5,
      topDenialReason: 'Volunteer Agency Incomplete Crew Credentialing & Medical Director Sign-off',
      medicaidBilledAnnual: 6100000,
      commercialPayerMixPct: 30,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 795000
    },
    installedFleet: {
      defibBrand: 'Stryker LIFEPAK 12 / 15 Mixed',
      defibUnitsCount: 52,
      defibAgeYears: 10.8,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'None / Manual Only',
      cprUnitsCount: 0,
      transportVentilator: 'None / Bag-Valve-Mask Only',
      ventUnitsCount: 0,
      epcrCadSoftware: 'Legacy Paper / State Web Registry',
      billingSoftware: 'Local Regional Third-Party'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 640000,
      afgFiscalYear: 2025,
      afgPurpose: 'Regional Volunteer Fire & EMS Resuscitation Safety Initiative',
      saferGrantActive: false,
      fiscalYearEndMonth: 'December'
    },
    zollOpportunity: {
      pulseIqScore: 99,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'X Series Advanced',
      recommendedBundle: [
        '52x X Series Advanced with Real CPR Help and automated voice prompts',
        '28x AutoPulse Resuscitation Systems for volunteer crews with limited personnel',
        'ZOLL Respond Mobile CAD and cloud ePCR to eliminate paper run logs'
      ],
      projectedPipelineValue: 2180000,
      clinicalBenefitNarrative: 'Volunteer departments suffer from low staffing (often 2-person crews). AutoPulse provides tireless high-performance CPR, functioning as an extra crew member in the ambulance.',
      financialRoiNarrative: 'Awarded $640K AFG regional consortium grant. Huge need for automated billing to recover $795K in rejected claims due to missing volunteer documentation.',
      scoreRationale: 'Score 99/100: Exceptional fit across all 5 scoring dimensions. A consortium of volunteer departments operating 10.8-year-old mixed LIFEPAK 12/15 monitors (25/25 fleet obsolescence). With limited 2-person volunteer staffing on rigs, AutoPulse acts as an indispensable force multiplier during 1,280 annual OHCA calls (25/25 clinical acuity). $640K regional AFG award in hand ready for Q4 expenditure (15/15 budget readiness). 21.5% CMS denial rate due to volunteer paperwork gaps easily solved by ZOLL Billing (20/20 CMS financial). High elderly demographic index (14/15 demographics).',
      scoreBreakdown: {
        clinicalAcuityPts: 25,
        fleetObsolescencePts: 25,
        cmsFinancialPts: 20,
        demographicVulnerabilityPts: 14,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'RFP / Quoting',
      probabilityPct: 92
    },
    officialWebsite: 'https://www.alleghenycounty.us/Government/Departments-and-Offices/Department-of-Emergency-Services',
    headquartersPhone: '(412) 473-2550',
    keyContacts: [
      { id: 'c16', name: 'Chief Matthew Brown', title: 'Director of Emergency Services', role: 'Fire Chief', email: '', phone: '(412) 473-2550', officialWebsite: 'https://www.alleghenycounty.us/Government/Departments-and-Offices/Department-of-Emergency-Services', headquartersAddress: '150 Hookstown Grade Rd, Coraopolis, PA 15108', isVerifiedOfficial: true },
      { id: 'c17', name: 'Allegheny County EMS Council', title: 'County EMS Medical Direction', role: 'Medical Director', email: '', phone: '(412) 473-2550', officialWebsite: 'https://www.alleghenycounty.us/Government/Departments-and-Offices/Department-of-Emergency-Services', headquartersAddress: '150 Hookstown Grade Rd, Coraopolis, PA 15108', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-8',
        date: '2026-10-11',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Met with Regional Fire Advisory Board. All 14 volunteer department chiefs voted to standardize on ZOLL X Series and AutoPulse using the AFG grant.',
        nextAction: 'Provide finalized master purchase agreement to County Commissioners for November voting docket',
        dueDate: '2026-10-30'
      }
    ],
    lastContactDate: '2026-10-11',
    isBookmarked: true,
    inDayRoute: true
  },
  {
    id: 'zoll-lead-010',
    name: 'Columbus Division of Fire',
    fdid: 'OH-25001',
    agencyType: 'Career Fire Department',
    jurisdictionLevel: 'Local',
    state: 'Ohio',
    stateCode: 'OH',
    county: 'Franklin County',
    city: 'Columbus',
    zipCode: '43215',
    address: '3639 Parsons Ave, Columbus, OH',
    latitude: 39.9612,
    longitude: -82.9988,
    populationServed: 905000,
    responseAreaSqMiles: 227,
    stationsCount: 35,
    totalAmbulances: 40,
    totalFireEngines: 38,
    totalEMSStaff: 920,
    annualCallVolume: 182000,
    annual911Transports: 112000,
    annualCardiacArrestCalls: 1850,
    bystanderCPRRate: 39.2,
    utsteinSurvivalRate: 27.6,
    gisData: {
      populationDensityPerSqMile: 3980,
      medianHouseholdIncome: 58900,
      seniorPopulationPct: 13.8,
      povertyRate: 18.2,
      avgTransportTimeMinutes: 16.5,
      distanceToNearestCathLabMiles: 3.5,
      traumaCenterLevel: 'Level 1 Trauma',
      publicAccessAedDeficitPct: 42.0,
      highRiseBuildingDensity: 'High',
      annualTraumaIncidents: 4950,
      fiscalBudgetCycleQuarter: 'Q4 (Oct-Dec)',
      territoryClusterId: 'cluster-ohio-valley',
      territoryClusterName: 'Ohio Valley Resuscitation & Medicare Recovery Zone'
    },
    qualityMetrics: {
      nemsqaStemi12LeadAcquisitionPct: 78.5,
      nemsqaChestCompressionFractionPct: 76.4,
      nemsqaEtco2VentilationCompliancePct: 61.2,
      nemsqaPediatricRespiratorySupportPct: 74.0,
      nemsqaStrokeLkwDocumentedPct: 84.5,
      nemsqaPainManagementEffectivePct: 79.2,
      caresGoodNeurologicalSurvivalPct: 8.6,
      ahaMissionLifelineTier: 'Gold Plus',
      gadcsCostToChargeRatio: 0.63,
      commercialUnderpaymentPerTrip: 250
    },
    competitorContract: {
      vendor: 'Stryker ProCare',
      contractEndDate: '2027-01-31',
      renewalWindowDays: 105,
      annualServiceCostPerUnit: 2900,
      status: 'Expiring Soon (90 Days)',
      actionRecommendation: 'Stryker contract is up for renegotiation in January. Present X Series upgrade bundle with trade-in discount.'
    },
    cmsData: {
      medicareBilledAnnual: 29400000,
      medicareAllowedAnnual: 23800000,
      claimDenialRate: 19.1,
      topDenialReason: 'Physician Certification Statement (PCS) Missing & Signature Non-Compliance',
      medicaidBilledAnnual: 12400000,
      commercialPayerMixPct: 34,
      gadcsReportingStatus: 'Selected - In Progress',
      estimatedRecoverableRevenue: 1070000
    },
    installedFleet: {
      defibBrand: 'Stryker LIFEPAK 15',
      defibUnitsCount: 46,
      defibAgeYears: 9.1,
      defibWarrantyStatus: 'Expired',
      mechanicalCPR: 'Stryker LUCAS 3 (20 units)',
      cprUnitsCount: 20,
      transportVentilator: 'None / BVM Only',
      ventUnitsCount: 0,
      epcrCadSoftware: 'ImageTrend Elite',
      billingSoftware: 'Digitech'
    },
    grantStatus: {
      afgAwarded: true,
      afgAwardAmount: 580000,
      afgFiscalYear: 2025,
      afgPurpose: 'Firefighter Operational Safety & EMS Monitors',
      saferGrantActive: true,
      fiscalYearEndMonth: 'December'
    },
    zollOpportunity: {
      pulseIqScore: 98,
      priorityTier: 'Critical Opportunity',
      primaryTargetProduct: 'X Series Advanced',
      recommendedBundle: [
        '46x X Series Advanced with Real BVM Help & TBI Dashboard',
        '35x AutoPulse Resuscitation Systems across all firehouse engines & rescue squads',
        'ZOLL Billing claims scrubber to recover $1.07M in denied Medicare transports'
      ],
      projectedPipelineValue: 2450000,
      clinicalBenefitNarrative: 'Columbus Fire is experiencing end-of-life battery and screen issues with 9-year-old LP15 units. High volume (1,850 cardiac arrests) makes Real BVM Help and AutoPulse critical.',
      financialRoiNarrative: 'Active $580K AFG award is ready to expend. Recapturing $1.07M in Medicare denials pays for the entire fleet lease in 18 months.',
      scoreRationale: 'Score 98/100: Top tier metro prospect with 1,850 OHCA runs and 4,950 trauma incidents. Existing 46 Stryker LP15s are 9.1 years old and failing bench tests (24/25 fleet obsolescence). $580K active AFG award ready for Q4 expenditure (15/15 budget readiness). Recapturing $1.07M in denied Medicare transports through ZOLL Billing pays for the fleet lease in 18 months (20/20 CMS financial). Strong clinical demand from Dr. Keseg for Real BVM Help (25/25 clinical acuity).',
      scoreBreakdown: {
        clinicalAcuityPts: 25,
        fleetObsolescencePts: 24,
        cmsFinancialPts: 20,
        demographicVulnerabilityPts: 14,
        budgetGrantReadinessPts: 15
      },
      salesStage: 'Clinical Evaluation Trial',
      probabilityPct: 88
    },
    officialWebsite: 'https://www.columbus.gov/Services/Public-Safety/Fire',
    headquartersPhone: '(614) 645-7306',
    keyContacts: [
      { id: 'c20', name: 'Chief Jeffreyhapp / Geitter Command', title: 'Fire Chief', role: 'Fire Chief', email: '', phone: '(614) 645-7306', officialWebsite: 'https://www.columbus.gov/Services/Public-Safety/Fire', headquartersAddress: '3675 Parsons Ave, Columbus, OH 43207', isVerifiedOfficial: true },
      { id: 'c21', name: 'Columbus Division of Fire EMS Bureau', title: 'Office of the Medical Director', role: 'Medical Director', email: '', phone: '(614) 645-7306', officialWebsite: 'https://www.columbus.gov/Services/Public-Safety/Fire', headquartersAddress: '3675 Parsons Ave, Columbus, OH 43207', isVerifiedOfficial: true }
    ],
    fieldNotes: [
      {
        id: 'fn-10',
        date: '2026-10-08',
        repName: 'Sarah Jenkins (TM)',
        meetingType: 'On-Site Station Visit',
        notes: 'Delivered 4 evaluation units to Station 10 & Station 24. Crews immediately noted the 11.7 lb weight advantage compared to their heavy Stryker LIFEPAK 15 rigs.',
        nextAction: 'Check in with Station 10 Captain on clinical trial feedback',
        dueDate: '2026-10-22'
      }
    ],
    lastContactDate: '2026-10-08',
    isBookmarked: true,
    inDayRoute: true
  }
];
