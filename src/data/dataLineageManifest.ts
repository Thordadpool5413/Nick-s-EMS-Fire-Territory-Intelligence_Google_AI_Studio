/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency } from '../types';

export interface DataRegistrySource {
  id: string;
  name: string;
  acronym: string;
  governingBody: string;
  updateCadence: string;
  legalAuthority: string;
  schemaSpecification: string;
  primaryFieldsIngested: string[];
  verificationMethod: string;
}

export interface FieldLineageRecord {
  category: 'Operational Telemetry' | 'Installed Fleet' | 'Competitor Contracts' | 'Clinical & NEMSIS' | 'CMS Claims & Reimbursement' | 'Demographics & GIS' | 'Grants & Procurement';
  fieldName: string;
  fieldValue: string | number;
  sourceRegistry: string;
  schemaIdentifier: string;
  verificationStatus: 'Verified Official' | 'Cross-Referenced' | 'HIPAA De-Identified' | 'Legal Public Record' | 'Unverified Baseline' | 'Sourcing Required' | 'Model / Estimate' | 'Geographic Benchmark' | 'Public Record (No Active Award)';
  documentationQuote: string;
  isFieldVerified: boolean;
  sourceUrlOrCitation?: string;
  reportingPeriod?: string;
  evidenceBasis?: string;
  evidenceScope?: 'FIELD_VERIFIED' | 'ORGANIZATION_IDENTITY_ONLY' | 'REGIONAL_BENCHMARK' | 'MODELED_ESTIMATE' | 'UNVERIFIED';
}

export const DATA_REGISTRY_SOURCES: DataRegistrySource[] = [
  {
    id: 'cms_part_b',
    name: 'CMS Medicare Part B Ground Ambulance Claims Public Use File (PUF)',
    acronym: 'CMS PUF',
    governingBody: 'Centers for Medicare & Medicaid Services (U.S. Dept of Health & Human Services)',
    updateCadence: 'Annual Release with Quarterly Cost Data Adjustments',
    legalAuthority: 'Social Security Act § 1834(l) & 42 CFR § 414.610',
    schemaSpecification: 'HCPCS Ambulance Service Coding (A0425–A0434) & Remittance Advice Remark Codes (RARC)',
    primaryFieldsIngested: [
      'Medicare Billed & Allowed Amounts',
      'HCPCS A0427 (ALS-1 Emergency) & A0429 (BLS Emergency) Volumes',
      'Claim Denial Rates & Primary Denial Reason Codes (e.g. CO-16, PR-204)',
      'GADCS Cost-to-Charge Ratios'
    ],
    verificationMethod: 'Census of Medicare fee-for-service claims adjudicated through regional Medicare Administrative Contractors (MACs).'
  },
  {
    id: 'nemsis_v3',
    name: 'National Emergency Medical Services Information System (NEMSIS)',
    acronym: 'NEMSIS v3.5',
    governingBody: 'NHTSA Office of EMS (U.S. Dept of Transportation) & Technical Assistance Center (TAC)',
    updateCadence: 'Continuous State-Level Aggregation / National Benchmark Annual Release',
    legalAuthority: 'Highway Safety Act of 1966 (23 U.S.C. 403) & NHTSA Emergency Medical Services Mandate',
    schemaSpecification: 'NEMSIS Data Standard v3.5.0 XML / XSD HL7 Interoperability Protocol',
    primaryFieldsIngested: [
      'eDefib.01 - Initial Cardiac Arrest Rhythm',
      'eTimes.06 & eTimes.07 - Scene Arrival and Patient Contact Latencies',
      'eAirway.08 - Waveform Capnography ETCO2 Confirmation & Ventilation Compliance',
      'Cardiac-01 & Trauma-01 NEMSQA Standard Quality Benchmark Measures'
    ],
    verificationMethod: 'NEMSIS State EMS data submissions cross-validated against TAC compliance schemas.'
  },
  {
    id: 'usfa_registry',
    name: 'U.S. Fire Administration National Fire Department Registry',
    acronym: 'USFA NFIRS',
    governingBody: 'Federal Emergency Management Agency (DHS)',
    updateCadence: 'Monthly Official Census Dissemination',
    legalAuthority: 'Federal Fire Prevention and Control Act of 1974 (Public Law 93-498)',
    schemaSpecification: 'NFIRS 5.0 Complete Specification & USFA Department Master Record',
    primaryFieldsIngested: [
      'Department FDID (5-Digit State-Unique Identifier)',
      'Active Stations, Frontline Apparatus Engines, Ladders, and Ambulances',
      'Career, Volunteer, and Paid-Per-Call Active Fire/EMS Staffing Headcount',
      'Primary Physical Station Address & Municipal Authority Type'
    ],
    verificationMethod: 'State Fire Marshal attestation and USFA Registry validation.'
  },
  {
    id: 'fema_afg',
    name: 'FEMA Assistance to Firefighters Grant (AFG) & SAFER Awards Ledger',
    acronym: 'FEMA AFG / OpenFEMA',
    governingBody: 'U.S. Department of Homeland Security (DHS) / FEMA Grant Programs Directorate',
    updateCadence: 'Weekly Federal Award Obligation Feed',
    legalAuthority: 'Federal Funding Accountability and Transparency Act (FFATA) & FEMA GPD Title 44 CFR',
    schemaSpecification: 'USASpending Prime Award Financial Feed (Assistance Listing / CFDA 97.044 & 97.083)',
    primaryFieldsIngested: [
      'Active FY24/FY25 AFG Equipment Award Amounts ($)',
      'Specific Awarded Equipment Categories (Defibrillators, Mechanical CPR, Resuscitation Monitors)',
      'Recipient Legal Entity Name, Unique Entity Identifier (UEI), and Matching Share Pct',
      'Grant Period of Performance Expiration Deadlines'
    ],
    verificationMethod: 'Federal Treasury disbursement ledger records cross-referenced against local council acceptance resolutions.'
  },
  {
    id: 'nppes_npi',
    name: 'CMS National Plan and Provider Enumeration System (NPPES)',
    acronym: 'NPPES NPI Registry',
    governingBody: 'Centers for Medicare & Medicaid Services (HHS)',
    updateCadence: 'Daily NPI Registry Dissemination Feed',
    legalAuthority: 'HIPAA Administrative Simplification (45 CFR Part 162)',
    schemaSpecification: 'CMS FOIA Provider De-Identified Registry / National Provider Identifier (NPI Type 2)',
    primaryFieldsIngested: [
      'Provider Organization Legal Business Name & 10-Digit NPI',
      'Authorized Official Name, Title, and Physical Headquarters Address',
      'Taxonomy Code 341600000X (Ambulance Service Provider - Land Transport)',
      'Primary Practice Location State, County, and ZIP+4'
    ],
    verificationMethod: 'Federally attested provider identity database with active Medicare billing enrollment.'
  },
  {
    id: 'gpo_procurement',
    name: 'National Cooperative Procurement Contracts (Sourcewell, NPPGov, HGACBuy)',
    acronym: 'GPO Contracts',
    governingBody: 'Public Safety Purchasing Cooperatives & National Joint Powers Alliance',
    updateCadence: 'Master Contract Term Schedules & Published GSA/Cooperative Price Catalogs',
    legalAuthority: 'Uniform Municipal Joint Powers Act & State Intergovernmental Cooperation Statutes',
    schemaSpecification: 'Master Price Agreement Catalog with Competitive RFP Exemption Addenda',
    primaryFieldsIngested: [
      'Master Contract Number (Sourcewell #041819-ZOL, NPPGov PS20025, HGACBuy AM10-20)',
      'Standardized Government Discount Percentages (18% - 32% below list price)',
      'Pre-Negotiated Trade-In Allowances ($4,500 - $6,000 per incumbent unit)',
      'Statutory Legal Piggyback Clause Citations'
    ],
    verificationMethod: 'Publicly posted competitive bids, award letters, and legal council adoption resolutions.'
  }
];

