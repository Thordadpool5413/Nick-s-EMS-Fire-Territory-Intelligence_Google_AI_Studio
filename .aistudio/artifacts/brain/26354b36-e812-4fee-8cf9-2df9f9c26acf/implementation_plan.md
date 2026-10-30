# Comprehensive Data Integrity & Continuous Accuracy Architecture
## Nick's EMS & Fire Territory Intelligence

Establish an enterprise-grade, four-pillar verification architecture that guarantees the continuous factual accuracy, mathematical correctness, and clear provenance of all data, calculations, and operational intelligence across the platform.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core architectural decisions were confirmed based on your responses:

- **Validation Level Confirmed**: Multi-layered validation pipeline combining format/algorithm gates, live federal registry corroboration (CMS NPPES v2.1 and OpenFEMA), 5-tier operating relationship classification, and resilient non-destructive offline fallbacks.
- **Data Presentation Confirmed**: Explicit field-level badging distinguishing `Verified Official Record`, `Geographic Benchmark`, `Model / Estimate`, and `Unverified Candidate`, paired with direct clickable public citations (NPPES view, OpenFEMA dataset, CMS PUF).
- **Monitoring Architecture Confirmed**: Dedicated real-time Data Integrity Monitor & Audit Console (`DataHealthDashboard`) embedded directly in the platform navigation for live status tracking, anomaly detection, and one-click read-only audits.
- **Production Data Invariant**: Zero automated or destructive mutations against the production Firestore database (`ai-studio-nicksemsfireterr-26354b36-e812-4fee-8cf9-2df9f9c26acf`). All audit scripts and integrity inspections operate strictly in-memory and read-only.

---

## 1. Overview & Core Concept

### What It Does
Ensures that no fact, metric, or entity identity can appear in the application without verifiable proof and strict mathematical validation:
1. **Mathematical Invariant Gates**: Enforces the official CMS 80840-prefixed Luhn check digit algorithm on all 10-digit NPIs and validates FIPS/FDID geographic hierarchies before any query or persistence.
2. **Live Federal Grounding**: Queries official federal APIs (CMS NPPES v2.1, OpenFEMA, and USFA) in real time, evaluating organizational taxonomy (`341600000X`), Type 2 Organization vs Type 1 Individual classification, and municipal operating relationships.
3. **Field-Level Decoupling**: Eliminates false "halo verification"—an agency's verified NPI only substantiates legal identity and practice address; equipment inventories, maintenance contracts, and clinical metrics remain explicitly labeled as estimates until independently corroborated.
4. **Real-Time Data Health Console**: Provides an interactive command center to inspect data purity %, review check digit validation status, and triage mismatched entities.

### Target Audience & Persona
- **Nick (Territory Manager / Clinical Specialist)**: Relies on high-stakes capital equipment and software intelligence; needs total confidence that account contacts, NPIs, and clinical benchmarks are factually accurate.
- **Sales Leadership & Enterprise Stakeholders**: Requires institutional auditability and transparent data lineage to substantiate ROI projections and proposal metrics.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing an Account with Provenance Transparency**:
   - The user opens an agency card in Account 360 or County Directory.
   - Identity metrics (Legal Entity, NPI, Practice Address) show a crisp verified indicator with a direct link: `"CMS NPPES v2.1 (Certified 2024-01-05)"`.
   - Fleet metrics (Defibrillator Brand, Age, Service Contract) show `"Model / Estimate"` with an info drawer detailing the calculation formula.
   - Missing county Medicare data displays `"Not available"` alongside an isolated `"State Benchmark (Geographic Reference)"` badge.

2. **Inspecting Platform Data Health via the Audit Console**:
   - The user navigates to the **Data Health & Integrity** console from the primary sidebar or top navigation.
   - The top hero displays three core health meters:
     - **Data Purity**: Calculated from verified check digits and zero mock/synthetic entities.
     - **Federal Registry Grounding**: Count and percentage of agencies corroborated via live NPPES API.
     - **Cloud Persistence Coverage**: Firestore synchronized accounts vs baseline prospects.
   - The user reviews the **NPI Integrity Audit Table**, filtering by status (`Valid Matched`, `Valid Mismatched`, `Invalid Check Digit`).
   - Clicking `"Run Deep Read-Only Audit"` re-verifies all active records in memory without altering production data.

3. **Resolving a Flagged Mismatch**:
   - When an NPI belongs to an individual clinician (e.g. Dr. Maureen Connolly `1982736450` for Chicago Fire), the console displays an amber warning badge: `Mismatched Entity (Type 1 Individual)`.
   - The user can view the official NPPES record, review the conflict, and link the authentic organizational NPI (`1376554592` City of Chicago).

### Visual Identity & Theme
- **Color Palette & Discipline**:
  - Dominant Neutral Field: Crisp light canvas (`#F8FAFC`) / Deep slate dark mode (`#0B132B`).
  - Structural Borders: Hairline 1px dividers (`#E2E8F0` / `#1E293B`).
  - Status Accents (strictly semantic):
    - Emerald (`#16A34A`): Verified Federal Record (NPPES / OpenFEMA).
    - Amber (`#D97706`): Actuarial Model / Estimate or Mismatched Review Required.
    - Crimson (`#DC2626`): Check Digit / Format Failure.
    - Slate/Neutral (`#64748B`): Geographic Benchmark / Unassessed.
