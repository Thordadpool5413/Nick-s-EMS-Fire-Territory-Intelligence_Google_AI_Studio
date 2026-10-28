/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  GripHorizontal, 
  Copy, 
  Check, 
  Send, 
  Loader2, 
  MapPinned, 
  ExternalLink, 
  ShieldAlert, 
  Building2, 
  ChevronUp, 
  FileText, 
  Stethoscope, 
  DollarSign, 
  MapPin, 
  CornerDownLeft,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import type { Agency } from '../types';

type Mode = 'clinical' | 'procurement' | 'billing' | 'places';
type Message = { 
  role: 'user' | 'assistant'; 
  content: string; 
  links?: Array<{ title: string; uri: string; snippets?: string[] }>;
  timestamp?: string;
};

interface Props {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  activeAgency?: Agency | null;
  onSelectAgency?: (agency: Agency) => void;
}

const MODES: Array<{ id: Mode; label: string; icon: React.FC<{ className?: string }>; description: string }> = [
  { id: 'clinical', label: 'Clinical', icon: Stethoscope, description: 'Utstein survival, Real CPR Help, STEMI, TBI outcomes' },
  { id: 'procurement', label: 'Purchasing', icon: FileText, description: 'RFP specifications, sole-source justification, FEMA AFG' },
  { id: 'billing', label: 'Billing & CMS', icon: DollarSign, description: 'Medicare denial recovery, NEMSIS 3.5, ground ambulance reimbursement' },
  { id: 'places', label: 'Facilities', icon: MapPin, description: 'Google Maps verified cath labs, trauma centers & stations' }
];

const PROMPT_SUGGESTIONS: Record<Mode, string[]> = {
  clinical: [
    "What clinical evidence differentiates ZOLL X Series Advanced from Stryker LP15/LP35?",
    "Summarize the EPIC trial traumatic brain injury (TBI) guidelines for prehospital ventilation.",
    "Explain how See-Thru CPR and Real CPR Help improve Chest Compression Fraction (CCF)."
  ],
  procurement: [
    "Draft a sole-source justification outline for ZOLL defibrillators to present to the Fire Chief.",
    "What federal FEMA Assistance to Firefighters Grants (AFG) criteria apply to monitor replacements?",
    "Generate key RFP technical specifications for dual-stream telemetry and 12-lead transmission."
  ],
  billing: [
    "Explain CMS Medicare Part B ground ambulance claim denials and CO-16 recovery strategy.",
    "How does NEMSIS v3.5 ePCR compliance prevent transport payment delays?",
    "What is the average Medicare allowed reimbursement for ALS emergency ground transport?"
  ],
  places: [
    "Find Level 1 and Level 2 Emergency Trauma Centers near this department.",
    "Locate 24/7 Cardiac Interventional Cath Labs equipped for STEMI alerts.",
    "Find neighboring municipal fire stations and emergency dispatch bases."
  ]
};

// Formats Markdown-like text into structured, clean typography
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Heading Level 3 (###)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-slate-900 dark:text-white text-sm sm:text-base pt-1 pb-0.5 border-b border-slate-200 dark:border-slate-800">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        // Heading Level 2 (##)
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 dark:text-white text-base sm:text-lg pt-2 pb-0.5 border-b border-slate-200 dark:border-slate-800">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                {renderInlineFormatting(bulletContent)}
              </div>
            </div>
          );
        }

        // Numbered list item
        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[18px] shrink-0">
                  {match[1]}.
                </span>
                <div className="flex-1">
                  {renderInlineFormatting(match[2])}
                </div>
              </div>
            );
          }
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Regular paragraph line
        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Parses bold text (**text**) and code (`code`)
