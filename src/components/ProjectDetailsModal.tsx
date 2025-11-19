import React from 'react';
import { X, Edit2, Calendar, Target, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';
import { cn } from '../lib/utils';

interface ProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onEdit: (project: Project) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ isOpen, onClose, project, onEdit }) => {
    if (!project) return null;

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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl pointer-events-auto overflow-hidden transition-colors max-h-[90vh] overflow-y-auto flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-sm"
                                        style={{ backgroundColor: project.color || '#3b82f6' }}
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full font-medium border",
                                                project.status === 'Active' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" :
                                                    project.status === 'Completed' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" :
                                                        project.status === 'On Hold' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" :
                                                            "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                            )}>
                                                {project.status || 'Planning'}
                                            </span>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full font-medium border",
                                                project.priority === 'High' ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" :
                                                    project.priority === 'Medium' ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" :
                                                        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                            )}>
                                                {project.priority || 'Medium'} Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 overflow-y-auto">
                                {/* Deadline */}
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-blue-500 dark:text-blue-400">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Target Deadline</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                weekday: 'long'
                                            }) : 'No deadline set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Scope */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                                            <FileText size={18} className="text-indigo-500" />
                                            <h4>Scope (In/Out)</h4>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 min-h-[120px]">
                                            {project.scope ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                    {project.scope}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No scope defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Goal */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                                            <Target size={18} className="text-emerald-500" />
                                            <h4>Goal / Success Criteria</h4>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 min-h-[120px]">
                                            {project.goal ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                    {project.goal}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No goals defined.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 rounded-lg transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => onEdit(project)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <Edit2 size={16} />
                                    Edit Project
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