- **Typography & Tabular Numerals**:
  - Display & Headings: `Plus Jakarta Sans` / `Outfit` font family.
  - Body & Metadata: `Plus Jakarta Sans` / `DM Sans`.
  - Numbers & Identifiers: Strictly `font-mono tabular-nums` (`Instrument Sans` / `JetBrains Mono`) for perfect vertical alignment in tables and cards.
  - Zero-Pill Discipline: Unboxed text with typographic separators (`·`, `/`) instead of chunky pill containers.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Multi-Layered Validation vs. Live-Only Gate
- **Chosen Approach**: Three-tier validation pipeline: (1) Local Format & Checksum Gate $\rightarrow$ (2) Live Federal API Query $\rightarrow$ (3) Operating Relationship Classifier with Non-Destructive Offline Cache.
- **Why**: Pure live-only queries fail when CMS NPPES has upstream maintenance or network timeouts. The multi-layered pipeline validates format instantly, queries live records when online, and gracefully preserves user data under `SOURCE_UNAVAILABLE` without wiping notes or bookmarks.
- **Alternatives Considered**: Dropping unverified records entirely (rejected: would eliminate 3,000+ prospective sales accounts).

### Decision 2: Field-Level Provenance Decoupling
- **Chosen Approach**: Decouple identity verification from operational metrics. An agency's NPI confirmation validates only the 3 identity fields; equipment and clinical fields remain labeled as estimates.
- **Why**: Completely solves the "91% verification problem" where confirming an NPI falsely marked fleet ages and vendor contracts as verified.
- **Alternatives Considered**: Binary verified/unverified agency flag (rejected: misleading to users).

### Decision 3: Non-Destructive In-Memory Audit vs. Background Auto-Purge
- **Chosen Approach**: In-memory inspection and audit reporting. Deletion of production Firestore records is strictly blocked unless explicitly authorized via administrative confirmation.
- **Why**: Protects production database `ai-studio-nicksemsfireterr-26354b36-e812-4fee-8cf9-2df9f9c26acf` from accidental data loss during automated test runs or audit passes.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION & VIEWPORT LAYOUT                     │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │ County Directory & GIS│  │ Account 360 Dossier│  │ Data Health Hub  │  │
│  └───────────┬───────────┘  └─────────┬──────────┘  └────────┬─────────┘  │
└──────────────┼────────────────────────┼──────────────────────┼────────────┘
               │                        │                      │
               ▼                        ▼                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       PROVENANCE & VALIDATION LAYER                       │
│                                                                           │
│  1. Checksum & Format Gate (dataSanitizationService)                      │
│     • CMS Luhn-80840: '80840' + 10-digit NPI, pos from right mod-10      │
│     • FIPS Code & State Postal Validation                                 │
│                                                                           │
│  2. Live Federal Registry Integration (/api/npi/verify, server.ts)        │
│     • CMS NPPES Registry API v2.1 (Type 2 Org vs Type 1 Indiv)            │
│     • OpenFEMA API (AFG / SAFER Grant Awards)                             │
│                                                                           │
│  3. 5-Tier Operating Relationship Classifier                              │
│     • REGISTRY_ENTITY_CONFIRMED       • RELATIONSHIP_UNRESOLVED           │
│     • OPERATING_RELATIONSHIP_CONFIRMED • UNRELATED_ENTITY (Blocked)       │
│     • POSSIBLE_RELATED_ENTITY (Parent Municipality)                       │
│                                                                           │
│  4. Field-Level Lineage Audit (dataLineageManifest.ts)                    │
│     • Decouples Identity vs Equipment vs Clinical Metrics                 │
│     • Assigns Verified vs Benchmark vs Model provenance tiers             │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  PERSISTENCE & STATE STORE   │              │   AUTOMATED REGRESSION CI    │
│  • Google Cloud Firestore    │              │   • tests/dataIntegrity.test │
│    ai-studio-nicksemsfire... │              │   • 69+ Automated Tests      │
│  • Zero Destructive Purges   │              │   • Test Vectors Validation  │
│  • Offline syncStore Cache   │              │   • Pre-commit Build Linter  │
└──────────────────────────────┘              └──────────────────────────────┘
```

### Component & Handler Mapping
1. **`src/services/dataSanitizationService.ts`**:
   - `validateNpiCheckDigit`: Official 80840-prefixed Luhn algorithm.
   - `computeCmsNpiCheckDigit`: Check digit generation for 9-digit base NPIs.
   - `sanitizeAgency` / `sanitizeAgenciesList`: Strips mock records and enforces provenance tiers.
2. **`src/services/npiVerificationService.ts`**:
   - `queryOfficialNppesByNpi`: Real-time HTTP client with 5s timeout and abort controller.
   - `evaluateOperatingRelationship`: Enforces state isolation and flags Type 1 individual clinicians.
3. **`src/data/dataLineageManifest.ts`**:
   - `auditAgencyDataLineage`: Generates field-by-field audit report with honest completeness percentage.
4. **`src/components/DataHealthDashboard.tsx`**:
   - Real-time audit dashboard with inspectable audit table and manual review triage queue.
5. **`tests/dataIntegrity.test.ts`**:
   - 69 deterministic automated tests verifying all mathematical formulas, endpoint integrations, test vectors, and production safety invariants.
