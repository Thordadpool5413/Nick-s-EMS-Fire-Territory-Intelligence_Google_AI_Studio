/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PushAlert } from '../types';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Award, 
  ShieldAlert, 
  Radio, 
  CheckCheck, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { requestBrowserNotificationPermission } from '../utils/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PushAlert[];
  onMarkAllRead: () => void;
  onClearAlerts: () => void;
  onSelectAlertAgency: (agencyId: string) => void;
  onTriggerSimulatedAlert: (templateIndex: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllRead,
  onClearAlerts,
  onSelectAlertAgency,
  onTriggerSimulatedAlert
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unknown'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unknown'
  );
  const [simIndex, setSimIndex] = useState<number>(0);

  // Support closing with Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    if (typeof Notification !== 'undefined') {
      setPermissionState(Notification.permission);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border-l border-slate-300 h-full shadow-2xl flex flex-col justify-between text-slate-900 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Territory Push Alerts</h2>
            {alerts.filter(a => !a.isRead).length > 0 && (
              <span className="font-mono text-xs bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full border border-sky-300">
                {alerts.filter(a => !a.isRead).length} new
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body (Alerts Feed) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Browser Permission Banner */}
          {permissionState !== 'granted' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs flex items-start justify-between gap-3 text-slate-800">
              <div>
                <div className="font-semibold text-slate-900">Enable Real-Time Web Push Alerts</div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Receive instant field alerts on AFG grant awards and competitor recalls directly on your device.
                </p>
              </div>
              <button
                onClick={handleRequestPermission}
                className="min-h-[36px] px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* Quick Simulation Generator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Simulate Territory Trigger Event
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simIndex}
                onChange={(e) => setSimIndex(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 flex-1 focus:outline-none focus:border-sky-500"
              >
                <option value={0}>FEMA AFG Award: $640K (Allegheny)</option>
                <option value={1}>CMS Ambulance Inflation Rate Update</option>
                <option value={2}>Stryker LP15 Maintenance Spike</option>
                <option value={3}>Geofence Proximity Alert: Columbus</option>
              </select>

              <button
                onClick={() => onTriggerSimulatedAlert(simIndex)}
                className="min-h-[36px] px-3 py-1.5 bg-white hover:bg-slate-100 text-sky-700 font-semibold rounded-lg border border-slate-300 transition-colors shrink-0 shadow-2xs"
              >
                Trigger
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="space-y-2.5">
              {alerts.map((alert) => {
                const priorityBorder = 
                  alert.priority === 'critical' ? 'border-l-4 border-l-rose-500' :
                  alert.priority === 'high' ? 'border-l-4 border-l-amber-500' :
                  'border-l-4 border-l-sky-500';

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (alert.agencyId) onSelectAlertAgency(alert.agencyId);
                    }}
                    className={`bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 shadow-2xs transition-colors cursor-pointer ${priorityBorder} ${
                      !alert.isRead ? 'ring-1 ring-sky-300/60' : 'opacity-85'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                          {alert.category}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alert.timestamp}
                        </span>
                      </div>

                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                      {alert.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.agencyName && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-sky-700 font-medium">
                        <span>{alert.agencyName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              No notification alerts in feed.
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Mark All Read</span>
          </button>

          <button
            onClick={onClearAlerts}
            className="text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Feed</span>
          </button>
        </div>

      </div>
    </div>
  );
};
