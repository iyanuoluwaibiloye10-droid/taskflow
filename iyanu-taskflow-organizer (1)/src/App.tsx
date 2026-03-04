/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  Calendar,
  Clock,
  ChevronRight,
  User,
  Moon,
  Sun,
  Shield,
  Smartphone,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Filter,
  Palette,
  Info,
  ChevronDown,
  MoreVertical,
  Check,
  Pencil,
  ArrowUpDown,
  XCircle,
  SlidersHorizontal,
  X,
  Volume2,
  VolumeX,
  BellRing
} from 'lucide-react';
import TaskFormModal from './components/TaskFormModal';
import ConfirmDialog from './components/ConfirmDialog';
import TaskCard from './TaskCard';
import SettingsView, { ProfileEditModal } from './SettingsView';
import { useLocalStorage, clearAppStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';
import { useToast } from './context/ToastContext';
import { Task, Reminder, Category, Priority, Section, Profile, AppSettings } from './types';
import NotificationManager from './services/NotificationManager';
import { getTimeUntil, formatTime12Hour, getDaysOverdue } from './utils/timeHelpers';

// --- Constants ---
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Work', color: '#4f46e5' },
  { id: '2', name: 'Personal', color: '#10b981' },
  { id: '3', name: 'Health', color: '#ef4444' },
  { id: '4', name: 'Shopping', color: '#f59e0b' },
  { id: '5', name: 'Finance', color: '#0ea5e9' },
];

// --- Sample Data ---
const SAMPLE_TASKS: Task[] = [
  { id: '1', title: 'Morning Standup', description: 'Daily team sync on Zoom', dueDate: '2026-03-03', priority: 'medium', category: 'Work', completed: true },
  { id: '2', title: 'Design Review', description: 'Review new task flow wireframes', dueDate: '2026-03-03', priority: 'high', category: 'Work', completed: false },
  { id: '3', title: 'Gym Session', description: 'Leg day at the local gym', dueDate: '2026-03-03', priority: 'low', category: 'Health', completed: false },
  { id: '4', title: 'Buy Groceries', description: 'Milk, eggs, bread, and fruits', dueDate: '2026-03-04', priority: 'medium', category: 'Shopping', completed: false },
  { id: '5', title: 'Pay Electricity Bill', description: 'Due by end of the week', dueDate: '2026-03-01', priority: 'high', category: 'Finance', completed: false, isOverdue: true },
  { id: '6', title: 'Call Mom', description: 'Catch up on weekend plans', dueDate: '2026-03-03', priority: 'low', category: 'Personal', completed: true },
];

