/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Source: Google Maps Platform Code Assist
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useMap,
  MapControl,
  ControlPosition
} from '@vis.gl/react-google-maps';
import { Agency, PriorityTier } from '../types';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Filter, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Siren, 
  Car, 
  ShieldCheck, 
  Key, 
  Info, 
  X, 
  Compass,
  Building2,
  Phone,
  FileText,
  LocateFixed,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { territoryEngine } from '../services/territoryIntelligenceEngine';

interface GoogleMapsTerritoryExplorerProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onToggleRoute?: (agencyId: string) => void;
  onOpenRfpGenerator?: (agency: Agency) => void;
  onOpenDataLineage?: (agency: Agency) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
  onSelectState?: (state: string) => void;
  onSelectCounty?: (county: string) => void;
  onSelectCity?: (city: string) => void;
  onSelectCategory?: (category: 'all' | 'ems' | 'fire') => void;
  onSwitchToTacticalGis?: () => void;
}

const TIER_COLORS: Record<PriorityTier, { bg: string; border: string; glyph: string; badge: string }> = {
  'Critical Opportunity': {
    bg: '#DC2626',
    border: '#991B1B',
    glyph: '#FFFFFF',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
  },
  'High Value': {
    bg: '#D97706',
    border: '#B45309',
    glyph: '#FFFFFF',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  'Mid-Term Pipeline': {
    bg: '#2563EB',
    border: '#1E3A8A',
    glyph: '#FFFFFF',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  'Maintained Account': {
    bg: '#475569',
    border: '#1E293B',
    glyph: '#FFFFFF',
    badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
};

// Accurate Haversine Distance Calculation (in Statute Miles)
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface RecenterControlProps {
  userLocation: { lat: number; lng: number } | null;
  isPermissionGranted: boolean;
  onRecenter?: () => void;
}

const RecenterControl: React.FC<RecenterControlProps> = ({ userLocation, isPermissionGranted, onRecenter }) => {
  const map = useMap();

  const handleRecenter = () => {
    if (userLocation && map) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(11);
    }
    if (onRecenter) {
      onRecenter();
    }
  };

  if (!isPermissionGranted || !userLocation) return null;

  return (
    <MapControl position={ControlPosition.RIGHT_BOTTOM}>
      <div className="m-3">
        <button
          type="button"
          onClick={handleRecenter}
          className="h-10 px-3.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          title="Recenter map to your current location"
        >
          <LocateFixed className="w-4 h-4 text-[#285EE8]" />
          <span>Recenter to Location</span>
        </button>
      </div>
    </MapControl>
  );
};

export const GoogleMapsTerritoryExplorer: React.FC<GoogleMapsTerritoryExplorerProps> = ({
  agencies,
  onSelectAgency,
  onToggleRoute,
  onOpenRfpGenerator,
  onOpenDataLineage,
  globalState = 'all',
  globalCounty = 'all',
  globalCity = 'all',
  globalCategory = 'all',
  activeAccount,
  onSelectState,
  onSelectCounty,
  onSelectCity,
  onSelectCategory,
  onSwitchToTacticalGis
}) => {
  // Resolve Google Maps API Key from environment or localStorage
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const [storedKey, setStoredKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gmp_api_key') || '';
    } catch {
      return '';
    }
  });

  const activeApiKey = envKey || storedKey;
  const [keyInputDraft, setKeyInputDraft] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Territory Selection Form State for Map Building (Anti-Crash Gateway)
  const [targetState, setTargetState] = useState<string>(globalState !== 'all' ? globalState : 'IL');
  const [targetCounty, setTargetCounty] = useState<string>(globalCounty !== 'all' ? globalCounty : 'all');

  // Geolocation / Near Me State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(() => {
    // Start locating automatically unless an account or explicit county is already provided
    return !activeAccount && (globalState === 'all' || globalCounty === 'all');
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState<boolean>(false);
  const [nearMeRadiusMiles, setNearMeRadiusMiles] = useState<number>(25);

  // Manual Map Building Trigger (Crash Prevention: Do NOT load national view by default)
  const [hasUserBuiltMap, setHasUserBuiltMap] = useState<boolean>(() => {
    // If a specific state & county is already selected or an account is active, allow building immediately
    return Boolean(activeAccount) || (globalState !== 'all' && globalCounty !== 'all');
  });

  // Query browser geolocation permission status
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setIsPermissionGranted(result.state === 'granted');
        result.onchange = () => {
          setIsPermissionGranted(result.state === 'granted');
        };
      }).catch(() => {
        // Fallback for browsers that do not support permission query for geolocation
      });
    }
  }, []);

  // Filters & Map Display Settings
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedAgencyForInfo, setSelectedAgencyForInfo] = useState<Agency | null>(null);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [showNearbyDrawer, setShowNearbyDrawer] = useState<boolean>(true);

  // Available counties for currently targeted state
  const countiesInTargetState = useMemo(() => {
    if (!targetState || targetState === 'all') return [];
    return territoryEngine.getCountiesForState(targetState.toUpperCase()).map(c => c.countyName).sort();
  }, [targetState]);

  // Synchronize when parent props change
  useEffect(() => {
    if (globalState && globalState !== 'all' && globalState !== targetState) {
      setTargetState(globalState);
    }
    if (globalCounty && globalCounty !== 'all' && globalCounty !== targetCounty) {
      setTargetCounty(globalCounty);
    }
    if (activeAccount || (globalState !== 'all' && globalCounty !== 'all')) {
      setHasUserBuiltMap(true);
    }
  }, [globalState, globalCounty, activeAccount]);

  // Handle GPS Current Location Request
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser or device. Please select your State & County below.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setIsPermissionGranted(true);
        setIsLocating(false);
        setIsNearMeActive(true);
        setNearMeRadiusMiles(25);
        setHasUserBuiltMap(true); // Allow map to build safely focused on user's 25-mile radius
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          setIsPermissionGranted(false);
          msg = 'Location permission was denied. Please select your State & County below to build the map.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please select your State & County below to build the map.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please select your State & County below to build the map.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000
      }
    );
  }, []);

  // Recenter map to current user coordinates
  const handleRecenterToLocation = useCallback(() => {
    if (userLocation) {
      setIsNearMeActive(true);
      setNearMeRadiusMiles(25);
      setHasUserBuiltMap(true);
    } else {
      handleUseCurrentLocation();
    }
  }, [userLocation, handleUseCurrentLocation]);

  // Automatically request user geolocation on load
  useEffect(() => {
    if (activeAccount || (globalState !== 'all' && globalCounty !== 'all')) {
      setIsLocating(false);
      return;
    }
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation, activeAccount, globalState, globalCounty]);

  // Filtered agencies based on State/County OR Near Me location
  const filteredAgencies = useMemo(() => {
    let pool = agencies.filter((agency) => {
      // Must have valid coordinates
      return typeof agency.latitude === 'number' && !isNaN(agency.latitude) && 
             typeof agency.longitude === 'number' && !isNaN(agency.longitude);
    });

    // 1. Discipline Filter (All / EMS / Fire)
    if (globalCategory === 'fire') {
      pool = pool.filter(a => a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire') || a.name.toLowerCase().includes('fire'));
    } else if (globalCategory === 'ems') {
      pool = pool.filter(a => !(a.providerCategory === 'FIRE' || a.agencyType.toLowerCase().includes('fire')));
    }

    // 2. Near Me Geolocation Mode
    if (isNearMeActive && userLocation) {
      pool = pool.map(agency => {
        const dist = calculateDistanceMiles(userLocation.lat, userLocation.lng, agency.latitude, agency.longitude);
        return { agency, dist };
      })
      .filter(item => item.dist <= nearMeRadiusMiles)
      .sort((a, b) => a.dist - b.dist)
      .map(item => item.agency);
    } else {
      // 3. State & County Mode (Anti-Crash Filter)
      if (globalState && globalState !== 'all') {
        pool = pool.filter(a => (a.stateCode || '').trim().toUpperCase() === globalState.trim().toUpperCase());
      }
      if (globalCounty && globalCounty !== 'all') {
        pool = pool.filter(a => (a.county || '').trim().toLowerCase().includes(globalCounty.trim().toLowerCase()));
      }
      if (globalCity && globalCity !== 'all') {
        pool = pool.filter(a => (a.city || '').trim().toLowerCase().includes(globalCity.trim().toLowerCase()));
      }
    }

    // 4. Priority Tier Filter
    if (selectedTier !== 'all') {
      pool = pool.filter(a => a.zollOpportunity?.priorityTier === selectedTier);
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pool = pool.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.county.toLowerCase().includes(q) ||
        a.fdid.toLowerCase().includes(q) ||
        (a.zipCode && a.zipCode.includes(q))
      );
    }

    // 6. Safe Marker Ceiling (Guards mobile memory & WebGL from crashing)
    // Limits simultaneously rendered map markers to top 150 prioritized records
    return pool.slice(0, 150);
  }, [agencies, globalCategory, isNearMeActive, userLocation, nearMeRadiusMiles, globalState, globalCounty, globalCity, selectedTier, searchQuery]);

  // Compute map center and zoom
  const mapCenter = useMemo(() => {
    if (isNearMeActive && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    if (activeAccount && activeAccount.latitude && activeAccount.longitude) {
      return { lat: activeAccount.latitude, lng: activeAccount.longitude };
    }
    if (filteredAgencies.length > 0) {
      const avgLat = filteredAgencies.reduce((acc, a) => acc + a.latitude, 0) / filteredAgencies.length;
      const avgLng = filteredAgencies.reduce((acc, a) => acc + a.longitude, 0) / filteredAgencies.length;
      return { lat: avgLat, lng: avgLng };
    }
    // Default territory centroid (e.g. Illinois or Midwest)
    return { lat: 40.0, lng: -89.0 };
  }, [isNearMeActive, userLocation, activeAccount, filteredAgencies]);

  const mapZoom = useMemo(() => {
    if (isNearMeActive) {
      return nearMeRadiusMiles <= 15 ? 12 : nearMeRadiusMiles <= 25 ? 11 : 10;
    }
    if (activeAccount) return 13;
    if (globalCity !== 'all') return 12;
    if (globalCounty !== 'all') return 10;
    if (globalState !== 'all') return 8;
    return 8;
  }, [isNearMeActive, nearMeRadiusMiles, activeAccount, globalCity, globalCounty, globalState]);

  // Build Map Handler for User Selection
  const handleBuildMap = () => {
    if (onSelectState) onSelectState(targetState);
    if (onSelectCounty) onSelectCounty(targetCounty);
    setIsNearMeActive(false);
    setHasUserBuiltMap(true);
  };

  const handleResetToLauncher = () => {
    setHasUserBuiltMap(false);
    setIsNearMeActive(false);
    setSelectedAgencyForInfo(null);
  };

  const handleSaveCustomKey = () => {
    if (keyInputDraft.trim()) {
      try {
        localStorage.setItem('gmp_api_key', keyInputDraft.trim());
        setStoredKey(keyInputDraft.trim());
        setShowKeyModal(false);
      } catch (e) {
        console.error('Failed to save Google Maps key:', e);
      }
    }
  };

  return (
    <div className="workspace-view-container min-w-0 w-full space-y-4">
      
      {/* ====================================================================
          TOP TOOLBAR / NAVIGATION STRIP
         ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isNearMeActive ? 'bg-emerald-500 animate-ping' : 'bg-[#285EE8] animate-pulse'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-[#285EE8] dark:text-blue-400">
                {isNearMeActive ? 'Live GPS Location Active' : 'Targeted Territory Explorer'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Google Maps Platform
              </span>
            </div>
            
            <h1 className="text-lg sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight mt-1">
              {isNearMeActive 
                ? `Providers Near Your Location (${nearMeRadiusMiles} mi radius)` 
                : hasUserBuiltMap && globalCounty !== 'all'
                  ? `${globalCounty} County, ${globalState} Live Map`
                  : 'Google Maps Live Territory Explorer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              High-resolution satellite imagery, street topography, station locations, and real-time field proximity.
            </p>
          </div>

          {/* Quick Actions (Location, Change Territory, Tactical GIS) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* GPS "Near Me" Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isNearMeActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-400/30'
                  : 'bg-[#285EE8] text-white hover:bg-[#194BC8]'
              }`}
              title="Use current GPS location to find nearest EMS and Fire stations"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating GPS...' : isNearMeActive ? 'GPS Active (Near Me)' : 'Use My Location'}</span>
            </button>

            {/* Recenter to Location Control (Visible if permission granted and location known) */}
            {isPermissionGranted && userLocation && (
              <button
                type="button"
                onClick={handleRecenterToLocation}
                className="h-9 px-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Recenter map directly to your detected location"
              >
                <LocateFixed className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Recenter to Location</span>
              </button>
            )}

            {/* Change Territory Button */}
            {hasUserBuiltMap && (
              <button
                type="button"
                onClick={handleResetToLauncher}
                className="h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Change active county or select different state"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Change Territory</span>
              </button>
            )}

            {/* Tactical GIS Switcher */}
            {onSwitchToTacticalGis && (
              <button
                type="button"
                onClick={onSwitchToTacticalGis}
                className="h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Switch to Tactical Hex GIS Heatmap"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Tactical GIS</span>
              </button>
            )}

            {/* API Key Modal */}
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Configure Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Location Error Notice */}
        {locationError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </span>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-amber-700 hover:text-amber-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
          GATEWAY STATE: PREVENT NATIONAL CRASH
          Auto-request geolocation on load to zoom to 25-mile radius.
          If locating or user has not selected a state/county, prevent national
          map from mounting to ensure 60 FPS mobile speed and stability!
         ==================================================================== */}
      {isLocating && !hasUserBuiltMap && !isNearMeActive ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 shadow-md text-center max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#285EE8] dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
            <Radio className="w-8 h-8 animate-pulse text-[#285EE8]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              Locating Providers Near You
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Requesting GPS position to zoom directly to EMS agencies and Fire stations within a 25-mile radius...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Awaiting device location response</span>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLocating(false);
                setHasUserBuiltMap(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer transition-colors"
            >
              Or Choose State &amp; County Manually &rarr;
            </button>
          </div>
        </div>
      ) : !hasUserBuiltMap && !isNearMeActive ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-md text-center max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#285EE8] dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              Launch Live Google Maps Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Google Maps zooms directly to your local 25-mile radius or targeted county. National rendering of thousands of markers is disabled to guarantee 60 FPS mobile speed and prevent WebGL memory crashes.
            </p>
          </div>

          {/* Option A: Fast 1-Tap "Near Me" GPS Geolocation */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 text-left space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <LocateFixed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Use My Current Location
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Find and plot EMS agencies and Fire departments near you in real time
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="h-11 px-5 rounded-xl bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-2"
              >
                <span>{isLocating ? 'Locating...' : 'Locate Near Me'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>Or Select State &amp; County</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Option B: State & County Selection Form */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left space-y-4">
            
            {/* Quick State Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Popular Territories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'IL', name: 'Illinois' },
                  { code: 'TX', name: 'Texas' },
                  { code: 'FL', name: 'Florida' },
                  { code: 'CA', name: 'California' },
                  { code: 'OH', name: 'Ohio' },
                  { code: 'PA', name: 'Pennsylvania' }
                ].map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => {
                      setTargetState(st.code);
                      setTargetCounty('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      targetState === st.code
                        ? 'bg-[#285EE8] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-[#285EE8]'
                    }`}
                  >
                    {st.name} ({st.code})
                  </button>
                ))}
              </div>
            </div>

            {/* State & County Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target State
                </label>
                <select
                  value={targetState}
                  onChange={(e) => {
                    setTargetState(e.target.value);
                    setTargetCounty('all');
                  }}
                  className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-[#285EE8]"
                >
                  {Object.entries(ALL_50_STATES_SUMMARIES)
                    .sort((a, b) => a[1].state.localeCompare(b[1].state))
                    .map(([code, s]) => (
                      <option key={code} value={code}>
                        {s.state} ({code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target County
                </label>
                <select
                  value={targetCounty}
                  onChange={(e) => setTargetCounty(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-[#285EE8]"
                >
                  <option value="all">All Counties in {targetState}</option>
                  {countiesInTargetState.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuildMap}
              className="w-full h-12 rounded-xl bg-slate-900 dark:bg-[#285EE8] hover:bg-slate-800 dark:hover:bg-[#194BC8] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-2"
            >
              <span>Build Live Google Map for {targetCounty !== 'all' ? `${targetCounty} County, ` : ''}{targetState}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : (
        /* ====================================================================
            LIVE MAP WORKSPACE (State/County or Near Me Active)
           ==================================================================== */
        <div className="space-y-4">
          
          {/* Map Controls Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Discipline Switcher */}
              {onSelectCategory && (
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      globalCategory === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Providers
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('ems')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      globalCategory === 'ems'
                        ? 'bg-[#285EE8] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Siren className="w-3.5 h-3.5" />
                    <span>EMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('fire')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      globalCategory === 'fire'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Fire</span>
                  </button>
                </div>
              )}

              {/* Radius Filter for Near Me Mode */}
              {isNearMeActive && (
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Radius:</span>
                  {[15, 25, 50].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNearMeRadiusMiles(r)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        nearMeRadiusMiles === r
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                      }`}
                    >
                      {r} mi
                    </button>
                  ))}
                </div>
              )}

              {/* Map Type Switcher */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setMapTypeId('roadmap')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    mapTypeId === 'roadmap' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setMapTypeId('satellite')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    mapTypeId === 'satellite' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapTypeId('terrain')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    mapTypeId === 'terrain' ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Terrain
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Plotting <strong className="text-slate-900 dark:text-white font-semibold">{filteredAgencies.length}</strong> active stations
              </span>
              <button
                type="button"
                onClick={() => setShowNearbyDrawer(prev => !prev)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                {showNearbyDrawer ? 'Hide Station List' : 'Show Station List'}
              </button>
            </div>
          </div>

          {/* Interactive Google Map Canvas */}
          <div className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            {activeApiKey ? (
              <APIProvider apiKey={activeApiKey} libraries={['marker', 'routes']}>
                <Map
                  mapId="DEMO_MAP_ID"
                  center={mapCenter}
                  zoom={mapZoom}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  mapTypeId={mapTypeId}
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  {/* User GPS Pin (Near Me Mode) */}
                  {isNearMeActive && userLocation && (
                    <AdvancedMarker
                      position={{ lat: userLocation.lat, lng: userLocation.lng }}
                      title="Your Current Location"
                      zIndex={1000}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                        <span className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                          <LocateFixed className="w-3 h-3" />
                        </span>
                      </div>
                    </AdvancedMarker>
                  )}

                  {/* Native On-Map Recenter to Location Control */}
                  <RecenterControl
                    userLocation={userLocation}
                    isPermissionGranted={isPermissionGranted}
                    onRecenter={handleRecenterToLocation}
                  />

                  {/* Plotted Local Station Markers */}
                  {filteredAgencies.map((agency) => {
                    const tier = agency.zollOpportunity?.priorityTier || 'Maintained Account';
                    const tierStyle = TIER_COLORS[tier] || TIER_COLORS['Maintained Account'];
                    const isSelected = selectedAgencyForInfo?.id === agency.id;

                    return (
                      <AdvancedMarker
                        key={agency.id}
                        position={{ lat: agency.latitude, lng: agency.longitude }}
                        title={`${agency.name} (FDID: ${agency.fdid})`}
                        onClick={() => {
                          setSelectedAgencyForInfo(agency);
                          onSelectAgency(agency);
                        }}
                        zIndex={isSelected ? 999 : tier === 'Critical Opportunity' ? 500 : 100}
                      >
                        <Pin
                          background={tierStyle.bg}
                          borderColor={tierStyle.border}
                          glyphColor={tierStyle.glyph}
                          scale={isSelected ? 1.3 : 1.0}
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {/* Station InfoWindow Popup */}
                  {selectedAgencyForInfo && (() => {
                    const infoTier = selectedAgencyForInfo.zollOpportunity?.priorityTier || 'Maintained Account';
                    const infoScore = selectedAgencyForInfo.zollOpportunity?.pulseIqScore ?? 0;
                    const infoDefibBrand = selectedAgencyForInfo.installedFleet?.defibBrand || 'Frontline Defibrillators';
                    const infoDefibAge = selectedAgencyForInfo.installedFleet?.defibAgeYears ?? 0;
                    const infoMedicare = selectedAgencyForInfo.cmsData?.medicareAllowedAnnual ?? 0;
                    const distFromUser = userLocation 
                      ? calculateDistanceMiles(userLocation.lat, userLocation.lng, selectedAgencyForInfo.latitude, selectedAgencyForInfo.longitude)
                      : null;

                    return (
                      <InfoWindow
                        position={{ 
                          lat: selectedAgencyForInfo.latitude, 
                          lng: selectedAgencyForInfo.longitude 
                        }}
                        onCloseClick={() => setSelectedAgencyForInfo(null)}
                      >
                        <div className="p-1 max-w-xs sm:max-w-sm text-slate-900 font-sans">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                            <div>
                              <span className="text-[11px] font-semibold text-blue-700">
                                {selectedAgencyForInfo.stateCode} · FDID {selectedAgencyForInfo.fdid}
                                {distFromUser !== null && ` · ${distFromUser} mi away`}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                {selectedAgencyForInfo.name}
                              </h4>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              TIER_COLORS[infoTier]?.badge || 'bg-slate-100 text-slate-800'
                            }`}>
                              {infoTier}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs mb-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block">PulseIQ score</span>
                              <span className="font-semibold text-blue-700 text-sm tabular-nums">
                                {infoScore} / 100
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block">Primary fleet</span>
                              <span className="font-semibold text-slate-800 text-xs">
                                {infoDefibBrand} ({infoDefibAge} yrs)
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block">Medicare volume</span>
                              <span className="font-semibold text-emerald-700 text-xs tabular-nums">
                                {formatCurrency(infoMedicare, { perYear: true })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block">Jurisdiction</span>
                              <span className="text-slate-700 text-xs font-medium truncate block">
                                {selectedAgencyForInfo.county} County
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectAgency(selectedAgencyForInfo)}
                              className="flex-1 py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Account 360</span>
                            </button>

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedAgencyForInfo.name}, ${selectedAgencyForInfo.address}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Turn-by-turn driving directions in Google Maps"
                            >
                              <Navigation className="w-3 h-3 text-blue-600" />
                              <span>Directions</span>
                            </a>
                          </div>
                        </div>
                      </InfoWindow>
                    );
                  })()}
                </Map>
              </APIProvider>
            ) : (
              /* API Key Required Fallback */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Enable Google Maps Platform</h3>
                <p className="text-xs text-slate-400 max-w-sm">Enter your Google Maps API key to activate live vector markers and satellite rendering.</p>
                <div className="flex gap-2 max-w-sm w-full">
                  <input
                    type="password"
                    value={keyInputDraft}
                    onChange={(e) => setKeyInputDraft(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                  <button
                    onClick={handleSaveCustomKey}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Nearby Stations List Sheet (Mobile Friendly) */}
          {showNearbyDrawer && filteredAgencies.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Local Stations in Scope ({filteredAgencies.length})</span>
                </span>
                <span className="text-xs text-slate-500">Tap to inspect &amp; open</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredAgencies.map((agency) => {
                  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
                  const dist = userLocation 
                    ? calculateDistanceMiles(userLocation.lat, userLocation.lng, agency.latitude, agency.longitude)
                    : null;

                  return (
                    <div
                      key={agency.id}
                      onClick={() => {
                        setSelectedAgencyForInfo(agency);
                        onSelectAgency(agency);
                      }}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-[#285EE8] transition-colors cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded mb-1 ${
                            isFire ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {isFire ? <Flame className="w-2.5 h-2.5" /> : <Siren className="w-2.5 h-2.5" />}
                            <span>{isFire ? 'Fire' : 'EMS'}</span>
                          </span>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {agency.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {agency.city}, {agency.stateCode} {agency.county ? `· ${agency.county}` : ''}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                            {agency.zollOpportunity?.pulseIqScore}/100
                          </span>
                          {dist !== null && (
                            <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {dist} mi away
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>Fleet: {agency.installedFleet?.defibUnitsCount}× {agency.installedFleet?.defibBrand?.slice(0, 14)}</span>
                        <span className="text-[#285EE8] font-semibold flex items-center gap-0.5">
                          Open 360 &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Google Maps API Configuration
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Provide your Google Maps Platform API key with Maps JavaScript API enabled.
            </p>
            <input
              type="password"
              value={keyInputDraft}
              onChange={(e) => setKeyInputDraft(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#285EE8]"
            />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSaveCustomKey}
                className="px-4 py-2 bg-[#285EE8] text-white text-xs font-bold rounded-xl hover:bg-[#194BC8]"
              >
                Save &amp; Activate
              </button>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
