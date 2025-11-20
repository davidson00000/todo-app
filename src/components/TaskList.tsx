import React from 'react';
import { Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Task {
    id: number;
    title: string;
    project: string;
    due: string;
    priority: 'high' | 'medium' | 'low';
}

interface TaskListProps {
    tasks: Task[];
    onComplete: (id: number) => void;
    onAddClick: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onComplete, onAddClick }) => {
    const overdueCount = tasks.filter(t => t.due.toLowerCase().includes('overdue') || t.due.toLowerCase().includes('yesterday')).length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Tasks</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tasks due soon</p>
                </div>
                <button
                    onClick={onAddClick}
                    className="p-2 text-cyan-500 dark:text-blue-400 hover:bg-cyan-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Add Task"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {tasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full text-gray-400 py-8"
                        >
                            <CheckCircle2 size={48} className="mb-2 opacity-20" />
                            <p>All tasks completed!</p>
                        </motion.div>
                    ) : (
                        tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 mb-2"
                            >
                                <button
                                    onClick={() => onComplete(task.id)}
                                    className="mt-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                    title="Complete Task"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{task.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                'bg-cyan-50 text-cyan-700 dark:bg-blue-900/20 dark:text-blue-400'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{task.project}</p>
                                    <div className="flex items-center text-xs text-gray-400 gap-1">
                                        <Clock size={12} />
                                        <span>{task.due}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {overdueCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{overdueCount} tasks are overdue</span>
                    </div>
                </div>
            )}
        </div>
    );
};