export default function App() {
  const [activeSection, setActiveSection] = useLocalStorage<Section>('taskflow-section', 'dashboard');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('taskflow-theme', 'light');
  const [accentColor, setAccentColor] = useLocalStorage<string>('taskflow-accent', '#4f46e5');
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', SAMPLE_TASKS);
  const [categories, setCategories] = useLocalStorage<Category[]>('taskflow-categories', DEFAULT_CATEGORIES);
  const [profile, setProfile] = useLocalStorage<Profile>('taskflow-profile', {
    name: 'Iyanuoluwa Ibiloye',
    email: 'iyanuoluwa@example.com'
  });
  const [settings, setSettings] = useLocalStorage<AppSettings>('taskflow-settings', {
    notificationsEnabled: true,
    soundEnabled: true
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const toast = useToast();

  // Migration for existing tasks
  useEffect(() => {
    const migrated = tasks.map(task => ({
      ...task,
      dueTime: task.dueTime || '23:59',
      reminders: task.reminders || []
    }));
    
    const hasChanges = JSON.stringify(migrated) !== JSON.stringify(tasks);
    if (hasChanges) {
      setTasks(migrated);
    }
  }, []);

  // Initialize Notification Manager
  useEffect(() => {
    NotificationManager.setConfig(settings.notificationsEnabled, settings.soundEnabled);
    NotificationManager.setOnTriggered((updatedTasks) => {
      setTasks(updatedTasks);
    });

    if (settings.notificationsEnabled) {
      NotificationManager.start(tasks);
      NotificationManager.setTasks(tasks);
      NotificationManager.requestPermission().then(() => {
        if (typeof Notification !== 'undefined') {
          setPermissionStatus(Notification.permission);
        }
      });
    } else {
      NotificationManager.stop();
    }

    return () => NotificationManager.stop();
  }, [tasks, settings]);

  // Update permission status on load
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // --- Theme Application ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    // Update secondary accent (lighter version)
    const secondary = accentColor + 'cc'; // 80% opacity
    document.documentElement.style.setProperty('--accent-secondary', secondary);
  }, [accentColor]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTask = (task: Task) => {
    if (editingTask) {
      const timeChanged = editingTask.dueDate !== task.dueDate || editingTask.dueTime !== task.dueTime;
      const updatedTask = {
        ...task,
        reminders: timeChanged 
          ? task.reminders?.map(r => ({ ...r, triggered: false })) 
          : task.reminders
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success('Task updated successfully!');
    } else {
      setTasks(prev => [task, ...prev]);
      toast.success('Task added successfully!');
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted successfully');
    setConfirmDeleteId(null);
  };

  const clearCompletedTasks = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      toast.info('No completed tasks to clear');
      return;
    }
    setTasks(prev => prev.filter(t => !t.completed));
    toast.warning(`Cleared ${completedCount} completed tasks`);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `taskflow-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Tasks exported successfully');
  };

  const importTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string);
        if (!Array.isArray(importedTasks)) throw new Error('Invalid format');
        
        // Basic validation
        const validTasks = importedTasks.filter((t: any) => t.id && t.title && t.dueDate);
        
        setTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = validTasks.filter((t: any) => !existingIds.has(t.id));
          return [...prev, ...newTasks];
        });
        
        toast.success(`Imported ${validTasks.length} tasks successfully`);
      } catch (err) {
        toast.error('Failed to import tasks. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleResetAll = () => {
    clearAppStorage();
    window.location.reload();
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => t.isOverdue && !t.completed).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, overdue, progress };
  }, [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 font-sans transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-col p-6 z-40">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">TaskFlow</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeSection === 'dashboard'} 
            onClick={() => setActiveSection('dashboard')} 
          />
          <NavItem 
            icon={<ListTodo size={20} />} 
            label="My Tasks" 
            active={activeSection === 'tasks'} 
            onClick={() => setActiveSection('tasks')} 
            badge={stats.overdue > 0 ? stats.overdue : undefined}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeSection === 'settings'} 
            onClick={() => setActiveSection('settings')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-primary)]">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile.name.split(' ')[0]}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'dashboard' && (
              <Dashboard 
                greeting={greeting} 
                stats={stats} 
                tasks={tasks} 
                onEdit={openEditModal}
                onDelete={setConfirmDeleteId}
                onToggle={toggleTaskCompletion}
                profile={profile}
                categories={categories}
              />
            )}
            {activeSection === 'tasks' && (
              <TasksView 
                tasks={tasks} 
                onEdit={openEditModal}
                onDelete={setConfirmDeleteId}
                onToggle={toggleTaskCompletion}
                onClearCompleted={clearCompletedTasks}
                categories={categories}
              />
            )}
            {activeSection === 'settings' && (
              <SettingsView 
                theme={theme} 
                toggleTheme={toggleTheme} 
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                onReset={() => setConfirmReset(true)}
                profile={profile}
                onEditProfile={() => setIsProfileModalOpen(true)}
                onClearCompleted={() => setConfirmClearCompleted(true)}
                onExport={exportTasks}
                onImport={importTasks}
                completedCount={tasks.filter(t => t.completed).length}
                categories={categories}
                setCategories={setCategories}
                settings={settings}
                setSettings={setSettings}
                permissionStatus={permissionStatus}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 z-50"
      >
        <Plus size={28} />
      </motion.button>

      {/* Task Creation Modal */}
      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }} 
        onAdd={addTask} 
        initialData={editingTask}
        categories={categories}
      />

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog 
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetAll}
        title="Reset All Data"
        message="Are you sure you want to clear all tasks and settings? This action cannot be undone."
        confirmLabel="Reset Everything"
        variant="danger"
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && deleteTask(confirmDeleteId)}
        title="Delete Task"
        message="Delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog 
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          clearAppStorage();
          window.location.reload();
        }}
        title="Reset All Data"
        message="Are you sure you want to reset all data? This will clear all tasks and settings. This action cannot be undone."
        confirmLabel="Reset Everything"
        variant="danger"
      />

      {/* Confirmation Dialog for Clear Completed */}
      <ConfirmDialog 
        isOpen={confirmClearCompleted}
        onClose={() => setConfirmClearCompleted(false)}
        onConfirm={() => {
          clearCompletedTasks();
          setConfirmClearCompleted(false);
        }}
        title="Clear Completed Tasks"
        message={`Are you sure you want to clear all ${tasks.filter(t => t.completed).length} completed tasks?`}
        confirmLabel="Clear Tasks"
        variant="danger"
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={(p) => {
          setProfile(p);
          toast.success('Profile updated successfully');
        }}
      />

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)]/80 backdrop-blur-lg border-t border-[var(--border-color)] px-8 py-4 flex justify-between items-center z-50">
        <MobileNavItem 
          icon={<LayoutDashboard size={24} />} 
          active={activeSection === 'dashboard'} 
          onClick={() => setActiveSection('dashboard')} 
          label="Home"
        />
        <MobileNavItem 
          icon={<ListTodo size={24} />} 
          active={activeSection === 'tasks'} 
          onClick={() => setActiveSection('tasks')} 
          label="Tasks"
          badge={stats.overdue > 0 ? stats.overdue : undefined}
        />
        <MobileNavItem 
          icon={<Settings size={24} />} 
          active={activeSection === 'settings'} 
          onClick={() => setActiveSection('settings')} 
          label="Settings"
        />
      </nav>
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
        active 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' 
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ icon, active, onClick, label, badge }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors relative ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[var(--bg-secondary)]">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

interface DashboardProps {
  greeting: string;
  stats: {
    total: number;
    completed: number;
    overdue: number;
    progress: number;
  };
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  profile: { name: string; email: string };
  categories: Category[];
}

function Dashboard({ greeting, stats, tasks, onEdit, onDelete, onToggle, profile, categories }: DashboardProps) {
  const sortedTasks = [...tasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  const todayTasks = sortedTasks.filter(t => !t.completed && !t.isOverdue).slice(0, 3);
  const overdueTasks = sortedTasks
    .filter(t => t.isOverdue && !t.completed)
    .sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate));

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold">{greeting}, {profile.name.split(' ')[0]}!</h2>
          <p className="text-[var(--text-secondary)] mt-1">
            {stats.completed} of {stats.total} tasks completed today
          </p>
        </div>
        <button className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative">
          <Bell size={20} />
          {stats.overdue > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--bg-secondary)] animate-pulse"></span>
          )}
        </button>
      </header>

      {/* Progress Widget */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-zinc-100 dark:text-zinc-800 stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-[var(--accent-primary)] stroke-current progress-ring__circle"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.progress / 100)}`}
              strokeLinecap="round"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{Math.round(stats.progress)}%</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-display font-semibold">Daily Goal</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            You're doing great! Keep it up to reach your daily target.
          </p>
          <div className="mt-3 flex gap-4">
            <div className="text-center">
              <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Done</p>
              <p className="text-lg font-bold">{stats.completed}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Left</p>
              <p className="text-lg font-bold">{stats.total - stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertCircle size={18} />
            <h3 className="font-bold uppercase tracking-wider text-xs">Overdue Tasks</h3>
          </div>
          <div className="space-y-3">
            {overdueTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onToggle={onToggle} 
                categories={categories}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-display font-semibold">Today's Tasks</h3>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All</button>
        </div>
        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onToggle={onToggle} 
                categories={categories}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No tasks for today. Take a break!" />
        )}
      </section>
    </div>
  );
}

