import React from 'react';
import { KPICard } from '../components/KPICard';
import { ProjectChart } from '../components/ProjectChart';
import { KanbanBoard } from '../components/KanbanBoard';
import { AddTaskModal } from '../components/AddTaskModal';
import { AddProjectModal } from '../components/AddProjectModal';
import { ManageProjectsModal } from '../components/ManageProjectsModal';
import { ProjectDetailsModal } from '../components/ProjectDetailsModal';
import { AttentionWidget } from '../components/AttentionWidget';
import { TodayActionWidget } from '../components/TodayActionWidget';
import { GanttView } from '../components/GanttView';
import { ListTodo, CheckCircle, Plus, Grid, LogOut } from 'lucide-react';
import type { Task, Project } from '../types';

interface DashboardProps {
    tasks: Task[];
    projects: Project[];
    completedCount: number;
    view: 'board' | 'gantt';
    setView: (view: 'board' | 'gantt') => void;
    chartData: any[];
    handleDragEnd: any;
    handleTaskClick: any;
    handleDeleteTask: any;
    handleSaveTask: any;
    handleSaveProject: any;
    handleProjectClick: any;
    handleEditProject: any;
    handleDeleteProject: any;
    handleSignOut: any;
    fetchTasks: () => void;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    isProjectModalOpen: boolean;
    setIsProjectModalOpen: (open: boolean) => void;
    isManageProjectsModalOpen: boolean;
    setIsManageProjectsModalOpen: (open: boolean) => void;
    isProjectDetailsModalOpen: boolean;
    setIsProjectDetailsModalOpen: (open: boolean) => void;
    editingTask: Task | null;
    editingProject: Project | null;
    setEditingProject: (project: Project | null) => void;
    selectedProject: Project | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
    tasks,
    projects,
    completedCount,
    view,
    setView,
    chartData,
    handleDragEnd,
    handleTaskClick,
    handleDeleteTask,
    handleSaveTask,
    handleSaveProject,
    handleProjectClick,
    handleEditProject,
    handleDeleteProject,
    handleSignOut,
    fetchTasks,
    isModalOpen,
    setIsModalOpen,
    isProjectModalOpen,
    setIsProjectModalOpen,
    isManageProjectsModalOpen,
    setIsManageProjectsModalOpen,
    isProjectDetailsModalOpen,
    setIsProjectDetailsModalOpen,
    editingTask,
    editingProject,
    setEditingProject,
    selectedProject,
}) => {
    return (
        <div className="h-full overflow-y-auto px-4 md:px-6 py-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
            {/* Header with New Project Button and Sign Out */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* 4-Tier Grid Layout */}
            <div className="grid grid-cols-12 gap-6 w-full">
                {/* Tier 1: KPI Cards (Overview) */}
                <div className="col-span-12 md:col-span-4">
                    <KPICard
                        title="Active Projects"
                        value={projects.length.toString()}
                        change="+2"
                        trend="up"
                        icon={Grid}
                        onIconClick={() => setIsManageProjectsModalOpen(true)}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <KPICard
                        title="Pending Tasks"
                        value={tasks.filter((t) => t.status !== 'done').length}
                        change={tasks.length > 5 ? '+2' : '-1'}
                        trend={tasks.length > 5 ? 'down' : 'up'}
                        icon={ListTodo}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <KPICard
                        title="Total Completed"
                        value={completedCount}
                        change="+12"
                        trend="up"
                        icon={CheckCircle}
                    />
                </div>

                {/* Tier 2: Action & Alerts (Priority) */}
                <div className="col-span-12 md:col-span-6 h-full">
                    <div className="h-full">
                        <TodayActionWidget tasks={tasks} onRefresh={fetchTasks} onTaskClick={handleTaskClick} />
                    </div>
                </div>
                <div className="col-span-12 md:col-span-6 h-full">
                    <div className="h-full">
                        <AttentionWidget tasks={tasks} onTaskClick={handleTaskClick} />
                    </div>
                </div>

                {/* Tier 3: Main Workspace (Timeline) - Full Width */}
                <div className="col-span-12 w-full min-w-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 w-full">
                        {/* View Toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {view === 'board' ? 'Task Board' : 'Gantt Chart'}
                            </h2>
                            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setView('board')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'board'
                                        ? 'bg-white dark:bg-gray-600 text-cyan-500 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Board
                                </button>
                                <button
                                    onClick={() => setView('gantt')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'gantt'
                                        ? 'bg-white dark:bg-gray-600 text-cyan-500 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Gantt
                                </button>
                            </div>
                        </div>

                        {/* Workspace Content with horizontal scroll for Gantt */}
                        <div className="w-full min-h-[500px]">
                            {view === 'board' ? (
                                <KanbanBoard
                                    tasks={tasks}
                                    onDragEnd={handleDragEnd}
                                    onAddClick={() => setIsModalOpen(true)}
                                    onTaskClick={handleTaskClick}
                                    onDeleteTask={handleDeleteTask}
                                />
                            ) : (
                                <div className="overflow-x-auto max-w-full">
                                    <GanttView tasks={tasks} onTaskClick={handleTaskClick} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tier 4: Analytics (Analysis) - Full Width */}
                <div className="col-span-12 w-full min-w-0">
                    <div className="h-[300px] w-full overflow-hidden">
                        <ProjectChart data={chartData} onBarClick={handleProjectClick} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchTasks();
                }}
                onSave={handleSaveTask}
                initialTask={editingTask}
                projects={projects}
                onRefresh={fetchTasks}
            />

            <AddProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => {
                    setIsProjectModalOpen(false);
                    setEditingProject(null);
                }}
                onSave={handleSaveProject}
                initialProject={editingProject}
            />

            <ProjectDetailsModal
                isOpen={isProjectDetailsModalOpen}
                onClose={() => setIsProjectDetailsModalOpen(false)}
                project={selectedProject}
                onEdit={handleEditProject}
            />

            <ManageProjectsModal
                isOpen={isManageProjectsModalOpen}
                onClose={() => setIsManageProjectsModalOpen(false)}
                projects={projects}
                onDeleteProject={handleDeleteProject}
            />
        </div>
    );
};
