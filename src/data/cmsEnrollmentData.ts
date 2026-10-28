/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CmsEnrollmentRecord {
  npi: string;
  legalBusinessName: string;
  doingBusinessAs: string;
  providerType: 'Ambulance Service Supplier (Specialty 59)' | 'Government-Operated Municipal Supplier' | 'Hospital-Based Ground Ambulance';
  medicareProviderId: string; // CCN / CMS Certification Number
  taxIdLast4: string;
  macJurisdiction: string; // Medicare Administrative Contractor (e.g. "Noridian (JF)", "Novitas (JH)", "NGS (JK)", "First Coast (JN)")
  macJurisdictionCode: string;
  enrollmentStatus: 'Active / Fully Approved' | 'Revalidation Pending (Due < 60 Days)' | 'Audit Review / Flagged' | 'Deactivated / Lapsed';
  enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)';
  effectiveDate: string;
  lastRevalidationDate: string;
  nextRevalidationDueDate: string;
  reassignmentOfBenefits: boolean;
  gadcsStatus: {
    selectedForDataCollection: boolean;
    reportingYear: number;
    submissionStatus: 'Approved & Compliant' | 'Pending Final Audit' | 'Overdue / 10% Penalty Risk' | 'Exempt (Low Volume / Volunteer)';
    costToChargeRatio: number;
    estimatedAuditVariancePct: number;
  };
  partBClaimsSummary: {
    annualAllowedTransports: number;
    totalMedicareAllowedAmount: number;
    denialRatePct: number;
    topDenialReasonCode: string;
    topDenialDescription: string;
    averageAllowedPerA0427Als1: number;
    averageAllowedPerA0429BlsEmergency: number;
  };
  oigLeieExclusionStatus: 'Clear / No Sanctions' | 'Sanction Warning';
  samGovFederalDebarment: 'Clear / Active Vendor' | 'Debarred';
  dataFreshnessTimestamp: string;
  cryptographicVerificationHash: string;
}


