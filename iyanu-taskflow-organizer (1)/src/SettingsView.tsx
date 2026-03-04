/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Bell, 
  Volume2, 
  VolumeX, 
  BellRing, 
  Sun, 
  Moon, 
  Palette, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Smartphone, 
  Trash2, 
  Info 
} from 'lucide-react';
import { Profile, AppSettings, Category } from './types';
import NotificationManager from './services/NotificationManager';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  onReset: () => void;
  profile: Profile;
  onEditProfile: () => void;
  onClearCompleted: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  completedCount: number;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  permissionStatus: NotificationPermission;
}

export default function SettingsView({ 
  theme, 
  toggleTheme, 
  accentColor, 
  setAccentColor, 
  onReset, 
  profile, 
  onEditProfile, 
  onClearCompleted,
  onExport,
  onImport,
  completedCount,
  categories,
  setCategories,
  settings,
  setSettings,
  permissionStatus
}: SettingsViewProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-display font-bold">Settings</h2>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="card p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400" style={{ color: accentColor, backgroundColor: accentColor + '20' }}>
            <User size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{profile.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{profile.email}</p>
          </div>
          <button 
            onClick={onEditProfile}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400"
            style={{ color: accentColor }}
          >
            Edit
          </button>
        </div>

        {/* Notifications Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Notifications</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                  <Bell size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Enable Notifications</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter">
                    Status: {permissionStatus === 'granted' ? 'Allowed' : permissionStatus === 'denied' ? 'Blocked' : 'Not Requested'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                style={{ backgroundColor: settings.notificationsEnabled ? accentColor : undefined }}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                  {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </div>
                <span className="font-medium">Notification Sound</span>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.soundEnabled ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                style={{ backgroundColor: settings.soundEnabled ? accentColor : undefined }}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button 
              onClick={() => NotificationManager.sendTestNotification()}
              className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-primary)] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                <BellRing size={18} />
              </div>
              <span className="font-medium">Send Test Notification</span>
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Appearance</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                  {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <span className="font-medium">Dark Mode</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                style={{ backgroundColor: theme === 'dark' ? accentColor : undefined }}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                  <Palette size={18} />
                </div>
                <span className="font-medium">Accent Color</span>
              </div>
              <div className="flex gap-3 px-2">
                {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#d946ef'].map(color => (
                  <button 
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${accentColor === color ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Categories</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: cat.color, backgroundColor: cat.color + '10', color: cat.color }}
                >
                  <span>{cat.name}</span>
                  <button 
                    onClick={() => setCategories(categories.filter(c => c.id !== cat.id))}
                    className="hover:bg-black/5 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="New category..." 
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = e.currentTarget.value.trim();
                    if (name) {
                      setCategories([...categories, { id: crypto.randomUUID(), name, color: accentColor }]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const name = input.value.trim();
                  if (name) {
                    setCategories([...categories, { id: crypto.randomUUID(), name, color: accentColor }]);
                    input.value = '';
                  }
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20"
                style={{ backgroundColor: accentColor }}
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Data Management</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={onClearCompleted}
              disabled={completedCount === 0}
              className={`w-full flex items-center justify-between p-4 border-b border-[var(--border-color)] transition-colors ${completedCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-primary)]'}`}
            >
              <div className="flex items-center gap-3 text-[var(--text-primary)]">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="font-medium">Clear Completed Tasks ({completedCount})</span>
              </div>
              <ChevronRight size={16} className="text-zinc-300" />
            </button>
            
            <div className="grid grid-cols-2 border-b border-[var(--border-color)]">
              <button 
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-4 hover:bg-[var(--bg-primary)] transition-colors border-r border-[var(--border-color)]"
              >
                <Smartphone size={18} className="text-indigo-500" style={{ color: accentColor }} />
                <span className="font-medium text-sm">Export Tasks</span>
              </button>
              <label className="flex items-center justify-center gap-2 p-4 hover:bg-[var(--bg-primary)] transition-colors cursor-pointer">
                <Bell size={18} className="text-amber-500" />
                <span className="font-medium text-sm">Import Tasks</span>
                <input type="file" accept=".json" onChange={onImport} className="hidden" />
              </label>
            </div>

            <button 
              onClick={onReset}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-primary)] transition-colors"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <Trash2 size={18} />
                <span className="font-medium">Reset All Data</span>
              </div>
              <ChevronRight size={16} className="text-zinc-300" />
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">About</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--text-secondary)]">
                  <Info size={18} />
                </div>
                <span className="font-medium">App Version</span>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">v2.0.4-beta</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: { isOpen: boolean; onClose: () => void; profile: { name: string; email: string }; onSave: (p: { name: string; email: string }) => void }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [isOpen, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--bg-secondary)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-color)] p-6"
          >
            <h2 className="text-xl font-display font-bold mb-6">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-2xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
