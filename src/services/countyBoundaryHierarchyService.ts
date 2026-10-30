import { gunzipSync, strFromU8 } from 'fflate';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency } from '../types';
import { ALL_NATIONWIDE_COUNTIES, ComprehensiveCountyRecord, CityBoundaryRecord } from '../data/allCountiesDatabase';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from './territoryIntelligenceEngine';

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface CountyBoundaryGeoJsonFeature {
  type: 'Feature';
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
  geometry: GeoJsonGeometry;
}

export interface CityJurisdictionNode {
  cityName: string;
  countyFips: string;
  countyName: string;
  stateCode: string;
  stateName: string;
  stateFips: string;
  isCountySeat: boolean;
  zipCode: string;
  latitude: number;
  longitude: number;
  providers: Agency[];
}

export interface CountyBoundaryNode {
  countyFips: string;
  stateFips: string;
  countyAnsi: string;
  countyName: string;
  rawName: string;
  stateCode: string;
  stateName: string;
  countySeat: string;
  centroid: {
    lat: number;
    lng: number;
  };
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  landAreaSqMiles: number;
  primaryZipCodes: string[];
  geometry: GeoJsonGeometry | null;
  boundarySource: string;
  citiesByName: Record<string, CityJurisdictionNode>;
  citiesList: CityJurisdictionNode[];
  countyRecord: ComprehensiveCountyRecord;
}

export interface StateHierarchyNode {
  stateCode: string;
  stateName: string;
  stateFips: string;
  region: 'Northeast' | 'Midwest' | 'South' | 'West';
  bbox: [number, number, number, number];
  totalLandAreaSqMiles: number;
  countiesByFips: Record<string, CountyBoundaryNode>;
  countiesByName: Record<string, CountyBoundaryNode>;
  countiesList: CountyBoundaryNode[];
  totalCitiesCount: number;
}

export interface NationalGeographicHierarchy {
  statesByCode: Record<string, StateHierarchyNode>;
  statesList: StateHierarchyNode[];
  countiesByFips: Record<string, CountyBoundaryNode>;
  totalStates: number;
  totalCounties: number;
  totalCities: number;
}

export interface SvgProjectedCounty {
  countyFips: string;
  countyName: string;
  countySeat: string;
  stateCode: string;
  landAreaSqMiles: number;
  citiesCount: number;
  population: number;
  medicareDenialRatePct: number | null;
  stateBenchmarkDenialRatePct?: number | null;
  medicareDenialSource?: string;
  averageTransportMinutes: number;
  svgPath: string;
  labelX: number;
  labelY: number;
  node: CountyBoundaryNode;
}

export interface SvgProjectedCityPin {
  cityName: string;
  zipCode: string;
  isCountySeat: boolean;
  latitude: number;
  longitude: number;
  svgX: number;
  svgY: number;
  providersCount: number;
}

class CountyBoundaryHierarchyService {
  private hierarchy: NationalGeographicHierarchy | null = null;
  private stateFeaturesCache: Map<string, CountyBoundaryGeoJsonFeature[]> = new Map();
  private inFlightStateRequests: Map<string, Promise<CountyBoundaryGeoJsonFeature[]>> = new Map();

