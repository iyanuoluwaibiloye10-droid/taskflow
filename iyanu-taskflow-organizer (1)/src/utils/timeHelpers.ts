/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Reminder } from '../types';

/**
 * Calculates how many days a task is overdue
 */
export const getDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Formats a 24-hour time string (HH:mm) to 12-hour format (h:mm AM/PM)
 */
export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Formats a date and optional time into a human-readable string
 * Example: Wednesday, March 5, 2026 at 7:00 AM
 */
export const formatDateTime = (date: string, time?: string): string => {
  if (!date) return '';
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateStr = dateObj.toLocaleDateString('en-US', options);
  
  if (time) {
    return `${dateStr} at ${formatTime12Hour(time)}`;
  }
  
  return dateStr;
};

/**
 * Returns a human-readable countdown string until the specified date and time
 * Example: "in 2h 30m" or "overdue"
 */
export const getTimeUntil = (date: string, time: string): string => {
  if (!date || !time) return '';
  
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const targetDate = new Date(date);
  targetDate.setHours(hours, minutes, 0, 0);
  
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs < 0) return 'overdue';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `in ${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `in ${diffHours}h ${diffMins % 60}m`;
  return `in ${diffMins}m`;
};

/**
 * Calculates the exact Date object when a reminder should trigger
 */
export const calculateReminderTime = (task: Task, reminder: Reminder): Date | null => {
  if (!task.dueDate) return null;
  
  const [year, month, day] = task.dueDate.split('-').map(Number);
  const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
  const triggerTime = new Date(year, month - 1, day, hours, minutes);
  
  if (reminder.type === 'before' && reminder.offsetMinutes) {
    triggerTime.setMinutes(triggerTime.getMinutes() - reminder.offsetMinutes);
  }
  
  return triggerTime;
};
