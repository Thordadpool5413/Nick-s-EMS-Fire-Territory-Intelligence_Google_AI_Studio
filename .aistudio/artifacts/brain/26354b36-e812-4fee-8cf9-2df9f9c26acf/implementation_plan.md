# Executive Launchpad: Home Screen Streamlining & Focus Architecture

Streamline the Home screen into a calm, focused, high-authority **Executive Launchpad** that eliminates visual clutter and cognitive overload while keeping the prominent brand crest logo, elevating the **Top 5 Priority Opportunities** to center stage, and offloading deep onboarding and competitive battlecards into an on-demand drawer and interactive walkthrough modal.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions were confirmed during Phase 1 interactive clarification:
> - **Primary Layout Paradigm**: Executive Launchpad featuring a calm, uncluttered hero banner, essential territory metrics, and immediate operational priorities, retaining the prominent large brand logo.
> - **Onboarding & Competitive Battlecards Offload**: The 4-phase onboarding tour, tactical tips, and competitive battlecards (Stryker, Philips, Baxter) will be accessible via an on-demand drawer ("Field Playbook & TM Guide") and guided interactive modal rather than occupying heavy static page real estate.
> - **Center Stage Focus**: The **Top 5 Immediate Priority Opportunities** ledger grid will take center stage with high-precision tabular figures and 1-click operational triggers (Open Dossier, 3D Apparatus Demo, Clinical Uplift Simulation).

- **Confirmed Decision 1**: Keep the prominent brand crest logo (`w-28 h-28 sm:w-36 sm:h-36`) with live Firestore sync telemetry in the executive banner.
- **Confirmed Decision 2**: Replace the 7 competing vertical sections on the Home screen with a streamlined 3-zone single-elevation view:
  1. *Zone A: Executive Command Banner* (Logo, mission orientation, quick launch buttons for Map, Queue, and Onboarding Drawer).
  2. *Zone B: Territory Pulse Telemetry Strip* (4 essential metrics in a hairline 1px ledger).
  3. *Zone C: Centerpiece Top Opportunities Ledger* (Top 5 high-yield accounts with instant 1-click actions and PulseIQ score breakdown).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the initial landing page from a dense, overwhelming list of cards into an intentional daily command center for ZOLL Territory Managers. It provides immediate situational awareness in 5 seconds: where the territory stands, the top 5 high-yield replacement accounts to call today, and 1-click access to the full Onboarding Tour & Competitive Playbook on demand.
- **Target Audience / Persona**: ZOLL Territory Managers, Regional Sales Directors, and Clinical Specialists logging in from laptops and iPads who need quick, actionable prioritization rather than scrolling through endless repetitive cards.
- **Key Value**: Drastically reduces cognitive load and visual noise while preserving 100% of the strategic onboarding guidance and competitive intelligence through clean progressive disclosure.

---

## 2. User Experience & Visual Design

### A. Layout Structure & Visual Hierarchy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ZONE A: EXECUTIVE COMMAND BANNER                                                      │
│ ┌──────────────┐  Nick's EMS & Fire Territory Intelligence                            │
│ │              │  ZOLL Medical Corporation · EMS & Fire Division · Real-Time Sync     │
│ │  PROMINENT   │  ------------------------------------------------------------------- │
│ │  BRAND CREST │  Territory dispatch briefing & strategic capital replacement command │
│ │    LOGO      │                                                                      │
│ └──────────────┘  [ Launch Interactive Tour ]   [ Open Field Playbook Drawer ]        │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ZONE B: TERRITORY TELEMETRY STRIP (1px Hairline Ledger Grid)                           │
│  Monitored Agencies  │  Tier-1 Targets  │  Aging Units (>8 Yrs)  │  Medicare Claims   │
│  1,842               │  142             │  418                   │  $14.2M            │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ZONE C: CENTERPIECE — TOP 5 IMMEDIATE PRIORITY OPPORTUNITIES (Center Stage)           │
│ High-yield accounts ranked by PulseIQ replacement readiness, aging LP15 fleets & grants│
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Agency Name & Location │ Fleet Units │ Est. Value │ PulseIQ │ 1-Click Fast Actions │ │
│ ├────────────────────────┼─────────────┼────────────┼─────────┼──────────────────────┤ │
│ │ Metro Fire & EMS (TX)  │ 24 LP15s    │ $680,000   │  94/100 │ [Profile] [Dossier]  │ │
│ │ Cascade County EMS(WA) │ 18 LP15/MRx │ $490,000   │  91/100 │ [Profile] [Dossier]  │ │
│ │ ...                    │ ...         │ ...        │  ...    │ ...                  │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Visual Identity & Anti-Slop Discipline
- **Zero-Pill Discipline**: Strip away unnecessary colored pill capsules. Static attributes (State, FDID, NPI, Fleet Type) render as unboxed monospace or muted text separated by middle dots (`TX · FDID 04102 · Stryker LP15 Fleet`).
- **Single-Elevation Depth**: Flat architectural surfaces bounded by clean 1px hairline borders (`border border-slate-200 dark:border-slate-800`). No nested cards-within-cards or heavy drop shadows.
- **Large Logo Presence**: Retain the large, high-resolution brand crest logo (`w-28 h-28 sm:w-36 sm:h-36`) with a crisp border, subtle ring, and live connection status indicator.
- **Progressive Disclosure**:
  - The 4-Phase Onboarding Walkthrough and 5-Point Daily Checklist slide open smoothly in a dedicated **Field Playbook & TM Guide Drawer** from the right edge upon clicking "Open Field Playbook" or "View Guide".
  - The Interactive Stepper Walkthrough opens in a focused, distraction-free modal when "Launch Interactive Tour" is triggered.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Relocating Static Onboarding & Battlecard Cards**
  - *Chosen Approach*: Move the 4 static onboarding phase cards, 5 checklist items, and 3 competitive battlecards out of the default vertical page scroll and into an on-demand slide-over drawer and modal.
  - *Why*: Daily active Territory Managers do not need to scroll past the same 12 informational cards every time they open the application. Placing them in a clean drawer makes the Home screen a swift daily operational launchpad while keeping the guide 1 click away.
  - *Alternatives Considered*: Accordions on the main page (still created vertical bloat and visual noise when expanded).