  /**
   * Build the complete 3-tier State -> County (with real Census FIPS, bbox, centroid, landArea) -> City hierarchy
   */
  public getHierarchy(agencies: Agency[] = []): NationalGeographicHierarchy {
    if (this.hierarchy) {
      return this.hierarchy;
    }

    const statesByCode: Record<string, StateHierarchyNode> = {};
    const countiesByFips: Record<string, CountyBoundaryNode> = {};
    let totalCities = 0;

    for (const [sc, summary] of Object.entries(ALL_50_STATES_SUMMARIES)) {
      statesByCode[sc] = {
        stateCode: sc,
        stateName: summary.state,
        stateFips: summary.fips,
        region: summary.region,
        bbox: [180, 90, -180, -90],
        totalLandAreaSqMiles: 0,
        countiesByFips: {},
        countiesByName: {},
        countiesList: [],
        totalCitiesCount: 0,
      };
    }

    for (const c of ALL_NATIONWIDE_COUNTIES) {
      const sc = c.stateCode.toUpperCase();
      const stNode = statesByCode[sc];
      if (!stNode) continue;

      const citiesByName: Record<string, CityJurisdictionNode> = {};
      const citiesList: CityJurisdictionNode[] = [];

      const rawCityRecords: CityBoundaryRecord[] =
        c.cityRecords && c.cityRecords.length > 0
          ? c.cityRecords
          : (c.cities || [c.countySeat]).map((name, idx) => ({
              name,
              zipCode: c.primaryZipCodes?.[idx % (c.primaryZipCodes.length || 1)] || '10001',
              latitude: c.centroidLat || 38.5,
              longitude: c.centroidLng || -96.5,
              isCountySeat: name.toLowerCase() === (c.countySeat || '').toLowerCase(),
            }));

      for (const cr of rawCityRecords) {
        const cityNode: CityJurisdictionNode = {
          cityName: cr.name,
          countyFips: c.countyFips,
          countyName: c.countyName,
          stateCode: sc,
          stateName: c.stateName,
          stateFips: c.stateFips || stNode.stateFips,
          isCountySeat: cr.isCountySeat,
          zipCode: cr.zipCode,
          latitude: cr.latitude,
          longitude: cr.longitude,
          providers: [],
        };
        citiesByName[cr.name.toLowerCase()] = cityNode;
        citiesList.push(cityNode);
        totalCities++;
      }

      const countyBbox: [number, number, number, number] = c.bbox || [
        (c.centroidLng || -96.5) - 0.25,
        (c.centroidLat || 38.5) - 0.25,
        (c.centroidLng || -96.5) + 0.25,
        (c.centroidLat || 38.5) + 0.25,
      ];

      const countyNode: CountyBoundaryNode = {
        countyFips: c.countyFips,
        stateFips: c.stateFips || stNode.stateFips,
        countyAnsi: c.countyFips.slice(2),
        countyName: c.countyName,
        rawName: c.rawName,
        stateCode: sc,
        stateName: c.stateName,
        countySeat: c.countySeat,
        centroid: {
          lat: c.centroidLat || 38.5,
          lng: c.centroidLng || -96.5,
        },
        bbox: countyBbox,
        landAreaSqMiles: c.landAreaSqMiles || 450.0,
        primaryZipCodes: c.primaryZipCodes || [],
        geometry: null,
        boundarySource: 'U.S. Census Bureau TIGER/Line NAD83 (GEOID ' + c.countyFips + ')',
        citiesByName,
        citiesList,
        countyRecord: c,
      };

      stNode.countiesByFips[c.countyFips] = countyNode;
      stNode.countiesByName[c.countyName.toLowerCase()] = countyNode;
      stNode.countiesByName[c.rawName.toLowerCase()] = countyNode;
      stNode.countiesList.push(countyNode);
      stNode.totalLandAreaSqMiles = +(stNode.totalLandAreaSqMiles + countyNode.landAreaSqMiles).toFixed(1);
      stNode.totalCitiesCount += citiesList.length;

      // Expand state bounding box
      if (countyBbox[0] < stNode.bbox[0]) stNode.bbox[0] = countyBbox[0];
      if (countyBbox[1] < stNode.bbox[1]) stNode.bbox[1] = countyBbox[1];
      if (countyBbox[2] > stNode.bbox[2]) stNode.bbox[2] = countyBbox[2];
      if (countyBbox[3] > stNode.bbox[3]) stNode.bbox[3] = countyBbox[3];

      countiesByFips[c.countyFips] = countyNode;
    }

    const statesList = Object.values(statesByCode).sort((a, b) => a.stateName.localeCompare(b.stateName));

    this.hierarchy = {
      statesByCode,
      statesList,
      countiesByFips,
      totalStates: statesList.length,
      totalCounties: ALL_NATIONWIDE_COUNTIES.length,
      totalCities,
    };

    if (agencies.length > 0) {
      this.mapProvidersToHierarchy(agencies);
    }

    return this.hierarchy;
  }

