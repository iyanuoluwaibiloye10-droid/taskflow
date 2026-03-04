/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Reminder } from '../types';

class NotificationManager {
  private static instance: NotificationManager;
  private checkInterval: any = null;
  private soundEnabled: boolean = true;
  private notificationsEnabled: boolean = true;
  private onTriggered: ((updatedTasks: Task[]) => void) | null = null;
  private tasks: Task[] = [];

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public setConfig(notificationsEnabled: boolean, soundEnabled: boolean) {
    this.notificationsEnabled = notificationsEnabled;
    this.soundEnabled = soundEnabled;
  }

  public setOnTriggered(callback: (updatedTasks: Task[]) => void) {
    this.onTriggered = callback;
  }

  public setTasks(tasks: Task[]) {
    this.tasks = tasks;
  }

  public start(tasks: Task[], onUpdate?: (tasks: Task[]) => void): void {
    this.tasks = tasks;
    if (onUpdate) this.onTriggered = onUpdate;
    
    this.check();
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.check();
    }, 60000); // Check every minute
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private check(): void {
    if (!this.notificationsEnabled) return;
    
    const now = new Date();
    let hasChanges = false;

    const updatedTasks = this.tasks.map(task => {
      if (task.completed || !task.reminders) return task;

      let taskChanged = false;
      const updatedReminders = task.reminders.map(reminder => {
        if (reminder.triggered || !reminder.enabled) return reminder;

        const triggerTime = this.calculateTriggerTime(task, reminder);
        
        // If current time is past trigger time and within a 1-minute window
        if (now >= triggerTime && now.getTime() - triggerTime.getTime() < 60000) {
          this.sendNotification(task, reminder);
          taskChanged = true;
          return { ...reminder, triggered: true, lastTriggered: Date.now() };
        }

        return reminder;
      });

      if (taskChanged) {
        hasChanges = true;
        return { ...task, reminders: updatedReminders };
      }
      return task;
    });

    if (hasChanges && this.onTriggered) {
      this.onTriggered(updatedTasks);
    }
  }

  private calculateTriggerTime(task: Task, reminder: Reminder): Date {
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
    const dueDateTime = new Date(year, month - 1, day, hours, minutes);

    if (reminder.type === 'before' && reminder.offsetMinutes) {
      return new Date(dueDateTime.getTime() - (reminder.offsetMinutes * 60 * 1000));
    }

    return dueDateTime;
  }

  private sendNotification(task: Task, reminder?: Reminder): void {
    if (!this.notificationsEnabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const title = '⏰ TaskFlow Reminder';
    const body = reminder 
      ? `${task.title} is due ${reminder.type === 'at-time' ? 'now' : `in ${reminder.offsetMinutes} minutes`}`
      : `📋 ${task.title}`;

    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `task-${task.id}`,
    });

    if (this.soundEnabled) {
      this.playSound();
    }
  }

  private playSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.error('Error playing sound:', err));
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    
    if (Notification.permission === 'granted') return true;
    
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  public sendTestNotification() {
    if (Notification.permission === 'granted') {
      new Notification('TaskFlow Test', {
        body: 'This is a test notification from TaskFlow.',
        icon: '/favicon.ico'
      });
      if (this.soundEnabled) this.playSound();
    } else {
      this.requestPermission().then(granted => {
        if (granted) this.sendTestNotification();
      });
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
export default NotificationManager.getInstance();
