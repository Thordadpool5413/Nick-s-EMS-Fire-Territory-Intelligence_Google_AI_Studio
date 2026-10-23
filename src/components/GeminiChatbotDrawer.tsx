/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MapPin, 
  X, 
  ExternalLink, 
  RotateCcw, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Activity,
  Flame,
  Siren,
  GripHorizontal,
  Minimize2,
  Maximize2,
  PanelRight,
  AppWindow,
  Briefcase,
  Move
} from 'lucide-react';
import { Agency } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  mapsLinks?: Array<{
    title: string;
    uri: string;
    snippets?: string[];
  }>;
  isGrounding?: boolean;
}

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  activeAgency?: Agency | null;
  onSelectAgency?: (agency: Agency) => void;
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  activeAgency,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Clinical & Procurement Strategy Desk ready. Select a briefing module below or enter a territory inquiry:

• Competitive Fleet Displacement: Clinical and biomedical comparisons against Stryker LIFEPAK 15 and Philips HeartStart MRx.
• Pre-Emptive Procurement Specs: Technical RFP requirements for Real CPR Help, See-Thru CPR, and AutoPulse CCF benchmarks.
• Payer & CMS Denial Recovery: Revenue recovery calculations for Medicare CO-16 documentation denials and NEMSIS 3.5 compliance.
• Regional Trauma & Cath Lab Verification: Live geographic lookup of Level 1/2 trauma centers, PCI receiving hospitals, and station locations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [activePersona, setActivePersona] = useState<'clinical' | 'rfp' | 'billing' | 'maps'>('clinical');

  // Window layout modes: floating movable window vs docked side panel vs minimized bar
  const [windowMode, setWindowMode] = useState<'floating' | 'docked'>('floating');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLauncherDismissed, setIsLauncherDismissed] = useState(true);

  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(24, window.innerWidth - 520) : 400,
    y: typeof window !== 'undefined' ? Math.max(72, window.innerHeight - 660) : 96,
  }));
  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 230) : 300,
    y: typeof window !== 'undefined' ? Math.max(72, window.innerHeight - 76) : 500,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLauncher, setIsDraggingLauncher] = useState(false);
  const launcherMovedRef = useRef(false);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Keep floating window and launcher within viewport on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(12, prev.x), Math.max(12, window.innerWidth - 360)),
        y: Math.min(Math.max(60, prev.y), Math.max(60, window.innerHeight - 120)),
      }));
      setLauncherPos((prev) => ({
        x: Math.min(Math.max(12, prev.x), Math.max(12, window.innerWidth - 220)),
        y: Math.min(Math.max(60, prev.y), Math.max(60, window.innerHeight - 68)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handlers for movable floating window
  const handlePointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (windowMode === 'docked') return;
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      dx: e.clientX - position.x,
      dy: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || windowMode === 'docked') return;
    const nextX = Math.min(
      Math.max(12, e.clientX - dragOffsetRef.current.dx),
      Math.max(12, window.innerWidth - 340)
    );
    const nextY = Math.min(
      Math.max(58, e.clientY - dragOffsetRef.current.dy),
      Math.max(58, window.innerHeight - 80)
    );
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }
  };

  // Drag handlers for movable launcher widget
  const handlePointerDownLauncher = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-dismiss-launcher="true"]')) return;
    setIsDraggingLauncher(true);
    launcherMovedRef.current = false;
    dragOffsetRef.current = {
      dx: e.clientX - launcherPos.x,
      dy: e.clientY - launcherPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveLauncher = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingLauncher) return;
    const nextX = Math.min(
      Math.max(12, e.clientX - dragOffsetRef.current.dx),
      Math.max(12, window.innerWidth - 210)
    );
    const nextY = Math.min(
      Math.max(58, e.clientY - dragOffsetRef.current.dy),
      Math.max(58, window.innerHeight - 64)
    );
    if (Math.abs(nextX - launcherPos.x) > 4 || Math.abs(nextY - launcherPos.y) > 4) {
      launcherMovedRef.current = true;
    }
    setLauncherPos({ x: nextX, y: nextY });
  };

  const handlePointerUpLauncher = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingLauncher) return;
    setIsDraggingLauncher(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    if (!launcherMovedRef.current && !(e.target as HTMLElement).closest('[data-dismiss-launcher="true"]')) {
      onOpen?.();
    }
  };

  // Update context brief if active agency changes
  useEffect(() => {
    if (activeAgency && isOpen) {
      const isFire = activeAgency.agencyType.toLowerCase().includes('fire');
      setMessages((prev) => [
        ...prev,
        {
          id: `agency-focus-${Date.now()}`,
          role: 'system',
          content: `ACTIVE ACCOUNT BRIEF: ${activeAgency.name} (${activeAgency.city}, ${activeAgency.stateCode} ${activeAgency.zipCode})
• Service Branch: ${isFire ? 'Fire Department' : 'EMS Provider'} | PulseIQ Index: ${activeAgency.zollOpportunity.pulseIqScore}
• Installed Monitor Fleet: ${activeAgency.installedFleet.defibUnitsCount} units — ${activeAgency.installedFleet.defibBrand} (${activeAgency.installedFleet.defibAgeYears} yrs in service)
• Primary Target Solution: ${activeAgency.zollOpportunity.primaryTargetProduct}
• Estimated Pipeline Value: $${(activeAgency.zollOpportunity.projectedPipelineValue / 1000).toFixed(0)}k`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeAgency?.id, isOpen]);

  const handleSend = async (customPrompt?: string, isMapsGrounding = false) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounding: isMapsGrounding,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      if (isMapsGrounding || activePersona === 'maps' || textToSend.toLowerCase().includes('maps') || textToSend.toLowerCase().includes('cath lab') || textToSend.toLowerCase().includes('hospital')) {
        const res = await fetch('/api/gemini/maps-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: textToSend,
            city: activeAgency?.city,
            state: activeAgency?.stateCode || activeAgency?.state,
            latitude: activeAgency?.latitude,
            longitude: activeAgency?.longitude,
          }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.details || data.error);
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.text || 'Verified regional facility and geographic records.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Geographic Registry Lookup',
          mapsLinks: data.mapsLinks || [],
          isGrounding: true,
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        let personaInstruction = '';
        if (activePersona === 'clinical') {
          personaInstruction = 'You are the Senior Clinical Resuscitation Specialist for ZOLL Medical. Emphasize clinical evidence, chest compression fraction (CCF), Real CPR Help depth/rate audio feedback, CaseReview post-event debriefing, and Utstein survival metrics. Write in a concise, institutional executive memo tone without emojis.';
        } else if (activePersona === 'rfp') {
          personaInstruction = 'You are the Government Procurement & Pre-Emptive RFP Director for ZOLL Medical. Provide exact RFP specifications, defensible sole-source justification language, and competitive fleet displacement strategies targeting Stryker LIFEPAK 15 and Philips MRx. Write in a formal institutional specification tone without emojis.';
        } else if (activePersona === 'billing') {
          personaInstruction = 'You are the Healthcare Economics & CMS Revenue Recovery Advisor for ZOLL Billing. Detail Medicare ground ambulance claim denials (CO-16 documentation deficiencies, medical necessity), NEMSIS 3.5 compliance, and estimated recoverable revenue calculations. Write in a financial audit tone without emojis.';
        }

        const historyPayload = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        historyPayload.push({
          role: 'user',
          content: textToSend,
        });

        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyPayload,
            systemInstruction: personaInstruction,
            model: selectedModel,
            agencyContext: activeAgency || undefined,
          }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.details || data.error);
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: activePersona === 'clinical' ? 'Clinical Research Desk' : activePersona === 'rfp' ? 'Procurement Spec Desk' : 'Revenue Audit Desk',
        };

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Service Notice: Unable to complete strategy query (${errMsg}). Verify network connectivity or server configuration.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: `Briefing log cleared. Ready for clinical, procurement, or regional facility analysis.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) {
    if (isLauncherDismissed) return null;
    return (
      <div
        style={{ left: `${launcherPos.x}px`, top: `${launcherPos.y}px` }}
        onPointerDown={handlePointerDownLauncher}
        onPointerMove={handlePointerMoveLauncher}
        onPointerUp={handlePointerUpLauncher}
        className="fixed z-40 bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl shadow-[0_6px_16px_rgba(15,23,42,0.2)] flex items-center border border-slate-700 select-none cursor-move transition-colors"
        title="Click to open Strategy Desk • Drag to move anywhere on screen"
      >
        <div className="pl-2.5 pr-1.5 py-2.5 flex items-center text-slate-400">
          <GripHorizontal className="w-3.5 h-3.5 rotate-90" />
        </div>
        <div className="pr-2.5 py-2 flex items-center gap-2 cursor-pointer">
          <div className="w-6 h-6 rounded-md bg-[#1E3A8A] border border-slate-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-xs leading-none tracking-tight">Strategy Desk</div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">Clinical • RFP • Maps</div>
          </div>
        </div>
        <button
          type="button"
          data-dismiss-launcher="true"
          onClick={(e) => {
            e.stopPropagation();
            setIsLauncherDismissed(true);
          }}
          className="px-2 py-2.5 border-l border-slate-700 text-slate-400 hover:text-white hover:bg-rose-700 rounded-r-xl transition-colors"
          title="Close and hide floating launcher"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const containerStyle: React.CSSProperties =
    windowMode === 'floating'
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isMinimized ? '340px' : 'min(480px, calc(100vw - 24px))',
          height: isMinimized ? 'auto' : 'min(600px, calc(100vh - 84px))',
        }
      : {};

  // Helper to render structured executive briefing text without chat bubble styling
  const renderFormattedBriefingContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-[12.5px] leading-[1.65] text-[#0F172A]">
        {lines.map((rawLine, idx) => {
          const line = rawLine.trim();
          if (!line) {
            return <div key={idx} className="h-1" />;
          }
          // Bullet or specification item
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const cleanText = line.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '');
            const colonIndex = cleanText.indexOf(':');
            if (colonIndex > 0 && colonIndex < 48) {
              const label = cleanText.slice(0, colonIndex);
              const detail = cleanText.slice(colonIndex + 1);
              return (
                <div
                  key={idx}
                  className="pl-3 border-l-2 border-slate-200 py-0.5 text-[12px] leading-relaxed text-slate-700"
                >
                  <span className="font-semibold text-[#0F172A]">{label}:</span>
                  <span>{detail}</span>
                </div>
              );
            }
            return (
              <div
                key={idx}
                className="pl-3 border-l-2 border-slate-200 py-0.5 text-[12px] leading-relaxed text-slate-700"
              >
                {cleanText}
              </div>
            );
          }

          // Section heading line
          const cleanLine = line.replace(/\*\*/g, '');
          if (cleanLine.endsWith(':') && cleanLine.length < 75) {
            return (
              <div
                key={idx}
                className="pt-1.5 pb-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100"
              >
                {cleanLine}
              </div>
            );
          }

          return (
            <p key={idx} className="text-[12.5px] leading-[1.65] text-slate-800">
              {cleanLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={containerStyle}
      className={
        windowMode === 'floating'
          ? 'fixed z-55 bg-white border border-slate-200 rounded-lg shadow-[0_8px_28px_rgba(15,23,42,0.12)] flex flex-col text-[#0F172A] overflow-hidden'
          : 'fixed inset-y-0 right-0 z-55 w-full sm:w-[500px] bg-white border-l border-slate-200 shadow-[0_8px_28px_rgba(15,23,42,0.10)] flex flex-col text-[#0F172A]'
      }
    >
      {/* Draggable Clinical Assistant Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        className={`px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 text-[#0F172A] flex items-center justify-between select-none ${
          windowMode === 'floating' ? 'cursor-move' : ''
        }`}
        title={windowMode === 'floating' ? 'Drag header to reposition clinical briefing panel' : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded border border-slate-200 bg-white text-[#1E3A8A] flex items-center justify-center shrink-0">
            {windowMode === 'floating' ? (
              <GripHorizontal className="w-4 h-4 text-slate-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-tight text-[#0F172A] flex items-center gap-2 truncate">
              <span>Clinical &amp; Procurement Briefing Assistant</span>
              {windowMode === 'floating' && (
                <span className="text-[10px] font-mono font-normal text-slate-500 hidden sm:inline">
                  • Movable
                </span>
              )}
            </div>
            {!isMinimized && (
              <div className="text-[10px] text-slate-500 font-mono truncate">
                PROTOCOL EVIDENCE • RFP SPECIFICATIONS • CMS RECOVERY
              </div>
            )}
          </div>
        </div>

        {/* Window Controls: Dock/Float, Minimize, Reset, Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setWindowMode((prev) => (prev === 'floating' ? 'docked' : 'floating'));
              setIsMinimized(false);
            }}
            className="p-1.5 rounded text-slate-500 hover:text-[#0F172A] hover:bg-slate-200/70 transition-colors"
            title={windowMode === 'floating' ? 'Dock panel to right margin' : 'Detach as movable window'}
          >
            {windowMode === 'floating' ? (
              <PanelRight className="w-3.5 h-3.5" />
            ) : (
              <AppWindow className="w-3.5 h-3.5" />
            )}
          </button>

          {windowMode === 'floating' && (
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1.5 rounded text-slate-500 hover:text-[#0F172A] hover:bg-slate-200/70 transition-colors"
              title={isMinimized ? 'Expand briefing sheet' : 'Collapse briefing sheet'}
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded text-slate-500 hover:text-[#0F172A] hover:bg-slate-200/70 transition-colors"
            title="Reset briefing ledger"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-0.5"
            title="Close briefing panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {!isMinimized && (
        <>
          {/* Control Bar: Clinical Track & Review Depth */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActivePersona('clinical')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activePersona === 'clinical'
                    ? 'bg-[#F8FAFC] text-[#0F172A] border-[#0F172A] font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Clinical Evidence
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('rfp')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activePersona === 'rfp'
                    ? 'bg-[#F8FAFC] text-[#0F172A] border-[#0F172A] font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                RFP Specs
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('billing')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activePersona === 'billing'
                    ? 'bg-[#F8FAFC] text-[#0F172A] border-[#0F172A] font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                CMS Recovery
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('maps')}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors border ${
                  activePersona === 'maps'
                    ? 'bg-[#F8FAFC] text-[#1E3A8A] border-[#1E3A8A] font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>Facilities</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Format:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-[#F8FAFC] text-[#0F172A] border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:border-slate-400"
              >
                <option value="gemini-3.8-flash">Executive Brief</option>
                <option value="gemini-3.1-flash-lite">Concise Abstract</option>
                <option value="gemini-4-argon">Comprehensive Audit</option>
              </select>
            </div>
          </div>

          {/* Active Account Subject Header */}
          {activeAgency && (
            <div className="px-4 py-2 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Subject:
                </span>
                <span className="font-semibold text-[#0F172A] truncate">{activeAgency.name}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  • {activeAgency.city}, {activeAgency.stateCode}
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#1E3A8A] tabular-nums shrink-0">
                INDEX {activeAgency.zollOpportunity.pulseIqScore}
              </span>
            </div>
          )}

          {/* Continuous Executive Briefing Ledger (No Chat Bubbles) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 bg-white">
            {messages.map((msg, index) => {
              if (msg.role === 'user') {
                return (
                  <section
                    key={msg.id}
                    className="px-4 py-3 bg-[#F8FAFC] border-l-2 border-l-[#0F172A]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      <span className="font-semibold text-[#0F172A]">
                        INQUIRY DIRECTIVE #{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="tabular-nums">{msg.timestamp}</span>
                    </div>
                    <div className="text-xs font-medium text-[#0F172A] leading-relaxed">
                      {msg.content}
                    </div>
                  </section>
                );
              }

              if (msg.role === 'system') {
                return (
                  <section
                    key={msg.id}
                    className="px-4 py-3 bg-slate-50/70 border-l-2 border-l-slate-400"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                      <span className="font-semibold text-slate-700">
                        PROVIDER REGISTRY CONTEXT
                      </span>
                      <span className="tabular-nums">{msg.timestamp}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </section>
                );
              }

              return (
                <article key={msg.id} className="px-4 py-4 bg-white">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E3A8A]">
                        {msg.modelUsed || 'CLINICAL & PROCUREMENT BRIEFING'}
                      </span>
                      <span>•</span>
                      <span>MEMORANDUM</span>
                    </div>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  {renderFormattedBriefingContent(msg.content)}

                  {/* Verified Geographic Facility Records */}
                  {msg.mapsLinks && msg.mapsLinks.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200">
                      <div className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider flex items-center justify-between mb-2">
                        <span>VERIFIED REGIONAL FACILITY DIRECTORY</span>
                        <span className="tabular-nums">{msg.mapsLinks.length} RECORDS</span>
                      </div>
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded bg-[#F8FAFC]">
                        {msg.mapsLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-100/80 text-[#0F172A] transition-colors text-[11px]"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="font-medium truncate max-w-[300px]">
                                {link.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#1E3A8A] flex items-center gap-1 shrink-0">
                              <span>MAP</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {isLoading && (
              <div className="px-4 py-3 bg-[#F8FAFC] flex items-center justify-between text-[11px] text-slate-600 font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#1E3A8A] animate-pulse" />
                  <span>COMPILING CLINICAL &amp; PROCUREMENT BRIEFING...</span>
                </div>
                <span className="text-[10px] text-slate-400">PROCESSING</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Standard Briefing Protocol Templates */}
          <div className="px-4 py-2 bg-[#F8FAFC] border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 mr-1">
              Briefs:
            </span>
            <button
              type="button"
              onClick={() =>
                handleSend(
                  'Provide a clinical and biomedical displacement brief comparing ZOLL X Series Advanced against Stryker LIFEPAK 15 for this account.'
                )
              }
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors border border-slate-200 font-medium"
            >
              Fleet Displacement
            </button>

            <button
              type="button"
              onClick={() =>
                handleSend(
                  'Draft pre-emptive technical RFP specifications emphasizing Real CPR Help and AutoPulse CCF compliance for this department.'
                )
              }
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors border border-slate-200 font-medium"
            >
              RFP Specification
            </button>

            <button
              type="button"
              onClick={() =>
                handleSend(
                  'Locate verified Level 1/2 trauma centers, cardiac cath labs, and municipal stations serving this jurisdiction.',
                  true
                )
              }
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors font-medium"
            >
              Regional Trauma &amp; Cath Labs
            </button>

            <button
              type="button"
              onClick={() =>
                handleSend(
                  'Calculate annual recoverable revenue from CO-16 Medicare billing denials based on this provider transport volume.'
                )
              }
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors border border-slate-200 font-medium"
            >
              CMS CO-16 Audit
            </button>
          </div>

          {/* Directive Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activePersona === 'maps'
                    ? 'Enter jurisdiction or receiving facility query...'
                    : 'Enter clinical protocol, RFP specification, or payer reimbursement directive...'
                }
                className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSend(undefined, true)}
                title="Query Regional Facility Registry"
                className="px-2.5 py-2 rounded bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-[11px] font-mono flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="hidden sm:inline">Registry</span>
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3.5 py-2 rounded bg-[#0F172A] hover:bg-[#1E3A8A] disabled:opacity-40 text-white transition-colors text-xs font-semibold"
              >
                Compile
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
