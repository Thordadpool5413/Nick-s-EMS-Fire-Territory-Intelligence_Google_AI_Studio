/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { PredictiveWeights } from '../types';
import { DEFAULT_WEIGHTS } from '../utils/syncStore';
import { X, Sliders, RotateCcw, Check, Sparkles, Scale, Info } from 'lucide-react';

interface PredictiveWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: PredictiveWeights;
  onSaveWeights: (newWeights: PredictiveWeights) => void;
}

export const PredictiveWeightsModal: React.FC<PredictiveWeightsModalProps> = ({
  isOpen,
  onClose,
  weights,
  onSaveWeights
}) => {
  // Always derive a guaranteed safe default weights object
  const safeInitialWeights = useMemo(() => ({
    fleetAgeWeight: typeof weights?.fleetAgeWeight === 'number' ? weights.fleetAgeWeight : DEFAULT_WEIGHTS.fleetAgeWeight,
    cmsDenialWeight: typeof weights?.cmsDenialWeight === 'number' ? weights.cmsDenialWeight : DEFAULT_WEIGHTS.cmsDenialWeight,
    cardiacVolumeWeight: typeof weights?.cardiacVolumeWeight === 'number' ? weights.cardiacVolumeWeight : DEFAULT_WEIGHTS.cardiacVolumeWeight,
    grantAwardWeight: typeof weights?.grantAwardWeight === 'number' ? weights.grantAwardWeight : DEFAULT_WEIGHTS.grantAwardWeight,
    softwareWhitespaceWeight: typeof weights?.softwareWhitespaceWeight === 'number' ? weights.softwareWhitespaceWeight : DEFAULT_WEIGHTS.softwareWhitespaceWeight
  }), [weights]);

  // Component state
  const [localWeights, setLocalWeights] = useState<PredictiveWeights>(safeInitialWeights);

  // Synchronize local weights whenever the modal opens or the external weights prop updates
  useEffect(() => {
    if (isOpen) {
      setLocalWeights({
        fleetAgeWeight: typeof weights?.fleetAgeWeight === 'number' ? weights.fleetAgeWeight : DEFAULT_WEIGHTS.fleetAgeWeight,
        cmsDenialWeight: typeof weights?.cmsDenialWeight === 'number' ? weights.cmsDenialWeight : DEFAULT_WEIGHTS.cmsDenialWeight,
        cardiacVolumeWeight: typeof weights?.cardiacVolumeWeight === 'number' ? weights.cardiacVolumeWeight : DEFAULT_WEIGHTS.cardiacVolumeWeight,
        grantAwardWeight: typeof weights?.grantAwardWeight === 'number' ? weights.grantAwardWeight : DEFAULT_WEIGHTS.grantAwardWeight,
        softwareWhitespaceWeight: typeof weights?.softwareWhitespaceWeight === 'number' ? weights.softwareWhitespaceWeight : DEFAULT_WEIGHTS.softwareWhitespaceWeight
      });
    }
  }, [isOpen, weights]);

  const modalCardRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside or pressing Escape
  useClickOutside(modalCardRef, onClose, { enabled: isOpen, closeOnEscape: true });

  // Derived total sum of weights
  const totalWeight = useMemo(() => {
    return (
      (localWeights.fleetAgeWeight || 0) +
      (localWeights.cmsDenialWeight || 0) +
      (localWeights.cardiacVolumeWeight || 0) +
      (localWeights.grantAwardWeight || 0) +
      (localWeights.softwareWhitespaceWeight || 0)
    );
  }, [localWeights]);

  // ALL HOOKS CALLED ABOVE THIS LINE — NEVER CALL HOOKS AFTER EARLY RETURN
  if (!isOpen) return null;

  const handleApplyPreset = (preset: 'balanced' | 'hardware' | 'software' | 'grants') => {
    if (preset === 'balanced') {
      setLocalWeights(DEFAULT_WEIGHTS);
    } else if (preset === 'hardware') {
      setLocalWeights({
        fleetAgeWeight: 40,
        cmsDenialWeight: 10,
        cardiacVolumeWeight: 35,
        grantAwardWeight: 10,
        softwareWhitespaceWeight: 5
      });
    } else if (preset === 'software') {
      setLocalWeights({
        fleetAgeWeight: 10,
        cmsDenialWeight: 45,
        cardiacVolumeWeight: 10,
        grantAwardWeight: 10,
        softwareWhitespaceWeight: 25
      });
    } else if (preset === 'grants') {
      setLocalWeights({
        fleetAgeWeight: 20,
        cmsDenialWeight: 15,
        cardiacVolumeWeight: 15,
        grantAwardWeight: 45,
        softwareWhitespaceWeight: 5
      });
    }
  };

  const handleSave = () => {
    onSaveWeights(localWeights);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-100"
    >
      <div 
        ref={modalCardRef}
        className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-fadeIn text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-sky-700 tracking-wider bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                  Algorithm Tuning
                </span>
                <span className="text-[10px] text-slate-500 font-mono">5-Pillar Model</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                PulseIQ Score Adjustment &amp; Algorithm Weights
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close adjustment modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Adjust the relative weighting of each algorithmic factor to align territorial account prioritization with current corporate quota goals, quarterly promos, or local clinical initiatives.
        </p>

        {/* Strategy Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
              Strategy Presets:
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
              totalWeight === 100 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              Total Weight: {totalWeight}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleApplyPreset('balanced')}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50/50 text-left text-slate-800 font-medium transition-all cursor-pointer group"
            >
              <div className="font-bold text-slate-900 group-hover:text-sky-700">Balanced Territory</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">30 / 25 / 20 / 15 / 10% (Default)</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('hardware')}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50/50 text-left text-slate-800 font-medium transition-all cursor-pointer group"
            >
              <div className="font-bold text-slate-900 group-hover:text-sky-700">Hardware &amp; CPR Rush</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">40% Fleet · 35% Cardiac Need</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('software')}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50/50 text-left text-slate-800 font-medium transition-all cursor-pointer group"
            >
              <div className="font-bold text-slate-900 group-hover:text-sky-700">ZOLL Billing &amp; Denials</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">45% CMS Denials · 25% Software</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('grants')}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50/50 text-left text-slate-800 font-medium transition-all cursor-pointer group"
            >
              <div className="font-bold text-slate-900 group-hover:text-sky-700">AFG Grants Priority</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">45% FEMA AFG · 20% Fleet Age</div>
            </button>
          </div>
        </div>

        {/* 5-Factor Weight Sliders */}
        <div className="space-y-3 pt-1">
          {/* Factor 1: Fleet Age */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Competitor Fleet Age (LIFEPAK/MRx obsolescence)</span>
              </span>
              <span className="font-mono text-rose-700 font-bold tabular-nums">{localWeights.fleetAgeWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={localWeights.fleetAgeWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, fleetAgeWeight: Number(e.target.value) })}
              className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Factor 2: CMS Medicare Denials */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>CMS Medicare Denial Rate &amp; Recovery Potential</span>
              </span>
              <span className="font-mono text-emerald-700 font-bold tabular-nums">{localWeights.cmsDenialWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={localWeights.cmsDenialWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, cmsDenialWeight: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Factor 3: Cardiac Arrest Volume */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>Cardiac Arrest Volume &amp; Acuity (AutoPulse need)</span>
              </span>
              <span className="font-mono text-sky-700 font-bold tabular-nums">{localWeights.cardiacVolumeWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={localWeights.cardiacVolumeWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, cardiacVolumeWeight: Number(e.target.value) })}
              className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Factor 4: FEMA AFG Grant Award */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span>Active FEMA AFG / SAFER Grant Award Status</span>
              </span>
              <span className="font-mono text-purple-700 font-bold tabular-nums">{localWeights.grantAwardWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={localWeights.grantAwardWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, grantAwardWeight: Number(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Factor 5: Software Whitespace */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Software Ecosystem Whitespace (ePCR &amp; CAD)</span>
              </span>
              <span className="font-mono text-amber-700 font-bold tabular-nums">{localWeights.softwareWhitespaceWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={localWeights.softwareWhitespaceWeight}
              onChange={(e) => setLocalWeights({ ...localWeights, softwareWhitespaceWeight: Number(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocalWeights(DEFAULT_WEIGHTS)}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-semibold py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[40px] px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply &amp; Recalculate Scores</span>
          </button>
        </div>

      </div>
    </div>
  );
};
