# Visual Enhancement & Readability Plan: Provider Cards, Quick Preview & Full Dossier

Based on your design preferences and operational requirements, this plan details the complete visual and architectural overhaul of the EMS/Fire Provider cards, Quick Preview drawer, and Full Provider Dossier. The goal is to make all critical operational data immediately scannable, trustworthy, and actionable for decision-makers.

---

## 1. Key User Preferences & Design Architecture

1. **Full Dossier Layout**:
   - **Tabbed Structure with Executive Summary Cards**: Replace long scrolling with 5 scannable tabs:
     - **Tab 1: Executive Summary** (High-level readiness scorecard, key vital stats, one-tap actions, data trust banner).
     - **Tab 2: Command & Leadership** (Chief, Medical Director, Captains, verified NPI credentials, one-tap phone/email).
     - **Tab 3: Operational Fleet & Defibrillators** (Station-by-station vehicle silhouettes, active biomedical defibrillator fleet, maintenance contracts).
     - **Tab 4: Clinical Logistics & Cath Labs** (Receiving hospitals, 24/7 STEMI cath labs, trauma levels, transport times).
     - **Tab 5: Financials, Billing & Contracts** (CMS claims, Medicare denials, procurement RFP dates, vendor suppliers).

2. **Top Information Hierarchy (Cards & Quick Previews)**:
   - **Header**: Agency Name, Type, Station HQ City/State, PulseIQ Score, and prominent **Data Trust Chip** (*Verified Ground Truth* vs. *CMS NPPES* vs. *Epidemiological Model*).
   - **One-Tap Quick Action Bar**: Call HQ (`tel:`), Google Maps Directions, and Email Command (`mailto:`).
   - **Priority 1 — Leadership Directory**: Medical Director, Fire Chief/EMS Director with credentials and direct contact actions.
   - **Priority 2 — Operational Fleet & Defibs**: Frontline vehicle count with silhouettes (🚑 ALS Ambulance, 🚒 Engine, 🪜 Ladder, 🛟 Rescue) and Defibrillator hardware badges (Stryker LIFEPAK 15, ZOLL X Series, Physio-Control, Tempus Pro).
   - **Priority 3 — Clinical Resuscitation & Cath Labs**: OHCA volume, Utstein survival benchmarks, and closest receiving STEMI Cath Lab facilities with bypass status.

3. **Visual Enhancements & Anti-Fatigue Design**:
   - **Data Trust & Verification Chips**:
     - 🟢 **Verified Ground Truth** (Emerald badge: Direct municipal CAD/FD records).
     - 🔵 **CMS NPPES Registry** (Sky badge: Federal registry verified).
     - 🟠 **Modeled Benchmark** (Amber/Slate badge: CDC/NERA epidemiological model).
   - **Visual Hardware & Fleet Badges**: High-contrast icon silhouettes for vehicle types and distinct stylized hardware badges for defibrillators with battery/service indicators.
   - **One-Tap Action Buttons**: Accessible directly from cards and previews without having to drill down.

---

## 2. Proposed Changes by Component

### A. Quick Preview Drawer (`src/components/AgencyQuickPreviewDrawer.tsx`)
- **Header & Trust Banner**:
  - Add prominent data trust verification chip with provenance source indicator.
  - Insert sticky one-tap Action Bar: `[📞 Call HQ]`, `[📍 Directions]`, `[✉️ Email Chief]`, `[📄 Full Dossier]`.
- **Restructured Card Hierarchy**:
  - **Section 1: Command Leadership**: Grid cards for Medical Director and Fire/EMS Chief with one-tap contact buttons.
  - **Section 2: Frontline Fleet & Defibrillator Hardware**:
    - Apparatus breakdown with visual icons (Ambulance, Engine, Ladder, Rescue).
    - Defibrillator fleet breakdown with visual brand pills (ZOLL X Series, Stryker LIFEPAK 15) and replacement status.
  - **Section 3: Clinical Logistics & Receiving Cath Labs**:
    - Cardiac arrest metrics (OHCA volume, survival rates).
    - Dedicated STEMI Cath Lab cards highlighting 24/7 capabilities, trauma level, and transport distance.
  - **Section 4: CAD & ePCR Technology**:
    - System tags (ImageTrend, ESO, CAD vendor) with CAD-to-ePCR integration health badge.

### B. Full Provider Dossier (`src/components/FocusedProviderProfile.tsx`)
- **Sticky Dossier Header**:
  - Agency identity, PulseIQ badge, Data Trust verification badge, and quick action toolbar.
- **Tabbed Navigation Bar**:
  - `Executive Summary` | `Leadership & Command` | `Fleet & Defibrillators` | `Clinical & Cath Labs` | `Contracts & Financials`
- **Tab Content**:
  - **Tab 1: Executive Summary**:
    - Scannable 4-card KPI summary: Fleet Readiness, Cardiac Care Score, Data Trust Level, Annual Volume.
    - Quick summary of upcoming contract renewals and chief contacts.
  - **Tab 2: Command & Leadership**:
    - Full verified personnel directory, Medical Director board certifications, active state medical licenses, direct phone and email.
  - **Tab 3: Operational Fleet & Defibrillators**:
    - Apparatus fleet table with vehicle age, station assignment, and frontline/reserve status.
    - Biomedical defibrillator inventory with model names, service contracts, and vendor suppliers.
  - **Tab 4: Clinical Logistics & Cath Labs**:
    - Receiving hospital breakdown, STEMI cath lab activation protocols, travel times, and emergency department diversion history.
  - **Tab 5: Contracts, CMS Denials & Financials**:
    - Medicare claims volume, denial rate benchmark, upcoming CAD/ePCR renewal dates, and procurement contacts.

### C. Provider Cards (`src/components/PredictiveLeadQueue.tsx` & `src/components/HomeHubView.tsx`)
- Add **Data Trust Chip** on each card header.
- Add apparatus silhouette counters (e.g., `🚑 12 ALS` `🚒 8 Engines`) and defib hardware pill (e.g., `⚡ ZOLL X Series`).
- Add mini one-tap action buttons: Call (`tel:`), Navigate (`maps`), and Quick Preview Drawer button.

---

## 3. Implementation Steps

1. **Step 1: Update Visual Badges & Trust Components**:
   - Create reusable trust chip and hardware silhouette helper components in `AgencyQuickPreviewDrawer` and `FocusedProviderProfile`.
2. **Step 2: Overhaul `AgencyQuickPreviewDrawer.tsx`**:
   - Reorganize sections strictly into Leadership -> Fleet & Defibs -> Clinical & Cath Labs.
   - Add one-tap action bar and interactive phone/email/maps links.
3. **Step 3: Refactor `FocusedProviderProfile.tsx` into Tabbed Layout**:
   - Implement tab state management (`activeTab: 'summary' | 'leadership' | 'fleet' | 'clinical' | 'contracts'`).
   - Create scannable executive summary cards for the default tab.
   - Move detailed deep-dive data into their dedicated tabs.
4. **Step 4: Update Provider Cards in Lists & Queues**:
   - Enhance card footers with apparatus silhouettes, defib tags, and quick call/map buttons.
5. **Step 5: Verification & Quality Assurance**:
   - Run `compile_applet` to confirm clean TypeScript build.
   - Run test suite `tests/dataIntegrity.test.ts` to ensure 100% data integrity tests pass.
   - Verify UI responsiveness across desktop, tablet, and mobile viewport sizes.

---

## 4. User Approval
Please review this implementation plan and click **Proceed** to authorize the implementation.