- **Decision 2: Top 5 Priority Opportunities as the Dominant Anchor**
  - *Chosen Approach*: Position the Top 5 High-Yield Target Accounts directly below the 4-metric telemetry strip as the main focus of the page.
  - *Why*: Reps visit the Home screen to know *who to call today*, *why they are ready to convert*, and *how to take immediate action*. Direct 1-click actions (Open Provider Profile, Generate Executive Briefing Dossier, Launch 3D Apparatus Demo) provide immediate utility.

- **Decision 3: Streamlining the Telemetry Strip to 4 Core Institutional Figures**
  - *Chosen Approach*: Condense the 5-tile strip into 4 high-impact figures (Monitored Agencies, Tier-1 Targets, Aging Competitor Units, Medicare Allowed Claims) using tabular monospace numerals.
  - *Why*: 4 columns align symmetrically on both desktop (4 cols) and tablet (2x2 cols), eliminating awkward grid wrapping.

---

## 4. Technical Architecture & Data Strategy

### A. Component Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│ App.tsx (Root State, Active Tab = 'home', Selected Agency)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ HomeHubView.tsx (Streamlined Executive Launchpad)            │
│ ├─ ExecutiveHeroSection (Large Crest Logo + Mission + CTAs)  │
│ ├─ TerritoryTelemetryStrip (4-Metric 1px Hairline Ledger)    │
│ ├─ PriorityOpportunitiesCenterpiece (Top 5 Ranked Accounts)  │
│ │   └─ 1-Click Action Triggers (Profile, Dossier, 3D Demo)   │
│ │                                                            │
│ ├─ FieldPlaybookDrawer (Slide-Over Drawer on Demand)         │
│ │   ├─ 4-Phase TM Onboarding Curriculum                      │
│ │   ├─ TM Fast Action Checklist                              │
│ │   └─ Competitive Battlecards (Stryker, Philips, Baxter)    │
│ │                                                            │
│ └─ InteractiveTourModal (4-Step Guided Stepper Walkthrough)  │
└──────────────────────────────────────────────────────────────┘
```

### B. State Management & Interaction Handlers
- `isPlaybookOpen: boolean`: Controls the slide-over drawer containing the full onboarding curriculum and competitive battlecards.
- `isInteractiveTourOpen: boolean`: Controls the 4-phase step-by-step onboarding walkthrough modal.
- `activeTourIndex: number`: Controls the current step in the interactive stepper.
- `onSelectAgency(agency)`: Instantly opens the deep Department Profile Drawer for a target agency.
- `onNavigateTab(tabId)`: Seamlessly jumps to GIS Heatmap, Priority Queue, PulseIQ Analytics, or 3D Apparatus Studio.
- `onOpenDossier(agency)`: Directly triggers the Executive Briefing Dossier modal for instant medical director prep.

---

## Verification & Execution Order

1. **Phase 1 Complete**: Clarification questions answered and user preferences confirmed.
2. **Phase 2 In Progress**: Implementation plan artifact published for user approval.
3. **Phase 3 (Post-Approval)**:
   - Refactor `src/components/HomeHubView.tsx` to streamline the main page layout into the 3-zone architecture.
   - Build the slide-over `FieldPlaybookDrawer` containing the onboarding tour, daily checklist, and competitive battlecards.
   - Retain the large crest logo, telemetry strip, and interactive modal.
   - Run `lint_applet` and `compile_applet` to verify clean compilation.