  /**
   * Map EMS & Fire providers into their corresponding State -> County -> City nodes
   */
  public mapProvidersToHierarchy(agencies: Agency[]): void {
    const h = this.getHierarchy();
    for (const st of h.statesList) {
      for (const co of st.countiesList) {
        for (const ct of co.citiesList) {
          ct.providers = [];
        }
      }
    }

    for (const ag of agencies) {
      const stNode = h.statesByCode[ag.stateCode.toUpperCase()];
      if (!stNode) continue;
      const cClean = ag.county.toLowerCase().trim();
      const cRaw = cClean.replace(/ county| parish| borough/gi, '').trim();
      const coNode = stNode.countiesByName[cClean] || stNode.countiesByName[cRaw];
      if (!coNode) continue;
      const cityKey = ag.city.toLowerCase().trim();
      const ctNode = coNode.citiesByName[cityKey];
      if (ctNode) {
        ctNode.providers.push(ag);
      }
    }
  }

  /**
   * Fetch real-world GeoJSON county boundary polygons for a state (or single county)
   * and attach the polygon geometries to the CountyBoundaryNode hierarchy.
   */
  public async fetchStateCountyBoundaries(stateCode: string): Promise<CountyBoundaryNode[]> {
    const sc = stateCode.toUpperCase().trim();
    const h = this.getHierarchy();
    const stNode = h.statesByCode[sc];
    if (!stNode) return [];

    if (this.stateFeaturesCache.has(sc)) {
      return stNode.countiesList;
    }

    if (this.inFlightStateRequests.has(sc)) {
      await this.inFlightStateRequests.get(sc);
      return stNode.countiesList;
    }

    // A bundled official-boundary GeoJSON is served as a normal public asset.
    // No Google geocoding, proprietary map API, or remote backend lookup.
    const requestPromise = (async () => {
      try {
        const response = await fetch('/data/us-counties-boundaries.json.gz.txt');
        if (!response.ok) throw new Error('Bundled Census boundary asset unavailable');
        const encoded = (await response.text()).trim();
        const binary = Uint8Array.from(atob(encoded), ch => ch.charCodeAt(0));
        const collection = JSON.parse(strFromU8(gunzipSync(binary)));
        const allFeatures: CountyBoundaryGeoJsonFeature[] = Array.isArray(collection.features)
          ? collection.features : [];
        const stateFeatures = allFeatures.filter(f => f.properties?.STATE_CODE === sc);
        this.attachFeaturesToStateNode(stNode, stateFeatures);
        this.stateFeaturesCache.set(sc, stateFeatures);
        return stateFeatures;
      } catch (err) {
        console.error('Official county boundary asset could not be loaded', err);
        return [];
      }
    })();

    this.inFlightStateRequests.set(sc, requestPromise);
    try {
      await requestPromise;
    } finally {
      this.inFlightStateRequests.delete(sc);
    }

    return stNode.countiesList;
  }

  private attachFeaturesToStateNode(stNode: StateHierarchyNode, features: CountyBoundaryGeoJsonFeature[]): void {
    for (const f of features) {
      const fips = String(f.id || f.properties?.GEOID || '').padStart(5, '0');
      const coNode =
        stNode.countiesByFips[fips] ||
        stNode.countiesByName[(f.properties?.COUNTY_NAME || '').toLowerCase()] ||
        stNode.countiesByName[(f.properties?.NAME || '').toLowerCase()];

      if (coNode && f.geometry) {
        coNode.geometry = f.geometry;
        if (f.properties?.CENSUSAREA) {
          coNode.landAreaSqMiles = +Number(f.properties.CENSUSAREA).toFixed(1);
        }
        if (f.properties?.BBOX && Array.isArray(f.properties.BBOX) && f.properties.BBOX.length === 4) {
          coNode.bbox = f.properties.BBOX;
        }
        if (f.properties?.CENTLAT && f.properties?.CENTLON) {
          coNode.centroid = {
            lat: Number(f.properties.CENTLAT),
            lng: Number(f.properties.CENTLON),
          };
        }
      }
    }
  }

