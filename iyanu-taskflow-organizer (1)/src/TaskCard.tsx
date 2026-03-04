/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pencil, 
  Trash2, 
  MoreVertical, 
  AlertCircle, 
  ChevronDown, 
  Check, 
  Calendar, 
  Clock, 
  Bell 
} from 'lucide-react';
import { Task, Category } from './types';
import { getDaysOverdue, formatTime12Hour, getTimeUntil } from './utils/timeHelpers';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  categories: Category[];
  key?: string | number;
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, categories }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRippling, setIsRippling] = useState(false);

  const priorityColors = {
    low: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };

  const categoryColor = categories.find(c => c.name === task.category)?.color || 'var(--accent-primary)';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    onToggle(task.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: task.completed ? 0.6 : 1, 
        scale: 1,
        transition: { duration: 0.3 }
      }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      className={`card overflow-hidden relative transition-opacity duration-300 ${task.isOverdue && !task.completed ? 'border-rose-500/50 dark:border-rose-500/30 ring-1 ring-rose-500/20' : ''}`}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={handleToggle}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
              task.completed 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
            }`}
          >
            <AnimatePresence mode="wait">
              {task.completed ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Check size={14} strokeWidth={4} />
                </motion.div>
              ) : null}
            </AnimatePresence>
            
            {/* Ripple Effect */}
            {isRippling && (
              <span className="absolute inset-0 bg-indigo-400/30 rounded-full animate-ping pointer-events-none" />
            )}
          </motion.button>
        </div>
        
        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold truncate transition-all duration-300 ${task.completed ? 'text-[var(--text-secondary)] line-through opacity-70' : ''}`}>
              {task.title}
            </h4>
            {task.isOverdue && !task.completed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase">Overdue</span>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded uppercase">
                  {getDaysOverdue(task.dueDate)} {getDaysOverdue(task.dueDate) === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              <Calendar size={10} />
              {task.dueDate}
            </span>
            {task.dueTime ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <Clock size={10} />
                Due at {formatTime12Hour(task.dueTime)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <Clock size={10} />
                All Day
              </span>
            )}
            {task.dueTime && !task.completed && (
              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${task.isOverdue ? 'text-rose-500' : 'text-indigo-500'}`}>
                {getTimeUntil(task.dueDate, task.dueTime)}
              </span>
            )}
            {task.reminders && task.reminders.some(r => r.enabled) && (
              <span className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${task.reminders.some(r => r.triggered) ? 'text-amber-500' : 'text-indigo-500'}`}>
                <Bell size={10} />
                {task.reminders.length}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${task.completed ? 'opacity-50' : ''} ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span 
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 border ${task.completed ? 'opacity-50' : ''}`}
              style={{ borderColor: categoryColor, color: categoryColor, backgroundColor: categoryColor + '10' }}
            >
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(task)}
            className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          >
            <Pencil size={18} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-zinc-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10"
          >
            <Trash2 size={18} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-400 hover:text-[var(--text-primary)] transition-colors rounded-xl hover:bg-[var(--bg-primary)]"
            >
              <MoreVertical size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-xl z-20 overflow-hidden"
                  >
                    <button 
                      onClick={() => {
                        onEdit(task);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      <Pencil size={16} className="text-indigo-500" />
                      Edit Task
                    </button>
                    <button 
                      onClick={() => {
                        // Future use: Mark as Important
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      <AlertCircle size={16} className="text-amber-500" />
                      Mark as Important
                    </button>
                    <div className="h-px bg-[var(--border-color)]" />
                    <button 
                      onClick={() => {
                        onDelete(task.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Task
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-14 pb-4 border-t border-[var(--border-color)] pt-4 bg-[var(--bg-primary)]/30"
          >
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {task.description}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category:</span>
              <span className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[10px] font-bold text-[var(--text-primary)]">
                {task.category}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
