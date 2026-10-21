/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PushAlert } from '../types';

const STORAGE_KEY_NOTIFICATIONS = 'zoll_pulseiq_notifications_v1';

export const INITIAL_NOTIFICATIONS: PushAlert[] = [
  {
    id: 'alert-01',
    timestamp: '12 minutes ago',
    priority: 'critical',
    title: 'FEMA AFG Award Published: $485,000',
    message: 'Cuyahoga County Fire has just been awarded $485,000 in FY2025 Assistance to Firefighters Grants for EMS Resuscitation Equipment. Primary target: X Series Advanced.',
    agencyId: 'zoll-lead-001',
    agencyName: 'Cuyahoga County Fire & Emergency Services',
    category: 'Grant Award',
    isRead: false
  },
  {
    id: 'alert-02',
    timestamp: '42 minutes ago',
    priority: 'high',
    title: 'Competitor EOL Notice: Philips MRx Parts Sunsetting',
    message: 'State EMS Bureau issued decertification warning for legacy Philips HeartStart MRx units without manufacturer support. Harris County EMS operates 26 units.',
    agencyId: 'zoll-lead-002',
    agencyName: 'Harris County Emergency Corps',
    category: 'Competitor Notice',
    isRead: false
  },
  {
    id: 'alert-03',
    timestamp: '2 hours ago',
    priority: 'high',
    title: 'CMS Ground Ambulance Audit Notice',
    message: 'CMS GADCS reporting window closes in 45 days. Akron Fire currently has 22.4% Medicare claim denial rate. High propensity for ZOLL Billing / AR Boost demo.',
    agencyId: 'zoll-lead-005',
    agencyName: 'Akron Fire Department',
    category: 'CMS Audit / Policy',
    isRead: true
  },
  {
    id: 'alert-04',
    timestamp: 'Yesterday',
    priority: 'critical',
    title: 'RFP Alert: 52 Advanced Defibrillators',
    message: 'Allegheny County Emergency Services issued competitive RFP #2026-EMS-09 for 52 cardiac monitors. Bid submission closes in 21 days.',
    agencyId: 'zoll-lead-008',
    agencyName: 'Allegheny County Emergency Services',
    category: 'RFP Issued',
    isRead: true
  }
];

export function loadStoredNotifications(): PushAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch (err) {
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
  } catch (e) {
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
    } catch (e) {
      // In some sandbox environments Notification constructor may be restricted
    }
  }
}

export const ALERT_TEMPLATES: Array<Omit<PushAlert, 'id' | 'timestamp' | 'isRead'>> = [
  {
    title: 'Urgent AFG Award Release: $640,000',
    message: 'Federal FEMA portal just cleared $640K allocation for Allegheny County volunteer brigade. AutoPulse demonstration requested by Battalion Chief.',
    agencyId: 'zoll-lead-008',
    agencyName: 'Allegheny County Emergency Services',
    category: 'Grant Award',
    priority: 'critical'
  },
  {
    title: 'Medicare Ground Ambulance Rate Update',
    message: 'CMS released 2027 ambulance inflation factor update. Higher payment thresholds favor ZOLL Billing automated clean claim submissions.',
    category: 'CMS Audit / Policy',
    priority: 'info'
  },
  {
    title: 'Stryker LIFEPAK 15 Maintenance Price Increase',
    message: 'Stryker announced 24% annual maintenance fee escalation on end-of-service LIFEPAK 15 models. Ideal timing for X Series trade-in proposals.',
    agencyId: 'zoll-lead-004',
    agencyName: 'Mecklenburg County EMS Agency (Medic)',
    category: 'Competitor Notice',
    priority: 'high'
  },
  {
    title: 'Geofence Proximity Trigger',
    message: 'You are within 8 miles of Columbus Division of Fire Station 10. Chief Geitter is currently on-duty at Headquarters.',
    agencyId: 'zoll-lead-010',
    agencyName: 'Columbus Division of Fire',
    category: 'Field Route',
    priority: 'info'
  }
];