  /**
   * Project all county boundary polygons in a State into SVG path strings
   * for interactive choropleth & boundary rendering.
   */
  public projectStateCountiesToSvg(
    stateCode: string,
    width: number = 760,
    height: number = 420,
    padding: number = 24
  ): {
    projectedCounties: SvgProjectedCounty[];
    bbox: [number, number, number, number];
  } {
    const sc = stateCode.toUpperCase().trim();
    const h = this.getHierarchy();
    const stNode = h.statesByCode[sc];
    if (!stNode) return { projectedCounties: [], bbox: [-98, 38, -97, 39] };

    const countiesWithGeom = stNode.countiesList.filter((c) => c.geometry !== null);
    if (countiesWithGeom.length === 0) {
      return { projectedCounties: [], bbox: stNode.bbox };
    }

    // Compute exact bounding box across all county geometries in the state
    // For Alaska ('AK'), clamp positive antimeridian longitudes so mainland + panhandle fill the viewport cleanly
    let minLng = 180,
      minLat = 90,
      maxLng = -180,
      maxLat = -90;

    const normalizeLng = (lng: number) => (sc === 'AK' && lng > 0 ? lng - 360 : lng);

    for (const co of countiesWithGeom) {
      const b = co.bbox;
      const bMinLng = normalizeLng(b[0]);
      const bMaxLng = normalizeLng(b[2]);
      if (bMinLng < minLng) minLng = bMinLng;
      if (bMaxLng > maxLng) maxLng = bMaxLng;
      if (b[1] < minLat) minLat = b[1];
      if (b[3] > maxLat) maxLat = b[3];
    }

    const lngSpan = Math.max(0.05, maxLng - minLng);
    const latSpan = Math.max(0.05, maxLat - minLat);
    const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const adjustedLngSpan = lngSpan * cosLat;

    const availW = width - padding * 2;
    const availH = height - padding * 2;
    const scale = Math.min(availW / adjustedLngSpan, availH / latSpan);

    const drawnW = adjustedLngSpan * scale;
    const drawnH = latSpan * scale;
    const offsetX = padding + (availW - drawnW) / 2;
    const offsetY = padding + (availH - drawnH) / 2;

    const projectPoint = (lng: number, lat: number): [number, number] => {
      const nLng = normalizeLng(lng);
      const x = offsetX + (nLng - minLng) * cosLat * scale;
      const y = offsetY + (maxLat - lat) * scale;
      return [+x.toFixed(1), +y.toFixed(1)];
    };

    const stSummary = ALL_50_STATES_SUMMARIES[sc];
    // CMS Part B Ground Ambulance claims are adjudicated across regional MAC jurisdictions.
    // Standard CMS PUF releases do not publish standalone state-by-state denial tables
    // unless custom FOIA/claims data extraction is performed.
    // If no authenticated state-level CMS PUF dataset meeting all 7 criteria is linked,
    // state denial benchmark is explicitly marked unavailable.
    const hasAuthenticBenchmark = false; // Set to false to prevent uncorroborated benchmarks from masquerading as official CMS PUF
    const stateBenchmark = hasAuthenticBenchmark ? stSummary?.avgMedicareDenialRate : null;

    const projectedCounties: SvgProjectedCounty[] = [];

    for (const co of countiesWithGeom) {
      const svgPath = this.geometryToSvgPath(co.geometry!, projectPoint);
      if (!svgPath) continue;
      const [labelX, labelY] = projectPoint(co.centroid.lng, co.centroid.lat);
      // Factual county rate: null if no measured county rate exists in authoritative CMS PUF record.
      // Never substitute state-level averages into the county's measured rate field!
      const denialRate = co.countyRecord.medicareDenialRatePct !== undefined && co.countyRecord.medicareDenialRatePct !== null
        ? co.countyRecord.medicareDenialRatePct
        : null;

      projectedCounties.push({
        countyFips: co.countyFips,
        countyName: co.countyName,
        countySeat: co.countySeat,
        stateCode: sc,
        landAreaSqMiles: co.landAreaSqMiles,
        citiesCount: co.citiesList.length,
        population: co.countyRecord.population,
        medicareDenialRatePct: denialRate,
        stateBenchmarkDenialRatePct: stateBenchmark,
        medicareDenialSource: denialRate !== null ? (co.countyRecord.medicareDenialSource ?? 'CMS Measured County Rate') : undefined,
        averageTransportMinutes: co.countyRecord.averageTransportMinutes,
        svgPath,
        labelX,
        labelY,
        node: co,
      });
    }

    return {
      projectedCounties,
      bbox: [minLng, minLat, maxLng, maxLat],
    };
  }

