/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mutual Aid Hardware Compatibility Index (MABAS / Mutual Aid Compact Clustering)
 * Identifies the 3-5 nearest neighboring mutual aid departments within 20 miles,
 * evaluates defibrillator pad/cable interoperability, and provides clinical arguments
 * for regional fleet standardization.
 */

import React, { useMemo } from 'react';
import { Agency } from '../types';
import { haversineDistanceMiles, estimateDriveTimeMinutes } from './GpsProximityRadar';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  Radio,
  ExternalLink,
  Flame,
  Siren,
  ChevronRight,
  MapPin
} from 'lucide-react';

interface MutualAidCompatibilityIndexProps {
  agency: Agency;
  allAgencies: Agency[];
  onSelectNeighborAgency?: (neighbor: Agency) => void;
}

export const MutualAidCompatibilityIndex: React.FC<MutualAidCompatibilityIndexProps> = ({
  agency,
  allAgencies,
  onSelectNeighborAgency
}) => {
  const currentBrand = agency.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';
  const isCurrentZoll = currentBrand.toUpperCase().includes('ZOLL');

  // Identify nearest mutual aid agencies within 25 miles
  const nearestNeighbors = useMemo(() => {
    if (!agency.latitude || !agency.longitude) return [];

    const pool = Array.isArray(allAgencies) ? allAgencies : [];
    return pool
      .filter((a) => a.id !== agency.id && a.latitude && a.longitude)
      .map((neighbor) => {
        const miles = haversineDistanceMiles(
          agency.latitude,
          agency.longitude,
          neighbor.latitude,
          neighbor.longitude
        );
        const driveMinutes = estimateDriveTimeMinutes(miles);
        const neighborBrand = neighbor.installedFleet?.defibBrand || 'Stryker LIFEPAK 15';
        const isNeighborZoll = neighborBrand.toUpperCase().includes('ZOLL');

        // Mutual aid compatibility check
        const isCompatible = isCurrentZoll ? isNeighborZoll : neighborBrand === currentBrand;

        return {
          agency: neighbor,
          miles,
          driveMinutes,
          neighborBrand,
          isNeighborZoll,
          isCompatible
        };
      })
      .filter((item) => item.miles <= 30)
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 4);
  }, [agency, allAgencies, currentBrand, isCurrentZoll]);

  // Overall Mutual Aid Standardization Index (0 - 100%)
  const { compatibilityScore, zollDensityScore, compatibleCount } = useMemo(() => {
    if (nearestNeighbors.length === 0) {
      return { compatibilityScore: 50, zollDensityScore: 50, compatibleCount: 0 };
    }
    const compatible = nearestNeighbors.filter((n) => n.isCompatible).length;
    const zollCount = nearestNeighbors.filter((n) => n.isNeighborZoll).length;
    return {
      compatibilityScore: Math.round((compatible / nearestNeighbors.length) * 100),
      zollDensityScore: Math.round((zollCount / nearestNeighbors.length) * 100),
      compatibleCount: compatible
    };
  }, [nearestNeighbors]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
              <Radio className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Mutual Aid Hardware Compatibility Index (MABAS / Regional Compact)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Defibrillator pad and telemetry interoperability across adjacent mutual-aid response partners within a 25-mile radius.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Mutual Aid Standardization</div>
            <div className={`text-base font-extrabold ${zollDensityScore >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {zollDensityScore}% ZOLL Unified
            </div>
          </div>
        </div>
      </div>

      {/* Interoperability Score Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Regional Interoperability Assessment:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              zollDensityScore >= 75
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : zollDensityScore >= 50
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}>
              {zollDensityScore >= 75 ? 'HIGH REGIONAL ALIGNMENT' : zollDensityScore >= 50 ? 'MODERATE ALIGNMENT' : 'SPLIT REGIONAL FLEET'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {nearestNeighbors.filter((n) => n.isNeighborZoll).length} of {nearestNeighbors.length} adjacent mutual-aid partners operate the <strong className="text-slate-900 dark:text-white">ZOLL X Series® ecosystem</strong>.
            Standardizing {agency.name} onto ZOLL enables immediate zero-interruption patient handoffs between first responders and transport units without peeling off defibrillation pads.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Immediate Neighbors</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{nearestNeighbors.length} Agencies</div>
          </div>
        </div>
      </div>

      {/* Neighbor Cards Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Surrounding Mutual Aid Departments (Nearest 4)</span>
          <span className="text-slate-400 font-normal">Ranked by Haversine Dispatch Distance</span>
        </div>

        {nearestNeighbors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nearestNeighbors.map(({ agency: neighbor, miles, driveMinutes, neighborBrand, isNeighborZoll }) => (
              <div
                key={neighbor.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      {neighbor.providerCategory === 'FIRE' ? (
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Siren className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[220px]">{neighbor.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{neighbor.city}, {neighbor.stateCode}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{miles.toFixed(1)} miles (~{driveMinutes} min transit)</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    isNeighborZoll
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {isNeighborZoll ? 'ZOLL Compatible' : 'Incompatible Pad Standard'}
                  </span>
                </div>

                {/* Apparatus & Hardware Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Hardware Fleet</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {neighbor.installedFleet?.defibUnitsCount || 6}× {neighborBrand}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Frontline Units</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {neighbor.totalAmbulances} Amb · {neighbor.totalFireEngines} Eng
                    </div>
                  </div>
                </div>

                {/* Clinical Hand-off Note */}
                <div className={`p-2 rounded-lg text-[11px] leading-tight flex items-start gap-1.5 ${
                  isNeighborZoll
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
                }`}>
                  {isNeighborZoll ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Seamless Pad Swap:</strong> Rescuers share standardized CPR-D-padz and direct Real CPR Help® sensor handoff.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Electrode Divide:</strong> Patient transfer requires peeling off pads and applying adapter cables during resuscitation.</span>
                    </>
                  )}
                </div>

                {onSelectNeighborAgency && (
                  <button
                    type="button"
                    onClick={() => onSelectNeighborAgency(neighbor)}
                    className="w-full py-1 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center justify-center gap-1 cursor-pointer pt-1"
                  >
                    <span>Inspect Neighbor Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No adjacent mutual aid departments indexed within 25 miles of current station coordinates.
          </div>
        )}
      </div>
    </div>
  );
};
