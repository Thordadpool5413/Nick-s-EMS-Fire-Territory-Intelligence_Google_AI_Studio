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
  ...ALL_50_STATES_ADDITIONAL_AGENCIES
];
