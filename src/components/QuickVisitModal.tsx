/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { Agency, FieldNote } from '../types';
import { X, Send, Calendar, Building2, User, Search, CheckCircle2 } from 'lucide-react';

interface QuickVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  onAddFieldNote: (agencyId: string, note: Omit<FieldNote, 'id'>) => void;
  isOnline: boolean;
}

export const QuickVisitModal: React.FC<QuickVisitModalProps> = ({
  isOpen,
  onClose,
  agencies,
  onAddFieldNote,
  isOnline
}) => {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [meetingType, setMeetingType] = useState<FieldNote['meetingType']>('On-Site Station Visit');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('Deliver trial evaluation units');
  const [dueDate, setDueDate] = useState('2026-10-29');

  // Sync initial agency selection when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!selectedAgencyId && agencies.length > 0) {
        setSelectedAgencyId(agencies[0].id);
      }
      setSearchFilter('');
    }
  }, [isOpen, agencies, selectedAgencyId]);

  const modalCardRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside the card or pressing Escape
  useClickOutside(modalCardRef, onClose, { enabled: isOpen, closeOnEscape: true });

  // Fast search filter with hard limit of 25 items so DOM never freezes or locks up
  const filteredAgencies = useMemo(() => {
    if (!searchFilter.trim()) {
      return agencies.slice(0, 20);
    }
    const q = searchFilter.toLowerCase().trim();
    const results: Agency[] = [];
    for (let i = 0; i < agencies.length; i++) {
      const a = agencies[i];
      if (
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.county && a.county.toLowerCase().includes(q)) ||
        a.stateCode.toLowerCase() === q
      ) {
        results.push(a);
        if (results.length >= 25) break;
      }
    }
    return results;
  }, [agencies, searchFilter]);

  const activeAgency = useMemo(() => {
    return agencies.find(a => a.id === selectedAgencyId) || filteredAgencies[0] || agencies[0];
  }, [agencies, selectedAgencyId, filteredAgencies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedAgencyId || activeAgency?.id;
    if (!targetId || !notes.trim()) return;

    onAddFieldNote(targetId, {
      date: new Date().toISOString().split('T')[0],
      repName: 'Territory Account Manager',
      meetingType,
      notes: notes.trim(),
      nextAction: nextAction.trim(),
      dueDate
    });

    setNotes('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100"
    >
      <div 
        ref={modalCardRef}
        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-bold">Log Field Visit Record</h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isOnline && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-mono">
            Offline Mode: Record will be stored locally and queued in outbox.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Target Account Selector with Search */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">
              Target Account / Agency
            </label>
            
            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search department, city, county, or state..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Curated Dropdown with max 25 items to prevent DOM freezing */}
            <select
              value={selectedAgencyId || activeAgency?.id || ''}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
            >
              {activeAgency && !filteredAgencies.some(a => a.id === activeAgency.id) && (
                <option value={activeAgency.id}>
                  {activeAgency.name} ({activeAgency.city}, {activeAgency.stateCode}) · Score {activeAgency.zollOpportunity?.pulseIqScore ?? 80}
                </option>
              )}
              {filteredAgencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.city}, {a.stateCode}) · Score {a.zollOpportunity?.pulseIqScore ?? 80}
                </option>
              ))}
            </select>
            {searchFilter.trim() && (
              <span className="text-[10px] text-slate-500">
                Showing top {filteredAgencies.length} matching departments
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Interaction Type</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="On-Site Station Visit">On-Site Station Visit</option>
                <option value="Virtual Demo">Virtual Demo</option>
                <option value="Phone Call">Phone Call</option>
                <option value="RFP Review">RFP Review</option>
                <option value="Ride-Along">Ride-Along</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Follow-Up Target Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Meeting Notes &amp; Customer Feedback</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spoke with EMS Battalion Chief. Demoed Real BVM Help and reviewed CMS denial rates..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Immediate Next Action</label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g., Deliver evaluation units to Station 2"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[38px] px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save &amp; Log Visit</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
