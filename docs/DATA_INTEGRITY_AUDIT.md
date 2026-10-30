# DATA INTEGRITY & EVIDENCE PROVENANCE AUDIT
## Nick's EMS & Fire Territory Intelligence Application
**Audit Date:** October 2026  
**Document Revision:** 1.0.0 (Milestone A Verification Baseline)  
**Target Environment:** AI Studio Build Applet (`26354b36-e812-4fee-8cf9-2df9f9c26acf`)  
**Production Firestore Database:** `ai-studio-nicksemsfireterr-26354b36-e812-4fee-8cf9-2df9f9c26acf`

---

## 1. Executive Summary & Audit Scope

This audit provides a complete, trace-level evaluation of data generation, verification labeling, identity attribution, and persistence routines across the Nick's EMS & Fire Territory Intelligence application. The application contains high-fidelity public health records (e.g., U.S. Census demographics, 3,144 county health records, CMS PUF Medicare parameters, and open FEMA AFG records). However, previous iterations introduced synthetic heuristics, artificial identifiers (NPI, FDID), false verification assumptions in server endpoints, and destructive startup hooks.

This audit establishes the factual baseline and specifies corrective implementations for **Milestone A & B** under strict development environment safety controls.

---

## 2. Critical Safety Evaluation: Database & Persistence Hooks

| Safety Vector | Target / Mechanism | Risk Level | Current Behavior | Required Safety Safeguard |
|---|---|---|---|---|
| **Startup Cloud Purge** | `src/hooks/useFirestoreAgencies.ts` (`initializeCloudAndSanitize`) | **CRITICAL (P0)** | Invokes `purgeMockRecordsFromFirestore()` automatically on mount whenever Firestore is connected. Runs wildcard deletion across Firestore collections (`agencies`, `field_notes`). | **Eliminate automatic startup purge.** Purges must never run on component mount. Ensure no destructive routine executes against `ai-studio-nicksemsfireterr-26354b36-e812-4fee-8cf9-2df9f9c26acf`. |
| **Startup Auto-Hydration** | `useFirestoreAgencies.ts` (`batchSyncAgenciesToFirestore`) | **HIGH (P0)** | Automatically writes top 25 local baseline agencies to Firestore if synced count < 15. | **Disable automatic background cloud mutations.** Only explicit user-initiated synchronization or confirmed persistence actions should write to Firestore. |
| **In-Memory Store Purge** | `src/utils/syncStore.ts` | **MEDIUM** | Local storage cache syncing without cryptographic checksum validation. | Read-only fallback to local cache; never overwrite cloud collections without verified user trigger. |

---

## 3. Detailed Data Pipeline Audit Matrix

### Item 1: Artificial NPI Generation & Hashing Fallback
- **Source File & Function:** `src/components/FocusedProviderProfile.tsx` -> `ensureCompleteAgencyData(raw: Agency)`
- **Affected Field:** `raw.npiNumber`, `raw.nppesRegistryUrl`
- **Original Data Source:** None for un-enrolled baseline agencies (only present when enriched via live NPPES API or in `CMS_ENROLLMENT_DATABASE`).
- **Synthetic/Estimated Fallback Behavior:** Hashes agency name, state, and city (`posHash`), then fabricates a fake 10-digit NPI: `1${(100000000 + (posHash % 899999999)).toString().padStart(9, '0')}`. Generates a live link to CMS NPI registry using this fake number.
- **Persistence Impact:** If the user saves or bookmarks the agency, the fake NPI persists to Firestore.
- **Affected Screens:** Provider Profile (`FocusedProviderProfile`), Federal NPI Badge, Executive Dossier, Data Lineage Modal.
- **Severity:** **CRITICAL (P1)**
- **Proposed Corrective Implementation:** Remove NPI hash synthesis. If `raw.npiNumber` is absent, preserve it as `undefined`/`null`. Render UI with explicit "Unverified / NPPES Sourcing Required" badge and disable direct links to fabricated registry URLs.
- **Test Required:** Test that an agency without an authentic NPI retains `npiNumber === undefined` and does not generate a synthetic 10-digit number or invalid Luhn checksum.

---

### Item 2: Artificial Fire Department ID (FDID) Fallback
- **Source File & Function:** `src/components/FocusedProviderProfile.tsx` -> `ensureCompleteAgencyData(raw: Agency)` and `src/services/territoryIntelligenceEngine.ts`
- **Affected Field:** `raw.fdid`
- **Original Data Source:** USFA NFIRS Directory / State Fire Marshal registry.
- **Synthetic/Estimated Fallback Behavior:** Fabricates FDID using: `${raw.stateCode}-${isFire ? 'FD' : 'EMS'}-${(posHash % 9000 + 1000)}`.
- **Persistence Impact:** Fabricated FDIDs persist to local storage and Firestore.
- **Affected Screens:** Focused Provider Profile header, Executive Dossier, Agency Summary Cards.
- **Severity:** **HIGH (P1)**
- **Proposed Corrective Implementation:** When genuine FDID is missing from state/federal records, set `fdid` to empty or keep undefined; display "Not Recorded / USFA Sourcing Required".
- **Test Required:** Test that missing FDID remains null/unassigned and is not formatted with synthetic state prefixes and random numbers.

