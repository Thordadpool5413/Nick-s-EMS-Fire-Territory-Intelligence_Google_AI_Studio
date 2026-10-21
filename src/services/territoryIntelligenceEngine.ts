/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency, ZollProductLine } from '../types';
import { ALL_NATIONWIDE_COUNTIES, ComprehensiveCountyRecord } from '../data/allCountiesDatabase';
import { CITIES_BY_STATE_AND_COUNTY, ALL_CITIES_BY_STATE, STATE_GEO_AND_AREA_CODES } from '../data/allCitiesDatabase';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { calculateScore, DEFAULT_WEIGHTS } from '../utils/syncStore';
import { nationalProviderDb } from './nationalProviderDatabase';

/**
 * ZOLL Territory Manager Intelligence Engine
 * Provides comprehensive, nationwide geographic and account resolution across
 * all 50 US States + DC, covering all 3,144 counties, 9,800+ US Census cities
 * and Fire/EMS protection districts, and 5-digit postal jurisdictions.
 */
class TerritoryIntelligenceService {
  private countyIndex: Map<string, ComprehensiveCountyRecord[]> = new Map();
  private countyByFips: Map<string, ComprehensiveCountyRecord> = new Map();
  private synthesizedAgenciesCache: Map<string, Agency> = new Map();

  constructor() {
    this.buildIndices();
  }

  private buildIndices() {
    const seen = new Set<string>();
    for (const county of ALL_NATIONWIDE_COUNTIES) {
      if (seen.has(county.countyFips)) continue;
      seen.add(county.countyFips);
      const st = county.stateCode.toUpperCase();
      if (!this.countyIndex.has(st)) {
        this.countyIndex.set(st, []);
      }
      this.countyIndex.get(st)!.push(county);
      this.countyByFips.set(county.countyFips, county);
    }
  }

  /**
   * Get all counties for any given US State (e.g. 'TX' -> 254 counties, 'OH' -> 88 counties, or 'Georgia')
   */
  public getCountiesForState(stateCode: string): ComprehensiveCountyRecord[] {
    if (!stateCode || stateCode.toLowerCase() === 'all') {
      return ALL_NATIONWIDE_COUNTIES;
    }
    const sc = stateCode.toUpperCase().trim();
    if (this.countyIndex.has(sc)) {
      return this.countyIndex.get(sc) || [];
    }
    const match = Object.entries(ALL_50_STATES_SUMMARIES).find(
      ([code, s]) => s.state.toLowerCase() === stateCode.toLowerCase().trim()
    );
    if (match) {
      return this.countyIndex.get(match[0]) || [];
    }
    return [];
  }

  /**
   * Find a specific county record
   */
  public getCountyRecord(stateCode: string, countyName: string): ComprehensiveCountyRecord | undefined {
    const counties = this.getCountiesForState(stateCode);
    const clean = countyName.toLowerCase().trim();
    return counties.find(c => 
      c.countyName.toLowerCase() === clean || 
      c.rawName.toLowerCase() === clean ||
      c.countyName.toLowerCase().replace(/ county| parish| borough/gi, '').trim() === clean.replace(/ county| parish| borough/gi, '').trim()
    );
  }

  private static majorMetroCitiesCache: string[] | null = null;
  private static allCitiesMetadataCache: Array<{
    city: string;
    county: string;
    countyFips: string;
    stateCode: string;
    isCountySeat: boolean;
    primaryZip?: string;
    latitude?: number;
    longitude?: number;
  }> | null = null;

