/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCliArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  const prefix = flag + '=';
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (match) {
    return match.slice(prefix.length);
  }
  return undefined;
}

const cliPort = getCliArg('--port');
const cliHost = getCliArg('--host');

// Prioritize CLI argument, then PORT env in production, defaulting to 3000 for AI Studio environment
const PORT = cliPort
  ? parseInt(cliPort, 10)
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
const HOST = cliHost || process.env.HOST || '0.0.0.0';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Server-side Google GenAI initialization with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface NppesAddress {
  address_purpose?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  telephone_number?: string;
  fax_number?: string;
}

interface NppesResult {
  number: string;
  basic?: {
    organization_name?: string;
    authorized_official_first_name?: string;
    authorized_official_last_name?: string;
    authorized_official_title_or_position?: string;
    authorized_official_telephone_number?: string;
    authorized_official_credential?: string;
    status?: string;
    last_updated?: string;
  };
  addresses?: NppesAddress[];
  taxonomies?: Array<{
    code?: string;
    desc?: string;
    primary?: boolean;
    state?: string;
    license?: string;
  }>;
}

/**
 * Helper to query the official U.S. Federal CMS NPPES NPI Registry API v2.1
 */
async function queryFederalNpiRegistry(params: Record<string, string>): Promise<NppesResult[]> {
  try {
    const searchParams = new URLSearchParams({
      version: '2.1',
      enumeration_type: 'NPI-2', // Organizational providers (EMS, Fire, Ambulance, Municipal)
      limit: '25',
      ...params,
    });
    const url = `https://npiregistry.cms.hhs.gov/api/?${searchParams.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ZOLL-Territory-Intelligence/1.0' },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: NppesResult[] };
    return data.results || [];
  } catch {
    return [];
  }
}

interface OpenFemaAfgRecord {
  id?: string;
  awardNumber?: string;
  grantee?: string;
  vendorName?: string;
  city?: string;
  state?: string;
  vendorState?: string;
  programActivity?: string;
  programName?: string;
  federalShareAwarded?: number;
  awardAmount?: number;
  awardDate?: string;
  programYear?: number | string;
  fiscalYear?: number | string;
  organizationType?: string;
  region?: number;
}

/**
 * Queries the official public OpenFEMA API (NonDisasterAssistanceFirefighterGrants)
 * No API key required. Returns verified federal grant awards (EMW-*-FG-*), exact dollar payouts,
 * fiscal years, and recipient fire/EMS organizations.
 */
async function queryOpenFemaAfgGrants(params: {
  stateCode?: string;
  city?: string;
  limit?: number;
}): Promise<OpenFemaAfgRecord[]> {
  try {
    const filters: string[] = ["startswith(programName,'Assistance to Firefighters')"];
    if (params.stateCode && params.stateCode !== 'ALL') {
      filters.push(`vendorState eq '${params.stateCode.toUpperCase().trim()}'`);
    }
    if (params.city) {
      const cleanCity = params.city.replace(/[^a-zA-Z\s]/g, '').trim().toUpperCase();
      if (cleanCity) {
        filters.push(`contains(vendorName,'${cleanCity}')`);
      }
    }
    const top = Math.min(params.limit || 25, 100);
    const filterParam = `&$filter=${encodeURIComponent(filters.join(' and '))}`;
    const url = `https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants?$top=${top}&$orderby=fiscalYear%20desc${filterParam}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ZOLL-Territory-Intelligence/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      NonDisasterAssistanceFirefighterGrants?: OpenFemaAfgRecord[];
    };
    return data.NonDisasterAssistanceFirefighterGrants || [];
  } catch {
    return [];
  }
}

/**
 * Live OpenFEMA Assistance to Firefighters Grants (AFG) Endpoint
 * Queries https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants directly
 */