---

### Item 3: False Live Verification in Federal Gateway Endpoint
- **Source File & Function:** `server.ts` -> `app.post('/api/providers/verify-live')`
- **Affected Field:** `response.verified`, `response.npiNumber`, `response.verificationSource`
- **Original Data Source:** CMS NPPES v2.1 API & OpenFEMA AFG API.
- **Synthetic/Estimated Fallback Behavior:**
  1. If exact match is not found, lines 305/351 default to `npiMatches[0]` (the first unrelated organization returned for the city) and return `verified: true`.
  2. If `npiMatches` is empty, line 397 still returns `verified: true` with a generic citation: `"Official Municipal Website, USFA Registry & Google Maps Directory"`.
- **Persistence Impact:** Unverified organizations are stored as verified in Firestore and local state with incorrect NPI numbers belonging to other entities.
- **Affected Screens:** Provider Verification Modal, Profile Header Verification Badge, Filter Controls.
- **Severity:** **CRITICAL (P1)**
- **Proposed Corrective Implementation:**
  - Implement deterministic scoring across organization name, state match, city match, and healthcare provider taxonomy.
  - Return explicit outcome statuses: `'MATCHED'`, `'AMBIGUOUS'`, `'NOT_MATCHED'`, `'SOURCE_UNAVAILABLE'`, `'ERROR'`.
  - Set `verified: true` ONLY when match confidence >= 0.70 and state matches exactly. For weak matches (< 0.70), return `verified: false` and outcome `'AMBIGUOUS'` with candidate list. For no matches, return `verified: false` and outcome `'NOT_MATCHED'`.
- **Test Required:**
  - Mock NPPES responses with non-matching names -> outcome `'NOT_MATCHED'`, `verified: false`.
  - Mock ambiguous candidate list -> outcome `'AMBIGUOUS'`, `verified: false`.
  - Mock exact name and state match -> outcome `'MATCHED'`, `verified: true`.

---

### Item 4: Hardcoded 100% Data Integrity Score
- **Source File & Function:** `src/data/dataLineageManifest.ts` -> `generateAgencyDataLineage(agency: Agency)`
- **Affected Field:** `manifest.overallIntegrityScore`, `dimensionSummary[rec.category].verifiedFields`
- **Original Data Source:** None (hardcoded constant).
- **Synthetic/Estimated Fallback Behavior:** Line 381 unconditionally executes `dimensionSummary[rec.category].verifiedFields += 1` for every single field, and line 387 returns `overallIntegrityScore: 100` regardless of missing or unverified fields.
- **Persistence Impact:** None on database, but misleading to end users and executive stakeholders.
- **Affected Screens:** Data Lineage Trust Modal (`DataLineageTrustModal.tsx`), Audit Ledger.
- **Severity:** **HIGH (P1)**
- **Proposed Corrective Implementation:**
  - Dynamically evaluate each field against authentic evidence criteria (presence of real NPI, real claims data, real FEMA grant, verified official contact).
  - Calculate `overallIntegrityScore` as `Math.round((verifiedFieldsCount / totalFieldsCount) * 100)`.
- **Test Required:** Verify that an unverified baseline agency scores significantly below 100% (e.g. 35%-60%) and only fully corroborated agencies score higher.

---

### Item 5: Conflating Cloud Synchronization with Factual Verification
- **Source File & Function:** `src/services/dataSanitizationService.ts` -> `classifyProvenanceTier` and `sanitizeAgency`
- **Affected Field:** `dataProvenanceTier`, `isVerifiedRecord`
- **Original Data Source:** Firestore metadata (`_syncedAt`, `isCloudPersisted`).
- **Synthetic/Estimated Fallback Behavior:** Treats cloud persistence as the top provenance tier (`firestore_cloud_synced`) and implies records in Firestore are factually validated, conflating storage location with truth of contents.
- **Persistence Impact:** Promotes unverified records to verified status simply because they were synced to Firestore.
- **Affected Screens:** Data Health Indicator, National Geographic Explorer Filters, Provenance Badges.
- **Severity:** **HIGH (P2)**
- **Proposed Corrective Implementation:**
  - Decouple cloud persistence (`isCloudPersisted: boolean`) from factual verification (`isVerifiedRecord: boolean`).
  - Provenance tiers must reflect evidence verification authority: `authoritative_federal_verified` > `cross_referenced_public_record` > `unverified_modeled_baseline`.
- **Test Required:** Confirm that setting `isCloudPersisted: true` on an unverified agency does NOT change its factual verification status or claim federal registry corroboration.

---

