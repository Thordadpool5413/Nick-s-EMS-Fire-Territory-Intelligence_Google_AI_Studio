# AppDeploy migration: Google-independent EMS & Fire Territory Intelligence

**Status (2026-10-23):** Source-code migration staged in the `migration/appdeploy-google-free-2026-10` branch. **Not deployed or runtime-tested on AppDeploy.** AppDeploy reported that the account exhausted its available daily/weekly deployment credits. The weekly credit reset is listed as 2026-10-26 00:00 UTC. The existing AppDeploy application `ems-territory-intelligence-pw2fyb` was not altered.

## Architecture

| Layer | Implementation |
|---|---|
| Website | React 19 + Vite + Tailwind, existing pages and national static datasets |
| App server | `backend/index.ts` built with `@appdeploy/sdk` |
| User identity | AppDeploy built-in login restricted to **email**, configured in `appdeploy.auth-login.json` |
| User changes | AppDeploy database per-user tables for bookmarks, lead stages, route flags, field notes, custom agencies |
| Research assistant | AppDeploy `ai.generate`; no user-managed Gemini or Google AI Studio credentials |
| Federal identity checks | CMS NPPES API v2.1 (legal organization identity only) |
| Geography | Bundled Census county GeoJSON and OpenStreetMap search links |
| Offline support | Scoped local cache, manual retry for supported pending edits; not yet production-grade offline reconciliation |

## What was removed

- Google AI Studio project artifacts and generated metadata
- Gemini server, keys, model selectors and prompt endpoints
- Firebase app configuration, Firestore rules/client, and Firestore synchronization hook
- Hardcoded fake cloud-backup logins, fake JWTs and fabricated backup success logs
- Google Maps, Google Search, Google font CDN and Google-specific URLs
- Backend startup scripts tied to Google AI Studio
- Firebase, Google GenAI, Express and legacy server packages

We cannot guarantee what infrastructure or AI model provider AppDeploy itself uses behind the scenes. This project makes **no direct calls to Google's platforms**.

## Significant source-data caveat

The original project contains static reference geography **and synthesized provider accounts, equipment fleets, budget/grant estimates, outcome metrics, contact names and sales stages**. County and city completeness does **not** establish nationwide agency registry completeness.

The migration:
- labels geographic candidates and modeled source data unverified;
- stops inventing NPIs, FEMA award histories, named authorized officials and hospital details in the focused profile;
- only accepts a matched CMS NPPES legal organization as an NPI identity verification;
- displays source caveats in the portal and provider profiles; and
- replaces the simulated backup success screen with an actual backend-health probe and bounded count of remotely stored changes.

A verified **legal organization** does not prove its installed medical equipment, procurement authority, current contracts, clinical outcomes, staffing, purchase history, or FEMA grants. Those need distinct cited records.

## Important differences from the old app

- AppDeploy databases do not automatically contain any data previously written to Firebase. The static repository data is retained; user data from Firebase is **not** migrated.
- The OSM button provides a **place-search link**, not verified navigation or optimized multi-stop routing.
- User-created agency records and bookmarks/stages/notes are designed to persist to AppDeploy after email sign-in, but end-to-end deployment tests have not run.
- The source retains certain model-derived lead ranking calculations and static sample attributes, which require a future field-by-field evidence audit before production sales use.
- Offline writes and conflict handling must be tested under real authentication and disconnect/reconnect conditions.

## Publication checklist (blocking)

1. Resolve the AppDeploy credit limitation; **do not** overwrite existing `ems-territory-intelligence-pw2fyb`. Create a separate standalone app.
2. Include React+Vite frontend files, `backend/index.ts`, auth configuration, Census `public/data/us-counties-boundaries.json`, logos and public assets.
3. Run a production install and `npm run build`, plus `tsc --noEmit`. Resolve any failures. No live build was executed during migration.
4. Run AppDeploy deployment, confirm green frontend/backend status and `GET /api/health`.
5. Test email sign-in, sign-out, separate account isolation, notes, custom account creation, bookmarks, sales stages and reload persistence.
6. Test verified CMS exact name matches and deliberately nonmatching entities; ensure zero false-positive verification.
7. Test state -> county -> city -> provider filters, asset load, mobile navigation, unsupported offline transactions and full page refresh.
8. Audit whether each provider-level detail has a specific official source URL, provider identifier and retrieval date. Hide fields that do not.
9. Confirm request quotas, rate limits, crash logs, data backups and deletion policy before public use.

**No production-success claims should be made before this checklist passes.**
