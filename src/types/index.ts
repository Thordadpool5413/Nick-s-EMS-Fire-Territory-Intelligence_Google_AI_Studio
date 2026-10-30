/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgencyType = 
  | 'Career Fire Department'
  | 'Volunteer / Combination Fire'
  | 'Municipal 3rd Service EMS'
  | 'County 3rd Service EMS'
  | 'Public Utility Model EMS'
  | 'Private Ground Ambulance'
  | 'Hospital-Based EMS'
  | string;

export type PriorityTier = 
  | 'Critical Opportunity'
  | 'High Value'
  | 'Mid-Term Pipeline'
  | 'Maintained Account';

export type LeadStage = 
  | 'Target Lead'
  | 'Contacted / Intro'
  | 'Demo Scheduled'
  | 'Clinical Evaluation Trial'
  | 'Executive Presentation'
  | 'RFP / Quoting'
  | 'Contract Won'
  | 'Displaced / Closed';

export type ZollProductLine = 
  | 'X Series Advanced'
  | 'AutoPulse Resuscitation System'
  | 'ZOLL AED 3 & Public Access Defibrillators'
  | 'Z Vent Transport Ventilator'
  | 'ZOLL Respond & CAD'
  | 'ZOLL RescueNet ePCR'
  | 'ZOLL Billing / AR Boost';

export interface KeyContact {
  id: string;
  name: string;
  title: string;
  role: 'Fire Chief' | 'EMS Chief' | 'Medical Director' | 'Logistics / Fleet Captain' | 'City / Purchasing Manager' | 'Executive Director' | 'Operations Director' | string;
  email: string; // Empty string if individual email is not publicly listed
  phone: string;
  officialWebsite?: string;
  headquartersAddress?: string;
  isVerifiedOfficial?: boolean;
  verificationSource?: string;
  notes?: string;
}

export interface FieldNote {
  id: string;
  date: string;
  repName: string;
  meetingType: 'On-Site Station Visit' | 'Virtual Demo' | 'Phone Call' | 'RFP Review' | 'Ride-Along';
  notes: string;
  nextAction: string;
  dueDate: string;
}

export interface ScoreBreakdown {
  clinicalAcuityPts: number; // 0 to 25 pts (Cardiac volume, survival deficit, transport times)
  fleetObsolescencePts: number; // 0 to 25 pts (LP15/MRx age, out of warranty, parts shortage)
  cmsFinancialPts: number; // 0 to 20 pts (Denial rate, GADCS audit risk, recoverable cash)
  demographicVulnerabilityPts: number; // 0 to 15 pts (Senior 65+ pop, poverty rate, density)
  budgetGrantReadinessPts: number; // 0 to 15 pts (Active AFG grant, FY end surplus)
}

export interface CountyCityRecord {
  name: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  isCountySeat: boolean;
}

export interface CountyHealthRecord {
  countyFips: string;
  stateFips?: string;
  countyName: string;
  rawName?: string;
  stateCode: string;
  stateName: string;
  countySeat: string;
  centroidLat?: number;
  centroidLng?: number;
  bbox?: [number, number, number, number];
  landAreaSqMiles?: number;
  population: number;
  seniorPopPct: number;
  medianIncome: number;
  povertyRatePct: number;
  annualEmergencyTransports: number;
  annualCardiacArrestIncidents: number;
  averageTransportMinutes: number;
  primaryCathLabDistanceMiles: number;
  activeEmsAgencies: number;
  primaryZipCodes: string[];
  cities?: string[];
  cityRecords?: CountyCityRecord[];
  medicareDenialRatePct?: number;
  medicareDenialSource?: string;
}

export interface GisAndDemographics {
  populationDensityPerSqMile: number;
  medianHouseholdIncome: number;
  seniorPopulationPct: number; // percentage age 65+
  povertyRate: number; // percentage
  avgTransportTimeMinutes: number; // average EMS drive time to receiving facility
  distanceToNearestCathLabMiles: number; // distance to STEMI PCI Cath Lab
  traumaCenterLevel: 'Level 1 Trauma' | 'Level 2 Trauma' | 'Level 3 / Critical Access';
  publicAccessAedDeficitPct: number; // unmet public access AED need in schools, municipal buildings, parks
  highRiseBuildingDensity: 'High' | 'Moderate' | 'Low';
  annualTraumaIncidents: number;
  fiscalBudgetCycleQuarter: 'Q1 (Jan-Mar)' | 'Q2 (Apr-Jun)' | 'Q3 (Jul-Sep)' | 'Q4 (Oct-Dec)';
  territoryClusterId: string;
  territoryClusterName: string;
  primaryReceivingHospital?: string;
  annualHospitalDestinationTransports?: number;
  avgTransportDistanceToTraumaMiles?: number;
  estimatedTransportLatencyMinutes?: number;
}

