/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Agency } from '../types';
import { NATIONAL_ZIP_CITY_REGISTRY, ZipCityRecord } from '../data/nationalZipCityRegistry';
import {
  Compass,
  Navigation,
  MapPin,
  Search,
  Filter,
  Car,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Building2,
  Truck,
  Phone,
  Crosshair,
  SlidersHorizontal,
  Flame,
  Siren,
  ChevronRight
} from 'lucide-react';

interface GpsProximityRadarProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onToggleRoute: (agencyId: string) => void;
  onAddFieldNote?: (agencyId: string, note: any) => void;
  globalState?: string;
  globalCounty?: string;
}

/**
 * Great-circle distance between two GPS coordinates using the Haversine formula (statute miles).
 */
export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 3958.8; // Earth radius in statute miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate driving duration in minutes based on real-world EMS response & arterial highway averages.
 */
export function estimateDriveTimeMinutes(miles: number): number {
  if (miles <= 0) return 0;
  if (miles < 5) return Math.round(miles * 2.2); // ~27 mph urban/station transit
  if (miles < 20) return Math.round(miles * 1.6); // ~37.5 mph suburban
  return Math.round(miles * 1.25); // ~48 mph highway
}

export const GpsProximityRadar: React.FC<GpsProximityRadarProps> = ({
  agencies,
  onSelectAgency,
  onToggleRoute,
  onAddFieldNote,
  globalState,
  globalCounty
}) => {
  // Origin Coordinates State (rep's current location or manual center)
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [originLabel, setOriginLabel] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'preset'>('gps');

  // Manual ZIP/City Center Input State
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [isSearchingCenter, setIsSearchingCenter] = useState<boolean>(false);

  // Filter & Radius Controls
  const [selectedRadiusMiles, setSelectedRadiusMiles] = useState<number>(25);
  const [filterAgingHardwareOnly, setFilterAgingHardwareOnly] = useState<boolean>(false);
  const [filterExpiredWarrantyOnly, setFilterExpiredWarrantyOnly] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'ems' | 'fire'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'score' | 'fleet_age' | 'calls'>('distance');

  // Inline Note State
  const [activeNoteAgencyId, setActiveNoteAgencyId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');

  // Default Territory Center Reference Points (Instant Quick Picks)
  const popularTerritoryHubs = useMemo(
    () => [
      { name: 'Dallas / Fort Worth, TX', lat: 32.7767, lng: -96.797 },
      { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
      { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
      { name: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
      { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
      { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 }
    ],
    []
  );

  // Initialize with browser geolocation or first available territory agency
  const requestCurrentGpsLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setOriginLabel(`Live Device GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setLocationSource('gps');
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation acquisition error:', err.message);
          // Graceful fallback to first agency coordinate or top territory hub
          const fallbackAgency = agencies[0];
          if (fallbackAgency && fallbackAgency.latitude && fallbackAgency.longitude) {
            setOriginCoords({ lat: fallbackAgency.latitude, lng: fallbackAgency.longitude });
            setOriginLabel(`${fallbackAgency.city}, ${fallbackAgency.stateCode} (Territory Center Fallback)`);
          } else {
            setOriginCoords({ lat: popularTerritoryHubs[0].lat, lng: popularTerritoryHubs[0].lng });
            setOriginLabel(popularTerritoryHubs[0].name);
          }
          setLocationSource('manual');
          setLocationError('Device GPS permission unavailable or timed out. Switched to territory center fallback.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      const fallbackAgency = agencies[0];
      if (fallbackAgency && fallbackAgency.latitude && fallbackAgency.longitude) {
        setOriginCoords({ lat: fallbackAgency.latitude, lng: fallbackAgency.longitude });
        setOriginLabel(`${fallbackAgency.city}, ${fallbackAgency.stateCode} (Territory Center)`);
      } else {
        setOriginCoords({ lat: popularTerritoryHubs[0].lat, lng: popularTerritoryHubs[0].lng });
        setOriginLabel(popularTerritoryHubs[0].name);
      }
      setLocationSource('manual');
      setLocationError('Geolocation not supported on this browser/device.');
      setIsLocating(false);
    }
  }, [agencies, popularTerritoryHubs]);

  // Initial trigger
  useEffect(() => {
    requestCurrentGpsLocation();
  }, [requestCurrentGpsLocation]);

  // Handle manual ZIP or City lookup
  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = manualSearchQuery.trim().toLowerCase();
    if (!query) return;

    // Check national zip/city registry
    const isZip = /^\d{5}$/.test(query);
    let matched: ZipCityRecord | undefined;

    if (isZip) {
      matched = NATIONAL_ZIP_CITY_REGISTRY.find((r) => r.zipCode === query);
    } else {
      matched = NATIONAL_ZIP_CITY_REGISTRY.find(
        (r) =>
          r.city.toLowerCase() === query ||
          `${r.city.toLowerCase()}, ${r.stateCode.toLowerCase()}` === query ||
          r.county.toLowerCase().includes(query)
      );
    }

    if (matched) {
      setOriginCoords({ lat: matched.latitude, lng: matched.longitude });
      setOriginLabel(`${matched.city}, ${matched.stateCode} (${matched.zipCode})`);
      setLocationSource('manual');
      setLocationError(null);
      setManualSearchQuery('');
      setIsSearchingCenter(false);
      return;
    }

    // Check agencies directly
    const matchedAgency = agencies.find(
      (a) =>
        a.zipCode === query ||
        a.city.toLowerCase() === query ||
        a.name.toLowerCase().includes(query)
    );

    if (matchedAgency && matchedAgency.latitude && matchedAgency.longitude) {
      setOriginCoords({ lat: matchedAgency.latitude, lng: matchedAgency.longitude });
      setOriginLabel(`${matchedAgency.city}, ${matchedAgency.stateCode} (${matchedAgency.name})`);
      setLocationSource('manual');
      setLocationError(null);
      setManualSearchQuery('');
      setIsSearchingCenter(false);
      return;
    }

    setLocationError(`Could not find coordinate match for "${manualSearchQuery}". Try a 5-digit ZIP or major city.`);
  };

  // Compute distances, filter, and sort
  const proximityResults = useMemo(() => {
    if (!originCoords) return [];

    return agencies
      .map((agency) => {
        const agencyLat = agency.latitude || 32.7767;
        const agencyLng = agency.longitude || -96.797;
        const distanceMiles = haversineDistanceMiles(
          originCoords.lat,
          originCoords.lng,
          agencyLat,
          agencyLng
        );
        const driveMinutes = estimateDriveTimeMinutes(distanceMiles);

        const defibAge = agency.installedFleet?.defibAgeYears || 0;
        const defibBrand = agency.installedFleet?.defibBrand || 'Unknown';
        const isCompetitor =
          !defibBrand.toLowerCase().includes('zoll') &&
          (defibBrand.toLowerCase().includes('lifepak') ||
            defibBrand.toLowerCase().includes('stryker') ||
            defibBrand.toLowerCase().includes('philips') ||
            defibBrand.toLowerCase().includes('medtronic'));
        const isAgingHardware = isCompetitor && defibAge >= 7;
        const isExpiredWarranty =
          agency.installedFleet?.defibWarrantyStatus?.toLowerCase().includes('expired') ||
          agency.installedFleet?.defibWarrantyStatus?.toLowerCase().includes('out of warranty') ||
          agency.competitorContract?.status?.toLowerCase().includes('lapsed') ||
          agency.competitorContract?.status?.toLowerCase().includes('expiring');

        const isFire =
          agency.providerCategory === 'FIRE' ||
          agency.agencyType.toLowerCase().includes('fire');

        return {
          agency,
          distanceMiles: +distanceMiles.toFixed(1),
          driveMinutes,
          isCompetitor,
          isAgingHardware,
          isExpiredWarranty,
          isFire,
          defibAge,
          defibBrand
        };
      })
      .filter((item) => {
        // Radius filter
        if (selectedRadiusMiles > 0 && item.distanceMiles > selectedRadiusMiles) {
          return false;
        }

        // Aging hardware filter
        if (filterAgingHardwareOnly && !item.isAgingHardware) {
          return false;
        }

        // Expired warranty filter
        if (filterExpiredWarrantyOnly && !item.isExpiredWarranty) {
          return false;
        }

        // Category filter
        if (filterCategory === 'ems' && item.isFire) {
          return false;
        }
        if (filterCategory === 'fire' && !item.isFire) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return a.distanceMiles - b.distanceMiles;
        }
        if (sortBy === 'score') {
          return (b.agency.zollOpportunity?.pulseIqScore || 0) - (a.agency.zollOpportunity?.pulseIqScore || 0);
        }
        if (sortBy === 'fleet_age') {
          return b.defibAge - a.defibAge;
        }
        if (sortBy === 'calls') {
          return (b.agency.annual911Transports || 0) - (a.agency.annual911Transports || 0);
        }
        return a.distanceMiles - b.distanceMiles;
      });
  }, [
    agencies,
    originCoords,
    selectedRadiusMiles,
    filterAgingHardwareOnly,
    filterExpiredWarrantyOnly,
    filterCategory,
    sortBy
  ]);

  // Aggregate stats in radius
  const statsInRadius = useMemo(() => {
    const totalCount = proximityResults.length;
    const agingCount = proximityResults.filter((r) => r.isAgingHardware).length;
    const outOfWarrantyCount = proximityResults.filter((r) => r.isExpiredWarranty).length;
    const inRouteCount = proximityResults.filter((r) => r.agency.inDayRoute).length;
    const closestDepartment = proximityResults[0];

    return {
      totalCount,
      agingCount,
      outOfWarrantyCount,
      inRouteCount,
      closestDepartment
    };
  }, [proximityResults]);

  const handleSaveInlineNote = (agencyId: string) => {
    if (!noteContent.trim() || !onAddFieldNote) return;
    onAddFieldNote(agencyId, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Mobility Specialist',
      meetingType: 'Proximity Field Observation',
      notes: noteContent.trim(),
      nextAction: 'Follow up during next station pass',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setNoteContent('');
    setActiveNoteAgencyId(null);
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. HEADER & ACTIVE GPS HUD BANNER
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#285EE8] dark:text-blue-400">
                Field Mobility Command · GPS Proximity Radar
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14283F] dark:text-white flex items-center gap-2 tracking-tight">
              <Compass className="w-6 h-6 text-[#285EE8] dark:text-blue-400" />
              <span>Agencies Near Me (Radius Scanner)</span>
            </h1>
            <p className="text-xs text-[#53657B] dark:text-slate-300 max-w-2xl">
              Real-time Haversine distance engine scanning all EMS providers and Fire Rescue stations from your current field coordinates. Automatically surfaces departments operating aging competitor hardware ({'>'}7 yrs) with expired warranties.
            </p>
          </div>

          {/* Location Origin Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={requestCurrentGpsLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#285EE8] hover:bg-[#194BC8] text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Acquire live device GPS coordinates"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSearchingCenter((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-200 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Enter ZIP / City</span>
            </button>
          </div>
        </div>

        {/* Current Origin Bar */}
        <div className="mt-4 pt-4 border-t border-[#DFE6EF] dark:border-[#1E2D42] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[#53657B] dark:text-slate-400 font-medium">Active Radar Origin: </span>
              <strong className="text-[#14283F] dark:text-white font-semibold truncate">
                {originLabel}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#53657B] dark:text-slate-400">
            <span>Source: <strong className="uppercase font-mono text-[#14283F] dark:text-slate-200">{locationSource}</strong></span>
            <span>·</span>
            <span>Radius: <strong className="text-[#285EE8] dark:text-blue-400">{selectedRadiusMiles} miles</strong></span>
          </div>
        </div>

        {/* Location Error Warning if any */}
        {locationError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-amber-700 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Expandable Manual Search / Preset Pickers */}
        {isSearchingCenter && (
          <div className="mt-4 p-4 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-3">
            <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="Enter 5-digit ZIP Code (e.g. 75201, 78701) or City Name..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0B1320] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-lg text-xs text-[#14283F] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#285EE8]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Set Radar Center
              </button>
            </form>

            {/* Quick Hub Buttons */}
            <div>
              <div className="text-[11px] font-semibold text-[#53657B] dark:text-slate-400 mb-1.5">
                Or jump to major regional territory command centers:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTerritoryHubs.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => {
                      setOriginCoords({ lat: hub.lat, lng: hub.lng });
                      setOriginLabel(hub.name);
                      setLocationSource('preset');
                      setLocationError(null);
                      setIsSearchingCenter(false);
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-[#0B1320] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-300 hover:border-[#285EE8] transition-colors cursor-pointer"
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          2. RADAR STATS & TACTICAL METRICS
         ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-[#53657B] dark:text-slate-400">
            Departments in Radius
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#14283F] dark:text-white mt-1">
            {statsInRadius.totalCount}
          </div>
          <div className="text-[11px] text-[#53657B] dark:text-slate-400 mt-0.5">
            Within {selectedRadiusMiles} statute miles
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Aging Competitor Fleet</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-800 dark:text-amber-300 mt-1">
            {statsInRadius.agingCount}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            LIFEPAK/MRx {'>'} 7 yrs old in radius
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Out of Warranty</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-800 dark:text-rose-300 mt-1">
            {statsInRadius.outOfWarrantyCount}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
            Immediate displacement targets
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-[#285EE8] dark:text-blue-400 flex items-center gap-1">
            <Car className="w-3.5 h-3.5" />
            <span>Scheduled in Route</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#285EE8] dark:text-blue-400 mt-1">
            {statsInRadius.inRouteCount}
          </div>
          <div className="text-[11px] text-[#53657B] dark:text-slate-400 mt-0.5">
            Scheduled for today's itinerary
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. FILTER STRIP & RADIUS TOGGLES
         ==================================================================== */}
      <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Radius Selector */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-semibold text-[#53657B] dark:text-slate-400 shrink-0">
              Scan Radius:
            </span>
            {[5, 10, 15, 25, 50, 100].map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => setSelectedRadiusMiles(radius)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedRadiusMiles === radius
                    ? 'bg-[#285EE8] text-white shadow-2xs'
                    : 'bg-[#F5F7FA] dark:bg-[#16243A] text-[#53657B] dark:text-slate-300 hover:bg-[#EEF3FE] dark:hover:bg-slate-800'
                }`}
              >
                {radius} mi
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedRadiusMiles(9999)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedRadiusMiles === 9999
                  ? 'bg-[#285EE8] text-white shadow-2xs'
                  : 'bg-[#F5F7FA] dark:bg-[#16243A] text-[#53657B] dark:text-slate-300 hover:bg-[#EEF3FE] dark:hover:bg-slate-800'
              }`}
            >
              All Territory
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterAgingHardwareOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                filterAgingHardwareOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#F5F7FA] dark:bg-[#16243A] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Aging Hardware ({'>'}7 yrs)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterExpiredWarrantyOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                filterExpiredWarrantyOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#F5F7FA] dark:bg-[#16243A] text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Warranty</span>
            </button>

            {/* Provider Discipline */}
            <div className="inline-flex rounded-lg border border-[#DFE6EF] dark:border-[#1E2D42] p-0.5 bg-[#F5F7FA] dark:bg-[#16243A]">
              {(['all', 'ems', 'fire'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-white dark:bg-[#0B1320] text-[#14283F] dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-[#14283F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="distance">Sort: Closest Distance</option>
              <option value="score">Sort: Highest PulseIQ Score</option>
              <option value="fleet_age">Sort: Oldest Hardware Fleet</option>
              <option value="calls">Sort: Highest 911 Volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. PROXIMITY RADAR CARDS LIST
         ==================================================================== */}
      <div className="space-y-3">
        {proximityResults.length > 0 ? (
          proximityResults.map(({ agency, distanceMiles, driveMinutes, isAgingHardware, isExpiredWarranty, isFire, defibAge, defibBrand }) => {
            const chiefContact = agency.keyContacts.find((c) => c.role.toLowerCase().includes('chief')) || agency.keyContacts[0];
            const inRoute = agency.inDayRoute;
            const isNoteOpen = activeNoteAgencyId === agency.id;
            const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${agency.name}, ${agency.address}`)}`;

            return (
              <div
                key={agency.id}
                className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#285EE8]/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Agency Title & Distance Pill */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Distance & Drive Time Badge */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono tabular-nums bg-[#EEF3FE] dark:bg-blue-950/60 text-[#285EE8] dark:text-blue-400 border border-[#285EE8]/20">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{distanceMiles} mi</span>
                        <span className="text-[#53657B] dark:text-slate-400 font-normal">· ~{driveMinutes} min drive</span>
                      </span>

                      {/* Discipline Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isFire
                          ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200'
                      }`}>
                        {isFire ? <Flame className="w-3 h-3" /> : <Siren className="w-3 h-3" />}
                        <span>{isFire ? 'Fire Rescue' : 'EMS Provider'}</span>
                      </span>

                      {/* Aging Competitor Hardware Callout */}
                      {isAgingHardware && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Aging {defibBrand} ({defibAge} yrs)</span>
                        </span>
                      )}

                      {/* Expired Warranty Callout */}
                      {isExpiredWarranty && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Warranty Expired / Lapsed</span>
                        </span>
                      )}
                    </div>

                    <h2
                      onClick={() => onSelectAgency(agency)}
                      className="text-base sm:text-lg font-bold text-[#14283F] dark:text-white hover:text-[#285EE8] cursor-pointer transition-colors"
                    >
                      {agency.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#53657B] dark:text-slate-400">
                      <span>{agency.address}, {agency.city}, {agency.stateCode} {agency.zipCode}</span>
                      <span>·</span>
                      <span>NPI: <strong className="font-mono text-[11px]">{agency.npiNumber || 'Unrecorded'}</strong></span>
                      {chiefContact && (
                        <>
                          <span>·</span>
                          <span>Command: <strong className="text-[#14283F] dark:text-slate-200">{chiefContact.name} ({chiefContact.title})</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleRoute(agency.id)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        inRoute
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-200 hover:bg-[#EEF3FE]'
                      }`}
                      title="Add or remove from today's field route"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>{inRoute ? 'Scheduled in Route' : '+ Add to Route'}</span>
                    </button>

                    <a
                      href={googleNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#285EE8] hover:bg-[#194BC8] text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Launch turn-by-turn navigation in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveNoteAgencyId(isNoteOpen ? null : agency.id)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] text-[#14283F] dark:text-slate-200 hover:bg-[#F5F7FA] cursor-pointer"
                    >
                      {isNoteOpen ? 'Cancel Note' : 'Add Note'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAgency(agency)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1728] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                    >
                      Account 360 &rarr;
                    </button>
                  </div>
                </div>

                {/* Fleet Breakdown & Acuity Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#DFE6EF] dark:border-[#1E2D42] text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Frontline Monitor Fleet</span>
                    <strong className="text-[#14283F] dark:text-slate-100">
                      {agency.installedFleet.defibUnitsCount}x {agency.installedFleet.defibBrand}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Annual 911 Transports</span>
                    <strong className="text-[#14283F] dark:text-slate-100 font-mono tabular-nums">
                      {(agency.annual911Transports || 0).toLocaleString()} runs/yr
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Recorded ePCR &amp; CAD</span>
                    <strong className="text-[#14283F] dark:text-slate-100">
                      {agency.installedFleet.epcrCadSoftware}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">PulseIQ Score</span>
                    <strong className="text-[#285EE8] dark:text-blue-400 font-mono font-bold">
                      {agency.zollOpportunity.pulseIqScore} / 100
                    </strong>
                  </div>
                </div>

                {/* Inline Quick Field Note Input */}
                {isNoteOpen && (
                  <div className="mt-2 p-3.5 rounded-xl bg-[#F5F7FA] dark:bg-[#16243A] border border-[#DFE6EF] dark:border-[#1E2D42] space-y-2">
                    <div className="text-xs font-semibold text-[#14283F] dark:text-white">
                      Field Note for {agency.name}:
                    </div>
                    <textarea
                      rows={2}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Observed LIFEPAK 15 unit in bay with cracked housing. Chief mentioned frustration with repair costs..."
                      className="w-full p-2.5 bg-white dark:bg-[#0B1320] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-lg text-xs text-[#14283F] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#285EE8]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveNoteAgencyId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveInlineNote(agency.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#285EE8] text-white hover:bg-[#194BC8] cursor-pointer shadow-2xs"
                      >
                        Save Field Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] rounded-2xl p-10 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-[#14283F] dark:text-white">
              No departments found within {selectedRadiusMiles} miles
            </h3>
            <p className="text-xs text-[#53657B] dark:text-slate-400 max-w-md mx-auto">
              Try expanding your scanning radius to 50 or 100 miles, or enter a different ZIP code or city center.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRadiusMiles(50)}
                className="px-3.5 py-2 bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Expand Radius to 50 Miles
              </button>
              <button
                type="button"
                onClick={() => setSelectedRadiusMiles(9999)}
                className="px-3.5 py-2 bg-[#F5F7FA] dark:bg-[#16243A] text-[#14283F] dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Show All in Territory
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
