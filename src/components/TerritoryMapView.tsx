/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Agency } from '../types';
import { 
  MapPin, 
  Navigation, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Route, 
  Clock, 
  Car, 
  ArrowRight,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import { ALL_50_STATES_SUMMARIES } from '../data/nationalGeographicData';
import { US_STATES_SVG_PATHS } from '../data/usStatesSvgPaths';
import { territoryEngine } from '../services/territoryIntelligenceEngine';
import { PulseIqScoreTooltip } from './PulseIqScoreTooltip';

interface TerritoryMapViewProps {
  agencies: Agency[];
  onSelectAgency: (agency: Agency) => void;
  onToggleRoute: (agencyId: string) => void;
  globalState?: string;
  globalCounty?: string;
  globalCity?: string;
  globalCategory?: 'all' | 'ems' | 'fire';
  activeAccount?: Agency | null;
}

export const TerritoryMapView: React.FC<TerritoryMapViewProps> = ({
  agencies,
  onSelectAgency,
  onToggleRoute,
  globalState,
  globalCounty,
  globalCity,
  globalCategory,
  activeAccount
}) => {
  const [selectedPinAgency, setSelectedPinAgency] = useState<Agency | null>(activeAccount || agencies[0] || null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>(globalState || 'all');
  const [selectedCounty, setSelectedCounty] = useState<string>(globalCounty || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(globalCity || 'all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ems' | 'fire'>(globalCategory || 'all');

  React.useEffect(() => {
    if (globalState !== undefined) setSelectedState(globalState);
  }, [globalState]);

  React.useEffect(() => {
    if (globalCounty !== undefined) setSelectedCounty(globalCounty);
  }, [globalCounty]);

  React.useEffect(() => {
    if (globalCity !== undefined) setSelectedCity(globalCity);
  }, [globalCity]);

  React.useEffect(() => {
    if (globalCategory !== undefined) setSelectedCategory(globalCategory);
  }, [globalCategory]);

  React.useEffect(() => {
    if (activeAccount) {
      setSelectedPinAgency(activeAccount);
    }
  }, [activeAccount]);

  // National US bounding box aligned with 920x500 US_STATES_SVG_PATHS
  const mapWidth = 920;
  const mapHeight = 500;

  const projectCoord = (lat: number, lon: number) => {
    if (lat > 52 || (lon < -130 && lat > 45)) {
      const nLng = lon > 0 ? lon - 360 : lon;
      const akX = 25 + ((nLng - (-172)) / ((-130) - (-172))) * 145;
      const akY = 482 - ((lat - 54) / (71.5 - 54)) * 108;
      return { x: Math.max(20, Math.min(180, akX)), y: Math.max(365, Math.min(488, akY)) };
    }
    if (lat < 25 && lon < -150) {
      const hiX = 200 + ((lon - (-160.5)) / ((-154.8) - (-160.5))) * 105;
      const hiY = 480 - ((lat - 18.8) / (22.4 - 18.8)) * 68;
      return { x: Math.max(192, Math.min(312, hiX)), y: Math.max(405, Math.min(488, hiY)) };
    }
    const x = 32 + ((lon - (-124.8)) / ((-66.8) - (-124.8))) * 755;
    const y = 20 + ((49.5 - lat) / (49.5 - 24.5)) * 425;
    return { x: Math.max(20, Math.min(mapWidth - 20, x)), y: Math.max(20, Math.min(mapHeight - 20, y)) };
  };

  const dayRouteAgencies = useMemo(() => {
    return agencies.filter(a => a.inDayRoute);
  }, [agencies]);

  const estimatedDriving = useMemo(() => {
    if (dayRouteAgencies.length <= 1) return { miles: 0, hours: 0 };
    let totalMiles = 0;
    for (let i = 0; i < dayRouteAgencies.length - 1; i++) {
      const a1 = dayRouteAgencies[i];
      const a2 = dayRouteAgencies[i + 1];
      const dLat = (a2.latitude - a1.latitude) * 69;
      const dLon = (a2.longitude - a1.longitude) * 53;
      totalMiles += Math.sqrt(dLat * dLat + dLon * dLon);
    }
    const adjustedMiles = Math.round(totalMiles * 1.25);
    const hours = (adjustedMiles / 52).toFixed(1);
    return { miles: adjustedMiles, hours };
  }, [dayRouteAgencies]);

  // Authoritative list of all 50 US States + DC
  const availableStates = useMemo(() => {
    return Object.keys(ALL_50_STATES_SUMMARIES).sort();
  }, []);

  const stateCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < agencies.length; i++) {
      const sc = agencies[i].stateCode;
      map[sc] = (map[sc] || 0) + 1;
    }
    return map;
  }, [agencies]);

  const availableCounties = useMemo(() => {
    return territoryEngine.getCountiesForState(selectedState).map(c => c.countyName);
  }, [selectedState]);

  const availableCities = useMemo(() => {
    return territoryEngine.getCitiesForState(
      selectedState,
      selectedCounty !== 'all' ? selectedCounty : undefined
    );
  }, [selectedState, selectedCounty]);

  const visibleAgencies = useMemo(() => {
    return agencies.filter(a => {
      if (selectedState !== 'all' && a.stateCode !== selectedState) return false;
      if (selectedCounty !== 'all') {
        const cleanTarget = selectedCounty.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        const cleanAgency = a.county.replace(/\s+(County|Parish|Borough)$/i, '').toLowerCase();
        if (cleanAgency !== cleanTarget && a.county !== selectedCounty) return false;
      }
      if (selectedCity !== 'all' && a.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedCategory === 'ems' && a.agencyType.toLowerCase().includes('fire')) return false;
      if (selectedCategory === 'fire' && !a.agencyType.toLowerCase().includes('fire')) return false;
      if (filterPriority === 'critical' && a.zollOpportunity.pulseIqScore < 95) return false;
      if (filterPriority === 'high' && a.zollOpportunity.pulseIqScore < 85) return false;
      if (filterPriority === 'afg' && !a.grantStatus.afgAwarded) return false;
      return true;
    });
  }, [agencies, filterPriority, selectedState, selectedCounty, selectedCity, selectedCategory]);

  const mapPinsAgencies = useMemo(() => {
    return [...visibleAgencies]
      .sort((a, b) => b.zollOpportunity.pulseIqScore - a.zollOpportunity.pulseIqScore)
      .slice(0, 220);
  }, [visibleAgencies]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Map Interactive Canvas */}
      <div className="lg:col-span-2 bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs flex flex-col">
        
        {/* Map Header / Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Geographic Territory &amp; Strategic Leads ({visibleAgencies.length.toLocaleString()} Agencies)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
            >
              <option value="all">All Priority Levels</option>
              <option value="critical">Score 95+ Critical Only</option>
              <option value="high">Score 85+ High Value</option>
              <option value="afg">Active AFG Grants Only</option>
            </select>
          </div>
        </div>

        {/* SVG Tactical Map */}
        <div className="relative flex-1 bg-[#F8FAFC] min-h-[460px] flex items-center justify-center p-2 overflow-hidden">
          <svg 
            viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
            className="w-full h-full max-h-[520px] select-none"
          >
            <defs>
              <pattern id="route-map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148, 163, 184, 0.14)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={mapWidth} height={mapHeight} fill="url(#route-map-grid)" />

            {/* Alaska & Hawaii Inset Frames */}
            <g>
              <rect x="14" y="356" width="174" height="134" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
              <text x="24" y="373" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="800">ALASKA (AK)</text>

              <rect x="196" y="396" width="124" height="94" rx="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="4 4" />
              <text x="206" y="413" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="800">HAWAII (HI)</text>
            </g>

            {/* Authoritative U.S. Census 50-State + DC Boundary Polygons */}
            <g>
              {Object.entries(US_STATES_SVG_PATHS).map(([sc, boundary]) => {
                const isActiveState = selectedState === 'all' || selectedState === sc;
                return (
                  <path
                    key={`route-poly-${sc}`}
                    d={boundary.d}
                    fill={selectedState === sc ? '#DBEAFE' : '#E2E8F0'}
                    stroke={selectedState === sc ? '#1E3A8A' : '#94A3B8'}
                    strokeWidth={selectedState === sc ? 1.5 : 0.9}
                    opacity={isActiveState ? 0.95 : 0.35}
                    onClick={() => {
                      setSelectedState(selectedState === sc ? 'all' : sc);
                      setSelectedCounty('all');
                      setSelectedCity('all');
                    }}
                    className="cursor-pointer transition-colors"
                  >
                    <title>{`${ALL_50_STATES_SUMMARIES[sc]?.state || sc} (${sc})`}</title>
                  </path>
                );
              })}
            </g>

            {/* Connecting Route Polyline for Day Route */}
            {dayRouteAgencies.length > 1 && (
              <polyline
                points={dayRouteAgencies.map(a => {
                  const { x, y } = projectCoord(a.latitude, a.longitude);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#00A3E0"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            )}

            {/* Territory Agency Pins */}
            {mapPinsAgencies.map((agency) => {
              const { x, y } = projectCoord(agency.latitude, agency.longitude);
              const isSelected = selectedPinAgency?.id === agency.id;
              const isRoute = agency.inDayRoute;
              const score = agency.zollOpportunity.pulseIqScore;
              
              const pinColor = 
                score >= 95 ? '#00A3E0' : // ZOLL cyan
                score >= 85 ? '#10B981' : // emerald
                '#F59E0B'; // amber

              return (
                <g 
                  key={agency.id} 
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPinAgency(agency)}
                >
                  {/* Pin Circle */}
                  <circle
                    r={isSelected ? 14 : 9}
                    fill={isSelected ? '#0284c7' : '#0f172a'}
                    stroke={pinColor}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Route Indicator Ring */}
                  {isRoute && (
                    <circle
                      r="18"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Score Label inside Pin */}
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    fontSize={isSelected ? "9" : "7.5"}
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill={isSelected ? "#ffffff" : pinColor}
                    className="pointer-events-none select-none"
                  >
                    {score}
                  </text>

                  {/* Label on Hover / Select */}
                  <g 
                    transform="translate(0, -18)"
                    className={`transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <rect
                      x="-70"
                      y="-22"
                      width="140"
                      height="20"
                      rx="4"
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="-8"
                      fontSize="9"
                      fontWeight="600"
                      fill="#0f172a"
                      className="pointer-events-none select-none"
                    >
                      {agency.name.length > 22 ? agency.name.substring(0, 20) + '...' : agency.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Quick Map Legend HUD */}
          <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-300 rounded-lg p-2.5 text-[11px] text-slate-700 shadow-md backdrop-blur-md flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Score 95+ (Critical)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Score 85–94 (High)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Score &lt;85</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-700 font-medium">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-500"></span>
              <span>Active Route ({dayRouteAgencies.length} stops)</span>
            </div>
          </div>
        </div>

        {/* Selected Pin Quick Card */}
        {selectedPinAgency && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <PulseIqScoreTooltip agency={selectedPinAgency} size="badge" showLabel={false} />
                <h3 className="font-bold text-slate-900 text-sm">{selectedPinAgency.name}</h3>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>{selectedPinAgency.city}, {selectedPinAgency.stateCode}</span>
                <span aria-hidden="true">·</span>
                <span>Installed: <strong className="text-slate-700">{selectedPinAgency.installedFleet.defibBrand}</strong> ({selectedPinAgency.installedFleet.defibAgeYears} yrs old)</span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700 font-medium">Target: {selectedPinAgency.zollOpportunity.primaryTargetProduct}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggleRoute(selectedPinAgency.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-2xs ${
                  selectedPinAgency.inDayRoute
                    ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-500'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{selectedPinAgency.inDayRoute ? 'Remove from Route' : 'Add to Day Route'}</span>
              </button>

              <button
                onClick={() => onSelectAgency(selectedPinAgency)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 flex items-center gap-1 shadow-2xs"
              >
                <span>360° Dossier</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Day Route Planner & Multi-Stop Dispatch */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between text-slate-900">
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Today's Field Route</h2>
            </div>
            <span className="text-xs font-mono text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-300">
              {dayRouteAgencies.length} Stops
            </span>
          </div>

          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Car className="w-3 h-3 text-sky-600" />
                <span>Est. Driving</span>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {estimatedDriving.miles} mi
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>Transit Time</span>
              </div>
              <div className="font-mono text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {estimatedDriving.hours} hrs
              </div>
            </div>
          </div>

          {/* Stops Sequence */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {dayRouteAgencies.length > 0 ? (
              dayRouteAgencies.map((agency, index) => (
                <div
                  key={agency.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-sky-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-sky-100 border border-sky-400 text-sky-800 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                          {agency.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {agency.address}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1 font-mono">
                          Target: <span className="text-sky-700 font-semibold">{agency.zollOpportunity.primaryTargetProduct}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleRoute(agency.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove from Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Navigation className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                No stops added to today's route yet.
                <p className="text-[11px] text-slate-400 mt-1">
                  Click "Add to Day Route" on any prioritized agency or map pin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Route Actions */}
        {dayRouteAgencies.length > 0 && (
          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <a
              href={`https://www.google.com/maps/dir/${dayRouteAgencies.map(a => encodeURIComponent(a.address)).join('/')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Turn-by-Turn Navigation</span>
            </a>

            <button
              onClick={() => {
                dayRouteAgencies.forEach(a => onToggleRoute(a.id));
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-rose-600 text-center transition-colors"
            >
              Clear Current Day Route
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
