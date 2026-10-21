/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ListOrdered, 
  Scale, 
  Car,
  Globe,
  LayoutDashboard,
  Home
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGoHome?: () => void;
  openNotifications: () => void;
  unreadAlertCount: number;
  dayRouteCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onGoHome,
  dayRouteCount
}) => {
  const isTmDashboard = activeTab === 'tm_dashboard';
  const isTerritory = ['states_directory', 'geo', 'gis', 'pulseiq', 'map'].includes(activeTab);
  const isQueue = activeTab === 'queue';
  const isSavings = ['knowledge', 'contracts', 'grants', 'claims'].includes(activeTab);
  const isField = ['field', '3d_studio'].includes(activeTab);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#E5E4DF] dark:border-slate-800 shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        {/* Home Screen (TM Field Cockpit) */}
        <button
          onClick={() => {
            if (onGoHome) onGoHome();
            else setActiveTab('tm_dashboard');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isTmDashboard 
              ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
          }`}
          title="Return to Home Screen"
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-1 font-semibold">Home</span>
        </button>

        {/* Step 1: Territory Explorer */}
        <button
          onClick={() => setActiveTab('states_directory')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isTerritory 
              ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-1">Territory</span>
        </button>

        {/* Step 2: Priority Accounts */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isQueue 
              ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-1">Accounts</span>
        </button>

        {/* Step 3: Savings, Recalls & Grants */}
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isSavings 
              ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-1">Savings</span>
        </button>

        {/* Step 4: Field Visit & 3D Demo */}
        <button
          onClick={() => setActiveTab('field')}
          className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
            isField 
              ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span className="text-[10px] tracking-tight mt-1">Route</span>
          {dayRouteCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-[#1E3A8A] dark:bg-blue-600 text-white font-mono text-[9px] font-bold tabular-nums flex items-center justify-center shadow-2xs">
              {dayRouteCount}
            </span>
          )}
        </button>

      </div>
    </div>
  );
};
