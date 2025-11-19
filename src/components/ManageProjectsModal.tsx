import React from 'react';
import { X, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../types';

interface ManageProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onDeleteProject: (project: Project) => void;
}

export const ManageProjectsModal: React.FC<ManageProjectsModalProps> = ({ isOpen, onClose, projects, onDeleteProject }) => {
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg pointer-events-auto overflow-hidden transition-colors">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Manage Projects
                                </h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {projects.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No projects found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {projects.map((project) => (
                                            <div
                                                key={project.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: project.color || '#ccc' }}
                                                    />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                                                            {project.status || 'Planning'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteProject(project)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