export interface ClinicalQualityMetrics {
  // NEMSQA Standard Measures
  nemsqaStemi12LeadAcquisitionPct: number; // Cardiac-01: 12-lead acquired <= 10 mins (benchmark: 85%)
  nemsqaChestCompressionFractionPct: number; // CCF fraction of CPR time compressions active (benchmark: 78%)
  nemsqaEtco2VentilationCompliancePct: number; // ETCO2 maintained between 35-45 mmHg without hyperventilation (benchmark: 64%)
  nemsqaPediatricRespiratorySupportPct: number; // Pediatrics-01 (benchmark: 72%)
  nemsqaStrokeLkwDocumentedPct: number; // Stroke-01: Last Known Well (benchmark: 80%)
  nemsqaPainManagementEffectivePct: number; // Trauma-01: Pain documented & addressed (benchmark: 75%)
  
  // Neurological Outcome Metrics (CARES Registry)
  caresGoodNeurologicalSurvivalPct: number; // Cerebral Performance Category CPC 1 or 2 at discharge
  ahaMissionLifelineTier: 'Gold Plus' | 'Gold' | 'Silver' | 'Bronze' | 'Not Recognized / Gap';
  
  // Cost & Underpayment Analytics
  gadcsCostToChargeRatio: number; // CMS GADCS cost-to-charge ratio (e.g. 0.68)
  commercialUnderpaymentPerTrip: number; // Dollar gap between billed and allowed commercial payment
}

export interface CompetitorContractExpiry {
  vendor: 'Stryker ProCare' | 'Philips Master Service' | 'Medtronic Legacy' | 'Philips Legacy' | 'Third-Party ISO' | string;
  contractEndDate: string; // e.g. '2027-01-31'
  renewalWindowDays: number;
  annualServiceCostPerUnit: number;
  status: 'Expiring Soon (90 Days)' | 'Active Term' | 'Active' | 'Month-to-Month / Lapsed' | string;
  actionRecommendation: string;
  isVerifiedContract?: boolean;
  contractNumber?: string;
  contractSourceDoc?: string;
}

export interface Agency {
  id: string;
  name: string;
  fdid: string; // Fire Dept Identification or State EMS ID
  agencyType: AgencyType;
  jurisdictionLevel: 'Local' | 'County' | 'State' | 'National Benchmark';
  
  // Location
  state: string;
  stateCode: string;
  county: string;
  city: string;
  zipCode: string;
  address: string;
  latitude: number;
  longitude: number;

  // Operational metrics (NEMSIS & USFA)
  populationServed: number;
  responseAreaSqMiles: number;
  stationsCount: number;
  totalAmbulances: number;
  totalFireEngines: number;
  totalEMSStaff: number;
  annualCallVolume: number;
  annual911Transports: number;
  annualCardiacArrestCalls: number; // Out-of-Hospital Cardiac Arrest (OHCA)
  bystanderCPRRate: number; // percentage
  utsteinSurvivalRate: number; // percentage survival to hospital discharge (CARES)

  // GIS & Public Health Statistics
  gisData: GisAndDemographics;

  // Clinical Quality & Regulatory Measures (NEMSQA, AHA, CARES)
  qualityMetrics: ClinicalQualityMetrics & {
    isCaresVerified?: boolean;
    isNemsqaVerified?: boolean;
    caresSubmissionId?: string;
  };

  // Competitive Service Contract Expiration Timeline
  competitorContract: CompetitorContractExpiry;

