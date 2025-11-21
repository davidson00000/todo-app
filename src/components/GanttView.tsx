import React, { useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import type { Task } from '../types';
import { supabase } from '../lib/supabase';
import { parse, addDays, format } from 'date-fns';

interface GanttViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
    onTaskUpdate?: () => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
    const ganttTasks = useMemo<GanttTask[]>(() => {
        return tasks.map((task) => {
            // Helper to safely parse dates; fallback to today if invalid
            // Convert input dates (which are in YYYY-MM-DD) to the format used in the UI (MMM d)
            const safeDate = (dateStr: string | null | undefined) => {
                if (!dateStr) return new Date();
                const parsed = parse(dateStr, 'yyyy-MM-dd', new Date()); // Changed format to 'yyyy-MM-dd'
                return isNaN(parsed.getTime()) ? new Date() : parsed;
            };
            let start: Date;
            let end: Date;

            // Use safeDate for start date (expects YYYY-MM-DD)
            start = task.start_date ? safeDate(task.start_date) : new Date();

            // Use safeDate for end date (due_date) (expects YYYY-MM-DD)
            end = task.due_date ? safeDate(task.due_date) : addDays(start, 1);

            // Ensure end is after start
            if (end < start) {
                end = addDays(start, 1);
            }

            // Calculate progress
            let progress = 0;
            if (task.status === 'done') {
                progress = 100;
            } else if (task.subtasks && task.subtasks.length > 0) {
                const completed = task.subtasks.filter(s => s.is_completed).length;
                progress = Math.round((completed / task.subtasks.length) * 100);
            }

            return {
                id: task.id,
                name: task.title,
                start,
                end,
                progress,
                type: 'task' as const,
                project: task.project,
                dependencies: task.dependencies || [],
                hideChildren: false,
                styles: {
                    backgroundColor:
                        task.priority === 'high' ? '#ef4444' :
                            task.priority === 'medium' ? '#f59e0b' :
                                '#3b82f6',
                    backgroundSelectedColor:
                        task.priority === 'high' ? '#dc2626' :
                            task.priority === 'medium' ? '#d97706' :
                                '#2563eb',
                }
            };
        });
    }, [tasks]);

    const handleTaskChange = async (task: GanttTask) => {
        try {
            const newStartDate = format(task.start, 'yyyy-MM-dd');
            const newDueDate = format(task.end, 'yyyy-MM-dd');

            const { error } = await supabase
                .from('tasks')
                .update({
                    start_date: newStartDate,
                    due_date: newDueDate
                })
                .eq('id', task.id);

            if (error) {
                console.error('Failed to update task dates:', error);
                alert('Failed to update task dates');
            } else {
                if (onTaskUpdate) {
                    onTaskUpdate();
                }
            }
        } catch (error) {
            console.error('Error updating task dates:', error);
        }
    };

    const handleDoubleClick = (task: GanttTask) => {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask && onTaskClick) {
            onTaskClick(originalTask);
        }
    };

    const [viewMode, setViewMode] = React.useState<ViewMode>(ViewMode.Day);

    if (ganttTasks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No tasks to display.</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-auto">
            <div className="flex justify-end mb-4">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode(ViewMode.Day)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === ViewMode.Day
                            ? 'bg-white dark:bg-gray-600 text-cyan-500 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => setViewMode(ViewMode.Week)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === ViewMode.Week
                            ? 'bg-white dark:bg-gray-600 text-cyan-500 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setViewMode(ViewMode.Month)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === ViewMode.Month
                            ? 'bg-white dark:bg-gray-600 text-cyan-500 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Month
                    </button>
                </div>
            </div>

            {/* Hide Gantt header only */}
            <style>{`
                .gantt-header { display: none !important; }
                .gantt-bar-label { fill: #374151 !important; font-weight: 500; }
                .dark .gantt-bar-label { fill: #e5e7eb !important; }
            `}</style>
            <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                onDoubleClick={handleDoubleClick}
                onDateChange={handleTaskChange}
                listCellWidth="160px"
                columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 80}
                barFill={60}
                TaskListHeader={({ headerHeight }) => (
                    <div
                        style={{ height: headerHeight }}
                        className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold text-sm text-gray-900 dark:text-white"
                    >
                        Task Name
                    </div>
                )}
                TaskListTable={({ rowHeight, tasks }) => (
                    <div className="bg-white dark:bg-gray-800">
                        {tasks.map((t) => (
                            <div
                                key={t.id}
                                style={{ height: rowHeight }}
                                className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => handleDoubleClick(t)}
                            >
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                    {t.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            />
        </div>
    );
};
