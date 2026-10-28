/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PushAlert } from '../types';

const STORAGE_KEY_NOTIFICATIONS = 'zoll_pulseiq_notifications_v3';
const LEGACY_NOTIFICATION_KEYS = ['zoll_pulseiq_notifications_v1', 'zoll_pulseiq_notifications_v2'];

export const INITIAL_NOTIFICATIONS: PushAlert[] = [
  {
    id: 'alert-fed-01',
    timestamp: 'Federal Registry Bulletin',
    priority: 'critical',
    title: 'FDA CDRH Class I Device Recall: Stryker LIFEPAK 15',
    message: 'FDA Center for Devices and Radiological Health issued Class I recall advisory regarding power supply lockups and pacing interruptions on legacy Stryker LIFEPAK 15 units.',
    agencyId: 'zoll-agency-oh-cleveland',
    agencyName: 'Cleveland Division of Emergency Medical Service',
    category: 'Competitor Notice',
    isRead: false
  },
  {
    id: 'alert-fed-02',
    timestamp: 'Manufacturer Lifecycle Notice',
    priority: 'high',
    title: 'Manufacturer Notice: Philips HeartStart MRx Discontinuation',
    message: 'Philips Healthcare officially sunset all service agreements, OEM calibration, and replacement battery production for the HeartStart MRx monitor platform.',
    agencyId: 'zoll-agency-tx-houston',
    agencyName: 'Houston Fire Department EMS',
    category: 'Competitor Notice',
    isRead: false
  },
  {
    id: 'alert-fed-03',
    timestamp: 'CMS Federal Policy',
    priority: 'high',
    title: 'CMS Ground Ambulance Data Collection System (GADCS)',
    message: 'Section 50203 mandatory cost-reporting window for Medicare Part B ground ambulance providers. Documentation audits verify medical necessity compliance.',
    agencyId: 'zoll-agency-il-chicago',
    agencyName: 'Chicago Fire Department EMS Bureau',
    category: 'CMS Audit / Policy',
    isRead: true
  },
  {
    id: 'alert-fed-04',
    timestamp: 'FEMA Federal Grant Bulletin',
    priority: 'critical',
    title: 'FEMA AFG Regional Operations Notice of Funding',
    message: 'FEMA Assistance to Firefighters Grants application guidelines allocate funding under EMS Operations & Resuscitation Equipment categories.',
    agencyId: 'zoll-agency-ny-fdny',
    agencyName: 'FDNY Bureau of EMS',
    category: 'Grant Award',
    isRead: true
  }
];

export function loadStoredNotifications(): PushAlert[] {
  try {
    for (const legacyKey of LEGACY_NOTIFICATION_KEYS) {
      localStorage.removeItem(legacyKey);
    }
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) return INITIAL_NOTIFICATIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_NOTIFICATIONS;
    // Sanitize any notifications that might have legacy mock agency IDs
    const sanitized = parsed.filter(item => !item.agencyId?.startsWith('zoll-lead-') && !item.message?.includes('Sarah Jenkins'));
    return sanitized.length > 0 ? sanitized : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(alerts: PushAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(alerts));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

export function triggerSystemNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'zoll-pulseiq-alert'
      });
    } catch {
      // In restricted sandbox environments Notification constructor may be restricted
    }
  }
}

export const ALERT_TEMPLATES: Array<Omit<PushAlert, 'id' | 'timestamp' | 'isRead'>> = [
  {
    title: 'FEMA AFG Equipment Allocation Guidelines',
    message: 'Official FEMA Assistance to Firefighters Grants release guidelines for cardiac resuscitation capital acquisitions.',
    agencyId: 'zoll-agency-oh-cleveland',
    agencyName: 'Cleveland Division of Emergency Medical Service',
    category: 'Grant Award',
    priority: 'critical'
  },
  {
    title: 'Medicare Ground Ambulance Rate Update',
    message: 'CMS annual ambulance inflation factor published for Medicare Part B ground transport fee schedules.',
    category: 'CMS Audit / Policy',
    priority: 'info'
  },
  {
    title: 'Manufacturer Service Sunset: Legacy Monitors',
    message: 'Third-party parts availability and OEM maintenance contracts sunset for legacy monitor platforms.',
    agencyId: 'zoll-agency-nc-charlotte',
    agencyName: 'Charlotte Fire Department',
    category: 'Competitor Notice',
    priority: 'high'
  },
  {
    title: 'Territory Agency Route Check',
    message: 'Designated department route inspection checkpoint according to selected territory schedule.',
    agencyId: 'zoll-agency-oh-columbus',
    agencyName: 'Columbus Division of Fire',
    category: 'Field Route',
    priority: 'info'
  }
];
