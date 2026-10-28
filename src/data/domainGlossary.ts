/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DomainGlossaryEntry {
  id: string;
  term: string;
  shortLabel: string;
  category: 'Actuarial & Scoring' | 'Federal Registry' | 'Clinical & Regulatory' | 'Reimbursement & Billing' | 'Procurement & Grants';
  plainEnglish: string;
  whyItMattersToRep: string;
  officialSource?: string;
}

export const DOMAIN_GLOSSARY: Record<string, DomainGlossaryEntry> = {
  pulseiq: {
    id: 'pulseiq',
    term: 'PulseIQ™ Opportunity Score (0–100)',
    shortLabel: 'PulseIQ™',
    category: 'Actuarial & Scoring',
    plainEnglish:
      'A transparent 0–100 priority score combining 5 real-world signals: how old their current monitors are (25 pts), how much Medicare money they lose to billing denials (20 pts), cardiac arrest call volume (20 pts), FEMA grant readiness (20 pts), and software compatibility (15 pts).',
    whyItMattersToRep:
      'Focus your week on agencies scoring 85+ first—they have aging equipment near end-of-warranty AND immediate funding or billing recovery to pay for an upgrade.',
    officialSource: 'Deterministic 5-Factor Actuarial Formula'
  },
  cms_npi: {
    id: 'cms_npi',
    term: 'CMS NPPES 10-Digit NPI Registry',
    shortLabel: 'CMS NPI',
    category: 'Federal Registry',
    plainEnglish:
      'The official U.S. government National Provider Identifier (NPI) registry maintained by Medicare (CMS). Every ambulance service billing Medicare or Medicaid must register its legal headquarters address, taxonomy code, and Authorized Official (Chief/Director) here.',
    whyItMattersToRep:
      'Gives you the federally verified decision-maker name and title on file with Medicare, plus a 1-click link to prove the record is 100% real.',
    officialSource: 'npiregistry.cms.hhs.gov'
  },
  fema_afg: {
    id: 'fema_afg',
    term: 'FEMA Assistance to Firefighters Grants (AFG)',
    shortLabel: 'FEMA AFG',
    category: 'Procurement & Grants',
    plainEnglish:
      'Federal funding awarded directly by FEMA to fire departments and non-affiliated EMS agencies to purchase cardiac monitors, mechanical CPR devices, and training equipment—covering 85% to 95% of the cost with federal dollars.',
    whyItMattersToRep:
      'When an agency wins an AFG Equipment grant (or is eligible to apply), they only have to pay a 5%–15% local match out of their municipal budget.',
    officialSource: 'fema.gov/api/open/v2/AssistanceToFirefightersGrants'
  },
  nemsis_v35: {
    id: 'nemsis_v35',
    term: 'NEMSIS v3.5.0 National EMS Data Standard',
    shortLabel: 'NEMSIS v3.5.0',
    category: 'Clinical & Regulatory',
    plainEnglish:
      'The mandatory national standard for electronic Patient Care Reports (ePCR). State EMS offices require every agency to submit run reports in v3.5.0 format with complete clinical waveform and vital-sign data.',
    whyItMattersToRep:
      'Older monitors often drop waveform packets or require manual typing into ePCR software. ZOLL cloud telemetry auto-populates NEMSIS v3.5.0 fields directly from the monitor.',
    officialSource: 'nemsis.org (NHTSA Office of EMS)'
  },
  cms_gadcs: {
    id: 'cms_gadcs',
    term: 'CMS Ground Ambulance Data Collection System (GADCS)',
    shortLabel: 'CMS GADCS',
    category: 'Reimbursement & Billing',
    plainEnglish:
      'A federal Medicare mandate requiring ground ambulance agencies to report exact operating costs, fleet expenses, and revenue. Agencies that fail to report face a mandatory 10% cut to all Medicare reimbursements.',
    whyItMattersToRep:
      'Chiefs and finance directors are under intense pressure to prove exact equipment TCO and eliminate unbilled or denied runs to protect their Medicare revenue.',
    officialSource: 'cms.gov/medicare/payment/fee-schedules/ambulance/ground-ambulance-data-collection-system'
  },
  co16_denial: {
    id: 'co16_denial',
    term: 'CARC CO-16 Claim Denial ("Missing Documentation")',
    shortLabel: 'CO-16 Denial',
    category: 'Reimbursement & Billing',
    plainEnglish:
      'The #1 reason Medicare and insurance companies reject an ambulance bill: the claim is missing a required 12-lead ECG strip, ETCO₂ waveform, or medical necessity signature from the field crew.',
    whyItMattersToRep:
      'Showing an EMS Director how automated monitor-to-billing uploads recover $40K–$150K/year in rejected CO-16 claims often pays for the entire monitor fleet.',
    officialSource: 'X12 Claim Adjustment Reason Code CO-16'
  },
  cares_cpc: {
    id: 'cares_cpc',
    term: 'CARES Utstein Survival & CPC 1–2 Neurological Outcome',
    shortLabel: 'Utstein / CPC 1–2',
    category: 'Clinical & Regulatory',
    plainEnglish:
      'The gold-standard clinical benchmark for cardiac arrest: what percentage of witnessed cardiac arrest patients survive to leave the hospital with full brain function (Cerebral Performance Category 1 or 2).',
    whyItMattersToRep:
      'Medical Directors care most about neurologically intact survival. Real CPR Help®, See-Thru CPR®, and Real BVM Help® directly target AHA guidelines (>80% compression fraction, <10s pre-shock pause).',
    officialSource: 'mycares.net & 2020/2025 AHA ECC Guidelines'
  },
  coop_contracts: {
    id: 'coop_contracts',
    term: 'Cooperative Purchasing Vehicles (Sourcewell / HGACBuy / NPPGov)',
    shortLabel: 'Co-Op Contracts',
    category: 'Procurement & Grants',
    plainEnglish:
      'Pre-competed national government purchasing contracts (#041823-ZOL, #EE08-24, #PS20200). Cities and counties can buy directly off these contracts without waiting 6–9 months to write and bid a public RFP.',
    whyItMattersToRep:
      'Lets a Fire Chief or City Purchasing Agent bypass a lengthy competitive bidding war and issue a purchase order in weeks instead of months.',
    officialSource: 'Sourcewell #041823-ZOL · HGACBuy #EE08-24 · NPPGov #PS20200'
  }
};