export interface AgencyDataLineageAuditResult {
  records: FieldLineageRecord[];
  dimensionSummary: Record<string, { totalFields: number; verifiedFields: number }>;
  applicableAuditedFields: number;
  verifiedSupportedFields: number;
  evidenceCompletenessPct: number | null;
  integrityStatus: 'VERIFIED_CORROBORATED' | 'PARTIALLY_CORROBORATED' | 'INCOMPLETE_EVIDENCE' | 'UNASSESSED';
  integrityStatusLabel: string;
  overallIntegrityScore: number | null;
  assessmentStatus: 'AUDITED' | 'UNASSESSED';
}

/**
 * Audits all 7 core data dimensions for a specific department and returns
 * the exact field-by-field lineage, registry citations, and verification status.
 *
 * CRITICAL INTEGRITY REQUIREMENT:
 * Verification must be evaluated independently for each factual field based on a specific,
 * identifiable supporting source record and URL.
 * An agency's NPI match ONLY corroborates identity fields (NPI, legal name, address).
 * It does NOT substantiate equipment, warranty, fleet age, vendor contracts, or clinical quality.
 */
export function auditAgencyDataLineage(
  agency: Agency,
  assessmentStatus: 'AUDITED' | 'UNASSESSED' = 'AUDITED'
): AgencyDataLineageAuditResult {
  const calls = agency.annualCardiacArrestCalls || Math.round((agency.annual911Transports || 3000) * 0.12);

  // If agency is unassessed, evidence has not been audited yet
  if (assessmentStatus === 'UNASSESSED') {
    return {
      records: [],
      dimensionSummary: {},
      applicableAuditedFields: 0,
      verifiedSupportedFields: 0,
      evidenceCompletenessPct: null,
      integrityStatus: 'UNASSESSED',
      integrityStatusLabel: 'Evidence Not Assessed',
      overallIntegrityScore: null,
      assessmentStatus: 'UNASSESSED'
    };
  }

  // Independent field verification predicates:
  const hasVerifiedNpi = Boolean(agency.isVerifiedRecord && agency.npiNumber);
  const hasVerifiedLegalName = Boolean(agency.isVerifiedRecord && (agency.nppesOfficialName || agency.name));
  const hasVerifiedAddress = Boolean(agency.isVerifiedRecord && agency.address);
  const hasVerifiedFdid = Boolean(agency.isFdidVerified && agency.fdid);
  const hasVerifiedOperations = Boolean(agency.isOperationalDataVerified);
  
  const hasVerifiedEquipment = Boolean(
    agency.installedFleet?.isVerifiedEquipment && agency.installedFleet?.procurementResolutionId
  );
  const hasVerifiedFleetAge = Boolean(
    agency.installedFleet?.isVerifiedEquipment && agency.installedFleet?.capitalAssetLedgerId
  );
  const hasVerifiedWarranty = Boolean(agency.installedFleet?.isVerifiedWarranty);
  const hasVerifiedCPR = Boolean(
    agency.installedFleet?.isVerifiedEquipment && agency.installedFleet?.mechanicalCPR
  );

  const hasVerifiedContractVendor = Boolean(
    agency.competitorContract?.isVerifiedContract && agency.competitorContract?.contractNumber
  );
  const hasVerifiedContractEndDate = Boolean(
    agency.competitorContract?.isVerifiedContract && agency.competitorContract?.contractEndDate
  );
  const hasVerifiedMaintenanceBurden = Boolean(
    agency.competitorContract?.isVerifiedContract && agency.competitorContract?.annualServiceCostPerUnit
  );

  const hasVerifiedClinicalCalls = Boolean(agency.qualityMetrics?.isCaresVerified);
  const hasVerifiedUtsteinSurvival = Boolean(agency.qualityMetrics?.isCaresVerified);
  const hasVerifiedStemiRatio = Boolean(agency.qualityMetrics?.isNemsqaVerified);

  const hasVerifiedCmsBilled = Boolean(agency.cmsData?.isVerifiedCmsClaims);
  const hasVerifiedCmsDenials = Boolean(
    agency.cmsData?.isVerifiedCmsClaims &&
    agency.cmsData?.claimDenialRate !== undefined &&
    agency.cmsData?.claimDenialRate !== null
  );

  const hasVerifiedAfgGrant = Boolean(
    agency.grantStatus?.afgAwarded &&
    Array.isArray(agency.liveFemaAwards) &&
    agency.liveFemaAwards.length > 0
  );

  const records: FieldLineageRecord[] = [
    // 1. Operational Telemetry & Identifiers
    {
      category: 'Operational Telemetry',
      fieldName: 'Federal CMS NPI Number',
      fieldValue: agency.npiNumber || 'Unverified / Sourcing Required',
      sourceRegistry: 'CMS National Plan and Provider Enumeration System (NPPES)',
      schemaIdentifier: 'NPI Type 2 Organization Record',
      verificationStatus: hasVerifiedNpi ? 'Verified Official' : agency.npiNumber ? 'Cross-Referenced' : 'Sourcing Required',
      sourceUrlOrCitation: agency.npiNumber ? `https://npiregistry.cms.hhs.gov/provider-view/${agency.npiNumber}` : undefined,
      reportingPeriod: agency.nppesLastUpdated || 'NPPES Dissemination CY2026',
      documentationQuote: agency.npiNumber
        ? (hasVerifiedNpi
            ? `NPPES provider enrollment record confirmed: NPI #${agency.npiNumber}.`
            : `Preliminary candidate NPI #${agency.npiNumber}; pending live federal registry confirmation.`)
        : 'No confirmed CMS NPI number recorded; live federal registry query required.',
      evidenceBasis: hasVerifiedNpi ? 'Direct CMS NPPES Registry Type 2 Provider API enumeration.' : 'Candidate NPI pending corroborated provider lookup.',
      evidenceScope: hasVerifiedNpi ? 'FIELD_VERIFIED' : 'UNVERIFIED',
      isFieldVerified: hasVerifiedNpi
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Legal Organization Entity Name',
      fieldValue: agency.nppesOfficialName || agency.name,
      sourceRegistry: 'CMS National Plan and Provider Enumeration System (NPPES)',
      schemaIdentifier: 'NPI Legal Business Name (LBN)',
      verificationStatus: hasVerifiedLegalName ? 'Verified Official' : 'Unverified Baseline',
      sourceUrlOrCitation: agency.npiNumber ? `https://npiregistry.cms.hhs.gov/provider-view/${agency.npiNumber}` : undefined,
      reportingPeriod: agency.nppesLastUpdated || 'NPPES Dissemination CY2026',
      documentationQuote: hasVerifiedLegalName
        ? `Legal entity name attested under federal Medicare enrollment: ${agency.nppesOfficialName || agency.name}.`
        : `Operating name (${agency.name}); statutory legal business name not yet matched in federal registry.`,
      evidenceBasis: hasVerifiedLegalName ? 'Corroborated by CMS NPPES Legal Business Name record.' : 'Directory business label without federal attestation.',
      evidenceScope: hasVerifiedLegalName ? 'FIELD_VERIFIED' : 'UNVERIFIED',
      isFieldVerified: hasVerifiedLegalName
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Headquarters Physical Practice Address',
      fieldValue: agency.address || 'Uncorroborated / Sourcing Required',
      sourceRegistry: 'CMS NPPES Practice Location Registry',
      schemaIdentifier: 'Primary Practice Location Address',
      verificationStatus: hasVerifiedAddress ? 'Verified Official' : 'Sourcing Required',
      sourceUrlOrCitation: agency.npiNumber ? `https://npiregistry.cms.hhs.gov/provider-view/${agency.npiNumber}` : undefined,
      reportingPeriod: agency.nppesLastUpdated || 'NPPES Dissemination CY2026',
      documentationQuote: hasVerifiedAddress
        ? `Headquarters physical address confirmed via NPPES provider registry: ${agency.address}.`
        : 'Physical practice location unverified; postal address confirmation required.',
      evidenceBasis: hasVerifiedAddress ? 'NPPES practice location corroborated with local municipal jurisdiction.' : 'Uncorroborated postal string.',
      evidenceScope: hasVerifiedAddress ? 'FIELD_VERIFIED' : 'UNVERIFIED',
      isFieldVerified: hasVerifiedAddress
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Department Identifier (FDID)',
      fieldValue: agency.fdid || 'Not Recorded / Sourcing Required',
      sourceRegistry: 'USFA National Fire Department Registry',
      schemaIdentifier: 'NFIRS 5.0 State Agency Code',
      verificationStatus: hasVerifiedFdid ? 'Verified Official' : agency.fdid ? 'Cross-Referenced' : 'Sourcing Required',
      sourceUrlOrCitation: agency.usfaRegistryUrl || 'https://apps.usfa.fema.gov/registry/',
      reportingPeriod: 'USFA National Census 2026',
      documentationQuote: agency.fdid
        ? (hasVerifiedFdid
            ? `USFA certified fire department / EMS agency identifier: ${agency.fdid}.`
            : `Uncorroborated state agency identifier: ${agency.fdid}; USFA registry lookup required.`)
        : 'State fire marshal or EMS division identifier not confirmed.',
      evidenceBasis: hasVerifiedFdid ? 'USFA Registry certified fire department record.' : 'Uncorroborated state ID string.',
      evidenceScope: hasVerifiedFdid ? 'FIELD_VERIFIED' : 'UNVERIFIED',
      isFieldVerified: hasVerifiedFdid
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Annual 911 Call Volume',
      fieldValue: `${agency.annualCallVolume.toLocaleString()} calls`,
      sourceRegistry: hasVerifiedOperations ? 'Municipal CAFR Budget & Dispatch Audits' : 'Demographic Call Volume Estimation Model',
      schemaIdentifier: 'RunLog.01 Annual Dispatch Volume',
      verificationStatus: hasVerifiedOperations ? 'Verified Official' : 'Model / Estimate',
      reportingPeriod: hasVerifiedOperations ? 'FY2025 Municipal Operating Audit' : 'Modeled Baseline',
      documentationQuote: hasVerifiedOperations
        ? 'Derived from annual municipal operating budgets and state EMS annual performance audits.'
        : 'Estimated annual 911 dispatch volume modeled from regional population density.',
      evidenceBasis: hasVerifiedOperations ? 'Observed municipal run-log census.' : 'Demographic run-rate model projection.',
      evidenceScope: hasVerifiedOperations ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedOperations
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Annual 911 Emergency Transports',
      fieldValue: `${agency.annual911Transports.toLocaleString()} transports`,
      sourceRegistry: hasVerifiedOperations ? 'State EMS Office Annual Transport Census' : 'Emergency Transport Estimation Model',
      schemaIdentifier: 'eResponse.07 Unit Dispatched / Transported',
      verificationStatus: hasVerifiedOperations ? 'Verified Official' : 'Model / Estimate',
      reportingPeriod: hasVerifiedOperations ? 'CY2024 State EMS Census' : 'Modeled Baseline',
      documentationQuote: hasVerifiedOperations
        ? 'Cross-audited against CMS fee-for-service ground ambulance claims and state dispatch totals.'
        : 'Estimated emergency transport volume; verified ePCR run-log audit required.',
      evidenceBasis: hasVerifiedOperations ? 'State health department ePCR registry census.' : 'Regional transport ratio projection.',
      evidenceScope: hasVerifiedOperations ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedOperations
    },
    {
      category: 'Operational Telemetry',
      fieldName: 'Apparatus Fleet Breakdown',
      fieldValue: `${agency.totalAmbulances} Ambulances · ${agency.totalFireEngines} Fire Engines`,
      sourceRegistry: hasVerifiedOperations ? 'County Dispatch Apparatus Roster' : 'Municipal Station & Vehicle Density Model',
      schemaIdentifier: 'NFIRS Apparatus Inventory Record',
      verificationStatus: hasVerifiedOperations ? 'Verified Official' : 'Model / Estimate',
      reportingPeriod: hasVerifiedOperations ? 'CY2025 Active Dispatch Fleet' : 'Modeled Baseline',
      documentationQuote: hasVerifiedOperations
        ? 'Audited apparatus and active vehicle count registered with county dispatch.'
        : 'Modeled apparatus allocation; frontline fleet inventory inspection required.',
      evidenceBasis: hasVerifiedOperations ? 'Audited county dispatch CAD unit roster.' : 'Station density projection model.',
      evidenceScope: hasVerifiedOperations ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedOperations
    },

    // 2. Installed Equipment Fleet
    {
      category: 'Installed Fleet',
      fieldName: 'Incumbent Defibrillator Monitor Brand',
      fieldValue: agency.installedFleet?.defibBrand || 'Unknown Monitor Fleet',
      sourceRegistry: hasVerifiedEquipment ? 'Municipal Council RFP & Award Ledger' : 'Regional Competitive Equipment Model',
      schemaIdentifier: 'Equipment Procurement Contract Schedule',
      verificationStatus: hasVerifiedEquipment ? 'Legal Public Record' : 'Model / Estimate',
      sourceUrlOrCitation: agency.installedFleet?.procurementSourceDoc,
      reportingPeriod: hasVerifiedEquipment ? 'Executed Municipal Resolution' : 'Market Share Estimate',
      documentationQuote: hasVerifiedEquipment
        ? `Municipal council resolution #${agency.installedFleet.procurementResolutionId} verifies active purchase order for ${agency.installedFleet.defibBrand}.`
        : `Regional market share estimate (${agency.installedFleet?.defibBrand || 'Unknown'}); municipal purchase order or resolution unconfirmed.`,
      evidenceBasis: hasVerifiedEquipment ? 'Publicly disclosed municipal purchasing contract and resolution.' : 'Estimated regional market presence; unverified.',
      evidenceScope: hasVerifiedEquipment ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedEquipment
    },
    {
      category: 'Installed Fleet',
      fieldName: 'Defibrillator Fleet Age',
      fieldValue: `${agency.installedFleet?.defibAgeYears ?? '—'} years old`,
      sourceRegistry: hasVerifiedFleetAge ? 'Municipal Capital Asset Depreciation Ledger' : 'Capital Asset Lifecycle Estimate',
      schemaIdentifier: 'Asset Management Tag / Capital Inception Year',
      verificationStatus: hasVerifiedFleetAge ? 'Legal Public Record' : 'Model / Estimate',
      reportingPeriod: hasVerifiedFleetAge ? 'Capital Asset Ledger Record' : 'Modeled 7-Year Replacement Cycle',
      documentationQuote: hasVerifiedFleetAge
        ? `Capital asset depreciation ledger #${agency.installedFleet.capitalAssetLedgerId} records initial deployment date.`
        : 'Estimated fleet age based on typical 7-year municipal capital replacement cycle model.',
      evidenceBasis: hasVerifiedFleetAge ? 'Municipal asset management ledger.' : 'Typical capital depreciation cycle model.',
      evidenceScope: hasVerifiedFleetAge ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedFleetAge
    },
    {
      category: 'Installed Fleet',
      fieldName: 'Defibrillator Warranty / Service Status',
      fieldValue: agency.installedFleet?.defibWarrantyStatus || 'Unverified',
      sourceRegistry: hasVerifiedWarranty ? 'Manufacturer Maintenance Agreement Registry' : 'Standard OEM Warranty Lifecycle Model',
      schemaIdentifier: 'Service SLA Status Code',
      verificationStatus: hasVerifiedWarranty ? 'Legal Public Record' : 'Model / Estimate',
      sourceUrlOrCitation: agency.installedFleet?.warrantyContractDoc,
      reportingPeriod: hasVerifiedWarranty ? 'Active Service Contract Period' : 'Estimated SLA Lifecycle',
      documentationQuote: hasVerifiedWarranty
        ? 'Manufacturer maintenance agreement status verified against vendor contract registry.'
        : 'Warranty status inferred from estimated fleet vintage; service contract audit needed.',
      evidenceBasis: hasVerifiedWarranty ? 'Corroborated vendor maintenance agreement.' : 'Inferred from estimated hardware age.',
      evidenceScope: hasVerifiedWarranty ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedWarranty
    },
    {
      category: 'Installed Fleet',
      fieldName: 'Mechanical CPR Deployment',
      fieldValue: agency.installedFleet?.mechanicalCPR || 'Not Reported',
      sourceRegistry: hasVerifiedCPR ? 'State EMS Clinical Equipment Registry' : 'Clinical Equipment Adoption Model',
      schemaIdentifier: 'eEquipment.02 Mechanical Resuscitation',
      verificationStatus: hasVerifiedCPR ? 'Legal Public Record' : 'Model / Estimate',
      reportingPeriod: hasVerifiedCPR ? 'State Inspection CY2025' : 'Modeled Adoption Rate',
      documentationQuote: hasVerifiedCPR
        ? `Reported frontline resuscitation equipment: ${agency.installedFleet?.mechanicalCPR}.`
        : 'Resuscitation hardware configuration estimated from regional protocol norms.',
      evidenceBasis: hasVerifiedCPR ? 'Verified clinical inspection filing.' : 'Regional clinical protocol estimation.',
      evidenceScope: hasVerifiedCPR ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedCPR
    },

    // 3. Competitor Contracts
    {
      category: 'Competitor Contracts',
      fieldName: 'Current Service Contract Vendor',
      fieldValue: agency.competitorContract?.vendor || 'Unknown Vendor',
      sourceRegistry: hasVerifiedContractVendor ? 'City Council Contract Register' : 'Incumbent Service Provider Projection',
      schemaIdentifier: 'Vendor Master Agreement',
      verificationStatus: hasVerifiedContractVendor ? 'Legal Public Record' : 'Model / Estimate',
      sourceUrlOrCitation: agency.competitorContract?.contractSourceDoc,
      reportingPeriod: hasVerifiedContractVendor ? 'Active Vendor Term' : 'Estimated Relationship',
      documentationQuote: hasVerifiedContractVendor
        ? `Executed municipal agreement #${agency.competitorContract.contractNumber} documents service with ${agency.competitorContract.vendor}.`
        : 'Vendor relationship inferred from hardware brand; executed master contract required.',
      evidenceBasis: hasVerifiedContractVendor ? 'Public city council approved agreement.' : 'Inferred brand association.',
      evidenceScope: hasVerifiedContractVendor ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedContractVendor
    },
    {
      category: 'Competitor Contracts',
      fieldName: 'Service Contract Expiration Date',
      fieldValue: agency.competitorContract?.contractEndDate || 'Not Recorded',
      sourceRegistry: hasVerifiedContractEndDate ? 'Public Procurement Contract Register' : 'Estimated Master Contract Cycle',
      schemaIdentifier: 'Contract Schedule Expiration Date',
      verificationStatus: hasVerifiedContractEndDate ? 'Legal Public Record' : 'Model / Estimate',
      reportingPeriod: hasVerifiedContractEndDate ? 'Executed Contract Expiration' : 'Projected Renewal Window',
      documentationQuote: hasVerifiedContractEndDate
        ? `Scheduled contract termination on ${agency.competitorContract?.contractEndDate}.`
        : 'Contract renewal window estimated; official legal public notice required.',
      evidenceBasis: hasVerifiedContractEndDate ? 'Public procurement contract register.' : 'Estimated 3-5 year renewal cycle.',
      evidenceScope: hasVerifiedContractEndDate ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedContractEndDate
    },
    {
      category: 'Competitor Contracts',
      fieldName: 'Annual Service Maintenance Burden',
      fieldValue: agency.competitorContract?.annualServiceCostPerUnit
        ? `$${agency.competitorContract.annualServiceCostPerUnit.toLocaleString()} / unit / year`
        : '—',
      sourceRegistry: hasVerifiedMaintenanceBurden ? 'Municipal Operating Budget Purchase Orders' : 'Actuarial Service Maintenance Benchmark',
      schemaIdentifier: 'Accounting Object Code 5320 - Maintenance',
      verificationStatus: hasVerifiedMaintenanceBurden ? 'Legal Public Record' : 'Model / Estimate',
      reportingPeriod: hasVerifiedMaintenanceBurden ? 'FY2025 Operating Budget Line' : 'Estimated Catalog Rate',
      documentationQuote: hasVerifiedMaintenanceBurden
        ? 'Derived from audited annual municipal equipment maintenance line items.'
        : 'Estimated maintenance burden based on published manufacturer catalog rates.',
      evidenceBasis: hasVerifiedMaintenanceBurden ? 'Audited municipal line-item expenditure.' : 'Market catalog benchmark.',
      evidenceScope: hasVerifiedMaintenanceBurden ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedMaintenanceBurden
    },

    // 4. Clinical & NEMSIS
    {
      category: 'Clinical & NEMSIS',
      fieldName: 'Out-of-Hospital Cardiac Arrests (OHCA)',
      fieldValue: `${calls.toLocaleString()} calls/yr`,
      sourceRegistry: hasVerifiedClinicalCalls ? 'NEMSIS v3.5 Registry & CARES Incident Records' : 'Regional Cardiac Arrest Incidence Model',
      schemaIdentifier: 'eDefib.01 Cardiac Resuscitation Event',
      verificationStatus: hasVerifiedClinicalCalls ? 'HIPAA De-Identified' : 'Model / Estimate',
      reportingPeriod: hasVerifiedClinicalCalls ? 'CARES Registry CY2024' : 'AHA Demographic Incidence Model',
      documentationQuote: hasVerifiedClinicalCalls
        ? 'Authoritative annual cardiac resuscitation event volume reported under NEMSIS/CARES registry protocols.'
        : 'Estimated cardiac arrest volume modeled from population demographics and AHA incidence rates.',
      evidenceBasis: hasVerifiedClinicalCalls ? 'NEMSIS eDefib.01 verified submission.' : 'Demographic AHA model.',
      evidenceScope: hasVerifiedClinicalCalls ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedClinicalCalls
    },
    {
      category: 'Clinical & NEMSIS',
      fieldName: 'Utstein ROSC Survival to Discharge',
      fieldValue: `${agency.utsteinSurvivalRate}%`,
      sourceRegistry: hasVerifiedUtsteinSurvival ? 'CARES Registry Agency Submission' : 'State CARES Benchmark Summary',
      schemaIdentifier: 'CARES Outcome Variable CPC 1 & 2',
      verificationStatus: hasVerifiedUtsteinSurvival ? 'HIPAA De-Identified' : 'Geographic Benchmark',
      reportingPeriod: hasVerifiedUtsteinSurvival ? 'CARES Standardized Utstein CY2024' : 'State Aggregate Summary',
      documentationQuote: hasVerifiedUtsteinSurvival
        ? `Standardized Utstein formula survival rate verified via CARES agency submission (${agency.utsteinSurvivalRate}%).`
        : 'State-level CARES registry benchmark; individual agency registry reporting not confirmed.',
      evidenceBasis: hasVerifiedUtsteinSurvival ? 'Direct CARES registry agency submission.' : 'Statewide aggregate benchmark; unverified at agency level.',
      evidenceScope: hasVerifiedUtsteinSurvival ? 'FIELD_VERIFIED' : 'REGIONAL_BENCHMARK',
      isFieldVerified: hasVerifiedUtsteinSurvival
    },
    {
      category: 'Clinical & NEMSIS',
      fieldName: 'STEMI 12-Lead Transmission Ratio',
      fieldValue: `${Math.round(calls * 0.165)} activations / yr`,
      sourceRegistry: hasVerifiedStemiRatio ? 'NEMSQA Cardiac-01 Quality Measure' : 'NEMSQA Protocol Activation Model',
      schemaIdentifier: 'Cardiac-01 STEMI 12-Lead <= 10min',
      verificationStatus: hasVerifiedStemiRatio ? 'Verified Official' : 'Model / Estimate',
      reportingPeriod: hasVerifiedStemiRatio ? 'NEMSQA Quality Reporting CY2024' : 'Modeled Activation Ratio',
      documentationQuote: hasVerifiedStemiRatio
        ? 'Compliance rate with AHA Mission: Lifeline pre-hospital ECG transmission to PCI Cath Lab.'
        : 'Modeled STEMI transmission volume; agency clinical documentation review required.',
      evidenceBasis: hasVerifiedStemiRatio ? 'NEMSQA measure Cardiac-01 registry filing.' : 'Modeled activation estimate.',
      evidenceScope: hasVerifiedStemiRatio ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedStemiRatio
    },

    // 5. CMS Claims & Reimbursement
    {
      category: 'CMS Claims & Reimbursement',
      fieldName: 'Annual Medicare Billed Volume',
      fieldValue: agency.cmsData?.medicareBilledAnnual
        ? `$${(agency.cmsData.medicareBilledAnnual / 1000).toFixed(0)}K billed`
        : '—',
      sourceRegistry: hasVerifiedCmsBilled ? 'CMS Medicare Part B Ground Ambulance Claims PUF' : 'Fee-for-Service Ambulance Billing Model',
      schemaIdentifier: 'Form CMS-1500 Fee-for-Service Census',
      verificationStatus: hasVerifiedCmsBilled ? 'Verified Official' : 'Model / Estimate',
      reportingPeriod: hasVerifiedCmsBilled ? (agency.cmsData?.cmsClaimPufYear || 'CMS Part B PUF CY2024') : 'Modeled Baseline',
      documentationQuote: hasVerifiedCmsBilled
        ? 'Ingested from CMS Part B Ground Ambulance Public Use File for primary NPI/MAC jurisdiction.'
        : 'Modeled billing volume; CMS Part B Provider Public Use File record not corroborated.',
      evidenceBasis: hasVerifiedCmsBilled ? 'Adjudicated CMS Part B claims fee-for-service file.' : 'Estimated billing census.',
      evidenceScope: hasVerifiedCmsBilled ? 'FIELD_VERIFIED' : 'MODELED_ESTIMATE',
      isFieldVerified: hasVerifiedCmsBilled
    },
    {
      category: 'CMS Claims & Reimbursement',
      fieldName: 'Medicare Claim Denial Rate',
      fieldValue: agency.cmsData?.claimDenialRate !== undefined && agency.cmsData?.claimDenialRate !== null
        ? `${agency.cmsData.claimDenialRate}%`
        : 'Not available',
      sourceRegistry: hasVerifiedCmsDenials ? 'CMS Remittance Advice Remark Code (RARC) Feed' : 'Medicare Administrative Contractor (MAC) Summary',
      schemaIdentifier: 'Claim Status Reason Code (CARC/RARC)',
      verificationStatus: hasVerifiedCmsDenials ? 'Verified Official' : 'Geographic Benchmark',
      reportingPeriod: hasVerifiedCmsDenials ? (agency.cmsData?.cmsPufReportingPeriod || 'CY2024') : 'MAC Jurisdiction Baseline',
      documentationQuote: hasVerifiedCmsDenials
        ? `Documented claim denial rate based on ${agency.cmsData?.topDenialReason || 'prior authorization / medical necessity'} exceptions.`
        : 'Individual agency or county Medicare Part B claims record not observed. Denial rates are adjudicated at MAC jurisdiction level.',
      evidenceBasis: hasVerifiedCmsDenials ? 'Adjudicated CMS claims remittance ledger.' : 'Unobserved provider rate; MAC benchmark only.',
      evidenceScope: hasVerifiedCmsDenials ? 'FIELD_VERIFIED' : 'REGIONAL_BENCHMARK',
      isFieldVerified: hasVerifiedCmsDenials
    },
    {
      category: 'CMS Claims & Reimbursement',
      fieldName: 'Addressable Cash Recovery via Clean Claims',
      fieldValue: agency.cmsData?.estimatedRecoverableRevenue
        ? `$${(agency.cmsData.estimatedRecoverableRevenue / 1000).toFixed(0)}K recoverable (Projected)`
        : '—',
      sourceRegistry: 'Actuarial Billing Model Projection (ZOLL AR Boost)',
      schemaIdentifier: 'Actuarial Billing Model Projection',
      verificationStatus: 'Model / Estimate',
      reportingPeriod: 'Financial Opportunity Model',
      documentationQuote: 'Actuarial revenue recovery projection achievable by transitioning to clean-claim automated documentation workflows. Modeled projection; not an observed historical financial ledger.',
      evidenceBasis: 'Deterministic actuarial formula; explicitly modeled scenario.',
      evidenceScope: 'MODELED_ESTIMATE',
      isFieldVerified: false // Strictly modeled financial scenario, never an observed historical fact!
    },

    // 6. Demographics & GIS
    {
      category: 'Demographics & GIS',
      fieldName: 'Cath Lab Transport Drive Time',
      fieldValue: `${agency.gisData?.avgTransportTimeMinutes ?? '—'} min (${agency.gisData?.distanceToNearestCathLabMiles ?? '—'} mi)`,
      sourceRegistry: 'US DOT National Highway System & OpenStreetMap GIS',
      schemaIdentifier: 'Isochrone Distance Calculation',
      verificationStatus: 'Model / Estimate',
      reportingPeriod: 'GIS Routing Engine Analysis',
      documentationQuote: 'Geospatially routed drive time estimate from department stations to primary receiving cardiac center.',
      evidenceBasis: 'Automated geospatial network routing; modeled drive time estimate.',
      evidenceScope: 'MODELED_ESTIMATE',
      isFieldVerified: false
    },

    // 7. Grants & Procurement
    {
      category: 'Grants & Procurement',
      fieldName: 'FEMA AFG Award Status',
      fieldValue: agency.grantStatus?.afgAwarded
        ? `Awarded ($${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K)`
        : 'No Active Federal Award Found',
      sourceRegistry: 'USASpending.gov FEMA Assistance to Firefighters Grants',
      schemaIdentifier: 'CFDA 97.044 Federal Prime Award',
      verificationStatus: hasVerifiedAfgGrant
        ? 'Legal Public Record'
        : agency.grantStatus?.afgAwarded
          ? 'Cross-Referenced'
          : 'Public Record (No Active Award)',
      sourceUrlOrCitation: hasVerifiedAfgGrant && agency.liveFemaAwards?.[0]?.awardNumber
        ? `https://www.usaspending.gov/award/${agency.liveFemaAwards[0].awardNumber}`
        : 'https://www.usaspending.gov/search',
      reportingPeriod: hasVerifiedAfgGrant && agency.liveFemaAwards?.[0]?.programYear
        ? `FY${agency.liveFemaAwards[0].programYear}`
        : 'Current Federal Fiscal Year',
      documentationQuote: agency.grantStatus?.afgAwarded
        ? (hasVerifiedAfgGrant
            ? `Federal funding confirmed via OpenFEMA API: ${agency.liveFemaAwards![0].awardNumber}.`
            : `Reported federal award of $${(agency.grantStatus.afgAwardAmount / 1000).toFixed(0)}K; federal grant disbursement pending.`)
        : 'Authoritative federal grant ledger confirms no active FEMA AFG equipment obligation for this agency in current FY.',
      evidenceBasis: hasVerifiedAfgGrant ? 'Verified federal award transaction in USASpending prime award ledger.' : 'Uncorroborated grant report.',
      evidenceScope: hasVerifiedAfgGrant ? 'FIELD_VERIFIED' : 'UNVERIFIED',
      isFieldVerified: hasVerifiedAfgGrant
    }
  ];

  const dimensionSummary: Record<string, { totalFields: number; verifiedFields: number }> = {};
  for (const rec of records) {
    if (!dimensionSummary[rec.category]) {
      dimensionSummary[rec.category] = { totalFields: 0, verifiedFields: 0 };
    }
    dimensionSummary[rec.category].totalFields += 1;
    if (rec.isFieldVerified) {
      dimensionSummary[rec.category].verifiedFields += 1;
    }
  }

  const applicableAuditedFields = records.length; // Exactly 22 fields
  const verifiedSupportedFields = records.filter(r => r.isFieldVerified).length;

  const evidenceCompletenessPct = Math.round((verifiedSupportedFields / applicableAuditedFields) * 100);
  const overallIntegrityScore = evidenceCompletenessPct;

  let integrityStatus: 'VERIFIED_CORROBORATED' | 'PARTIALLY_CORROBORATED' | 'INCOMPLETE_EVIDENCE' | 'UNASSESSED' = 'INCOMPLETE_EVIDENCE';
  let integrityStatusLabel = 'Incomplete Evidence / Sourcing Required';

  if (verifiedSupportedFields === 0) {
    integrityStatus = 'INCOMPLETE_EVIDENCE';
    integrityStatusLabel = 'Incomplete Evidence (0%)';
  } else if (verifiedSupportedFields < 15) {
    integrityStatus = 'PARTIALLY_CORROBORATED';
    integrityStatusLabel = hasVerifiedNpi
      ? `Identity Corroborated (${evidenceCompletenessPct}%) · Equipment & Contracts Unverified`
      : `Partially Corroborated Evidence (${evidenceCompletenessPct}%)`;
  } else {
    integrityStatus = 'VERIFIED_CORROBORATED';
    integrityStatusLabel = `Multi-Source Corroborated (${evidenceCompletenessPct}%)`;
  }

  return {
    records,
    dimensionSummary,
    applicableAuditedFields,
    verifiedSupportedFields,
    evidenceCompletenessPct,
    integrityStatus,
    integrityStatusLabel,
    overallIntegrityScore,
    assessmentStatus: 'AUDITED'
  };
}
