import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { isBefore, isToday, isTomorrow, parse, startOfToday } from 'date-fns';
import type { Task } from '../types';
import { cn } from '../lib/utils';

interface AttentionWidgetProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const AttentionWidget: React.FC<AttentionWidgetProps> = ({ tasks, onTaskClick }) => {
  const today = startOfToday();

  const urgentTasks = tasks
    .filter((task) => {
      if (task.status === 'done' || !task.due_date) return false;

      // Parse 'MMM d' - assuming current year.
      const dueDate = parse(task.due_date, 'MMM d', new Date());

      // Check if valid date
      if (isNaN(dueDate.getTime())) return false;

      // Overdue (before today) OR Due Soon (today/tomorrow)
      return isBefore(dueDate, today) || isToday(dueDate) || isTomorrow(dueDate);
    })
    .sort((a, b) => {
      const dateA = parse(a.due_date!, 'MMM d', new Date());
      const dateB = parse(b.due_date!, 'MMM d', new Date());
      return dateA.getTime() - dateB.getTime();
    });

  if (urgentTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-yellow-500" size={20} />
          <h3 className="font-bold text-gray-900 dark:text-white">Attention Needed</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-gray-600 dark:text-gray-300 font-medium">All caught up!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">No urgent tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2 border-b border-gray-100 dark:border-gray-700">
        <AlertTriangle className="text-yellow-500" size={20} />
        <h3 className="font-bold text-gray-900 dark:text-white">Attention Needed</h3>
        <span className="ml-auto bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
          {urgentTasks.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {urgentTasks.map(task => {
          const dueDate = parse(task.due_date!, 'MMM d', new Date());
          const isOverdue = isBefore(dueDate, today);

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all"
            >
              <div className={cn(
                "mt-1 w-2 h-2 rounded-full shrink-0",
                isOverdue ? "bg-red-500" : "bg-yellow-500"
              )} />
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium text-sm truncate",
                  isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                )}>
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {task.due_date}
                  </span>
                  <span className="truncate max-w-[100px]">{task.project}</span>
                </div>
              </div>
              <div className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium shrink-0",
                task.priority === 'high' ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                  task.priority === 'medium' ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" :
                    "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              )}>
                {task.priority}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
