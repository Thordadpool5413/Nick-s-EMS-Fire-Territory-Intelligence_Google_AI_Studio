/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ZollProductInfo {
  id: string;
  name: string;
  category: 'Resuscitation & Defibrillation' | 'Mechanical CPR' | 'Public Access Defibrillation' | 'Ventilation' | 'Software & Dispatch';
  tagline: string;
  description: string;
  keyDifferentiators: string[];
  clinicalHighlights: string[];
  displacementTargets: string[];
  averageUnitCost: number;
  cmsBenefit: string;
}

export const ZOLL_PRODUCTS: Record<string, ZollProductInfo> = {
  'x-series-advanced': {
    id: 'x-series-advanced',
    name: 'X Series Advanced Monitor/Defibrillator',
    category: 'Resuscitation & Defibrillation',
    tagline: 'The clinical standard in pre-hospital monitor/defibrillators',
    description: 'Designed specifically for EMS and Fire agencies. Weighs under 12 pounds, IP55 military rugged, with Real BVM Help for ventilation feedback, Real CPR Help, and TBI Dashboard.',
    keyDifferentiators: [
      'Real BVM Help: Real-time feedback on ventilation rate and tidal volume',
      'Real CPR Help: Numeric depth and rate indicators with See-Thru CPR artifact filtering',
      'Traumatic Brain Injury (TBI) Dashboard: Enforces EPIC protocol parameters to avoid secondary brain injury',
      'Integrated 12-lead STEMI transmission to cath labs via cellular/Wi-Fi'
    ],
    clinicalHighlights: [
      'Reduces hyperventilation incidents by 74% in cardiac arrest patients',
      'Triples survival to discharge when paired with high-performance CPR protocols',
      'Seamless data transfer into ZOLL RescueNet and third-party ePCRs'
    ],
    displacementTargets: ['Stryker LIFEPAK 15', 'Philips HeartStart MRx', 'Medtronic LIFEPAK 12'],
    averageUnitCost: 28500,
    cmsBenefit: 'Documented CPR & BVM telemetry strengthens ALS Medicare billing claims and reduces medical necessity denials.'
  },
  'autopulse': {
    id: 'autopulse',
    name: 'AutoPulse Resuscitation System',
    category: 'Mechanical CPR',
    tagline: 'Continuous, consistent mechanical CPR with circumferential load-distributing band',
    description: 'The AutoPulse non-invasively compresses the patient’s entire chest with a patented Load-Distributing Band (LDB), improving blood flow to the heart and brain during cardiac arrest.',
    keyDifferentiators: [
      'Circumferential chest compression (squeezes entire chest, not a focal point piston)',
      'Unbroken compressions down tight stairwells, around corners, and in moving ambulances',
      'Frees up paramedic crew members to focus on airway, vascular access, and medication',
      'Minimizes pause times during transport'
    ],
    clinicalHighlights: [
      'Generates up to 33% higher coronary perfusion pressure compared to point-piston devices',
      'Significantly higher rates of Return of Spontaneous Circulation (ROSC)',
      'Lowers risk of rib fracture and visceral organ trauma'
    ],
    displacementTargets: ['Stryker LUCAS 2/3', 'Manual Chest Compressions Only'],
    averageUnitCost: 19500,
    cmsBenefit: 'Reduces crew back-injury workers comp claims and supports high-acuity ALS transport reimbursement rates.'
  },
  'zoll-aed-3': {
    id: 'zoll-aed-3',
    name: 'ZOLL AED 3 / AED Plus Public Access Defibrillator',
    category: 'Public Access Defibrillation',
    tagline: 'Intuitive public access defibrillator with real-time CPR coaching',
    description: 'Engineered for first responders, police cruisers, municipal buildings, parks, and schools. Features Real CPR Help audio/visual prompts and RapidShock technology delivering the fastest shock in the industry.',
    keyDifferentiators: [
      'Real CPR Help: Gives voice and visual feedback on compression depth and rate',
      'RapidShock analysis: Delivers rhythm analysis and shock in under 5 seconds',
      'Universal CPR Uni-padz: One electrode set works for both adult and pediatric patients with 1-button child mode',
      'Cloud-connected PlusTrac: Wi-Fi automated daily self-test reports to municipal dashboard'
    ],
    clinicalHighlights: [
      'Doubles bystander CPR survival in public venue cardiac arrests',
      'Zero pad-swap delay for pediatric victims saving up to 90 seconds'
    ],
    displacementTargets: ['Philips HeartStart OnSite / FRx', 'Cardiac Science Powerheart G5', 'Stryker LIFEPAK CR2'],
    averageUnitCost: 2200,
    cmsBenefit: 'Eligible for federal FEMA public safety grants and state emergency trust funds with zero agency copay.'
  },
  'z-vent': {
    id: 'z-vent',
    name: 'Z Vent Transport Ventilator',
    category: 'Ventilation',
    tagline: 'Rugged, portable tactical ventilator for all patient categories',
    description: 'Weighing only 9.7 lbs with an internal compressor, the Z Vent eliminates the need for bulky oxygen cylinders for transport ventilation. Designed to military airworthiness and EMS standards.',
    keyDifferentiators: [
      'Internal compressor operates without high-pressure O2 source',
      'Smart Help display guides medics through alarms with on-screen corrective prompts',
      'MRI conditional up to 3 Tesla',
      '10-hour battery runtime with hot-swappable packs'
    ],
    clinicalHighlights: [
      'Protective lung ventilation protocols reduce ventilator-induced lung injury (VILI)',
      'Supports CPAP, BiPAP, and invasive mechanical ventilation from infant (5kg) to adult',
      'Standardized interface across pre-hospital ground, aeromedical, and emergency department'
    ],
    displacementTargets: ['Hamilton T1', 'Impact Uni-Vent 754', 'BVM / Manual Ventilation Only'],
    averageUnitCost: 16800,
    cmsBenefit: 'Enables agencies to bill Medicare Specialty Care Transport (SCT) and advanced ventilator management codes.'
  },
  'zoll-billing': {
    id: 'zoll-billing',
    name: 'ZOLL Billing & AR Boost Suite',
    category: 'Software & Dispatch',
    tagline: 'EMS Revenue Cycle Management with automated claim scrub and Medicare optimization',
    description: 'Cloud-native billing and revenue cycle management built explicitly for fire departments and ambulance services. Features AR Boost automated demographic validation and insurance discovery.',
    keyDifferentiators: [
      'AR Boost: Auto-finds missing insurance coverage and commercial policies before billing patients',
      'Pre-billing claim scrubber checks for Medicare medical necessity documentation errors',
      'Mandatory Ground Ambulance Data Collection System (GADCS) reporting compliance module',
      'Direct integration with ZOLL Respond CAD and all major ePCR platforms'
    ],
    clinicalHighlights: [
      'Reduces Medicare Part B ground transport initial claim denial rates from >18% to <2.5%',
      'Recovers an average of $85 to $140 additional revenue per billed 911 transport',
      'Accelerates reimbursement turnaround from 62 days down to 19 days'
    ],
    displacementTargets: ['Digitech', 'Optum / Change Healthcare', 'In-House Municipal Manual Billing'],
    averageUnitCost: 12000,
    cmsBenefit: 'Guaranteed compliance with CMS GADCS reporting; eliminates 10% Medicare payment reduction penalties.'
  },
  'zoll-respond': {
    id: 'zoll-respond',
    name: 'ZOLL Respond & CAD Mobile Ecosystem',
    category: 'Software & Dispatch',
    tagline: 'Next-gen CAD incident dispatch, turn-by-turn navigation, and crew notification',
    description: 'Empowers field crews with live dispatch feeds, real-time vehicle AVL tracking, routing, and hospital diversion status directly on mobile tablets and smartphones.',
    keyDifferentiators: [
      'Instant mobile push dispatch notification bypassing spotty radio coverage',
      'Live mutual aid tracking and dynamic incident mapping',
      'Real-time bed availability and STEMI/Stroke hospital alert transmission'
    ],
    clinicalHighlights: [
      'Shaves 45–90 seconds off crew chute and response arrival times',
      'Provides pre-arrival patient history from prior 911 calls'
    ],
    displacementTargets: ['Legacy Motorola PremierOne', 'CentralSquare CAD', 'Paper Run Logs'],
    averageUnitCost: 8500,
    cmsBenefit: 'Generates audited timestamp logs required by Medicare audits to substantiate emergency response times.'
  }
};
