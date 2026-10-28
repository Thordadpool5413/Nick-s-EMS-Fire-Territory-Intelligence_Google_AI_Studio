/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { HelpCircle, MessageSquareQuote, ShieldCheck, X } from 'lucide-react';
import { DOMAIN_GLOSSARY, DomainGlossaryEntry } from '../data/domainGlossary';
import { useClickOutside } from '../hooks/useClickOutside';

interface TermTooltipProps {
  termKey: keyof typeof DOMAIN_GLOSSARY;
  label?: string;
  className?: string;
}

export const TermTooltip: React.FC<TermTooltipProps> = ({
  termKey,
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), {
    enabled: isOpen,
    closeOnEscape: true
  });

  const entry: DomainGlossaryEntry | undefined = DOMAIN_GLOSSARY[termKey];
  if (!entry) {
    return <span>{label || termKey}</span>;
  }

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 align-baseline ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-1 border-b border-dotted border-slate-400 dark:border-slate-500 hover:border-[#1E3A8A] dark:hover:border-blue-400 text-inherit cursor-pointer transition-colors group"
        aria-expanded={isOpen}
        title={`What is ${entry.shortLabel}? Click or hover for plain-English guide`}
      >
        {label !== undefined ? (
          <span>{label}</span>
        ) : (
          <span>{entry.shortLabel}</span>
        )}
        <HelpCircle className="w-3 h-3 text-slate-400 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 shrink-0 transition-colors" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={entry.term}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50 text-left font-sans normal-case tracking-normal animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400">
                {entry.category}
              </span>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {entry.term}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close definition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500">
                In Plain English
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5 font-normal">
                {entry.plainEnglish}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
              <div className="text-[10px] font-mono uppercase font-bold text-[#1E3A8A] dark:text-blue-400 flex items-center gap-1">
                <MessageSquareQuote className="w-3 h-3 shrink-0" />
                <span>How to Use This on a Call</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug mt-1 font-normal">
                {entry.whyItMattersToRep}
              </p>
            </div>

            {entry.officialSource && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Source: {entry.officialSource}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
};
