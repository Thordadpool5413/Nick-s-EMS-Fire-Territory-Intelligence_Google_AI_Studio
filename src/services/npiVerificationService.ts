/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official CMS NPPES National Provider Identifier (NPI) Verification Engine
 * Implements:
 * 1. CMS-prescribed Luhn check digit algorithm with 80840 prefix (ISO/IEC 7812)
 * 2. Official CMS NPPES Registry API v2.1 integration
 * 3. Type 2 Organization vs Type 1 Individual classification
 * 4. Separation of Parent Municipality vs Operating Department relationships
 * 5. Field-level provenance tracking (Practice location vs Headquarters, Authorized official vs Department chief)
 */

export interface NpiFormatValidationResult {
  isValid: boolean;
  npi: string;
  error?: string;
  reasons: string[];
}

/**
 * Validates an NPI using the official CMS-prescribed Luhn check digit algorithm.
 * Specification:
 * - Exactly 10 digits
 * - Prefix with "80840" to create a 15-digit payload
 * - Calculate Luhn mod 10 over the 15-digit string
 * - Returns true if sum % 10 === 0
 */
export function validateNpiCheckDigit(npiCandidate: unknown): NpiFormatValidationResult {
  if (typeof npiCandidate !== 'string' && typeof npiCandidate !== 'number') {
    return {
      isValid: false,
      npi: String(npiCandidate ?? ''),
      error: 'NPI must be a string or number',
      reasons: ['Identifier is not a valid string or numeric value']
    };
  }

  const clean = String(npiCandidate).trim();

  if (!/^\d{10}$/.test(clean)) {
    return {
      isValid: false,
      npi: clean,
      error: clean.length !== 10
        ? `NPI must be exactly 10 digits (received ${clean.length})`
        : 'NPI must contain only numeric digits',
      reasons: ['Malformed NPI format: must be exactly 10 numeric digits']
    };
  }

  // Prepend 80840 per CMS specification (Health care provider identifier prefix under ISO 7812)
  const full = '80840' + clean;
  let sum = 0;

  for (let i = 0; i < full.length; i++) {
    let digit = parseInt(full[i], 10);
    // Even position from the right (1-indexed from right: 2, 4, 6...):
    const posFromRight = full.length - 1 - i;
    if (posFromRight % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const isValid = sum % 10 === 0;

  return {
    isValid,
    npi: clean,
    error: isValid ? undefined : 'Invalid NPI check digit (Luhn-80840 algorithm failure)',
    reasons: isValid
      ? ['Format verified: 10 numeric digits', 'CMS Luhn-80840 check digit verified']
      : ['Format error: check digit does not match CMS Luhn-80840 computation']
  };
}

export interface NpiRegistryEntity {
  npi: string;
  enumerationType: 'NPI-1' | 'NPI-2' | 'UNKNOWN';
  legalEntityName: string;
  isOrganization: boolean;
  isIndividual: boolean;
  status: string;
  lastUpdated: string;
  certificationDate?: string;
  practiceLocationAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    telephone?: string;
  };
  mailingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  primaryTaxonomy?: {
    code: string;
    description: string;
    state?: string;
    license?: string;
    isAmbulanceRescue: boolean;
  };
  allTaxonomies: Array<{
    code: string;
    description: string;
    primary: boolean;
  }>;
  authorizedOfficial?: {
    name: string;
    title: string;
    telephone?: string;
    credential?: string;
  };
}

/**
 * Calculates the official CMS check digit for a 9-digit NPI base using prefix 80840.
 * Reference: https://www.cms.gov/Regulations-and-Guidance/Administrative-Simplification/NationalProvIdentStand/Downloads/NPIcheckdigit.pdf
 * - Prefix 80840 + 9-digit base = 14 digits
 * - Double positions 2, 4, 6, 8, 10, 12, 14 from the right of the final 15-digit sequence
 * - Sum digits (with >9 subtracting 9)
 * - Subtract units digit from 10 (or 0 if already 0)
 */
export function computeCmsNpiCheckDigit(nineDigitNpi: string): number {
  const clean = String(nineDigitNpi || '').trim();
  if (!/^\d{9}$/.test(clean)) {
    throw new Error('Base NPI must be exactly 9 numeric digits');
  }
  const full = '80840' + clean;
  let sum = 0;
  for (let i = full.length - 1; i >= 0; i--) {
    let digit = parseInt(full[i], 10);
    const posFromRight = full.length - i; // 1, 2, 3...
    if (posFromRight % 2 === 1) { // pos 1 of 14-digit = pos 2 of 15-digit -> double!
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

export type OperatingAgencyRelationshipType =
  | 'REGISTRY_ENTITY_CONFIRMED' // Valid NPPES Type 2 organization record confirmed
  | 'OPERATING_RELATIONSHIP_CONFIRMED' // Exact operating department name match
  | 'POSSIBLE_RELATED_ENTITY' // Parent municipality holding NPI under ambulance taxonomy
  | 'RELATIONSHIP_UNRESOLVED' // Valid organization NPI, but department relationship unresolved
  | 'UNRELATED_ENTITY' // Unrelated clinician (Type 1), non-emergency entity, or cross-state mismatch
  // Backward-compatible aliases:
  | 'DIRECT_OPERATING_AGENCY'
  | 'PARENT_MUNICIPALITY'
  | 'CONTRACTED_PROVIDER'
  | 'UNRESOLVED';

export interface NpiAgencyVerificationReport {
  npi: string;
  formatValidation: NpiFormatValidationResult;
  lookupStatus: 'MATCHED' | 'NOT_MATCHED' | 'UNRELATED_ENTITY' | 'INVALID_FORMAT' | 'SOURCE_UNAVAILABLE' | 'ERROR';
  isVerified: boolean;
  registryEntityConfirmed: boolean;
  relationshipType: OperatingAgencyRelationshipType;
  relationshipSummary: string;
  registryEntity?: NpiRegistryEntity;
  provenance: {
    sourceEndpoint: string;
    retrievedAt?: string;
    sourceStatus: 'LIVE_CMS_NPPES_API' | 'AUTH_OFFICIAL_SNAPSHOT' | 'UNAVAILABLE' | 'INVALID_INPUT';
    errorDetails?: string;
  };
}

/**
 * Corroborates whether a verified legal entity belongs directly to the target agency,
 * is its parent municipality, or is an unrelated entity.
 */
export function evaluateOperatingRelationship(
  entity: NpiRegistryEntity,
  targetAgencyName: string,
  targetCity: string,
  targetStateCode: string
): { relationship: OperatingAgencyRelationshipType; summary: string } {
  const candState = (entity.practiceLocationAddress?.state || '').toUpperCase().trim();
  const tgtState = (targetStateCode || '').toUpperCase().trim();

  // 1. Mandatory State Isolation Gate
  if (candState && tgtState && candState !== tgtState) {
    return {
      relationship: 'UNRELATED_ENTITY',
      summary: `State mismatch: Registry entity is located in ${candState}, target agency is in ${tgtState}. Relationship rejected.`
    };
  }

  // 2. Reject Type 1 Individual Clinicians for Fire/EMS Organizations
  if (entity.enumerationType === 'NPI-1' || entity.isIndividual) {
    return {
      relationship: 'UNRELATED_ENTITY',
      summary: `Entity type mismatch: NPI #${entity.npi} is registered to an individual clinician (${entity.legalEntityName}), not an organization. Cannot verify Fire/EMS department.`
    };
  }

  const candNameLower = entity.legalEntityName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const tgtNameLower = targetAgencyName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const tgtCityLower = targetCity.toLowerCase().trim();

  // 3. Direct Operating Agency Match
  if (candNameLower.includes(tgtNameLower) || tgtNameLower.includes(candNameLower)) {
    return {
      relationship: 'OPERATING_RELATIONSHIP_CONFIRMED',
      summary: `Direct operating agency match: Registry legal entity "${entity.legalEntityName}" matches operating agency "${targetAgencyName}".`
    };
  }

  // 4. Parent Municipality Check (e.g., "CITY OF AUSTIN" for "Austin Emergency Medical Services", "CITY OF CHICAGO" for "Chicago Fire Department")
  const isCityOrCountyParent =
    candNameLower.startsWith('city of ') ||
    candNameLower.startsWith('town of ') ||
    candNameLower.startsWith('village of ') ||
    candNameLower.includes(' county') ||
    candNameLower.includes(' township');

  const matchesCity = tgtCityLower && candNameLower.includes(tgtCityLower);
  const hasAmbulanceTaxonomy = entity.primaryTaxonomy?.isAmbulanceRescue === true;

  if (isCityOrCountyParent && matchesCity && hasAmbulanceTaxonomy) {
    return {
      relationship: 'POSSIBLE_RELATED_ENTITY',
      summary: `Parent municipality confirmed: NPI #${entity.npi} belongs to parent municipality (${entity.legalEntityName}) under ambulance taxonomy ${entity.primaryTaxonomy?.code}. Operating agency (${targetAgencyName}) is a municipal division; operational attributes remain unverified.`
    };
  }

  if (matchesCity && hasAmbulanceTaxonomy) {
    return {
      relationship: 'POSSIBLE_RELATED_ENTITY',
      summary: `Registered ambulance provider in jurisdiction (${entity.legalEntityName}); municipal agency operating relationship requires independent contract corroboration.`
    };
  }

  return {
    relationship: 'RELATIONSHIP_UNRESOLVED',
    summary: `NPI #${entity.npi} is a valid registry organization (${entity.legalEntityName}), but relationship to operating agency "${targetAgencyName}" is unresolved.`
  };
}

/**
 * Queries the official CMS NPPES Registry API endpoint for a specific NPI.
 */
export async function queryOfficialNppesByNpi(
  npiCandidate: string,
  timeoutMs: number = 5000
): Promise<{
  status: 'SUCCESS' | 'NOT_FOUND' | 'SOURCE_UNAVAILABLE' | 'INVALID_FORMAT';
  entity?: NpiRegistryEntity;
  error?: string;
}> {
  const formatCheck = validateNpiCheckDigit(npiCandidate);
  if (!formatCheck.isValid) {
    return {
      status: 'INVALID_FORMAT',
      error: formatCheck.error || 'Invalid NPI format'
    };
  }

  const endpoint = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${formatCheck.npi}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Nick-EMS-Fire-Territory-Intelligence/1.0'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
      return {
        status: 'SOURCE_UNAVAILABLE',
        error: `CMS NPPES Registry returned HTTP ${res.status}`
      };
    }

    const data = await res.json() as {
      result_count?: number;
      results?: Array<{
        number: string;
        enumeration_type: string;
        basic?: {
          organization_name?: string;
          first_name?: string;
          last_name?: string;
          middle_name?: string;
          credential?: string;
          status?: string;
          last_updated?: string;
          certification_date?: string;
          authorized_official_first_name?: string;
          authorized_official_last_name?: string;
          authorized_official_title_or_position?: string;
          authorized_official_telephone_number?: string;
        };
        addresses?: Array<{
          address_purpose?: string;
          address_1?: string;
          address_2?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          telephone_number?: string;
        }>;
        taxonomies?: Array<{
          code?: string;
          desc?: string;
          primary?: boolean;
          state?: string;
          license?: string;
        }>;
      }>;
    };

    if (!data.results || data.results.length === 0) {
      return {
        status: 'NOT_FOUND',
        error: `NPI #${formatCheck.npi} not found in CMS NPPES Registry`
      };
    }

    const raw = data.results[0];
    const isOrg = raw.enumeration_type === 'NPI-2';
    const isInd = raw.enumeration_type === 'NPI-1';

    const legalName = isOrg
      ? (raw.basic?.organization_name || 'Unspecified Organization')
      : [raw.basic?.first_name, raw.basic?.middle_name, raw.basic?.last_name, raw.basic?.credential]
          .filter(Boolean)
          .join(' ');

    const locAddr = raw.addresses?.find(a => a.address_purpose === 'LOCATION') || raw.addresses?.[0];
    const mailAddr = raw.addresses?.find(a => a.address_purpose === 'MAILING');

    const primaryTax = raw.taxonomies?.find(t => t.primary) || raw.taxonomies?.[0];
    const isAmbulance = primaryTax
      ? (primaryTax.code === '341600000X' ||
         primaryTax.code === '3416L0300X' ||
         (primaryTax.desc || '').toLowerCase().includes('ambulance') ||
         (primaryTax.desc || '').toLowerCase().includes('rescue'))
      : false;

    const authOfficialFirst = raw.basic?.authorized_official_first_name || '';
    const authOfficialLast = raw.basic?.authorized_official_last_name || '';
    const authOfficialName = [authOfficialFirst, authOfficialLast].filter(Boolean).join(' ');

    const entity: NpiRegistryEntity = {
      npi: raw.number,
      enumerationType: isOrg ? 'NPI-2' : isInd ? 'NPI-1' : 'UNKNOWN',
      legalEntityName: legalName,
      isOrganization: isOrg,
      isIndividual: isInd,
      status: raw.basic?.status || 'A',
      lastUpdated: raw.basic?.last_updated || '',
      certificationDate: raw.basic?.certification_date,
      practiceLocationAddress: locAddr
        ? {
            street: [locAddr.address_1, locAddr.address_2].filter(Boolean).join(', '),
            city: locAddr.city || '',
            state: locAddr.state || '',
            zipCode: (locAddr.postal_code || '').slice(0, 5),
            telephone: locAddr.telephone_number
          }
        : undefined,
      mailingAddress: mailAddr
        ? {
            street: [mailAddr.address_1, mailAddr.address_2].filter(Boolean).join(', '),
            city: mailAddr.city || '',
            state: mailAddr.state || '',
            zipCode: (mailAddr.postal_code || '').slice(0, 5)
          }
        : undefined,
      primaryTaxonomy: primaryTax
        ? {
            code: primaryTax.code || '',
            description: primaryTax.desc || '',
            state: primaryTax.state,
            license: primaryTax.license,
            isAmbulanceRescue: isAmbulance
          }
        : undefined,
      allTaxonomies: (raw.taxonomies || []).map(t => ({
        code: t.code || '',
        description: t.desc || '',
        primary: Boolean(t.primary)
      })),
      authorizedOfficial: authOfficialName
        ? {
            name: authOfficialName,
            title: raw.basic?.authorized_official_title_or_position || 'Authorized Administrative Official',
            telephone: raw.basic?.authorized_official_telephone_number
          }
        : undefined
    };

    return {
      status: 'SUCCESS',
      entity
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return {
      status: 'SOURCE_UNAVAILABLE',
      error: isTimeout ? 'CMS NPPES API connection timed out' : 'CMS NPPES API network unreachable'
    };
  }
}
