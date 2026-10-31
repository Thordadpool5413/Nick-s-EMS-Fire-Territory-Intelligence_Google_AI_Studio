/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agency } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  DollarSign, 
  HeartPulse, 
  Wrench, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Phone, 
  Mail,
  ArrowRight
} from 'lucide-react';

interface BuyingCommitteeMapProps {
  agency: Agency;
  onOpenCoopMemo?: () => void;
  className?: string;
}

type SentimentStatus = 'Champion' | 'Supportive' | 'Uncontacted' | 'Skeptical';

interface Stakeholder {
  id: string;
  roleType: 'Economic Buyer' | 'Clinical Champion' | 'Technical Buyer' | 'End-User Champion';
  icon: typeof DollarSign;
  name: string;
  title: string;
  focus: string;
  concern: string;
  pitchHook: string;
  defaultSentiment: SentimentStatus;
}

export const BuyingCommitteeMap: React.FC<BuyingCommitteeMapProps> = ({
  agency,
  onOpenCoopMemo,
  className = ''
}) => {
  const isFire = agency.providerCategory === 'FIRE' || agency.agencyType.toLowerCase().includes('fire');
  const chief = agency.keyContacts?.find(c => c.title.toLowerCase().includes('chief')) || agency.keyContacts?.[0];
  const medDir = agency.keyContacts?.find(c => c.title.toLowerCase().includes('medical director') || c.role.toLowerCase().includes('medical director'));

  const initialStakeholders: Stakeholder[] = [
    {
      id: 'stakeholder-economic',
      roleType: 'Economic Buyer',
      icon: DollarSign,
      name: `${agency.city} City Administration / District Board`,
      title: 'City Manager & Finance Director',
      focus: 'Capital Expenditure & 5-Year Operating TCO',
      concern: 'Avoiding unbudgeted municipal general fund appropriations and lengthy public RFP costs',
      pitchHook: `Sourcewell #041823-ZOL cooperative procurement legally bypasses sealed bid cycles while securing $3,500/unit trade-in equity.`,
      defaultSentiment: 'Supportive'
    },
    {
      id: 'stakeholder-clinical',
      roleType: 'Clinical Champion',
      icon: HeartPulse,
      name: medDir?.name || 'Dr. Robert Vance, MD, FACEP',
      title: medDir?.title || 'Operational Medical Director',
      focus: 'Utstein Resuscitation Survival & Ventilation Guidance',
      concern: 'High chest compression fraction (CCF >80%) and eliminating paramedic hyperventilation',
      pitchHook: 'Real BVM Help® provides real-time breath volume & rate guidance on every arrest, increasing neurological survival.',
      defaultSentiment: 'Champion'
    },
    {
      id: 'stakeholder-technical',
      roleType: 'Technical Buyer',
      icon: Wrench,
      name: chief?.name || (isFire ? 'Assistant Chief of Operations' : 'EMS Logistics Captain'),
      title: chief?.title || (isFire ? 'Division Chief of EMS' : 'Fleet & Logistics Commander'),
      focus: 'Battery Reliability, Ruggedness & Biomedical Calibration',
      concern: 'Maintenance contract price hikes on retiring monitors and battery lifecycle management',
      pitchHook: 'SurePower™ smart battery management reduces replacement battery waste by 40% with unified 11.7 lb chassis.',
      defaultSentiment: 'Supportive'
    },
    {
      id: 'stakeholder-enduser',
      roleType: 'End-User Champion',
      icon: Users,
      name: 'Station Paramedics & Lieutenants',
      title: `A/B/C Shift Field Crews (${agency.stationsCount} Stations)`,
      focus: 'Screen Glare, Weight & Ease of Use Under Stress',
      concern: 'Carrying heavy 18+ lb monitors up high-rise stairs and complex multi-layered menu knobs',
      pitchHook: '37% lighter weight (11.7 lbs), transflective display readable in direct sunlight, and intuitive Touch, Turn & Confirm navigation.',
      defaultSentiment: 'Uncontacted'
    }
  ];

  const [sentiments, setSentiments] = useState<Record<string, SentimentStatus>>({
    'stakeholder-economic': 'Supportive',
    'stakeholder-clinical': 'Champion',
    'stakeholder-technical': 'Supportive',
    'stakeholder-enduser': 'Uncontacted'
  });

  const getSentimentBadge = (status: SentimentStatus) => {
    switch (status) {
      case 'Champion':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Supportive':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Uncontacted':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'Skeptical':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
  };

  const cycleSentiment = (id: string) => {
    const sequence: SentimentStatus[] = ['Champion', 'Supportive', 'Uncontacted', 'Skeptical'];
    const current = sentiments[id] || 'Uncontacted';
    const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
    setSentiments(prev => ({ ...prev, [id]: sequence[nextIdx] }));
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111C2D] border border-[#DFE6EF] dark:border-[#1E2D42] shadow-sm space-y-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE6EF] dark:border-[#1E2D42] pb-4">
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#285EE8] dark:text-blue-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#285EE8]" />
            <span>Procurement Governance &amp; Stakeholder Alignment</span>
          </div>
          <h3 className="text-lg font-bold text-[#14283F] dark:text-white mt-0.5">
            Buying Committee Org Map
          </h3>
          <p className="text-xs text-[#53657B] dark:text-slate-400 mt-0.5">
            Multi-threaded relationship mapping across the 4 key decision roles required for municipal monitor replacement.
          </p>
        </div>

        {onOpenCoopMemo && (
          <button
            type="button"
            onClick={onOpenCoopMemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#285EE8] hover:bg-[#194BC8] text-white text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Co-Op Memo</span>
          </button>
        )}
      </div>

      {/* 4 Stakeholder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialStakeholders.map((s) => {
          const Icon = s.icon;
          const currentSentiment = sentiments[s.id] || s.defaultSentiment;

          return (
            <div 
              key={s.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#16243A] border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#111C2D] border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      {s.roleType}
                    </span>
                    <h4 className="text-sm font-bold text-[#14283F] dark:text-white truncate">
                      {s.name}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => cycleSentiment(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer shadow-2xs ${getSentimentBadge(currentSentiment)}`}
                  title="Click to update stakeholder engagement sentiment"
                >
                  {currentSentiment} ↻
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Primary Focus:</strong> {s.focus}
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Key Concern:</strong> {s.concern}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200">
                <strong>Tailored Messaging:</strong> {s.pitchHook}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
