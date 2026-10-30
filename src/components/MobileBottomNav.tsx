/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Building2,
  TrendingUp,
  Globe,
  Briefcase
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
  const isHome = activeTab === 'home';
  const isAccounts = activeTab === 'queue';
  const isOpportunities = ['contracts', 'grants', 'pulseiq', 'knowledge', 'claims'].includes(activeTab);
  const isTerritory = ['states_directory', 'geo', 'gis', 'map', 'google_maps'].includes(activeTab);
  const isMyWork = ['field', 'tm_dashboard', '3d_studio'].includes(activeTab);

  return (
    <nav
      aria-label="Mobile Primary Workspaces"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1728] text-slate-300 border-t border-[#172D49] shadow-lg"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => {
            if (onGoHome) onGoHome();
            else setActiveTab('home');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isHome ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-4 h-4 ${isHome ? 'text-[#285EE8]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">Home</span>
        </button>

        {/* 2. Accounts */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isAccounts ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className={`w-4 h-4 ${isAccounts ? 'text-[#285EE8]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">Accounts</span>
        </button>

        {/* 3. Opportunities */}
        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isOpportunities ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${isOpportunities ? 'text-[#285EE8]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">Opportunities</span>
        </button>

        {/* 4. Territory */}
        <button
          type="button"
          onClick={() => setActiveTab('states_directory')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isTerritory ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className={`w-4 h-4 ${isTerritory ? 'text-[#285EE8]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">Territory</span>
        </button>

        {/* 5. My Work */}
        <button
          type="button"
          onClick={() => setActiveTab('field')}
          className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
            isMyWork ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className={`w-4 h-4 ${isMyWork ? 'text-[#285EE8]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1">My Work</span>
          {dayRouteCount > 0 && (
            <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-[#285EE8] text-white pi-data-number text-[9px] font-bold flex items-center justify-center">
              {dayRouteCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