export const CMS_ENROLLMENT_DATABASE: Record<string, CmsEnrollmentRecord> = {
  '1548329104': {
    npi: '1548329104',
    legalBusinessName: 'CITY OF AUSTIN EMERGENCY MEDICAL SERVICES',
    doingBusinessAs: 'Austin-Travis County EMS',
    providerType: 'Government-Operated Municipal Supplier',
    medicareProviderId: '67-E042',
    taxIdLast4: '8821',
    macJurisdiction: 'Novitas Solutions, Inc. (JH)',
    macJurisdictionCode: '04202',
    enrollmentStatus: 'Active / Fully Approved',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '2004-03-15',
    lastRevalidationDate: '2023-08-14',
    nextRevalidationDueDate: '2028-08-14',
    reassignmentOfBenefits: true,
    gadcsStatus: {
      selectedForDataCollection: true,
      reportingYear: 2024,
      submissionStatus: 'Approved & Compliant',
      costToChargeRatio: 0.61,
      estimatedAuditVariancePct: 1.4
    },
    partBClaimsSummary: {
      annualAllowedTransports: 51200,
      totalMedicareAllowedAmount: 18450000,
      denialRatePct: 14.2,
      topDenialReasonCode: 'CO-16',
      topDenialDescription: 'Claim lacks information which is needed for adjudication (Medical Necessity documentation for ALS-1 vs BLS)',
      averageAllowedPerA0427Als1: 542.80,
      averageAllowedPerA0429BlsEmergency: 458.10
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  '1982736450': {
    npi: '1982736450',
    legalBusinessName: 'CITY OF CHICAGO DEPARTMENT OF FIRE - BUREAU OF EMS',
    doingBusinessAs: 'Chicago Fire Dept EMS',
    providerType: 'Ambulance Service Supplier (Specialty 59)',
    medicareProviderId: '14-E108',
    taxIdLast4: '3912',
    macJurisdiction: 'National Government Services, Inc. (JK)',
    macJurisdictionCode: '06102',
    enrollmentStatus: 'Revalidation Pending (Due < 60 Days)',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '1998-11-01',
    lastRevalidationDate: '2021-12-05',
    nextRevalidationDueDate: '2026-11-27',
    reassignmentOfBenefits: true,
    gadcsStatus: {
      selectedForDataCollection: true,
      reportingYear: 2025,
      submissionStatus: 'Pending Final Audit',
      costToChargeRatio: 0.74,
      estimatedAuditVariancePct: 6.8
    },
    partBClaimsSummary: {
      annualAllowedTransports: 89400,
      totalMedicareAllowedAmount: 29800000,
      denialRatePct: 24.8,
      topDenialReasonCode: 'PR-204',
      topDenialDescription: 'This service/equipment is not covered under patient benefit plan (Signature on File missing / Physician Certification Statement unsigned)',
      averageAllowedPerA0427Als1: 588.40,
      averageAllowedPerA0429BlsEmergency: 494.20
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
  },
  '1245678901': {
    npi: '1245678901',
    legalBusinessName: 'FIRE DEPARTMENT OF NEW YORK - EMERGENCY MEDICAL SERVICE',
    doingBusinessAs: 'FDNY EMS Command',
    providerType: 'Government-Operated Municipal Supplier',
    medicareProviderId: '33-E901',
    taxIdLast4: '0019',
    macJurisdiction: 'National Government Services, Inc. (JL)',
    macJurisdictionCode: '13202',
    enrollmentStatus: 'Active / Fully Approved',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '1996-07-01',
    lastRevalidationDate: '2024-04-18',
    nextRevalidationDueDate: '2029-04-18',
    reassignmentOfBenefits: true,
    gadcsStatus: {
      selectedForDataCollection: true,
      reportingYear: 2024,
      submissionStatus: 'Approved & Compliant',
      costToChargeRatio: 0.69,
      estimatedAuditVariancePct: 0.9
    },
    partBClaimsSummary: {
      annualAllowedTransports: 142000,
      totalMedicareAllowedAmount: 48900000,
      denialRatePct: 15.6,
      topDenialReasonCode: 'CO-97',
      topDenialDescription: 'The benefit for this service is included in the payment/allowance for another service/procedure that has already been adjudicated',
      averageAllowedPerA0427Als1: 612.30,
      averageAllowedPerA0429BlsEmergency: 510.60
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-8f4b2390a12cf498bcda492b43b49e0a294d1f29402948b204918e9d0fa04912'
  },
  '1837492015': {
    npi: '1837492015',
    legalBusinessName: 'FLATHEAD COUNTY FIRE DISTRICT #1',
    doingBusinessAs: 'Flathead Valley Fire & Rescue',
    providerType: 'Ambulance Service Supplier (Specialty 59)',
    medicareProviderId: '27-E441',
    taxIdLast4: '5510',
    macJurisdiction: 'Noridian Healthcare Solutions (JF)',
    macJurisdictionCode: '03202',
    enrollmentStatus: 'Active / Fully Approved',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '2008-09-12',
    lastRevalidationDate: '2022-10-09',
    nextRevalidationDueDate: '2027-10-09',
    reassignmentOfBenefits: false,
    gadcsStatus: {
      selectedForDataCollection: false,
      reportingYear: 2025,
      submissionStatus: 'Exempt (Low Volume / Volunteer)',
      costToChargeRatio: 0.58,
      estimatedAuditVariancePct: 0.0
    },
    partBClaimsSummary: {
      annualAllowedTransports: 1420,
      totalMedicareAllowedAmount: 680000,
      denialRatePct: 11.2,
      topDenialReasonCode: 'CO-16',
      topDenialDescription: 'Rural mileage calculation discrepancy or missing odometer reading on transport ticket',
      averageAllowedPerA0427Als1: 672.40, // Super rural bonus rate
      averageAllowedPerA0429BlsEmergency: 564.10
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-91e84a923847fb38402948cb4901849102948ba102948cb49018249018249018'
  },
  '1093847562': {
    npi: '1093847562',
    legalBusinessName: 'METRO WEST AMBULANCE SERVICE INC',
    doingBusinessAs: 'Metro West Ambulance',
    providerType: 'Ambulance Service Supplier (Specialty 59)',
    medicareProviderId: '38-E810',
    taxIdLast4: '7729',
    macJurisdiction: 'Noridian Healthcare Solutions (JF)',
    macJurisdictionCode: '03202',
    enrollmentStatus: 'Audit Review / Flagged',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '1989-04-01',
    lastRevalidationDate: '2022-03-14',
    nextRevalidationDueDate: '2027-03-14',
    reassignmentOfBenefits: true,
    gadcsStatus: {
      selectedForDataCollection: true,
      reportingYear: 2024,
      submissionStatus: 'Overdue / 10% Penalty Risk',
      costToChargeRatio: 0.78,
      estimatedAuditVariancePct: 12.4
    },
    partBClaimsSummary: {
      annualAllowedTransports: 44200,
      totalMedicareAllowedAmount: 14200000,
      denialRatePct: 22.4,
      topDenialReasonCode: 'CO-50',
      topDenialDescription: 'These are non-covered services because this is not deemed a medical necessity by the payer (Repetitive dialysis non-emergent transport lacking prior-auth approval)',
      averageAllowedPerA0427Als1: 524.10,
      averageAllowedPerA0429BlsEmergency: 432.80
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-7281940182409182049182049182049182049182049182049182049182049182'
  },
  '1487920135': {
    npi: '1487920135',
    legalBusinessName: 'MIAMI-DADE COUNTY FIRE RESCUE DEPARTMENT',
    doingBusinessAs: 'Miami-Dade Fire Rescue EMS',
    providerType: 'Government-Operated Municipal Supplier',
    medicareProviderId: '10-E714',
    taxIdLast4: '4109',
    macJurisdiction: 'First Coast Service Options Inc. (JN)',
    macJurisdictionCode: '09102',
    enrollmentStatus: 'Active / Fully Approved',
    enrollmentType: 'CMS-855B (Clinics/Group Practices and Certain Other Suppliers)',
    effectiveDate: '2001-05-18',
    lastRevalidationDate: '2023-11-20',
    nextRevalidationDueDate: '2028-11-20',
    reassignmentOfBenefits: true,
    gadcsStatus: {
      selectedForDataCollection: true,
      reportingYear: 2024,
      submissionStatus: 'Approved & Compliant',
      costToChargeRatio: 0.63,
      estimatedAuditVariancePct: 1.8
    },
    partBClaimsSummary: {
      annualAllowedTransports: 78500,
      totalMedicareAllowedAmount: 26100000,
      denialRatePct: 18.2,
      topDenialReasonCode: 'PR-16',
      topDenialDescription: 'Claim lacks information which is needed for adjudication (Dispatch CAD emergency response priority code discrepancy)',
      averageAllowedPerA0427Als1: 562.90,
      averageAllowedPerA0429BlsEmergency: 471.50
    },
    oigLeieExclusionStatus: 'Clear / No Sanctions',
    samGovFederalDebarment: 'Clear / Active Vendor',
    dataFreshnessTimestamp: '2026-10-15T04:00:00Z',
    cryptographicVerificationHash: 'sha256-a192830192830192830192830192830192830192830192830192830192830192'
  }
};

/**
 * Validates a 10-digit National Provider Identifier (NPI) using the Luhn Checksum algorithm
 * mandated by HIPAA and CMS for all healthcare provider IDs.
 */
export function validateNpiLuhnChecksum(npiString: string): { isValid: boolean; errorReason?: string } {
  if (!/^\d{10}$/.test(npiString)) {
    return { isValid: false, errorReason: 'NPI must be exactly 10 digits without letters or special characters' };
  }
  
  // CMS NPI Luhn rule: Prefix with "80840" (US healthcare prefix), then apply Luhn mod-10
  const fullSequence = '80840' + npiString;
  let sum = 0;
  let shouldDouble = false;

  for (let i = fullSequence.length - 1; i >= 0; i--) {
    let digit = parseInt(fullSequence.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = sum % 10 === 0;
  return {
    isValid,
    errorReason: isValid ? undefined : 'NPI failed Luhn Modulo-10 checksum validation (invalid identifier digit)'
  };
}

export function queryCmsEnrollmentByNpi(npi: string): CmsEnrollmentRecord | null {
  const sanitized = npi.trim();
  if (CMS_ENROLLMENT_DATABASE[sanitized]) {
    return CMS_ENROLLMENT_DATABASE[sanitized];
  }
  return null;
}