  // CMS & Health Insurance Reimbursement Data
  cmsData: {
    medicareBilledAnnual: number;
    medicareAllowedAnnual: number;
    claimDenialRate: number; // percentage (e.g. 19.5%)
    topDenialReason?: string;
    topDenialReasonCode?: string;
    medicaidBilledAnnual: number;
    commercialPayerMixPct: number;
    medicarePayerPct?: number;
    medicaidPayerPct?: number;
    selfPayPayerPct?: number;
    gadcsReportingStatus: 'Selected - In Progress' | 'Compliant' | 'Pending Audit' | 'Exempt';
    estimatedRecoverableRevenue: number;
    medicareClaimsVolume?: number;
    totalMedicareBilled?: number;
    avgMedicarePaymentPerRun?: number;
    avgBlsPaymentPerRun?: number;
    isVerifiedCmsClaims?: boolean;
    cmsClaimPufYear?: string;
    cmsPufReportingPeriod?: string;
    payerMix?: {
      medicare: number;
      medicaid: number;
      commercial: number;
      selfPay: number;
    };
    primaryPayerMix?: string;
  };

  // Installed Equipment Fleet (Competitive Intel)
  installedFleet: {
    defibBrand: string; // 'Stryker LIFEPAK 15', 'Philips MRx', 'ZOLL X Series', etc.
    defibUnitsCount: number;
    defibAgeYears: number;
    defibWarrantyStatus: 'Expired' | 'Active' | 'Third-Party' | 'Out of Warranty' | string;
    mechanicalCPR: string; // 'Stryker LUCAS 3', 'None / Manual Only', 'ZOLL AutoPulse'
    cprUnitsCount: number;
    transportVentilator: string; // 'None / Bag-Valve-Mask Only', 'Hamilton T1', 'ZOLL Z Vent', 'Legacy Impact'
    ventUnitsCount: number;
    epcrCadSoftware: string; // 'ImageTrend Elite', 'ESO Solutions', 'ZOLL RescueNet', 'Paper'
    dispatchCadVendor?: string; // 'CentralSquare Enterprise CAD', 'Motorola PremierOne CAD', 'Hexagon OnCall', 'Tyler New World'
    billingSoftware: string; // 'Digitech', 'In-House Municipal', 'ZOLL Billing', 'Optum'
    alsMonitorsCount?: number;
    blsDefibsCount?: number;
    isVerifiedEquipment?: boolean;
    procurementResolutionId?: string;
    procurementSourceDoc?: string;
    capitalAssetLedgerId?: string;
    isVerifiedWarranty?: boolean;
    warrantyContractDoc?: string;
  };

  // Public Grants & Budget
  grantStatus: {
    afgAwarded: boolean;
    afgAwardAmount: number;
    afgFiscalYear: number;
    afgPurpose: string;
    afgAwardNumber?: string;
    saferGrantActive: boolean;
    fiscalYearEndMonth: string; // e.g. "September", "December", "June"
  };

  // ZOLL Predictive Analytics & CRM Intelligence
  zollOpportunity: {
    pulseIqScore: number; // 0 to 100
    priorityTier: PriorityTier;
    primaryTargetProduct: ZollProductLine;
    recommendedBundle: string[];
    projectedPipelineValue: number;
    clinicalBenefitNarrative: string;
    financialRoiNarrative: string;
    scoreRationale: string; // Detailed business analyst justification
    scoreBreakdown: ScoreBreakdown;
    salesStage: LeadStage;
    probabilityPct: number;
    estimatedDealValue?: number;
  };

  keyContacts: KeyContact[];
  fieldNotes: FieldNote[];
  lastContactDate: string;
  isBookmarked: boolean;
  inDayRoute: boolean;

  // Optional telemetry, verification, and fleet synchronization properties
  providerCategory?: 'FIRE' | 'EMS' | string;
  isFdidVerified?: boolean;
  isOperationalDataVerified?: boolean;
  npiNumber?: string;
  taxonomyCode?: string;
  taxonomyDescription?: string;
  nppesOfficialName?: string;
  nppesOfficialTitle?: string;
  nppesLastUpdated?: string;
  nppesRegistryUrl?: string;
  usfaRegistryUrl?: string;
  liveFemaAwards?: Array<{
    awardNumber: string;
    grantee: string;
    programActivity: string;
    federalShareAwarded: number;
    awardDate: string;
    programYear: number;
  }>;
  headquartersPhone?: string;
  officialWebsite?: string;
  googleMapsUri?: string;
  mapSearchUri?: string;
  verificationSource?: 'Federal CMS NPI Registry' | 'USFA & Municipal Registry' | 'Google Maps Verified' | 'Firestore Cloud Synced' | string;
  isVerifiedRecord?: boolean;
  lastVerifiedAt?: string;
  verificationAttempt?: {
    timestamp: string;
    outcome: string;
    status: string;
    details?: string;
  };
  budgetCycleEndMonth?: string;
  _syncedAt?: string;
  _updatedAt?: string;
  isCloudPersisted?: boolean;
  dataProvenanceTier?: 'firestore_cloud_synced' | 'live_federal_registry' | 'public_federal_baseline';
  operatingRelationship?: 'DIRECT_OPERATING_AGENCY' | 'PARENT_MUNICIPALITY' | 'CONTRACTED_PROVIDER' | 'UNRELATED_ENTITY' | 'UNRESOLVED' | string;
  operatingRelationshipSummary?: string;
  registryEntityConfirmed?: boolean;