function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-blue-700 dark:text-blue-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const TerritoryResearchAssistant: React.FC<Props> = ({ 
  isOpen, 
  onOpen, 
  onClose, 
  activeAgency 
}) => {
  const [mode, setMode] = useState<Mode>('clinical');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Strategic territory research desk ready. Ask about clinical trials, competitor displacement, municipal RFP specifications, or Medicare ambulance billing reimbursement.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Position state for dragging (null = default bottom-right docked)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const windowRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Dragging
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (isMaximized || !windowRef.current) return;
    const rect = windowRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: rect.left,
      startY: rect.top
    };
    setIsDragging(true);
  }, [isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.startX + deltaX;
      const newY = dragStartRef.current.startY + deltaY;

      const elWidth = windowRef.current?.offsetWidth || 480;
      const elHeight = windowRef.current?.offsetHeight || 620;
      const clampedX = Math.max(12, Math.min(window.innerWidth - elWidth - 12, newX));
      const clampedY = Math.max(12, Math.min(window.innerHeight - elHeight - 12, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - dragStartRef.current.mouseX;
      const deltaY = e.touches[0].clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.startX + deltaX;
      const newY = dragStartRef.current.startY + deltaY;

      const elWidth = windowRef.current?.offsetWidth || 480;
      const elHeight = windowRef.current?.offsetHeight || 620;
      const clampedX = Math.max(12, Math.min(window.innerWidth - elWidth - 12, newX));
      const clampedY = Math.max(12, Math.min(window.innerHeight - elHeight - 12, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Reset to default docked position
  const handleResetPosition = () => {
    setPosition(null);
    setIsMaximized(false);
  };

  // Copy message text
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation history reset. Ready for your next clinical, procurement, or reimbursement inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMessage('');
  };

  // Submit Question
  const executeQuery = async (queryText: string) => {
    const message = queryText.trim();
    if (!message || busy) return;
    setInput('');
    setErrorMessage('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { role: 'user', content: message, timestamp: time };
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
            state: activeAgency?.stateCode || '',
            latitude: activeAgency?.latitude,
            longitude: activeAgency?.longitude
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Search failed with status ${res.status}`);
        }

        const data = await res.json();
        setMessages(prev => [
          ...prev, 
          {
            role: 'assistant',
            content: data.text || data.content || 'Facility search complete.',
            links: data.mapsLinks || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const instructions: Record<Exclude<Mode, 'places'>, string> = {
          clinical: 'Provide authoritative clinical guidance on cardiac resuscitation, chest compression fraction (CCF), Real CPR Help, See-Thru CPR, STEMI 12-lead transmission, and prehospital traumatic brain injury (TBI) protocols. Differentiate clinical evidence from conjecture.',
          procurement: 'Advise on municipal fire department and EMS procurement procedures, sole-source specifications, pre-emptive RFP criteria, and federal FEMA Assistance to Firefighters Grants (AFG). Help territory sales reps craft compelling proposals.',
          billing: 'Analyze CMS Medicare Part B ground ambulance claims, allowable fee schedules, denial mitigation (CO-16), NEMSIS v3.5 ePCR compliance, and revenue recovery.'
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
        setMessages(prev => [
          ...prev, 
          {
            role: 'assistant',
            content: data.content || data.reply || 'Strategy analysis ready.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Assistant request failed.');
    } finally {
      setBusy(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(input);
  };

  // Closed State: Sleek Floating Action Trigger
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open Territory Strategy Desk"
        className="fixed right-4 sm:right-6 bottom-20 md:bottom-8 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0A1322] dark:bg-[#0E1B2E] text-white border border-[#1E3A5F] shadow-2xl hover:border-blue-500 hover:shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#285EE8]" />
        </span>
        <div className="text-left">
          <span className="text-xs font-bold block tracking-wide">Strategy &amp; RFP Desk</span>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Gemini 3.8 Flash AI</span>
        </div>
        <Sparkles className="w-4 h-4 text-blue-400 ml-1 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  // Minimized Floating Pill State (Movable and Expandable)
  if (isMinimized) {
    const minStyle: React.CSSProperties = position
      ? { left: `${position.x}px`, top: `${position.y}px`, position: 'fixed' }
      : { right: '16px', bottom: '24px', position: 'fixed' };

    return (
      <div
        ref={windowRef}
        style={minStyle}
        className="z-[90] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0A1322] dark:bg-[#0E1B2E] text-white border border-[#1E3A5F] shadow-2xl backdrop-blur-md select-none cursor-grab active:cursor-grabbing animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <GripHorizontal className="w-4 h-4 text-slate-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
        >
          <span>Territory Strategy Desk ({messages.length})</span>
          <ChevronUp className="w-4 h-4 text-blue-400" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Assistant"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // Window Style computation (Movable or Docked)
  const windowStyle: React.CSSProperties = isMaximized
    ? { 
        position: 'fixed', 
        top: '12px', 
        left: '12px', 
        right: '12px', 
        bottom: '12px', 
        width: 'auto', 
        height: 'auto', 
        zIndex: 100 
      }
    : position
      ? { 
          position: 'fixed', 
          left: `${position.x}px`, 
          top: `${position.y}px`, 
          width: 'min(480px, calc(100vw - 16px))', 
          height: 'min(640px, calc(100vh - 80px))', 
          zIndex: 100 
        }
      : { 
          position: 'fixed', 
          right: typeof window !== 'undefined' && window.innerWidth < 640 ? '8px' : '20px', 
          bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? '72px' : '24px', 
          width: 'min(480px, calc(100vw - 16px))', 
          height: 'min(640px, calc(100vh - 88px))', 
          zIndex: 100 
        };

  return (
    <aside
      ref={windowRef}
      style={windowStyle}
      aria-label="Territory Research & Strategy Assistant"
      role="dialog"
      aria-modal="false"
      className={`bg-white dark:bg-[#0A1322] border border-slate-200 dark:border-[#1E3A5F] shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-shadow ${
        isDragging ? 'shadow-blue-500/40 ring-2 ring-[#285EE8]' : ''
      }`}
    >
      {/* ====================================================================
          DRAGGABLE HEADER
         ==================================================================== */}
      <header
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="px-3.5 sm:px-4 py-3 bg-[#0A1322] text-white border-b border-[#172D49] flex items-center justify-between gap-2 sm:gap-3 select-none cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                Strategy &amp; RFP Desk
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="Gemini 3.8 Connected" />
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                <GripHorizontal className="w-3 h-3 text-slate-300" />
                <span>Move</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <span>{activeAgency ? activeAgency.name : 'National EMS & Fire Intelligence'}</span>
            </p>
          </div>
        </div>

        {/* Window Controls (Move / Flip Side, Dock, Reset, Minimize, Maximize, Close) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick 1-Click Flip Side (Move to Left / Right side) */}
          {!isMaximized && (
            <button
              type="button"
              onClick={() => {
                if (!position || position.x > (window.innerWidth / 2)) {
                  // Currently on right half -> snap to left
                  setPosition({ x: 16, y: Math.max(16, window.innerHeight - 660) });
                } else {
                  // Currently on left half -> snap to right
                  setPosition({ x: Math.max(16, window.innerWidth - 496), y: Math.max(16, window.innerHeight - 660) });
                }
              }}
              title="Move window to opposite side of screen (Left / Right)"
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border border-white/10"
            >
              <ArrowLeftRight size={13} className="text-blue-400" />
              <span className="hidden sm:inline">Flip</span>
            </button>
          )}

          {position && !isMaximized && (
            <button
              type="button"
              onClick={handleResetPosition}
              title="Dock back to bottom-right default position"
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 text-xs font-mono transition-colors cursor-pointer border border-white/10"
            >
              Dock
            </button>
          )}

          <button
            type="button"
            onClick={handleClearChat}
            title="Reset conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize assistant to bottom bar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Minus size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(prev => !prev)}
            title={isMaximized ? "Restore size" : "Maximize window"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-flex"
          >
            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Research Desk"
            title="Close Assistant (Esc)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-rose-600/30 hover:border-rose-500/40 border border-transparent transition-colors cursor-pointer ml-0.5"
          >
            <X size={18} className="text-slate-200 hover:text-rose-200" />
          </button>
        </div>
      </header>

      {/* Target Agency Context Ribbon */}
      {activeAgency && (
        <div className="px-3.5 py-1.5 bg-[#0E1E36] border-b border-[#172D49] flex items-center justify-between gap-2 text-[11px] text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-semibold text-white truncate">{activeAgency.name}</span>
            <span className="text-slate-500">·</span>
            <span>{activeAgency.city}, {activeAgency.stateCode}</span>
            {activeAgency.installedFleet && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-amber-300 font-mono text-[10px]">
                  Fleet: {activeAgency.installedFleet.defibUnitsCount}× {activeAgency.installedFleet.defibBrand} ({activeAgency.installedFleet.defibAgeYears}y)
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
            In Scope
          </span>
        </div>
      )}

      {/* Segmented Mode Bar */}
      <div className="grid grid-cols-4 border-b border-slate-200 dark:border-[#172D49] bg-slate-50 dark:bg-[#070D18] shrink-0">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.description}
              className={`py-2 px-1 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                isActive
                  ? 'border-[#285EE8] text-[#285EE8] dark:text-blue-400 bg-white dark:bg-[#0A1322]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Stream */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#080F1D] min-h-0" 
        aria-live="polite"
      >
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={i} 
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Message Header (Role + Timestamp) */}
              <div className="flex items-center gap-2 mb-1 px-1">
                {!isUser ? (
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                    <span>Territory Intelligence AI</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    You
                  </span>
                )}
                {m.timestamp && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {m.timestamp}
                  </span>
                )}
              </div>

              {/* Message Body */}
              <div
                className={`relative rounded-2xl p-3.5 max-w-[92%] sm:max-w-[85%] shadow-xs ${
                  isUser
                    ? 'bg-[#285EE8] text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-[#0E1A2D] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#1E3A5F] rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                    {m.content}
                  </p>
                ) : (
                  <FormattedMessage content={m.content} />
                )}

                {/* Grounding Facility Links (for Places mode) */}
                {m.links && m.links.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Verified Google Maps Locations:
                    </span>
                    {m.links.map((link, linkIdx) => (
                      <a
                        key={linkIdx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#091322] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:border-blue-500 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPinned className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{link.title}</span>
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Copy to Clipboard Button (Assistant messages) */}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleCopy(m.content, i)}
                    title="Copy response to clipboard"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {busy && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-[#0E1A2D] border border-slate-200 dark:border-[#1E3A5F] w-fit text-xs text-slate-600 dark:text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-[#285EE8]" />
            <span>Analyzing territory records &amp; clinical data...</span>
          </div>
        )}

        {/* Prompt Suggestions when chat has only greeting */}
        {messages.length === 1 && !busy && (
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
              Suggested {MODES.find(m => m.id === mode)?.label} Questions:
            </span>
            <div className="space-y-1.5">
              {PROMPT_SUGGESTIONS[mode]?.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => executeQuery(prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-[#172D49] bg-slate-50 dark:bg-[#0B1526] hover:border-[#285EE8] dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div role="alert" className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={15} className="text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </span>
          <button 
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================
          INPUT DOCK
         ==================================================================== */}
      <form 
        onSubmit={send} 
        className="border-t border-slate-200 dark:border-[#172D49] p-3 sm:p-3.5 bg-white dark:bg-[#0A1322] shrink-0"
      >
        <div className="flex gap-2 items-end">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                executeQuery(input);
              }
            }}
            placeholder={`Ask ${MODES.find(m => m.id === mode)?.label.toLowerCase()} intelligence question... (Enter to send)`}
            className="flex-1 min-w-0 resize-none rounded-xl p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#070D18] dark:text-white border border-slate-300 dark:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#285EE8] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send inquiry"
            className="h-10 px-4 rounded-xl bg-[#285EE8] hover:bg-[#194BC8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={15} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Drag header to move anywhere</span>
          </span>
          <span className="font-mono text-[10px]">Esc to close</span>
        </div>
      </form>
    </aside>
  );
};
