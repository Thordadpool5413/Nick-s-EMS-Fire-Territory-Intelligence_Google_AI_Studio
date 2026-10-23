/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Agency, PredictiveWeights } from '../types';
import { explainAgencyScore, DEFAULT_WEIGHTS } from '../utils/syncStore';
import { 
  Activity, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  HeartPulse, 
  Award, 
  Cpu, 
  ArrowRight,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface PulseIqScoreExplainerHubProps {
  agency: Agency;
  weights?: PredictiveWeights;
  variant?: 'compact' | 'full';
  onOpenFullProfile?: (agency: Agency) => void;
  className?: string;
}

export const PulseIqScoreExplainerHub: React.FC<PulseIqScoreExplainerHubProps> = ({
  agency,
  weights = DEFAULT_WEIGHTS,
  variant = 'compact',
  onOpenFullProfile,
  className = ''
}) => {
  const explanation = useMemo(() => {
    return explainAgencyScore(agency, weights);
  }, [agency, weights]);

  const score = agency.zollOpportunity?.pulseIqScore ?? explanation.totalScore;

  const getScoreColor = (val: number) => {
    if (val >= 88) return 'text-[#1E3A8A] dark:text-blue-400';
    if (val >= 75) return 'text-emerald-700 dark:text-emerald-400';
    return 'text-slate-800 dark:text-slate-200';
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      case 'Elevated':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-slate-900/90 text-left transition-all ${className}`}>
        {/* Header with Score */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                PulseIQ Predictive Score Explainer
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Transparent factor attribution · Territory percentile: Top {score >= 88 ? '5%' : '15%'}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-slate-700 shrink-0">
            <span className={`text-base font-extrabold font-mono tabular-nums ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/100</span>
          </div>
        </div>

        {/* 5-Factor Mini Stack */}
        <div className="space-y-2 my-2.5">
          {explanation.factors.map((factor) => {
            const barWidth = Math.min(100, Math.max(10, factor.componentScore));
            return (
              <div key={factor.id} className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                      {factor.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({factor.weightPct}% weight)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-[11px] tabular-nums shrink-0">
                    +{factor.pointsContributed} pts
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  <span className="truncate">{factor.agencyMetricValue}</span>
                  <span className={`px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider text-[9px] ${getUrgencyBadge(factor.urgencyLevel)}`}>
                    {factor.urgencyLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-600 dark:text-slate-400">
            <strong>Key Driver:</strong> Installed hardware aging past 7-year service lifecycle.
          </span>
          {onOpenFullProfile && (
            <button
              onClick={() => onOpenFullProfile(agency)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 shrink-0 ml-2"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // FULL-SCREEN VARIANT
  return (
    <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-left ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                PulseIQ Opportunity Scoring Algorithm & Point Attribution
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                {explanation.priorityTier}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-variant algorithmic breakdown showing exactly how {agency.name}'s priority was calculated
            </p>
          </div>
        </div>

        {/* Score Big Display */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 self-start md:self-auto">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total PulseIQ
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-200 tabular-nums">
              {score}<span className="text-sm font-normal text-slate-400">/100</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600 dark:border-indigo-400 flex items-center justify-center font-bold text-xs text-indigo-800 dark:text-indigo-200">
            {score}%
          </div>
        </div>
      </div>

      {/* 5 Detailed Factor Cards */}
      <div className="my-5 space-y-3">
        {explanation.factors.map((factor, index) => {
          return (
            <div 
              key={factor.id} 
              className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center font-mono">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {factor.name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    (Weight: {factor.weightPct}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getUrgencyBadge(factor.urgencyLevel)}`}>
                    {factor.urgencyLevel} Urgency
                  </span>
                  <div className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-400 tabular-nums bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-100 dark:border-slate-700">
                    +{factor.pointsContributed} Points
                  </div>
                </div>
              </div>

              {/* Progress Bar & Value */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center my-2">
                <div className="md:col-span-3">
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, factor.componentScore))}%` }}
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  Raw Index: {factor.componentScore}/100
                </div>
              </div>

              {/* Metric & Impact Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Observed Metric:</span> {factor.agencyMetricValue}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {factor.clinicalImpactSummary}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Territory Benchmark & How to Advance Lead */}
      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold mb-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Recommended Next Action to Advance this Deal</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300">
          Because <strong>Fleet Age (+{explanation.factors[0]?.pointsContributed} pts)</strong> and <strong>Claim Denials (+{explanation.factors[1]?.pointsContributed} pts)</strong> drive the majority of this agency's score, lead with the <strong>Sourcewell Cooperative Contract</strong> to eliminate the RFP cycle, and present the <strong>Real BVM Help & 12-Lead ePCR Billing integration</strong> to address their {agency.cmsData?.claimDenialRate}% Medicare denial rate.
        </p>
      </div>
    </div>
  );
};
