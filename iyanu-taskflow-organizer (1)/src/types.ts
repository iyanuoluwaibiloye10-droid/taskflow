/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high';
export type Section = 'dashboard' | 'tasks' | 'settings';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Reminder {
  id: string;
  type: 'at-time' | 'before'; // at exact time or X minutes before
  offsetMinutes?: number; // for 'before' type: 15, 30, 60, etc.
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: number; // timestamp
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // e.g., "2026-05-03"
  dueTime?: string; // e.g., "07:00" (HH:mm format, 24-hour)
  priority: Priority;
  category: string;
  completed: boolean;
  isOverdue?: boolean;
  reminders?: Reminder[];
}

export interface Profile {
  name: string;
  email: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}