  /**
   * Get all cities and fire/EMS districts for a state, optionally narrowed by county.
   */
  public getCitiesForState(stateCode: string, countyName?: string): string[] {
    const isAllStates = !stateCode || stateCode.toLowerCase().trim() === 'all';

    if (isAllStates) {
      if (countyName && countyName.toLowerCase() !== 'all') {
        const citySet = new Set<string>();
        const cleanCounty = countyName.toLowerCase().replace(/ county| parish| borough/gi, '').trim();
        for (const c of ALL_NATIONWIDE_COUNTIES) {
          if (
            c.countyName.toLowerCase() === countyName.toLowerCase().trim() ||
            c.rawName.toLowerCase() === cleanCounty
          ) {
            if (c.countySeat) citySet.add(c.countySeat);
            if (c.cities) c.cities.forEach(ct => citySet.add(ct));
            const stObj = CITIES_BY_STATE_AND_COUNTY[c.stateCode];
            if (stObj) {
              const extra = stObj[c.rawName] || stObj[c.countyName] || [];
              extra.forEach(ct => citySet.add(ct));
            }
          }
        }
        return Array.from(citySet).sort();
      }

      // Fast-path: When viewing All States with no specific county, return top metro cities instead of iterating 75,000 lines
      if (!TerritoryIntelligenceService.majorMetroCitiesCache) {
        TerritoryIntelligenceService.majorMetroCitiesCache = [
          'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
          'San Antonio', 'San Diego', 'Dallas', 'Austin', 'San Jose', 'Fort Worth',
          'Jacksonville', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco',
          'Seattle', 'Denver', 'Nashville', 'Oklahoma City', 'El Paso', 'Boston',
          'Portland', 'Las Vegas', 'Detroit', 'Memphis', 'Louisville', 'Baltimore',
          'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Mesa', 'Atlanta', 'Kansas City'
        ].sort();
      }
      return TerritoryIntelligenceService.majorMetroCitiesCache;
    }

    const sc = stateCode.toUpperCase().trim();
    const citySet = new Set<string>();

    if (countyName && countyName.toLowerCase() !== 'all') {
      const countyRecord = this.getCountyRecord(sc, countyName);
      if (countyRecord) {
        if (countyRecord.countySeat) citySet.add(countyRecord.countySeat);
        if (countyRecord.cities) countyRecord.cities.forEach(c => citySet.add(c));
      }
      const stateObj = CITIES_BY_STATE_AND_COUNTY[sc];
      if (stateObj) {
        const raw = countyName.replace(/ County| Parish| Borough/gi, '').trim();
        if (stateObj[raw]) stateObj[raw].forEach(c => citySet.add(c));
        if (stateObj[countyName]) stateObj[countyName].forEach(c => citySet.add(c));
      }
      return Array.from(citySet).sort();
    }

    const stateList = ALL_CITIES_BY_STATE[sc] || [];
    stateList.forEach(c => citySet.add(c));

    const counties = this.getCountiesForState(sc);
    for (const c of counties) {
      if (c.countySeat) citySet.add(c.countySeat);
      if (c.cities) c.cities.forEach(city => citySet.add(city));
    }

    return Array.from(citySet).sort();
  }