  /**
   * Project a single County's real-world boundary polygon AND its mapped real-world Cities
   * into a high-detail SVG viewport.
   */
  public projectSingleCountyBoundaryToSvg(
    countyNode: CountyBoundaryNode,
    agencies: Agency[] = [],
    width: number = 520,
    height: number = 340,
    padding: number = 32
  ): {
    svgPath: string;
    cityPins: SvgProjectedCityPin[];
    centroidSvg: [number, number];
  } {
    const sc = countyNode.stateCode;
    const normalizeLng = (lng: number) => (sc === 'AK' && lng > 0 ? lng - 360 : lng);

    let minLng = normalizeLng(countyNode.bbox[0]);
    let minLat = countyNode.bbox[1];
    let maxLng = normalizeLng(countyNode.bbox[2]);
    let maxLat = countyNode.bbox[3];

    // Also include city coordinates in bounding box if any lie near the boundary edge
    for (const ct of countyNode.citiesList) {
      const cLng = normalizeLng(ct.longitude);
      const cLat = ct.latitude;
      if (Math.abs(cLng - minLng) < 2.5 && Math.abs(cLat - minLat) < 2.5) {
        if (cLng < minLng) minLng = cLng;
        if (cLng > maxLng) maxLng = cLng;
        if (cLat < minLat) minLat = cLat;
        if (cLat > maxLat) maxLat = cLat;
      }
    }

    const lngSpan = Math.max(0.04, maxLng - minLng);
    const latSpan = Math.max(0.04, maxLat - minLat);
    const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const adjustedLngSpan = lngSpan * cosLat;

    const availW = width - padding * 2;
    const availH = height - padding * 2;
    const scale = Math.min(availW / adjustedLngSpan, availH / latSpan);

    const drawnW = adjustedLngSpan * scale;
    const drawnH = latSpan * scale;
    const offsetX = padding + (availW - drawnW) / 2;
    const offsetY = padding + (availH - drawnH) / 2;

    const projectPoint = (lng: number, lat: number): [number, number] => {
      const nLng = normalizeLng(lng);
      const x = Math.max(padding * 0.6, Math.min(width - padding * 0.6, offsetX + (nLng - minLng) * cosLat * scale));
      const y = Math.max(padding * 0.6, Math.min(height - padding * 0.6, offsetY + (maxLat - lat) * scale));
      return [+x.toFixed(1), +y.toFixed(1)];
    };

    const svgPath = countyNode.geometry ? this.geometryToSvgPath(countyNode.geometry, projectPoint) : '';
    const centroidSvg = projectPoint(countyNode.centroid.lng, countyNode.centroid.lat);

    const cityPins: SvgProjectedCityPin[] = countyNode.citiesList.map((ct) => {
      const [svgX, svgY] = projectPoint(ct.longitude, ct.latitude);
      const cityAgencies = territoryEngine.getAgenciesForJurisdiction(
        countyNode.stateCode,
        countyNode.countyName,
        ct.cityName,
        agencies,
        'all'
      );
      return {
        cityName: ct.cityName,
        zipCode: ct.zipCode,
        isCountySeat: ct.isCountySeat,
        latitude: ct.latitude,
        longitude: ct.longitude,
        svgX,
        svgY,
        providersCount: cityAgencies.length,
      };
    });

    return {
      svgPath,
      cityPins,
      centroidSvg,
    };
  }

  private geometryToSvgPath(
    geometry: GeoJsonGeometry,
    projectPoint: (lng: number, lat: number) => [number, number]
  ): string {
    const parts: string[] = [];

    const ringToPath = (ring: number[][]) => {
      if (!ring || ring.length === 0) return;
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        if (!Array.isArray(pt) || pt.length < 2) continue;
        const [x, y] = projectPoint(pt[0], pt[1]);
        parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
      }
      parts.push('Z');
    };

    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates as number[][][];
      for (const ring of rings) {
        ringToPath(ring);
      }
    } else if (geometry.type === 'MultiPolygon') {
      const polys = geometry.coordinates as number[][][][];
      for (const poly of polys) {
        for (const ring of poly) {
          ringToPath(ring);
        }
      }
    }

    return parts.join(' ');
  }
}

export const countyBoundaryHierarchy = new CountyBoundaryHierarchyService();