### Item 6: FIPS-Derived County Medicare Denial Rates
- **Source File & Function:** `src/services/countyBoundaryHierarchyService.ts` -> `getProjectedStateCounties` (line 434)
- **Affected Field:** `medicareDenialRatePct`
- **Original Data Source:** CMS Ground Ambulance Data / PUF State Benchmarks.
- **Synthetic/Estimated Fallback Behavior:** Calculates county denial rate using `+(baseDenial + ((parseInt(co.countyFips.slice(-2), 10) % 7) - 3) * 0.6).toFixed(1)`. This invents pseudo-random variance based on arbitrary FIPS digits.
- **Persistence Impact:** Propagates to county SVG maps, geographic exploration tables, and ROI calculations.
- **Affected Screens:** National Geographic Explorer, State County Map View, County Heatmap.
- **Severity:** **MEDIUM (P2)**
- **Proposed Corrective Implementation:**
  - Use genuine county health record value if recorded.
  - If county-specific denial data is unobserved, use the state benchmark directly and explicitly flag it as `isStateBenchmarkDefault: true` or display "Data Sourcing Required". Never use FIPS modulo arithmetic to fake data variance.
- **Test Required:** Verify that when county record has no explicit denial rate, it falls back to the exact state benchmark without FIPS modulo manipulation.

---

### Item 7: Synthetic Apparatus Fleet & Grant Histories
- **Source File & Function:** `src/components/FocusedProviderProfile.tsx` -> `ensureCompleteAgencyData`
- **Affected Field:** `raw.apparatusFleet`, `raw.femaGrantHistory`, `raw.hospitalLogistics`
- **Original Data Source:** OpenFEMA AFG database / USFA registry.
- **Synthetic/Estimated Fallback Behavior:**
  - Generates full 5-year FEMA grant history with synthetic dollar amounts (`185000 + (posHash % 90000)`).
  - Generates apparatus fleet with synthetic vehicle counts and synthetic fleet age (`5.2 + (posHash % 48) / 10`).
  - Generates hospital transport logistics with pseudo-random mileages.
- **Persistence Impact:** User edits or bookmarks cause synthetic grant amounts and vehicle counts to be saved to Firestore.
- **Affected Screens:** Provider Profile (Equipment & Vehicles tab, Purchasing & Grants tab, Operations tab).
- **Severity:** **HIGH (P1)**
- **Proposed Corrective Implementation:**
  - Only render grant history if `liveFemaAwards` or real grant records exist; otherwise display "No Federal AFG/SAFER Awards On Record".
  - If apparatus breakdown is unverified, flag apparatus fleet as "Estimated Municipal Sizing (Telemetry Required)" or display only observed station/ambulance totals without fabricating exact ladder and command vehicle sub-counts.
- **Test Required:** Verify that an agency without authentic grant records does not show fabricated multi-year grant dollar amounts.

---

### Item 8: Missing Value Crash Protection (NaN & Null Safety)
- **Source File & Function:** `src/utils/formatters.ts`, `src/components/FocusedProviderProfile.tsx`, `src/components/PredictiveLeadQueue.tsx`
- **Affected Field:** Numerical formatting (`formatCurrency`, `formatPercent`, `formatInteger`)
- **Original Data Source:** Numerical metrics.
- **Synthetic/Estimated Fallback Behavior:** When fields were undefined or null, previous components could attempt `.toFixed()` or arithmetic on undefined, resulting in `NaN` or runtime render crashes.
- **Persistence Impact:** None directly; degrades frontend stability.
- **Affected Screens:** Lead Queue, Focused Provider Profile, Metric Badges.
- **Severity:** **MEDIUM (P2)**
- **Proposed Corrective Implementation:** Update formatters and UI components to safely handle `undefined`, `null`, and `NaN` with graceful fallback strings (e.g. `"—"`, `"N/A"`, or `"Unverified"`).
- **Test Required:** Verify formatters handle `null`, `undefined`, and `NaN` inputs safely without throwing or rendering `"NaN%"`.

---

## 4. Remediation Plan (Milestone B Deliverables)

1. **Safety First:** Edit `src/hooks/useFirestoreAgencies.ts` to disable startup `purgeMockRecordsFromFirestore()`.
2. **Server Verification Hardening:** Rewrite `/api/providers/verify-live` in `server.ts` with deterministic matching scoring and explicit outcomes (`MATCHED`, `AMBIGUOUS`, `NOT_MATCHED`, `SOURCE_UNAVAILABLE`).
3. **Identifier Integrity:** Update `src/components/FocusedProviderProfile.tsx` to eliminate hash-based NPI/FDID synthesis. Display genuine unverified states.
4. **Dynamic Data Lineage:** Update `src/data/dataLineageManifest.ts` to calculate real verification ratios and eliminate hardcoded 100% integrity scores.
5. **Decouple Sync & Verification:** Refactor `src/services/dataSanitizationService.ts` to separate cloud persistence from factual verification.
6. **Eliminate FIPS Denial Jitter:** Update `src/services/countyBoundaryHierarchyService.ts`, `src/services/nationalProviderDatabase.ts`, and `src/services/territoryIntelligenceEngine.ts`.
7. **Automated Verification:** Implement an automated test runner script (`scripts/verifyDataIntegrity.ts`) containing >= 15 executable assertions covering each requirement.