interface TasksViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onClearCompleted: () => void;
  categories: Category[];
}

function TasksView({ tasks, onEdit, onDelete, onToggle, onClearCompleted, categories }: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const toast = useToast();
  const searchToastShown = React.useRef(false);
  
  const [categoryFilter, setCategoryFilter] = useLocalStorage<string>('taskflow-filter-category', 'All');
  const [priorityFilter, setPriorityFilter] = useLocalStorage<string>('taskflow-filter-priority', 'All');
  const [statusFilter, setStatusFilter] = useLocalStorage<string>('taskflow-filter-status', 'All');
  const [dateFilter, setDateFilter] = useLocalStorage<string>('taskflow-filter-date', 'All');
  const [sortBy, setSortBy] = useLocalStorage<string>('taskflow-sort-by', 'dueDate-asc');
  
  const [showFilters, setShowFilters] = useState(false);

  const categoryOptions = ['All', ...categories.map(c => c.name)];
  const priorities = ['All', 'low', 'medium', 'high'];
  const statuses = ['All', 'Active', 'Completed'];
  const dateOptions = ['All', 'Today', 'This Week', 'Overdue'];

  const clearAllFilters = () => {
    setCategoryFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setDateFilter('All');
    setSearchQuery('');
  };

  const isFilterActive = categoryFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All' || dateFilter !== 'All' || searchQuery !== '';

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      // Search filter
      const searchMatch = !debouncedSearch || 
        task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        task.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        task.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Category filter
      const categoryMatch = categoryFilter === 'All' || task.category === categoryFilter;
      
      // Priority filter
      const priorityMatch = priorityFilter === 'All' || task.priority === priorityFilter;
      
      // Status filter
      const statusMatch = statusFilter === 'All' || 
        (statusFilter === 'Active' && !task.completed) || 
        (statusFilter === 'Completed' && task.completed);
      
      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'All') {
        const today = new Date().toISOString().split('T')[0];
        const taskDate = task.dueDate;
        
        if (dateFilter === 'Today') {
          dateMatch = taskDate === today;
        } else if (dateFilter === 'This Week') {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
          dateMatch = taskDate >= today && taskDate <= sevenDaysStr;
        } else if (dateFilter === 'Overdue') {
          dateMatch = task.isOverdue && !task.completed;
        }
      }

      return searchMatch && categoryMatch && priorityMatch && statusMatch && dateMatch;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate-asc':
          return a.dueDate.localeCompare(b.dueDate);
        case 'dueDate-desc':
          return b.dueDate.localeCompare(a.dueDate);
        case 'priority-high': {
          const pMap = { high: 3, medium: 2, low: 1 };
          return pMap[b.priority] - pMap[a.priority];
        }
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'recently-added':
          // Since we don't have createdAt, we'll assume the order in the array is the order added
          // But for now, we'll just return 0 or use ID if it's sequential
          return 0; 
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, debouncedSearch, categoryFilter, priorityFilter, statusFilter, dateFilter, sortBy]);

  useEffect(() => {
    if (debouncedSearch && filteredTasks.length === 0 && !searchToastShown.current) {
      toast.info(`No results found for "${debouncedSearch}"`);
      searchToastShown.current = true;
    } else if (debouncedSearch && filteredTasks.length > 0) {
      searchToastShown.current = false;
    } else if (!debouncedSearch) {
      searchToastShown.current = false;
    }
  }, [debouncedSearch, filteredTasks.length, toast]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-display font-bold">My Tasks</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-all ${
                showFilters || isFilterActive 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <SlidersHorizontal size={20} />
            </button>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="dueDate-asc">Due Date (Asc)</option>
                <option value="dueDate-desc">Due Date (Desc)</option>
                <option value="priority-high">Priority (High → Low)</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, description, or category..." 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map(p => (
                        <button 
                          key={p}
                          onClick={() => setPriorityFilter(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                            priorityFilter === p 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map(s => (
                        <button 
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            statusFilter === s 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Due Date</label>
                    <div className="flex flex-wrap gap-2">
                      {dateOptions.map(d => (
                        <button 
                          key={d}
                          onClick={() => setDateFilter(d)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            dateFilter === d 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {isFilterActive && (
                  <div className="pt-2 border-t border-[var(--border-color)] flex justify-end">
                    <button 
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categoryOptions.map((cat) => (
          <button 
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center px-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Showing <span className="font-bold text-[var(--text-primary)]">{filteredTasks.length}</span> of <span className="font-bold">{tasks.length}</span> tasks
        </p>
        {tasks.some(t => t.completed) && (
          <button 
            onClick={onClearCompleted}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={14} />
            Clear Completed
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onToggle={onToggle} 
              categories={categories}
            />
          ))
        ) : (
          <EmptyState 
            message={isFilterActive ? "No tasks match your filters." : "No tasks found."} 
            action={isFilterActive ? (
              <button 
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20"
              >
                Clear All Filters
              </button>
            ) : undefined}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-200 dark:text-indigo-800">
        <ListTodo size={48} />
      </div>
      <div>
        <h3 className="text-lg font-bold">Nothing here yet</h3>
        <p className="text-[var(--text-secondary)] text-sm max-w-[200px] mx-auto mt-1">
          {message}
        </p>
      </div>
      {action ? action : (
        <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
          <Plus size={16} />
          Add your first task
        </button>
      )}
    </div>
  );
}