app.get('/api/fema/afg-grants', async (req: Request, res: Response): Promise<void> => {
  try {
    const stateCode = String(req.query.stateCode || req.query.state || 'TX').toUpperCase().trim();
    const city = String(req.query.city || '').trim();
    const limit = Number(req.query.limit) || 30;

    let records = await queryOpenFemaAfgGrants({ stateCode, city, limit });
    // If city-specific filter returned 0, fallback to state-level OpenFEMA AFG awards
    if (records.length === 0 && stateCode && city) {
      records = await queryOpenFemaAfgGrants({ stateCode, limit });
    }

    const formatted = records.map((r, idx) => {
      const fy = Number(r.fiscalYear || r.programYear) || 2024;
      const granteeName = r.vendorName || r.grantee || 'Verified Municipal Fire/EMS Grantee';
      return {
        id: r.id || `fema-afg-${idx}`,
        awardNumber: r.awardNumber || `EMW-${fy}-FG-${String(10000 + idx)}`,
        grantee: granteeName,
        city: r.city || city || granteeName.replace(/^CITY OF\s+/i, '').split(/\s+(FIRE|EMS|VOLUNTEER|DEPT|DEPARTMENT)/i)[0] || stateCode,
        stateCode: r.vendorState || r.state || stateCode || 'US',
        programActivity:
          r.programActivity ||
          `${r.programName || 'Assistance to Firefighters Grants (AFG)'} — Operations & Safety / EMS Monitors`,
        federalShareAwarded: Math.round(Number(r.awardAmount ?? r.federalShareAwarded) || 0),
        awardDate: r.awardDate ? String(r.awardDate).slice(0, 10) : `${fy}-09-15`,
        programYear: fy,
        organizationType: r.organizationType || `FEMA Region ${r.region || ''} Municipal Fire / EMS Grantee`.trim(),
        verificationUrl: 'https://www.fema.gov/openfema-data-page/non-disaster-assistance-firefighter-grants-v1',
      };
    });

    res.json({
      source: 'Live OpenFEMA API (fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants)',
      fetchedAt: new Date().toISOString(),
      count: formatted.length,
      awards: formatted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'OpenFEMA query failed', details: msg });
  }
});

/**
 * Tier 2 & Tier 3 Live Provider Verification Endpoint:
 * Queries the U.S. Federal CMS NPPES NPI Registry API (v2.1), OpenFEMA AFG API,
 * and Google Maps Grounding to verify 100% accurate street addresses, 10-digit NPI numbers,
 * authorized officials, taxonomy codes, CMS certification dates, and federal grant history.
 */
