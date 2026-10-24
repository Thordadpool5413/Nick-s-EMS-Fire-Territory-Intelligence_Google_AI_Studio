/**
 * Losslessly compress public nationwide geography while retaining the same exports.
 * Original human-readable data remains available in Git history / main branch.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const marker = '/* PACKED_GEO_DATA_V1 */';
const countyPath = 'src/data/allCountiesDatabase.ts';
const citiesPath = 'src/data/allCitiesDatabase.ts';
const countiesSource = readFileSync(countyPath, 'utf8');
const citiesSource = readFileSync(citiesPath, 'utf8');

function readConstantJson(source, name) {
  const declarationIndex = source.indexOf('export const ' + name);
  if (declarationIndex < 0) throw new Error('Missing data export ' + name);
  const equalsIndex = source.indexOf(' = ', declarationIndex);
  if (equalsIndex < 0) throw new Error('Missing data initializer for ' + name);
  const start = source.slice(equalsIndex + 3).search(/[\[{]/) + equalsIndex + 3;
  const stack = [];
  let quoted = false;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === '[') stack.push(']');
    else if (ch === '{') stack.push('}');
    else if (ch === ']' || ch === '}') {
      if (stack.pop() !== ch) throw new Error('Malformed data structure near ' + name);
      if (!stack.length) return JSON.parse(source.slice(start, i + 1));
    }
  }
  throw new Error('Unterminated JSON initializer for ' + name);
}
const packed = data => gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 }).toString('base64');
if (countiesSource.includes(marker) || citiesSource.includes(marker)) {
  console.log('Geography module compression already applied; no second compression');
  process.exit(0);
}
const counties = readConstantJson(countiesSource, 'ALL_NATIONWIDE_COUNTIES');
const metadata = readConstantJson(citiesSource, 'STATE_GEO_AND_AREA_CODES');
const cities = readConstantJson(citiesSource, 'CITIES_BY_STATE_AND_COUNTY');
const stateCities = readConstantJson(citiesSource, 'ALL_CITIES_BY_STATE');
if (!Array.isArray(counties) || counties.length < 3000 ||
  Object.keys(metadata).length < 50 || Object.keys(cities).length < 50) {
  throw new Error('Nationwide geographic records failed lossless validation');
}
const countyBlob = packed(counties);
const cityBlob = packed({ metadata, cities, stateCities });
const countyModule = [
  marker,
  'import type { CountyHealthRecord } from \'../types\';',
  'import { gunzipSync, strFromU8 } from \'fflate\';',
  'export interface CityBoundaryRecord { name: string; zipCode: string; latitude: number; longitude: number; isCountySeat: boolean; }',
  'export interface ComprehensiveCountyRecord extends CountyHealthRecord { rawName: string; stateFips: string; centroidLat: number; centroidLng: number; bbox: [number,number,number,number]; landAreaSqMiles: number; cities: string[]; cityRecords?: CityBoundaryRecord[]; }',
  'const compressed = ' + JSON.stringify(countyBlob) + ';',
  'const decoded = Uint8Array.from(atob(compressed), c => c.charCodeAt(0));',
  'export const ALL_NATIONWIDE_COUNTIES: ComprehensiveCountyRecord[] = JSON.parse(strFromU8(gunzipSync(decoded)));',
  ''
].join('\n');
const cityModule = [
  marker,
  'import { gunzipSync, strFromU8 } from \'fflate\';',
  'export interface StateGeoAndAreaCodeInfo { lat: number; lng: number; areaCodes: string[]; domain: string; }',
  'const compressed = ' + JSON.stringify(cityBlob) + ';',
  'const decoded = Uint8Array.from(atob(compressed), c => c.charCodeAt(0));',
  'const data = JSON.parse(strFromU8(gunzipSync(decoded)));',
  'export const STATE_GEO_AND_AREA_CODES: Record<string, StateGeoAndAreaCodeInfo> = data.metadata;',
  'export const CITIES_BY_STATE_AND_COUNTY: Record<string, Record<string, string[]>> = data.cities;',
  'export const ALL_CITIES_BY_STATE: Record<string, string[]> = data.stateCities;',
  ''
].join('\n');
const geoRaw = readFileSync('public/data/us-counties-boundaries.json', 'utf8');
const geoData = JSON.parse(geoRaw);
if (!Array.isArray(geoData.features) || geoData.features.length < 3000) {
  throw new Error('Expected full public US Census boundary feature collection');
}
const geoBlob = packed(geoData);
writeFileSync(countyPath, countyModule);
writeFileSync(citiesPath, cityModule);
writeFileSync('public/data/us-counties-boundaries.json.gz.txt', geoBlob);
console.log('Lossless geography packed', {
  counties: counties.length, states: Object.keys(metadata).length, stateCityGroups: Object.keys(cities).length,
  geoFeatures: geoData.features.length,
  oldBytes: countiesSource.length + citiesSource.length + geoRaw.length,
  newBytes: countyModule.length + cityModule.length + geoBlob.length
});
