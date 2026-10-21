/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Agency, PredictiveWeights } from '../types';
import { explainAgencyScore, DEFAULT_WEIGHTS } from '../utils/syncStore';
import { HelpCircle, X, ShieldAlert, Sparkles, Activity, FileCheck2, Cpu, ArrowUpRight } from 'lucide-react';

interface PulseIqScoreTooltipProps {
  agency: Agency;
  weights?: PredictiveWeights;
  size?: 'large' | 'compact' | 'badge';
  className?: string;
  showLabel?: boolean;
}

export const PulseIqScoreTooltip: React.FC<PulseIqScoreTooltipProps> = ({
  agency,
  weights = DEFAULT_WEIGHTS,
  size = 'compact',
  className = '',
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const explanation = useMemo(() => {
    return explainAgencyScore(agency, weights);
  }, [agency, weights]);

  const score = agency.zollOpportunity?.pulseIqScore ?? explanation.totalScore;

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getScoreColor = (val: number) => {
    if (val >= 88) return 'text-[#1E3A8A]';
    if (val >= 78) return 'text-emerald-700';
    return 'text-[#111827]';
  };

  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-[#1E3A8A]';
    if (score >= 65) return 'bg-amber-600';
    return 'bg-emerald-600';
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger: Clickable score display with interactive factor info badge */}
      {size === 'large' ? (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="text-left group/trigger cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded-lg"
          title="Click to view weighted factors contributing to this agency's Pulse IQ score"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <div className="text-3xl font-black font-mono tabular-nums text-[#111827] group-hover/trigger:text-[#1E3A8A] transition-colors">
              {score}
              <span className="text-sm font-medium text-[#6B7280]"> / 100</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E5E4DF]/60 text-[#374151] group-hover/trigger:bg-[#1E3A8A] group-hover/trigger:text-white transition-all shadow-2xs">
              <HelpCircle className="w-3 h-3" />
              <span>Factor Breakdown</span>
            </span>
          </div>
          {showLabel && (
            <div className="text-xs font-semibold text-[#6B7280] group-hover/trigger:text-[#1E3A8A] transition-colors mt-0.5">
              Upgrade Priority Score · <span className="underline decoration-dotted text-[#1E3A8A]">View weights</span>
            </div>
          )}
        </button>
      ) : size === 'badge' ? (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-xs font-bold tabular-nums border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] ${
            score >= 88
              ? 'bg-blue-50/80 border-blue-200 text-[#1E3A8A] hover:bg-blue-100'
              : score >= 78
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
          }`}
          title="Click to view weighted factors contributing to this priority score"
          aria-expanded={isOpen}
        >
          <span>{score}</span>
          <HelpCircle className="w-3 h-3 opacity-70" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="text-right group/trigger cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded-lg"
          title="Click to view weighted factors contributing to this agency's Pulse IQ score"
          aria-expanded={isOpen}
        >
          {showLabel && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center justify-end gap-1">
              <span>Priority Score</span>
              <HelpCircle className="w-3 h-3 text-[#6B7280] group-hover/trigger:text-[#1E3A8A] transition-colors" />
            </div>
          )}
          <div className={`font-mono text-2xl font-bold tabular-nums leading-none mt-0.5 ${getScoreColor(score)} group-hover/trigger:scale-105 transition-transform`}>
            {score}<span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
            {score >= 88 ? 'High Priority' : score >= 78 ? 'Strong Fit' : 'Standard'}
          </div>
        </button>
      )}

      {/* Interactive Tooltip / Popover Modal Curtain */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Pulse IQ Weighted Factor Breakdown"
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-85 sm:w-96 max-w-[calc(100vw-24px)] z-50 bg-white border border-[#D4D2CD] rounded-xl shadow-xl p-4 sm:p-5 text-left text-[#111827] space-y-3.5 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E4DF]">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1E3A8A]" />
                <span>Weighted Factor Breakdown</span>
              </div>
              <h4 className="text-sm font-extrabold text-[#111827] tracking-tight mt-0.5">
                {agency.name}
              </h4>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Composite Pulse IQ Priority Score: <strong className="font-mono tabular-nums text-[#111827]">{score} / 100</strong> ({explanation.priorityTier})
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F7F4] cursor-pointer"
              title="Close factor explanation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Weighted Factor Rows */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {explanation.factors.map(factor => {
              const maxPossible = factor.weightPct;
              const contributed = factor.pointsContributed;
              const pctOfMax = Math.min(100, Math.round((contributed / maxPossible) * 100));

              return (
                <div key={factor.id} className="p-2.5 rounded-lg bg-[#F8F7F4] border border-[#E5E4DF] space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-[#111827] leading-tight">
                      {factor.name}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs tabular-nums text-[#1E3A8A]">
                        +{contributed.toFixed(1)} pts
                      </span>
                      <span className="text-[10px] text-[#6B7280] block font-medium">
                        ({factor.weightPct}% weight)
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Contribution Bar */}
                  <div className="w-full bg-[#E5E4DF] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getBarColor(factor.componentScore)}`}
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>

                  {/* Real Specific Agency Metric */}
                  <div className="text-[11px] font-mono font-semibold text-[#374151] pt-0.5">
                    {factor.agencyMetricValue}
                  </div>

                  {/* Plain-English Impact Context */}
                  <p className="text-[11px] text-[#6B7280] leading-snug">
                    {factor.clinicalImpactSummary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-[#E5E4DF] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Weights sum to 100% of final score</span>
            <span className="font-bold text-[#1E3A8A]">
              Total: {score} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