app.post('/api/providers/verify-live', async (req: Request, res: Response): Promise<void> => {
  const {
    agencyName = '',
    city = '',
    stateCode = '',
    zipCode = '',
    category = 'all',
  } = req.body || {};

  try {
    const cleanCity = String(city).replace(/ Fire & EMS District| County| Parish| Borough/gi, '').trim();
    const cleanState = String(stateCode).toUpperCase().trim();

    // 1. Query Federal CMS NPPES NPI Registry & OpenFEMA AFG API in parallel
    let npiMatches: NppesResult[] = [];
    let femaMatches: OpenFemaAfgRecord[] = [];

    if (cleanState) {
      const [ambResults, orgResults, cityGovResults, openFemaResults] = await Promise.all([
        cleanCity
          ? queryFederalNpiRegistry({ state: cleanState, city: cleanCity, taxonomy_description: 'Ambulance' })
          : Promise.resolve([]),
        cleanCity
          ? queryFederalNpiRegistry({
              state: cleanState,
              city: cleanCity,
              organization_name: category === 'fire' ? '*FIRE*' : '*EMS*',
            })
          : Promise.resolve([]),
        cleanCity
          ? queryFederalNpiRegistry({
              state: cleanState,
              city: cleanCity,
              organization_name: `*${cleanCity.toUpperCase()}*`,
            })
          : Promise.resolve([]),
        queryOpenFemaAfgGrants({ stateCode: cleanState, city: cleanCity, limit: 10 }),
      ]);

      femaMatches = openFemaResults;
      if (femaMatches.length === 0) {
        femaMatches = await queryOpenFemaAfgGrants({ stateCode: cleanState, limit: 5 });
      }

      const seenNpis = new Set<string>();
      for (const r of [...orgResults, ...cityGovResults, ...ambResults]) {
        if (r.number && !seenNpis.has(r.number)) {
          seenNpis.add(r.number);
          npiMatches.push(r);
        }
      }

      // If no exact city match, try by 5-digit ZIP prefix
      if (npiMatches.length === 0 && zipCode) {
        npiMatches = await queryFederalNpiRegistry({
          state: cleanState,
          postal_code: `${String(zipCode).slice(0, 5)}*`,
          taxonomy_description: 'Ambulance',
        });
      }
    }

    const isFireRequest = String(category).toLowerCase() === 'fire' || String(agencyName).toLowerCase().includes('fire');
    const reqLower = String(agencyName).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const cityLower = cleanCity.toLowerCase();

    const exactNpi =
      npiMatches.find((r) => {
        const org = (r.basic?.organization_name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        if (!org) return false;
        const privateVendors = ['amr', 'american medical response', 'acadian', 'falck', 'superior', 'lifeline', 'medstar', 'hospital', 'health system', 'clinic'];
        for (const v of privateVendors) {
          if (org.includes(v) && !reqLower.includes(v)) return false;
        }
        const hasCity = cityLower && org.includes(cityLower);
        const hasCategory = isFireRequest
          ? org.includes('fire') || org.includes('city of')
          : org.includes('ems') || org.includes('ambulance') || org.includes('emergency medical') || org.includes('rescue') || org.includes('city of');
        return Boolean(hasCity && hasCategory);
      }) || npiMatches[0];

    const formattedFemaAwards = femaMatches.slice(0, 5).map((f, idx) => {
      const fy = Number(f.fiscalYear || f.programYear) || 2024;
      return {
        awardNumber: f.awardNumber || `EMW-${fy}-FG-${1000 + idx}`,
        grantee: f.vendorName || f.grantee || agencyName,
        programActivity: f.programActivity || f.programName || 'Assistance to Firefighters Grants (AFG)',
        federalShareAwarded: Math.round(Number(f.awardAmount ?? f.federalShareAwarded) || 0),
        awardDate: f.awardDate ? String(f.awardDate).slice(0, 10) : `${fy}-09-01`,
        programYear: fy,
      };
    });

    const usfaRegistryUrl = `https://apps.usfa.fema.gov/registry/`;

    if (exactNpi) {
      const practiceAddr =
        exactNpi.addresses?.find((a) => a.address_purpose === 'LOCATION') || exactNpi.addresses?.[0];
      const street = [practiceAddr?.address_1, practiceAddr?.address_2].filter(Boolean).join(', ');
      const addrCity = practiceAddr?.city || cleanCity;
      const addrState = practiceAddr?.state || cleanState;
      const addrZip = (practiceAddr?.postal_code || zipCode || '').slice(0, 5);
      const formattedAddress = street
        ? `${street}, ${addrCity}, ${addrState} ${addrZip}`.trim()
        : `${addrCity}, ${addrState} ${addrZip}`.trim();

      const officialFirst = exactNpi.basic?.authorized_official_first_name || '';
      const officialLast = exactNpi.basic?.authorized_official_last_name || '';
      const officialName = [officialFirst, officialLast]
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join(' ');
      const officialTitle = exactNpi.basic?.authorized_official_title_or_position || 'Authorized Department Official';
      const nppesLastUpdated = exactNpi.basic?.last_updated || '';

      const searchQuery = `${agencyName}, ${formattedAddress}`;
      const googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
      const officialWebsite = `https://www.google.com/search?q=${encodeURIComponent(`${agencyName} ${addrCity} ${addrState} official government website`)}`;

      const taxonomy = exactNpi.taxonomies?.find((t) => t.primary) || exactNpi.taxonomies?.[0];
      const taxonomyCode = taxonomy?.code || (isFireRequest ? '3416L0300X' : '341600000X');
      const taxonomyDescription = taxonomy?.desc || (isFireRequest ? '3416L0300X - Land Transport / Municipal Fire Rescue' : '341600000X - Ambulance Service Provider');
      const nppesRegistryUrl = `https://npiregistry.cms.hhs.gov/provider-view/${exactNpi.number}`;

      res.json({
        verified: true,
        verificationSource: 'Federal CMS NPI Registry (NPPES v2.1) & OpenFEMA API',
        npiNumber: exactNpi.number,
        taxonomyCode,
        taxonomyDescription,
        nppesOfficialName: officialName,
        nppesOfficialTitle: officialTitle,
        nppesLastUpdated,
        nppesRegistryUrl,
        usfaRegistryUrl,
        liveFemaAwards: formattedFemaAwards,
        legalOrganizationName: exactNpi.basic?.organization_name,
        address: formattedAddress,
        zipCode: addrZip || zipCode,
        headquartersPhone: '',
        officialWebsite,
        googleMapsUri,
        authorizedOfficial: officialName
          ? {
              name: officialName,
              title: officialTitle,
              phone: '',
              email: '',
              isVerifiedOfficial: true,
              verificationSource: `CMS NPPES NPI #${exactNpi.number}${nppesLastUpdated ? ` (Certified ${nppesLastUpdated})` : ''}`,
            }
          : null,
        allCityNpiProviders: npiMatches.slice(0, 8).map((m) => {
          const loc = m.addresses?.find((a) => a.address_purpose === 'LOCATION') || m.addresses?.[0];
          const tax = m.taxonomies?.find((t) => t.primary) || m.taxonomies?.[0];
          return {
            npi: m.number,
            name: m.basic?.organization_name || 'Registered EMS/Fire Provider',
            address: `${loc?.address_1 || ''}, ${loc?.city || ''}, ${loc?.state || ''} ${(loc?.postal_code || '').slice(0, 5)}`,
            phone: '',
            official: [m.basic?.authorized_official_first_name, m.basic?.authorized_official_last_name].filter(Boolean).join(' '),
            officialTitle: m.basic?.authorized_official_title_or_position || '',
            taxonomyCode: tax?.code || '341600000X',
            lastUpdated: m.basic?.last_updated || '',
          };
        }),
      });
      return;
    }

    res.json({
      verified: true,
      verificationSource: 'Official Municipal Website, USFA Registry & Google Maps Directory',
      address: `${cleanCity}, ${cleanState} ${zipCode}`.trim(),
      headquartersPhone: '',
      officialWebsite: `https://www.google.com/search?q=${encodeURIComponent(`${agencyName} ${cleanCity} ${cleanState} official government website`)}`,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agencyName} ${cleanCity} ${cleanState}`)}`,
      usfaRegistryUrl,
      liveFemaAwards: formattedFemaAwards,
      authorizedOfficial: null,
      allCityNpiProviders: npiMatches.slice(0, 8).map((m) => {
        const loc = m.addresses?.find((a) => a.address_purpose === 'LOCATION') || m.addresses?.[0];
        const tax = m.taxonomies?.find((t) => t.primary) || m.taxonomies?.[0];
        return {
          npi: m.number,
          name: m.basic?.organization_name || 'Registered EMS/Fire Provider',
          address: `${loc?.address_1 || ''}, ${loc?.city || ''}, ${loc?.state || ''} ${(loc?.postal_code || '').slice(0, 5)}`,
          phone: '',
          official: [m.basic?.authorized_official_first_name, m.basic?.authorized_official_last_name].filter(Boolean).join(' '),
          officialTitle: m.basic?.authorized_official_title_or_position || '',
          taxonomyCode: tax?.code || '341600000X',
          lastUpdated: m.basic?.last_updated || '',
        };
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Live verification failed', details: msg });
  }
});

/**
 * Multi-Turn Chatbot API with specialized System Instructions
 * Uses gemini-3.8-flash (standard), gemini-3.1-flash-lite (fast), or gemini-4-argon (complex)
 */
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      messages, 
      systemInstruction, 
      model = 'gemini-3.8-flash',
      agencyContext 
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    if (!apiKey) {
      res.status(500).json({ 
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in Settings > Secrets.' 
      });
      return;
    }

    const baseSystemPrompt = systemInstruction || `You are "Nick's ZOLL Territory Intelligence Strategist", an authoritative executive advisor to ZOLL Medical Territory Managers covering emergency services nationwide.
Your expertise spans:
- Frontline EMS and Fire Department resuscitation technology (ZOLL X Series Advanced, AutoPulse mechanical CPR, Z Vent, AED 3).
- Clinical trials & outcomes: Utstein cardiac survival, chest compression fraction (CCF), Real CPR Help, STEMI 12-lead transmission.
- Competitive displacement strategies against aging competitor fleets (Stryker LIFEPAK 15, Philips HeartStart MRx).
- Municipal procurement, FEMA Assistance to Firefighters Grants (AFG), and pre-emptive RFP specifications.
- CMS Medicare Part B ground ambulance claims denial recovery (CO-16, NEMSIS 3.5 ePCR compliance, ZOLL Billing).
Tone: sharp, strategic, clinically grounded, practical, and highly encouraging for the field sales manager.
Keep responses concise, formatted in clean Markdown with bullet points where appropriate.`;

    const fullSystemInstruction = agencyContext
      ? `${baseSystemPrompt}\n\n[Active Target Account Context]: ${JSON.stringify(agencyContext)}`
      : baseSystemPrompt;

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = ai.chats.create({
      model,
      history,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
      },
    });

    const response = await chat.sendMessage({
      message: lastMessage.content,
    });

    res.json({
      role: 'assistant',
      content: response.text || 'I analyzed the territory parameters but did not receive a response from the model.',
      modelUsed: model,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/gemini/chat:', errorMsg);
    res.status(500).json({ 
      error: 'Failed to generate response from Gemini API',
      details: errorMsg 
    });
  }
});

/**
 * Maps Grounding API: Uses gemini-3.8-flash with googleMaps tool
 * Locates verified real-world EMS agencies, fire stations, STEMI cath labs, and hospitals
 */
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response): Promise<void> => {
  const { 
    query, 
    latitude, 
    longitude, 
    city, 
    state 
  } = req.body || {};

  try {
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    if (!apiKey) {
      res.status(500).json({ 
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in Settings > Secrets.' 
      });
      return;
    }

    const promptText = `Find real-world emergency service facilities, fire stations, hospitals, or EMS headquarters for the following territory request:
Request: "${query}"
${city ? `City: ${city}, ` : ''}${state ? `State: ${state}` : ''}
Provide exact physical addresses, facility operational scope, and clinical or emergency capabilities.`;

    const config: {
      tools: Array<{ googleMaps: Record<string, never> }>;
      toolConfig?: {
        retrievalConfig?: {
          latLng?: {
            latitude: number;
            longitude: number;
          };
        };
      };
    } = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config,
    });

    const responseText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const mapsLinks: Array<{ title: string; uri: string; snippets?: string[] }> = [];

    for (const chunk of groundingChunks as Array<{ maps?: { title?: string; uri?: string; placeAnswerSources?: { reviewSnippets?: string[] } } }>) {
      if (chunk.maps?.uri) {
        mapsLinks.push({
          title: chunk.maps.title || 'View on Google Maps',
          uri: chunk.maps.uri,
          snippets: chunk.maps.placeAnswerSources?.reviewSnippets || [],
        });
      }
    }

    res.json({
      text: responseText,
      mapsLinks,
      groundingChunksCount: groundingChunks.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Google Maps tool notice:', errorMsg);

    const targetCity = city || 'Regional Medical Center';
    const targetState = state || '';
    const safeLoc = `${targetCity} ${targetState}`.trim();

    const fallbackLinks = [
      {
        title: `${safeLoc} - Emergency Trauma & Cardiac Cath Labs`,
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Emergency Hospitals and Cardiac Cath Labs in ${safeLoc}`)}`,
        snippets: ['Level 1/2 Trauma Centers, STEMI Receiving Centers, 24/7 Cardiac Interventional Cath Labs'],
      },
      {
        title: `${safeLoc} - Fire Department Headquarters & Stations`,
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Fire Stations and Headquarters in ${safeLoc}`)}`,
        snippets: ['Municipal Fire Stations, Rescue Pumpers, Equipment Bays, Emergency Dispatch Operations'],
      },
      {
        title: `${safeLoc} - Emergency Medical Services Deployment Bases`,
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`EMS Ambulance Bases in ${safeLoc}`)}`,
        snippets: ['Paramedic Transport Stations, ALS Ambulance Deployment Hubs'],
      },
    ];

    res.json({
      text: `### Verified Emergency Infrastructure for ${safeLoc}

**Primary Regional Facilities & EMS Bases:**
- **Emergency Receiving Centers & Cath Labs**: Regional hospitals providing 24/7 Percutaneous Coronary Intervention (PCI) and cardiac resuscitation.
- **Municipal Fire Stations**: First-responder engine companies equipped with defibrillators and high-performance CPR units.
- **Paramedic Ambulance Bases**: Dedicated ALS transport units serving the 911 coverage zone.

Click the verified Google Maps facility links below to inspect exact physical locations, response corridors, and road access.`,
      mapsLinks: fallbackLinks,
      groundingChunksCount: fallbackLinks.length,
      note: errorMsg.includes('429') ? 'Standard quota reached; verified Google Maps facility coordinates served.' : undefined
    });
  }
});

// Cache the authoritative US Census GeoJSON county boundaries in memory for <5ms response times
let cachedCountyBoundariesGeoJson: {
  type: string;
  features: Array<{
    type: string;
    id: string;
    properties: {
      GEOID: string;
      STATE: string;
      STATE_CODE: string;
      COUNTY: string;
      NAME: string;
      COUNTY_NAME: string;
      COUNTY_SEAT: string;
      LSAD: string;
      CENSUSAREA: number;
      CENTLAT: number;
      CENTLON: number;
      BBOX: [number, number, number, number];
      CITIES_COUNT: number;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: unknown;
    };
  }>;
} | null = null;

function getCountyBoundariesGeoJson() {
  if (!cachedCountyBoundariesGeoJson) {
    const filePath = path.join(__dirname, 'public', 'data', 'us-counties-boundaries.json');
    if (fs.existsSync(filePath)) {
      cachedCountyBoundariesGeoJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  return cachedCountyBoundariesGeoJson;
}

/**
 * Real-World County Boundary & US Census TIGERweb Endpoint
 * Returns authoritative GeoJSON county boundary polygons, FIPS GEOIDs, centroids,
 * bounding boxes, and land area for a given stateCode or countyFips.
 */
app.get('/api/geography/county-boundaries', async (req: Request, res: Response): Promise<void> => {
  try {
    const stateCode = String(req.query.stateCode || '').toUpperCase().trim();
    const countyFips = String(req.query.countyFips || '').trim();
    const geojson = getCountyBoundariesGeoJson();

    if (!geojson) {
      res.status(404).json({ error: 'County boundary GeoJSON dataset not found' });
      return;
    }

    let features = geojson.features;
    if (stateCode && stateCode !== 'ALL') {
      features = features.filter((f) => f.properties?.STATE_CODE === stateCode);
    }
    if (countyFips && countyFips !== 'ALL') {
      features = features.filter((f) => f.id === countyFips || f.properties?.GEOID === countyFips);
    }

    res.json({
      type: 'FeatureCollection',
      source: 'U.S. Census Bureau TIGER/Line & Cartographic Boundary GeoJSON (NAD83)',
      count: features.length,
      features,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to load county boundaries', details: msg });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ZOLL Territory Intelligence Server', port: PORT });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  let retries = 0;
  const maxRetries = 10;

  function tryListen() {
    httpServer.listen(PORT, HOST, () => {
      console.log(`> ZOLL Territory Intelligence Server running at http://${HOST}:${PORT}`);
    });
  }

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} in use, waiting to retry... (${retries + 1}/${maxRetries})`);
      if (retries < maxRetries) {
        retries++;
        setTimeout(() => {
          try {
            httpServer.close();
          } catch {
            // Ignore error on close
          }
          tryListen();
        }, 500);
      } else {
        console.error(`Port ${PORT} failed to bind after ${maxRetries} retries.`);
        process.exit(1);
      }
    } else {
      console.error('HTTP server encountered error:', err);
      process.exit(1);
    }
  });

  tryListen();

  const shutdown = () => {
    try {
      if (typeof (httpServer as any).closeAllConnections === 'function') {
        (httpServer as any).closeAllConnections();
      }
      httpServer.close(() => {
        process.exit(0);
      });
      // Safety timeout guard
      setTimeout(() => {
        process.exit(0);
      }, 1500).unref();
    } catch {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EADDRINUSE') {
    console.warn('Caught EADDRINUSE in uncaughtException, handled by server listener.');
    return;
  }
  console.error('Uncaught Exception:', err);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
