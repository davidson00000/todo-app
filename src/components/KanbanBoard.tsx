import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Clock, MoreHorizontal, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { cn } from '../lib/utils';

interface KanbanBoardProps {
    tasks: Task[];
    onDragEnd: (result: DropResult) => void;
    onAddClick: () => void;
    onTaskClick: (task: Task) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onDragEnd, onAddClick, onTaskClick }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Board</h2>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    Add Task
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                    {columns.map((column) => {
                        const columnTasks = tasks.filter(task => task.status === column.id);

                        return (
                            <div key={column.id} className={cn("flex flex-col rounded-xl p-4 h-full", column.color)}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">{column.title}</h3>
                                        <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm">
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                                        >
                                            {columnTasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => onTaskClick(task)}
                                                            style={{ ...provided.draggableProps.style }}
                                                            className={cn(
                                                                "bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 group hover:shadow-md transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500",
                                                                snapshot.isDragging && "shadow-lg rotate-2 scale-105 z-50"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className={cn(
                                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                                    task.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                                            'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                                )}>
                                                                    {task.priority}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{task.title}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{task.project}</p>
                                                            <div className="flex items-center text-xs text-gray-400 gap-1">
                                                                <Clock size={12} />
                                                                <span>{task.due}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
};
