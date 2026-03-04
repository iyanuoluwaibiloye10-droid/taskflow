import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, AlertCircle, CheckCircle2, Clock, Bell, BellRing, Trash2, Plus, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Task, Reminder, Category, Priority } from '../types';
import { formatDateTime, calculateReminderTime, formatTime12Hour } from '../utils/timeHelpers';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Task) => void;
  initialData?: Task | null;
  categories: Category[];
}

const REMINDER_OPTIONS = [
  { id: 'at-time', label: 'At due time', type: 'at-time' as const, offset: 0 },
  { id: '15m', label: '15 minutes before', type: 'before' as const, offset: 15 },
  { id: '30m', label: '30 minutes before', type: 'before' as const, offset: 30 },
  { id: '1h', label: '1 hour before', type: 'before' as const, offset: 60 },
  { id: '1d', label: '1 day before', type: 'before' as const, offset: 1440 },
];

export default function TaskFormModal({ isOpen, onClose, onAdd, initialData, categories }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [isAllDay, setIsAllDay] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string>('Work');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const toast = useToast();

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setDueDate(initialData.dueDate);
        setDueTime(initialData.dueTime || '23:59');
        setIsAllDay(!initialData.dueTime);
        setPriority(initialData.priority);
        setCategory(initialData.category);
        setReminders(initialData.reminders || []);
      } else {
        setTitle('');
        setDescription('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setDueTime('09:00');
        setIsAllDay(false);
        setPriority('medium');
        setCategory('Work');
        setReminders([]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const validate = () => {
    const newErrors: { title?: string; dueDate?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      toast.error('Task title cannot be empty');
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
      toast.error('Please select a due date');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date();
    const [h, m] = (isAllDay ? '23:59' : dueTime).split(':').map(Number);
    const taskDate = new Date(dueDate);
    taskDate.setHours(h, m, 0, 0);
    
    const isOverdue = taskDate < now;

    const newTask: Task = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime: isAllDay ? undefined : dueTime,
      priority,
      category,
      completed: initialData ? initialData.completed : false,
      isOverdue,
      reminders
    };

    onAdd(newTask);
  };

  const toggleReminder = (option: typeof REMINDER_OPTIONS[0]) => {
    const existing = reminders.find(r => r.type === option.type && r.offsetMinutes === option.offset);
    if (existing) {
      setReminders(reminders.filter(r => r.id !== existing.id));
    } else {
      setReminders([...reminders, {
        id: crypto.randomUUID(),
        type: option.type,
        offsetMinutes: option.offset || undefined,
        enabled: true,
        triggered: false
      }]);
    }
  };

  const isReminderSelected = (option: typeof REMINDER_OPTIONS[0]) => {
    return reminders.some(r => r.type === option.type && r.offsetMinutes === option.offset);
  };

  const previewText = useMemo(() => {
    if (!dueDate) return '';
    return formatDateTime(dueDate, isAllDay ? undefined : dueTime);
  }, [dueDate, dueTime, isAllDay]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isFormValid = title.trim() !== '' && dueDate !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={handleBackdropClick}
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-color)] max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)] z-10">
              <div>
                <h2 className="text-xl font-display font-bold">{initialData ? 'Edit Task' : 'Create New Task'}</h2>
                {previewText && (
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
                    <Calendar size={10} /> Due: {previewText}
                  </p>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                  Task Title
                </label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className={`w-full bg-[var(--bg-primary)] border ${errors.title ? 'border-rose-500' : 'border-[var(--border-color)]'} rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                  Description (Optional)
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add some details..."
                  rows={2}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Due Time */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Due Time
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors">ALL DAY</span>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={isAllDay}
                          onChange={(e) => setIsAllDay(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-8 h-4 rounded-full transition-colors ${isAllDay ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isAllDay ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </label>
                  </div>
                  <div className={`relative transition-opacity ${isAllDay ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                    Priority
                  </label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                    Category
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reminders Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Reminders
                  </label>
                  {reminders.length > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BellRing size={10} /> {reminders.length} reminders set
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {REMINDER_OPTIONS.map((option) => {
                    const isSelected = isReminderSelected(option);
                    const triggerTime = calculateReminderTime({ dueDate, dueTime: isAllDay ? '23:59' : dueTime } as Task, { type: option.type, offsetMinutes: option.offset } as Reminder);
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleReminder(option)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                            : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
                            {isSelected && <Check size={12} strokeWidth={4} />}
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-primary)]'}`}>
                              {option.label}
                            </p>
                            {dueDate && triggerTime && (
                              <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                                → {triggerTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} on {triggerTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 sticky bottom-0 bg-[var(--bg-secondary)] pb-2">
                <button 
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
                    isFormValid 
                      ? 'bg-indigo-600 hover:brightness-110 shadow-indigo-500/20' 
                      : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  {initialData ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
