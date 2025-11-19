import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Omit<Project, 'id'>) => void;
    initialProject?: Project | null;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave, initialProject }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [deadline, setDeadline] = useState('');
    const [status, setStatus] = useState<Project['status']>('Planning');
    const [priority, setPriority] = useState<Project['priority']>('Medium');
    const [scope, setScope] = useState('');
    const [goal, setGoal] = useState('');

    React.useEffect(() => {
        if (isOpen && initialProject) {
            setName(initialProject.name);
            setColor(initialProject.color);
            setDeadline(initialProject.deadline || '');
            setStatus(initialProject.status || 'Planning');
            setPriority(initialProject.priority || 'Medium');
            setScope(initialProject.scope || '');
            setGoal(initialProject.goal || '');
        } else if (isOpen && !initialProject) {
            setName('');
            setColor('#3b82f6');
            setDeadline('');
            setStatus('Planning');
            setPriority('Medium');
            setScope('');
            setGoal('');
        }
    }, [isOpen, initialProject]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            color,
            deadline,
            status,
            priority,
            scope,
            goal
        });
        onClose();
        // Reset form
        setName('');
        setColor('#3b82f6');
        setDeadline('');
        setStatus('Planning');
        setPriority('Medium');
        setScope('');
        setGoal('');
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl pointer-events-auto overflow-hidden transition-colors max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {initialProject ? 'Edit Project' : 'Create New Project'}
                                </h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Basic Info */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">Basic Info</h4>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                placeholder="e.g., Q4 Marketing Campaign"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="h-10 w-20 p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{color}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                required
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                                <select
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value as any)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                >
                                                    <option value="Planning">Planning</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="On Hold">On Hold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                                <select
                                                    value={priority}
                                                    onChange={(e) => setPriority(e.target.value as any)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                >
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Definition */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">Project Definition</h4>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope (In/Out)</label>
                                            <textarea
                                                rows={6}
                                                value={scope}
                                                onChange={(e) => setScope(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                placeholder="Define what is included and excluded in this project..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal / Success Criteria</label>
                                            <textarea
                                                rows={4}
                                                value={goal}
                                                onChange={(e) => setGoal(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                placeholder="What does success look like?"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
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
                                        disabled={!name || !deadline}
                                    >
                                        {initialProject ? 'Save Changes' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence >
    );
};
