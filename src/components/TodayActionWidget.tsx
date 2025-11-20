import React from 'react';
import { supabase } from '../lib/supabase';
import type { Task, Subtask } from '../types';
import { startOfToday, addDays, parse, isBefore, isWithinInterval } from 'date-fns';

interface TodayActionWidgetProps {
    tasks: Task[];
    onRefresh: () => void;
    onTaskClick: (task: Task) => void;
}

export const TodayActionWidget: React.FC<TodayActionWidgetProps> = ({ tasks, onRefresh, onTaskClick }) => {
    const handleToggle = async (subtask: Subtask) => {
        const { error } = await supabase
            .from('subtasks')
            .update({ is_completed: !subtask.is_completed })
            .eq('id', subtask.id);
        if (error) {
            console.error('Failed to toggle subtask', error);
            alert('Failed to update subtask');
        } else {
            // Recalculate parent task status based on its subtasks
            const parentId = subtask.task_id;
            const { data: parentSubtasks, error: subErr } = await supabase
                .from('subtasks')
                .select('is_completed')
                .eq('task_id', parentId);
            if (!subErr && parentSubtasks) {
                const allDone = parentSubtasks.every((s: any) => s.is_completed);
                await supabase
                    .from('tasks')
                    .update({ status: allDone ? 'done' : 'in-progress' })
                    .eq('id', parentId);
            }
            onRefresh();
        }
    };

    const flatList = tasks.flatMap((t) =>
        (t.subtasks || [])
            .filter((s) => !s.is_completed && s.due_date) // only incomplete with due_date
            .map((s) => ({ ...s, parentTitle: t.title, parentTask: t }))
    );

    // Filter by due date: overdue or within next 3 days
    const today = startOfToday();
    const threeDaysLater = addDays(today, 3);

    const filteredList = flatList.filter((s) => {
        if (!s.due_date) return false;
        const dueDate = parse(s.due_date, 'yyyy-MM-dd', new Date());

        // Check if valid date
        if (isNaN(dueDate.getTime())) return false;

        // Overdue (before today)
        if (isBefore(dueDate, today)) return true;

        // Within next 3 days (including today)
        return isWithinInterval(dueDate, { start: today, end: threeDaysLater });
    });

    return (
        <div className="w-full h-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Today's Action Items</h3>
                {filteredList.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">All caught up! No pending subtasks.</p>
                ) : (
                    <ul className="space-y-3 overflow-y-auto flex-1">
                        {filteredList.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 dark:text-gray-200 block truncate" onClick={() => onTaskClick(s.parentTask)} style={{ cursor: 'pointer' }}>{s.title}</span>
                                        {s.due_date && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${new Date(s.due_date) < new Date()
                                                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                                                {new Date(s.due_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block truncate">Parent: {s.parentTitle}</span>
                                </div>
                                <button
                                    onClick={() => handleToggle(s)}
                                    className="flex-shrink-0 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-500 transition-colors text-sm font-medium"
                                >
                                    Done
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
