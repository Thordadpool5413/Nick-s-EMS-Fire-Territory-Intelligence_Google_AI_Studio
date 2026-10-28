import React, { useState } from 'react';
import {
  X,
  Layers,
  Scale,
  Activity,
  AlertTriangle,
  Award,
  DollarSign,
  Laptop,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface UnderstandingPulseIqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalibration?: () => void;
  onOpenWeightsModal?: () => void;
}

export const UnderstandingPulseIqModal: React.FC<UnderstandingPulseIqModalProps> = ({
  isOpen,
  onClose,
  onOpenCalibration,
  onOpenWeightsModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'playbook' | 'provenance'>('overview');
  const handleOpenCalibration = onOpenCalibration || onOpenWeightsModal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-labelledby="pulseiq-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pulseiq-modal-title" className="text-xl font-bold font-display text-white tracking-tight">
                  Understanding PulseIQ™ Scoring
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md">
                  White-Box Formula
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Actuarial, deterministic account prioritization for EMS & Fire territory intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview & Score Tiers
          </button>
          <button
            onClick={() => setActiveTab('pillars')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pillars'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            5-Pillar Methodology
          </button>
          <button
            onClick={() => setActiveTab('playbook')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'playbook'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Sales Prioritization Playbook
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'provenance'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Data Sources & Verification
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-800/40 rounded-xl p-4 sm:p-5">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  What is PulseIQ™?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  PulseIQ™ is Nick&apos;s proprietary, transparent actuarial index (0–100) that models capital replacement urgency, reimbursement distress, and procurement readiness across EMS and fire departments.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed mt-2">
                  Unlike black-box AI scores, PulseIQ™ is <strong className="text-white font-semibold">100% deterministic and auditable</strong>: every point is directly traced to public regulatory filings (CMS Part B ambulance carrier reports, FEMA AFG grant awards, state fleet inventories, and CARES cardiac registry telemetry).
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Score Interpretation & Lead Tier Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tier 1 */}
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        88 – 100 PTS
                      </span>
                      <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">
                        Immediate Action (Tier 1)
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm mb-1">
                      Active Capital Procurement Cycle
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      End-of-life competitor fleet (≥ 8–10 years old) paired with active FEMA AFG grant award or severe billing claim denial rates (≥ 20%). Organization has budget or acute pain. Deploy direct rep visit within 7 days.
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        75 – 87 PTS
                      </span>
                      <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        High Opportunity (Tier 2)
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm mb-1">
                      Budgeted Evaluation Window
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Fleet reaching replacement age (6–8 years) with high Medicare cardiac run volumes. Active clinical committee or upcoming fiscal renewal. Initiate RFP advisory and clinical evaluation trial.
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        60 – 74 PTS
                      </span>
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Medium Pipeline (Tier 3)
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm mb-1">
                      Mid-Term Nurture Target
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Fleet aged 4–6 years or mixed competitor software install. Target with clinical trial evidence, CPR quality case studies, and grant application writing assistance for upcoming funding cycles.
                    </p>
                  </div>

                  {/* Tier 4 */}
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        &lt; 60 PTS
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Low Priority / Established
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 text-sm mb-1">
                      Stable or Fresh Capital Deployment
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Recent monitor purchase (&lt; 3 years old), or already fully equipped with ZOLL X Series ecosystem. Maintain low-touch account relationship and monitor for dispatch software renewal triggers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white block">Custom Territory Weight Calibration</span>
                    <span className="text-slate-400">Territory managers can adjust individual pillar weights to fit specific quarter campaigns.</span>
                  </div>
                </div>
                {handleOpenCalibration && (
                  <button
                    onClick={() => {
                      onClose();
                      handleOpenCalibration();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Calibrate Weights
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: PILLARS */}
          {activeTab === 'pillars' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                PulseIQ aggregates five mathematically distinct operational pillars. The final score is a weighted composite sum totaling 100 possible points:
              </p>

              {/* Pillar 1 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Pillar 1: Fleet Age & Equipment Obsolescence
                      </h4>
                      <span className="text-xs text-slate-400">Default Weight: 30% | Maximum Points: 30</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-md">
                    30% Weight
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-300 space-y-2 pl-12">
                  <p>
                    Evaluates fleet age and the mechanical/clinical end-of-service lifecycle of currently fielded monitor/defibrillators (e.g. legacy Stryker LIFEPAK 15 v1/v2, Philips MRx).
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fleet Age ≥ 9 yrs</span>
                      <strong className="text-orange-400">100 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fleet Age ≥ 7–9 yrs</span>
                      <strong className="text-amber-400">85 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fleet Age ≥ 5–7 yrs</span>
                      <strong className="text-blue-400">65 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fleet Age &lt; 5 yrs</span>
                      <strong className="text-slate-400">40 / 100 pts</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Pillar 2: Medicare Volume & Reimbursement Health
                      </h4>
                      <span className="text-xs text-slate-400">Default Weight: 25% | Maximum Points: 25</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                    25% Weight
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-300 space-y-2 pl-12">
                  <p>
                    Tracks CMS Medicare Part B ambulance claims volume, transport revenue, and denial percentages. High denial rates identify immediate opportunities for ZOLL Billing and automated ePCR medical necessity validation.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Denial Rate ≥ 22%</span>
                      <strong className="text-emerald-400">100 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Denial Rate ≥ 18–22%</span>
                      <strong className="text-teal-400">85 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Denial Rate ≥ 15–18%</span>
                      <strong className="text-blue-400">65 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Denial Rate &lt; 15%</span>
                      <strong className="text-slate-400">40 / 100 pts</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Pillar 3: Procurement Activity & Capital Cycles
                      </h4>
                      <span className="text-xs text-slate-400">Default Weight: 20% | Maximum Points: 20</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-md">
                    20% Weight
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-300 space-y-2 pl-12">
                  <p>
                    Analyzes capital budget cycles, federal FEMA Assistance to Firefighters Grants (AFG), SAFER funding, state trauma grants, and published municipal RFP procurement activity.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Active AFG / Bond Award</span>
                      <strong className="text-purple-400">100 / 100 pts (Awarded)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Active SAFER / State Grant</span>
                      <strong className="text-purple-300">65 / 100 pts (Active)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fiscal Cycle Eligible</span>
                      <strong className="text-slate-400">30 / 100 pts (Eligible)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Pillar 4: Clinical Outcomes & Resuscitation Quality
                      </h4>
                      <span className="text-xs text-slate-400">Default Weight: 15% | Maximum Points: 15</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-md">
                    15% Weight
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-300 space-y-2 pl-12">
                  <p>
                    Measures annual Out-of-Hospital Cardiac Arrest (OHCA) encounters, Utstein survival rates, and high-acuity resuscitation call volumes from CARES/NEMSIS registry telemetry. High clinical demand creates pressing clinical justification for Real CPR Help® and See-Thru CPR®.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">OHCA Volume ≥ 1,800</span>
                      <strong className="text-rose-400">100 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">OHCA Volume ≥ 1,000</span>
                      <strong className="text-pink-400">85 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">OHCA Volume ≥ 500</span>
                      <strong className="text-indigo-400">70 / 100 pts</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Baseline Volume</span>
                      <strong className="text-slate-400">50 / 100 pts</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Pillar 5: Engagement History & Account Readiness
                      </h4>
                      <span className="text-xs text-slate-400">Default Weight: 10% | Maximum Points: 10</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
                    10% Weight
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-300 space-y-2 pl-12">
                  <p>
                    Evaluates relationship history, field rep visits, clinical evaluation trials, RFP specification downloads, and software dispatch whitespace. Accounts with active evaluation momentum or legacy competitor CAD/ePCR represent prime conversion targets.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Active Demo / Evaluation</span>
                      <strong className="text-cyan-400">100 / 100 pts (Accelerated)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Recent Visit / Contact</span>
                      <strong className="text-cyan-300">75 / 100 pts (In Progress)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Uncontacted Prospect</span>
                      <strong className="text-slate-400">40 / 100 pts (Outreach Required)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Field Prioritization Workflow
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  How Nick and sales territory managers turn PulseIQ numbers into closed business:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Filter for Tier 1 Accounts (Score &ge; 88) in Your County
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Use the Lead Queue or Geographic Filter to isolate Tier 1 accounts. Sort by Fleet Age descending. These agencies have aging competitor devices with expiring repair warranties.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Check Grant & Procurement Status
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Open Account 360 &rarr; Grants & Capital. If a FEMA AFG grant has been awarded, the agency has a strict 12-month period of performance to obligate funds. Lead with product specifications that match federal bid requirements.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Arm Your Pitch with Reimbursement Recovery
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      If the account has an elevated Medicare Part B denial rate (&ge; 18%), present the ZOLL Billing / ePCR clinical documentation package. Show the Chief and Fiscal Director how automated ECG transmission and narrative validation reduces billing rejection rates.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Log Field Visit & Generate Brief
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Before walking into headquarters, generate the 1-Page Account Dossier directly from Account 360. Log meeting notes, competitive equipment serial numbers, and update the Sales Stage to &ldquo;Evaluation / Demo Scheduled&rdquo;.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROVENANCE */}
          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Primary Public Records & Statutory Citations
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every data attribute behind PulseIQ is verified against authoritative government databases and public state regulatory bodies:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    CMS Part B Ambulance Claims File
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Annual Medicare fee-for-service carrier data detailing allowed vs. non-allowed transport claims, denial percentages, and emergency ALS/BLS service ratios.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    FEMA Assistance to Firefighters Grants
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Federal Emergency Management Agency AFG and SAFER award public disclosures including federal share, grant activity type, and congressional district tracking.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    IDPH & State EMS Licensing Rosters
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    State Department of Public Health regulatory rosters confirming operating level (Paramedic, AEMT, Basic), ambulance fleet count, and primary service territory.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    CARES / NEMSIS Registry Telemetry
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    National and regional cardiac arrest benchmarking data quantifying out-of-hospital resuscitation volume and shockable rhythm response rates.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-slate-300">
                <span className="font-semibold text-cyan-300 block mb-1">Illinois FOIA & Municipal Transparency Compliance</span>
                All apparatus serial numbers, warranty expirations, and board meeting minutes are compiled pursuant to the Illinois Freedom of Information Act (5 ILCS 140/) and published municipal purchasing registries.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PulseIQ Algorithm v3.4 Active &bull; Fully Deterministic</span>
          </div>
          <div className="flex items-center gap-3">
            {handleOpenCalibration && (
              <button
                onClick={() => {
                  onClose();
                  handleOpenCalibration();
                }}
                className="px-4 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                Adjust Weights
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
