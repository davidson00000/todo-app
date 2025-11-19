import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse } from 'date-fns';
import type { Task, TaskPriority, TaskStatus } from '../types';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: { title: string; project: string; due: string; priority: TaskPriority; status: TaskStatus }) => void;
    initialTask?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, initialTask }) => {
    const [title, setTitle] = useState('');
    const [project, setProject] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [status, setStatus] = useState<TaskStatus>('todo');

    useEffect(() => {
        if (isOpen && initialTask) {
            setTitle(initialTask.title);
            setProject(initialTask.project);

            // Try to parse the existing date format "MMM d" back to YYYY-MM-DD for input
            // This is a bit tricky since "MMM d" doesn't have a year. 
            // For simplicity in this demo, we'll just try to parse it relative to current year or leave empty if fails.
            // Ideally, we should store full ISO date in Task object.
            try {
                const parsedDate = parse(initialTask.due, 'MMM d', new Date());
                setDateStr(format(parsedDate, 'yyyy-MM-dd'));
            } catch (e) {
                setDateStr('');
            }

            setPriority(initialTask.priority);
            setStatus(initialTask.status);
        } else if (isOpen && !initialTask) {
            // Reset for new task
            setTitle('');
            setProject('');
            setDateStr('');
            setPriority('medium');
            setStatus('todo');
        }
    }, [isOpen, initialTask]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateStr) return;

        const date = parse(dateStr, 'yyyy-MM-dd', new Date());

        onSave({
            title,
            project,
            due: format(date, 'MMM d'),
            priority,
            status
        });

        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden transition-colors">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {initialTask ? 'Edit Task' : 'Add New Task'}
                                </h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="e.g., Review Design Mockups"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                                    <input
                                        type="text"
                                        required
                                        value={project}
                                        onChange={(e) => setProject(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="e.g., Website Redesign"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={dateStr}
                                            onChange={(e) => setDateStr(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!title || !project || !dateStr}
                                    >
                                        {initialTask ? 'Save Changes' : 'Add Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