  // Granular Apparatus Vehicle Fleet Breakdown
  apparatusFleet?: {
    alsAmbulances: number;
    blsAmbulances: number;
    fireEngines: number;
    ladderTrucks: number;
    heavyRescueUnits: number;
    commandVehicles: number;
    totalActiveUnits: number;
    avgVehicleAgeYears: number;
    replacementCycleYears: number;
  };

  // Hospital Trauma & STEMI PCI Cath Lab Transport Logistics
  hospitalLogistics?: {
    primaryTraumaHospital: string;
    traumaLevel: string;
    distanceToTraumaMiles: number;
    transportTimeMinutes: number;
    primaryCathLabHospital: string;
    cathLabDistanceMiles: number;
    cathLabTransportMinutes: number;
    annualEdTransports: number;
    avgEdOffloadLatencyMinutes: number;
  };

  // Multi-Year FEMA AFG & SAFER Federal Grant History
  femaGrantHistory?: Array<{
    fiscalYear: number;
    programName: string;
    purpose: string;
    awardAmount: number;
    localMatchAmount: number;
    federalSharePct: number;
    status: 'Awarded & Disbursed' | 'Awarded - Active Spending' | 'Application Pending' | 'Eligible';
    applicationRound?: string;
  }>;

  clinical?: {
    annualCardiacArrestCalls: number;
    utsteinSurvivalRate: number;
    nationalBenchmarkSurvivalRate: number;
    avgEdTurnaroundMinutes: number;
    primaryReceivingHospitals: string[];
  };
  fleet?: {
    alsAmbulances: number;
    blsAmbulances: number;
    fireEngines: number;
    ladderTrucks: number;
    totalStations: number;
    currentDefibVendor: string;
    defibFleetAgeYears: number;
    currentCprDevice: string;
    currentVentilator: string;
    currentEpcrVendor: string;
    currentCadVendor: string;
    contractExpirationDate: string;
  };
  afgGrants?: Array<{
    grantYear: number;
    program: string;
    purpose: string;
    awardDate: string;
    status: string;
    awardAmount: number;
  }>;
}

export interface TerritoryCluster {
  id: string;
  name: string;
  states: string[];
  description: string;
  primaryClinicalDrivers: string;
  bestFitProducts: ZollProductLine[];
  totalPipelineValue: number;
  averageSurvivalRate: number;
  averageTransportMinutes: number;
  highPriorityAgencyCount: number;
}

export interface PushAlert {
  id: string;
  timestamp: string;
  priority: 'critical' | 'high' | 'info';
  title: string;
  message: string;
  agencyId?: string;
  agencyName?: string;
  category: 'Grant Award' | 'CMS Audit / Policy' | 'Competitor Notice' | 'RFP Issued' | 'Field Route' | 'GIS Clinical Alert';
  isRead: boolean;
}

export interface SyncOutboxItem {
  id: string;
  timestamp: string;
  agencyId: string;
  agencyName: string;
  actionType: 'UPDATE_STAGE' | 'ADD_FIELD_NOTE' | 'TOGGLE_ROUTE' | 'UPDATE_CONTACT';
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export type UserRole = 
  | 'Territory Manager'
  | 'Regional Sales Director'
  | 'Clinical Deployment Specialist'
  | 'Sales Operations Admin';

export interface PredictiveWeights {
  fleetAgeWeight: number; // e.g. 25
  cmsDenialWeight: number; // e.g. 25
  cardiacVolumeWeight: number; // e.g. 20
  grantAwardWeight: number; // e.g. 15
  softwareWhitespaceWeight: number; // e.g. 15
}
