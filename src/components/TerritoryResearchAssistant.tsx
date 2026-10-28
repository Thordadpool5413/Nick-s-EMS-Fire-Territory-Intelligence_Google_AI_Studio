/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, Loader2, MapPinned, Send, ShieldAlert, X } from 'lucide-react';
import type { Agency } from '../types';

type Mode = 'clinical' | 'procurement' | 'billing' | 'places';
type Message = { role: 'user' | 'assistant'; content: string; links?: Array<{ title: string; uri: string }> };

interface Props {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  activeAgency?: Agency | null;
  onSelectAgency?: (agency: Agency) => void;
}

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'clinical', label: 'Clinical' },
  { id: 'procurement', label: 'Purchasing' },
  { id: 'billing', label: 'Billing' },
  { id: 'places', label: 'Nearby facilities' }
];

export const TerritoryResearchAssistant: React.FC<Props> = ({ isOpen, onOpen, onClose, activeAgency }) => {
  const [mode, setMode] = useState<Mode>('clinical');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Research desk ready. Ask about a selected account, equipment, reimbursement or procurement. Generated strategy is backed by live federal datasets.'
  }]);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setErrorMessage('');
    const userMessage: Message = { role: 'user', content: message };
    const next = [...messages, userMessage];
    setMessages(next);
    setBusy(true);

    try {
      if (mode === 'places') {
        const res = await fetch('/api/gemini/maps-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: message,
            city: activeAgency?.city || '',
            state: activeAgency?.stateCode || ''
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Search failed with status ${res.status}`);
        }
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.text || data.content || 'Facility search complete.',
          links: data.mapsLinks || []
        }]);
      } else {
        const instructions: Record<Exclude<Mode, 'places'>, string> = {
          clinical: 'Use established clinical evidence, and distinguish outcomes from estimates.',
          procurement: 'Analyze RFPs, budgets and public records. Focus on official municipal procurement channels.',
          billing: 'Explain CMS payment policy, NEMSIS 3.5 compliance, and ground ambulance denial prevention.'
        };

        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: next.map(m => ({ role: m.role, content: m.content })),
            agencyContext: activeAgency || undefined,
            systemInstruction: instructions[mode]
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Request failed with status ${res.status}`);
        }

        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content || data.reply || 'Strategy analysis ready.'
        }]);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Assistant request failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="fixed right-4 bottom-20 z-40 rounded-full bg-slate-950 text-white shadow-xl border border-blue-500/30 px-4 py-3 text-sm font-semibold cursor-pointer"
      >
        <Bot className="inline-block w-4 h-4 mr-2" /> Research desk
      </button>
    );
  }

  return (
    <aside
      aria-label="Territory research assistant"
      role="dialog"
      aria-modal="false"
      className="fixed inset-0 sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[440px] z-[80] bg-white dark:bg-[#0c1526] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-none sm:rounded-2xl flex flex-col overflow-hidden"
    >
      <header className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-start gap-4">
        <div>
          <div className="text-xs tracking-widest uppercase text-blue-300 font-bold">Territory Intelligence</div>
          <h2 className="text-lg font-bold mt-1">Research Strategy Desk</h2>
          <p className="text-xs text-slate-300 mt-1">{activeAgency ? activeAgency.name : 'National EMS & Fire research'}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close research"
          className="p-2 rounded-lg hover:bg-white/15 cursor-pointer text-slate-300 hover:text-white"
        >
          <X size={19} />
        </button>
      </header>

      <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-700">
        {MODES.map(m => (
          <button
            type="button"
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-1 py-3 text-[11px] font-semibold cursor-pointer transition-colors ${
              mode === m.id
                ? 'border-b-2 border-blue-600 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-xl p-3 max-w-[95%] text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-100 text-slate-800'
              }`}
            >
              {m.content}
              {m.links?.map((l, j) => (
                <a
                  key={j}
                  className="block text-blue-700 dark:text-blue-300 underline mt-2 break-words"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={l.uri}
                >
                  <MapPinned className="inline w-4 h-4 mr-1" /> {l.title} <ExternalLink className="inline w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        ))}
        {busy && (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Preparing research strategy...</span>
          </p>
        )}
        <div ref={endRef} />
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs text-rose-700 dark:text-rose-400 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900">
          {errorMessage}
        </p>
      )}

      <form onSubmit={send} className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-[#0c1526]">
        <label htmlFor="territory-research-question" className="sr-only">Research question</label>
        <div className="flex gap-2">
          <textarea
            id="territory-research-question"
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about clinical opportunities, public procurement, or an agency..."
            className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send research question"
            className="rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 cursor-pointer transition-colors"
          >
            <Send size={17} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex gap-1 items-start">
          <ShieldAlert size={14} className="shrink-0 text-amber-500 mt-0.5" />
          <span>AI interpretations and insights require independent source verification against public records.</span>
        </p>
      </form>
    </aside>
  );
};