  /**
   * Return all incorporated US Census / USPS cities and towns in a state (or nationwide when stateCode === 'all')
   * with their county, countyFips, stateCode, county seat flag, coordinates, and primary zip
   */
  public getAllCitiesWithMetadata(stateCode: string, countyName?: string): Array<{
    city: string;
    county: string;
    countyFips: string;
    stateCode: string;
    isCountySeat: boolean;
    primaryZip?: string;
    latitude?: number;
    longitude?: number;
  }> {
    const isAllStates = !stateCode || stateCode.toLowerCase().trim() === 'all';
    const hasSpecificCounty = Boolean(countyName && countyName.toLowerCase() !== 'all');

    if (isAllStates && !hasSpecificCounty && TerritoryIntelligenceService.allCitiesMetadataCache) {
      return TerritoryIntelligenceService.allCitiesMetadataCache;
    }

    const counties = isAllStates ? ALL_NATIONWIDE_COUNTIES : this.getCountiesForState(stateCode.toUpperCase().trim());
    const results: Array<{
      city: string;
      county: string;
      countyFips: string;
      stateCode: string;
      isCountySeat: boolean;
      primaryZip?: string;
      latitude?: number;
      longitude?: number;
    }> = [];
    const seen = new Set<string>();

    const targetCounties = (countyName && countyName.toLowerCase() !== 'all')
      ? counties.filter(c => 
          c.countyName.toLowerCase() === countyName.toLowerCase() || 
          c.rawName.toLowerCase() === countyName.toLowerCase() ||
          c.countyName.toLowerCase().replace(/ county| parish| borough/gi, '').trim() === countyName.toLowerCase().replace(/ county| parish| borough/gi, '').trim()
        )
      : counties;

    for (const c of targetCounties) {
      const sc = c.stateCode.toUpperCase();
      if (c.cityRecords && c.cityRecords.length > 0) {
        for (const cr of c.cityRecords) {
          const key = `${sc}:${cr.name}:${c.countyName}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              city: cr.name,
              county: c.countyName,
              countyFips: c.countyFips,
              stateCode: sc,
              isCountySeat: cr.isCountySeat,
              primaryZip: cr.zipCode || c.primaryZipCodes?.[0],
              latitude: cr.latitude,
              longitude: cr.longitude
            });
          }
        }
      } else if (c.cities) {
        for (const cityName of c.cities) {
          const key = `${sc}:${cityName}:${c.countyName}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              city: cityName,
              county: c.countyName,
              countyFips: c.countyFips,
              stateCode: sc,
              isCountySeat: cityName === c.countySeat,
              primaryZip: c.primaryZipCodes?.[0],
              latitude: c.centroidLat,
              longitude: c.centroidLng
            });
          }
        }
      }
    }

    const sorted = results.sort((a, b) => a.city.localeCompare(b.city));
    if (isAllStates && !hasSpecificCounty) {
      TerritoryIntelligenceService.allCitiesMetadataCache = sorted;
    }
    return sorted;
  }

  /**
   * Get all agencies for a state, providing full dual coverage across
   * 100% of the state's counties AND incorporated municipal cities for BOTH EMS Providers AND Fire Departments.
   */
  public getAgenciesForState(
    stateCode: string, 
    existingAgencies: Agency[] = [],
    categoryFilter: 'all' | 'ems' | 'fire' = 'all'
  ): Agency[] {
    let sc = stateCode ? stateCode.toUpperCase().trim() : '';
    if (!sc || sc.toLowerCase() === 'all') return this.filterByCategory(existingAgencies, categoryFilter);
    if (!ALL_50_STATES_SUMMARIES[sc]) {
      const match = Object.entries(ALL_50_STATES_SUMMARIES).find(
        ([code, s]) => s.state.toLowerCase() === stateCode.toLowerCase().trim()
      );
      if (match) sc = match[0];
    }

    const dbAgencies = nationalProviderDb.getProviders({ state: sc, category: categoryFilter });
    if (dbAgencies.length > 0) {
      // Merge any user-edited existing agencies with database agencies
      const byId = new Map<string, Agency>();
      for (const a of dbAgencies) byId.set(a.id, a);
      for (const ex of existingAgencies) {
        if (ex.stateCode.toUpperCase() === sc) {
          byId.set(ex.id, ex);
        }
      }
      return this.filterByCategory(Array.from(byId.values()), categoryFilter);
    }

    return this.filterByCategory(existingAgencies, categoryFilter);
  }

  public filterByCategory(list: Agency[], categoryFilter: 'all' | 'ems' | 'fire'): Agency[] {
    if (categoryFilter === 'all') return list;
    if (categoryFilter === 'ems') {
      return list.filter(a => (a.providerCategory ? a.providerCategory === 'ems' : !a.agencyType.toLowerCase().includes('fire')));
    }
    if (categoryFilter === 'fire') {
      return list.filter(a => (a.providerCategory ? a.providerCategory === 'fire' : a.agencyType.toLowerCase().includes('fire')));
    }
    return list;
  }

  /**
   * Get all authoritative agencies for a specific jurisdiction (State, County, or City),
   * providing BOTH the EMS Provider AND the Fire Department for full dual coverage.
   */
  public getAgenciesForJurisdiction(
    stateCode: string,
    countyName?: string,
    cityName?: string,
    existingAgencies: Agency[] = [],
    categoryFilter: 'all' | 'ems' | 'fire' = 'all'
  ): Agency[] {
    const sc = stateCode.toUpperCase().trim();
    if (!sc || sc === 'all') {
      return this.filterByCategory(existingAgencies, categoryFilter);
    }

    if ((!countyName || countyName === 'all') && (!cityName || cityName === 'all')) {
      return this.getAgenciesForState(sc, existingAgencies, categoryFilter);
    }

    const cleanCounty = (countyName && countyName !== 'all') ? countyName : undefined;
    const cleanCity = (cityName && cityName !== 'all') ? cityName : undefined;

    const dbMatched = nationalProviderDb.getProviders({
      state: sc,
      county: cleanCounty,
      city: cleanCity,
      category: categoryFilter,
    });

    const resultsMap = new Map<string, Agency>();
    for (const a of dbMatched) resultsMap.set(a.id, a);

    for (const a of existingAgencies) {
      if (a.stateCode !== sc) continue;
      if (cleanCounty && a.county.toLowerCase().replace(/ county| parish| borough/gi, '').trim() !== cleanCounty.toLowerCase().replace(/ county| parish| borough/gi, '').trim()) continue;
      if (cleanCity && a.city.toLowerCase().trim() !== cleanCity.toLowerCase().trim()) continue;
      resultsMap.set(a.id, a);
    }

    const results = Array.from(resultsMap.values());
    const countyToTarget = cleanCounty || this.getCountiesForState(sc)[0]?.countyName || `${sc} County`;
    const cityToTarget = cleanCity || this.getCountyRecord(sc, countyToTarget)?.countySeat || 'Metro';

    if (categoryFilter === 'all' || categoryFilter === 'ems') {
      const hasEms = results.some(a => !a.agencyType.toLowerCase().includes('fire') && (!cleanCity || a.city.toLowerCase() === cleanCity.toLowerCase()));
      if (!hasEms) {
        const emsAgency = this.resolveOrSynthesizeAgency(sc, countyToTarget, cityToTarget, existingAgencies, 'ems');
        results.push(emsAgency);
      }
    }

    if (categoryFilter === 'all' || categoryFilter === 'fire') {
      const hasFire = results.some(a => a.agencyType.toLowerCase().includes('fire') && (!cleanCity || a.city.toLowerCase() === cleanCity.toLowerCase()));
      if (!hasFire) {
        const fireAgency = this.resolveOrSynthesizeAgency(sc, countyToTarget, cityToTarget, existingAgencies, 'fire');
        results.push(fireAgency);
      }
    }

    return this.filterByCategory(results, categoryFilter);
  }

  /**
   * Get complete dual EMS + Fire coverage for a county AND all of its incorporated municipal cities.
   */
  public getAgenciesForCountyAndCities(
    stateCode: string,
    countyName: string,
    cities: string[] = [],
    existingAgencies: Agency[] = [],
    categoryFilter: 'all' | 'ems' | 'fire' = 'all'
  ): Agency[] {
    const sc = stateCode.toUpperCase().trim();
    if (!sc || sc === 'all' || !countyName || countyName === 'all') {
      return this.getAgenciesForState(sc, existingAgencies, categoryFilter);
    }

    // 1. Primary County-level & pre-indexed Municipal EMS & Fire coverage (O(1) lookup via nationalProviderDb)
    const baseCountyAgencies = this.getAgenciesForJurisdiction(sc, countyName, undefined, existingAgencies, categoryFilter);
    const seenIds = new Set<string>(baseCountyAgencies.map(a => a.id));
    const results: Agency[] = [...baseCountyAgencies];

    // 2. Ensure every requested city in this county has both EMS and Fire representation
    const targetCities = cities.length > 0 ? cities : this.getCitiesForState(sc, countyName);
    const coveredCitiesEms = new Set<string>();
    const coveredCitiesFire = new Set<string>();
    for (const ag of results) {
      const cLower = ag.city.toLowerCase();
      const isFire = ag.providerCategory ? ag.providerCategory === 'fire' : ag.agencyType.toLowerCase().includes('fire');
      if (isFire) coveredCitiesFire.add(cLower);
      else coveredCitiesEms.add(cLower);
    }

    for (const city of targetCities) {
      const cLower = city.toLowerCase();
      const needsEms = (categoryFilter === 'all' || categoryFilter === 'ems') && !coveredCitiesEms.has(cLower);
      const needsFire = (categoryFilter === 'all' || categoryFilter === 'fire') && !coveredCitiesFire.has(cLower);
      if (needsEms || needsFire) {
        const cityAgencies = this.getAgenciesForJurisdiction(sc, countyName, city, existingAgencies, categoryFilter);
        for (const ag of cityAgencies) {
          if (!seenIds.has(ag.id)) {
            seenIds.add(ag.id);
            results.push(ag);
          }
        }
      }
    }

    return this.filterByCategory(results, categoryFilter);
  }

  public getZipCodesForLocation(stateCode: string, countyName?: string): string[] {
    const sc = stateCode.toUpperCase().trim();
    if (!sc || sc === 'all') return ['90210', '10001', '60601', '75001', '30303', '33101', '44114', '98101'];

    if (countyName && countyName !== 'all') {
      const county = this.getCountyRecord(sc, countyName);
      if (county && county.primaryZipCodes) {
        return county.primaryZipCodes;
      }
    }

    const stSummary = ALL_50_STATES_SUMMARIES[sc];
    if (stSummary && stSummary.primaryZipPrefixes) {
      return stSummary.primaryZipPrefixes.map(p => `${p}01`);
    }

    return [];
  }

  /**
   * Resolve an authoritative EMS/Fire agency account for any jurisdiction (delegating first to nationalProviderDb)
   */
  public resolveOrSynthesizeAgency(
    stateCode: string,
    countyName: string,
    cityName?: string,
    existingAgencies: Agency[] = [],
    forcedCategory?: 'ems' | 'fire'
  ): Agency {
    const sc = stateCode.toUpperCase().trim();
    const city = cityName || this.getCitiesForState(sc, countyName)[0] || 'Central';
    const cleanCounty = countyName.endsWith('County') || countyName.endsWith('Parish') || countyName.endsWith('Borough')
      ? countyName
      : `${countyName} County`;

    // 1. Check nationalProviderDb first
    const fromDb = nationalProviderDb.getProviders({
      state: sc,
      county: cleanCounty,
      city: cityName,
      category: forcedCategory || 'all',
      limit: 1,
    });
    if (fromDb.length > 0) return fromDb[0];

    // 2. Check existingAgencies
    const existing = existingAgencies.find(a => {
      if (a.stateCode !== sc) return false;
      const matchesPlace = cityName
        ? a.city.toLowerCase() === city.toLowerCase()
        : (a.county.toLowerCase() === cleanCounty.toLowerCase() || a.city.toLowerCase() === city.toLowerCase());
      if (!matchesPlace) return false;
      if (forcedCategory === 'fire') return a.agencyType.toLowerCase().includes('fire');
      if (forcedCategory === 'ems') return !a.agencyType.toLowerCase().includes('fire');
      return true;
    });
    if (existing) return existing;

    // 3. Check cache
    const cacheKey = `${sc}:${cleanCounty}:${city}:${forcedCategory || 'default'}`;
    if (this.synthesizedAgenciesCache.has(cacheKey)) {
      return this.synthesizedAgenciesCache.get(cacheKey)!;
    }

    const countyRecord = this.getCountyRecord(sc, cleanCounty) || this.getCountiesForState(sc)[0] || ALL_NATIONWIDE_COUNTIES[0];

    const stSummary = ALL_50_STATES_SUMMARIES[sc] || {
      state: countyRecord.stateName,
      code: sc,
      avgMedicareDenialRate: 18.5,
      avgUtsteinSurvival: 26.4,
      totalAfgAwardsYtd: 8500000,
      medicaidExpansion: true,
      highPriorityLeadsCount: 12,
      avgTransportMinutes: 22.0,
      seniorPopPct: 16.5
    };

    let hash = 0;
    const combinedStr = `${sc}:${countyRecord.countyName}:${city}`;
    for (let i = 0; i < combinedStr.length; i++) {
      hash = (hash * 33 + combinedStr.charCodeAt(i)) & 0xffffffff;
    }
    const posHash = Math.abs(hash);

    const zip = (countyRecord.primaryZipCodes && countyRecord.primaryZipCodes[0]) || '10001';
    const isFireBased = forcedCategory === 'fire' 
      ? true 
      : forcedCategory === 'ems' 
        ? false 
        : (posHash % 2 === 0);

    const isMunicipalCity = cityName && cityName.toLowerCase() !== countyRecord.countySeat.toLowerCase();

    const agencyName = isFireBased
      ? (isMunicipalCity ? `${city} Fire Department` : `${cleanCounty} Fire & Rescue`)
      : (isMunicipalCity ? `${city} Emergency Medical Services` : `${cleanCounty} Emergency Medical Services`);

    const agencyType = isFireBased
      ? ((posHash % 3 === 0) ? 'Career Fire Department' : (posHash % 3 === 1) ? 'Combination Fire District' : 'Municipal Fire & Rescue')
      : ((posHash % 3 === 0) ? 'Municipal 3rd Service EMS' : (posHash % 3 === 1) ? 'County 3rd Service EMS' : 'Hospital-Based EMS');

    const defibBrand = (posHash % 3 === 0) 
      ? 'Stryker LIFEPAK 15' 
      : (posHash % 3 === 1) 
        ? 'Philips MRx' 
        : 'Medtronic Legacy LIFEPAK 12';

    const defibAge = 6 + (posHash % 6);
    const warrantyStatus = defibAge >= 8 ? 'Expired' : 'Third-Party';
    const hasMechanicalCpr = posHash % 3 === 0;
    const mechanicalCpr = hasMechanicalCpr ? 'Stryker LUCAS 3' : 'None / Manual Only';
    const hasVent = posHash % 4 === 0;
    const transportVent = hasVent ? 'Hamilton T1' : 'None / Bag-Valve-Mask Only';

    const cadVendors = [
      'CentralSquare Enterprise CAD',
      'Motorola PremierOne CAD',
      'Hexagon OnCall Dispatch',
      'Tyler New World CAD',
      'ZOLL Respond CAD'
    ];
    const dispatchCadVendor = cadVendors[posHash % cadVendors.length];

    let targetProduct: ZollProductLine = 'X Series Advanced';
    if (!hasMechanicalCpr) {
      targetProduct = 'AutoPulse Resuscitation System';
    } else if (countyRecord.averageTransportMinutes > 24) {
      targetProduct = 'Z Vent Transport Ventilator';
    } else if (isFireBased && (posHash % 2 === 0)) {
      targetProduct = 'ZOLL AED 3 & Public Access Defibrillators';
    } else if (!isFireBased && countyRecord.population > 120000) {
      targetProduct = 'ZOLL Billing / AR Boost';
    }

    const denialRate = +(stSummary.avgMedicareDenialRate + ((posHash % 60) - 30) / 10).toFixed(1);
    const recoverableRevenue = Math.round(countyRecord.annualEmergencyTransports * 68);

    const medicarePayerPct = +(38.0 + (posHash % 14)).toFixed(1);
    const medicaidPayerPct = +(21.0 + (posHash % 9)).toFixed(1);
    const commercialPayerMixPct = +(25.0 + (posHash % 10)).toFixed(1);
    const selfPayPayerPct = +(Math.max(4.0, 100 - medicarePayerPct - medicaidPayerPct - commercialPayerMixPct)).toFixed(1);

    const defibUnitsCount = Math.max(4, Math.round(countyRecord.population / 12000));
    const cprUnitsCount = hasMechanicalCpr ? Math.max(2, Math.round(countyRecord.population / 24000)) : 0;
    const ventUnitsCount = hasVent ? Math.max(2, Math.round(countyRecord.population / 30000)) : 0;

    const totalAmbulances = isFireBased 
      ? Math.max(1, Math.round(countyRecord.population / 22000))
      : Math.max(3, Math.round(countyRecord.population / 11000));

    const totalFireEngines = isFireBased 
      ? Math.max(2, Math.round(countyRecord.population / 14000))
      : 0;

    const primaryReceivingHospital = `${city} Regional Medical Center (Level ${(posHash % 2) + 1} Trauma & PCI)`;
    const annualHospitalDestinationTransports = Math.round(countyRecord.annualEmergencyTransports * 0.88);

    const stateGeo = STATE_GEO_AND_AREA_CODES[sc] || { lat: 38.5, lng: -96.5 };
    const headquartersAddress = `${agencyName} Headquarters, ${city}, ${sc} ${zip}`;
    const googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agencyName}, ${city}, ${sc} ${zip}`)}`;
    const officialWebsite = `https://www.google.com/search?q=${encodeURIComponent(`${agencyName} ${city} ${sc} official government website phone`)}`;

    const dummyAgency: Agency = {
      id: `territory-${sc.toLowerCase()}-${isFireBased ? 'fire' : 'ems'}-${posHash.toString(36).slice(0, 6)}`,
      name: agencyName,
      fdid: `${sc}-${posHash.toString().slice(0, 5)}`,
      providerCategory: isFireBased ? 'fire' : 'ems',
      agencyType: agencyType,
      jurisdictionLevel: isMunicipalCity ? 'Local' : 'County',
      state: countyRecord.stateName,
      stateCode: sc,
      county: cleanCounty,
      city: city,
      zipCode: zip,
      address: headquartersAddress,
      latitude: +(stateGeo.lat + ((posHash % 300) - 150) / 1000).toFixed(4),
      longitude: +(stateGeo.lng + (((posHash >> 2) % 300) - 150) / 1000).toFixed(4),
      headquartersPhone: '',
      officialWebsite,
      googleMapsUri,
      verificationSource: 'USFA & Municipal Jurisdiction Index (Click Live Verify for NPI/Maps)',
      isVerifiedRecord: false,
      populationServed: countyRecord.population,
      responseAreaSqMiles: +(24.0 + (posHash % 240)).toFixed(1),
      stationsCount: Math.max(1, Math.round(countyRecord.population / 22000)),
      totalAmbulances: totalAmbulances,
      totalFireEngines: totalFireEngines,
      totalEMSStaff: Math.max(12, Math.round(countyRecord.population / 1200)),
      annualCallVolume: Math.round(countyRecord.annualEmergencyTransports * 1.35),
      annual911Transports: countyRecord.annualEmergencyTransports,
      annualCardiacArrestCalls: countyRecord.annualCardiacArrestIncidents,
      bystanderCPRRate: +(32.0 + (posHash % 25)).toFixed(1),
      utsteinSurvivalRate: +(stSummary.avgUtsteinSurvival + ((posHash % 40) - 20) / 10).toFixed(1),
      lastContactDate: '2026-09-14',
      zollOpportunity: {
        pulseIqScore: 85,
        priorityTier: 'High Value',
        salesStage: (posHash % 4 === 0) ? 'Clinical Evaluation Trial' : (posHash % 3 === 0) ? 'Demo Scheduled' : 'Target Lead',
        primaryTargetProduct: targetProduct,
        recommendedBundle: [targetProduct, 'Real CPR Help Sensor', 'ZOLL Billing Suite'],
        projectedPipelineValue: Math.round(Math.max(2, Math.round(countyRecord.population / 14000)) * 42000),
        clinicalBenefitNarrative: `Deployment of ${targetProduct} enhances chest compression fraction from 71% to 88% and reduces neurological deficit upon discharge.`,
        financialRoiNarrative: `Estimated $${(recoverableRevenue / 1000).toFixed(0)}k annual recoverable revenue via automated clinical documentation and NEMSIS 3.5 compliance.`,
        scoreRationale: `${defibAge}-year-old ${defibBrand} fleet with ${warrantyStatus.toLowerCase()} warranty. ${denialRate}% Medicare claims denial rate offers $${(recoverableRevenue / 1000).toFixed(0)}k annual recoverable revenue.`,
        probabilityPct: 65,
        scoreBreakdown: {
          clinicalAcuityPts: 20,
          fleetObsolescencePts: 22,
          cmsFinancialPts: 18,
          demographicVulnerabilityPts: 12,
          budgetGrantReadinessPts: 14
        }
      },
      cmsData: {
        medicareBilledAnnual: Math.round(countyRecord.annualEmergencyTransports * 540),
        medicareAllowedAnnual: Math.round(countyRecord.annualEmergencyTransports * 390),
        claimDenialRate: denialRate,
        topDenialReason: 'CO-16: Lacks Medical Necessity Documentation',
        topDenialReasonCode: 'CO-16',
        medicaidBilledAnnual: Math.round(countyRecord.annualEmergencyTransports * 210),
        commercialPayerMixPct: commercialPayerMixPct,
        medicarePayerPct: medicarePayerPct,
        medicaidPayerPct: medicaidPayerPct,
        selfPayPayerPct: selfPayPayerPct,
        gadcsReportingStatus: (posHash % 2 === 0) ? 'Selected - In Progress' : 'Compliant',
        estimatedRecoverableRevenue: recoverableRevenue
      },
      installedFleet: {
        defibBrand: defibBrand,
        defibUnitsCount: defibUnitsCount,
        defibAgeYears: defibAge,
        defibWarrantyStatus: warrantyStatus,
        mechanicalCPR: mechanicalCpr,
        cprUnitsCount: cprUnitsCount,
        transportVentilator: transportVent,
        ventUnitsCount: ventUnitsCount,
        epcrCadSoftware: (posHash % 2 === 0) ? 'ImageTrend Elite' : 'ESO Solutions',
        dispatchCadVendor: dispatchCadVendor,
        billingSoftware: (posHash % 3 === 0) ? 'Digitech EMS Billing' : (posHash % 3 === 1) ? 'In-House Municipal Billing' : 'Optum Revenue Cycle'
      },
      grantStatus: {
        afgAwarded: posHash % 3 === 0,
        afgAwardAmount: (posHash % 3 === 0) ? 140000 + (posHash % 260000) : 0,
        afgFiscalYear: 2024,
        afgPurpose: 'Operations & Safety - Paramedic Defibrillator Upgrade',
        saferGrantActive: false,
        fiscalYearEndMonth: (posHash % 2 === 0) ? 'September' : 'December'
      },
      gisData: {
        populationDensityPerSqMile: +(120 + (posHash % 1200)).toFixed(1),
        medianHouseholdIncome: countyRecord.medianIncome,
        seniorPopulationPct: countyRecord.seniorPopPct,
        povertyRate: countyRecord.povertyRatePct,
        avgTransportTimeMinutes: countyRecord.averageTransportMinutes,
        distanceToNearestCathLabMiles: countyRecord.primaryCathLabDistanceMiles,
        traumaCenterLevel: (posHash % 3 === 0) ? 'Level 1 Trauma' : 'Level 2 Trauma',
        publicAccessAedDeficitPct: +(38.0 + (posHash % 40)).toFixed(1),
        highRiseBuildingDensity: (posHash % 4 === 0) ? 'High' : 'Moderate',
        annualTraumaIncidents: Math.round(countyRecord.annualEmergencyTransports * 0.16),
        fiscalBudgetCycleQuarter: 'Q3 (Jul-Sep)',
        territoryClusterId: `${sc.toLowerCase()}-metro-${countyRecord.countyFips.slice(-2)}`,
        territoryClusterName: `${countyRecord.countyName} Regional Health Corridor`,
        primaryReceivingHospital: primaryReceivingHospital,
        annualHospitalDestinationTransports: annualHospitalDestinationTransports
      },
      qualityMetrics: {
        nemsqaStemi12LeadAcquisitionPct: +(78.0 + (posHash % 15)).toFixed(1),
        nemsqaChestCompressionFractionPct: +(72.0 + (posHash % 12)).toFixed(1),
        nemsqaEtco2VentilationCompliancePct: +(58.0 + (posHash % 18)).toFixed(1),
        nemsqaPediatricRespiratorySupportPct: +(66.0 + (posHash % 16)).toFixed(1),
        nemsqaStrokeLkwDocumentedPct: +(76.0 + (posHash % 14)).toFixed(1),
        nemsqaPainManagementEffectivePct: +(74.0 + (posHash % 15)).toFixed(1),
        caresGoodNeurologicalSurvivalPct: +(18.0 + (posHash % 14)).toFixed(1),
        ahaMissionLifelineTier: (posHash % 2 === 0) ? 'Gold Plus' : 'Silver',
        gadcsCostToChargeRatio: 0.68,
        commercialUnderpaymentPerTrip: 285
      },
      competitorContract: {
        vendor: defibBrand.includes('Stryker') ? 'Stryker ProCare' : 'Philips Master Service',
        contractEndDate: `202${6 + (posHash % 3)}-0${1 + (posHash % 9)}-28`,
        renewalWindowDays: 60 + (posHash % 90),
        annualServiceCostPerUnit: 2450,
        status: (posHash % 3 === 0) ? 'Expiring Soon (90 Days)' : 'Active Term',
        actionRecommendation: 'Initiate clinical trial evaluation and pre-emptive RFP specification delivery.'
      },
      keyContacts: [
        {
          id: `kc-${posHash}-hq`,
          name: `${agencyName} Command & Administration`,
          title: isFireBased ? 'Office of the Fire Chief & EMS Command' : 'Office of the EMS Director & Medical Command',
          role: isFireBased ? 'Fire Chief' : 'EMS Chief',
          email: '',
          phone: '',
          officialWebsite,
          headquartersAddress,
          isVerifiedOfficial: false,
          verificationSource: 'Official Municipal & Federal NPI Lookup',
          notes: 'Click "Verify via Federal NPI & Google Maps" to pull the registered CMS NPPES Authorized Official, direct headquarters telephone number, and street address.'
        }
      ],
      fieldNotes: [],
      inDayRoute: false,
      isBookmarked: false
    };

    const calculatedScore = calculateScore(dummyAgency, DEFAULT_WEIGHTS);
    dummyAgency.zollOpportunity.pulseIqScore = calculatedScore;
    dummyAgency.zollOpportunity.priorityTier = calculatedScore >= 90 ? 'Critical Opportunity' : calculatedScore >= 80 ? 'High Value' : 'Mid-Term Pipeline';
    dummyAgency.zollOpportunity.scoreBreakdown = {
      clinicalAcuityPts: Math.round(calculatedScore * 0.25),
      fleetObsolescencePts: Math.round(calculatedScore * 0.30),
      cmsFinancialPts: Math.round(calculatedScore * 0.20),
      demographicVulnerabilityPts: Math.round(calculatedScore * 0.15),
      budgetGrantReadinessPts: Math.round(calculatedScore * 0.10)
    };

    this.synthesizedAgenciesCache.set(cacheKey, dummyAgency);
    return dummyAgency;
  }

  /**
   * Universal search across all 3,144 counties and 9,800+ cities & fire/EMS districts nationwide
   */
  public searchNationwide(query: string, limit: number = 20): Array<{
    type: 'county' | 'city' | 'zip';
    label: string;
    sublabel: string;
    stateCode: string;
    countyName: string;
    cityName: string;
    zipCode?: string;
  }> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      type: 'county' | 'city' | 'zip';
      label: string;
      sublabel: string;
      stateCode: string;
      countyName: string;
      cityName: string;
      zipCode?: string;
    }> = [];

    for (const county of ALL_NATIONWIDE_COUNTIES) {
      if (results.length >= limit) break;
      if (
        county.countyName.toLowerCase().includes(q) ||
        county.rawName.toLowerCase().includes(q) ||
        county.countySeat.toLowerCase().includes(q) ||
        county.countyFips.includes(q)
      ) {
        results.push({
          type: 'county',
          label: `${county.countyName}, ${county.stateCode}`,
          sublabel: `Pop: ${county.population.toLocaleString()} • Seat: ${county.countySeat} • Cities: ${county.cities.length}`,
          stateCode: county.stateCode,
          countyName: county.countyName,
          cityName: county.countySeat
        });
      }
    }

    if (results.length < limit) {
      for (const [st, cities] of Object.entries(ALL_CITIES_BY_STATE)) {
        if (results.length >= limit) break;
        for (const city of cities) {
          if (city.toLowerCase().includes(q)) {
            const county = this.countyIndex.get(st)?.find(c => c.cities && c.cities.includes(city));
            results.push({
              type: 'city',
              label: `${city}, ${st}`,
              sublabel: `${county ? county.countyName : 'County Jurisdiction'} • Official US Census & District Roster`,
              stateCode: st,
              countyName: county ? county.countyName : `${city} County`,
              cityName: city
            });
            if (results.length >= limit) break;
          }
        }
      }
    }

    return results;
  }
}

export const territoryEngine = new TerritoryIntelligenceService();
